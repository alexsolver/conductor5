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
      try {
        console.log('🔍 [AUTH-QUERY] Making auth check request with HTTP-only cookies...');
        
        const response = await fetch('/api/auth/user', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include HTTP-only cookies
        });

        if (!response.ok) {
          console.warn(`⚠️ [AUTH-QUERY] Auth check failed: ${response.status}`);
          return null;
        }

        const userData = await response.json();
        console.log('✅ [AUTH-QUERY] Auth check successful');
        return userData || null;
      } catch (error) {
        console.warn('⚠️ [AUTH-QUERY] Auth query error:', error.message);
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

  // Token refresh mechanism - HTTP-only cookies
  const attemptTokenRefresh = async (): Promise<boolean> => {
    try {
      console.log('🔄 [REFRESH] Attempting token refresh with HTTP-only cookies...');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HTTP-only cookies
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [REFRESH] Token refreshed successfully via HTTP-only cookies');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [REFRESH] Refresh failed:', response.status, errorData.message || response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ [REFRESH] Token refresh error:', error);
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
        
        // ✅ HTTP-only cookies - tokens are now in cookies, just return user data
        if (responseData.success && responseData.data) {
          console.log('✅ [LOGIN] Login successful - tokens stored in HTTP-only cookies');
          return {
            user: responseData.data.user,
            session: responseData.data.session
          };
        } else if (responseData.user) {
          console.log('✅ [LOGIN] Login successful (fallback format)');
          return {
            user: responseData.user,
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
    onSuccess: (result: { user: User; session?: any }) => {
      console.log('✅ [LOGIN-SUCCESS] User authenticated via HTTP-only cookies');
      
      // Store user's tenant ID for compatibility with existing code
      if (result.user.tenantId) {
        localStorage.setItem('tenantId', result.user.tenantId);
        console.log('📦 [LOGIN-SUCCESS] Tenant ID stored for compatibility');
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
    onSuccess: (result: { user: User; tenant?: { id: string; name: string; subdomain: string } }) => {
      // Store tenantId for quick access by components (tokens are now HTTP-only cookies)
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
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include HTTP-only cookies
        });
      } catch (error) {
        console.warn('Logout API call failed:', error);
        // Continue with logout even if API call fails
      }
    },
    onSuccess: () => {
      // Only clear tenant ID (tokens are handled by server clearing HTTP-only cookies)
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
      localStorage.removeItem('tenantId');
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

  // With HTTP-only cookies, authentication state is managed server-side
  // No need for client-side token management
  return context;
}

