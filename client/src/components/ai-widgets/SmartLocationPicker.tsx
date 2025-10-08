import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronsUpDown, MapPin, Building2, User, Phone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  customerId?: string;
  customerName?: string;
  contactName?: string;
  contactPhone?: string;
}

interface SmartLocationPickerProps {
  value?: string;
  onSelect: (locationId: string, location: Location) => void;
  placeholder?: string;
  hint?: string;
  showDetails?: boolean;
  customerId?: string;
  conversationContext?: {
    mentionedCity?: string;
    previousLocationId?: string;
    nearbyAddress?: string;
  };
}

export function SmartLocationPicker({
  value,
  onSelect,
  placeholder = 'Selecione uma localização',
  hint,
  showDetails = true,
  customerId,
  conversationContext
}: SmartLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar localizações
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['/api/locations'],
  });

  const locations = (locationsData as any)?.locations || [];

  // Fuzzy search function
  const fuzzyMatch = (text: string, query: string): number => {
    if (!text || !query) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower === queryLower) return 100;
    if (textLower.startsWith(queryLower)) return 90;
    if (textLower.includes(queryLower)) return 80;
    
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
  const filteredAndRankedLocations = useMemo(() => {
    let results = locations.map((location: Location) => {
      let score = 0;
      
      // Filter by customer if specified
      if (customerId && location.customerId !== customerId) {
        return { location, score: 0 };
      }
      
      // Text search score
      if (searchQuery) {
        score += fuzzyMatch(location.name, searchQuery);
        score += fuzzyMatch(location.address || '', searchQuery) * 0.9;
        score += fuzzyMatch(location.city || '', searchQuery) * 0.8;
        score += fuzzyMatch(location.state || '', searchQuery) * 0.7;
        score += fuzzyMatch(location.customerName || '', searchQuery) * 0.6;
      }

      // Context-based scoring
      if (conversationContext) {
        // Boost if city mentioned in conversation
        if (conversationContext.mentionedCity && 
            fuzzyMatch(location.city || '', conversationContext.mentionedCity) > 70) {
          score += 50;
        }

        // Boost if previously selected
        if (conversationContext.previousLocationId === location.id) {
          score += 30;
        }

        // Boost if near mentioned address
        if (conversationContext.nearbyAddress && 
            fuzzyMatch(location.address || '', conversationContext.nearbyAddress) > 70) {
          score += 40;
        }
      }

      return { location, score };
    });

    // Filter out zero scores and sort
    results = results
      .filter((r: any) => r.score > 0 || !searchQuery)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 50);

    return results.map((r: any) => r.location);
  }, [locations, searchQuery, customerId, conversationContext]);

  const selectedLocation = locations.find((l: Location) => l.id === value);

  return (
    <div className="space-y-2" data-testid="smart-location-picker">
      {hint && (
        <p className="text-sm text-muted-foreground" data-testid="text-picker-hint">
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
            data-testid="button-open-picker"
          >
            {selectedLocation ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{selectedLocation.name}</span>
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
              placeholder="Buscar por nome, endereço, cidade..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              data-testid="input-search-location"
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <CommandEmpty>Nenhuma localização encontrada.</CommandEmpty>
                  <CommandGroup>
                    {filteredAndRankedLocations.map((location: Location) => (
                      <CommandItem
                        key={location.id}
                        value={location.id}
                        onSelect={() => {
                          onSelect(location.id, location);
                          setOpen(false);
                        }}
                        className="flex items-center gap-2 py-3"
                        data-testid={`item-location-${location.id}`}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === location.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{location.name}</span>
                            {location.customerName && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {location.customerName}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location.address && <span>{location.address}</span>}
                              {location.city && location.state && (
                                <span> - {location.city}, {location.state}</span>
                              )}
                            </div>
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

      {/* Location Details Card */}
      {showDetails && selectedLocation && (
        <Card data-testid="card-location-details">
          <CardContent className="p-3 space-y-2 text-sm">
            {selectedLocation.customerName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Cliente</div>
                  <div>{selectedLocation.customerName}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium text-xs text-muted-foreground">Endereço</div>
                <div>{selectedLocation.address || 'Não informado'}</div>
                {selectedLocation.city && (
                  <div className="text-xs text-muted-foreground">
                    {selectedLocation.city}, {selectedLocation.state} - {selectedLocation.zipCode}
                  </div>
                )}
              </div>
            </div>
            {selectedLocation.contactName && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Contato</div>
                  <div>{selectedLocation.contactName}</div>
                  {selectedLocation.contactPhone && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedLocation.contactPhone}
                    </div>
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
