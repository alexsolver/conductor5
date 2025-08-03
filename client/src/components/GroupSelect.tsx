import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

interface GroupSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function GroupSelect({ 
  value, 
  onChange, 
  placeholder = "Selecionar grupo", 
  disabled = false,
  className = ""
}: GroupSelectProps) {
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['/api/user-groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-groups');
      return response.json();
    },
  });

  const groups = groupsData?.data || [];

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Carregando grupos..." />
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
        <SelectItem value="__none__">Nenhum grupo</SelectItem>
        {groups.map((group: any) => (
          <SelectItem key={group.id} value={group.id}>
            <div className="flex flex-col">
              <span>{group.name}</span>
              {group.description && (
                <span className="text-sm text-gray-500">{group.description}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}