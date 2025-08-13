import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customerType?: string;
  companyName?: string;
  status: string;
  // Associated customers have additional fields
  role?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  memberSince?: string;
}

interface CustomerWithAssociation extends Customer {
  isAssociated: boolean;
  associationStatus?: 'active' | 'inactive';
}

export function useCompanyCustomers(companyId: string) {
  return useQuery({
    queryKey: ['company-customers', companyId],
    queryFn: async () => {
      try {
        console.log('🔍 [useCompanyCustomers] Fetching customers for company:', companyId);

        // Use the existing API endpoint that works
        const response = await apiRequest('GET', `/api/companies/${companyId}/associated`);

        console.log('✅ [useCompanyCustomers] API response:', response);

        // Transform the response to match expected format
        if (Array.isArray(response)) {
          return response.map((customer: any) => ({
            ...customer,
            isAssociated: true // All customers from this endpoint are associated
          }));
        }

        return response?.data || [];
      } catch (error) {
        console.error('❌ [useCompanyCustomers] Error:', error);
        // Return empty array on error to prevent UI crashes
        return [];
      }
    },
    enabled: !!companyId && companyId !== '',
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}