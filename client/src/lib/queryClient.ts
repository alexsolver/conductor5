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

export const apiRequest = async (method: string, endpoint: string, data?: any): Promise<Response> => {
  // ✅ 1QA.MD: Validação rigorosa de token antes de usar
  let token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId');

  // ✅ CRITICAL FIX: Validação mais rigorosa de token inválido
  if (!token || 
      token === 'null' || 
      token === 'undefined' || 
      token.trim() === '' ||
      token === 'false' ||
      token.length < 10) { // JWT tem muito mais que 10 caracteres
    
    console.warn('⚠️ [API-REQUEST] Invalid token detected:', {
      hasToken: !!token,
      tokenValue: token?.substring(0, 10) + '...',
      tokenLength: token?.length
    });
    
    // Tentar refresh imediatamente se token é inválido
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && 
        refreshToken !== 'null' && 
        refreshToken !== 'undefined' &&
        refreshToken.trim() !== '' &&
        refreshToken !== 'false' &&
        refreshToken.length > 10) {
      
      console.log('🔄 [API-REQUEST] Attempting pre-request refresh...');
      
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
            token = refreshData.data.tokens.accessToken;
            localStorage.setItem('accessToken', token);
            if (refreshData.data.tokens.refreshToken) {
              localStorage.setItem('refreshToken', refreshData.data.tokens.refreshToken);
            }
            console.log('✅ [API-REQUEST] Token refreshed successfully before request');
          } else {
            console.error('❌ [API-REQUEST] Invalid refresh response structure');
            throw new Error('Invalid refresh response');
          }
        } else {
          console.error('❌ [API-REQUEST] Refresh request failed:', refreshResponse.status);
          throw new Error('Refresh request failed');
        }
      } catch (error) {
        console.error('❌ [API-REQUEST] Pre-request refresh failed:', error);
        // Limpar tokens inválidos
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        window.location.href = '/auth';
        throw new Error('Pre-request refresh failed');
      }
    } else {
      console.error('❌ [API-REQUEST] No valid refresh token available');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      window.location.href = '/auth';
      throw new Error('No valid tokens available');
    }

    // ✅ Validação final do token após refresh
    if (!token || 
        token === 'null' || 
        token === 'undefined' || 
        token.trim() === '' ||
        token === 'false' ||
        token.length < 10) {
      console.error('❌ [API-REQUEST] Token still invalid after refresh');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      window.location.href = '/auth';
      throw new Error('Token still invalid after refresh');
    }
  }

  // ✅ Validar formato JWT básico
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.error('❌ [API-REQUEST] Invalid JWT format');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    window.location.href = '/auth';
    throw new Error('Invalid JWT format');
  }

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

  const response = await fetch(endpoint, options);

  // ✅ 1QA.MD: Auto-refresh automático em caso de 401
  if (response.status === 401 && endpoint !== '/api/auth/refresh') {
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
            return await fetch(endpoint, newOptions);
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
      console.log('🚫 [QUERY-CLIENT] No token found for query, returning null');
      // Para queries críticas como tickets, retornar null para não causar erro
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // Para outros casos, redirecionar para login
      console.log('🔄 [QUERY-CLIENT] Redirecting to login due to missing token');
      window.location.href = '/auth';
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