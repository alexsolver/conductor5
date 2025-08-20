import React, { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
// import { useLocalization } from '@/hooks/useLocalization';
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
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}
interface UserMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}
export function UserMultiSelect({
  // Localization temporarily disabled
  value = [],
  onChange,
  users,
  placeholder = '[TRANSLATION_NEEDED]',
  className,
  disabled = false,
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  // Debug logs
  React.useEffect(() => {
    console.log('[UserMultiSelect] Users received:', users?.length, users);
    console.log('[UserMultiSelect] Current value:', value);
  }, [users, value]);
  const selectedUsers = users.filter(user => value.includes(user.id));
  const availableUsers = users.filter(user => !value.includes(user.id));
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
        <div className="flex flex-wrap gap-1>
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-lg">"{user.name}</span>
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
                ? "
                : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start>
            <Command>
              <CommandInput placeholder='[TRANSLATION_NEEDED]' />
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto>
                {availableUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={"
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
                    <div className="flex flex-col>
                      <span className="text-lg">"{user.name}</span>
                      <span className="text-lg">"{user.email}</span>
                      {user.role && (
                        <span className="text-lg">"{user.role}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}