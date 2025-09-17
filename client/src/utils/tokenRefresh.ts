// Enhanced Token Refresh Utility
class TokenRefresh {
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

      // Refresh 30 minutes before expiry, or immediately if less than 30 minutes remain
      const refreshTime = Math.max(timeUntilExpiry - (30 * 60 * 1000), 1000);

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
      // Try to get refresh token from localStorage as fallback
      const refreshToken = localStorage.getItem('refreshToken');
      
      console.log('🔄 [TOKEN-REFRESH] Attempting refresh with token:', refreshToken ? 'present' : 'missing');
      
      // Always include the refresh token in the request body if we have it
      const requestBody = refreshToken ? { refreshToken } : {};
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // This ensures cookies are sent
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.tokens) {
          // Handle the standardized response format
          localStorage.setItem('accessToken', data.data.tokens.accessToken);
          if (data.data.tokens.refreshToken) {
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          }
        } else if (data.accessToken) {
          // Handle legacy response format
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
        }
        console.log('✅ [TOKEN-REFRESH] Token refreshed successfully');
        
        // Setup next auto-refresh
        TokenRefresh.setupAutoRefresh();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.warn('🔄 [TOKEN-REFRESH] Failed:', {
          status: response.status,
          message: errorData.message || 'Unknown error'
        });
        
        // Clear tokens if refresh failed due to invalid token
        if (response.status === 401) {
          console.log('🔄 [TOKEN-REFRESH] Clearing invalid tokens');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
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

    // Check token status every 2 minutes
    TokenRefresh.activityInterval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const timeSinceActivity = currentTime - TokenRefresh.lastActivity;

        // If user was active in the last 10 minutes and token expires in less than 45 minutes
        if (timeSinceActivity < (10 * 60 * 1000) && timeUntilExpiry < (45 * 60 * 1000)) {
          console.log('🔄 [TOKEN-REFRESH] User is active, refreshing token preemptively');
          TokenRefresh.performRefresh();
        }
      } catch (error) {
        console.warn('⚠️ [TOKEN-REFRESH] Error checking token in activity monitor:', error);
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
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
    credentials: 'include', // Always include credentials for cookies
    headers
  });

  // If 401, try refreshing regardless of whether we have a local token
  if (response.status === 401) {
    console.log('🔄 [API-REQUEST] 401 detected, attempting token refresh');
    const refreshed = await TokenRefresh.performRefresh();
    
    if (refreshed) {
      // Retry request with new token
      const newToken = localStorage.getItem('accessToken');
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...headers,
          ...(newToken && { Authorization: `Bearer ${newToken}` })
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