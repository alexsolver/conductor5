import { useState } from 'react';
import { Plus, MapPin, Building2, User, Wrench, Users, Search, Filter, MoreHorizontal, Map, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MapSelector from '@/components/MapSelector';

// Form schema based on the Location entity
const locationFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  type: z.enum(['cliente', 'ativo', 'filial', 'tecnico', 'parceiro']),
  status: z.enum(['ativo', 'inativo', 'manutencao', 'suspenso']).default('ativo'),
  address: z.string().min(1, "Endereço é obrigatório"),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  country: z.string().default('Brasil'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().default('America/Sao_Paulo'),
  accessInstructions: z.string().optional(),
  requiresAuthorization: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

type LocationFormData = z.infer<typeof locationFormSchema>;

interface Location {
  id: string;
  name: string;
  type: 'cliente' | 'ativo' | 'filial' | 'tecnico' | 'parceiro';
  status: 'ativo' | 'inativo' | 'manutencao' | 'suspenso';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  requiresAuthorization: boolean;
  tags: string[];
  createdAt: string;
}

const locationTypeConfig = {
  cliente: { label: 'Cliente', icon: Building2, color: 'bg-blue-100 text-blue-800' },
  ativo: { label: 'Ativo', icon: MapPin, color: 'bg-green-100 text-green-800' },
  filial: { label: 'Filial', icon: Building2, color: 'bg-purple-100 text-purple-800' },
  tecnico: { label: 'Técnico', icon: User, color: 'bg-orange-100 text-orange-800' },
  parceiro: { label: 'Parceiro', icon: Users, color: 'bg-indigo-100 text-indigo-800' }
};

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  manutencao: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-800' },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-800' }
};

