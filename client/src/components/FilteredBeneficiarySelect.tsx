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
  // Buscar todos os favorecidos - sempre ativo para listar todos
  const { data: allBeneficiariesData, isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['/api/beneficiaries'],
    queryFn: async () => {
      console.log('[FilteredBeneficiarySelect] 🔄 Fetching all beneficiaries for listing');
      const response = await apiRequest('GET', '/api/beneficiaries');
      const data = await response.json();
      console.log('[FilteredBeneficiarySelect] 📊 All beneficiaries data for listing:', data);
      return data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingBeneficiaries;
  
  // Sempre mostrar todos os favorecidos em formato de lista
  let beneficiariesToShow = [];
  
  const allBeneficiaries = allBeneficiariesData?.success ? (allBeneficiariesData.beneficiaries || []) : [];
  beneficiariesToShow = allBeneficiaries;
  
  console.log('[FilteredBeneficiarySelect] 📋 Listing ALL beneficiaries:', {
    beneficiariesCount: beneficiariesToShow.length,
    beneficiaries: beneficiariesToShow.map(b => ({ 
      id: b.id, 
      name: b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim(),
      email: b.email,
      cpfCnpj: b.cpfCnpj || b.cpf || b.cnpj,
      phone: b.phone || b.cellPhone
    }))
  });

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
        {beneficiariesToShow.length === 0 ? (
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