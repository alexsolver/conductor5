import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Users } from "lucide-react";
// import { useLocalization } from '@/hooks/useLocalization';
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
  // Localization temporarily disabled
  value,
  onChange,
  onValueChange,
  placeholder = '[TRANSLATION_NEEDED]',
  disabled = false
}: UserGroupSelectProps) {
  const { data: groupsData, isLoading, error } = useQuery<{ success: boolean; data: UserGroup[] }>({
    queryKey: ["/api/user-management/groups"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  const handleSelectChange = (selectedValue: string) => {
    const callback = onChange || onValueChange;
    if (callback) {
      callback(selectedValue);
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 border rounded>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-lg">"Carregando grupos...</span>
      </div>
    );
  }
  if (error || !groupsData?.success) {
    return (
      <div className="flex items-center justify-center p-2 border rounded border-destructive/20>
        <AlertCircle className="w-4 h-4 text-destructive mr-2" />
        <span className="text-lg">"Erro ao carregar grupos</span>
      </div>
    );
  }
  const activeGroups = groupsData.data?.filter(group => group.isActive) || [];
  if (activeGroups.length === 0) {
    return (
      <div className="flex items-center justify-center p-2 border rounded border-orange-200>
        <Users className="w-4 h-4 text-orange-500 mr-2" />
        <span className="text-lg">"Nenhum grupo disponível</span>
      </div>
    );
  }
  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {activeGroups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            <div className="flex items-center gap-2>
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg">"{group.name}</div>
                {group.description && (
                  <div className="text-lg">"{group.description}</div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
