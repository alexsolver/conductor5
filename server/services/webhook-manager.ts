// ========================================
// WEBHOOK MANAGER SERVICE
// ========================================
// Manages webhooks for external integrations and custom actions

import fetch from 'node-fetch';

// ========================================
// TYPES
// ========================================

export interface WebhookConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'basic' | 'api_key';
    token?: string;
    username?: string;
    password?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
  };
  retryAttempts?: number;
  timeout?: number;
}

export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  data?: any;
  error?: string;
  duration?: number;
}

// ========================================
// WEBHOOK MANAGER CLASS
// ========================================

export class WebhookManager {
  
  /**
   * Execute webhook with payload
   */
  async execute(
    config: WebhookConfig,
    payload: any
  ): Promise<WebhookResponse> {
    const startTime = Date.now();

    try {
      console.log('[WEBHOOK] Executing webhook:', {
        url: config.url,
        method: config.method || 'POST'
      });

      const headers = this.buildHeaders(config);
      const method = config.method || 'POST';
      const timeout = config.timeout || 30000; // 30 seconds default

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(config.url, {
          method,
          headers,
          body: method !== 'GET' ? JSON.stringify(payload) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        
        // Try to parse response as JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        console.log('[WEBHOOK] Response received:', {
          status: response.status,
          duration: `${duration}ms`
        });

        return {
          success: response.ok,
          statusCode: response.status,
          data,
          duration
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error(`Webhook timeout after ${timeout}ms`);
        }
        throw fetchError;
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('[WEBHOOK] Execution error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        duration
      };
    }
  }

  /**
   * Execute webhook with retry logic
   */
  async executeWithRetry(
    config: WebhookConfig,
    payload: any
  ): Promise<WebhookResponse> {
    const maxAttempts = config.retryAttempts || 3;
    let lastError: WebhookResponse | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[WEBHOOK] Attempt ${attempt}/${maxAttempts}`);

      const result = await this.execute(config, payload);

      if (result.success) {
        return result;
      }

      lastError = result;

      // Don't retry on client errors (4xx)
      if (result.statusCode && result.statusCode >= 400 && result.statusCode < 500) {
        console.log('[WEBHOOK] Client error detected, stopping retries');
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxAttempts) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[WEBHOOK] Waiting ${delayMs}ms before retry...`);
        await this.delay(delayMs);
      }
    }

    return lastError || {
      success: false,
      error: 'All retry attempts failed'
    };
  }

  /**
   * Test webhook connectivity
   */
  async test(config: WebhookConfig): Promise<WebhookResponse> {
    return await this.execute(config, {
      test: true,
      message: 'This is a test webhook from AI Agent System',
      timestamp: new Date().toISOString()
    });
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Build headers for webhook request
   */
  private buildHeaders(config: WebhookConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Agent-System/1.0',
      ...config.headers
    };

    // Add authentication headers
    if (config.authentication) {
      const auth = config.authentication;

      switch (auth.type) {
        case 'bearer':
          if (auth.token) {
            headers['Authorization'] = `Bearer ${auth.token}`;
          }
          break;

        case 'basic':
          if (auth.username && auth.password) {
            const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;

        case 'api_key':
          if (auth.apiKeyHeader && auth.apiKeyValue) {
            headers[auth.apiKeyHeader] = auth.apiKeyValue;
          }
          break;
      }
    }

    return headers;
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build webhook payload for action execution
   */
  buildActionPayload(
    actionType: string,
    params: Record<string, any>,
    context: {
      tenantId: string;
      agentId: string;
      conversationId: string;
      userId: string;
    }
  ): any {
    return {
      event: 'action.execute',
      timestamp: new Date().toISOString(),
      action: {
        type: actionType,
        params
      },
      context: {
        tenant_id: context.tenantId,
        agent_id: context.agentId,
        conversation_id: context.conversationId,
        user_id: context.userId
      }
    };
  }
}

// Export singleton instance
export const webhookManager = new WebhookManager();
