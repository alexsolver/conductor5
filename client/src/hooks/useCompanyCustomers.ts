import { useQuery } from "@tanstack/react-query";

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

export function useCompanyCustomers(companyId?: string) {
  return useQuery({
    queryKey: ['customers', 'by-company', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // ✅ Use the corrected endpoint
      const response = await fetch(`/api/companies/${companyId}/customers`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}