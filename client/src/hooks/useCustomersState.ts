
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCustomersState() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const { data: customersData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers');
      return await response.json();
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const allCustomers = customersData?.customers || [];

  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
        const email = customer.email?.toLowerCase() || '';
        const phone = (customer.phone || customer.mobile_phone || '').toLowerCase();
        
        const matchesSearch = fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               phone.includes(searchLower);
               
        if (!matchesSearch) return false;
      }
      
      // Filtro de tipo
      if (customerTypeFilter !== 'all') {
        const customerType = customer.customer_type || 'PF';
        if (customerType !== customerTypeFilter) return false;
      }
      
      // Filtro de status
      if (statusFilter !== 'all') {
        const status = customer.status || 'active';
        if (status !== statusFilter) return false;
      }
      
      return true;
    });
  }, [allCustomers, searchTerm, customerTypeFilter, statusFilter]);

  return {
    // Data
    customers: filteredCustomers,
    allCustomers,
    total: allCustomers.length,
    
    // States
    searchTerm,
    customerTypeFilter,
    statusFilter,
    selectedCustomer,
    isCustomerModalOpen,
    
    // Setters
    setSearchTerm,
    setCustomerTypeFilter,
    setStatusFilter,
    setSelectedCustomer,
    setIsCustomerModalOpen,
    
    // Query states
    isLoading,
    error,
    refetch,
  };
}
