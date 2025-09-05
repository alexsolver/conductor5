import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Building, Settings, Clock, Shield } from 'lucide-react';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MapSelector from './MapSelector';
import { renderAddressSafely } from '@/utils/addressFormatter';

const locationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['cliente', 'ativo', 'filial', 'tecnico', 'parceiro']),
  status: z.enum(['ativo', 'inativo', 'manutencao', 'suspenso']).default('ativo'),

  // Address fields
  address: z.string().min(1, "Endereço é obrigatório"),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  country: z.string().default('Brasil'),

  // Geographic coordinates
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  // Business hours and SLA
  timezone: z.string().default('America/Sao_Paulo'),

  // Access and security
  accessInstructions: z.string().optional(),
  requiresAuthorization: z.boolean().default(false),

  // Técnico Principal
  primaryTechnicianId: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: any;
  onSuccess?: () => void;
}

export function LocationModal({ isOpen, onClose, location, onSuccess }: LocationModalProps) {
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar técnicos ativos
  const { data: techniciansData, isLoading: isLoadingTechnicians, error: techniciansError } = useQuery({
    queryKey: ['technicians-active'],
    queryFn: async () => {
      const response = await apiRequest('/api/user-management/users');
      return response;
    },
    enabled: isOpen, // Só busca quando o modal está aberto
  });

  // Filtrar apenas técnicos ativos
  const activeTechnicians = techniciansData?.users?.filter(user => user.isActive === true) || [];

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || "",
      type: location?.type || 'cliente',
      status: location?.status || 'ativo',
      address: location?.address || "",
      number: location?.number || "",
      complement: location?.complement || "",
      neighborhood: location?.neighborhood || "",
      city: location?.city || "",
      state: location?.state || "",
      zipCode: location?.zipCode || "",
      country: location?.country || 'Brasil',
      latitude: location?.latitude || "",
      longitude: location?.longitude || "",
      timezone: location?.timezone || 'America/Sao_Paulo',
      accessInstructions: location?.accessInstructions || "",
      requiresAuthorization: location?.requiresAuthorization || false,
      primaryTechnicianId: location?.primaryTechnicianId || "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      if (location?.id) {
        return apiRequest(`/api/locations/${location.id}`, {
          method: 'PUT',
          body: data
        });
      } else {
        return apiRequest('/api/locations', {
          method: 'POST',
          body: data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({
        title: location?.id ? "Localização atualizada" : "Localização criada",
        description: location?.id ? "A localização foi atualizada com sucesso." : "A localização foi criada com sucesso."
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a localização.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: LocationFormData) => {
    mutation.mutate(data);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    form.setValue('latitude', lat.toString());
    form.setValue('longitude', lng.toString());
    setShowMap(false);
    toast({
      title: "Coordenadas definidas",
      description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
    });
  };

  const currentLat = parseFloat(form.watch('latitude') || '-15.7942');
  const currentLng = parseFloat(form.watch('longitude') || '-47.8825');

  const addressData = {
    address: form.watch('address'),
    number: form.watch('number'),
    neighborhood: form.watch('neighborhood'),
    city: form.watch('city'),
    state: form.watch('state'),
    zipCode: form.watch('zipCode'),
    country: form.watch('country')
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="location-modal-description">
          <div id="location-modal-description" className="sr-only">
            Formulário para criar ou editar informações de localização
          </div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {location?.id ? "Editar Localização" : "Nova Localização"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Endereço
                  </TabsTrigger>
                  <TabsTrigger value="coordinates" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Coordenadas
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Localização</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Matriz São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cliente">Cliente</SelectItem>
                              <SelectItem value="ativo">Ativo/Equipamento</SelectItem>
                              <SelectItem value="filial">Filial</SelectItem>
                              <SelectItem value="tecnico">Técnico</SelectItem>
                              <SelectItem value="parceiro">Parceiro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                              <SelectItem value="suspenso">Suspenso</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryTechnicianId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Técnico Principal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  isLoadingTechnicians 
                                    ? "Carregando técnicos..." 
                                    : techniciansError 
                                    ? "Erro ao carregar técnicos" 
                                    : "Selecione um técnico"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Nenhum técnico</SelectItem>
                              {activeTechnicians.length === 0 && !isLoadingTechnicians && (
                                <SelectItem value="" disabled>
                                  Nenhum técnico ativo encontrado
                                </SelectItem>
                              )}
                              {activeTechnicians.map((technician) => (
                                <SelectItem key={technician.id} value={technician.id}>
                                  {technician.firstName} {technician.lastName} - {technician.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input placeholder="Apt, Sala, Andar..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="SP, RJ, MG..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="00000-000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="coordinates" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="-23.550520"
                              {...field}
                              type="number"
                              step="any"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="-46.633308"
                              {...field}
                              type="number"
                              step="any"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMap(true)}
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Selecionar no Mapa
                    </Button>
                  </div>

                  {(form.watch('latitude') && form.watch('longitude')) && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2">Coordenadas Atuais</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Latitude: {form.watch('latitude')}</div>
                        <div>Longitude: {form.watch('longitude')}</div>
                        <div className="mt-2">
                          <a
                            href={`https://www.google.com/maps?q=${form.watch('latitude')},${form.watch('longitude')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Ver no Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuso Horário</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o fuso horário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                            <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                            <SelectItem value="America/Rio_Branco">Acre (GMT-5)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiresAuthorization"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Requer Autorização</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Local requer autorização especial para acesso
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accessInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instruções de Acesso</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instruções especiais para acesso ao local..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvando...' : location?.id ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Map Selector Modal */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-5xl max-h-[90vh]" aria-describedby="map-selector-description">
          <div id="map-selector-description" className="sr-only">
            Seletor de mapa interativo para definir coordenadas de localização
          </div>
          <DialogHeader>
            <DialogTitle>Selecionar Coordenadas no Mapa</DialogTitle>
          </DialogHeader>
          <MapSelector
            initialLat={currentLat}
            initialLng={currentLng}
            addressData={addressData}
            onLocationSelect={handleLocationSelect}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}