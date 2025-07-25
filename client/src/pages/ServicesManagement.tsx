import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Wrench,
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  FileText,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  Settings,
  Activity
} from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'maintenance' | 'installation' | 'repair' | 'inspection' | 'support';
  duration: number; // in minutes
  cost: number;
  requiredSkills: string[];
  equipmentRequired: string[];
  active: boolean;
  createdAt: string;
}

interface Service {
  id: string;
  serviceTypeId: string;
  serviceTypeName: string;
  customerId: string;
  customerName: string;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: string;
  completedDate?: string;
  location: string;
  description: string;
  notes?: string;
  cost: number;
  duration: number;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceStats {
  totalServices: number;
  completedServices: number;
  activeServices: number;
  averageRating: number;
  totalRevenue: number;
  averageDuration: number;
  serviceTypes: number;
  techniciansActive: number;
}

export function ServicesManagement() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for development - would be replaced with real API calls
  const mockServiceStats: ServiceStats = {
    totalServices: 145,
    completedServices: 98,
    activeServices: 23,
    averageRating: 4.6,
    totalRevenue: 87650,
    averageDuration: 120,
    serviceTypes: 12,
    techniciansActive: 8
  };

  const mockServices: Service[] = [
    {
      id: "1",
      serviceTypeId: "st1",
      serviceTypeName: "Manutenção Preventiva",
      customerId: "c1",
      customerName: "Empresa ABC Ltda",
      assignedTechnicianId: "t1",
      assignedTechnicianName: "João Silva",
      status: "in_progress",
      priority: "medium",
      scheduledDate: "2025-01-25T14:00:00Z",
      location: "São Paulo - SP, Rua A, 123",
      description: "Manutenção preventiva de equipamentos HVAC",
      cost: 350.00,
      duration: 180,
      createdAt: "2025-01-20T10:00:00Z",
      updatedAt: "2025-01-25T09:00:00Z"
    },
    {
      id: "2",
      serviceTypeId: "st2",
      serviceTypeName: "Instalação",
      customerId: "c2",
      customerName: "Tech Solutions Corp",
      assignedTechnicianId: "t2",
      assignedTechnicianName: "Maria Santos",
      status: "scheduled",
      priority: "high",
      scheduledDate: "2025-01-26T09:00:00Z",
      location: "Rio de Janeiro - RJ, Av. B, 456",
      description: "Instalação de novo sistema de climatização",
      cost: 1200.00,
      duration: 480,
      createdAt: "2025-01-22T15:30:00Z",
      updatedAt: "2025-01-23T08:15:00Z"
    },
    {
      id: "3",
      serviceTypeId: "st3",
      serviceTypeName: "Reparo Corretivo",
      customerId: "c3",
      customerName: "Industrial Mega Corp",
      assignedTechnicianId: "t1",
      assignedTechnicianName: "João Silva",
      status: "completed",
      priority: "urgent",
      scheduledDate: "2025-01-23T08:00:00Z",
      completedDate: "2025-01-23T11:30:00Z",
      location: "Campinas - SP, Zona Industrial",
      description: "Reparo emergencial em sistema de refrigeração",
      cost: 850.00,
      duration: 210,
      rating: 5,
      feedback: "Serviço excelente, problema resolvido rapidamente",
      createdAt: "2025-01-22T22:45:00Z",
      updatedAt: "2025-01-23T11:30:00Z"
    }
  ];

  const mockServiceTypes: ServiceType[] = [
    {
      id: "st1",
      name: "Manutenção Preventiva",
      code: "PREV001",
      description: "Manutenção regular para prevenção de problemas",
      category: "maintenance",
      duration: 120,
      cost: 200.00,
      requiredSkills: ["HVAC", "Elétrica"],
      equipmentRequired: ["Multímetro", "Kit Ferramentas"],
      active: true,
      createdAt: "2025-01-01T00:00:00Z"
    },
    {
      id: "st2",
      name: "Instalação",
      code: "INST001",
      description: "Instalação de novos equipamentos",
      category: "installation",
      duration: 240,
      cost: 500.00,
      requiredSkills: ["Instalação", "HVAC", "Elétrica"],
      equipmentRequired: ["Furadeira", "Kit Instalação", "Multímetro"],
      active: true,
      createdAt: "2025-01-01T00:00:00Z"
    },
    {
      id: "st3",
      name: "Reparo Corretivo",
      code: "CORR001",
      description: "Reparo de equipamentos com defeito",
      category: "repair",
      duration: 180,
      cost: 350.00,
      requiredSkills: ["Diagnóstico", "Reparos", "HVAC"],
      equipmentRequired: ["Kit Diagnóstico", "Peças Reposição"],
      active: true,
      createdAt: "2025-01-01T00:00:00Z"
    }
  ];

