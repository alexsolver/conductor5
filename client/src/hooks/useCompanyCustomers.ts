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

export function useCompanyCustomers(companyId: string) {
  // Query for all customers
  const allCustomersQuery = useQuery({
    queryKey: ['/api/customers'],
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Query for associated customers (already members of this company)
  const associatedQuery = useQuery({
    queryKey: [`/api/companies/${companyId}/associated`],
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Parse all customers data
  const allCustomers: Customer[] = (() => {
    if (!allCustomersQuery.data) return [];
    
    let customers: Customer[] = [];
    
    // Handle the format: {"customers": [...]}
    if (allCustomersQuery.data.customers && Array.isArray(allCustomersQuery.data.customers)) {
      customers = allCustomersQuery.data.customers;
    } else if (allCustomersQuery.data.success && Array.isArray(allCustomersQuery.data.data)) {
      customers = allCustomersQuery.data.data;
    } else if (Array.isArray(allCustomersQuery.data)) {
      customers = allCustomersQuery.data;
    }
    
    // Sort to prioritize Default company customers
    return customers.sort((a, b) => {
      const aIsDefault = a.companyName?.toLowerCase().includes('default');
      const bIsDefault = b.companyName?.toLowerCase().includes('default');
      
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      
      // Secondary sort by name
      return (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName);
    });
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

  // Create a Set of associated customer IDs for quick lookup
  const associatedCustomerIds = new Set(associatedCustomers.map(customer => customer.id));

  // Combine all customers with association status
  const customersWithAssociation: CustomerWithAssociation[] = allCustomers.map(customer => ({
    ...customer,
    isAssociated: associatedCustomerIds.has(customer.id),
    associationStatus: (() => {
      const associatedCustomer = associatedCustomers.find(ac => ac.id === customer.id);
      return associatedCustomer?.isActive ? 'active' : 'inactive';
    })()
  }));



  // Separate for backward compatibility
  const availableCustomers = customersWithAssociation.filter(c => !c.isAssociated);
  const onlyAssociatedCustomers = customersWithAssociation.filter(c => c.isAssociated);

  return {
    allCustomers: customersWithAssociation,
    availableCustomers,
    associatedCustomers: onlyAssociatedCustomers,
    isLoading: allCustomersQuery.isLoading || associatedQuery.isLoading,
    error: allCustomersQuery.error || associatedQuery.error,
    refetch: () => {
      allCustomersQuery.refetch();
      associatedQuery.refetch();
    }
  };
}