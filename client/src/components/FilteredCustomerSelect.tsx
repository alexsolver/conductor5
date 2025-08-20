import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useCompanyCustomers } from '@/hooks/useCompanyCustomers';
// import { useLocalization } from '@/hooks/useLocalization';

interface FilteredCustomerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  selectedCompanyId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FilteredCustomerSelect({
  // Localization temporarily disabled
 
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
  const { data: companyCustomersData, isLoading: isLoadingCompanyCustomers } = useCompanyCustomers(
    selectedCompanyId && selectedCompanyId !== 'unspecified' ? selectedCompanyId : ''
  );

  const isLoading = isLoadingCustomers || (selectedCompanyId && selectedCompanyId !== 'unspecified' && isLoadingCompanyCustomers);

  // Determinar quais clientes mostrar baseado EXCLUSIVAMENTE na empresa
  let customersToShow = [];

  if (selectedCompanyId && selectedCompanyId !== 'unspecified') {
    // Empresa selecionada - mostrar APENAS clientes desta empresa
    if (isLoadingCompanyCustomers) {
      customersToShow = [];
      console.log('[FilteredCustomerSelect] ⏳ Loading customers for company:', selectedCompanyId);
    } else if (companyCustomersData && Array.isArray(companyCustomersData) && companyCustomersData.length > 0) {
      customersToShow = companyCustomersData;
      console.log('[FilteredCustomerSelect] ✅ FILTERED by company:', {
        companyId: selectedCompanyId, 
        customersCount: customersToShow.length,
        customers: customersToShow.map(c => ({ id: c.id, name: c.name || c.fullName, email: c.email }))
      });
    } else {
      customersToShow = [];
      console.log('[FilteredCustomerSelect] ❌ No customers found for company:', selectedCompanyId, 'Data:', companyCustomersData);
    }
  } else {
    // Nenhuma empresa selecionada - mostrar todos os clientes
    customersToShow = allCustomersData?.success ? (allCustomersData.customers || []) : [];
    console.log('[FilteredCustomerSelect] 🌐 Showing ALL customers (no company filter):', {
      companyId: selectedCompanyId,
      customersCount: customersToShow.length
    });
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
        </SelectTrigger>
      </Select>
    );
  }

  console.log('[FilteredCustomerSelect] Render:', { 
    value, 
    disabled, 
    customersCount: customersToShow.length,
    selectedCompanyId,
    valueMatchesCustomer: (() => {
      const foundCustomer = customersToShow.find(c => c.id === value);
      return foundCustomer ? (foundCustomer.fullName || foundCustomer.name || foundCustomer.email) : 'NOT FOUND';
    })()
  });

  return (
    <Select 
      value={value || '__none__'} 
      onValueChange={(val) => {
        console.log('[FilteredCustomerSelect] Value change:', { from: value, to: val });
        onChange(val === '__none__' ? '' : val);
      }} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {customersToShow.length === 0 && selectedCompanyId && selectedCompanyId !== 'unspecified' ? (
          <SelectItem value="__no_customers__" disabled>
            Nenhum cliente encontrado para esta empresa
          </SelectItem>
        ) : (
          <>
            <SelectItem value="__none__">Nenhum cliente</SelectItem>
            <SelectItem value="unspecified">Não especificado</SelectItem>
            {customersToShow.map((customer: any) => {
              const customerName = customer.fullName || customer.name || 
                                  "
                                  customer.email || 'Cliente sem nome';
              // Ensure customer.id is not empty or undefined
              const customerId = customer.id || "

              return (
                <SelectItem key={customerId} value={customerId}>
                  <div className="flex flex-col">
                    <span>{customerName}</span>
                    <span className="text-sm text-gray-500">
                      {customer.email} {customer.cpf && "
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </>
        )}
      </SelectContent>
    </Select>
  );
}