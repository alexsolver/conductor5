import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Get refresh token from localStorage (if stored) or cookies
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.log('No refresh token available');
      return null;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.log('Refresh token failed - not redirecting to avoid interrupting user operations');
      // Don't force redirect following 1qa.md - let components handle auth state
      return null;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Don't force redirect following 1qa.md - let components handle auth state
    return null;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch (e) {
      text = res.statusText || 'Unknown error';
    }
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export const apiRequest = async (
  method: string,
  url: string,
  data?: any,
  options: RequestInit = {}
): Promise<Response> => {
  console.log(`🌐 [API-REQUEST] ${method} ${url}`);
  
  // 🔍 Debug tokens for POST requests
  if (method === 'POST') {
    console.log('🔍 [API-REQUEST-DEBUG] POST request details:', {
      method,
      url,
      hasData: !!data,
      credentials: 'include',
      cookiesWillBeSent: true
    });
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // ✅ 1QA.MD: Ensure cookies are included for authentication
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  console.log(`🔍 [API-REQUEST-FINAL] Making request with credentials: ${config.credentials}`);
  
  return fetch(url, config);
};

type UnauthorizedBehavior = "returnNull" | "throwError";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    // Add authorization header if token exists
    let token = localStorage.getItem('accessToken');

    // Check if token exists
    if (!token ||
        token === 'null' ||
        token === 'undefined' ||
        token === 'false' ||
        token.trim() === '' ||
        token.length < 20) {
      console.log('🚫 [QUERY-CLIENT] No valid token found for query');
      // Para queries críticas como tickets, retornar null para não causar erro
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // Don't redirect automatically - let component handle missing token following 1qa.md
      console.log('🔄 [QUERY-CLIENT] No token available for query');
      throw new Error('No authentication token available');
    }

    headers["Authorization"] = `Bearer ${token}`;

    const endpoint = queryKey.join("/");
    let res = await fetch(endpoint, {
      headers,
      credentials: "include",
    });

    // If unauthorized, try to refresh token and retry
    if (res.status === 401 && token) {
      console.log('🔄 [QUERY-CLIENT] 401 detected, attempting token refresh...');
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        console.log('✅ [QUERY-CLIENT] Token refreshed, retrying query...');
        res = await fetch(endpoint, {
          headers,
          credentials: "include",
        });
      } else {
        console.error('❌ [QUERY-CLIENT] Token refresh failed - not redirecting following 1qa.md');
        // Don't force redirect following 1qa.md - let components handle auth state
        return null; // Return null if refresh fails and we can't proceed
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.warn('⚠️ [QUERY-CLIENT] Received 401 and unauthorizedBehavior is returnNull');
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});