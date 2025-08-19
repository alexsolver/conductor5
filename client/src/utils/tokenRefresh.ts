// Enhanced Token Refresh Utility
export class TokenRefresh {
  private static refreshTimeout: NodeJS.Timeout | null = null;
  private static isRefreshing = false;

  static setupAutoRefresh() {
    // Clear existing timeout
    if (TokenRefresh.refreshTimeout) {
      clearTimeout(TokenRefresh.refreshTimeout);
    }

    // Access token is now managed via HTTP-only cookies, so we don't retrieve it from localStorage here.
    // The refresh logic will rely on the server to issue a new access token via HTTP-only cookie.
    // We still need a mechanism to trigger the refresh if the access token expires.
    // A common approach is to estimate expiry based on when the refresh token was issued or a fixed interval.
    // For this example, we'll assume a periodic check or rely on API errors to trigger refresh.
    // A more robust solution might involve reading the access token from a cookie if available, but this
    // example focuses on the server-driven refresh via HTTP-only cookies.

    // In this new HTTP-only cookie model, the client doesn't directly manage the access token's expiry.
    // The server handles access token issuance and refresh. Client-side logic should focus on
    // handling API errors (like 401) that indicate an expired or invalid access token,
    // and then trigger a refresh.
    console.log('Token auto-refresh setup: Relying on server-issued HTTP-only cookies.');
  }

  static async performRefresh(): Promise<boolean> {
    if (TokenRefresh.isRefreshing) {
      console.log('Token refresh already in progress');
      return false;
    }

    TokenRefresh.isRefreshing = true;

    try {
      // The fetch call now relies on 'credentials: "include"' to send the HTTP-only refresh token cookie.
      // The backend will validate the refresh token, issue a new access token (as an HTTP-only cookie),
      // and potentially a new refresh token.
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // This ensures cookies (including the refresh token) are sent.
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // The response might contain data, but the primary outcome is the new HTTP-only cookie.
        const data = await response.json(); // Still good practice to parse response body if server sends info
        console.log('Token refreshed successfully (HTTP-only cookie updated)');

        // Setup next auto-refresh would ideally be based on the new access token's expiry if we could read it,
        // but since it's HTTP-only, we'll rely on API errors or a fixed interval to trigger another refresh attempt.
        // For simplicity here, we'll re-setup the timeout, but its effectiveness is reduced without direct access to the token expiry.
        // A better client-side strategy is to retry requests on 401 and let the refresh flow handle it.
        // TokenRefresh.setupAutoRefresh(); // Re-evaluating the need for this in HTTP-only context. Likely less relevant.
        return true;
      } else {
        console.warn('Token refresh failed:', response.status);
        // If refresh fails, it implies the refresh token is also invalid or expired.
        // The server should invalidate associated sessions.
        // Client-side cleanup might involve removing local state and redirecting to login.
        if (response.status === 401 || response.status === 403) {
          console.log('Token refresh failed - user likely needs to re-authenticate');
          // Depending on the app structure, you might want to dispatch a logout action here.
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

  // Handles API errors by attempting a token refresh.
  static async handleApiError(response: Response): Promise<boolean> {
    if (response.status === 401) {
      console.log('Received 401, attempting to refresh token...');
      const refreshed = await TokenRefresh.performRefresh();
      // If refresh was successful, the original request might need to be retried.
      // This retry logic is better handled within the API request wrapper.
      return refreshed;
    }
    return false;
  }
}

// Enhanced fetch wrapper with automatic token refresh
export const apiRequestWithRefresh = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // No longer reading accessToken from localStorage.
  // The Authorization header will be implicitly handled by the browser sending the HTTP-only cookie.
  // However, if the backend also expects an Authorization header (e.g., for the initial request
  // before the cookie is set), or if you need to manually add it for some reason, you'd need
  // access to the current accessToken, which is tricky with HTTP-only cookies.
  // For a pure HTTP-only setup, the Authorization header might not be needed if the server
  // relies solely on the cookie for authentication.

  // If the backend *still* requires the Authorization header even with HTTP-only cookies,
  // this part would need to be adapted, potentially by reading the access token from a cookie
  // directly in the client-side code if the cookie is not marked HttpOnly, or by having the
  // server indicate the access token in the response body during refresh.
  // For this example, we assume the server relies on the cookie implicitly.

  let response = await fetch(url, {
    ...options,
    // 'credentials: "include"' is crucial here to ensure the browser automatically sends
    // the authentication cookies (including the refresh token cookie) with the request.
    credentials: 'include',
    headers: {
      // Remove explicit Authorization header if the server relies solely on cookies
      // 'Content-Type': 'application/json', // Keep other necessary headers
      ...(options.headers || {}) // Merge user-provided headers
    }
  });

  // If the response is 401 (Unauthorized) and we haven't already tried to refresh in this chain,
  // attempt to refresh the token.
  if (response.status === 401) {
    console.log('API request failed with 401, attempting token refresh...');
    const refreshed = await TokenRefresh.performRefresh();

    if (refreshed) {
      console.log('Token refreshed successfully, retrying original request...');
      // Retry the original request with the updated (implicitly managed) token.
      response = await fetch(url, {
        ...options,
        credentials: 'include', // Ensure cookies are sent on retry
        headers: {
          // Re-apply headers, ensuring no Authorization header is explicitly set if relying on cookies
          ...(options.headers || {})
        }
      });
    } else {
      console.log('Token refresh failed, cannot retry request.');
      // Handle cases where refresh fails (e.g., redirect to login)
    }
  }

  return response;
};

// Initialize auto-refresh on app load.
// In an HTTP-only cookie scenario, "setupAutoRefresh" might not be directly managing timeouts
// as it did before, but rather ensuring the mechanism is in place or logging the shift in strategy.
// The primary driver for refresh will now be API errors (401) handled by apiRequestWithRefresh.
if (typeof window !== 'undefined') {
  // TokenRefresh.setupAutoRefresh(); // This might be less relevant now, or needs a different implementation.
  // Instead of scheduling a refresh, we rely on apiRequestWithRefresh to handle 401s.
  // We can log that the system is ready for HTTP-only tokens.
  console.log('App initialized: Authentication now relies on HTTP-only cookies.');
}

// Placeholder for the refreshAccessToken function as requested by the changes.
// This function would typically be called explicitly when a refresh is needed,
// or implicitly by the apiRequestWithRefresh wrapper.
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    console.log('🔄 [TOKEN-REFRESH] Attempting to refresh access token...');

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Refresh token will be sent via cookie
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [TOKEN-REFRESH] Tokens refreshed successfully (stored in HTTP-only cookies)');
      return true;
    } else {
      console.log('❌ [TOKEN-REFRESH] Failed to refresh token');

      // Clear local data (tokens are cleared server-side)
      localStorage.removeItem('tenantId');

      return false;
    }
  } catch (error) {
    console.error('❌ [TOKEN-REFRESH] Token refresh error:', error);
    // Clear local data on error as well
    localStorage.removeItem('tenantId');
    return false;
  }
};