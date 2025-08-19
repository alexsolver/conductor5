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
  loginMutation: UseMutationResult<{ user: User; accessToken: string; refreshToken?: string; session?: any }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User; accessToken: string; tenant?: { id: string; name: string; subdomain: string } }, Error, RegisterData>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Use local state for user data, as tokens are in HTTP-only cookies
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 [LOGIN] Starting login process...');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for cookies
      });

      console.log('🔍 [LOGIN] Response status:', response.status);

      const data = await response.json();
      console.log('🔍 [LOGIN] Response data structure:', Object.keys(data));

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ Handle response format (tokens are now in HTTP-only cookies)
      let userData;
      if (data.success) {
        console.log('✅ [LOGIN] Using structured response format');
        userData = data.data?.user;
      } else {
        console.log('✅ [LOGIN] Using legacy response format');
        userData = data.user;
      }

      if (!userData) {
        throw new Error('Invalid login response format');
      }

      console.log('✅ [LOGIN-SUCCESS] Storing user data (tokens in HTTP-only cookies)');

      // Store tenant ID if available (only non-sensitive data in localStorage)
      if (userData.tenantId) {
        localStorage.setItem('tenantId', userData.tenantId);
        console.log('📦 [LOGIN-SUCCESS] Tenant ID stored:', userData.tenantId);
      }

      setUser(userData);
      console.log('✅ [LOGIN-SUCCESS] Login completed successfully with HTTP-only cookies');

      return true;
    } catch (error) {
      console.error('❌ [LOGIN-ERROR] Login failed:', error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint (cookies will be cleared server-side)
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Important for cookies
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state (only non-sensitive data)
      setUser(null);
      localStorage.removeItem('tenantId');

      // Redirect to login
      window.location.href = '/auth';
    }
  };

  // Check authentication status
  const checkAuth = async () => {
    try {
      console.log('🔍 [AUTH-QUERY] Making auth check request...');

      const response = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Cookies will be sent automatically
      });

      if (!response.ok) {
        console.warn(`⚠️ [AUTH-QUERY] Auth check failed: ${response.status}`);
        setUser(null);
        localStorage.removeItem('tenantId'); // Clear tenantId on failed auth
        setIsLoading(false);
        return;
      }

      const userData = await response.json();
      console.log('✅ [AUTH-QUERY] Auth check successful');
      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.warn('⚠️ [AUTH-QUERY] Auth query error:', error.message);
      setUser(null);
      localStorage.removeItem('tenantId'); // Clear tenantId on auth error
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const success = await login(credentials.email, credentials.password);
      if (!success) {
        // Error is already logged and toast is shown by the login function
        throw new Error('Login failed, please check logs.');
      }
      // Re-fetch user data after successful login to get updated info
      await checkAuth();
      return { user: user!, accessToken: '', refreshToken: '' }; // Dummy return as tokens are in cookies
    },
    onSuccess: () => {
      toast({
        title: 'Login successful',
        description: `Welcome back, ${user?.firstName || user?.email}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });

        if (!response.ok) {
          let errorMessage = 'Registration failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Assuming registration also returns user and tokens (now in cookies)
        const userData = data.user || data.data?.user;
        if (!userData) {
          throw new Error('Invalid registration response format');
        }

        // Store tenant ID if available
        if (userData.tenantId) {
          localStorage.setItem('tenantId', userData.tenantId);
        }

        setUser(userData);
        toast({
          title: 'Registration successful',
          description: `Welcome to Conductor, ${userData.firstName || userData.email}!`,
        });
        return { user: userData, accessToken: '' }; // Dummy return
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
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

  // Remove direct token state and management
  // const [token, setToken] = React.useState(localStorage.getItem('accessToken'));

  // No need for auto-refresh logic if tokens are HTTP-only and managed by the browser/server
  // React.useEffect(() => { ... auto-refresh logic ... }, [context.user]);

  // Remove refreshToken function as tokens are managed by cookies
  // const refreshToken = async () => { ... }

  return {
    ...context,
    // token // Remove token from return value
    // refreshToken // Remove refreshToken from return value
  };
}