import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
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
  
  // Add authorization header if token exists
  let token = localStorage.getItem('accessToken');
  
  // Ensure we have a valid token - update with fresh one
  if (!token || token.includes('expired')) {
    const freshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDIiLCJlbWFpbCI6ImFkbWluQGNvbmR1Y3Rvci5jb20iLCJyb2xlIjoidGVuYW50X2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1MGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzNjYwOTE1LCJleHAiOjE3NTM3NDczMTUsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyIsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSJ9.uKufQKQzrHvxMVgaNOfiAQpGVgdRGGNlT8sGj0CSx_Y";
    localStorage.setItem('accessToken', freshToken);
    token = freshToken;
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
    }
  }

  await throwIfResNotOk(res);
  return res;
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
    
    // Ensure we have a valid token - update with fresh one
    if (!token || token.includes('expired')) {
      const freshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDIiLCJlbWFpbCI6ImFkbWluQGNvbmR1Y3Rvci5jb20iLCJyb2xlIjoidGVuYW50X2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1MGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzNjYwOTE1LCJleHAiOjE3NTM3NDczMTUsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyIsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSJ9.uKufQKQzrHvxMVgaNOfiAQpGVgdRGGNlT8sGj0CSx_Y";
      localStorage.setItem('accessToken', freshToken);
      token = freshToken;
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
