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
    staleTime: 30 * 60 * 1000, // Increase stale time to 30 minutes to prevent refetching during profile operations
    gcTime: 60 * 60 * 1000, // Increase garbage collection time to 1 hour
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent logout during profile operations
    refetchOnMount: false, // Only fetch on mount if no data exists
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
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        return false;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [REFRESH] Refresh failed:', response.status, errorData.message || response.statusText);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        return false;
      }
    } catch (error) {
      console.error('❌ [REFRESH] Token refresh error:', error);
      localStorage.removeItem('accessToken');
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
  
  // ✅ 1QA.MD: Auto refresh automático para evitar logout - versão menos agressiva
  React.useEffect(() => {
    // ✅ CRITICAL FIX: Não executar verificações automáticas logo após login
    if (!context.user) {
      return; // Não fazer nada se não há usuário autenticado
    }

    const checkTokenExpiry = async () => {
      const currentToken = localStorage.getItem('accessToken');
      
      // ✅ CRITICAL FIX: Validação menos restritiva para evitar logout automático
      if (!currentToken || 
          currentToken === 'null' || 
          currentToken === 'undefined' || 
          currentToken.trim() === '') {
        
        console.warn('⚠️ [AUTO-REFRESH] No valid token found');
        // ✅ Não forçar logout imediatamente, aguardar próxima verificação
        return;
      }
      
      try {
        // ✅ Validar formato JWT antes de decodificar
        const tokenParts = currentToken.split('.');
        if (tokenParts.length !== 3) {
          console.warn('⚠️ [AUTO-REFRESH] Invalid JWT format, will refresh on next API call');
          return; // Deixar o refresh ser tratado pelo interceptor de API
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
        
        // ✅ 1QA.MD: Só renovar se expira em menos de 2 horas (menos agressivo)
        if (timeToExpiry < 2 * 60 * 60 * 1000 && timeToExpiry > 5 * 60 * 1000) {
          console.log('🔄 [AUTO-REFRESH] Token expiring soon, refreshing...', {
            timeToExpiry: Math.round(timeToExpiry / 1000 / 60), // minutos
            expiresAt: new Date(expiresAt).toISOString()
          });
          await refreshToken();
        } else if (timeToExpiry <= 0) {
          console.log('⏰ [AUTO-REFRESH] Token expired, will refresh on next API call');
          // Não forçar logout, deixar o interceptor tratar
        }
      } catch (error) {
        console.warn('⚠️ [AUTO-REFRESH] Error checking token expiry:', error.message);
        // Não fazer nada, deixar o sistema continuar funcionando
      }
    };

    // ✅ CRITICAL FIX: Aguardar 30 segundos antes de começar verificações automáticas
    const initialDelay = setTimeout(() => {
      checkTokenExpiry();
      
      // Verificar a cada 30 minutos (menos frequente para evitar interferências)
      const interval = setInterval(checkTokenExpiry, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }, 30000); // 30 segundos de delay inicial
    
    return () => clearTimeout(initialDelay);
  }, [context.user]);

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      
      // ✅ CRITICAL FIX: Validação menos agressiva
      if (!refresh || refresh === 'null' || refresh === 'undefined' || refresh.trim() === '') {
        console.warn('❌ [REFRESH-TOKEN] No valid refresh token available');
        return false; // Não forçar logout, apenas retornar false
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
          return false; // Não forçar logout
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn('⚠️ [REFRESH-TOKEN] Failed to refresh token:', response.status, errorText);
        return false; // Não forçar logout, apenas retornar false
      }
    } catch (error) {
      console.warn('⚠️ [REFRESH-TOKEN] Error refreshing token:', error.message);
      return false; // Não forçar logout em caso de erro
    }
  };

  return {
    ...context,
    refreshToken,
    token
  };
}

