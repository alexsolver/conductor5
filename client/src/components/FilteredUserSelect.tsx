import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

interface FilteredUserSelectProps {
  value?: string;
  onChange: (value: string) => void;
  selectedGroupId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FilteredUserSelect({ 
  value, 
  onChange, 
  selectedGroupId,
  placeholder = "Selecionar responsável", 
  disabled = false,
  className = ""
}: FilteredUserSelectProps) {
  // Buscar todos os usuários
  const { data: allUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    },
  });

  // Buscar membros do grupo se um grupo foi selecionado
  const { data: groupMembersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['/api/user-groups', selectedGroupId, 'members'],
    queryFn: async () => {
      if (!selectedGroupId) return { data: [] };
      const response = await apiRequest('GET', `/api/user-groups/${selectedGroupId}/members`);
      return response.json();
    },
    enabled: !!selectedGroupId,
  });

  const isLoading = isLoadingUsers || (selectedGroupId && isLoadingMembers);
  
  // Determinar quais usuários mostrar
  let usersToShow = [];
  if (selectedGroupId && groupMembersData?.data) {
    // Se um grupo foi selecionado, mostrar apenas membros do grupo
    usersToShow = groupMembersData.data;
  } else if (allUsersData?.success) {
    // Se nenhum grupo foi selecionado, mostrar todos os usuários
    usersToShow = allUsersData.users || [];
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Carregando usuários..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Nenhum responsável</SelectItem>
        {usersToShow.map((user: any) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex flex-col">
              <span>{user.name}</span>
              <span className="text-sm text-gray-500">
                {user.email} {user.role && `• ${user.role}`}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}