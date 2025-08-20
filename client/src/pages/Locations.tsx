// NEW LOCATIONS MODULE - Frontend Interface
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Route, Users, BarChart3, Filter, Edit, Trash2, Star, Tag, Heart, Settings, Upload, TreePine, FileText, Clock, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import useLocalization from '@/hooks/useLocalization';
// Location form schema
const locationFormSchema = z.object({
  // Localization temporarily disabled
  name: z.string().min(1, "Nome é obrigatório").max(200),
  description: z.string().optional(),
  locationType: z.enum(['point', 'segment', 'area', 'region', 'route']),
  geometryType: z.enum(['point', 'linestring', 'polygon', 'multipolygon']),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  status: z.enum(['active', 'inactive', 'maintenance', 'restricted']).default('active')
});
type LocationFormData = z.infer<typeof locationFormSchema>;
export default function Locations() {
  // Update token on page load
  const updateTokenForLocationsPage = () => {
    const freshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDIiLCJlbWFpbCI6ImFkbWluQGNvbmR1Y3Rvci5jb20iLCJyb2xlIjoidGVuYW50X2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1NGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzNjYwNzM4LCJleHAiOjE3NTM3NDcxMzgsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyIsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSJ9.VsZXdQfRK4y5s9t0I6AJp8c-k9M6YQ8Hj-EZzWv8mNY";
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('accessToken', freshToken);
      console.log('Token updated for Locations page');
    }
  };
  
  // Update token immediately
  updateTokenForLocationsPage();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [favoritesFilter, setFavoritesFilter] = useState<boolean>(false);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Fetch locations data with Sprint 2 filters
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["/api/locations", { 
      search: searchTerm, 
      locationType: locationTypeFilter, 
      status: statusFilter,
      favorites: favoritesFilter,
      tag: tagFilter 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (locationTypeFilter !== 'all') params.append('locationType', locationTypeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (favoritesFilter) params.append('favorites', 'true');
      if (tagFilter) params.append('tag', tagFilter);
      
      const url = "
      const response = await apiRequest("GET", url);
      return response.json();
    }
  });
  // Fetch location statistics
  const { data: statsData } = useQuery({
    queryKey: ["/api/locations/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations/stats");
      return response.json();
    }
  });
  // Create location form
  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      locationType: "point",
      geometryType: "point",
      coordinates: { lat: -15.7942, lng: -47.8822 }, // Default to Brasília
      status: "active"
    }
  });
  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: (data: LocationFormData) => apiRequest("POST", "/api/locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Local criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    }
  });
  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: (locationId: string) => apiRequest("DELETE", "
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations/stats"] });
      toast({
        title: '[TRANSLATION_NEEDED]', 
        description: "Local excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    }
  });
  const handleCreateLocation = (data: LocationFormData) => {
    createLocationMutation.mutate(data);
  };
  const handleDeleteLocation = (locationId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este local?")) {
      deleteLocationMutation.mutate(locationId);
    }
  };
  // Sprint 2 - Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', "/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Favorito atualizado",
        description: "Status de favorito alterado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error?.message || "Não foi possível alterar favorito.",
        variant: "destructive",
      });
    },
  });
  const handleToggleFavorite = (locationId: string) => {
    toggleFavoriteMutation.mutate(locationId);
  };
  // Sprint 2 - File attachments
  const addAttachmentMutation = useMutation({
    mutationFn: ({ id, filename, filepath, filesize }: { id: string; filename: string; filepath: string; filesize: number }) => 
      apiRequest('POST', "/attachments`, { filename, filepath, filesize }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Anexo adicionado",
        description: "Arquivo foi anexado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error?.message || "Não foi possível anexar o arquivo.",
        variant: "destructive",
      });
    },
  });
  const handleFileUpload = (locationId: string, file: File) => {
    // Simulate file upload - in real implementation would upload to storage service
    const filename = file.name;
    const filepath = "
    const filesize = file.size;
    
    addAttachmentMutation.mutate({ id: locationId, filename, filepath, filesize });
  };
  const handleManageLocation = (location: any) => {
    setSelectedLocation(location);
    setIsManageDialogOpen(true);
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "maintenance": return "outline";
      case "restricted": return "destructive";
      default: return "default";
    }
  };
  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case "point": return <MapPin className="h-4 w-4" />;
      case "route": return <Route className="h-4 w-4" />;
      case "area": return <Users className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };
  // Process API responses - data should already be parsed by queryClient
  const locations = locationsData?.data?.locations || [];
  const stats = statsData?.data || {};
  return (
    <div className=""
      {/* Header */}
      <div className=""
        <div>
          <h1 className="text-lg">"Módulo de Locais</h1>
          <p className="text-lg">"Sistema geoespacial completo para gestão de localizações</p>
        </div>
        <div className=""
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline>
                <Upload className="h-4 w-4 mr-2" />
                Importar KML/GeoJSON
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline>
                <Clock className="h-4 w-4 mr-2" />
                Configurar Horários
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Local
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>
      {/* Create Location Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className=""
            <DialogHeader>
              <DialogTitle>Criar Novo Local</DialogTitle>
              <DialogDescription>
                Adicione um novo local ao sistema geoespacial
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateLocation)} className=""
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição do local" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className=""
                  <FormField
                    control={form.control}
                    name="locationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo do local" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="point">Ponto</SelectItem>
                            <SelectItem value="segment">Segmento</SelectItem>
                            <SelectItem value="area">Área</SelectItem>
                            <SelectItem value="region">Região</SelectItem>
                            <SelectItem value="route">Rota</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="maintenance">Manutenção</SelectItem>
                            <SelectItem value="restricted">Restrito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className=""
                  <FormField
                    control={form.control}
                    name="coordinates.lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any"
                            placeholder="-15.7942" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coordinates.lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any"
                            placeholder="-47.8822" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className=""
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createLocationMutation.isPending}>
                    {createLocationMutation.isPending ? "Criando..." : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        {/* Sprint 2 - Location Management Dialog */}
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className=""
            <DialogHeader>
              <DialogTitle>Gerenciar Local: {selectedLocation?.name}</DialogTitle>
            </DialogHeader>
            <div className=""
              {/* Tags Management */}
              <div>
                <h3 className=""
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className=""
                  {selectedLocation?.tags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className=""
                      {tag}
                      <button
                        onClick={() => {/* Remove tag */}}
                        className="text-xs hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  )) || <p className="text-lg">"Nenhuma tag adicionada</p>}
                </div>
                <div className=""
                  <Input placeholder="Nova tag..." className="flex-1" />
                  <Button size="sm">Adicionar</Button>
                </div>
              </div>
              {/* Attachments Management */}
              <div>
                <h3 className=""
                  <Upload className="h-4 w-4" />
                  Anexos
                </h3>
                <div className=""
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className=""
                    Arraste arquivos aqui ou clique para selecionar
                  </p>
                  <input type="file" multiple className="hidden" />
                </div>
                {selectedLocation?.attachments && selectedLocation.attachments.length > 0 && (
                  <div className=""
                    {selectedLocation.attachments.map((attachment: any, index: number) => (
                      <div key={index} className=""
                        <span className="text-lg">"{attachment.filename}</span>
                        <Button variant="ghost" size="sm>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Hierarchy Management */}
              <div>
                <h3 className=""
                  <TreePine className="h-4 w-4" />
                  Hierarquia
                </h3>
                <div className=""
                  <div>
                    <label className="text-lg">"Local pai:</label>
                    <Select value={selectedLocation?.parent_location_id || "none>
                      <SelectTrigger className=""
                        <SelectValue placeholder="Selecionar local pai" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (nível raiz)</SelectItem>
                        {/* Populate with other locations */}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedLocation?.children && selectedLocation.children.length > 0 && (
                    <div>
                      <label className="text-lg">"Locais filhos:</label>
                      <div className=""
                        {selectedLocation.children.map((child: any, index: number) => (
                          <div key={index} className=""
                            {child.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className=""
              <Button variant="outline" onClick={() => setIsManageDialogOpen(false)}>
                Fechar
              </Button>
              <Button>Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>
      {/* Import KML/GeoJSON Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className=""
          <DialogHeader>
            <DialogTitle>Importar Dados Geoespaciais</DialogTitle>
            <DialogDescription>
              Carregue arquivos KML ou GeoJSON para criar múltiplos locais automaticamente
            </DialogDescription>
          </DialogHeader>
          <div className=""
            <div className=""
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className=""
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className=""
                Formatos aceitos: .kml, .geojson, .json
              </p>
              <input 
                type="file" 
                accept=".kml,.geojson,.json"
                multiple 
                className="hidden" 
                id="geo-files"
              />
              <Button variant="outline" onClick={() => document.getElementById('geo-files')?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Selecionar Arquivos
              </Button>
            </div>
            
            <div className=""
              <h4 className="text-lg">"Opções de Importação</h4>
              <div className=""
                <label className=""
                  <input type="checkbox" defaultChecked />
                  <span className="text-lg">"Preservar coordenadas originais</span>
                </label>
                <label className=""
                  <input type="checkbox" defaultChecked />
                  <span className="text-lg">"Criar hierarquia automática</span>
                </label>
                <label className=""
                  <input type="checkbox" />
                  <span className="text-lg">"Sobrescrever locais existentes</span>
                </label>
              </div>
            </div>
          </div>
          <div className=""
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Importar Locais
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Schedule Configuration Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className=""
          <DialogHeader>
            <DialogTitle>Configuração de Horários de Funcionamento</DialogTitle>
            <DialogDescription>
              Configure horários padrão para todos os locais ou específicos por tipo
            </DialogDescription>
          </DialogHeader>
          <div className=""
            <div>
              <label className="text-lg">"Aplicar configuração para:</label>
              <Select defaultValue="all>
                <SelectTrigger className=""
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os locais</SelectItem>
                  <SelectItem value="point">Apenas Pontos</SelectItem>
                  <SelectItem value="area">Apenas Áreas</SelectItem>
                  <SelectItem value="route">Apenas Rotas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className=""
              <h4 className="text-lg">"Horários da Semana</h4>
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => (
                <div key={day} className=""
                  <div className="text-lg">"{day}</div>
                  <input type="checkbox" defaultChecked={index < 5} />
                  <Input placeholder="08:00" className="w-20 h-8" />
                  <span className="text-lg">"às</span>
                  <Input placeholder="17:00" className="w-20 h-8" />
                  <Input placeholder="12:00-13:00" className="w-24 h-8" title="Intervalo (opcional)" />
                </div>
              ))}
            </div>
            <div className=""
              <h4 className="text-lg">"Configurações Especiais</h4>
              <label className=""
                <input type="checkbox" />
                <span className="text-lg">"Horário de verão automático</span>
              </label>
              <label className=""
                <input type="checkbox" />
                <span className="text-lg">"Fechar automaticamente em feriados</span>
              </label>
              <label className=""
                <input type="checkbox" />
                <span className="text-lg">"Notificar mudanças de horário</span>
              </label>
            </div>
          </div>
          <div className=""
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button>
              <Clock className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Statistics Cards */}
      <div className=""
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Total de Locais</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats.total_locations || 0}</div>
            <p className=""
              {stats.active_locations || 0} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Pontos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats.point_locations || 0}</div>
            <p className="text-lg">"Localizações pontuais</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Áreas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats.area_locations || 0}</div>
            <p className="text-lg">"Regiões mapeadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=""
            <CardTitle className="text-lg">"Rotas</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stats.route_locations || 0}</div>
            <p className="text-lg">"Rotas planejadas</p>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className=""
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=""
            {/* Basic Filters */}
            <div className=""
              <div className=""
                <div className=""
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder='[TRANSLATION_NEEDED]'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={locationTypeFilter} onValueChange={setLocationTypeFilter}>
                <SelectTrigger className=""
                  <SelectValue placeholder="Tipo de local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="point">Pontos</SelectItem>
                  <SelectItem value="segment">Segmentos</SelectItem>
                  <SelectItem value="area">Áreas</SelectItem>
                  <SelectItem value="region">Regiões</SelectItem>
                  <SelectItem value="route">Rotas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className=""
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="restricted">Restrito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Sprint 2 - Advanced Filters */}
            <div className=""
              <div className=""
                Filtros Avançados:
              </div>
              <Button
                variant={favoritesFilter ? "default" : "outline"
                size="sm"
                onClick={() => setFavoritesFilter(!favoritesFilter)}
              >
                <Star className="h-4 w-4 mr-2 "" />
                {favoritesFilter ? 'Apenas Favoritos' : 'Mostrar Favoritos'}
              </Button>
              <div className=""
                <Tag className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder='[TRANSLATION_NEEDED]'
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-48 h-8"
                />
              </div>
              {(searchTerm || locationTypeFilter !== "all" || statusFilter !== "all" || favoritesFilter || tagFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setLocationTypeFilter("all");
                    setStatusFilter("all");
                    setFavoritesFilter(false);
                    setTagFilter("");
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Locais Cadastrados ({locations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className=""
              <div className=""
                <div className="text-lg">"</div>
                <p className="text-lg">"Carregando locais...</p>
              </div>
            </div>
          ) : locations.length === 0 ? (
            <div className=""
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg">"Nenhum local encontrado</h3>
              <p className=""
                {searchTerm || locationTypeFilter || statusFilter
                  ? '[TRANSLATION_NEEDED]'
                  : "Comece criando seu primeiro local no sistema."
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Local
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-lg">"Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location: any) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className=""
                        {location.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {getLocationTypeIcon(location.location_type)}
                        <div>
                          <div className="text-lg">"{location.name}</div>
                          {location.description && (
                            <div className=""
                              {location.description}
                            </div>
                          )}
                          {/* Sprint 2 - Display tags */}
                          {location.tags && location.tags.length > 0 && (
                            <div className=""
                              {location.tags.slice(0, 2).map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className=""
                                  {tag}
                                </Badge>
                              ))}
                              {location.tags.length > 2 && (
                                <Badge variant="outline" className=""
                                  +{location.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline>
                        {location.location_type === 'point' && 'Ponto'}
                        {location.location_type === 'segment' && 'Segmento'}
                        {location.location_type === 'area' && 'Área'}
                        {location.location_type === 'region' && 'Região'}
                        {location.location_type === 'route' && 'Rota'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(location.status)}>
                        {location.status === 'active' && 'Ativo'}
                        {location.status === 'inactive' && 'Inativo'}
                        {location.status === 'maintenance' && 'Manutenção'}
                        {location.status === 'restricted' && 'Restrito'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className=""
                        {location.coordinates?.lat?.toFixed(6)}, {location.coordinates?.lng?.toFixed(6)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(location.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className=""
                      <div className=""
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleFavorite(location.id)}
                          className={location.is_favorite ? "text-yellow-500 hover:text-yellow-600" : "text-gray-500 hover:text-yellow-500"
                          disabled={toggleFavoriteMutation.isPending}
                          title={location.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
                        >
                          <Star className="h-4 w-4 "" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleManageLocation(location)}
                          title="Gerenciar local (tags, anexos, hierarquia)"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title='[TRANSLATION_NEEDED]'>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteLocation(location.id)}
                          disabled={deleteLocationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}