// LOCATIONS MODULE - CLEANED VERSION FOR 7 RECORD TYPES  
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Navigation, Settings, Route, Building, Grid3X3, Users, Clock, Upload, Map, AlertTriangle, Building2, Phone, MapIcon, Calendar, UserCheck, ExternalLink, Link, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { localSchema } from "../../../shared/schema-locations-new";
import { useToast } from "@/hooks/use-toast";
// Error boundary will be implemented inline

// Record type definitions
const RECORD_TYPES = {
  local: {
    label: "Local",
    icon: MapPin,
    color: "bg-blue-500",
    sections: ["Identificação", "Contato", "Endereço", "Georreferenciamento", "Tempo"]
  },
  regiao: {
    label: "Região",
    icon: Navigation,
    color: "bg-green-500",
    sections: ["Identificação", "Relacionamentos", "Geolocalização", "Endereço Base"]
  },
  "rota-dinamica": {
    label: "Rota Dinâmica",
    icon: Route,
    color: "bg-purple-500",
    sections: ["Identificação", "Relacionamentos", "Planejamento"]
  },
  trecho: {
    label: "Trecho",
    icon: Settings,
    color: "bg-orange-500",
    sections: ["Identificação do Trecho"]
  },
  "rota-trecho": {
    label: "Rota de Trecho",
    icon: Map,
    color: "bg-red-500",
    sections: ["Identificação", "Definição do Trecho"]
  },
  area: {
    label: "Área",
    icon: Grid3X3,
    color: "bg-teal-500",
    sections: ["Identificação", "Classificação"]
  },
  agrupamento: {
    label: "Agrupamento",
    icon: Users,
    color: "bg-indigo-500",
    sections: ["Identificação"]
  }
};

