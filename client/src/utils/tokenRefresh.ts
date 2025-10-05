// Enhanced Token Refresh Utility for HttpOnly Cookies
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

    // ✅ HttpOnly cookies: Browser handles token storage automatically
    // We can't read the token from JavaScript, so we rely on server-side expiry headers
    // or scheduled refresh (every 45 minutes as a safe default)
    console.log('⏰ [TOKEN-REFRESH] Setting up auto-refresh for HttpOnly cookies');

    // Refresh every 45 minutes to keep session alive
    TokenRefresh.refreshTimeout = setTimeout(() => {
      TokenRefresh.performRefresh();
    }, 45 * 60 * 1000); // 45 minutes
  }

  static async performRefresh(): Promise<boolean> {
    if (TokenRefresh.isRefreshing) {
      console.log('Token refresh already in progress');
      return false;
    }

    TokenRefresh.isRefreshing = true;
    
    try {
      // ✅ HttpOnly cookies: No need to send anything in body, cookies are sent automatically
      console.log('🔄 [TOKEN-REFRESH] Attempting refresh using HttpOnly cookies');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // This ensures HttpOnly cookies are sent automatically
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ [TOKEN-REFRESH] Token refreshed successfully via HttpOnly cookies');
        
        // Setup next auto-refresh
        TokenRefresh.setupAutoRefresh();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.warn('🔄 [TOKEN-REFRESH] Failed:', {
          status: response.status,
          message: errorData.message || 'Unknown error',
          error: errorData.error
        });
        
        // If refresh failed with 401, session expired - redirect to login
        if (response.status === 401) {
          console.log('🔄 [TOKEN-REFRESH] Session expired, redirecting to login');
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('/auth') && !window.location.pathname.includes('/login')) {
            window.location.href = '/auth';
          }
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

    // Check activity every 2 minutes
    TokenRefresh.activityInterval = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceActivity = currentTime - TokenRefresh.lastActivity;

      // ✅ HttpOnly cookies: If user was active in the last 10 minutes, refresh token preemptively
      // This keeps the session alive while the user is actively using the app
      if (timeSinceActivity < (10 * 60 * 1000)) {
        console.log('🔄 [TOKEN-REFRESH] User is active, refreshing token preemptively');
        TokenRefresh.performRefresh();
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
  }
}

// Enhanced fetch wrapper with automatic token refresh (HttpOnly cookies)
export const apiRequestWithRefresh = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // ✅ HttpOnly cookies: No need to manually add Authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  let response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include HttpOnly cookies
    headers
  });

  // If 401, try refreshing token
  if (response.status === 401) {
    console.log('🔄 [API-REQUEST] 401 detected, attempting token refresh');
    const refreshed = await TokenRefresh.performRefresh();
    
    if (refreshed) {
      // Retry request - new cookies are set automatically by the server
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers
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