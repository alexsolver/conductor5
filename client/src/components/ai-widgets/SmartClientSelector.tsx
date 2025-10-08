import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronsUpDown, User, Mail, Phone, MapPin, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  city?: string;
  companyName?: string;
}

interface SmartClientSelectorProps {
  value?: string;
  onSelect: (customerId: string, customer: Customer) => void;
  placeholder?: string;
  hint?: string;
  showDetails?: boolean;
  conversationContext?: {
    mentionedNames?: string[];
    previousCustomerId?: string;
    extractedEmail?: string;
    extractedPhone?: string;
  };
}

export function SmartClientSelector({
  value,
  onSelect,
  placeholder = 'Selecione um cliente',
  hint,
  showDetails = true,
  conversationContext
}: SmartClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar clientes
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['/api/customers'],
  });

  const customers = (customersData as any)?.customers || [];

  // Fuzzy search function
  const fuzzyMatch = (text: string, query: string): number => {
    if (!text || !query) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (textLower === queryLower) return 100;
    
    // Starts with
    if (textLower.startsWith(queryLower)) return 90;
    
    // Contains
    if (textLower.includes(queryLower)) return 80;
    
    // Fuzzy match by characters
    let score = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        score += 50 / queryLower.length;
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length ? score : 0;
  };

  // Smart filtering with context awareness
  const filteredAndRankedCustomers = useMemo(() => {
    if (!searchQuery && !conversationContext) {
      return customers.slice(0, 50); // Limit initial results
    }

    let results = customers.map((customer: Customer) => {
      let score = 0;
      
      // Text search score
      if (searchQuery) {
        score += fuzzyMatch(customer.name, searchQuery);
        score += fuzzyMatch(customer.email || '', searchQuery) * 0.9;
        score += fuzzyMatch(customer.phone || '', searchQuery) * 0.8;
        score += fuzzyMatch(customer.cpf || '', searchQuery) * 0.7;
        score += fuzzyMatch(customer.companyName || '', searchQuery) * 0.6;
      }

      // Context-based scoring
      if (conversationContext) {
        // Boost if name mentioned in conversation
        if (conversationContext.mentionedNames?.some(name => 
          fuzzyMatch(customer.name, name) > 70
        )) {
          score += 50;
        }

        // Boost if previously selected
        if (conversationContext.previousCustomerId === customer.id) {
          score += 30;
        }

        // Boost if email matches
        if (conversationContext.extractedEmail && 
            customer.email?.toLowerCase() === conversationContext.extractedEmail.toLowerCase()) {
          score += 100;
        }

        // Boost if phone matches
        if (conversationContext.extractedPhone && 
            customer.phone?.replace(/\D/g, '') === conversationContext.extractedPhone.replace(/\D/g, '')) {
          score += 100;
        }
      }

      return { customer, score };
    });

    // Filter out zero scores and sort
    results = results
      .filter((r: any) => r.score > 0 || !searchQuery)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 50);

    return results.map((r: any) => r.customer);
  }, [customers, searchQuery, conversationContext]);

  const selectedCustomer = customers.find((c: Customer) => c.id === value);

  return (
    <div className="space-y-2" data-testid="smart-client-selector">
      {hint && (
        <p className="text-sm text-muted-foreground" data-testid="text-selector-hint">
          {hint}
        </p>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid="button-open-selector"
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="truncate">{selectedCustomer.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome, email, telefone, CPF..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              data-testid="input-search-customer"
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {filteredAndRankedCustomers.map((customer: Customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => {
                          onSelect(customer.id, customer);
                          setOpen(false);
                        }}
                        className="flex items-center gap-2 py-3"
                        data-testid={`item-customer-${customer.id}`}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === customer.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{customer.name}</span>
                            {customer.companyName && (
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {customer.companyName}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </span>
                            )}
                            {customer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Customer Details Card */}
      {showDetails && selectedCustomer && (
        <Card data-testid="card-customer-details">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium text-xs text-muted-foreground">Email</div>
                <div>{selectedCustomer.email || 'Não informado'}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium text-xs text-muted-foreground">Telefone</div>
                <div>{selectedCustomer.phone || 'Não informado'}</div>
              </div>
            </div>
            {selectedCustomer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Endereço</div>
                  <div>{selectedCustomer.address}</div>
                  {selectedCustomer.city && (
                    <div className="text-xs text-muted-foreground">{selectedCustomer.city}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
