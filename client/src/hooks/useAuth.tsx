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
  tenantId: string | null;
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
      console.log('Auth check - token exists:', !!token);
      
      if (!token) {
        console.log('No token found, returning null');
        return null;
      }
      
      try {
        console.log('Making auth request...');
        const response = await fetch('/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        console.log('Auth response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log('Auth failed, removing token');
            localStorage.removeItem('accessToken');
            return null;
          }
          console.warn(`Auth check failed: ${response.status}`);
          return null;
        }
        
        const userData = await response.json();
        console.log('Auth successful, user data:', userData);
        return userData || null;
      } catch (error) {
        console.error('Auth query error:', error);
        localStorage.removeItem('accessToken');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest('POST', '/api/auth/login', credentials);
        return await res.json();
      } catch (error) {
        // Login API error handled by UI
        throw error;
      }
    },
    onSuccess: (result: { user: User; accessToken: string }) => {
      localStorage.setItem('accessToken', result.accessToken);
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
  return context;
}