export default function Locations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: '',
      type: 'cliente',
      status: 'ativo',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil',
      timezone: 'America/Sao_Paulo',
      requiresAuthorization: false,
      tags: []
    }
  });

  // Fetch locations with filters
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['/api/locations', { 
      search: searchTerm || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await apiRequest('GET', `/api/locations?${params.toString()}`);
      return response.json();
    }
  });

  // Fetch location stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/locations/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/locations/stats');
      return response.json();
    }
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const response = await apiRequest('POST', '/api/locations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/locations/stats'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Local criado",
        description: "Local criado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar local.",
        variant: "destructive"
      });
    }
  });

  // CEP search functionality
  const handleCepSearch = async (event: any) => {
    const cep = event.target?.value || '';
    if (!cep || cep.length < 8) return;

    try {
      const response = await apiRequest('GET', `/api/locations/cep/${cep}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Auto-fill form with CEP data
        form.setValue('address', result.data.address || '');
        form.setValue('neighborhood', result.data.neighborhood || '');
        form.setValue('city', result.data.city || '');
        form.setValue('state', result.data.state || '');
        form.setValue('zipCode', result.data.zipCode || '');
        
        // Set coordinates if available
        if (result.data.latitude && result.data.longitude) {
          form.setValue('latitude', result.data.latitude);
          form.setValue('longitude', result.data.longitude);
        }

        toast({
          title: "CEP encontrado",
          description: "Endereço preenchido automaticamente."
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: result.error || "Não foi possível encontrar o endereço.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar CEP. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const onSubmit = (data: LocationFormData) => {
    createLocationMutation.mutate(data);
  };

  const locations = locationsData?.data || [];
  const stats = statsData?.data || {};

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between ml-[20px] mr-[20px]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locais</h1>
          <p className="text-muted-foreground">
            Gerencie locais, endereços e pontos de atendimento
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Local
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Local</DialogTitle>
              <DialogDescription>
                Adicione um novo local ao sistema com informações completas
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="address">Endereço</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Local</FormLabel>
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
                                <SelectItem value="ativo">Ativo</SelectItem>
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
                  </TabsContent>
                  
                  <TabsContent value="address" className="space-y-4">
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
                    <div className="grid grid-cols-3 gap-4">
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
                      <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Sala 101" {...field} />
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
                              <Input placeholder="Centro" {...field} />
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
                              <Input placeholder="São Paulo" {...field} />
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
                              <Input placeholder="SP" {...field} />
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
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="01234-567" 
                                  {...field}
                                  onBlur={handleCepSearch}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCepSearch({ target: { value: field.value } })}
                                  disabled={!field.value || field.value.length < 8}
                                >
                                  Buscar
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Coordenadas na aba de Endereço */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="-23.5505"
                                  type="number" 
                                  step="any"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Inicializa coordenadas temporárias com valores atuais
                                    const currentLat = form.getValues('latitude');
                                    const currentLng = form.getValues('longitude');
                                    if (currentLat !== undefined && currentLng !== undefined) {
                                      setTempCoordinates({ lat: currentLat, lng: currentLng });
                                    }
                                    setIsMapDialogOpen(true);
                                  }}
                                  className="px-3"
                                  title="Buscar no mapa"
                                >
                                  <Map className="h-4 w-4" />
                                </Button>
                              </div>
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
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="-46.6333"
                                  type="number" 
                                  step="any"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Inicializa coordenadas temporárias com valores atuais
                                    const currentLat = form.getValues('latitude');
                                    const currentLng = form.getValues('longitude');
                                    if (currentLat !== undefined && currentLng !== undefined) {
                                      setTempCoordinates({ lat: currentLat, lng: currentLng });
                                    }
                                    setIsMapDialogOpen(true);
                                  }}
                                  className="px-3"
                                  title="Buscar no mapa"
                                >
                                  <Map className="h-4 w-4" />
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="accessInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instruções de Acesso</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Instruções especiais para acesso ao local..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requiresAuthorization"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Requer Autorização
                            </FormLabel>
                            <FormDescription>
                              Local requer autorização especial para acesso
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createLocationMutation.isPending}
                  >
                    {createLocationMutation.isPending ? 'Criando...' : 'Criar Local'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Map Selection Dialog */}
        <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Selecionar Localização no Mapa</DialogTitle>
              <DialogDescription>
                Use a barra de pesquisa para encontrar o endereço. Clique em "Confirmar Localização" para aplicar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <MapSelector 
                initialLat={form.getValues('latitude') || -23.5505}
                initialLng={form.getValues('longitude') || -46.6333}
                addressData={{
                  address: form.getValues('address'),
                  number: form.getValues('number'),
                  neighborhood: form.getValues('neighborhood'),
                  city: form.getValues('city'),
                  state: form.getValues('state'),
                  zipCode: form.getValues('zipCode'),
                  country: form.getValues('country')
                }}
                onLocationSelect={(lat, lng) => {
                  // Apenas atualiza as coordenadas temporárias, não fecha o modal
                  setTempCoordinates({ lat, lng });
                }}
              />
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMapDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (tempCoordinates) {
                      form.setValue('latitude', tempCoordinates.lat);
                      form.setValue('longitude', tempCoordinates.lng);
                    }
                    setIsMapDialogOpen(false);
                  }}
                  disabled={!tempCoordinates}
                >
                  Confirmar Localização
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Locais</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locais Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus?.ativo || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Coordenadas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withCoordinates || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byCity ? Object.keys(stats.byCity).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Filtre locais por tipo, status ou termo de busca
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, endereço ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="filial">Filial</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Locais ({locations.length})</CardTitle>
          <CardDescription>
            Lista de todos os locais cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Cidade/Estado</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location: Location) => {
                  console.log('Location type:', location.type, 'Available configs:', Object.keys(locationTypeConfig));
                  const typeConfig = locationTypeConfig[location.type] || locationTypeConfig['cliente'];
                  const statusConf = statusConfig[location.status] || statusConfig['ativo'];
                  const TypeIcon = typeConfig?.icon || Building;
                  
                  return (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{location.name}</div>
                            {location.requiresAuthorization && (
                              <Badge variant="outline" className="text-xs">
                                Requer Autorização
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConf.color}>
                          {statusConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {location.address}
                      </TableCell>
                      <TableCell>
                        {location.city}, {location.state}
                      </TableCell>
                      <TableCell>
                        {location.latitude && location.longitude ? (
                          <Badge variant="outline" className="text-xs">
                            GPS
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Ver no Mapa</DropdownMenuItem>
                            <DropdownMenuItem>Histórico</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {locations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <MapPin className="mx-auto h-8 w-8 mb-2" />
                        Nenhum local encontrado
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}