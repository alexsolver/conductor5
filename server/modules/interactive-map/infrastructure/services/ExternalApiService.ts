// ===========================================================================================
// EXTERNAL API SERVICE - Weather and Traffic Data Integration
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