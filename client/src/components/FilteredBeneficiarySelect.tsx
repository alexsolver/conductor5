import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

interface FilteredBeneficiarySelectProps {
  value?: string;
  onChange: (value: string) => void;
  selectedCustomerId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FilteredBeneficiarySelect({ 
  value, 
  onChange, 
  selectedCustomerId,
  placeholder = "Selecionar beneficiário", 
  disabled = false,
  className = ""
}: FilteredBeneficiarySelectProps) {
  // Buscar todos os beneficiários
  const { data: allBeneficiariesData, isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['/api/beneficiaries'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/beneficiaries');
      return response.json();
    },
  });

  // Buscar beneficiários do cliente se um cliente foi selecionado
  const { data: customerBeneficiariesData, isLoading: isLoadingCustomerBeneficiaries } = useQuery({
    queryKey: ['/api/customers', selectedCustomerId, 'beneficiaries'],
    queryFn: async () => {
      if (!selectedCustomerId || selectedCustomerId === 'unspecified') return { beneficiaries: [] };
      const response = await apiRequest('GET', `/api/customers/${selectedCustomerId}/beneficiaries`);
      return response.json();
    },
    enabled: !!selectedCustomerId && selectedCustomerId !== 'unspecified',
  });

  const isLoading = isLoadingBeneficiaries || (selectedCustomerId && selectedCustomerId !== 'unspecified' && isLoadingCustomerBeneficiaries);
  
  // Determinar quais beneficiários mostrar baseado no cliente selecionado
  let beneficiariesToShow = [];
  
  if (selectedCustomerId && selectedCustomerId !== 'unspecified') {
    // Cliente selecionado - mostrar APENAS beneficiários deste cliente
    if (customerBeneficiariesData?.success && customerBeneficiariesData?.beneficiaries) {
      beneficiariesToShow = customerBeneficiariesData.beneficiaries;
      console.log('[FilteredBeneficiarySelect] ✅ FILTERED by customer (API):', {
        customerId: selectedCustomerId, 
        beneficiariesCount: beneficiariesToShow.length,
        beneficiaries: beneficiariesToShow.map(b => ({ 
          id: b.id, 
          name: b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim(),
          email: b.email 
        }))
      });
    } else if (isLoadingCustomerBeneficiaries) {
      beneficiariesToShow = [];
      console.log('[FilteredBeneficiarySelect] ⏳ Loading beneficiaries for customer:', selectedCustomerId);
    } else {
      // Fallback: filtrar da lista geral por customerId
      const allBeneficiaries = allBeneficiariesData?.success ? (allBeneficiariesData.beneficiaries || []) : [];
      beneficiariesToShow = allBeneficiaries.filter((b: any) => 
        b.customerId === selectedCustomerId || 
        b.customer_id === selectedCustomerId
      );
      console.log('[FilteredBeneficiarySelect] 🔍 FILTERED from all beneficiaries by customerId (fallback):', {
        customerId: selectedCustomerId,
        totalBeneficiaries: allBeneficiaries.length,
        filteredCount: beneficiariesToShow.length
      });
    }
  } else {
    // Nenhum cliente selecionado - mostrar todos os beneficiários
    beneficiariesToShow = allBeneficiariesData?.success ? (allBeneficiariesData.beneficiaries || []) : [];
    console.log('[FilteredBeneficiarySelect] 🌐 Showing ALL beneficiaries (no customer filter):', {
      customerId: selectedCustomerId,
      beneficiariesCount: beneficiariesToShow.length
    });
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Carregando beneficiários..." />
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
        {beneficiariesToShow.length === 0 && selectedCustomerId && selectedCustomerId !== 'unspecified' ? (
          <SelectItem value="__no_beneficiaries__" disabled>
            Nenhum beneficiário encontrado para este cliente
          </SelectItem>
        ) : (
          <>
            <SelectItem value="__none__">Nenhum beneficiário</SelectItem>
            <SelectItem value="unspecified">Não especificado</SelectItem>
            {beneficiariesToShow.map((beneficiary: any) => {
              const beneficiaryName = `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim() || 
                                     beneficiary.fullName || beneficiary.name || 
                                     beneficiary.email || 'Beneficiário sem nome';
              return (
                <SelectItem key={beneficiary.id} value={beneficiary.id}>
                  <div className="flex flex-col">
                    <span>{beneficiaryName}</span>
                    <span className="text-sm text-gray-500">
                      {beneficiary.email} {beneficiary.cpfCnpj && `• CPF/CNPJ: ${beneficiary.cpfCnpj}`}
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