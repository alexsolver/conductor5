/**
 * Hook para filtrar empresa Default quando inativa
 */

import { useQuery } from '@tanstack/react-query';

export interface CompanyFilterResult {
  isDefaultActive: boolean;
  filteredCompanies: any[];
  isLoading: boolean;
}

export function useCompanyFilter(companies: any[] = []): CompanyFilterResult {
  // Buscar status da empresa Default
  const { data: defaultCompanyStatus, isLoading } = useQuery({
    queryKey: ['/api/customers/companies', 'default-status'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      const response = await fetch('/api/customers/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;
      
      const result = await response.json();
      const companiesData = Array.isArray(result) ? result : result.data || [];
      
      // Encontrar empresa Default
      const defaultCompany = companiesData.find((company: any) => 
        company.name?.toLowerCase().includes('default') || 
        company.displayName?.toLowerCase().includes('default')
      );

      return {
        exists: !!defaultCompany,
        isActive: defaultCompany ? (defaultCompany.status === 'active' || defaultCompany.isActive) : false,
        defaultCompanyId: defaultCompany?.id
      };
    },
    staleTime: 30 * 1000, // Cache por 30 segundos
    refetchOnWindowFocus: false,
  });

  const isDefaultActive = defaultCompanyStatus?.isActive ?? true;
  const defaultCompanyId = defaultCompanyStatus?.defaultCompanyId;

  // Filtrar empresas removendo Default se inativa
  const filteredCompanies = companies.filter((company: any) => {
    if (!defaultCompanyId) return true; // Se não encontrou Default, mostrar todas
    
    const isDefaultCompany = company.id === defaultCompanyId ||
      company.name?.toLowerCase().includes('default') ||
      company.displayName?.toLowerCase().includes('default');
    
    // Se for Default e estiver inativa, filtrar fora
    if (isDefaultCompany && !isDefaultActive) {
      return false;
    }
    
    return true;
  });

  return {
    isDefaultActive,
    filteredCompanies,
    isLoading
  };
}