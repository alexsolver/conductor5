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
  placeholder = "Selecionar favorecido", 
  disabled = false,
  className = ""
}: FilteredBeneficiarySelectProps) {
  // Buscar todos os favorecidos
  const { data: allBeneficiariesData, isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['/api/beneficiaries'],
    queryFn: async () => {
      console.log('[FilteredBeneficiarySelect] 🔄 Fetching all beneficiaries');
      const response = await apiRequest('GET', '/api/beneficiaries');
      const data = await response.json();
      console.log('[FilteredBeneficiarySelect] 📊 All beneficiaries data:', data);
      return data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // Buscar favorecidos do cliente específico se um cliente foi selecionado
  const { data: customerBeneficiariesData, isLoading: isLoadingCustomerBeneficiaries } = useQuery({
    queryKey: ['/api/customers', selectedCustomerId, 'beneficiaries'],
    queryFn: async () => {
      if (!selectedCustomerId || selectedCustomerId === 'unspecified') return { data: [] };
      console.log('[FilteredBeneficiarySelect] 🔍 Fetching beneficiaries for customer:', selectedCustomerId);
      const response = await apiRequest('GET', `/api/customers/${selectedCustomerId}/beneficiaries`);
      const data = await response.json();
      console.log('[FilteredBeneficiarySelect] 📊 Customer beneficiaries data:', data);
      return data;
    },
    enabled: !!selectedCustomerId && selectedCustomerId !== 'unspecified',
  });

  const isLoading = isLoadingBeneficiaries || (selectedCustomerId && selectedCustomerId !== 'unspecified' && isLoadingCustomerBeneficiaries);
  
  // Determinar quais favorecidos mostrar baseado no cliente selecionado
  let beneficiariesToShow = [];
  
  if (selectedCustomerId && selectedCustomerId !== 'unspecified') {
    // Cliente selecionado - mostrar APENAS favorecidos deste cliente
    if (isLoadingCustomerBeneficiaries) {
      beneficiariesToShow = [];
      console.log('[FilteredBeneficiarySelect] ⏳ Loading beneficiaries for customer:', selectedCustomerId);
    } else if (customerBeneficiariesData?.success && Array.isArray(customerBeneficiariesData.beneficiaries)) {
      beneficiariesToShow = customerBeneficiariesData.beneficiaries;
      console.log('[FilteredBeneficiarySelect] ✅ FILTERED by customer:', {
        customerId: selectedCustomerId,
        beneficiariesCount: beneficiariesToShow.length,
        beneficiaries: beneficiariesToShow.map(b => ({ 
          id: b.id, 
          name: b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim(),
          email: b.email
        }))
      });
    } else {
      beneficiariesToShow = [];
      console.log('[FilteredBeneficiarySelect] ❌ No beneficiaries found for customer:', selectedCustomerId, 'Data:', customerBeneficiariesData);
    }
  } else {
    // Nenhum cliente selecionado - mostrar todos os favorecidos
    const allBeneficiaries = allBeneficiariesData?.success ? (allBeneficiariesData.beneficiaries || []) : [];
    beneficiariesToShow = allBeneficiaries;
    console.log('[FilteredBeneficiarySelect] 🌐 Showing ALL beneficiaries (no customer filter):', {
      customerId: selectedCustomerId,
      beneficiariesCount: beneficiariesToShow.length
    });
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Carregando favorecidos..." />
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
        <SelectItem value="__none__">Nenhum favorecido</SelectItem>
        <SelectItem value="unspecified">Não especificado</SelectItem>
        {beneficiariesToShow.length === 0 && selectedCustomerId && selectedCustomerId !== 'unspecified' ? (
          <SelectItem value="__no_beneficiaries__" disabled>
            Nenhum favorecido encontrado para este cliente
          </SelectItem>
        ) : beneficiariesToShow.length === 0 ? (
          <SelectItem value="__no_beneficiaries__" disabled>
            Nenhum favorecido cadastrado
          </SelectItem>
        ) : (
          beneficiariesToShow.map((beneficiary: any) => {
            const beneficiaryName = beneficiary.name || 
                                   `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim() || 
                                   beneficiary.fullName || 
                                   beneficiary.email || 'Favorecido sem nome';
            
            const cpfCnpj = beneficiary.cpfCnpj || beneficiary.cpf || beneficiary.cnpj;
            const phone = beneficiary.phone || beneficiary.cellPhone;
            
            return (
              <SelectItem key={beneficiary.id} value={beneficiary.id}>
                <div className="flex flex-col w-full">
                  <div className="font-medium text-gray-900">{beneficiaryName}</div>
                  <div className="text-sm text-gray-600 flex flex-col">
                    {beneficiary.email && (
                      <span>📧 {beneficiary.email}</span>
                    )}
                    {cpfCnpj && (
                      <span>🆔 {cpfCnpj}</span>
                    )}
                    {phone && (
                      <span>📞 {phone}</span>
                    )}
                    {beneficiary.isActive === false && (
                      <span className="text-red-500 text-xs">⚠️ Inativo</span>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}