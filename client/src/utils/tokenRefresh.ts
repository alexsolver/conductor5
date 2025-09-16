// Enhanced Token Refresh Utility
export class TokenRefresh {
  private static refreshTimeout: NodeJS.Timeout | null = null;
  private static activityInterval: NodeJS.Timeout | null = null;
  private static isRefreshing = false;
  private static lastActivity = Date.now();

  static setupAutoRefresh() {
    // Clear existing timeouts
    if (TokenRefresh.refreshTimeout) {
      clearTimeout(TokenRefresh.refreshTimeout);
    }
    if (TokenRefresh.activityInterval) {
      clearInterval(TokenRefresh.activityInterval);
    }

    // Setup activity monitoring
    TokenRefresh.setupActivityMonitoring();

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // Parse token payload to check expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Refresh 10 minutes before expiry, or immediately if less than 10 minutes remain
      const refreshTime = Math.max(timeUntilExpiry - (10 * 60 * 1000), 1000);

      console.log(`⏰ [TOKEN-REFRESH] Token expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes, refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);

      TokenRefresh.refreshTimeout = setTimeout(() => {
        TokenRefresh.performRefresh();
      }, refreshTime);
    } catch (error) {
      console.warn('Failed to setup token auto-refresh:', error);
    }
  }

  static async performRefresh(): Promise<boolean> {
    if (TokenRefresh.isRefreshing) {
      console.log('Token refresh already in progress');
      return false;
    }

    TokenRefresh.isRefreshing = true;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        console.log('Token refreshed successfully');
        
        // Setup next auto-refresh
        TokenRefresh.setupAutoRefresh();
        return true;
      } else {
        console.warn('Token refresh failed:', response.status);
        // Don't force redirect following 1qa.md - let components handle auth state
        if (response.status === 401) {
          console.log('Token refresh failed - components will handle auth state');
        }
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      TokenRefresh.isRefreshing = false;
    }
  }

  static handleApiError(response: Response): boolean {
    if (response.status === 401) {
      console.log('🔄 [TOKEN-REFRESH] 401 error detected, attempting token refresh');
      TokenRefresh.performRefresh();
      return true;
    }
    return false;
  }

  static setupActivityMonitoring() {
    // Monitor user activity
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      TokenRefresh.lastActivity = Date.now();
    };

    activities.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check token status every 5 minutes
    TokenRefresh.activityInterval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const timeSinceActivity = currentTime - TokenRefresh.lastActivity;

        // If user was active in the last 15 minutes and token expires in less than 15 minutes
        if (timeSinceActivity < (15 * 60 * 1000) && timeUntilExpiry < (15 * 60 * 1000)) {
          console.log('🔄 [TOKEN-REFRESH] User is active, refreshing token preemptively');
          TokenRefresh.performRefresh();
        }
      } catch (error) {
        console.warn('⚠️ [TOKEN-REFRESH] Error checking token in activity monitor:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

// Enhanced fetch wrapper with automatic token refresh
export const apiRequestWithRefresh = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  let response = await fetch(url, {
    ...options,
    headers
  });

  // If 401 and we have a token, try refreshing
  if (response.status === 401 && token) {
    const refreshed = await TokenRefresh.performRefresh();
    
    if (refreshed) {
      // Retry request with new token
      const newToken = localStorage.getItem('accessToken');
      response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`
        }
      });
    }
  }

  return response;
};

// Initialize auto-refresh on app load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    TokenRefresh.setupAutoRefresh();
  });
  
  // Also setup immediately if DOM is already ready
  if (document.readyState === 'complete') {
    TokenRefresh.setupAutoRefresh();
  }
}