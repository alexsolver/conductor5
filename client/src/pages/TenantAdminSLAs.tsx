import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  AlertTriangle, 
  Target, 
  Activity, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  Timer,
  TrendingUp,
  BarChart3,
  Flag,
  Archive,
  Users
} from 'lucide-react';

// ======================================
// TYPES AND SCHEMAS
// ======================================

interface TicketSLA {
  id: string;
  name: string;
  description?: string;
  slaLevel: 'L1' | 'L2' | 'L3';
  isActive: boolean;
  metadata: {
    category?: string[];
    impact?: string[];
    urgency?: string[];
    environment?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface SlaRule {
  id: string;
  slaId: string;
  ruleName: string;
  conditions: any;
  targetMetrics: {
    responseTime: number;
    resolutionTime: number;
    escalationThreshold: number;
  };
  isActive: boolean;
}

interface StatusTimeout {
  id: string;
  slaId: string;
  statusName: string;
  maxIdleTime: number;
  escalationAction: string;
  notificationRecipients: string[];
}

interface SlaMetrics {
  totalSlas: number;
  activeSlas: number;
  complianceRate: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  escalationCount: number;
}

// Validation schemas
const slaFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  slaLevel: z.enum(['L1', 'L2', 'L3']),
  isActive: z.boolean().default(true),
  metadata: z.object({
    category: z.array(z.string()).optional(),
    impact: z.array(z.string()).optional(),
    urgency: z.array(z.string()).optional(),
    environment: z.array(z.string()).optional(),
  }).optional()
});

const ruleFormSchema = z.object({
  ruleName: z.string().min(1, 'Nome da regra é obrigatório'),
  conditions: z.any(),
  responseTime: z.number().min(1, 'Tempo de resposta deve ser maior que 0'),
  resolutionTime: z.number().min(1, 'Tempo de resolução deve ser maior que 0'),
  escalationThreshold: z.number().min(1, 'Limite de escalação deve ser maior que 0'),
  isActive: z.boolean().default(true)
});

const timeoutFormSchema = z.object({
  statusName: z.string().min(1, 'Nome do status é obrigatório'),
  maxIdleTime: z.number().min(1, 'Tempo máximo deve ser maior que 0'),
  escalationAction: z.string().min(1, 'Ação de escalação é obrigatória'),
  notificationRecipients: z.array(z.string()).optional()
});

// ======================================
// MAIN COMPONENT
// ======================================

