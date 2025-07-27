// LOCATIONS MODULE - COMPLETE RESTRUCTURE FOR 7 RECORD TYPES
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Navigation, Settings, Route, Building, Grid3X3, Users, Clock, Upload, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Import form components
import LocalForm from "@/components/locations/LocalForm";
import RegiaoForm from "@/components/locations/RegiaoForm";
import RotaDinamicaForm from "@/components/locations/RotaDinamicaForm";
import TrechoForm from "@/components/locations/TrechoForm";
import RotaTrechoForm from "@/components/locations/RotaTrechoForm";
import AreaForm from "@/components/locations/AreaForm";
import AgrupamentoForm from "@/components/locations/AgrupamentoForm";

// Record type configurations
const RECORD_TYPES = {
  local: {
    label: "Local",
    icon: MapPin,
    color: "bg-blue-500",
    sections: ["Identificação", "Contato", "Endereço", "Georreferenciamento", "Tempo e Disponibilidade"]
  },
  regiao: {
    label: "Região", 
    icon: Grid3X3,
    color: "bg-green-500",
    sections: ["Identificação", "Relacionamentos", "Geolocalização", "Endereço Base"]
  },
  rota_dinamica: {
    label: "Rota Dinâmica",
    icon: Route,
    color: "bg-purple-500", 
    sections: ["Identificação", "Relacionamentos", "Planejamento da Rota"]
  },
  trecho: {
    label: "Trecho",
    icon: Navigation,
    color: "bg-orange-500",
    sections: ["Identificação"]
  },
  rota_trecho: {
    label: "Rota de Trecho",
    icon: Route,
    color: "bg-red-500",
    sections: ["Identificação", "Definição do Trecho"]
  },
  area: {
    label: "Área",
    icon: Building,
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

export default function LocationsNew() {
  const { toast } = useToast();
  const [activeRecordType, setActiveRecordType] = useState<string>("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const refetch = () => {
    // TODO: Implement data refetching logic
    console.log('Data refetch triggered');
  };

  // Fetch data based on record type
  const { data: recordsData, isLoading } = useQuery({
    queryKey: [`/api/locations-new/${activeRecordType}`, { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const url = `/api/locations-new/${activeRecordType}${params.toString() ? `?${params.toString()}` : ''}`;
      return apiRequest("GET", url);
    }
  });

  // Statistics for current record type
  const { data: statsData } = useQuery({
    queryKey: [`/api/locations-new/${activeRecordType}/stats`],
    queryFn: async () => {
      return apiRequest("GET", `/api/locations-new/${activeRecordType}/stats`);
    }
  });

  // Get current record configuration
  const currentType = RECORD_TYPES[activeRecordType as keyof typeof RECORD_TYPES];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/locations-new/${activeRecordType}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/locations-new/${activeRecordType}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/locations-new/${activeRecordType}/stats`] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: `${currentType.label} criado com sucesso!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar ${currentType.label.toLowerCase()}: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleCreateSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  // Get form component based on active record type
  const getFormComponent = () => {
    const commonProps = {
      onSubmit: handleCreateSubmit,
      isSubmitting: createMutation.isPending,
      onCancel: () => setIsCreateDialogOpen(false)
    };

    switch (activeRecordType) {
      case 'local':
        return (
          <LocalForm
                onSubmit={async (data) => {
                  console.log('Local form submitted:', data);
                  try {
                    const response = await fetch('/api/locations/local', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify(data)
                    });

                    if (!response.ok) {
                      throw new Error('Falha ao criar local');
                    }

                    const result = await response.json();
                    console.log('Local created successfully:', result);

                    // Show success message and refresh data
                    toast({
                      title: "Local criado com sucesso",
                      description: "O local foi adicionado ao sistema"
                    });

                    // Refresh the data
                    refetch();

                  } catch (error) {
                    console.error('Error creating local:', error);
                    toast({
                      title: "Erro ao criar local",
                      description: "Ocorreu um erro ao salvar o local. Tente novamente.",
                      variant: "destructive"
                    });
                  }
                }}
                isLoading={false}
              />
        );
      case 'regiao':
        return <RegiaoForm {...commonProps} />;
      case 'rota_dinamica':
        return <RotaDinamicaForm {...commonProps} />;
      case 'trecho':
        return <TrechoForm {...commonProps} />;
      case 'rota_trecho':
        return <RotaTrechoForm {...commonProps} />;
      case 'area':
        return <AreaForm {...commonProps} />;
      case 'agrupamento':
        return <AgrupamentoForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Localizações</h2>
          <p className="text-muted-foreground">
            Gerencie {currentType?.label.toLowerCase()}s e suas configurações específicas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar {currentType?.label}
          </Button>
        </div>
      </div>

      {/* Record Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(RECORD_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeRecordType === key;

          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              className={`flex flex-col items-center p-4 h-auto ${isActive ? config.color : ''}`}
              onClick={() => setActiveRecordType(key)}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">{config.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <currentType.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentType.label.toLowerCase()}s cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Badge variant="default" className="h-6 px-2 text-xs">OK</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsData?.data?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              em funcionamento normal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Badge variant="secondary" className="h-6 px-2 text-xs">OFF</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {statsData?.data?.inactive || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              temporariamente inativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
            <Badge variant="destructive" className="h-6 px-2 text-xs">MAINT</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statsData?.data?.maintenance || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              em manutenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${currentType.label.toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Horários
          </Button>

          {/* KML Import button only for specific types */}
          {['area', 'regiao'].includes(activeRecordType) && (
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Importar KML
            </Button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentType.icon className="h-5 w-5" />
            {currentType.label}s ({recordsData?.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Descrição</TableHead>
                  {activeRecordType === 'local' && <TableHead>Endereço</TableHead>}
                  {['local', 'regiao'].includes(activeRecordType) && <TableHead>Coordenadas</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Seções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsData?.data?.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.nome || record.descricao || record.nomeRota || record.idRota}
                        </div>
                        {record.codigoIntegracao && (
                          <div className="text-sm text-muted-foreground">
                            {record.codigoIntegracao}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {activeRecordType === 'local' && (
                      <TableCell>
                        {record.logradouro && (
                          <div className="text-sm">
                            {record.tipoLogradouro} {record.logradouro}, {record.numero}
                            <br />
                            {record.bairro} - {record.municipio}, {record.estado}
                          </div>
                        )}
                      </TableCell>
                    )}

                    {['local', 'regiao'].includes(activeRecordType) && (
                      <TableCell>
                        {record.latitude && record.longitude ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">
                              {parseFloat(record.latitude).toFixed(6)}, {parseFloat(record.longitude).toFixed(6)}
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Map className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não definido</span>
                        )}
                      </TableCell>
                    )}

                    <TableCell>
                      <Badge 
                        variant={record.ativo === false ? "destructive" : 
                               record.status === 'maintenance' ? "outline" : "default"}
                      >
                        {record.ativo === false ? 'Inativo' : 
                         record.status === 'maintenance' ? 'Manutenção' : 'Ativo'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {currentType.sections.map((section) => (
                          <Badge key={section} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {(!recordsData?.data || recordsData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <currentType.icon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Nenhum {currentType.label.toLowerCase()} encontrado
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Primeiro {currentType.label}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <currentType.icon className="h-5 w-5" />
              Criar Novo {currentType.label}
            </DialogTitle>
          </DialogHeader>
          {getFormComponent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}