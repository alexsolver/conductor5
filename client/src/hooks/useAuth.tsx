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
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return null;
      }

      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Try to refresh token before giving up
            const refreshed = await attemptTokenRefresh();
            if (refreshed) {
              // Retry with new token
              const newToken = localStorage.getItem('accessToken');
              const retryResponse = await fetch('/api/auth/user', {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              });
              
              if (retryResponse.ok) {
                return await retryResponse.json();
              }
            }
            
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return null;
          }
          console.warn(`Auth check failed: ${response.status}`);
          return null;
        }

        const userData = await response.json();
        return userData || null;
      } catch (error) {
        // Auth query error handled by UI
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Token refresh mechanism
  const attemptTokenRefresh = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    try {
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
        
        // ✅ CRITICAL FIX - Handle backend response structure per 1qa.md compliance
        if (responseData.success && responseData.data?.tokens) {
          const { accessToken, refreshToken: newRefreshToken } = responseData.data.tokens;
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          return true;
        }
        
        // Fallback for direct token response
        if (responseData.accessToken) {
          localStorage.setItem('accessToken', responseData.accessToken);
          if (responseData.refreshToken) {
            localStorage.setItem('refreshToken', responseData.refreshToken);
          }
          return true;
        }
        
        console.error('Invalid refresh response structure:', responseData);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Refresh failed:', errorData.message || response.statusText);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return false;
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest('POST', '/api/auth/login', credentials);
        
        if (!res.ok) {
          let errorMessage = 'Login failed';
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const responseData = await res.json();
        
        // ✅ CRITICAL FIX - Handle the backend response structure per 1qa.md compliance
        if (responseData.success && responseData.data) {
          // Backend returns: { success: true, data: { user, tokens, session } }
          return {
            user: responseData.data.user,
            accessToken: responseData.data.tokens.accessToken,
            refreshToken: responseData.data.tokens.refreshToken,
            session: responseData.data.session
          };
        }
        
        throw new Error(responseData.message || 'Login failed');
      } catch (error) {
        // Login API error handled by UI
        throw error;
      }
    },
    onSuccess: (result: { user: User; accessToken: string; refreshToken?: string; session?: any }) => {
      localStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      // Store tenantId for quick access by components
      if (result.user?.tenantId) {
        localStorage.setItem('tenantId', result.user.tenantId);
      }
      queryClient.setQueryData(['/api/auth/user'], result.user);
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
  
  // ✅ 1QA.MD: Auto refresh automático para evitar logout
  React.useEffect(() => {
    const checkTokenExpiry = async () => {
      const currentToken = localStorage.getItem('accessToken');
      
      // ✅ CRITICAL FIX: Validação rigorosa de token
      if (!currentToken || 
          currentToken === 'null' || 
          currentToken === 'undefined' || 
          currentToken.trim() === '' || 
          !context.user) {
        console.warn('⚠️ [AUTO-REFRESH] Invalid or missing token, skipping expiry check');
        return;
      }
      
      try {
        // ✅ Validar formato JWT antes de decodificar
        const tokenParts = currentToken.split('.');
        if (tokenParts.length !== 3) {
          console.error('❌ [AUTO-REFRESH] Invalid JWT format');
          await refreshToken();
          return;
        }

        // Decodificar token para verificar expiração
        const payload = JSON.parse(atob(tokenParts[1]));
        if (!payload.exp) {
          console.warn('⚠️ [AUTO-REFRESH] Token without expiration');
          return;
        }

        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        const timeToExpiry = expiresAt - now;
        
        // ✅ 1QA.MD: Se expira em menos de 4 horas (para token de 24h), renovar automaticamente
        if (timeToExpiry < 4 * 60 * 60 * 1000 && timeToExpiry > 0) {
          console.log('🔄 [AUTO-REFRESH] Token expiring soon, refreshing automatically...', {
            timeToExpiry: Math.round(timeToExpiry / 1000 / 60), // minutos
            expiresAt: new Date(expiresAt).toISOString()
          });
          const refreshed = await refreshToken();
          if (refreshed) {
            console.log('✅ [AUTO-REFRESH] Token renewed successfully');
          }
        } else if (timeToExpiry <= 0) {
          console.error('❌ [AUTO-REFRESH] Token already expired, forcing refresh');
          await refreshToken();
        }
      } catch (error) {
        console.error('❌ [AUTO-REFRESH] Error checking token expiry:', error);
        // Se não conseguimos decodificar, tentar refresh
        await refreshToken();
      }
    };

    // Verificar a cada 15 minutos (mais frequente para evitar logout)
    const interval = setInterval(checkTokenExpiry, 15 * 60 * 1000);
    
    // Verificar imediatamente
    checkTokenExpiry();
    
    return () => clearInterval(interval);
  }, [context.user]);

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      
      // ✅ CRITICAL FIX: Validação rigorosa do refresh token
      if (!refresh || refresh === 'null' || refresh === 'undefined' || refresh.trim() === '') {
        console.warn('❌ [REFRESH-TOKEN] No valid refresh token available');
        context.logoutMutation.mutate();
        return false;
      }

      console.log('🔄 [REFRESH-TOKEN] Attempting token refresh...');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [REFRESH-TOKEN] Response structure:', Object.keys(data));
        
        // ✅ 1QA.MD: Handle backend response structure
        let newAccessToken = null;
        let newRefreshToken = null;

        if (data.success && data.data?.tokens) {
          // Structured response from backend
          newAccessToken = data.data.tokens.accessToken;
          newRefreshToken = data.data.tokens.refreshToken;
        } else if (data.accessToken) {
          // Direct response fallback
          newAccessToken = data.accessToken;
          newRefreshToken = data.refreshToken;
        }

        if (newAccessToken && newAccessToken !== 'null' && newAccessToken !== 'undefined') {
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken && newRefreshToken !== 'null' && newRefreshToken !== 'undefined') {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          setToken(newAccessToken);
          console.log('✅ [REFRESH-TOKEN] Token refreshed successfully');
          return true;
        } else {
          console.error('❌ [REFRESH-TOKEN] Invalid token received from server');
          context.logoutMutation.mutate();
          return false;
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ [REFRESH-TOKEN] Failed to refresh token:', response.status, errorText);
        context.logoutMutation.mutate();
        return false;
      }
    } catch (error) {
      console.error('❌ [REFRESH-TOKEN] Error refreshing token:', error);
      context.logoutMutation.mutate();
      return false;
    }
  };

  return {
    ...context,
    refreshToken,
    token
  };
}

