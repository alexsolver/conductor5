import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
// import { useLocalization } from '@/hooks/useLocalization';

interface FilteredBeneficiarySelectProps {
  value?: string;
  onChange: (value: string) => void;
  selectedCustomerId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FilteredBeneficiarySelect({
  // Localization temporarily disabled
 
  value, 
  onChange, 
  selectedCustomerId,
  placeholder = "Selecionar favorecido", 
  disabled = false,
  className = ""
}: FilteredBeneficiarySelectProps) {
  // Buscar todos os favorecidos
  const { data: allBeneficiariesData, isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['/api/beneficiaries'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/beneficiaries');
      return response.json();
    },
  });

  // Buscar favorecidos do cliente se um cliente foi selecionado
  const { data: customerBeneficiariesData, isLoading: isLoadingCustomerBeneficiaries } = useQuery({
    queryKey: ['/api/customers', selectedCustomerId, 'beneficiaries'],
    queryFn: async () => {
      if (!selectedCustomerId || selectedCustomerId === 'unspecified') return { beneficiaries: [] };
      console.log("
      try {
        const response = await apiRequest('GET', "/beneficiaries`);
        console.log(`[FilteredBeneficiarySelect] 📋 Response status:`, response.status, response.statusText);
        
        if (!response.ok) {
          console.error(`[FilteredBeneficiarySelect] ❌ API error:`, response.status, response.statusText);
          const text = await response.text();
          console.error(`[FilteredBeneficiarySelect] ❌ Response body:`, text);
          return { beneficiaries: [] };
        }
        
        const data = await response.json();
        console.log(":`, data);
        return data;
      } catch (error) {
        console.error(`[FilteredBeneficiarySelect] ❌ Error fetching beneficiaries:`, error);
        return { beneficiaries: [] };
      }
    },
    enabled: !!selectedCustomerId && selectedCustomerId !== 'unspecified',
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingBeneficiaries || (selectedCustomerId && selectedCustomerId !== 'unspecified' && isLoadingCustomerBeneficiaries);
  
  // Determinar quais favorecidos mostrar baseado no cliente selecionado
  let beneficiariesToShow = [];
  
  if (selectedCustomerId && selectedCustomerId !== 'unspecified') {
    // Cliente selecionado - mostrar APENAS favorecidos deste cliente
    if (customerBeneficiariesData?.success && customerBeneficiariesData?.beneficiaries) {
      beneficiariesToShow = customerBeneficiariesData.beneficiaries;
      console.log('[FilteredBeneficiarySelect] ✅ FILTERED by customer (API):', {
        customerId: selectedCustomerId, 
        beneficiariesCount: beneficiariesToShow.length,
        beneficiaries: beneficiariesToShow.map(b => ({ 
          id: b.id, 
          name: b.name || "
          email: b.email 
        }))
      });
      console.log('[FilteredBeneficiarySelect] 🎯 RAW API DATA:', customerBeneficiariesData);
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
    // Nenhum cliente selecionado - mostrar todos os favorecidos
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
          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
            Nenhum favorecido encontrado para este cliente
          </SelectItem>
        ) : (
          <>
            <SelectItem value="__none__">Nenhum favorecido</SelectItem>
            <SelectItem value="unspecified">Não especificado</SelectItem>
            {beneficiariesToShow.map((beneficiary: any) => {
              const beneficiaryName = "
                                     beneficiary.fullName || beneficiary.name || 
                                     beneficiary.email || 'Favorecido sem nome';
              return (
                <SelectItem key={beneficiary.id} value={beneficiary.id}>
                  <div className="flex flex-col">
                    <span>{beneficiaryName}</span>
                    <span className="text-sm text-gray-500">
                      {beneficiary.email} {beneficiary.cpfCnpj && "
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