export default function TenantAdminSLAs() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSla, setSelectedSla] = useState<TicketSLA | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ======================================
  // DATA FETCHING
  // ======================================

  const { data: slas = [], isLoading: isLoadingSlas } = useQuery({
    queryKey: ['/api/sla/tickets-slas'],
    refetchInterval: 30000
  });

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<SlaMetrics>({
    queryKey: ['/api/sla/metrics/compliance-stats'],
    refetchInterval: 60000
  });

  const { data: ticketMetadata } = useQuery({
    queryKey: ['/api/ticket-metadata/field-configurations']
  });

  const { data: fieldOptions } = useQuery({
    queryKey: ['/api/ticket-metadata/field-options']
  });

  // ======================================
  // MUTATIONS
  // ======================================

  const createSlaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/sla/tickets-slas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao criar SLA');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/tickets-slas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sla/metrics/compliance-stats'] });
      toast({ title: 'SLA criado com sucesso!' });
      setShowCreateDialog(false);
    },
    onError: () => {
      toast({ title: 'Erro ao criar SLA', variant: 'destructive' });
    }
  });

  const updateSlaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/sla/tickets-slas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar SLA');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/tickets-slas'] });
      toast({ title: 'SLA atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar SLA', variant: 'destructive' });
    }
  });

  const deleteSlaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sla/tickets-slas/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir SLA');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/tickets-slas'] });
      toast({ title: 'SLA excluído com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir SLA', variant: 'destructive' });
    }
  });

  // ======================================
  // FORM HANDLERS
  // ======================================

  const slaForm = useForm({
    resolver: zodResolver(slaFormSchema),
    defaultValues: {
      name: '',
      description: '',
      slaLevel: 'L1' as const,
      isActive: true,
      metadata: {}
    }
  });

  const handleCreateSla = (data: any) => {
    createSlaMutation.mutate(data);
  };

  const handleToggleSlaStatus = (sla: TicketSLA) => {
    updateSlaMutation.mutate({
      id: sla.id,
      data: { ...sla, isActive: !sla.isActive }
    });
  };

  const handleDeleteSla = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este SLA?')) {
      deleteSlaMutation.mutate(id);
    }
  };

  // ======================================
  // COMPONENT HELPERS
  // ======================================

  const getSlaLevelColor = (level: string) => {
    switch (level) {
      case 'L1': return 'bg-red-100 text-red-800';
      case 'L2': return 'bg-yellow-100 text-yellow-800';
      case 'L3': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // ======================================
  // RENDER COMPONENTS
  // ======================================

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de SLAs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSlas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeSlas || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.complianceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResponseTime || 0}h</div>
            <p className="text-xs text-muted-foreground">
              Média mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Escalações</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.escalationCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>SLAs Configurados</CardTitle>
              <CardDescription>
                Gerencie os acordos de nível de serviço integrados aos metadados de tickets
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo SLA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSlas ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {slas.map((sla: TicketSLA) => (
                <div key={sla.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{sla.name}</h3>
                      <Badge className={getSlaLevelColor(sla.slaLevel)}>
                        {sla.slaLevel}
                      </Badge>
                      <Badge className={getStatusColor(sla.isActive)}>
                        {sla.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {sla.description && (
                      <p className="text-sm text-muted-foreground mb-2">{sla.description}</p>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {sla.metadata?.category && (
                        <span>Categorias: {sla.metadata.category.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSla(sla)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSlaStatus(sla)}
                    >
                      {sla.isActive ? <Archive className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSla(sla.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderRulesTab = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Regras de SLA</CardTitle>
            <CardDescription>
              Configure regras baseadas em metadados de tickets
            </CardDescription>
          </div>
          <Button onClick={() => setShowRuleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Selecione um SLA na aba "Visão Geral" para gerenciar suas regras
        </div>
      </CardContent>
    </Card>
  );

  const renderStatusTimeoutsTab = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Timeouts por Status</CardTitle>
            <CardDescription>
              Configure tempos limite para cada status de ticket
            </CardDescription>
          </div>
          <Button onClick={() => setShowTimeoutDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Timeout
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Configure timeouts baseados nos status dos metadados de tickets
        </div>
      </CardContent>
    </Card>
  );

  const renderEscalationsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Escalações</CardTitle>
        <CardDescription>
          Visualize e gerencie escalações de SLA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma escalação registrada
        </div>
      </CardContent>
    </Card>
  );

  const renderMetricsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance por SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Gráfico de performance será exibido aqui
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendências de Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Gráfico de tendências será exibido aqui
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema de SLA</h1>
          <p className="text-muted-foreground">
            Gerencie acordos de nível de serviço integrados aos metadados de tickets
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="timeouts" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeouts
          </TabsTrigger>
          <TabsTrigger value="escalations" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Escalações
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
        <TabsContent value="rules">{renderRulesTab()}</TabsContent>
        <TabsContent value="timeouts">{renderStatusTimeoutsTab()}</TabsContent>
        <TabsContent value="escalations">{renderEscalationsTab()}</TabsContent>
        <TabsContent value="metrics">{renderMetricsTab()}</TabsContent>
      </Tabs>

      {/* Create SLA Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo SLA</DialogTitle>
          </DialogHeader>
          <Form {...slaForm}>
            <form onSubmit={slaForm.handleSubmit(handleCreateSla)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={slaForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do SLA *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Suporte Crítico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={slaForm.control}
                  name="slaLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de SLA *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="L1">L1 - Crítico</SelectItem>
                          <SelectItem value="L2">L2 - Alto</SelectItem>
                          <SelectItem value="L3">L3 - Normal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={slaForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o propósito deste SLA..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={slaForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>SLA Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Ativar este SLA para aplicação automática
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

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSlaMutation.isPending}>
                  {createSlaMutation.isPending ? 'Criando...' : 'Criar SLA'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}