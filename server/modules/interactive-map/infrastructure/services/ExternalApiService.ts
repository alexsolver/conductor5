
// ===========================================================================================
// EXTERNAL API SERVICE - Weather and Traffic Data Integration
// Following 1qa.md Clean Architecture patterns
// ===========================================================================================

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
  lastUpdated: Date;
  isSimulated?: boolean;
}

export interface TrafficData {
  congestionLevel: 'low' | 'medium' | 'high' | 'severe';
  averageSpeed: number;
  incidents: TrafficIncident[];
  lastUpdated: Date;
}

export interface TrafficIncident {
  id: string;
  type: 'accident' | 'construction' | 'roadwork' | 'event';
  severity: 'minor' | 'major' | 'severe';
  description: string;
  location: { lat: number; lng: number };
  estimatedClearTime?: Date;
}

export interface MapLayerData {
  weather: WeatherData | null;
  traffic: TrafficData | null;
  airQuality?: {
    aqi: number;
    level: string;
    pollutants: Record<string, number>;
  };
}

// ✅ Following 1qa.md - Infrastructure Layer Implementation
export class ExternalApiService {
  private static cache = new Map<string, { data: any; expires: number }>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // ✅ 1qa.md Compliance - Direct database access for configuration
  private static async getOpenWeatherApiKey(): Promise<string | null> {
    try {
      const { schemaManager } = await import('../../../../db');
      const pool = await schemaManager.getPool();
      
      const result = await pool.query(`
        SELECT config FROM "public"."system_integrations" 
        WHERE integration_id = 'openweather' AND config ? 'apiKey'
      `);

      if (result.rows[0]?.config?.apiKey) {
        console.log('🌤️ [WEATHER-API] OpenWeather API key found in SaaS Admin');
        return result.rows[0].config.apiKey;
      }

      console.log('⚠️ [WEATHER-API] No OpenWeather API key configured in SaaS Admin');
      return null;
    } catch (error) {
      console.error('❌ [WEATHER-API] Error fetching OpenWeather API key:', error);
      return null;
    }
  }

