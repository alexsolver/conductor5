import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function refreshAccessToken(): Promise<boolean> {
  try {
    // ✅ Para HTTP-only cookies, não precisamos de tokens no localStorage
    // O refresh é feito puramente via cookies HTTP-only
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // ✅ Cookies são enviados automaticamente
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ Sem body - refresh baseado em cookies
    });

    if (!response.ok) {
      console.log('Token refresh failed - HTTP-only cookies expired');
      return false;
    }

    console.log('✅ Token refreshed successfully via HTTP-only cookies');
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
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

// Enhanced API request function with automatic retries and error handling
export const apiRequest = async (
  method: string,
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;

  console.log(`🌐 [API-REQUEST] ${method} ${endpoint}`);

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Always include credentials for cookies
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  console.log('🔍 [API-REQUEST-FINAL] Making request with credentials:', config.credentials);

  try {
    let response = await fetch(url, config);

    // If we get a 401 and it's not an auth endpoint, try to refresh the token
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      console.log('🔄 [API-REQUEST] Got 401, attempting token refresh...');

      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (refreshResponse.ok) {
        console.log('✅ [API-REQUEST] Token refreshed, retrying original request...');
        // Retry the original request
        response = await fetch(url, config);
      } else {
        console.log('❌ [API-REQUEST] Token refresh failed, request will fail');
      }
    }

    console.log(`✅ [API-REQUEST] ${method} ${endpoint} - ${response.status}`);
    return response;
  } catch (error: any) {
    console.error(`❌ [API-REQUEST] ${method} ${endpoint} failed:`, error.message);
    throw error;
  }
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
      const refreshSucceeded = await refreshAccessToken();
      if (refreshSucceeded) {
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
      return null; // ✅ Retornar null para respostas sem conteúdo (mais seguro que {})
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors (authentication issues)
        if (error?.status === 401 || error?.status === 403) {
          console.log('❌ [QUERY-CLIENT] Authentication error detected, not retrying');
          return false;
        }
        // Don't retry on 400 errors (bad requests)
        if (error?.status === 400) {
          console.log('❌ [QUERY-CLIENT] Bad request error, not retrying');
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        if (error?.status === 401) {
          console.error('❌ [QUERY-CLIENT] Mutation failed due to authentication');
        }
      },
    },
  },
});