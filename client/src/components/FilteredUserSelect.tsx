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
    queryKey: ['/api/user-management/users'],
    queryFn: async () => {
      console.log('[FilteredUserSelect] Fazendo request para buscar usuários...');
      const response = await apiRequest('GET', '/api/user-management/users');
      const data = await response.json();
      console.log('[FilteredUserSelect] Resposta da API:', data);
      return data;
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
  
  console.log('[FilteredUserSelect] Debug - allUsersData:', allUsersData);
  console.log('[FilteredUserSelect] Debug - selectedGroupId:', selectedGroupId);
  console.log('[FilteredUserSelect] Debug - groupMembersData:', groupMembersData);
  
  if (selectedGroupId && groupMembersData?.data) {
    // Se um grupo foi selecionado, mostrar apenas membros do grupo
    usersToShow = groupMembersData.data;
    console.log('[FilteredUserSelect] Showing group members:', {
      groupId: selectedGroupId, 
      membersCount: usersToShow.length,
      members: usersToShow.map(u => ({ 
        id: u.id, 
        name: u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(), 
        email: u.email 
      }))
    });
  } else if (allUsersData?.success && allUsersData?.data) {
    // Se nenhum grupo foi selecionado, mostrar todos os usuários
    usersToShow = allUsersData.data;
    console.log('[FilteredUserSelect] Showing all users (from success.data):', {
      groupId: selectedGroupId,
      usersCount: usersToShow.length,
      users: usersToShow.map(u => ({ 
        id: u.id, 
        name: u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(), 
        email: u.email 
      }))
    });
  } else if (allUsersData && Array.isArray(allUsersData)) {
    // Fallback: se os dados vierem diretamente como array
    usersToShow = allUsersData;
    console.log('[FilteredUserSelect] Showing all users (direct array):', {
      usersCount: usersToShow.length,
      users: usersToShow.map(u => ({ 
        id: u.id, 
        name: u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(), 
        email: u.email 
      }))
    });
  } else if (allUsersData?.data && Array.isArray(allUsersData.data)) {
    // Outro fallback: dados no formato { data: [...] }
    usersToShow = allUsersData.data;
    console.log('[FilteredUserSelect] Showing all users (from data property):', {
      usersCount: usersToShow.length,
      users: usersToShow.map(u => ({ 
        id: u.id, 
        name: u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(), 
        email: u.email 
      }))
    });
  } else {
    console.log('[FilteredUserSelect] Nenhum usuário encontrado. allUsersData:', allUsersData);
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
    <Select 
      value={value || '__none__'} 
      onValueChange={(val) => onChange(val === '__none__' ? '' : val)} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Nenhum responsável</SelectItem>
        {usersToShow.map((user: any) => {
          const displayName = user.name || 
                             user.fullName || 
                             `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                             user.email || 
                             'Nome não disponível';
          
          return (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex flex-col">
                <span>{displayName}</span>
                <span className="text-sm text-gray-500">
                  {user.email} {user.role && `• ${user.role}`}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}