/**
 * Hook para gerenciar estratégias relacionadas à empresa Default inativa
 */

import { useQuery } from '@tanstack/react-query';

export interface DefaultCompanyStrategy {
  // Status da empresa Default
  isDefaultActive: boolean;
  defaultCompanyId: string | null;
  
  // Para tickets existentes
  shouldShowExistingTickets: boolean;
  shouldAllowEditing: boolean;
  
  // Para criação de novos tickets
  shouldAllowCreation: boolean;
  
  // Para interfaces de seleção
  shouldShowInDropdowns: boolean;
  
  // Mensagens explicativas
  getInactiveMessage: () => string;
  getExistingTicketMessage: () => string;
}

export function useDefaultCompanyStrategy(): DefaultCompanyStrategy {
  // Buscar status da empresa Default
  const { data: defaultStatus } = useQuery({
    queryKey: ['/api/customer-companies', 'default-strategy'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      const response = await fetch('/api/customer-companies', {
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
        defaultCompanyId: defaultCompany?.id,
        defaultCompany
      };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const isDefaultActive = defaultStatus?.isActive ?? true;
  const defaultCompanyId = defaultStatus?.defaultCompanyId ?? null;

  return {
    isDefaultActive,
    defaultCompanyId,
    
    // Tickets existentes: sempre mostrar para não quebrar histórico
    shouldShowExistingTickets: true,
    
    // Edição: permitir apenas se Default estiver ativa
    shouldAllowEditing: isDefaultActive,
    
    // Criação: não permitir se Default estiver inativa
    shouldAllowCreation: isDefaultActive,
    
    // Dropdowns: não mostrar se Default estiver inativa
    shouldShowInDropdowns: isDefaultActive,
    
    // Mensagens explicativas
    getInactiveMessage: () => 
      'A empresa Default está inativa e não pode ser selecionada para novos tickets.',
      
    getExistingTicketMessage: () => 
      'Este ticket foi criado quando a empresa Default estava ativa. Histórico preservado, mas edições limitadas.'
  };
}