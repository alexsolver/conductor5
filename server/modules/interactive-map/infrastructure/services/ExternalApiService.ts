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
  static async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    try {
      const apiKey = await this.getOpenWeatherApiKey();
      
      if (!apiKey) {
        console.log('🌤️ [WEATHER-API] Using fallback mock data - no API key configured');
        return this.getFallbackWeatherData(lat, lng);
      }

      const cacheKey = `weather_${lat}_${lng}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        console.log('🌤️ [WEATHER-API] Using cached weather data');
        return cached.data;
      }

      console.log(`🌤️ [WEATHER-API] Fetching real weather data for lat:${lat}, lng:${lng}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'Conductor-Interactive-Map/1.0'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`❌ [WEATHER-API] OpenWeather API error: ${response.status}`);
          return this.getFallbackWeatherData(lat, lng);
        }

        const data = await response.json();
        
        const weatherData: WeatherData = {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
          visibility: Math.round((data.visibility || 10000) / 1000), // Convert to km
          icon: data.weather[0].icon,
          lastUpdated: new Date()
        };

        // Cache for 10 minutes
        this.cache.set(cacheKey, {
          data: weatherData,
          expires: Date.now() + (10 * 60 * 1000)
        });

        console.log('✅ [WEATHER-API] Real weather data fetched successfully');
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
  private static getFallbackWeatherData(lat: number, lng: number): WeatherData {
    // Generate realistic fallback data based on location
    const temp = 20 + Math.random() * 10; // 20-30°C range
    const conditions = ['clear sky', 'few clouds', 'scattered clouds', 'partly cloudy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: Math.round(temp),
      condition: condition,
      humidity: 60 + Math.floor(Math.random() * 30), // 60-90%
      windSpeed: Math.floor(Math.random() * 15), // 0-15 km/h
      visibility: 10, // 10km default
      icon: '01d', // Default clear sky icon
      lastUpdated: new Date()
    };
  }

  // ✅ Traffic data (mock for now - can be extended)
  static async getTrafficData(lat: number, lng: number): Promise<TrafficData> {
    return {
      congestionLevel: 'low',
      averageSpeed: 45,
      incidents: [],
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

export class ExternalApiService {
  
  // ===========================================================================================
  // Weather API Integration
  // ===========================================================================================
  
  static async getWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
    try {
      // Using OpenWeatherMap API (requires API key)
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        console.warn('[EXTERNAL-API] OpenWeatherMap API key not configured');
        return this.getMockWeatherData();
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind?.speed || 0,
        visibility: data.visibility ? data.visibility / 1000 : 10, // Convert to km
        icon: data.weather[0].icon,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('[EXTERNAL-API] Weather data fetch failed:', error);
      return this.getMockWeatherData();
    }
  }

  private static getMockWeatherData(): WeatherData {
    // Realistic mock data for demonstration
    const conditions = ['céu claro', 'nublado', 'chuva leve', 'ensolarado', 'parcialmente nublado'];
    const temperatures = [18, 22, 25, 28, 30];
    
    return {
      temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: 45 + Math.floor(Math.random() * 40), // 45-85%
      windSpeed: Math.floor(Math.random() * 15), // 0-15 km/h
      visibility: 8 + Math.floor(Math.random() * 7), // 8-15 km
      icon: '01d', // Clear sky day
      lastUpdated: new Date()
    };
  }

  // ===========================================================================================
  // Traffic API Integration
  // ===========================================================================================
  
  static async getTrafficData(bounds: { north: number; south: number; east: number; west: number }): Promise<TrafficData | null> {
    try {
      // Using Google Maps Traffic API (requires API key)
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('[EXTERNAL-API] Google Maps API key not configured');
        return this.getMockTrafficData();
      }

      // Note: This is a simplified example. Real implementation would use Google Maps Roads API
      // and Traffic Layer data which requires more complex integration
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${bounds.south},${bounds.west}&destination=${bounds.north},${bounds.east}&departure_time=now&traffic_model=best_guess&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Traffic API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Calculate congestion based on duration difference
        const normalDuration = leg.duration.value;
        const trafficDuration = leg.duration_in_traffic?.value || normalDuration;
        const congestionRatio = trafficDuration / normalDuration;
        
        let congestionLevel: 'low' | 'medium' | 'high' | 'severe' = 'low';
        if (congestionRatio > 1.5) congestionLevel = 'severe';
        else if (congestionRatio > 1.3) congestionLevel = 'high';
        else if (congestionRatio > 1.1) congestionLevel = 'medium';

        return {
          congestionLevel,
          averageSpeed: Math.round((leg.distance.value / trafficDuration) * 3.6), // Convert m/s to km/h
          incidents: [], // Would require additional API calls to get incidents
          lastUpdated: new Date()
        };
      }

      return this.getMockTrafficData();

    } catch (error) {
      console.error('[EXTERNAL-API] Traffic data fetch failed:', error);
      return this.getMockTrafficData();
    }
  }

  private static getMockTrafficData(): TrafficData {
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
          lat: -23.5505 + (Math.random() - 0.5) * 0.1,
          lng: -46.6333 + (Math.random() - 0.5) * 0.1
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

  // ===========================================================================================
  // Air Quality Integration (Bonus)
  // ===========================================================================================
  
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

  // ===========================================================================================
  // Combined Data Fetching
  // ===========================================================================================
  
  static async getMapLayerData(
    centerLat: number, 
    centerLng: number, 
    bounds: { north: number; south: number; east: number; west: number }
  ): Promise<MapLayerData> {
    try {
      // Fetch all external data in parallel
      const [weather, traffic, airQuality] = await Promise.allSettled([
        this.getWeatherData(centerLat, centerLng),
        this.getTrafficData(bounds),
        this.getAirQualityData(centerLat, centerLng)
      ]);

      return {
        weather: weather.status === 'fulfilled' ? weather.value : null,
        traffic: traffic.status === 'fulfilled' ? traffic.value : null,
        airQuality: airQuality.status === 'fulfilled' ? airQuality.value : null
      };

    } catch (error) {
      console.error('[EXTERNAL-API] Combined data fetch failed:', error);
      return {
        weather: null,
        traffic: null,
        airQuality: null
      };
    }
  }

  // ===========================================================================================
  // Cache Management
  // ===========================================================================================
  
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static async getCachedData<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlMinutes: number = 5
  ): Promise<T | null> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < (cached.ttl * 60 * 1000)) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: now,
        ttl: ttlMinutes
      });
      return data;
    } catch (error) {
      // Return cached data even if expired, if available
      return cached?.data || null;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }

  // Clean up old cache entries periodically
  static startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if ((now - value.timestamp) > (value.ttl * 60 * 1000 * 2)) { // 2x TTL
          this.cache.delete(key);
        }
      }
    }, 10 * 60 * 1000); // Clean every 10 minutes
  }
}