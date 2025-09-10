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

    // ✅ Para HTTP-only cookies, não verificamos localStorage
    // O browser gerencia automaticamente os cookies com credentials: 'include'
    
    const endpoint = queryKey.join("/");
    let res = await fetch(endpoint, {
      headers,
      credentials: "include", // ✅ Sempre incluir cookies para autenticação
    });

    // If unauthorized, try to refresh token and retry
    if (res.status === 401) {
      console.log('🔄 [QUERY-CLIENT] 401 detected, attempting token refresh...');
      const newToken = await refreshAccessToken();
      if (newToken) {
        console.log('✅ [QUERY-CLIENT] Token refreshed, retrying query...');
        res = await fetch(endpoint, {
          headers,
          credentials: "include",
        });
      } else {
        console.error('❌ [QUERY-CLIENT] Token refresh failed');
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('Authentication failed');
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.warn('⚠️ [QUERY-CLIENT] Received 401 and unauthorizedBehavior is returnNull');
      return null;
    }

    await throwIfResNotOk(res);
    
    // ✅ Verificar se há conteúdo para parse JSON (evitar erro em DELETE 204)
    const contentType = res.headers.get('content-type');
    const contentLength = res.headers.get('content-length');
    
    if (res.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
      return {}; // Retornar objeto vazio para respostas sem conteúdo
    }
    
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