  // Simulated queries - would use real API endpoints
  const { data: services = mockServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/materials-services/services"],
    queryFn: () => Promise.resolve(mockServices),
    enabled: true
  });

  const { data: serviceTypes = mockServiceTypes } = useQuery({
    queryKey: ["/api/materials-services/service-types"],
    queryFn: () => Promise.resolve(mockServiceTypes),
    enabled: true
  });

  const { data: serviceStats = mockServiceStats } = useQuery({
    queryKey: ["/api/materials-services/services/stats"],
    queryFn: () => Promise.resolve(mockServiceStats),
    enabled: true
  });

  // Mutations for service management
  const createServiceMutation = useMutation({
    mutationFn: async (data: Partial<Service>) => {
      // Simulate API call
      return Promise.resolve({ success: true, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/services"] });
      toast({ title: "Sucesso", description: "Serviço criado com sucesso!" });
      setIsCreateServiceOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar serviço",
        variant: "destructive"
      });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Service> & { id: string }) => {
      // Simulate API call
      return Promise.resolve({ success: true, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/services"] });
      toast({ title: "Sucesso", description: "Serviço atualizado com sucesso!" });
      setIsEditOpen(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar serviço",
        variant: "destructive"
      });
    }
  });

  // Filter services
  const filteredServices = services.filter((service: Service) => {
    const matchesSearch = service.serviceTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || service.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || 
      serviceTypes.find(st => st.id === service.serviceTypeId)?.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'on_hold': return 'Em Espera';
      default: return 'Indefinido';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return 'Indefinida';
    }
  };

  const handleCreateService = (formData: FormData) => {
    const serviceData = {
      serviceTypeId: formData.get('serviceTypeId') as string,
      customerId: formData.get('customerId') as string,
      assignedTechnicianId: formData.get('assignedTechnicianId') as string,
      priority: formData.get('priority') as Service['priority'],
      scheduledDate: formData.get('scheduledDate') as string,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      notes: formData.get('notes') as string,
      status: 'scheduled' as const
    };

    createServiceMutation.mutate(serviceData);
  };

  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  if (isLoadingServices) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando serviços...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie tipos de serviços, agendamentos e execução técnica
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateTypeOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
          <Button onClick={() => setIsCreateServiceOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {serviceStats.activeServices} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((serviceStats.completedServices / serviceStats.totalServices) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {serviceStats.completedServices} concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {serviceStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceStats.averageRating.toFixed(1)}/5
            </div>
            <div className="flex mt-1">
              {renderStarRating(Math.round(serviceStats.averageRating))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="scheduled">Agendado</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="on_hold">Em Espera</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
            <SelectItem value="installation">Instalação</SelectItem>
            <SelectItem value="repair">Reparo</SelectItem>
            <SelectItem value="inspection">Inspeção</SelectItem>
            <SelectItem value="support">Suporte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <CardDescription>
            {filteredServices.length} serviço(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{service.serviceTypeName}</h3>
                      <Badge className={getPriorityColor(service.priority)}>
                        {getPriorityLabel(service.priority)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{service.customerName}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {service.assignedTechnicianName}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(service.scheduledDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        R$ {service.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={getStatusColor(service.status)}>
                      {getStatusLabel(service.status)}
                    </Badge>
                    {service.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        {renderStarRating(service.rating)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedService(service);
                        // View service details logic
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedService(service);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {service.status === 'scheduled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Start service logic
                          updateServiceMutation.mutate({
                            id: service.id,
                            status: 'in_progress'
                          });
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum serviço encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Service Dialog */}
      <Dialog open={isCreateServiceOpen} onOpenChange={setIsCreateServiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
            <DialogDescription>
              Agende um novo serviço técnico
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateService(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceTypeId">Tipo de Serviço *</Label>
                <Select name="serviceTypeId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select name="priority" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">Cliente *</Label>
                <Input id="customerId" name="customerId" placeholder="ID do cliente" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTechnicianId">Técnico Responsável *</Label>
                <Input id="assignedTechnicianId" name="assignedTechnicianId" placeholder="ID do técnico" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Data/Hora Agendada *</Label>
                <Input id="scheduledDate" name="scheduledDate" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <Input id="location" name="location" placeholder="Endereço completo" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Serviço *</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateServiceOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createServiceMutation.isPending}>
                {createServiceMutation.isPending ? 'Criando...' : 'Criar Serviço'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}