  // ✅ Real OpenWeather API integration
  static async getWeatherData(lat: number, lng: number, type: 'current' | 'forecast' = 'current'): Promise<WeatherData> {
    try {
      const apiKey = await this.getOpenWeatherApiKey();
      
      if (!apiKey) {
        console.log(`🌤️ [WEATHER-API] Using fallback simulated data - API key not available or API failed`);
        return this.getFallbackWeatherData(lat, lng, type);
      }

      const cacheKey = `weather_${type}_${lat}_${lng}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        console.log(`🌤️ [WEATHER-API] Using cached ${type} weather data`);
        return cached.data;
      }

      // Choose API endpoint based on type
      const apiUrl = type === 'forecast' 
        ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=5`
        : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

      console.log(`🌤️ [WEATHER-API] Fetching real ${type} weather data for lat:${lat}, lng:${lng} with API key: ${apiKey.substring(0, 10)}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Conductor-Interactive-Map/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`❌ [WEATHER-API] OpenWeather API error: ${response.status} - ${response.statusText}`);
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`❌ [WEATHER-API] Error details: ${errorText}`);
          console.log(`⚠️ [WEATHER-API] Using fallback simulated data - API key not available or API failed`);
          return this.getFallbackWeatherData(lat, lng, type);
        }

        const data = await response.json();
        console.log(`🌤️ [WEATHER-API] Raw OpenWeather ${type} response:`, JSON.stringify(data, null, 2));
        
        let weatherData: WeatherData;

        if (type === 'forecast' && data.list && data.list.length > 0) {
          // Use the first forecast entry (next 3 hours)
          const forecastEntry = data.list[0];
          weatherData = {
            temperature: Math.round(forecastEntry.main.temp),
            condition: `Previsão: ${forecastEntry.weather[0].description}`,
            humidity: forecastEntry.main.humidity,
            windSpeed: Math.round(forecastEntry.wind?.speed * 3.6 || 0), // Convert m/s to km/h
            visibility: Math.round((forecastEntry.visibility || 10000) / 1000), // Convert to km
            icon: forecastEntry.weather[0].icon,
            lastUpdated: new Date(),
            isSimulated: false
          };
        } else {
          // Current weather
          weatherData = {
            temperature: Math.round(data.main.temp),
            condition: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
            visibility: Math.round((data.visibility || 10000) / 1000), // Convert to km
            icon: data.weather[0].icon,
            lastUpdated: new Date(),
            isSimulated: false
          };
        }

        // Cache for 10 minutes
        this.cache.set(cacheKey, {
          data: weatherData,
          expires: Date.now() + (10 * 60 * 1000)
        });

        console.log(`✅ [WEATHER-API] Real ${type} weather data fetched successfully:`, weatherData);
        return weatherData;

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('❌ [WEATHER-API] Request timeout');
        } else {
          console.error('❌ [WEATHER-API] Network error:', fetchError.message);
        }
        
        return this.getFallbackWeatherData(lat, lng);
      }

    } catch (error) {
      console.error('❌ [WEATHER-API] Error getting weather data:', error);
      return this.getFallbackWeatherData(lat, lng);
    }
  }

  // ✅ Fallback data when API is unavailable
  private static getFallbackWeatherData(lat: number, lng: number, type: 'current' | 'forecast' = 'current'): WeatherData {
    console.log(`⚠️ [WEATHER-API] Using fallback simulated data for ${type} - API key not available or API failed`);
    // Generate realistic fallback data based on location
    const temp = 20 + Math.random() * 10; // 20-30°C range
    const condition = type === 'forecast' ? 'Previsão simulada' : 'Dados simulados';
    
    return {
      temperature: Math.round(temp),
      condition: condition,
      humidity: 60 + Math.floor(Math.random() * 30), // 60-90%
      windSpeed: Math.floor(Math.random() * 15), // 0-15 km/h
      visibility: 10, // 10km default
      icon: '01d', // Default clear sky icon
      lastUpdated: new Date(),
      isSimulated: true
    };
  }

  // ✅ Traffic data (mock for now - can be extended)
  static async getTrafficData(lat: number, lng: number): Promise<TrafficData> {
    const congestionLevels: ('low' | 'medium' | 'high' | 'severe')[] = ['low', 'medium', 'high', 'severe'];
    const congestionLevel = congestionLevels[Math.floor(Math.random() * congestionLevels.length)];
    
    // Simulate some incidents
    const incidents: TrafficIncident[] = [];
    if (Math.random() > 0.7) { // 30% chance of incidents
      incidents.push({
        id: `incident_${Date.now()}`,
        type: Math.random() > 0.5 ? 'accident' : 'construction',
        severity: Math.random() > 0.7 ? 'major' : 'minor',
        description: Math.random() > 0.5 ? 'Acidente na via' : 'Obras na pista',
        location: {
          lat: lat + (Math.random() - 0.5) * 0.1,
          lng: lng + (Math.random() - 0.5) * 0.1
        },
        estimatedClearTime: new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000) // Random 0-2 hours
      });
    }

    const baseSpeed = 50;
    const speedReduction = congestionLevel === 'severe' ? 0.3 : 
                          congestionLevel === 'high' ? 0.5 :
                          congestionLevel === 'medium' ? 0.7 : 0.9;

    return {
      congestionLevel,
      averageSpeed: Math.round(baseSpeed * speedReduction),
      incidents,
      lastUpdated: new Date()
    };
  }

  // ✅ Combined data for map layers
  static async getMapLayerData(centerLat: number, centerLng: number, bounds: any): Promise<MapLayerData> {
    try {
      const [weather, traffic] = await Promise.all([
        this.getWeatherData(centerLat, centerLng),
        this.getTrafficData(centerLat, centerLng)
      ]);

      return {
        weather,
        traffic,
        airQuality: {
          aqi: 50,
          level: 'Good',
          pollutants: { pm25: 12, pm10: 18, o3: 95 }
        }
      };
    } catch (error) {
      console.error('❌ [WEATHER-API] Error getting map layer data:', error);
      return {
        weather: this.getFallbackWeatherData(centerLat, centerLng),
        traffic: await this.getTrafficData(centerLat, centerLng)
      };
    }
  }

  // ✅ Air Quality Integration (Bonus)
  static async getAirQualityData(lat: number, lng: number) {
    try {
      // Using AirVisual API or similar (requires API key)
      const apiKey = process.env.AIRVISUAL_API_KEY;
      if (!apiKey) {
        return {
          aqi: 50 + Math.floor(Math.random() * 100), // Mock AQI 50-150
          level: 'Moderate',
          pollutants: {
            'PM2.5': 15 + Math.floor(Math.random() * 20),
            'PM10': 25 + Math.floor(Math.random() * 30),
            'O3': 80 + Math.floor(Math.random() * 40),
            'NO2': 30 + Math.floor(Math.random() * 25)
          }
        };
      }

      const response = await fetch(
        `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lng}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Air Quality API error: ${response.status}`);
      }

      const data = await response.json();
      const pollution = data.data.current.pollution;

      return {
        aqi: pollution.aqius,
        level: this.getAqiLevel(pollution.aqius),
        pollutants: {
          'PM2.5': pollution.p2?.conc || 0,
          'PM10': pollution.p1?.conc || 0,
          'O3': pollution.o3?.conc || 0,
          'NO2': pollution.n2?.conc || 0
        }
      };

    } catch (error) {
      console.error('[EXTERNAL-API] Air quality data fetch failed:', error);
      return null;
    }
  }

  private static getAqiLevel(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  // ✅ Cached data getter
  static async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheMinutes: number = 10
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      expires: Date.now() + (cacheMinutes * 60 * 1000)
    });

    return data;
  }

  // ✅ Cache cleanup
  static startCacheCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (value.expires <= now) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  // ✅ Cleanup on shutdown
  static stopCacheCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
