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
      console.log('Refresh token failed, redirecting to login');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth';
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/auth';
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

export const apiRequest = async (method: string, url: string, data?: any): Promise<Response> => {
  const token = localStorage.getItem('accessToken');

  console.log(`🌐 [API-REQUEST] ${method} ${url}`);

  // ✅ CRITICAL FIX: Para login/register, não verificar token
  if (url.includes('/login') || url.includes('/register')) {
    console.log('🔐 [API-REQUEST] Auth endpoint, proceeding without token validation');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    return fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
  }

  // ✅ Para outras rotas, verificar token mas sem redirects automáticos
  if (!token || 
      token === 'null' || 
      token === 'undefined' || 
      token === 'false' ||
      token.trim() === '' ||
      token.length < 20) {

    console.warn('⚠️ [API-REQUEST] No valid token for protected route');
    throw new Error('No valid token available');
  }

  const tenantId = localStorage.getItem('tenantId');

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // ✅ Sempre incluir token se chegamos aqui
      ...(tenantId && tenantId !== 'null' && { 'X-Tenant-ID': tenantId }),
    },
    credentials: 'include',
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  // ✅ 1QA.MD: Auto-refresh automático em caso de 401
  if (response.status === 401 && url !== '/api/auth/refresh') {
    console.log('🔄 [API-INTERCEPTOR] 401 detected, attempting token refresh...');

    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.data?.tokens?.accessToken) {
            const newToken = refreshData.data.tokens.accessToken;
            localStorage.setItem('accessToken', newToken);
            if (refreshData.data.tokens.refreshToken) {
              localStorage.setItem('refreshToken', refreshData.data.tokens.refreshToken);
            }

            // Retry original request com novo token
            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`
              }
            };

            console.log('✅ [API-INTERCEPTOR] Token refreshed, retrying original request');
            return await fetch(url, newOptions);
          }
        }
      } catch (error) {
        console.error('❌ [API-INTERCEPTOR] Refresh failed:', error);
      }
    }

    // Se refresh falhou, limpar tokens e forçar relogin
    console.error('❌ [API-INTERCEPTOR] Token refresh failed, redirecting to auth');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    window.location.href = '/auth';
  }

  return response;
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
      // Para outros casos, redirecionar para login
      console.log('🔄 [QUERY-CLIENT] Redirecting to login due to missing token');
      window.location.href = '/auth';
      return null;
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
        console.error('❌ [QUERY-CLIENT] Token refresh failed, redirecting to auth');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        window.location.href = '/auth';
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