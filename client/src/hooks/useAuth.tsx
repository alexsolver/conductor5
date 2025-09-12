import React, { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
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
  loginMutation: UseMutationResult<{ user: User; session?: any }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User; tenant?: { id: string; name: string; subdomain: string } }, Error, RegisterData>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // State for authentication management
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  // Improved logout function
  const logout = useCallback(async () => {
    try {
      console.log('🔐 [LOGOUT] Logging out user...');
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('❌ [LOGOUT] Logout error:', error);
    } finally {
      console.log('🧹 [LOGOUT] Cleaning up user session...');
      setUser(null);
      queryClient.clear();
      // Clear any stored tenant info
      localStorage.removeItem('tenantId');
      // Clear any other auth-related data
      localStorage.removeItem('authState');
      // Redirect to login
      console.log('🔄 [LOGOUT] Redirecting to auth page...');
      window.location.href = '/auth';
    }
  }, [queryClient]);

  // Function to check authentication status
  const checkAuth = async () => {
    try {
      setIsLoading(true);

      // Check if we have an access token in cookies
      // Note: Accessing document.cookie directly is a client-side operation
      const hasToken = document.cookie.includes('accessToken=');

      if (!hasToken) {
        console.log('🔍 [AUTH] No access token found in cookies');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('🔍 [AUTH] Access token found, validating...');

      // Fetch user data from /api/auth/me endpoint
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Essential for sending HTTP-only cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ [AUTH] User validated successfully');
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('❌ [AUTH] Token validation failed');
        // If validation fails, attempt to refresh the token
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          // If refresh was successful, re-fetch user data
          console.log('🔄 [AUTH] Token refreshed, re-fetching user data...');
          await checkAuth(); // Re-run checkAuth to get updated user data
          return;
        } else {
          // If refresh also failed, clear session and redirect
          console.log('❌ [AUTH] Token refresh failed, logging out...');
          await logout();
        }
        setIsAuthenticated(false);
        setUser(null);
        // Clear invalid token by setting an expired cookie
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
      }
    } catch (error) {
      console.error('❌ [AUTH] Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to run checkAuth when the component mounts
  useEffect(() => {
    setMounted(true); // Mark as mounted
    checkAuth();
  }, []);


  // Mutation for login
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
          credentials: 'include', // Send HTTP-only cookies
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
          console.log('✅ [LOGIN] Login successful - tokens stored in HTTP-only cookies');
          return {
            user: responseData.data.user,
            session: responseData.data.session // Assuming session might contain other auth info
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

      // Update the local user state and invalidate any existing /api/auth/user query
      queryClient.setQueryData(['/api/auth/user'], result.user);
      setUser(result.user); // Update local state
      setIsAuthenticated(true); // Set isAuthenticated to true
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

  // Mutation for registration
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      try {
        console.log('🔐 [REGISTER] Starting registration process...');
        
        // Using apiRequest here, assuming it correctly handles POST requests
        const res = await apiRequest('POST', '/api/auth/register', credentials);
        
        if (!res.ok) {
          let errorMessage = 'Registration failed';
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
            console.error('❌ [REGISTER] Error response:', errorData);
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const responseData = await res.json();
        console.log('🔍 [REGISTER] Response data structure:', Object.keys(responseData));
        
        // Validate response structure
        if (!responseData || (!responseData.user && !responseData.data?.user)) {
          console.error('❌ [REGISTER] Invalid response structure:', responseData);
          throw new Error('Invalid registration response from server');
        }

        // Handle different response formats
        if (responseData.data?.user) {
          return {
            user: responseData.data.user,
            tenant: responseData.data.tenant || responseData.tenant
          };
        } else if (responseData.user) {
          return {
            user: responseData.user,
            tenant: responseData.tenant
          };
        }

        throw new Error('User data not found in response');
      } catch (error) {
        console.error('❌ [REGISTER] Registration error:', error);
        throw error;
      }
    },
    onSuccess: (result: { user: User; tenant?: { id: string; name: string; subdomain: string } }) => {
      // Validate that we have a user object
      if (!result || !result.user) {
        console.error('❌ [REGISTER-SUCCESS] Invalid registration response - missing user data');
        toast({
          title: 'Registration failed',
          description: 'Invalid response from server. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Store tenantId for quick access by components (tokens are now HTTP-only cookies)
      if (result.user?.tenantId) {
        localStorage.setItem('tenantId', result.user.tenantId);
      }
      queryClient.setQueryData(['/api/auth/user'], result.user);
      setUser(result.user); // Update local state
      setIsAuthenticated(true); // Set isAuthenticated to true

      if (result.tenant) {
        toast({
          title: 'Workspace criado com sucesso!',
          description: `Bem-vindo ao Conductor! Seu workspace "${result.tenant.name}" foi criado e você é o administrador.`,
        });
      } else {
        toast({
          title: 'Registro realizado com sucesso',
          description: `Bem-vindo ao Conductor, ${result.user?.firstName || result.user?.email || 'usuário'}!`,
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

  // Mutation for logout (used by refreshToken if it fails)
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include HTTP-only cookies for server-side session invalidation
        });
      } catch (error) {
        console.warn('Logout API call failed:', error);
        // Continue with logout even if API call fails
      }
    },
    onSuccess: () => {
      // Clear local state and cached data
      localStorage.removeItem('tenantId');
      setUser(null); // Clear user state
      setIsAuthenticated(false); // Set isAuthenticated to false
      queryClient.setQueryData(['/api/auth/user'], null); // Invalidate user query
      queryClient.clear(); // Clear all cached data
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Still clear local state on error to ensure consistency
      localStorage.removeItem('tenantId');
      setUser(null);
      setIsAuthenticated(false);
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
    },
  });

  // Refactored token refresh logic
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 [REFRESH] Attempting token refresh via HTTP-only cookies...');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [REFRESH] Token refreshed successfully via HTTP-only cookies');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [REFRESH] Refresh failed:', response.status, errorData.message || response.statusText);

        // If refresh token is expired/invalid, logout user
        if (response.status === 401 || response.status === 400) {
          console.log('🔄 [REFRESH] Refresh token expired, logging out user...');
          await logout();
        }
        return false;
      }
    } catch (error) {
      console.error('❌ [REFRESH] Token refresh error:', error);
      // On network errors, also logout to force re-authentication
      console.log('🔄 [REFRESH] Network error during refresh, logging out user...');
      await logout();
      return false;
    }
  }, [logout]);


  // Combine all states and mutations into the context value
  const value = {
    user: user ?? null, // Ensure user is null if not loaded or logged out
    isLoading: isLoading || !mounted, // Show loading if still processing initial auth check or not yet mounted
    error: null, // Error state is handled within mutations/checkAuth, keeping this for interface compatibility
    isAuthenticated,
    loginMutation,
    logoutMutation, // Pass logoutMutation to the context
    registerMutation,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // With HTTP-only cookies, authentication state is managed server-side.
  // Client-side state (user, isAuthenticated, isLoading) is derived from the checkAuth effect.
  return context;
}