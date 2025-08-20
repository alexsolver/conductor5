// Unified Person Selector - Supports Users and Customers
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
// import { useLocalization } from '@/hooks/useLocalization';

interface Person {
  id: string;
  type: 'user' | 'customer';
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
}

interface PersonSelectorProps {
  value: string;
  onValueChange: (personId: string, personType: 'user' | 'customer') => void;
  placeholder?: string;
  allowedTypes?: ('user' | 'customer')[];
  companyFilter?: string;
  disabled?: boolean;
  className?: string;
}

export function PersonSelector({
  // Localization temporarily disabled
 
  value, 
  onValueChange, 
  placeholder = "Selecionar pessoa...", 
  allowedTypes = ['user', 'customer'],
  companyFilter,
  disabled = false,
  className = ""
}: PersonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users if allowed
  const { data: usersData } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tenant-admin/users");
      return response.json();
    },
    enabled: allowedTypes.includes('user'),
  });

  // Fetch customers filtered by company
  const { data: customersData } = useQuery({
    queryKey: ["/api/customers/by-company", companyFilter],
    queryFn: async () => {
      if (!companyFilter || companyFilter === 'unspecified') {
        return { customers: [] };
      }

      const response = await apiRequest("GET", `/api/companies/${companyFilter}/customers`);
      return response.json();
    },
    enabled: allowedTypes.includes('customer') && !!companyFilter && companyFilter !== 'unspecified',
  });

  // Process and combine data
  useEffect(() => {
    const combinedPeople: Person[] = [];

    // Add users if allowed
    if (allowedTypes.includes('user') && usersData?.users) {
      const users = usersData.users.map((user: any) => ({
        id: user.id,
        type: 'user' as const,
        email: user.email,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }));
      combinedPeople.push(...users);
    }

    // Add customers if allowed and company is selected
    if (allowedTypes.includes('customer') && customersData?.customers) {
      const customers = customersData.customers.map((customer: any) => ({
        id: customer.id,
        type: 'customer' as const,
        email: customer.email,
        fullName: customer.fullName || customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      }));
      combinedPeople.push(...customers);
    }

    setPeople(combinedPeople);
  }, [usersData, customersData, allowedTypes]);

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
          className={cn("justify-between", className || "")}
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
          <CommandInput placeholder='[TRANSLATION_NEEDED]' />
          <CommandEmpty>
            {!companyFilter || companyFilter === 'unspecified' 
              ? '[TRANSLATION_NEEDED]'
              : people.length === 0 
              ? '[TRANSLATION_NEEDED]'
              : "Digite para filtrar pessoas"
            }
          </CommandEmpty>
          <CommandList>
            {people.length > 0 && (
              <>
                {allowedTypes.includes('user') && (
                  <CommandGroup heading='[TRANSLATION_NEEDED]'>
                    {people
                      .filter((person: Person) => person.type === 'user')
                      .map((person: Person) => (
                        <CommandItem
                          key={`user-${person.id}`}
                          value={person.fullName}
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
                  <CommandGroup heading='[TRANSLATION_NEEDED]'>
                    {people
                      .filter((person: Person) => person.type === 'customer')
                      .map((person: Person) => (
                        <CommandItem
                          key={`customer-${person.id}`}
                          value={person.fullName}
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