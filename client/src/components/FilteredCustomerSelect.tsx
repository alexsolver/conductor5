import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

interface FilteredCustomerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  selectedCompanyId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FilteredCustomerSelect({ 
  value, 
  onChange, 
  selectedCompanyId,
  placeholder = "Selecionar cliente", 
  disabled = false,
  className = ""
}: FilteredCustomerSelectProps) {
  // Buscar todos os clientes
  const { data: allCustomersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers');
      return response.json();
    },
  });

  // Buscar clientes da empresa se uma empresa foi selecionada
  const { data: companyCustomersData, isLoading: isLoadingCompanyCustomers } = useQuery({
    queryKey: ['/api/companies', selectedCompanyId, 'customers'],
    queryFn: async () => {
      if (!selectedCompanyId) return { customers: [] };
      const response = await apiRequest('GET', `/api/companies/${selectedCompanyId}/customers`);
      return response.json();
    },
    enabled: !!selectedCompanyId,
  });

  const isLoading = isLoadingCustomers || (selectedCompanyId && isLoadingCompanyCustomers);
  
  // Determinar quais clientes mostrar
  let customersToShow = [];
  if (selectedCompanyId && companyCustomersData?.customers) {
    // Se uma empresa foi selecionada, mostrar apenas clientes da empresa
    customersToShow = companyCustomersData.customers;
    console.log('[FilteredCustomerSelect] Showing company customers:', {
      companyId: selectedCompanyId, 
      customersCount: customersToShow.length,
      customers: customersToShow.map(c => ({ id: c.id, name: c.name || c.fullName, email: c.email }))
    });
  } else if (allCustomersData?.success) {
    // Se nenhuma empresa foi selecionada, mostrar todos os clientes
    customersToShow = allCustomersData.customers || [];
    console.log('[FilteredCustomerSelect] Showing all customers:', {
      companyId: selectedCompanyId,
      customersCount: customersToShow.length,
      customers: customersToShow.map(c => ({ id: c.id, name: c.name || c.fullName, email: c.email }))
    });
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Carregando clientes..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select 
      value={value || '__none__'} 
      onValueChange={(val) => onChange(val === '__none__' ? '' : val)} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Nenhum cliente</SelectItem>
        <SelectItem value="unspecified">Não especificado</SelectItem>
        {customersToShow.map((customer: any) => {
          const customerName = customer.fullName || customer.name || 
                              `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 
                              customer.email || 'Cliente sem nome';
          return (
            <SelectItem key={customer.id} value={customer.id}>
              <div className="flex flex-col">
                <span>{customerName}</span>
                <span className="text-sm text-gray-500">
                  {customer.email} {customer.cpf && `• CPF: ${customer.cpf}`}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}