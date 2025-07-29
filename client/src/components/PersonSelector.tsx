// Unified Person Selector - Supports Users and Customers
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Person {
  id: string;
  type: 'user' | 'customer';
  email: string;
  fullName: string;
}

interface PersonSelectorProps {
  value: string;
  onValueChange: (personId: string, personType: 'user' | 'customer') => void;
  placeholder?: string;
  allowedTypes?: ('user' | 'customer')[];
  companyFilter?: string;
  disabled?: boolean;
}

export function PersonSelector({ 
  value, 
  onValueChange, 
  placeholder = "Selecionar pessoa...", 
  allowedTypes = ['user', 'customer'],
  companyFilter,
  disabled = false
}: PersonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch people with search
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["/api/people/search", searchQuery, allowedTypes],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        q: searchQuery,
        types: allowedTypes.join(',')
      });

      const response = await fetch(`/api/people/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to search people');
      }

      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  // Get selected person info
  const selectedPerson = people.find((person: Person) => person.id === value);

  const handleSelect = (person: Person) => {
    onValueChange(person.id, person.type);
    setOpen(false);
  };

  const getPersonIcon = (type: 'user' | 'customer') => {
    return type === 'user' ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />;
  };

  const getPersonBadge = (type: 'user' | 'customer') => {
    return type === 'user' 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Usuário</Badge>
      : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cliente</Badge>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedPerson ? (
            <div className="flex items-center gap-2">
              {getPersonIcon(selectedPerson.type)}
              <span className="truncate">{selectedPerson.fullName}</span>
              {getPersonBadge(selectedPerson.type)}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar por nome ou email..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {searchQuery.length < 2 
              ? "Digite pelo menos 2 caracteres para buscar"
              : "Nenhuma pessoa encontrada"
            }
          </CommandEmpty>
          <CommandList>
            {people.length > 0 && (
              <>
                {allowedTypes.includes('user') && (
                  <CommandGroup heading="Usuários">
                    {people
                      .filter((person: Person) => person.type === 'user')
                      .map((person: Person) => (
                        <CommandItem
                          key={`user-${person.id}`}
                          value={person.id}
                          onSelect={() => handleSelect(person)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === person.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <User className="h-4 w-4 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="font-medium">{person.fullName}</span>
                              <span className="text-sm text-muted-foreground">{person.email}</span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {allowedTypes.includes('customer') && (
                  <CommandGroup heading="Clientes">
                    {people
                      .filter((person: Person) => person.type === 'customer')
                      .map((person: Person) => (
                        <CommandItem
                          key={`customer-${person.id}`}
                          value={person.id}
                          onSelect={() => handleSelect(person)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === person.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Users className="h-4 w-4 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium">{person.fullName}</span>
                              <span className="text-sm text-muted-foreground">{person.email}</span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}