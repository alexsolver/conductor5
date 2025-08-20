import { useAuth } from './useAuth';

/**
 * Custom hook to reliably get tenantId from authentication context
 * Provides fallback mechanisms for components that need tenantId
 */
export function useTenantId(): string | null {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return null;
  }

  // Primary: get from authenticated user object
  if (user.tenantId) {
    return user.tenantId;
  }

  // Fallback: check localStorage for stored tenantId
  const storedTenantId = localStorage.getItem('tenantId') || localStorage.getItem('tenant_id');
  if (storedTenantId) {
    return storedTenantId;
  }

  // Last resort: extract from token
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.tenantId || payload.tenant_id || null;
    }
  } catch (error) {
    console.warn('Failed to extract tenantId from token:', error);
  }

  return null;
}

/**
 * Utility function to get tenantId from token - used by DynamicSelect
 */
export function getTenantIdFromToken(token: string | null): string | null {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.tenantId || payload.tenant_id || null;
  } catch (error) {
    console.warn('Failed to parse token for tenantId:', error);
    return null;
  }
}