// LOCATIONS MODULE - CLEANED VERSION FOR 7 RECORD TYPES
import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Navigation, Settings, Route, Building, Grid3X3, Users, Clock, Upload, Map, AlertTriangle } from "lucide-react";
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

  // Form setup
  const form = useForm({
    resolver: zodResolver(localSchema),
    defaultValues: {
      ativo: true,
      nome: "",
      descricao: "",
      email: "",
      cep: "",
      telefone: "",
    }
  });

  // API queries for each record type
  const queries = useMemo(() => {
    const createQuery = (recordType: string) => ({
      queryKey: [`/api/locations-new/${recordType}`],
      enabled: true
    });

    return {
      locais: useQuery(createQuery("local")),
      regioes: useQuery(createQuery("regiao")),
      rotasDinamicas: useQuery(createQuery("rota-dinamica")),
      trechos: useQuery(createQuery("trecho")),
      rotasTrecho: useQuery(createQuery("rota-trecho")),
      areas: useQuery(createQuery("area")),
      agrupamentos: useQuery(createQuery("agrupamento"))
    };
  }, []);

  // Stats queries
  const statsQueries = useMemo(() => {
    const createStatsQuery = (recordType: string) => ({
      queryKey: [`/api/locations-new/${recordType}/stats`],
      enabled: true
    });

    return {
      localStats: useQuery(createStatsQuery("local")),
      regiaoStats: useQuery(createStatsQuery("regiao")),
      rotaDinamicaStats: useQuery(createStatsQuery("rota-dinamica")),
      trechoStats: useQuery(createStatsQuery("trecho")),
      rotaTrechoStats: useQuery(createStatsQuery("rota-trecho")),
      areaStats: useQuery(createStatsQuery("area")),
      agrupamentoStats: useQuery(createStatsQuery("agrupamento"))
    };
  }, []);

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar {currentRecordType.label}</DialogTitle>
                <DialogDescription>
                  Preencha os campos para criar um novo {currentRecordType.label.toLowerCase()}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Criando..." : "Criar"}
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