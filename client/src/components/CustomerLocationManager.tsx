import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Trash2, Star, StarOff, Navigation } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MapSelector from './MapSelector';

interface CustomerLocationManagerProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onAddNewLocation: () => void;
}

interface CustomerLocation {
  locationId: string;
  isPrimary: boolean;
  location: {
    id: string;
    name: string;
    type: string;
    status: string;
    address: string;
    number?: string;
    neighborhood?: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: string;
    longitude?: string;
  };
}

export function CustomerLocationManager({ 
  customerId, 
  isOpen, 
  onClose, 
  onAddNewLocation 
}: CustomerLocationManagerProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customer locations
  const { data: customerLocationsData, isLoading: isLoadingCustomerLocations } = useQuery({
    queryKey: [`/api/customers/${customerId}/locations`],
    enabled: isOpen && !!customerId,
  });

  // Fetch all available locations
  const { data: allLocationsData, isLoading: isLoadingAllLocations } = useQuery({
    queryKey: ['/api/locations'],
    enabled: isOpen,
  });

  const customerLocations: CustomerLocation[] = customerLocationsData?.data || [];
  const allLocations = Array.isArray(allLocationsData?.data) ? allLocationsData.data : [];
  
  // Filter available locations (not already associated)
  const availableLocations = allLocations.filter(
    (location: any) => !customerLocations.find(cl => cl.locationId === location.id)
  );

  // Add location mutation
  const addLocationMutation = useMutation({
    mutationFn: async ({ locationId, isPrimary }: { locationId: string; isPrimary: boolean }) => {
      return apiRequest('POST', `/api/customers/${customerId}/locations`, { locationId, isPrimary });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/locations`] });
      setSelectedLocationId('');
      toast({
        title: "Localização adicionada",
        description: "A localização foi associada ao cliente com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar localização",
        description: error.message || "Não foi possível associar a localização ao cliente.",
        variant: "destructive"
      });
    }
  });

  // Remove location mutation
  const removeLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      console.log('DELETE mutation called with locationId:', locationId);
      if (!locationId) {
        throw new Error('LocationId is required');
      }
      return apiRequest('DELETE', `/api/customers/${customerId}/locations/${locationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/locations`] });
      toast({
        title: "Localização removida",
        description: "A localização foi removida do cliente com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover localização",
        description: error.message || "Não foi possível remover a localização do cliente.",
        variant: "destructive"
      });
    }
  });

  // Set primary location mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (locationId: string) => {
      // Remove current location and re-add as primary
      await apiRequest('DELETE', `/api/customers/${customerId}/locations/${locationId}`);
      return apiRequest('POST', `/api/customers/${customerId}/locations`, { locationId, isPrimary: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/locations`] });
      toast({
        title: "Localização principal",
        description: "A localização foi definida como principal."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao definir localização principal",
        description: error.message || "Não foi possível definir a localização como principal.",
        variant: "destructive"
      });
    }
  });

  const handleAddLocation = () => {
    if (!selectedLocationId) {
      toast({
        title: "Selecione uma localização",
        description: "Escolha uma localização para associar ao cliente.",
        variant: "destructive"
      });
      return;
    }

    const isPrimary = customerLocations.length === 0; // First location is primary by default
    addLocationMutation.mutate({ locationId: selectedLocationId, isPrimary });
  };

  const handleRemoveLocation = (locationId: string) => {
    console.log('Removing location:', locationId);
    if (!locationId) {
      toast({
        title: "Erro",
        description: "ID da localização não encontrado.",
        variant: "destructive"
      });
      return;
    }
    removeLocationMutation.mutate(locationId);
  };

  const handleSetPrimary = (locationId: string) => {
    setPrimaryMutation.mutate(locationId);
  };

  const getLocationTypeColor = (type: string) => {
    const colors = {
      cliente: 'bg-blue-100 text-blue-800',
      ativo: 'bg-green-100 text-green-800',
      filial: 'bg-purple-100 text-purple-800',
      tecnico: 'bg-orange-100 text-orange-800',
      parceiro: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.cliente;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-gray-100 text-gray-800',
      manutencao: 'bg-yellow-100 text-yellow-800',
      suspenso: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.ativo;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Gerenciar Locais do Cliente
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova localizações associadas a este cliente favorecido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Location Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Adicionar Nova Localização</h3>
              <Button
                onClick={onAddNewLocation}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar Nova Localização
              </Button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma localização existente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center gap-2">
                          <span>{location.name}</span>
                          <Badge variant="outline" className={getLocationTypeColor(location.type)}>
                            {location.type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {location.city}, {location.state}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddLocation}
                disabled={!selectedLocationId || addLocationMutation.isPending}
                className="px-6"
              >
                {addLocationMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>

          {/* Current Locations Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Locais Associadas ({customerLocations.length})
            </h3>

            {isLoadingCustomerLocations ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : customerLocations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    Nenhuma localização associada
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Adicione localizações para associar este cliente a locais específicos.
                  </p>
                  <Button
                    onClick={onAddNewLocation}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Nova Localização
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {customerLocations.map((customerLocation) => (
                  <Card key={customerLocation.locationId} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-lg">
                              {customerLocation.location?.name || 'Local não especificado'}
                            </h4>
                            {customerLocation.isPrimary && (
                              <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Principal
                              </Badge>
                            )}
                            <Badge variant="outline" className={getLocationTypeColor(customerLocation.location?.type || 'other')}>
                              {customerLocation.location?.type || 'Não especificado'}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(customerLocation.location?.status || 'active')}>
                              {customerLocation.location?.status || 'Ativo'}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Navigation className="h-4 w-4" />
                              {customerLocation.location?.address || 'Endereço não especificado'}
                              {customerLocation.location?.number && `, ${customerLocation.location.number}`}
                              {customerLocation.location?.neighborhood && `, ${customerLocation.location.neighborhood}`}
                            </div>
                            <div className="mt-1">
                              {customerLocation.location?.city || 'Cidade'}, {customerLocation.location?.state || 'Estado'} - {customerLocation.location?.zipCode || 'CEP'}
                            </div>
                          </div>

                          {(customerLocation.location?.latitude && customerLocation.location?.longitude) && (
                            <div className="text-xs text-gray-500">
                              Coordenadas: {parseFloat(customerLocation.location.latitude).toFixed(6)}, {parseFloat(customerLocation.location.longitude).toFixed(6)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!customerLocation.isPrimary && (
                            <Button
                              onClick={() => handleSetPrimary(customerLocation.locationId)}
                              variant="outline"
                              size="sm"
                              disabled={setPrimaryMutation.isPending}
                              className="flex items-center gap-1"
                            >
                              <StarOff className="h-3 w-3" />
                              Definir como Principal
                            </Button>
                          )}
                          <Button
                            onClick={() => handleRemoveLocation(customerLocation.locationId)}
                            variant="outline"
                            size="sm"
                            disabled={removeLocationMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}