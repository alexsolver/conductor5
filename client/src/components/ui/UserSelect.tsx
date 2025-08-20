import React, { useState } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
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
import { useLocalization } from '@/hooks/useLocalization';
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface UserSelectProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UserSelect({
  const { t } = useLocalization();

  value,
  onChange,
  users,
  placeholder = "Selecionar usuário...",
  className,
  disabled = false,
}: UserSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedUser = users.find(user => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedUser.name}</span>
                <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={t('ui.buscarUsuario')} />
          <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {/* Opção para limpar seleção */}
            <CommandItem
              value=""
              onSelect={() => {
                onChange("");
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="text-muted-foreground">Nenhum usuário</span>
            </CommandItem>
            
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={`${user.name} ${user.email}`}
                onSelect={() => {
                  onChange(user.id === value ? "" : user.id);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === user.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                    {user.role && (
                      <span className="text-xs text-blue-600">{user.role}</span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}