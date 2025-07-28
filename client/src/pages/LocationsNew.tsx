// LOCATIONS MODULE - CLEANED VERSION FOR 7 RECORD TYPES  
import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Navigation, Settings, Route, Building, Grid3X3, Users, Map } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { localSchema } from "../../../shared/schema-locations-new";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
      codigoIntegracao: "",
      clienteFavorecido: "",
      tecnicoPrincipal: "",
      email: "",
      ddd: "",
      telefone: "",
      cep: "",
      pais: "Brasil",
      estado: "",
      municipio: "",
      bairro: "",
      tipoLogradouro: "",
      logradouro: "",
      numero: "",
      complemento: "",
      latitude: "",
      longitude: "",
      fusoHorario: "America/Sao_Paulo"
    }
  });

  // Data queries for each record type - using proper authentication from queryClient
  const localQuery = useQuery({
    queryKey: [`/api/locations-new/local`]
  });

  const regiaoQuery = useQuery({
    queryKey: [`/api/locations-new/regiao`]
  });

  const rotaDinamicaQuery = useQuery({
    queryKey: [`/api/locations-new/rota-dinamica`]
  });

  const trechoQuery = useQuery({
    queryKey: [`/api/locations-new/trecho`]
  });

  const rotaTrechoQuery = useQuery({
    queryKey: [`/api/locations-new/rota-trecho`]
  });

  const areaQuery = useQuery({
    queryKey: [`/api/locations-new/area`]
  });

  const agrupamentoQuery = useQuery({
    queryKey: [`/api/locations-new/agrupamento`]
  });

  // Stats queries
  const localStatsQuery = useQuery({
    queryKey: [`/api/locations-new/local/stats`]
  });

  const regiaoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/regiao/stats`]
  });

  const rotaDinamicaStatsQuery = useQuery({
    queryKey: [`/api/locations-new/rota-dinamica/stats`]
  });

  const trechoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/trecho/stats`]
  });

  const rotaTrechoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/rota-trecho/stats`]
  });

  const areaStatsQuery = useQuery({
    queryKey: [`/api/locations-new/area/stats`]
  });

  const agrupamentoStatsQuery = useQuery({
    queryKey: [`/api/locations-new/agrupamento/stats`]
  });

  // Organize queries into objects for easier access
  const queries = {
    local: localQuery,
    regiao: regiaoQuery,
    "rota-dinamica": rotaDinamicaQuery,
    trecho: trechoQuery,
    "rota-trecho": rotaTrechoQuery,
    area: areaQuery,
    agrupamento: agrupamentoQuery
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
    const currentQuery = queries[activeRecordType as keyof typeof queries];
    return (currentQuery?.data as any)?.data?.records || [];
  }, [queries, activeRecordType]);

  // Get current stats safely
  const getCurrentStats = useCallback(() => {
    const statsKey = `${activeRecordType.replace('-', '')}Stats` as keyof typeof statsQueries;
    const currentStatsQuery = statsQueries[statsKey];
    return (currentStatsQuery?.data as any)?.data || { total: 0, active: 0, inactive: 0 };
  }, [statsQueries, activeRecordType]);

  // Create mutation using apiRequest
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/locations-new/${activeRecordType}`, data);
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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Localizações</h1>
            <p className="text-muted-foreground">Sistema completo para gestão de 7 tipos de registros geográficos</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo {currentRecordType.label}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo {currentRecordType.label}</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para criar um novo registro de {currentRecordType.label.toLowerCase()}.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic form fields - simplified for now */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome" {...field} />
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
                            <Input placeholder="Código único" {...field} />
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
                          <Textarea placeholder="Descrição detalhada" {...field} />
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
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Criando..." : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <currentRecordType.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.total || 0}</div>
              <p className="text-xs text-muted-foreground">registros cadastrados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.active || 0}</div>
              <p className="text-xs text-muted-foreground">em funcionamento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <div className="h-4 w-4 rounded-full bg-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.inactive || 0}</div>
              <p className="text-xs text-muted-foreground">desabilitados</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for record types */}
      <Tabs value={activeRecordType} onValueChange={setActiveRecordType}>
        <TabsList className="grid w-full grid-cols-7">
          {Object.entries(RECORD_TYPES).map(([key, type]) => (
            <TabsTrigger key={key} value={key} className="flex items-center space-x-1">
              <type.icon className="h-4 w-4" />
              <span>{type.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(RECORD_TYPES).map((recordType) => (
          <TabsContent key={recordType} value={recordType} className="space-y-4">
            {/* Search and filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar registros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
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
                <CardTitle>{RECORD_TYPES[recordType as keyof typeof RECORD_TYPES].label}</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>{item.codigoIntegracao || item.codigo_integracao || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={item.ativo ? "default" : "secondary"}>
                              {item.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <currentRecordType.icon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Nenhum registro encontrado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Comece criando um novo {RECORD_TYPES[recordType as keyof typeof RECORD_TYPES].label.toLowerCase()}.
                    </p>
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

export default function LocationsNew() {
  return <LocationsNewContent />;
}