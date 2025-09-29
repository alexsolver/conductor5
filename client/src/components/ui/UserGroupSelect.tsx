
import React, { useState, useEffect } from "react";
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
  const [groupsData, setGroupsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGroups() {
      try {
        console.log('[UserGroupSelect] Fetching user groups...');
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/user-groups');
        const data = await response.json();
        console.log('[UserGroupSelect] Response:', data);
        
        if (isMounted) {
          setGroupsData(data);
          setError(null);
        }
      } catch (err) {
        console.error('[UserGroupSelect] Error:', err);
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  console.log('[UserGroupSelect] Render state:', { isLoading, error: error?.message, groupsData });

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

  if (error) {
    console.error('[UserGroupSelect] Error loading groups:', error);
    return (
      <div className="flex items-center justify-center p-2 border rounded border-destructive/20">
        <AlertCircle className="w-4 h-4 text-destructive mr-2" />
        <span className="text-sm text-destructive">Erro ao carregar grupos: {error.message}</span>
      </div>
    );
  }

  if (!groupsData || !groupsData?.success || !groupsData?.groups) {
    console.warn('[UserGroupSelect] Invalid data structure:', groupsData);
    return (
      <div className="flex items-center justify-center p-2 border rounded border-destructive/20">
        <AlertCircle className="w-4 h-4 text-destructive mr-2" />
        <span className="text-sm text-destructive">Dados inválidos</span>
      </div>
    );
  }

  const activeGroups = groupsData?.groups?.filter((group: UserGroup) => group.isActive) || [];

  console.log('[UserGroupSelect] Active groups count:', activeGroups.length);

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
