import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
}

interface UserMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UserMultiSelect({
  value = [],
  onChange,
  placeholder = "Selecionar usuários...",
  className,
  disabled = false,
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Fetch users from API
  const { data: usersData, isLoading, error } = useQuery<{ success: boolean; data: User[] }>({
    queryKey: ["users"],
    queryFn: () => apiRequest('GET', '/api/user-management/users'),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Debug logs
  React.useEffect(() => {
    console.log('[UserMultiSelect] Users data:', usersData);
    console.log('[UserMultiSelect] Current value:', value);
  }, [usersData, value]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 border rounded">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Carregando usuários...</span>
      </div>
    );
  }

  if (error || !usersData?.success) {
    return (
      <div className="flex items-center justify-center p-2 border rounded border-destructive/20">
        <AlertCircle className="w-4 h-4 text-destructive mr-2" />
        <span className="text-sm text-destructive">Erro ao carregar usuários</span>
      </div>
    );
  }

  const users = usersData?.data || [];

  // Normalizar dados dos usuários
  const normalizedUsers = React.useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    
    return users.map(user => ({
      id: user.id,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      role: user.role
    }));
  }, [users]);

  const selectedUsers = normalizedUsers.filter(user => value.includes(user.id));
  const availableUsers = normalizedUsers.filter(user => !value.includes(user.id));

  const handleSelect = (userId: string) => {
    const newValue = [...value, userId];
    onChange(newValue);
  };

  const handleRemove = (userId: string) => {
    const newValue = value.filter(id => id !== userId);
    onChange(newValue);
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-xs font-medium">{user.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(user.id)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {!disabled && selectedUsers.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar todos
            </Button>
          )}
        </div>
      )}

      {/* User Selector */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedUsers.length > 0
                ? `${selectedUsers.length} usuário${selectedUsers.length > 1 ? 's' : ''} selecionado${selectedUsers.length > 1 ? 's' : ''}`
                : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar usuários..." />
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.name} ${user.email}`}
                      onSelect={() => {
                        handleSelect(user.id);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(user.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                        {user.role && (
                          <span className="text-xs text-blue-600">{user.role}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                    Nenhum usuário disponível
                  </div>
                )}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}