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

  // 🔧 Get tenant ID from queryClient cache or local storage
  let tenantId = '';
  try {
    // Try to get tenant ID from cached user data
    const cachedUser = queryClient.getQueryData(['/api/auth/user']) as any;
    if (cachedUser?.tenantId) {
      tenantId = cachedUser.tenantId;
    } else {
      // Fallback to localStorage (for backward compatibility)
      tenantId = localStorage.getItem('tenantId') || '';
    }
  } catch (e) {
    // Fallback to localStorage if queryClient is not available
    tenantId = localStorage.getItem('tenantId') || '';
  }

  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  // 🔧 Include tenant ID header if available
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
    console.log(`🔧 [API-REQUEST] Including tenant ID header: ${tenantId}`);
  } else {
    console.warn('⚠️ [API-REQUEST] No tenant ID available for header');
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // ✅ 1QA.MD: Ensure cookies are included for authentication
    ...options,
  };

  if (data && method !== 'GET') {
    if (data instanceof FormData) {
      // 🔧 Para FormData, não definir Content-Type (browser define automaticamente)
      config.body = data;
    } else {
      // 🔧 Para dados JSON, definir Content-Type e stringify
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
      config.body = JSON.stringify(data);
    }
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