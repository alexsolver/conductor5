// ===========================================================================================
// OPENWEATHER HEALTH CHECKER - SaaS Admin Infrastructure Layer
// ===========================================================================================
// Seguindo rigorosamente o padrão Clean Architecture especificado em 1qa.md
// Infrastructure Layer → Implementação concreta da interface de Domain

import { IIntegrationHealthChecker, HealthResult } from '../../domain/repositories/IIntegrationHealthChecker';

export class OpenWeatherHealthChecker implements IIntegrationHealthChecker {
  
  getSupportedProviders(): string[] {
    return ['openweather'];
  }

  canCheck(integrationId: string): boolean {
    return this.getSupportedProviders().includes(integrationId.toLowerCase());
  }

  async checkHealth(integrationId: string, config: any): Promise<HealthResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[OPENWEATHER-HEALTH-CHECKER] Starting health check for ${integrationId}`);

      if (!this.canCheck(integrationId)) {
        return {
          status: 'disconnected',
          message: `Health checker does not support integration '${integrationId}'`,
          lastTested: new Date(),
          dataSource: 'unknown'
        };
      }

      // Check if API key exists
      if (!config?.apiKey) {
        console.log(`[OPENWEATHER-HEALTH-CHECKER] No API key configured for ${integrationId}`);
        return {
          status: 'disconnected',
          message: 'No API key configured',
          lastTested: new Date(),
          dataSource: 'unknown'
        };
      }

      const apiKey = config.apiKey;
      console.log(`[OPENWEATHER-HEALTH-CHECKER] Testing API key: ${apiKey.length} chars`);

      // Make a minimal test request to OpenWeather API
      const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=0&lon=0&appid=${apiKey}&units=metric`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Conductor-SaaS-Health-Checker/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        console.log(`[OPENWEATHER-HEALTH-CHECKER] API response: ${response.status} ${response.statusText} (${responseTime}ms)`);

        if (response.ok) {
          // API key is valid and working
          const data = await response.json().catch(() => ({}));
          
          console.log(`[OPENWEATHER-HEALTH-CHECKER] ✅ Health check passed for ${integrationId}`);
          
          return {
            status: 'connected',
            message: `API connection successful (${responseTime}ms)`,
            lastTested: new Date(),
            dataSource: 'real'
          };
        } else {
          // API returned an error
          const errorText = await response.text().catch(() => 'Unknown error');
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          console.error(`[OPENWEATHER-HEALTH-CHECKER] ❌ API error ${response.status}: ${errorText}`);

          // Specific handling for common OpenWeather API errors
          let message = `API error: ${response.status} ${response.statusText}`;
          if (response.status === 401) {
            message = 'Invalid API key';
          } else if (response.status === 403) {
            message = 'API key access forbidden';
          } else if (response.status === 429) {
            message = 'API rate limit exceeded';
          } else if (errorData?.message) {
            message = `API error: ${errorData.message}`;
          }

          return {
            status: 'error',
            message: message,
            lastTested: new Date(),
            dataSource: 'simulated'
          };
        }

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        let message = 'Network error';
        if (fetchError.name === 'AbortError') {
          message = 'Request timeout';
          console.error(`[OPENWEATHER-HEALTH-CHECKER] ⏰ Request timeout for ${integrationId}`);
        } else if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          message = 'Network connection failed';
          console.error(`[OPENWEATHER-HEALTH-CHECKER] 🌐 Network error for ${integrationId}:`, fetchError.message);
        } else {
          console.error(`[OPENWEATHER-HEALTH-CHECKER] 💥 Fetch error for ${integrationId}:`, fetchError);
          message = `Request failed: ${fetchError.message}`;
        }

        return {
          status: 'error',
          message: message,
          lastTested: new Date(),
          dataSource: 'simulated'
        };
      }

    } catch (error) {
      console.error(`[OPENWEATHER-HEALTH-CHECKER] 🚨 Unexpected error for ${integrationId}:`, error);
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error during health check',
        lastTested: new Date(),
        dataSource: 'unknown'
      };
    }
  }
}