
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, AlertCircle } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  industry?: string;
  size?: string;
  status: string;
  isActive: boolean;
}

interface CompanyTemplateSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

// API helper seguindo o padrão do sistema
const apiRequest = async (method: string, url: string, data?: any) => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

export const CompanyTemplateSelector: React.FC<CompanyTemplateSelectorProps> = ({
  value,
  onValueChange,
  className,
  placeholder = "Selecione uma empresa",
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Query para buscar empresas do módulo empresas v2
  const { 
    data: companiesResponse, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/companies/v2/', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '100');
      params.append('sortBy', 'name');
      params.append('sortOrder', 'asc');
      params.append('isActive', 'true');
      
      if (searchTerm && searchTerm.length > 0) {
        params.append('name', searchTerm);
      }

      return await apiRequest('GET', `/api/companies/v2/?${params.toString()}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });

  const companies: Company[] = companiesResponse?.data?.companies || [];

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'all' || selectedValue === '') {
      onValueChange('');
    } else {
      onValueChange(selectedValue);
    }
  };

  const getCompanyDisplay = (company: Company) => {
    let display = company.name;
    if (company.cnpj) {
      display += ` (${company.cnpj})`;
    }
    if (company.industry) {
      display += ` - ${company.industry}`;
    }
    return display;
  };

  if (error) {
    return (
      <div className={className}>
        <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Empresa
        </Label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar empresas: {error.message}
            <button 
              onClick={() => refetch()} 
              className="ml-2 text-sm underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        Empresa Selecionada
      </Label>
      
      <Select 
        value={value || ''} 
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="border-purple-200 focus:border-purple-400">
          <SelectValue placeholder={isLoading ? "Carregando empresas..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas as empresas</SelectItem>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                Carregando...
              </div>
            </SelectItem>
          ) : companies.length === 0 ? (
            <SelectItem value="no-companies" disabled>
              Nenhuma empresa encontrada
            </SelectItem>
          ) : (
            companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{getCompanyDisplay(company)}</span>
                  {company.size && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {company.size}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {companies.length > 0 && !isLoading && (
        <p className="text-xs text-gray-500 mt-1">
          {companies.length} empresa{companies.length !== 1 ? 's' : ''} encontrada{companies.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default CompanyTemplateSelector;
