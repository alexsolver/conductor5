
// API Interceptor para refresh automático de tokens
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

export const setupApiInterceptor = () => {
  // Interceptar todas as chamadas fetch
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // Adicionar token automaticamente se disponível
    const token = localStorage.getItem('accessToken');
    
    if (token && init?.headers !== false) {
      const headers = new Headers(init?.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init = { ...init, headers };
    }

    let response = await originalFetch(input, init);

    // Se recebeu 401, tentar refresh
    if (response.status === 401 && token) {
      const responseData = await response.clone().json().catch(() => ({}));
      
      if (responseData.needsRefresh || responseData.code === 'TOKEN_EXPIRED') {
        if (!isRefreshing) {
          isRefreshing = true;
          
          try {
            console.log('🔄 [API-INTERCEPTOR] Attempting automatic token refresh');
            
            const refreshResponse = await originalFetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              const newToken = refreshData.data?.tokens?.accessToken;
              
              if (newToken) {
                localStorage.setItem('accessToken', newToken);
                console.log('✅ [API-INTERCEPTOR] Token refreshed successfully');
                
                processQueue(null, newToken);
                
                // Retry original request with new token
                const newHeaders = new Headers(init?.headers || {});
                newHeaders.set('Authorization', `Bearer ${newToken}`);
                
                response = await originalFetch(input, { ...init, headers: newHeaders });
              }
            } else {
              console.warn('⚠️ [API-INTERCEPTOR] Token refresh failed');
              processQueue(new Error('Token refresh failed'), null);
              
              // Redirect to login after a brief delay
              setTimeout(() => {
                window.location.href = '/auth';
              }, 1000);
            }
          } catch (error) {
            console.error('❌ [API-INTERCEPTOR] Error during token refresh:', error);
            processQueue(error, null);
          } finally {
            isRefreshing = false;
          }
        } else {
          // Wait for ongoing refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            const newHeaders = new Headers(init?.headers || {});
            newHeaders.set('Authorization', `Bearer ${token}`);
            return originalFetch(input, { ...init, headers: newHeaders });
          });
        }
      }
    }

    return response;
  };
};
