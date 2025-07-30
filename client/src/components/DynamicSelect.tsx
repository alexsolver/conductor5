/**
 * DynamicSelect - Dynamic select component for ticket fields
 * Uses configuration from backend to populate options
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTicketMetadata } from "@/hooks/useTicketMetadata";
import { AlertCircle, Loader2 } from "lucide-react";
import { filterDOMProps } from "@/utils/propFiltering";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTenantIdFromToken } from "@/hooks/useTenantId";

interface DynamicSelectProps {
  fieldName: string;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void; // Support both prop names
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  onOptionSelect?: (option: any) => void;
  [key: string]: any; // Para props adicionais que serão filtradas
}

export function DynamicSelect(props: DynamicSelectProps) {
  const {
    fieldName,
    value,
    onChange,
    onValueChange, // Also support onValueChange prop
    placeholder,
    className,
    disabled = false,
    showAllOption = false,
    onOptionSelect,
    ...restProps
  } = props;

  // 🚨 CORREÇÃO: Filtragem consistente de props usando utilitário
  const cleanProps = filterDOMProps(restProps, ['fieldName', 'onChange', 'showAllOption', 'onOptionSelect']);
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  // Obter tenant_id do user context com fallback robusto
  const tenantId = user?.tenantId || localStorage.getItem('tenantId') || localStorage.getItem('tenant_id');

  useEffect(() => {
    const fetchFieldOptions = async () => {
      try {
        // Enhanced token retrieval with comprehensive fallbacks and debugging
      const getToken = () => {
        // Check all possible localStorage keys
        const localKeys = ['accessToken', 'token', 'access_token', 'authToken'];
        for (const key of localKeys) {
          const token = localStorage.getItem(key);
          if (token) {
            console.log(`🔑 Token found in localStorage:${key}`, token.substring(0, 20) + '...');
            return token;
          }
        }

        // Check sessionStorage
        for (const key of localKeys) {
          const token = sessionStorage.getItem(key);
          if (token) {
            console.log(`🔑 Token found in sessionStorage:${key}`, token.substring(0, 20) + '...');
            return token;
          }
        }

        // Try document.cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (localKeys.includes(name) && value) {
            console.log(`🔑 Token found in cookie:${name}`, value.substring(0, 20) + '...');
            return value;
          }
        }

        console.warn('🚫 No token found in any storage location');
        return null;
      };

      // Enhanced tenant ID extraction with comprehensive debugging
      const getTenantId = (token) => {
        console.log('🔍 getTenantId called with:', { 
          tokenPresent: !!token, 
          propTenantId: tenantId,
          tokenLength: token?.length 
        });

        // First try from props/context
        if (tenantId) {
          console.log('✅ Using tenantId from props:', tenantId);
          return tenantId;
        }

        // Try to extract from token payload
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length !== 3) {
              console.warn('🚫 Invalid JWT format - expected 3 parts, got:', parts.length);
              return null;
            }

            const payload = JSON.parse(atob(parts[1]));
            console.log('🔍 Token payload extracted:', { 
              tenantId: payload.tenantId, 
              tenant_id: payload.tenant_id,
              userId: payload.userId,
              email: payload.email,
              allKeys: Object.keys(payload) 
            });

            if (payload.tenantId) {
              console.log('✅ Using tenantId from token payload:', payload.tenantId);
              return payload.tenantId;
            }
            if (payload.tenant_id) {
              console.log('✅ Using tenant_id from token payload:', payload.tenant_id);
              return payload.tenant_id;
            }
          } catch (error) {
            console.error('❌ Could not parse token for tenantId:', error);
          }
        }

        // Try from localStorage
        const tenantKeys = ['tenantId', 'tenant_id', 'currentTenantId'];
        for (const key of tenantKeys) {
          const storedTenantId = localStorage.getItem(key);
          if (storedTenantId) {
            console.log(`✅ Using tenantId from localStorage:${key}:`, storedTenantId);
            return storedTenantId;
          }
        }

        // Try from sessionStorage
        for (const key of tenantKeys) {
          const sessionTenantId = sessionStorage.getItem(key);
          if (sessionTenantId) {
            console.log(`✅ Using tenantId from sessionStorage:${key}:`, sessionTenantId);
            return sessionTenantId;
          }
        }

        console.warn('🚫 No tenantId found in any location');
        return null;
      };

      const token = getToken();
      const resolvedTenantId = tenantId || getTenantId(token);

      // Comprehensive debug for tenant ID resolution
      console.log('🔍 DynamicSelect for ' + fieldName + ':', {
        totalOptions: fieldOptions.length,
        isLoading,
        token: token ? 'present' : 'missing',
        tokenLength: token?.length,
        tenantId: resolvedTenantId,
        providedTenantId: tenantId,
        fieldOptions: fieldOptions.slice(0, 3)
      });

      if (!token || !resolvedTenantId) {
        console.warn(`🚫 Missing requirements for ${fieldName}:`, { 
          token: !!token, 
          tenantId: !!resolvedTenantId,
          providedTenantId: !!tenantId 
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/ticket-field-options/${fieldName}?tenantId=${resolvedTenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': resolvedTenantId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 Field options response for ${fieldName}:`, data);

        // Handle both direct options array and response wrapper
        const options = data.options || data.data || data || [];
        console.log(`✅ Processed ${options.length} options for ${fieldName}:`, options);
        setFieldOptions(options);
      } else {
        console.error(`Failed to fetch field options for ${fieldName}:`, response.status);
        const errorText = await response.text();
        console.error('Response error:', errorText);
        setFieldOptions([]);
      }
    } catch (error) {
      console.error('Error fetching field options:', error);
      setFieldOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchFieldOptions();
  }, [fieldName, tenantId]);

  const handleSelectChange = (value: string) => {
    // Support both onChange and onValueChange prop names
    const callback = onChange || onValueChange;
    
    if (typeof callback === 'function') {
      callback(value);
    } else {
      console.warn('DynamicSelect: No valid callback provided', { 
        onChange: typeof onChange, 
        onValueChange: typeof onValueChange 
      });
    }

    // Se há uma opção selecionada, pegar seus dados completos
    const selectedOption = fieldOptions.find(opt => opt.value === value);
    if (selectedOption && typeof onOptionSelect === 'function') {
      onOptionSelect(selectedOption);
    }
  };

  // Debug logging with enhanced token detection
  const debugToken = localStorage.getItem('accessToken') || 
                    localStorage.getItem('token') || 
                    sessionStorage.getItem('accessToken') ||
                    sessionStorage.getItem('token');

  console.log(`🔍 DynamicSelect for ${fieldName}:`, {
    totalOptions: fieldOptions.length,
    filteredOptions: fieldOptions.length,
    isLoading,
    token: debugToken ? 'present' : 'missing',
    tokenLength: debugToken ? debugToken.length : 0,
    tenantId: localStorage.getItem('tenantId') || localStorage.getItem('tenant_id'),
    fieldOptions: fieldOptions.slice(0, 3), // Show first 3 for debugging
    storageKeys: Object.keys(localStorage),
    sessionKeys: Object.keys(sessionStorage)
  });

  // CRITICAL: Enhanced token validation logging
  if (!debugToken || debugToken === 'null' || debugToken === 'undefined' || debugToken === '') {
    console.error(`❌ Token missing or invalid for ${fieldName} - this will cause API calls to fail`);
    console.error('LocalStorage keys:', Object.keys(localStorage));
    console.error('SessionStorage keys:', Object.keys(sessionStorage));
    console.error('Document cookies:', document.cookie);
  }

  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || `Selecione ${fieldName}...`} />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>Carregando...</SelectItem>
        ) : fieldOptions.length === 0 ? (
          <SelectItem value="no-options" disabled>Nenhuma opção disponível</SelectItem>
        ) : (
          fieldOptions.map((option, index) => {
            // Ensure option has proper structure and non-empty value
            const value = option.value || option.id || `option-${index}`;
            const label = option.label || option.name || option.display_name || value;

            // Skip items with empty values to avoid Radix error
            if (!value || value === '') return null;

            return (
              <SelectItem key={value} value={value}>
                <div className="flex items-center space-x-2">
                  {option.color && (
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{label}</span>
                </div>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}