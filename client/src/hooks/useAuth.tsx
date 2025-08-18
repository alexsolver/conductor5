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
          return null;
        }

        const userData = await response.json();
        console.log('✅ [AUTH-QUERY] Auth check successful');
        return userData || null;
      } catch (error) {
        console.warn('⚠️ [AUTH-QUERY] Auth query error:', (error as Error).message);
        return null;
      }
    },
    retry: false,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const attemptTokenRefresh = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken ||
        refreshToken === 'null' ||
        refreshToken === 'undefined' ||
        refreshToken.trim() === '' ||
        refreshToken === 'false') {
      console.log('❌ [REFRESH] No valid refresh token available');
      return false;
    }

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

        if (responseData.success && responseData.data?.tokens) {
          const { accessToken, refreshToken: newRefreshToken } = responseData.data.tokens;

          if (accessToken &&
              accessToken !== 'null' &&
              accessToken !== 'undefined' &&
              accessToken.trim() !== '') {

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('access_token', accessToken);
            if (newRefreshToken &&
                newRefreshToken !== 'null' &&
                newRefreshToken !== 'undefined') {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            console.log('✅ [REFRESH] Token refreshed successfully');
            return true;
          }
        }

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
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        return false;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [REFRESH] Refresh failed:', response.status, errorData.message || response.statusText);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        return false;
      }
    } catch (error) {
      console.error('❌ [REFRESH] Token refresh error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      return false;
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('🔐 [LOGIN] Starting login process...');

      try {
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

        if (responseData.success && responseData.data) {
          console.log('✅ [LOGIN] Using structured response format');
          return {
            user: responseData.data.user,
            accessToken: responseData.data.tokens.accessToken,
            refreshToken: responseData.data.tokens.refreshToken,
            session: responseData.data.session
          };
        } else if (responseData.user && responseData.accessToken) {
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
      localStorage.setItem('access_token', result.accessToken);
      console.log('📦 [LOGIN-SUCCESS] Access token stored');

      if (result.refreshToken && result.refreshToken !== 'null' && result.refreshToken !== 'undefined') {
        localStorage.setItem('refreshToken', result.refreshToken);
        console.log('📦 [LOGIN-SUCCESS] Refresh token stored');
      }

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
      localStorage.setItem('access_token', result.accessToken);
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
      }
    },
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('access_token');
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
  return context;
}