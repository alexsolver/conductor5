import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
// import { useLocalization } from '@/hooks/useLocalization';

interface GroupSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function GroupSelect({
  // Localization temporarily disabled
 
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
          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}