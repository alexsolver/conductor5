
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';

// ✅ 1QA.MD: Enhanced authentication context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  tenantId: string | null;
}

interface User {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 1QA.MD: Enhanced authentication check
  const checkAuth = async () => {
    try {
      console.log('🔍 [AUTH-QUERY] Making auth check request with HTTP-only cookies...');
      
      const response = await axios.get('/api/auth/me', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data?.user) {
        setUser(response.data.user);
        // ✅ Store tenant ID for compatibility
        if (response.data.user.tenantId) {
          localStorage.setItem('tenantId', response.data.user.tenantId);
        }
      }
    } catch (error) {
      console.log('❌ [AUTH-CHECK] Authentication failed:', error);
      setUser(null);
      localStorage.removeItem('tenantId');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 1QA.MD: Enhanced login function with proper error handling
  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 [LOGIN] Starting login process...');
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('🔍 [LOGIN] Response status:', response.status);
      console.log('🔍 [LOGIN] Response data structure:', Object.keys(response.data));

      if (response.data?.success && response.data?.data?.user) {
        console.log('✅ [LOGIN] Login successful - tokens stored in HTTP-only cookies');
        
        setUser(response.data.data.user);
        
        // ✅ 1QA.MD: Store tenant ID for compatibility
        if (response.data.data.user.tenantId) {
          localStorage.setItem('tenantId', response.data.data.user.tenantId);
          console.log('📦 [LOGIN-SUCCESS] Tenant ID stored for compatibility');
        }

        console.log('✅ [LOGIN-SUCCESS] User authenticated via HTTP-only cookies');
        console.log('✅ [LOGIN-SUCCESS] Login completed successfully');
      } else {
        throw new Error('Invalid response format from login API');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Login failed:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        const message = axiosError.response?.data?.message || 'Login failed';
        throw new Error(message);
      }
      
      throw new Error('Network error during login');
    }
  };

  // ✅ 1QA.MD: Enhanced logout function
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('tenantId');
      // Force page reload to clear any cached state
      window.location.href = '/auth';
    }
  };

  // ✅ 1QA.MD: Setup axios interceptors for token management
  useEffect(() => {
    // Request interceptor - ensure credentials are always sent
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // ✅ Always send credentials for API requests
        config.withCredentials = true;
        
        // ✅ Ensure proper headers
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('🔄 [API-INTERCEPTOR] 401 detected, attempting token refresh...');
          
          try {
            await axios.post('/api/auth/refresh', {}, {
              withCredentials: true
            });
            
            // Retry the original request
            return axios.request(error.config);
          } catch (refreshError) {
            console.log('❌ [API-INTERCEPTOR] Refresh failed, redirecting to login');
            setUser(null);
            localStorage.removeItem('tenantId');
            window.location.href = '/auth';
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup function
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // ✅ 1QA.MD: Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    tenantId: user?.tenantId || localStorage.getItem('tenantId'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
