
// Automatic Token Refresh Utility for HTTP-only Cookies
export class AutoTokenRefresh {
  private static instance: AutoTokenRefresh;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshInterval = 20 * 60 * 1000; // Check every 20 minutes

  private constructor() {
    this.startAutoRefresh();
  }

  static getInstance(): AutoTokenRefresh {
    if (!AutoTokenRefresh.instance) {
      AutoTokenRefresh.instance = new AutoTokenRefresh();
    }
    return AutoTokenRefresh.instance;
  }

  private startAutoRefresh(): void {
    // Clear existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Set up periodic refresh check
    this.refreshTimeout = setTimeout(() => {
      this.checkAndRefreshToken();
      this.startAutoRefresh(); // Schedule next check
    }, this.refreshInterval);

    console.log('🔄 [AUTO-REFRESH] Auto token refresh started');
  }

  private async checkAndRefreshToken(): Promise<void> {
    if (this.isRefreshing) {
      console.log('🔄 [AUTO-REFRESH] Refresh already in progress');
      return;
    }

    try {
      this.isRefreshing = true;
      console.log('🔍 [AUTO-REFRESH] Checking token status...');

      // Make a request to refresh endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AUTO-REFRESH] Token refreshed successfully:', data.message);
        
        // Dispatch custom event to notify components
        window.dispatchEvent(new CustomEvent('tokenRefreshed', { 
          detail: { 
            user: data.user,
            timestamp: data.timestamp
          } 
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          console.log('🔒 [AUTO-REFRESH] Refresh token expired or invalid - user needs to login');
          
          // Dispatch logout event
          window.dispatchEvent(new CustomEvent('authExpired', {
            detail: { reason: 'refresh_token_expired' }
          }));
          
          this.stop();
        } else {
          console.warn('⚠️ [AUTO-REFRESH] Refresh failed:', response.status, errorData.message);
        }
      }
    } catch (error) {
      console.error('❌ [AUTO-REFRESH] Token refresh error:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  public stop(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    console.log('🛑 [AUTO-REFRESH] Auto token refresh stopped');
  }

  public forceRefresh(): Promise<void> {
    return this.checkAndRefreshToken();
  }

  public isActive(): boolean {
    return this.refreshTimeout !== null;
  }
}

// Initialize auto refresh when module loads
const autoRefresh = AutoTokenRefresh.getInstance();

// Export for manual control if needed
export default autoRefresh;
