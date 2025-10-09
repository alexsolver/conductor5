/**
 * Entity Search Field - Componente de busca e seleção de entidades
 * 
 * Permite buscar clientes/beneficiários/locais com autocomplete
 * Integra com endpoint /api/internal-forms/entity/search-or-create
 * 
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Check, 
  Users, 
  Building2,
  MapPin,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntitySearchFieldProps {
  label: string;
  entityType: 'client' | 'location' | 'beneficiary';
  searchBy?: 'cpf' | 'cnpj' | 'email' | 'name';
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  onEntitySelect?: (entity: any) => void;
}

const ENTITY_ICONS = {
  client: Users,
  location: MapPin,
  beneficiary: User,
  company: Building2
};

export function EntitySearchField({
  label,
  entityType,
  searchBy = 'name',
  value = '',
  onChange,
  placeholder,
  required = false,
  onEntitySelect
}: EntitySearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const Icon = ENTITY_ICONS[entityType] || Users;

  // Query para buscar entidades
  const getSearchEndpoint = () => {
    if (entityType === 'client') return '/api/customers/search';
    return `/api/${entityType}s/search`;
  };

  const { data: entities = [], isLoading } = useQuery({
    queryKey: [getSearchEndpoint(), searchTerm],
    enabled: searchTerm.length >= 2,
    queryFn: async () => {
      const response = await fetch(
        `${getSearchEndpoint()}?q=${encodeURIComponent(searchTerm)}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Falha ao buscar entidades');
      }
      
      return response.json();
    }
  });

  const handleSelect = (entity: any) => {
    setSelectedEntity(entity);
    onChange(`entity:${entityType}:${entity.id}`);
    
    if (onEntitySelect) {
      onEntitySelect(entity);
    }
    
    setOpen(false);
  };

  const getEntityDisplayName = (entity: any) => {
    if (entityType === 'client') {
      return entity.firstName && entity.lastName 
        ? `${entity.firstName} ${entity.lastName}`
        : entity.email || entity.cpf || 'Cliente';
    }
    return entity.name || entity.id;
  };

  const getEntitySubtext = (entity: any) => {
    if (entityType === 'client') {
      const parts = [];
      if (entity.cpf) parts.push(`CPF: ${entity.cpf}`);
      if (entity.email) parts.push(entity.email);
      return parts.join(' • ');
    }
    return '';
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid={`button-search-${entityType}`}
          >
            {selectedEntity ? (
              <div className="flex items-center gap-2 flex-1 text-left">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {getEntityDisplayName(selectedEntity)}
                  </div>
                  {getEntitySubtext(selectedEntity) && (
                    <div className="text-xs text-muted-foreground truncate">
                      {getEntitySubtext(selectedEntity)}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="ml-2">
                  Selecionado
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || `Buscar ${entityType}...`}
              </span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={`Buscar por ${searchBy}...`}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="py-6 text-center text-sm">
                    Buscando...
                  </div>
                ) : searchTerm.length < 2 ? (
                  <div className="py-6 text-center text-sm">
                    Digite pelo menos 2 caracteres para buscar
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground mb-4">
                      Nenhum resultado encontrado
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // TODO: Abrir dialog de criação rápida
                        setOpen(false);
                      }}
                      data-testid="button-create-new"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Novo
                    </Button>
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {entities.map((entity: any) => (
                  <CommandItem
                    key={entity.id}
                    value={entity.id}
                    onSelect={() => handleSelect(entity)}
                    data-testid={`item-${entityType}-${entity.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {getEntityDisplayName(entity)}
                        </div>
                        {getEntitySubtext(entity) && (
                          <div className="text-xs text-muted-foreground truncate">
                            {getEntitySubtext(entity)}
                          </div>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedEntity?.id === entity.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedEntity && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-3 w-3 text-green-600" />
          <span>Selecionado com sucesso</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedEntity(null);
              onChange('');
            }}
            className="ml-auto"
            data-testid="button-clear-selection"
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
