import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Get refresh token from localStorage (if stored) or cookies
    const refreshToken = globalThis.localStorage?.getItem('refreshToken');

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
      console.log('Refresh token failed, redirecting to login');
      globalThis.localStorage?.removeItem('accessToken');
      globalThis.localStorage?.removeItem('refreshToken');
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.location.href = '/auth';
      }
      return null;
    }

    const data = await response.json() as { accessToken: string; refreshToken?: string };
    globalThis.localStorage?.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      globalThis.localStorage?.setItem('refreshToken', data.refreshToken);
    }
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    globalThis.localStorage?.removeItem('accessToken');
    globalThis.localStorage?.removeItem('refreshToken');
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.location.href = '/auth';
    }
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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add request logging for debugging
  console.log(`🌐 API Request: ${method} ${url}`, data ? { data } : '');

  // Add authorization header if token exists (but skip redirect for login/register endpoints)
  let token = localStorage.getItem('accessToken');
  const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

  // Check if token exists (skip for auth endpoints)
  if (!token && !isAuthEndpoint) {
    console.log('No token found, redirecting to login');
    window.location.href = '/auth';
    return new Response('Unauthorized', { status: 401 });
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  // Only add body for methods that support it
  if (method !== 'GET' && method !== 'HEAD' && data) {
    fetchOptions.body = JSON.stringify(data);
  }

  let res = await fetch(url, fetchOptions);

  // If unauthorized, try to refresh token and retry
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryOptions: RequestInit = {
        method,
        headers,
        credentials: "include",
      };

      if (method !== 'GET' && method !== 'HEAD' && data) {
        retryOptions.body = JSON.stringify(data);
      }

      res = await fetch(url, retryOptions);
    } else {
      // If refresh failed, redirect to login
      console.log('Token refresh failed, redirecting to login');
      window.location.href = '/auth';
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    await throwIfResNotOk(res);
    console.log(`✅ API Success: ${method} ${url} - ${res.status}`);
    return res;
  } catch (error) {
    console.error(`❌ API Error: ${method} ${url} - ${res.status}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    // Add authorization header if token exists
    let token = localStorage.getItem('accessToken');

    // Check if token exists
    if (!token) {
      console.log('No token found for query');
      return null;
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    // If unauthorized, try to refresh token and retry
    if (res.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(queryKey.join("/") as string, {
          headers,
          credentials: "include",
        });
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Helper function to validate API response data
export const validateApiResponse = (data: any, expectedArrayFields: string[] = []): any => {
  if (!data) return { data: [], success: false };

  // If it's already a valid response, return as is
  if (data.success !== undefined) return data;

  // Handle direct arrays
  if (Array.isArray(data)) {
    return { success: true, data: data };
  }

  // Handle nested data structures
  const result: any = { success: true, data: {} };

  expectedArrayFields.forEach(field => {
    if (data[field] && Array.isArray(data[field])) {
      result.data[field] = data[field];
    } else if (data.data && data.data[field] && Array.isArray(data.data[field])) {
      result.data[field] = data.data[field];
    } else {
      result.data[field] = [];
    }
  });

  // If no expected fields, try to extract any array data
  if (expectedArrayFields.length === 0) {
    if (data.data) {
      result.data = data.data;
    } else {
      result.data = data;
    }
  }

  return result;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 401
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500 && status !== 401) {
            return false;
          }
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (updated from cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});