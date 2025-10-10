import { useQuery } from '@tanstack/react-query';

interface Channel {
  name: string;
  type: string;
}

interface QueryBuilderOptions {
  channels: Channel[];
  statuses: { value: string; label: string }[];
  priorities: { value: string; label: string }[];
  categories: { id: string; name: string; description: string | null }[];
  users: { id: string; name: string | null; email: string }[];
  groups: { id: string; name: string; type: string | null }[];
  companies: { id: string; name: string }[];
  locations: { id: string; name: string; address: string | null }[];
}

/**
 * Hook para buscar opções dinâmicas do QueryBuilder
 * Substitui valores hardcoded por dados do banco de dados
 * 
 * @returns {Object} Objeto com dados, loading e error states
 */
export function useQueryBuilderOptions() {
  return useQuery<QueryBuilderOptions>({
    queryKey: ['/api/querybuilder/options'],
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false,
  });
}
