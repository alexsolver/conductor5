
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserGroupSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export function UserGroupSelect({
  value,
  onChange,
  onValueChange,
  placeholder = "Selecione um grupo",
  disabled = false
}: UserGroupSelectProps) {
  const { data: groupsData, isLoading, error } = useQuery({
    queryKey: ["user-groups"],
    queryFn: () => apiRequest('GET', '/api/user-groups'),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  }) as { data: { success: boolean; data: UserGroup[] } | undefined; isLoading: boolean; error: any };

  const handleSelectChange = (selectedValue: string) => {
    const callback = onChange || onValueChange;
    if (callback) {
      callback(selectedValue);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 border rounded">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Carregando grupos...</span>
      </div>
    );
  }

  if (error || !groupsData || !groupsData?.success) {
    return (
      <div className="flex items-center justify-center p-2 border rounded border-destructive/20">
        <AlertCircle className="w-4 h-4 text-destructive mr-2" />
        <span className="text-sm text-destructive">Erro ao carregar grupos</span>
      </div>
    );
  }

  const activeGroups = groupsData?.data?.filter((group: UserGroup) => group.isActive) || [];

  // Debug logs
  React.useEffect(() => {
    console.log('[UserGroupSelect] Groups data:', groupsData);
    console.log('[UserGroupSelect] Active groups:', activeGroups);
  }, [groupsData, activeGroups]);

  if (activeGroups.length === 0) {
    return (
      <div className="flex items-center justify-center p-2 border rounded border-orange-200">
        <Users className="w-4 h-4 text-orange-500 mr-2" />
        <span className="text-sm text-orange-600">Nenhum grupo disponível</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {activeGroups.map((group: UserGroup) => (
          <SelectItem key={group.id} value={group.id}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{group.name}</div>
                {group.description && (
                  <div className="text-xs text-muted-foreground">{group.description}</div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