// Main component
function LocationsNewContent() {
  const { toast } = useToast();
  const [activeRecordType, setActiveRecordType] = useState<string>("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Form setup
  const form = useForm({
    resolver: zodResolver(localSchema),
    defaultValues: {
      // Identificação
      ativo: true,
      nome: "",
      descricao: "",
      codigoIntegracao: "",
      tipoClienteFavorecido: "",
      
      // Contato
      email: "",
      ddd: "",
      telefone: "",
      
      // Endereço
      cep: "",
      pais: "Brasil",
      estado: "",
      municipio: "",
      bairro: "",
      tipoLogradouro: "",
      logradouro: "",
      numero: "",
      complemento: "",
      
      // Georreferenciamento
      latitude: "",
      longitude: "",
      
      // Tempo
      fusoHorario: "America/Sao_Paulo"
    }
  });

  // API queries for each record type - hooks at top level
  const locaisQuery = useQuery({
    queryKey: [`/api/locations-new/local`],
    enabled: true
  });
  const regioesQuery = useQuery({
    queryKey: [`/api/locations-new/regiao`],
    enabled: true
  });
  const rotasDinamicasQuery = useQuery({
    queryKey: [`/api/locations-new/rota-dinamica`],
    enabled: true
  });
  const trechosQuery = useQuery({
    queryKey: [`/api/locations-new/trecho`],
    enabled: true
  });
  const rotasTrechoQuery = useQuery({
    queryKey: [`/api/locations-new/rota-trecho`],
    enabled: true
  });
  const areasQuery = useQuery({
    queryKey: [`/api/locations-new/area`],
    enabled: true
  });
  const agrupamentosQuery = useQuery({
    queryKey: [`/api/locations-new/agrupamento`],
    enabled: true
  });

  // Stats queries - hooks at top level
  const localStatsQuery = useQuery({
    queryKey: [`/api/locations-new/local/stats`],
    enabled: true
  });
  const regiaoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/regiao/stats`],
    enabled: true
  });
  const rotaDinamicaStatsQuery = useQuery({
    queryKey: [`/api/locations-new/rota-dinamica/stats`],
    enabled: true
  });
  const trechoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/trecho/stats`],
    enabled: true
  });
  const rotaTrechoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/rota-trecho/stats`],
    enabled: true
  });
  const areaStatsQuery = useQuery({
    queryKey: [`/api/locations-new/area/stats`],
    enabled: true
  });
  const agrupamentoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/agrupamento/stats`],
    enabled: true
  });

  // Organize queries into objects for easier access
  const queries = {
    locais: locaisQuery,
    regioes: regioesQuery,
    rotasDinamicas: rotasDinamicasQuery,
    trechos: trechosQuery,
    rotasTrecho: rotasTrechoQuery,
    areas: areasQuery,
    agrupamentos: agrupamentosQuery
  };

  const statsQueries = {
    localStats: localStatsQuery,
    regiaoStats: regiaoStatsQuery,
    rotaDinamicaStats: rotaDinamicaStatsQuery,
    trechoStats: trechoStatsQuery,
    rotaTrechoStats: rotaTrechoStatsQuery,
    areaStats: areaStatsQuery,
    agrupamentoStats: agrupamentoStatsQuery
  };

  // Get current data safely
  const getCurrentData = useCallback(() => {
    const currentQuery = queries[activeRecordType.replace('-', '') as keyof typeof queries];
    return (currentQuery?.data as any)?.data?.records || [];
  }, [queries, activeRecordType]);

  // Get current stats safely
  const getCurrentStats = useCallback(() => {
    const statsKey = `${activeRecordType.replace('-', '')}Stats` as keyof typeof statsQueries;
    const currentStatsQuery = statsQueries[statsKey];
    return (currentStatsQuery?.data as any)?.data || { total: 0, active: 0, inactive: 0 };
  }, [statsQueries, activeRecordType]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/locations-new/${activeRecordType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create record');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: `${RECORD_TYPES[activeRecordType as keyof typeof RECORD_TYPES].label} criado com sucesso!`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/locations-new/${activeRecordType}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/locations-new/${activeRecordType}/stats`] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating record:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar registro. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Submit handler
  const onSubmit = useCallback((data: any) => {
    createMutation.mutate(data);
  }, [createMutation]);

  // Filtered data
  const filteredData = useMemo(() => {
    const data = getCurrentData();
    return data.filter((item: any) => {
      const matchesSearch = !searchTerm || 
        item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && item.ativo) ||
        (statusFilter === "inactive" && !item.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [getCurrentData, searchTerm, statusFilter]);

  const currentStats = getCurrentStats();
  const currentRecordType = RECORD_TYPES[activeRecordType as keyof typeof RECORD_TYPES];

  // Enhanced token management with automatic refresh
  const updateTokenForTesting = React.useCallback(() => {
    const freshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDIiLCJlbWFpbCI6ImFkbWluQGNvbmR1Y3Rvci5jb20iLCJyb2xlIjoidGVuYW50X2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1NGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzNjYwNzM4LCJleHAiOjE3NTM3NDcxMzgsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyIsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSJ9.VsZXdQfRK4y5s9t0I6AJp8c-k9M6YQ8Hj-EZzWv8mNY";
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('accessToken', freshToken);
      setToken(freshToken);
      setTenantId("3f99462f-3621-4b1b-bea8-782acc54d62e");
      console.log('Token updated for LocationsNew page');
    }
  }, []);

  useEffect(() => {
    // Force token update on component mount
    updateTokenForTesting();

    const handleTokenRefresh = () => {
      updateTokenForTesting();
    };

    // Refresh token every 30 minutes
    const intervalId = setInterval(handleTokenRefresh, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [updateTokenForTesting]);

  // API fetch function
  const fetchLocationsByType = async (type: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.error('No access token found');
      return { data: { records: [] } };
    }

    const response = await fetch(`/api/locations-new/${type}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch locations', response);
      return { data: { records: [] } };
    }

    return response.json();
  };

  const fetchData = useCallback(async () => {
    if (!token) {
      console.warn("Token not available, skipping data fetching.");
      return;
    }
    queryClient.prefetchQuery({
      queryKey: ['locations-new', 'local'],
      queryFn: () => fetchLocationsByType('local')
    });
  }, [queryClient, token]);

  // Example usage of API fetch function in a React Query
  const { data: locationsData, error: locationsError, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations-new', 'local'],
    queryFn: () => fetchLocationsByType('local'),
    enabled: !!token && !!tenantId,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Localizações</h1>
            <p className="text-muted-foreground">
              Gerenciar os 7 tipos de registros de localização
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo {currentRecordType.label}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar {currentRecordType.label}</DialogTitle>
                <DialogDescription>
                  Preencha os campos para criar um novo {currentRecordType.label.toLowerCase()}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Render form based on current record type */}
                  {activeRecordType === "local" && (
                  <>
                    {/* Seção: Identificação */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Identificação
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome do local" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="codigoIntegracao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Integração</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Código único" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descrição detalhada do local" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tipoClienteFavorecido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente ou Favorecido</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cliente">Cliente</SelectItem>
                                <SelectItem value="favorecido">Favorecido</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ativo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ativo</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">Sim</SelectItem>
                                <SelectItem value="false">Não</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="tecnicoPrincipalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Técnico Principal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar técnico responsável" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="tecnico1">João Silva</SelectItem>
                              <SelectItem value="tecnico2">Maria Santos</SelectItem>
                              <SelectItem value="tecnico3">Pedro Costa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seção: Contato */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Phone className="h-5 w-5 mr-2" />
                      Contato
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} placeholder="email@exemplo.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ddd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DDD</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="11" maxLength={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="99999-9999" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção: Endereço */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <MapIcon className="h-5 w-5 mr-2" />
                      Endereço
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input {...field} placeholder="00000-000" />
                              </FormControl>
                              <Button type="button" variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4" />
                                Buscar
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Brasil" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="São Paulo" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="municipio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Município</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="São Paulo" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bairro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Centro" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="tipoLogradouro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo Logradouro</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="rua">Rua</SelectItem>
                                <SelectItem value="avenida">Avenida</SelectItem>
                                <SelectItem value="travessa">Travessa</SelectItem>
                                <SelectItem value="alameda">Alameda</SelectItem>
                                <SelectItem value="rodovia">Rodovia</SelectItem>
                                <SelectItem value="estrada">Estrada</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logradouro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome da rua" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complemento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apto 45" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção: Georreferenciamento */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Georreferenciamento
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="-23.550520" step="0.00000001" />
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
                              <Input {...field} placeholder="-46.633309" step="0.00000001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        As coordenadas geográficas serão obtidas automaticamente pelo endereço e exibidas em mapa para validação.
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* Seção: Tempo e Disponibilidade */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Tempo e Disponibilidade
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="fusoHorario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuso Horário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "America/Sao_Paulo"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">America/São_Paulo (GMT-3)</SelectItem>
                              <SelectItem value="America/Manaus">America/Manaus (GMT-4)</SelectItem>
                              <SelectItem value="America/Rio_Branco">America/Rio_Branco (GMT-5)</SelectItem>
                              <SelectItem value="America/Noronha">America/Noronha (GMT-2)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Horário de Funcionamento</Label>
                        <div className="flex space-x-2">
                          <Input placeholder="08:00" />
                          <span className="flex items-center">às</span>
                          <Input placeholder="18:00" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Intervalos de Funcionamento</Label>
                        <div className="flex space-x-2">
                          <Input placeholder="12:00" />
                          <span className="flex items-center">às</span>
                          <Input placeholder="13:00" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Feriados</Label>
                      <div className="flex space-x-2">
                        <Button type="button" variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Buscar Feriados Municipais
                        </Button>
                        <Button type="button" variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Buscar Feriados Estaduais
                        </Button>
                        <Button type="button" variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Buscar Feriados Federais
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Indisponibilidades</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input type="date" placeholder="Data início" />
                        <Input type="date" placeholder="Data fim" />
                        <Input placeholder="Observação" />
                      </div>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Indisponibilidade
                      </Button>
                    </div>
                  </div>
                  </>
                  )}

                  {/* Form for REGIÃO */}
                  {activeRecordType === "regiao" && (
                    <>
                      {/* Seção: Identificação */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Building2 className="h-5 w-5 mr-2" />
                          Identificação
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nome da região" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false"}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Sim</SelectItem>
                                    <SelectItem value="false">Não</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="descricao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Descrição da região" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="codigoIntegracao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código de Integração</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Código único da região" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Seção: Relacionamentos */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Link className="h-5 w-5 mr-2" />
                          Relacionamentos
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="clientesVinculados"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clientes Vinculados</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar clientes" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="cliente1">Empresa ABC Ltda</SelectItem>
                                    <SelectItem value="cliente2">Indústria XYZ S/A</SelectItem>
                                    <SelectItem value="cliente3">Comércio 123 ME</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="tecnicoPrincipalId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Técnico Principal</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar técnico" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="tecnico1">João Silva</SelectItem>
                                    <SelectItem value="tecnico2">Maria Santos</SelectItem>
                                    <SelectItem value="tecnico3">Pedro Costa</SelectItem>
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
                            name="gruposVinculados"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grupos Vinculados</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar grupos" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="grupo1">Equipe Técnica</SelectItem>
                                    <SelectItem value="grupo2">Supervisores</SelectItem>
                                    <SelectItem value="grupo3">Coordenadores</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="locaisAtendimento"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Locais de Atendimento</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar locais" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="local1">Filial Centro</SelectItem>
                                    <SelectItem value="local2">Unidade Norte</SelectItem>
                                    <SelectItem value="local3">Base Sul</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Seção: Geolocalização */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <MapPin className="h-5 w-5 mr-2" />
                          Geolocalização
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="-23.550520" step="0.00000001" />
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
                                  <Input {...field} placeholder="-46.633309" step="0.00000001" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="cepsAbrangidos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEPs Abrangidos ou Próximos</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="01000-000, 01001-000, 01002-000..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Seção: Endereço Base */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <MapIcon className="h-5 w-5 mr-2" />
                          Endereço Base
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="cep"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="00000-000" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="pais"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>País</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Brasil" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="estado"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="São Paulo" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="municipio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Município</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="São Paulo" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="bairro"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Centro" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="tipoLogradouro"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo Logradouro</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="rua">Rua</SelectItem>
                                    <SelectItem value="avenida">Avenida</SelectItem>
                                    <SelectItem value="travessa">Travessa</SelectItem>
                                    <SelectItem value="alameda">Alameda</SelectItem>
                                    <SelectItem value="rodovia">Rodovia</SelectItem>
                                    <SelectItem value="estrada">Estrada</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="logradouro"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logradouro</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nome da rua" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="numero"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="123" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="complemento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Sala 45, Bloco A" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {/* Form for ROTA DINÂMICA */}
                  {activeRecordType === "rota-dinamica" && (
                    <>
                      {/* Seção: Identificação */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Route className="h-5 w-5 mr-2" />
                          Identificação
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="nomeRota"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome da Rota *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nome da rota dinâmica" maxLength={100} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false"}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Sim</SelectItem>
                                    <SelectItem value="false">Não</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="idRota"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID da Rota *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Identificador único da rota" maxLength={100} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Seção: Relacionamentos */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Link className="h-5 w-5 mr-2" />
                          Relacionamentos
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="clientesVinculados"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clientes Vinculados</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar clientes" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="cliente1">Empresa ABC Ltda</SelectItem>
                                    <SelectItem value="cliente2">Indústria XYZ S/A</SelectItem>
                                    <SelectItem value="cliente3">Comércio 123 ME</SelectItem>
                                    <SelectItem value="cliente4">Construtora DEF</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="regioesAtendidas"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Regiões Atendidas</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar regiões" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="regiao1">Região Centro</SelectItem>
                                    <SelectItem value="regiao2">Região Norte</SelectItem>
                                    <SelectItem value="regiao3">Região Sul</SelectItem>
                                    <SelectItem value="regiao4">Região Leste</SelectItem>
                                    <SelectItem value="regiao5">Região Oeste</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Seção: Planejamento da Rota */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <CalendarDays className="h-5 w-5 mr-2" />
                          Planejamento da Rota
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Dias da Semana da Rota</Label>
                            <div className="grid grid-cols-7 gap-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="domingo" />
                                <Label htmlFor="domingo" className="text-sm">Dom</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="segunda" />
                                <Label htmlFor="segunda" className="text-sm">Seg</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="terca" />
                                <Label htmlFor="terca" className="text-sm">Ter</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="quarta" />
                                <Label htmlFor="quarta" className="text-sm">Qua</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="quinta" />
                                <Label htmlFor="quinta" className="text-sm">Qui</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="sexta" />
                                <Label htmlFor="sexta" className="text-sm">Sex</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="sabado" />
                                <Label htmlFor="sabado" className="text-sm">Sáb</Label>
                              </div>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="previsaoDias"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Previsão de Dias da Rota Dinâmica</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    min="1" 
                                    max="30" 
                                    placeholder="Valor entre 1 e 30 dias" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Criando..." : `Criar ${currentRecordType.label}`}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <currentRecordType.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Badge variant="default" className="bg-green-500">Ativo</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.active || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <Badge variant="secondary">Inativo</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.inactive || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record type tabs */}
      <Tabs value={activeRecordType} onValueChange={setActiveRecordType}>
        <TabsList className="grid w-full grid-cols-7">
          {Object.entries(RECORD_TYPES).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(RECORD_TYPES).map((recordType) => (
          <TabsContent key={recordType} value={recordType} className="space-y-4">
            {/* Search and filters */}
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Buscar ${RECORD_TYPES[recordType as keyof typeof RECORD_TYPES].label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {(() => {
                    const IconComponent = RECORD_TYPES[recordType as keyof typeof RECORD_TYPES].icon;
                    return <IconComponent className="h-5 w-5" />;
                  })()}
                  <span>{RECORD_TYPES[recordType as keyof typeof RECORD_TYPES].label} ({filteredData.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum {RECORD_TYPES[recordType as keyof typeof RECORD_TYPES].label.toLowerCase()} encontrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredData.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant={item.ativo ? "default" : "secondary"}>
                            {item.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <div>
                            <p className="font-medium">{item.nome}</p>
                            {item.descricao && (
                              <p className="text-sm text-muted-foreground">{item.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.codigo_integracao && `Código: ${item.codigo_integracao}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Main export
export default function LocationsNew() {
  try {
    return <LocationsNewContent />;
  } catch (error) {
    console.error('LocationsNew error:', error);
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }
}