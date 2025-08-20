// LOCATIONS MODULE - CLEANED VERSION FOR 7 RECORD TYPES  
import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Navigation, Settings, Route, Building, Grid3X3, Users, Map, Clock, Edit, Trash2, CheckCircle, ArrowRight, Network, Layers, Palette, Folder, Calendar, Phone, Home } from "lucide-react";
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
import { 
// import useLocalization from '@/hooks/useLocalization';
  localSchema, 
  regiaoSchema, 
  rotaDinamicaSchema, 
  trechoSchema, 
  rotaTrechoSchema, 
  areaSchema, 
  agrupamentoSchema 
} from "../../../shared/schema-locations-new";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Record type definitions
const RECORD_TYPES = {
  // Localization temporarily disabled
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
  // Dynamic schema selection per 1qa.md Clean Architecture
  const getSchemaForType = useCallback((recordType: string) => {
    switch (recordType) {
      case 'local': return localSchema;
      case 'regiao': return regiaoSchema;
      case 'rota-dinamica': return rotaDinamicaSchema;
      case 'trecho': return trechoSchema;
      case 'rota-trecho': return rotaTrechoSchema;
      case 'area': return areaSchema;
      case 'agrupamento': return agrupamentoSchema;
      default: return localSchema;
    }
  }, []);
  // Dynamic default values per record type following 1qa.md
  const getDefaultValues = useCallback((recordType: string) => {
    const baseDefaults = {
      ativo: true,
      nome: "",
      descricao: "",
      codigoIntegracao: ""
    };
    switch (recordType) {
      case 'rota-dinamica':
        return {
          ...baseDefaults,
          nomeRota: "",
          idRota: "",
          previsaoDias: 1,
          clientesFavorecidos: [],
          tecnicosPrincipais: [],
          diasSemana: []
        };
      case 'local':
        return {
          ...baseDefaults,
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
        };
      default:
        return baseDefaults;
    }
  }, []);
  // Form setup with dynamic schema per 1qa.md
  const form = useForm<any>({
    resolver: zodResolver(getSchemaForType(activeRecordType)),
    defaultValues: getDefaultValues(activeRecordType)
  });
  // Reset form when record type changes following 1qa.md pattern
  React.useEffect(() => {
    form.reset(getDefaultValues(activeRecordType));
  }, [activeRecordType, form, getDefaultValues]);
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
  // Get current data safely - ✅ 1qa.md compliant: fix data path
  const getCurrentData = useCallback(() => {
    const currentQuery = queries[activeRecordType as keyof typeof queries];
    // Backend returns data directly, not nested in records
    return (currentQuery?.data as any)?.data || [];
  }, [queries, activeRecordType]);
  // Get current stats safely
  const getCurrentStats = useCallback(() => {
    const statsKey = "Stats` as keyof typeof statsQueries;
    const currentStatsQuery = statsQueries[statsKey];
    return (currentStatsQuery?.data as any)?.data || { total: 0, active: 0, inactive: 0 };
  }, [statsQueries, activeRecordType]);
  // Create mutation using apiRequest
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', "
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: " criado com sucesso!`
      });
      queryClient.invalidateQueries({ queryKey: ["
      queryClient.invalidateQueries({ queryKey: ["/stats`] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('[TRANSLATION_NEEDED]', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Falha ao criar registro. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  // Submit handler with debug logging per 1qa.md
  const onSubmit = useCallback((data: any) => {
    console.log('🔍 [FORM-SUBMIT] Form data:', data);
    console.log('🔍 [FORM-SUBMIT] Record type:', activeRecordType);
    console.log('🔍 [FORM-SUBMIT] Form errors:', form.formState.errors);
    console.log('🔍 [FORM-SUBMIT] Form isValid:', form.formState.isValid);
    
    // Force validation and submit regardless for testing
    console.log('🔍 [FORM-SUBMIT] Proceeding with mutation...');
    createMutation.mutate(data);
  }, [createMutation, activeRecordType, form]);
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
    <div className=""
      {/* Header with stats */}
      <div className=""
        <div className=""
          <div>
            <h1 className="text-lg">"Gerenciamento de Localizações</h1>
            <p className="text-lg">"Sistema completo para gestão de 7 tipos de registros geográficos</p>
          </div>
          <div className=""
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline>
                  <Clock className="h-4 w-4 mr-2" />
                  Gerenciar Horários
                </Button>
              </DialogTrigger>
              <DialogContent className=""
                <DialogHeader>
                  <DialogTitle className=""
                    <Clock className="h-5 w-5 mr-2" />
                    Gerenciamento de Horários de Funcionamento
                  </DialogTitle>
                  <DialogDescription>
                    Configure padrões de horários que podem ser associados a múltiplos locais, regiões e rotas.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="padroes" className=""
                  <TabsList className=""
                    <TabsTrigger value="padroes">Padrões de Horários</TabsTrigger>
                    <TabsTrigger value="associacoes">Associações</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="padroes" className=""
                    <div className=""
                      <div className=""
                        <h3 className="text-lg">"Padrões Cadastrados</h3>
                        <Button size="sm>
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Padrão
                        </Button>
                      </div>
                      
                      <div className=""
                        {[
                          { id: 1, nome: "Comercial Padrão", horario: "08:00-18:00", dias: "Seg-Sex", entidades: 15 },
                          { id: 2, nome: "Shopping", horario: "10:00-22:00", dias: "Seg-Dom", entidades: 8 },
                          { id: 3, nome: "Técnico de Campo", horario: "07:00-17:00", dias: "Seg-Sáb", entidades: 12 }
                        ].map((padrao) => (
                          <Card key={padrao.id}>
                            <CardContent className=""
                              <div className=""
                                <div>
                                  <h4 className="text-lg">"{padrao.nome}</h4>
                                  <p className=""
                                    {padrao.horario} • {padrao.dias} • {padrao.entidades} entidades associadas
                                  </p>
                                </div>
                                <div className=""
                                  <Button variant="outline" size="sm>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="associacoes" className=""
                    <div className=""
                      <h3 className="text-lg">"Associar Horários às Entidades</h3>
                      
                      <div className=""
                        <div className=""
                          <h4 className="text-lg">"Selecionar Padrão de Horário</h4>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="comercial">Comercial Padrão</SelectItem>
                              <SelectItem value="shopping">Shopping</SelectItem>
                              <SelectItem value="tecnico">Técnico de Campo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className=""
                          <h4 className="text-lg">"Aplicar a Entidades</h4>
                          <div className=""
                            {[
                              { tipo: "Local", nome: "Matriz São Paulo", ativo: true },
                              { tipo: "Local", nome: "Filial Campinas", ativo: false },
                              { tipo: "Região", nome: "Grande SP", ativo: true },
                              { tipo: "Rota", nome: "Rota ABC", ativo: false }
                            ].map((entidade, index) => (
                              <div key={index} className=""
                                <Checkbox defaultChecked={entidade.ativo} />
                                <Badge variant="outline" className=""
                                  {entidade.tipo}
                                </Badge>
                                <span className="text-lg">"{entidade.nome}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Button className=""
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aplicar Horários às Entidades Selecionadas
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo {currentRecordType.label}
                </Button>
              </DialogTrigger>
              <DialogContent className=""
                <DialogHeader>
                  <DialogTitle>Criar Novo {currentRecordType.label}</DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para criar um novo registro de {currentRecordType.label.toLowerCase()}.
                  </DialogDescription>
                </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className=""
                  {/* RENDERIZAÇÃO CONDICIONAL BASEADA NO TIPO DE REGISTRO */}
                  {activeRecordType === 'local' && (
                    <>
                      {/* SEÇÃO 1: IDENTIFICAÇÃO */}
                      <div className=""
                        <div className=""
                          <MapPin className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg">"Identificação</h3>
                        </div>
                    
                    <div className=""
                      <FormField
                        control={form.control}
                        name="ativo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ativo</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                      
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem className=""
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome do local" {...field} />
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
                            <Textarea placeholder="Descrição detalhada do local" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className=""
                      <FormField
                        control={form.control}
                        name="codigoIntegracao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Integração</FormLabel>
                            <FormControl>
                              <Input placeholder="Código único do sistema" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tipoClienteFavorecido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente ou Favorecido</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="tecnico1">João Silva</SelectItem>
                              <SelectItem value="tecnico2">Maria Santos</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* SEÇÃO 2: CONTATO */}
                  <div className=""
                    <div className=""
                      <Phone className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg">"Contato</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contato@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className=""
                      <FormField
                        control={form.control}
                        name="ddd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DDD</FormLabel>
                            <FormControl>
                              <Input placeholder="11" maxLength={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem className=""
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {/* SEÇÃO 3: ENDEREÇO COM CEP LOOKUP */}
                  <div className=""
                    <div className=""
                      <MapPin className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg">"Endereço</h3>
                    </div>
                    
                    <div className=""
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <div className=""
                              <FormControl>
                                <Input placeholder="00000-000" {...field} />
                              </FormControl>
                              <Button type="button" variant="outline" size="sm>
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
                              <Input {...field} />
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
                              <Input placeholder="SP" {...field} />
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
                              <Input placeholder="São Paulo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className=""
                      <FormField
                        control={form.control}
                        name="bairro"
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
                      
                      <FormField
                        control={form.control}
                        name="tipoLogradouro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Logradouro</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Rua">Rua</SelectItem>
                                <SelectItem value="Avenida">Avenida</SelectItem>
                                <SelectItem value="Travessa">Travessa</SelectItem>
                                <SelectItem value="Alameda">Alameda</SelectItem>
                                <SelectItem value="Rodovia">Rodovia</SelectItem>
                                <SelectItem value="Estrada">Estrada</SelectItem>
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
                        name="logradouro"
                        render={({ field }) => (
                          <FormItem className=""
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da rua/avenida" {...field} />
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
                              <Input placeholder="123" {...field} />
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
                            <Input placeholder="Apto 101, Bloco A, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* SEÇÃO 4: GEOLOCALIZAÇÃO COM MAPA INTERATIVO */}
                  <div className=""
                    <div className=""
                      <Map className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg">"Georreferenciamento</h3>
                    </div>
                    
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        As coordenadas serão preenchidas automaticamente com base no endereço. 
                        Você pode clicar no mapa para ajustar a localização exata.
                      </AlertDescription>
                    </Alert>
                    
                    <div className=""
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input placeholder="-23.55052000" {...field} />
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
                              <Input placeholder="-46.63330800" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className=""
                      <Button type="button" variant="outline>
                        <Map className="h-4 w-4 mr-2" />
                        Abrir Mapa Interativo
                      </Button>
                    </div>
                  </div>
                  {/* SEÇÃO 5: TEMPO E DISPONIBILIDADE */}
                  <div className=""
                    <div className=""
                      <Clock className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg">"Tempo e Disponibilidade</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="fusoHorario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuso Horário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                    
                    <div className=""
                      <h4 className="text-lg">"Feriados</h4>
                      <div className=""
                        <Button type="button" variant="outline" size="sm>
                          Buscar Feriados Municipais
                        </Button>
                        <Button type="button" variant="outline" size="sm>
                          Buscar Feriados Estaduais
                        </Button>
                        <Button type="button" variant="outline" size="sm>
                          Buscar Feriados Federais
                        </Button>
                      </div>
                    </div>
                      </div>
                    </>
                  )}
                  {/* MODAL REGIÃO */}
                  {activeRecordType === 'regiao' && (
                    <>
                      {/* SEÇÃO 1: IDENTIFICAÇÃO */}
                      <div className=""
                        <div className=""
                          <MapPin className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg">"Identificação</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          
                          <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem className=""
                                <FormLabel>Nome *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Digite o nome da região" {...field} />
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
                                <Textarea placeholder="Descrição da região" rows={3} {...field} />
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
                                <Input placeholder="Código único da região" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* SEÇÃO 2: RELACIONAMENTOS */}
                      <div className=""
                        <div className=""
                          <Users className="h-5 w-5 text-green-500" />
                          <h3 className="text-lg">"Relacionamentos</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clientes Vinculados</FormLabel>
                                <FormControl>
                                  <Input placeholder='[TRANSLATION_NEEDED]' {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="tecnicoPrincipal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Técnico Principal</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="tecnico1">João Silva</SelectItem>
                                    <SelectItem value="tecnico2">Maria Santos</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      {/* SEÇÃO 3: GEOLOCALIZAÇÃO */}
                      <div className=""
                        <div className=""
                          <MapPin className="h-5 w-5 text-red-500" />
                          <h3 className="text-lg">"Geolocalização</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                  <Input placeholder="-23.55052000" {...field} />
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
                                  <Input placeholder="-46.63331000" {...field} />
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
                                <Textarea placeholder="01000-000, 01001-000, 01002-000..." rows={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* SEÇÃO 4: ENDEREÇO BASE */}
                      <div className=""
                        <div className=""
                          <Home className="h-5 w-5 text-orange-500" />
                          <h3 className="text-lg">"Endereço Base</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="cep"
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
                          
                          <FormField
                            control={form.control}
                            name="pais"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>País</FormLabel>
                                <FormControl>
                                  <Input placeholder="Brasil" defaultValue="Brasil" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="estado"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                  <Input placeholder="Estado" {...field} />
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
                                  <Input placeholder="Município" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="bairro"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl>
                                  <Input placeholder="Bairro" {...field} />
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
                                <FormLabel>Tipo de Logradouro</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Rua">Rua</SelectItem>
                                    <SelectItem value="Avenida">Avenida</SelectItem>
                                    <SelectItem value="Travessa">Travessa</SelectItem>
                                    <SelectItem value="Alameda">Alameda</SelectItem>
                                    <SelectItem value="Rodovia">Rodovia</SelectItem>
                                    <SelectItem value="Estrada">Estrada</SelectItem>
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
                            name="logradouro"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logradouro</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome da rua/avenida" {...field} />
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
                                  <Input placeholder="123" {...field} />
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
                                  <Input placeholder="Sala, apto, etc" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {/* MODAL ROTA DINÂMICA */}
                  {activeRecordType === 'rota-dinamica' && (
                    <>
                      {/* SEÇÃO 1: IDENTIFICAÇÃO */}
                      <div className=""
                        <div className=""
                          <Route className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg">"Identificação</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          
                          <FormField
                            control={form.control}
                            name="nomeRota"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome da Rota *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome da rota" maxLength={100} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="idRota"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID da Rota *</FormLabel>
                                <FormControl>
                                  <Input placeholder="ID único" maxLength={100} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      {/* SEÇÃO 2: PLANEJAMENTO DA ROTA */}
                      <div className=""
                        <div className=""
                          <Calendar className="h-5 w-5 text-purple-500" />
                          <h3 className="text-lg">"Planejamento da Rota</h3>
                        </div>
                        
                        <div className=""
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                            <div key={index} className=""
                              <Checkbox id={"
                              <label htmlFor={"
                            </div>
                          ))}
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="previsaoDias"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Previsão de Dias (1-30)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1} 
                                  max={30} 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                  {/* MODAL TRECHO */}
                  {activeRecordType === 'trecho' && (
                    <>
                      <div className=""
                        <div className=""
                          <ArrowRight className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg">"Identificação do Trecho</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          
                          <FormField
                            control={form.control}
                            name="codigoIntegracao"
                            render={({ field }) => (
                              <FormItem className=""
                                <FormLabel>Código de Integração</FormLabel>
                                <FormControl>
                                  <Input placeholder="Código do trecho" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="localAId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Local A (Origem)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="local1">Local 1</SelectItem>
                                    <SelectItem value="local2">Local 2</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="localBId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Local B (Destino)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="local3">Local 3</SelectItem>
                                    <SelectItem value="local4">Local 4</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {/* MODAL ROTA DE TRECHO */}
                  {activeRecordType === 'rota-trecho' && (
                    <>
                      <div className=""
                        <div className=""
                          <Network className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg">"Definição da Rota</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          
                          <FormField
                            control={form.control}
                            name="codigoIntegracao"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID da Rota</FormLabel>
                                <FormControl>
                                  <Input placeholder="Identificador da rota" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className=""
                          <h4 className="text-lg">"Definição do Trecho - Múltiplos Registros</h4>
                          <div className=""
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>DE</TableHead>
                                  <TableHead>TRECHO</TableHead>
                                  <TableHead>PARA</TableHead>
                                  <TableHead>AÇÃO</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>Local A</TableCell>
                                  <TableCell>Trecho Intermediário 1</TableCell>
                                  <TableCell>Local Intermédio</TableCell>
                                  <TableCell>
                                    <div className=""
                                      <Button variant="outline" size="sm>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="outline" size="sm>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Local Intermédio</TableCell>
                                  <TableCell>Trecho Final</TableCell>
                                  <TableCell>Local B</TableCell>
                                  <TableCell>
                                    <div className=""
                                      <Button variant="outline" size="sm>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="outline" size="sm>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                          <Button type="button" variant="outline>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Trecho
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {/* MODAL ÁREA */}
                  {activeRecordType === 'area' && (
                    <>
                      <div className=""
                        <div className=""
                          <Layers className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg">"Identificação</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          
                          <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem className=""
                                <FormLabel>Nome *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome da área" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="descricao"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Descrição detalhada da área" rows={3} {...field} />
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
                                  <Input placeholder="Código único do sistema" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      {/* SEÇÃO 2: CLASSIFICAÇÃO */}
                      <div className=""
                        <div className=""
                          <Grid3X3 className="h-5 w-5 text-teal-500" />
                          <h3 className="text-lg">"Classificação</h3>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="tipoArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Área</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="faixa-cep">Faixa CEP</SelectItem>
                                  <SelectItem value="shape">Shape</SelectItem>
                                  <SelectItem value="coordenadas">Coordenadas</SelectItem>
                                  <SelectItem value="raio">Raio</SelectItem>
                                  <SelectItem value="linha">Linha</SelectItem>
                                  <SelectItem value="importar">Importar Área</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="corMapa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cor no Mapa</FormLabel>
                              <div className=""
                                <FormControl>
                                  <Input type="color" defaultValue="#3b82f6" {...field} />
                                </FormControl>
                                <FormControl>
                                  <Input placeholder="#3b82f6" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className=""
                          <p className=""
                            A configuração específica dos parâmetros da área será baseada no tipo selecionado acima.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {/* MODAL AGRUPAMENTO */}
                  {activeRecordType === 'agrupamento' && (
                    <>
                      <div className=""
                        <div className=""
                          <Folder className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg">"Identificação</h3>
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="ativo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ativo</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value ? "true" : "false>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          
                          <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem className=""
                                <FormLabel>Nome *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome do agrupamento" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className=""
                          <FormField
                            control={form.control}
                            name="descricao"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Descrição detalhada do agrupamento" rows={3} {...field} />
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
                                  <Input placeholder="Código único do sistema" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      {/* SEÇÃO 2: SELEÇÃO DE ÁREAS */}
                      <div className=""
                        <div className=""
                          <Map className="h-5 w-5 text-indigo-500" />
                          <h3 className="text-lg">"Seleção de Áreas</h3>
                        </div>
                        
                        <div className=""
                          <h4 className="text-lg">"Áreas Disponíveis</h4>
                          <div className=""
                            {['Área Centro', 'Área Norte', 'Área Sul', 'Área Leste'].map((area, index) => (
                              <div key={index} className=""
                                <Checkbox id={"
                                <label htmlFor={"
                                  <div className="text-lg">"</div>
                                  <span>{area}</span>
                                  <Badge variant="outline" className="text-lg">"Faixa CEP</Badge>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className=""
                          <h4 className="text-lg">"Adicionar Faixas de CEP</h4>
                          <div className=""
                            <FormField
                              control={form.control}
                              name="cepInicio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CEP Início</FormLabel>
                                  <FormControl>
                                    <Input placeholder="01000-000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="cepFim"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CEP Fim</FormLabel>
                                  <FormControl>
                                    <Input placeholder="01999-999" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button type="button" variant="outline>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Faixa CEP
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  <div className=""
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Criando..." : '[TRANSLATION_NEEDED]'}
                    </Button>
                  </div>
                </form>
              </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Stats cards */}
        <div className=""
          <Card>
            <CardHeader className=""
              <CardTitle className="text-lg">"Total</CardTitle>
              <currentRecordType.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"{currentStats.total || 0}</div>
              <p className="text-lg">"registros cadastrados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className=""
              <CardTitle className="text-lg">"Ativos</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"{currentStats.active || 0}</div>
              <p className="text-lg">"em funcionamento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className=""
              <CardTitle className="text-lg">"Inativos</CardTitle>
              <div className="h-4 w-4 rounded-full bg-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"{currentStats.inactive || 0}</div>
              <p className="text-lg">"desabilitados</p>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Tabs for record types */}
      <Tabs value={activeRecordType} onValueChange={setActiveRecordType}>
        <TabsList className=""
          {Object.entries(RECORD_TYPES).map(([key, type]) => (
            <TabsTrigger key={key} value={key} className=""
              <type.icon className="h-4 w-4" />
              <span>{type.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.keys(RECORD_TYPES).map((recordType) => (
          <TabsContent key={recordType} value={recordType} className=""
            {/* Search and filters */}
            <div className=""
              <div className=""
                <div className=""
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder='[TRANSLATION_NEEDED]'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className=""
                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                          <TableCell className="text-lg">"{item.nome}</TableCell>
                          <TableCell>{item.codigoIntegracao || item.codigo_integracao || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={item.ativo ? "default" : "secondary>
                              {item.ativo ? "Ativo" : "Inativo"
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm>
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className=""
                    <currentRecordType.icon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className=""
                      Nenhum registro encontrado
                    </h3>
                    <p className=""
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