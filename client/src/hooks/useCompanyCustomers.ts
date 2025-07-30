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

export function useCompanyCustomers(companyId: string) {
  // Query for available customers (not associated with this company)
  const availableQuery = useQuery({
    queryKey: [`/api/customers/companies/${companyId}/available`],
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Query for associated customers (already members of this company)
  const associatedQuery = useQuery({
    queryKey: [`/api/customers/companies/${companyId}/associated`],
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Parse available customers data
  const availableCustomers: Customer[] = (() => {
    if (!availableQuery.data) return [];
    if (availableQuery.data.success && Array.isArray(availableQuery.data.data)) {
      return availableQuery.data.data;
    }
    if (Array.isArray(availableQuery.data)) return availableQuery.data;
    return [];
  })();

  // Parse associated customers data
  const associatedCustomers: Customer[] = (() => {
    if (!associatedQuery.data) return [];
    if (associatedQuery.data.success && Array.isArray(associatedQuery.data.data)) {
      return associatedQuery.data.data;
    }
    if (Array.isArray(associatedQuery.data)) return associatedQuery.data;
    return [];
  })();

  return {
    availableCustomers,
    associatedCustomers,
    isLoading: availableQuery.isLoading || associatedQuery.isLoading,
    error: availableQuery.error || associatedQuery.error,
    refetch: () => {
      availableQuery.refetch();
      associatedQuery.refetch();
    }
  };
}