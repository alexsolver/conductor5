/**
 * CompanySelector - Seletor hierárquico de empresas para regras de aprovação
 * Seguindo padrões 1qa.md e Clean Architecture
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  displayName?: string;
  email?: string;
  phone?: string;
  status: string;
}

interface CompanySelectorProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CompanySelector({
  value,
  onValueChange,
  placeholder = "Selecionar empresa (opcional)",
  disabled = false,
  className = ""
}: CompanySelectorProps) {
  const { data: companies = [], isLoading, error } = useQuery<Company[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      console.log('🏢 [COMPANY-SELECTOR] Carregando empresas...');
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.log('❌ [COMPANY-SELECTOR] Erro na API:', response.status);
        throw new Error('Falha ao carregar empresas');
      }
      const result = await response.json();
      console.log('✅ [COMPANY-SELECTOR] Empresas carregadas:', result);
      // Mapear customers para o formato esperado
      const mappedCompanies = (result.customers || []).map((customer: any) => ({
        id: customer.id,
        name: customer.companyName || customer.company_name || `${customer.firstName || customer.first_name} ${customer.lastName || customer.last_name}`,
        displayName: customer.companyName || customer.company_name || `${customer.firstName || customer.first_name} ${customer.lastName || customer.last_name}`,
        email: customer.email,
        phone: customer.phone,
        status: customer.isActive || customer.is_active ? 'active' : 'inactive'
      }));
      console.log('✅ [COMPANY-SELECTOR] Empresas mapeadas:', mappedCompanies);
      return mappedCompanies;
    }
  });

  if (error) {
    return (
      <div className="text-sm text-red-600 p-2 border border-red-200 rounded">
        Erro ao carregar empresas
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        Empresa (Associação Hierárquica)
      </label>
      
      <Select
        value={value || 'none'}
        onValueChange={(val) => onValueChange(val === 'none' ? null : val)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
        </SelectTrigger>
        
        <SelectContent>
          {/* Opção para remover seleção */}
          <SelectItem value="none">
            <span className="text-gray-500">Nenhuma empresa (regra global)</span>
          </SelectItem>
          
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              <div className="flex flex-col">
                <span className="font-medium">
                  {company.displayName || company.name}
                </span>
                {company.email && (
                  <span className="text-xs text-gray-500">{company.email}</span>
                )}
              </div>
            </SelectItem>
          ))}
          
          {companies.length === 0 && !isLoading && (
            <SelectItem value="none" disabled>
              <span className="text-gray-500">Nenhuma empresa encontrada</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {/* Debug info */}
      {companies.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {companies.length} empresas encontradas
        </div>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Deixe vazio para aplicar a regra globalmente ou selecione uma empresa específica
      </p>
    </div>
  );
}