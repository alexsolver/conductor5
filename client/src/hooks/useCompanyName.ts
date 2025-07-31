import { useQuery } from "@tanstack/react-query";

// Hook personalizado para buscar nome da empresa pelo UUID
export function useCompanyName(companyId: string | null | undefined) {
  const { data: companies } = useQuery({
    queryKey: ['/api/customers/companies'],
    enabled: !!companyId && companyId !== null && companyId !== undefined,
  });

  if (!companyId || !companies || !Array.isArray(companies)) {
    return null;
  }

  // Buscar a empresa pelo ID na lista
  const company = companies.find((comp: any) => comp.id === companyId);
  return company?.name || companyId; // Retorna o nome da empresa ou o UUID como fallback
}

// Hook que retorna uma função para obter nomes de empresas
export function useCompanyNameResolver() {
  const { data: companies } = useQuery({
    queryKey: ['/api/customers/companies'],
  });

  const getCompanyName = (companyId: string | null | undefined): string => {
    if (!companyId || !companies || !Array.isArray(companies)) {
      return companyId || '-';
    }

    const company = companies.find((comp: any) => comp.id === companyId);
    return company?.name || companyId;
  };

  return { getCompanyName, isLoading: !companies };
}