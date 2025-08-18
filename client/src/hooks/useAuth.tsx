import React, { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation, UseMutationResult } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  tenantId: string;
  profileImageUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  workspaceName?: string;
  role?: 'admin' | 'agent' | 'customer' | 'tenant_admin';
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<{ user: User; accessToken: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User; accessToken: string; tenant?: { id: string; name: string; subdomain: string } }, Error, RegisterData>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const { data: user, error, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async (): Promise<User | null> => {
      // ✅ 1QA.MD: Validação menos restritiva para evitar logout automático
      const token = localStorage.getItem('accessToken');

      // ✅ CRITICAL FIX: Se não há token, retornar null sem fazer request
      if (!token ||
          token === 'null' ||
          token === 'undefined' ||
          token.trim() === '') {
        console.log('🚫 [AUTH-QUERY] No valid token found, skipping auth check');
        return null;
      }

      try {
        console.log('🔍 [AUTH-QUERY] Making auth check request...');

        const response = await fetch('/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          console.warn(`⚠️ [AUTH-QUERY] Auth check failed: ${response.status}`);
          // Return null but don't clear tokens - let API interceptor handle refresh
          return null;
        }

        const userData = await response.json();
        console.log('✅ [AUTH-QUERY] Auth check successful');
        return userData || null;
      } catch (error) {
        console.warn('⚠️ [AUTH-QUERY] Auth query error:', error.message);
        // Don't clear tokens on network errors following 1qa.md patterns
        return null;
      }
    },
    retry: false,
    staleTime: 60 * 60 * 1000, // Increase stale time to 1 hour to prevent refetching during profile operations
    gcTime: 2 * 60 * 60 * 1000, // Increase garbage collection time to 2 hours
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent logout during profile operations
    refetchOnMount: false, // Only fetch on mount if no data exists
    refetchOnReconnect: false, // Disable refetch on reconnect to prevent logout during operations
  });

  // Token refresh mechanism - ✅ 1QA.MD compliance
  const attemptTokenRefresh = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');

    // ✅ CRITICAL FIX: Validação rigorosa do refresh token
    if (!refreshToken ||
        refreshToken === 'null' ||
        refreshToken === 'undefined' ||
        refreshToken.trim() === '' ||
        refreshToken === 'false') {
      console.log('❌ [REFRESH] No valid refresh token available');
      return false;
    }

    // ✅ Validar formato JWT do refresh token
    const tokenParts = refreshToken.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ [REFRESH] Invalid refresh token JWT format');
      localStorage.removeItem('refreshToken');
      return false;
    }

    try {
      console.log('🔄 [REFRESH] Attempting token refresh...');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('🔍 [REFRESH] Response structure:', Object.keys(responseData));

        // ✅ 1QA.MD: Handle backend response structure
        if (responseData.success && responseData.data?.tokens) {
          const { accessToken, refreshToken: newRefreshToken } = responseData.data.tokens;

          if (accessToken &&
              accessToken !== 'null' &&
              accessToken !== 'undefined' &&
              accessToken.trim() !== '') {

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('access_token', accessToken); // ✅ Dual format following 1qa.md
            if (newRefreshToken &&
                newRefreshToken !== 'null' &&
                newRefreshToken !== 'undefined') {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            console.log('✅ [REFRESH] Token refreshed successfully');
            return true;
          }
        }

        // Fallback for direct token response
        if (responseData.accessToken &&
            responseData.accessToken !== 'null' &&
            responseData.accessToken !== 'undefined') {
          localStorage.setItem('accessToken', responseData.accessToken);
          if (responseData.refreshToken &&
              responseData.refreshToken !== 'null' &&
              responseData.refreshToken !== 'undefined') {
            localStorage.setItem('refreshToken', responseData.refreshToken);
          }
          console.log('✅ [REFRESH] Token refreshed (fallback)');
          return true;
        }

        console.error('❌ [REFRESH] Invalid refresh response structure:', responseData);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('access_token'); // ✅ Remove dual format following 1qa.md
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        return false;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [REFRESH] Refresh failed:', response.status, errorData.message || response.statusText);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('access_token'); // ✅ Remove dual format following 1qa.md
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        return false;
      }
    } catch (error) {
      console.error('❌ [REFRESH] Token refresh error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('access_token'); // ✅ Remove dual format following 1qa.md
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      return false;
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('🔐 [LOGIN] Starting login process...');

      try {
        // ✅ CRITICAL FIX: Fazer request direto sem usar apiRequest que pode ter problemas
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });

        console.log('🔍 [LOGIN] Response status:', response.status);

        if (!response.ok) {
          let errorMessage = 'Login failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error('❌ [LOGIN] Error response:', errorData);
          } catch (e) {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        console.log('🔍 [LOGIN] Response data structure:', Object.keys(responseData));

        // ✅ CRITICAL FIX - Handle multiple response formats
        if (responseData.success && responseData.data) {
          // Structured response
          console.log('✅ [LOGIN] Using structured response format');
          return {
            user: responseData.data.user,
            accessToken: responseData.data.tokens.accessToken,
            refreshToken: responseData.data.tokens.refreshToken,
            session: responseData.data.session
          };
        } else if (responseData.user && responseData.accessToken) {
          // Direct response format
          console.log('✅ [LOGIN] Using direct response format');
          return {
            user: responseData.user,
            accessToken: responseData.accessToken,
            refreshToken: responseData.refreshToken,
            session: null
          };
        }

        console.error('❌ [LOGIN] Invalid response structure:', responseData);
        throw new Error('Invalid login response format');
      } catch (error) {
        console.error('❌ [LOGIN] Login error:', error);
        throw error;
      }
    },
    onSuccess: (result: { user: User; accessToken: string; refreshToken?: string; session?: any }) => {
      console.log('✅ [LOGIN-SUCCESS] Storing tokens and user data');

      // ✅ CRITICAL FIX: Validar tokens antes de armazenar
      if (!result.accessToken || result.accessToken === 'null' || result.accessToken === 'undefined') {
        console.error('❌ [LOGIN-SUCCESS] Invalid access token received');
        toast({
          title: 'Login failed',
          description: 'Invalid token received from server',
          variant: 'destructive',
        });
        return;
      }

      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('access_token', result.accessToken); // ✅ Dual format following 1qa.md
      console.log('📦 [LOGIN-SUCCESS] Access token stored');

      if (result.refreshToken && result.refreshToken !== 'null' && result.refreshToken !== 'undefined') {
        localStorage.setItem('refreshToken', result.refreshToken);
        console.log('📦 [LOGIN-SUCCESS] Refresh token stored');
      }

      // Store tenantId for quick access by components
      if (result.user?.tenantId) {
        localStorage.setItem('tenantId', result.user.tenantId);
        console.log('📦 [LOGIN-SUCCESS] Tenant ID stored:', result.user.tenantId);
      }

      queryClient.setQueryData(['/api/auth/user'], result.user);
      console.log('✅ [LOGIN-SUCCESS] Login completed successfully');

      toast({
        title: 'Login successful',
        description: `Welcome back, ${result.user.firstName || result.user.email}!`,
      });
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      const errorMessage = error.message?.includes('400:')
        ? error.message.split('400:')[1]?.trim() || 'Invalid credentials'
        : error.message || 'Please check your credentials and try again.';

      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      try {
        const res = await apiRequest('POST', '/api/auth/register', credentials);
        return await res.json();
      } catch (error) {
        console.error('Registration API error:', error);
        throw error;
      }
    },
    onSuccess: (result: { user: User; accessToken: string; tenant?: { id: string; name: string; subdomain: string } }) => {
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('access_token', result.accessToken); // ✅ Dual format following 1qa.md
      // Store tenantId for quick access by components
      if (result.user?.tenantId) {
        localStorage.setItem('tenantId', result.user.tenantId);
      }
      queryClient.setQueryData(['/api/auth/user'], result.user);

      if (result.tenant) {
        toast({
          title: 'Workspace criado com sucesso!',
          description: `Bem-vindo ao Conductor! Seu workspace "${result.tenant.name}" foi criado e você é o administrador.`,
        });
      } else {
        toast({
          title: 'Registro realizado com sucesso',
          description: `Bem-vindo ao Conductor, ${result.user.firstName || result.user.email}!`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      const errorMessage = error.message?.includes('400:')
        ? error.message.split('400:')[1]?.trim() || 'Registration failed'
        : error.message || 'Please try again with a different email.';

      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest('POST', '/api/auth/logout');
      } catch (error) {
        console.warn('Logout API call failed:', error);
        // Continue with logout even if API call fails
      }
    },
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('access_token'); // ✅ Remove dual format following 1qa.md
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Still clear local state on error
      localStorage.removeItem('accessToken');
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
    },
  });

  const value = {
    user: user ?? null,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    logoutMutation,
    registerMutation,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const [token, setToken] = React.useState(localStorage.getItem('accessToken'));
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Mock user and error states for the sake of the example.
  // In a real app, these would come from context or a global state.
  const [user, setUser] = React.useState<User | null>(null);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    queryClient.setQueryData(['/api/auth/user'], null);
    queryClient.clear();
    setToken(null);
    setUser(null);
    setIsLoading(false);
    setError(null);
    // Optionally redirect to login page
    // window.location.href = '/login';
  };


  // ✅ 1QA.MD: Auto refresh automático para evitar logout - versão menos agressiva
  React.useEffect(() => {
    // ✅ CRITICAL FIX: Não executar verificações automáticas logo após login
    if (!context.user) {
      return; // Não fazer nada se não há usuário autenticado
    }

    const checkTokenExpiry = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token || token === 'null' || token === 'undefined') {
          console.log('🔍 [AUTO-REFRESH] No valid token found, skipping check');
          return;
        }

        // Decode token to check expiry (without verification)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('⚠️ [AUTO-REFRESH] Invalid token format');
          return;
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        if (!payload.exp) {
          console.warn('⚠️ [AUTO-REFRESH] Token without expiration');
          return;
        }

        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        const timeToExpiry = expiresAt - now;

        // Check if token is expired
        if (timeToExpiry <= 0) {
          console.log('⏰ [AUTO-REFRESH] Token expired, attempting refresh...');
          try {
            await refreshToken();
          } catch (refreshError) {
            console.warn('❌ [AUTO-REFRESH] Failed to refresh expired token:', refreshError.message);
            // Don't force logout here, let the interceptor handle it
          }
          return;
        }

        // ✅ Auto-refresh if token expires in less than 10 minutes
        if (timeToExpiry < 10 * 60 * 1000) {
          console.log('🔄 [AUTO-REFRESH] Token expiring soon, refreshing...', {
            timeToExpiry: Math.round(timeToExpiry / 1000 / 60), // minutes
            expiresAt: new Date(expiresAt).toISOString()
          });
          try {
            await refreshToken();
          } catch (refreshError) {
            console.warn('❌ [AUTO-REFRESH] Failed to refresh token:', refreshError.message);
          }
        }
      } catch (error) {
        console.warn('⚠️ [AUTO-REFRESH] Error checking token expiry:', error.message);
        // Don't break the flow, let the system continue
      }
    };

    // ✅ CRITICAL FIX: Aguardar 2 minutos antes de começar verificações automáticas - evitar logout durante operações
    const initialDelay = setTimeout(() => {
      checkTokenExpiry();
    }, 120000); // 2 minutos

    // ✅ Verificar a cada 10 minutos após o delay inicial para evitar logout durante operações
    const interval = setInterval(checkTokenExpiry, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [context.user, refreshToken]);


  const refreshToken = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 [REFRESH] Starting token refresh...');

      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue || refreshTokenValue === 'null' || refreshTokenValue === 'undefined') {
        console.log('❌ [REFRESH] No valid refresh token available');
        logout();
        return;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.log('❌ [REFRESH] Refresh failed:', {
          status: response.status,
          error: errorData.message || 'Unknown error'
        });

        // Only logout on certain error codes
        if (response.status === 401 || response.status === 403) {
          logout();
        }
        return;
      }

      const data = await response.json();

      if (data.tokens && data.tokens.accessToken) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        if (data.tokens.refreshToken) {
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
        }
        setUser(data.user || user); // Keep existing user or update
        console.log('✅ [REFRESH] Token refresh successful');
      } else {
        console.log('❌ [REFRESH] Invalid refresh response structure:', data);
        logout();
      }
    } catch (error) {
      console.error('❌ [REFRESH] Token refresh error:', error);
      // Don't immediately logout on network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('🌐 [REFRESH] Network error, will retry later');
      } else {
        logout();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Re-implementing login function to use local state and context
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔐 [LOGIN] Starting login process...');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔍 [LOGIN] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        console.log('❌ [LOGIN] Error response:', errorData);

        const errorMessage = errorData.message || `Login failed (${response.status})`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Handle different response structures
      if (data.success && data.data && data.data.tokens) {
        // Clean Architecture response structure
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        setUser(data.data.user);
        console.log('✅ [LOGIN] Login successful (Clean Architecture format)');
      } else if (data.tokens) {
        // Legacy response structure
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        setUser(data.user);
        console.log('✅ [LOGIN] Login successful (Legacy format)');
      } else {
        console.log('❌ [LOGIN] Invalid response structure:', data);
        throw new Error('Invalid login response format');
      }

      setError(null);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  return {
    ...context,
    refreshToken,
    token,
    login,
    logout,
    isLoading,
    error,
    user
  };
}