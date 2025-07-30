import { useQuery } from '@tanstack/react-query';
import { useTenantId } from './useTenantId';

interface FieldOption {
  value: string;
  label: string;
  color?: string;
  isDefault?: boolean;
}

interface FieldOptionsResponse {
  success: boolean;
  data: FieldOption[];
  total?: number;
}

// Cache inteligente para reduzir chamadas à API
const fieldOptionsCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useTicketMetadata = () => {
  const tenantId = useTenantId();

  const useFieldOptions = (fieldName: string, companyId?: string) => {
    return useQuery<FieldOptionsResponse>({
      queryKey: ['fieldOptions', tenantId, fieldName, companyId || 'default'],
      queryFn: async () => {
        const cacheKey = `${tenantId}-${companyId || 'default'}`;
        const now = Date.now();

        // Verificar cache primeiro
        const cached = fieldOptionsCache.get(cacheKey);
        let allOptions: any[] = [];

        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          console.log(`📦 Using cached field options for ${fieldName}`);
          allOptions = cached.data;
        } else {
          // Buscar da API apenas se necessário
          const params = new URLSearchParams({
            tenantId: tenantId || '',
            ...(companyId && { companyId })
          });

          const response = await fetch(`/api/ticket-config/field-options?${params}`);
          const data = await response.json();
          allOptions = data.data || [];

          // Atualizar cache
          fieldOptionsCache.set(cacheKey, {
            data: allOptions,
            timestamp: now
          });

          console.log(`🔄 Fetched fresh field options for ${fieldName}`);
        }

        // Filter options for specific field
        const filteredOptions = allOptions.filter((option: any) => 
          option.field_name === fieldName
        ).map((option: any) => ({
          value: option.value,
          label: option.label,
          color: option.color,
          isDefault: option.is_default
        }));

        console.log(`🔍 Field options for ${fieldName}:`, {
          total: allOptions.length,
          filtered: filteredOptions.length,
          options: filteredOptions.map(opt => ({ value: opt.value }))
        });

        return {
          success: true,
          data: filteredOptions,
          total: filteredOptions.length
        };
      },
      enabled: !!tenantId && !!fieldName,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  };
}