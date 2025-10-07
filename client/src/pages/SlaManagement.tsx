// ✅ 1QA.MD COMPLIANCE: SLA MANAGEMENT PAGE
// Complete SLA management interface following Clean Architecture

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Users,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Zap,
  Monitor,
  GitBranch,
  Play,
  Code,
  Settings2,
  Filter,
  X
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { QueryBuilderComponent } from '@/components/QueryBuilder';

// SLA Schema imports - following 1qa.md
import type {
  QueryRule,
  QueryBuilder,
  QueryOperator,
  LogicalOperator,
  TicketField,
  queryOperatorEnum,
  logicalOperatorEnum,
  ticketFieldEnum
} from '@shared/schema-sla';

// ======================================
// TYPES AND SCHEMAS
// ======================================

interface SlaDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: 'SLA' | 'OLA' | 'UC';
  status: 'active' | 'inactive' | 'expired' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  validFrom: string;
  validUntil?: string;
  applicationRules: any[];
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  updateTimeMinutes?: number;
  idleTimeMinutes?: number;
  businessHoursOnly: boolean;
  workingDays: number[];
  workingHours: { start: string; end: string };
  timezone: string;
  escalationEnabled: boolean;
  escalationThresholdPercent: number;
  escalationActions: any[];
  pauseConditions: any[];
  resumeConditions: any[];
  stopConditions: any[];
  workflowActions: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SlaInstance {
  id: string;
  tenantId: string;
  slaDefinitionId: string;
  ticketId: string;
  startedAt: string;
  status: 'running' | 'paused' | 'completed' | 'violated';
  currentMetric: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time';
  elapsedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  isBreached: boolean;
  breachPercentage: number;
  createdAt: string;
}

interface SlaViolation {
  id: string;
  tenantId: string;
  ticketId: string;
  violationType: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time';
  targetMinutes: number;
  actualMinutes: number;
  violationMinutes: number;
  violationPercentage: number;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
}

interface SlaComplianceStats {
  totalTickets: number;
  slaMetTickets: number;
  slaViolatedTickets: number;
  compliancePercentage: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  avgIdleTimeMinutes: number;
  totalEscalations: number;
  escalationRate: number;
}

// Form schemas
const slaDefinitionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['SLA', 'OLA', 'UC']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  validFrom: z.string().min(1, 'Data de início é obrigatória'),
  validUntil: z.string().optional().nullable(),
  businessHoursOnly: z.boolean(),
  workingDays: z.array(z.number()),
  workingHours: z.object({
    start: z.string(),
    end: z.string()
  }),
  timezone: z.string(),
  escalationEnabled: z.boolean(),
  escalationThresholdPercent: z.number().min(1).max(100),
  timeTargets: z.array(z.object({
    metric: z.string(),
    target: z.number().min(1),
    unit: z.enum(['minutes', 'hours', 'days']),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
  })).min(1, 'Pelo menos uma meta de tempo deve ser especificada'),
  applicationRules: z.object({
    rules: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
      value: z.string()
    })),
    logicalOperator: z.enum(['AND', 'OR'])
  }),
  escalationActions: z.array(z.any()),
  pauseConditions: z.array(z.any()),
  resumeConditions: z.array(z.any()),
  stopConditions: z.array(z.any()),
  workflowActions: z.array(z.any())
});

// Schema para criação de workflows
const workflowSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  trigger: z.enum(['sla_breach', 'sla_warning', 'sla_met', 'instance_created', 'instance_closed']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
    value: z.string()
  })),
  actions: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['notify', 'escalate', 'assign', 'update_field', 'pause_sla', 'resume_sla', 'create_task']),
    config: z.record(z.any()).optional()
  })).default([]),
  isActive: z.boolean(),
  priority: z.number().min(1).max(10)
});

// ======================================
// MAIN COMPONENT
// ======================================

export default function SlaManagement() {
  const [selectedSla, setSelectedSla] = useState<SlaDefinition | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Queries
  const { data: slaDefinitions, isLoading: isLoadingSlas } = useQuery({
    queryKey: ['/api/sla/definitions'],
    queryFn: () => apiRequest('GET', '/api/sla/definitions').then(res => res.json()),
  });

  const { data: activeInstances } = useQuery({
    queryKey: ['/api/sla/instances/active'],
    queryFn: () => apiRequest('GET', '/api/sla/instances/active').then(res => res.json()),
  });

  const { data: breachedInstances } = useQuery({
    queryKey: ['/api/sla/instances/breached'],
    queryFn: () => apiRequest('GET', '/api/sla/instances/breached').then(res => res.json()),
  });

  const { data: violations } = useQuery({
    queryKey: ['/api/sla/violations'],
    queryFn: () => apiRequest('GET', '/api/sla/violations').then(res => res.json()),
  });

  const { data: complianceStats } = useQuery({
    queryKey: ['/api/sla/analytics/compliance'],
    queryFn: () => apiRequest('GET', '/api/sla/analytics/compliance').then(res => res.json()),
  });

  // Estado para controle do workflow
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);

  // Queries para workflows
  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ['/api/sla/workflows'],
    queryFn: () => apiRequest('GET', '/api/sla/workflows').then(res => res.json()),
  });

  // Mutations
  const createSlaMutation = useMutation({
    mutationFn: (data: any) => 
      fetch('/api/sla/definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/definitions'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "SLA criado",
        description: "SLA foi criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar SLA",
        variant: "destructive",
      });
    },
  });

  const updateSlaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      fetch(`/api/sla/definitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/definitions'] });
      setIsEditDialogOpen(false);
      setSelectedSla(null);
      toast({
        title: "SLA atualizado",
        description: "SLA foi atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar SLA",
        variant: "destructive",
      });
    },
  });

  const deleteSlaMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/sla/definitions/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/definitions'] });
      toast({
        title: "SLA excluído",
        description: "SLA foi excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir SLA",
        variant: "destructive",
      });
    },
  });

  const checkBreachesMutation = useMutation({
    mutationFn: () => fetch('/api/sla/monitoring/check-breaches', {
      method: 'POST',
    }).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/instances'] });
      toast({
        title: "Verificação completa",
        description: `${data?.total || 0} violações detectadas`,
      });
    },
  });

  // Mutation para criar workflow
  const createWorkflowMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/sla/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla/workflows'] });
      setIsWorkflowDialogOpen(false);
      toast({
        title: "Workflow criado",
        description: "Workflow de automação foi criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar workflow",
        variant: "destructive",
      });
    },
  });

  // Form para SLA
  const form = useForm<z.infer<typeof slaDefinitionSchema>>({
    resolver: zodResolver(slaDefinitionSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'SLA',
      priority: 'medium',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: null,
      businessHoursOnly: true,
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '08:00', end: '18:00' },
      timezone: 'America/Sao_Paulo',
      escalationEnabled: false,
      escalationThresholdPercent: 80,
      timeTargets: [
        { metric: 'response_time', target: 30, unit: 'minutes', priority: 'medium' }
      ],
      applicationRules: { rules: [], logicalOperator: 'AND' },
      escalationActions: [],
      pauseConditions: [],
      resumeConditions: [],
      stopConditions: [],
      workflowActions: []
    },
  });

  // Form para Workflow
  const workflowForm = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: '',
      description: '',
      trigger: 'sla_breach',
      conditions: [],
      actions: [
        {
          id: 'default-notify',
          type: 'notify',
          config: {
            message: 'SLA workflow triggered',
            recipients: ['admin']
          }
        }
      ],
      isActive: true,
      priority: 5
    },
  });

  const onSubmit = (values: z.infer<typeof slaDefinitionSchema>) => {
    // Filtrar regras com valores vazios e garantir que applicationRules tenha pelo menos uma regra válida
    const validRules = values.applicationRules?.rules?.filter(rule => 
      rule.field && rule.operator && rule.value && rule.value.trim() !== ''
    ) || [];

    const transformedValues = {
      ...values,
      applicationRules: {
        rules: validRules.length > 0 
          ? validRules 
          : [{
              field: 'status',
              operator: 'equals',
              value: 'open'
            }],
        logicalOperator: values.applicationRules?.logicalOperator || 'AND'
      }
    };

    if (selectedSla) {
      updateSlaMutation.mutate({ id: selectedSla.id, data: transformedValues });
    } else {
      createSlaMutation.mutate(transformedValues);
    }
  };

  const onWorkflowSubmit = (values: z.infer<typeof workflowSchema>) => {
    // Converter trigger (string) para triggers (array) conforme esperado pelo backend
    const transformedValues = {
      ...values,
      triggers: [{ type: values.trigger }], // Converter para formato array
      // Garantir que pelo menos uma ação seja especificada
      actions: values.actions.length > 0 ? values.actions : [
        {
          id: 'default-action',
          type: 'notify',
          config: {
            message: 'SLA workflow triggered',
            recipients: ['admin']
          }
        }
      ],
      // Remove o campo trigger singular
      trigger: undefined
    };

    createWorkflowMutation.mutate(transformedValues);
  };

  const handleEdit = (sla: SlaDefinition) => {
    setSelectedSla(sla);
    form.reset({
      name: sla.name,
      description: sla.description,
      type: sla.type,
      priority: sla.priority,
      validFrom: sla.validFrom,
      validUntil: sla.validUntil || null,
      // Remove time related fields from here as they are now in timeTargets
      // responseTimeMinutes: sla.responseTimeMinutes,
      // resolutionTimeMinutes: sla.resolutionTimeMinutes,
      // updateTimeMinutes: sla.updateTimeMinutes,
      // idleTimeMinutes: sla.idleTimeMinutes,
      businessHoursOnly: sla.businessHoursOnly,
      workingDays: sla.workingDays,
      workingHours: sla.workingHours,
      timezone: sla.timezone,
      escalationEnabled: sla.escalationEnabled,
      escalationThresholdPercent: sla.escalationThresholdPercent,
      timeTargets: sla.timeTargets || [{ metric: 'response_time', target: 30, unit: 'minutes', priority: 'medium' }],
      applicationRules: sla.applicationRules as any || { rules: [], logicalOperator: 'AND' },
      escalationActions: sla.escalationActions,
      pauseConditions: sla.pauseConditions,
      resumeConditions: sla.resumeConditions,
      stopConditions: sla.stopConditions,
      workflowActions: sla.workflowActions
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este SLA?')) {
      deleteSlaMutation.mutate(id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'expired': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (isLoadingSlas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Carregando SLAs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="sla-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de SLAs</h1>
          <p className="text-gray-600">
            Gerencie acordos de nível de serviço, operacional e contratos base
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => checkBreachesMutation.mutate()}
            disabled={checkBreachesMutation.isPending}
            variant="outline"
            data-testid="button-check-breaches"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Verificar Violações
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-sla">
                <Plus className="w-4 h-4 mr-2" />
                Novo SLA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo SLA</DialogTitle>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">*</span>
                    <span>Campos obrigatórios</span>
                  </div>
                </div>
              </DialogHeader>
              <SlaForm 
                form={form} 
                onSubmit={onSubmit} 
                isSubmitting={createSlaMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {complianceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Total</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(complianceStats?.compliancePercentage ?? 0).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600">
                {complianceStats?.slaMetTickets ?? 0} de {complianceStats?.totalTickets ?? 0} tickets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio Resposta</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(complianceStats?.avgResponseTimeMinutes ?? 0)}min
              </div>
              <p className="text-xs text-gray-600">Tempo médio de primeira resposta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio Resolução</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(complianceStats?.avgResolutionTimeMinutes ?? 0)}min
              </div>
              <p className="text-xs text-gray-600">Tempo médio de resolução</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Violações</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {complianceStats?.slaViolatedTickets ?? 0}
              </div>
              <p className="text-xs text-gray-600">
                Taxa de escalonamento: {(complianceStats?.escalationRate ?? 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="definitions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="definitions" data-testid="tab-definitions">
            <Settings className="w-4 h-4 mr-2" />
            Definições
          </TabsTrigger>
          <TabsTrigger value="monitoring" data-testid="tab-monitoring">
            <Activity className="w-4 h-4 mr-2" />
            Monitoramento
          </TabsTrigger>
          <TabsTrigger value="violations" data-testid="tab-violations">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Violações
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <Zap className="w-4 h-4 mr-2" />
            Automação
          </TabsTrigger>
        </TabsList>

        {/* SLA Definitions Tab */}
        <TabsContent value="definitions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Definições de SLA</CardTitle>
                <CardDescription>
                  Configure acordos de nível de serviço (SLA), operacional (OLA) e contratos base (UC)
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-sla">
                <Plus className="w-4 h-4 mr-2" />
                Novo SLA
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slaDefinitions?.data?.map((sla: SlaDefinition) => (
                  <div 
                    key={sla.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`sla-definition-${sla.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{sla.name}</h3>
                        <Badge variant={getStatusBadgeVariant(sla.status)}>
                          {sla.status}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(sla.priority)}>
                          {sla.priority}
                        </Badge>
                        <Badge variant="outline">{sla.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{sla.description}</p>
                      <div className="flex space-x-4 text-xs text-gray-500">
                        {sla.timeTargets?.map((target) => (
                          <span key={target.metric}>
                            {target.metric.replace('_', ' ')}: {target.target} {target.unit} ({target.priority})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(sla)}
                        data-testid={`button-edit-${sla.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(sla.id)}
                        data-testid={`button-delete-${sla.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {(!slaDefinitions?.data || slaDefinitions.data.length === 0) && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum SLA configurado
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Crie seu primeiro SLA para começar o monitoramento
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro SLA
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Active Instances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PlayCircle className="w-5 h-5 mr-2 text-green-600" />
                  Instâncias Ativas
                </CardTitle>
                <CardDescription>
                  SLAs em andamento ({activeInstances?.total || 0})
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {activeInstances?.data?.map((instance: SlaInstance) => (
                    <div 
                      key={instance.id} 
                      className="p-3 border rounded-lg"
                      data-testid={`active-instance-${instance.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Ticket #{instance.ticketId.slice(-8)}</span>
                        <Badge variant={instance.status === 'running' ? 'default' : 'secondary'}>
                          {instance.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Métrica: {instance.currentMetric}</div>
                        <div>Restante: {instance.remainingMinutes}min</div>
                        <div>Progresso: {((instance.elapsedMinutes / instance.targetMinutes) * 100).toFixed(1)}%</div>
                      </div>
                      {instance.isBreached && (
                        <div className="mt-2 text-red-600 text-sm font-medium">
                          ⚠️ Violação: +{instance.breachPercentage.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Breached Instances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  Instâncias Violadas
                </CardTitle>
                <CardDescription>
                  SLAs que ultrapassaram o limite ({breachedInstances?.total || 0})
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {breachedInstances?.data?.map((instance: SlaInstance) => (
                    <div 
                      key={instance.id} 
                      className="p-3 border border-red-200 rounded-lg bg-red-50"
                      data-testid={`breached-instance-${instance.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Ticket #{instance.ticketId.slice(-8)}</span>
                        <Badge variant="destructive">VIOLADO</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Métrica: {instance.currentMetric}</div>
                        <div>Violação: +{instance.breachPercentage.toFixed(1)}%</div>
                        <div>Tempo excedido: {instance.elapsedMinutes - instance.targetMinutes}min</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Violações</CardTitle>
              <CardDescription>
                Registro completo de violações de SLA para análise e melhoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {violations?.data?.map((violation: SlaViolation) => (
                  <div 
                    key={violation.id} 
                    className="p-4 border rounded-lg"
                    data-testid={`violation-${violation.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Ticket #{violation.ticketId.slice(-8)}</span>
                        <Badge variant="destructive">{violation.violationType}</Badge>
                        <Badge variant={violation.severityLevel === 'critical' ? 'destructive' : 'secondary'}>
                          {violation.severityLevel}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        {!violation.acknowledged && (
                          <Badge variant="outline">Não Reconhecida</Badge>
                        )}
                        {!violation.resolved && (
                          <Badge variant="outline">Não Resolvida</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Meta: {violation.targetMinutes}min | Atual: {violation.actualMinutes}min</div>
                      <div>Violação: {violation.violationMinutes}min (+{violation.violationPercentage.toFixed(1)}%)</div>
                      <div>Data: {new Date(violation.createdAt).toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                ))}

                {(!violations?.data || violations.data.length === 0) && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma violação registrada
                    </h3>
                    <p className="text-gray-600">
                      Excelente! Todos os SLAs estão sendo cumpridos.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Desempenho</CardTitle>
              <CardDescription>
                Métricas detalhadas e tendências de compliance dos SLAs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Dashboard de Analytics
                </h3>
                <p className="text-gray-600">
                  Gráficos e relatórios detalhados em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Workflows de Automação SLA</h2>
                <p className="text-gray-600">Configure ações automáticas baseadas em eventos de SLA</p>
              </div>
              <Button 
                onClick={() => setIsWorkflowDialogOpen(true)}
                data-testid="button-create-workflow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Workflow
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                  <GitBranch className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workflows?.total || 0}</div>
                  <p className="text-xs text-gray-600">{workflows?.active || 0} ativos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
                  <Play className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600">Disparos automáticos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">100%</div>
                  <p className="text-xs text-gray-600">Últimas 24h</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Falhas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <p className="text-xs text-gray-600">Requer atenção</p>
                </CardContent>
              </Card>
            </div>

            {/* Workflows List */}
            <Card>
              <CardHeader>
                <CardTitle>Workflows Configurados</CardTitle>
                <CardDescription>
                  Gerencie workflows automáticos para resposta a eventos de SLA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workflows && workflows.length > 0 ? (
                  <div className="space-y-4">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{workflow.name}</h3>
                          <Badge variant={workflow.isActive ? "default" : "secondary"}>
                            {workflow.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Prioridade: {workflow.priority}</span>
                          <span>Triggers: {workflow.triggers?.length || 0}</span>
                          <span>Ações: {workflow.actions?.length || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum workflow configurado
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Crie seu primeiro workflow para automatizar respostas a eventos de SLA
                    </p>
                    <Button 
                      onClick={() => setIsWorkflowDialogOpen(true)}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Workflow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSla ? 'Editar SLA' : 'Criar Novo SLA'}
            </DialogTitle>
            
            {/* Info Panel for Editing */}
            {selectedSla && (
              <Card className="mt-4 border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Datas e Horários
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-blue-800 font-medium">Criação:</Label>
                    <p className="text-blue-900 mt-1">
                      {new Date(selectedSla.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-blue-800 font-medium">Vencimento:</Label>
                    <p className="text-blue-900 mt-1">
                      {selectedSla.validUntil 
                        ? new Date(selectedSla.validUntil).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Sem vencimento'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-blue-800 font-medium">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedSla.status === 'active' ? 'default' : 'secondary'}
                        className={
                          selectedSla.status === 'active' 
                            ? 'bg-blue-600' 
                            : selectedSla.status === 'inactive'
                            ? 'bg-gray-500'
                            : selectedSla.status === 'expired'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }
                      >
                        {selectedSla.status === 'active' ? 'Aberto' : 
                         selectedSla.status === 'inactive' ? 'Inativo' :
                         selectedSla.status === 'expired' ? 'Expirado' : 'Rascunho'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-blue-800 font-medium">SLA Decorrido</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-blue-900">
                        {selectedSla.status === 'active' ? 'SLA Decorrido' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500">*</span>
                <span>Campos obrigatórios</span>
              </div>
            </div>
          </DialogHeader>
          <SlaForm 
            form={form} 
            onSubmit={onSubmit} 
            isSubmitting={updateSlaMutation.isPending}
            isEdit={!!selectedSla}
            selectedSla={selectedSla}
          />
        </DialogContent>
      </Dialog>

      {/* Workflow Dialog */}
      <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Workflow de Automação</DialogTitle>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="text-red-500">*</span>
                <span>Campos obrigatórios</span>
              </div>
            </div>
          </DialogHeader>
          <WorkflowForm 
            form={workflowForm} 
            onSubmit={onWorkflowSubmit} 
            isSubmitting={createWorkflowMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ======================================
// SLA FORM COMPONENT
// ======================================

interface SlaFormProps {
  form: any;
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
  selectedSla?: SlaDefinition | null;
}

function SlaForm({ form, onSubmit, isSubmitting, isEdit, selectedSla }: SlaFormProps) {
  const { toast } = useToast();
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 📋 SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
        <div className="border rounded-lg p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informações Básicas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Nome do SLA 
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: SLA Premium - Resposta Rápida" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Tipo 
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SLA">SLA - Service Level Agreement</SelectItem>
                      <SelectItem value="OLA">OLA - Operational Level Agreement</SelectItem>
                      <SelectItem value="UC">UC - Underpinning Contract</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-1">
                    Descrição 
                    <span className="text-gray-500 text-sm">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o objetivo e escopo deste SLA" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Prioridade 
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">🟢 Baixa</SelectItem>
                      <SelectItem value="medium">🟡 Média</SelectItem>
                      <SelectItem value="high">🟠 Alta</SelectItem>
                      <SelectItem value="critical">🔴 Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ⏱️ SEÇÃO 2: METAS DE TEMPO */}
        <div className="border rounded-lg p-5 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Metas de Tempo</h3>
              <span className="text-sm text-gray-500">(pelo menos uma meta é obrigatória)</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentTargets = form.getValues('timeTargets') || [];
                const usedMetrics = currentTargets.map((t: any) => t.metric);
                const availableMetrics = ['response_time', 'resolution_time', 'update_time', 'idle_time']
                  .filter(m => !usedMetrics.includes(m));
                
                if (availableMetrics.length === 0) {
                  toast({
                    title: "Todas as métricas já foram adicionadas",
                    description: "Você já criou metas para todos os tipos de tempo disponíveis.",
                    variant: "destructive"
                  });
                  return;
                }
                
                form.setValue('timeTargets', [
                  ...currentTargets,
                  { metric: availableMetrics[0], target: 30, unit: 'minutes', priority: 'medium' }
                ]);
              }}
              data-testid="button-add-time-target"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Meta
            </Button>
          </div>

          <div className="space-y-3">
            {form.watch('timeTargets')?.map((target: any, index: number) => {
              const currentTargets = form.getValues('timeTargets') || [];
              const usedMetrics = currentTargets
                .map((t: any, i: number) => i !== index ? t.metric : null)
                .filter(Boolean);
              
              return (
                <div key={index} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
                  <div className="flex-1">
                    <Select
                      value={target.metric}
                      onValueChange={(value) => {
                        const targets = form.getValues('timeTargets');
                        const otherMetrics = targets
                          .map((t: any, i: number) => i !== index ? t.metric : null)
                          .filter(Boolean);
                        
                        if (otherMetrics.includes(value)) {
                          toast({
                            title: "Métrica duplicada",
                            description: "Esta métrica já está sendo usada em outra meta.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        targets[index].metric = value;
                        form.setValue('timeTargets', targets);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Métrica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="response_time" disabled={usedMetrics.includes('response_time')}>⚡ Tempo de Resposta</SelectItem>
                        <SelectItem value="resolution_time" disabled={usedMetrics.includes('resolution_time')}>✅ Tempo de Resolução</SelectItem>
                        <SelectItem value="update_time" disabled={usedMetrics.includes('update_time')}>🔄 Tempo de Atualização</SelectItem>
                        <SelectItem value="idle_time" disabled={usedMetrics.includes('idle_time')}>⏸️ Tempo Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-24">
                    <Input
                      type="number"
                      value={target.target}
                      onChange={(e) => {
                        const targets = form.getValues('timeTargets');
                        targets[index].target = parseInt(e.target.value) || 0;
                        form.setValue('timeTargets', targets);
                      }}
                      placeholder="Valor"
                    />
                  </div>

                  <div className="w-28">
                    <Select
                      value={target.unit}
                      onValueChange={(value) => {
                        const targets = form.getValues('timeTargets');
                        targets[index].unit = value as 'minutes' | 'hours' | 'days';
                        form.setValue('timeTargets', targets);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const targets = form.getValues('timeTargets');
                      targets.splice(index, 1);
                      form.setValue('timeTargets', targets);
                    }}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              );
            })}
            
            {(!form.watch('timeTargets') || form.watch('timeTargets').length === 0) && (
              <div className="text-center py-6 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma meta de tempo definida. Clique em "Adicionar Meta" para começar.</p>
              </div>
            )}
          </div>
        </div>

        {/* 📅 SEÇÃO 3: PERÍODO DE VALIDADE */}
        <div className="border rounded-lg p-5 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Período de Validade</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="validFrom"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Data de Início 
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validUntil"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Data de Fim 
                    <span className="text-gray-500 text-sm">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 🕐 SEÇÃO 4: HORÁRIO DE FUNCIONAMENTO */}
        <div className="border rounded-lg p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Horário de Funcionamento</h3>
          </div>

          <FormField
            control={form.control}
            name="businessHoursOnly"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white dark:bg-gray-800">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Apenas Horário Comercial</FormLabel>
                  <div className="text-sm text-gray-600">
                    SLA será pausado fora do horário comercial
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-business-hours"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="workingHours.start"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Horário de Início</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                      data-testid="input-working-start"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workingHours.end"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Horário de Fim</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                      data-testid="input-working-end"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 🚨 SEÇÃO 5: ESCALONAMENTO */}
        <div className="border rounded-lg p-5 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Configurações de Escalonamento</h3>
          </div>

          <FormField
            control={form.control}
            name="escalationEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white dark:bg-gray-800">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Habilitar Escalonamento Automático</FormLabel>
                  <div className="text-sm text-gray-600">
                    Escalonar automaticamente quando próximo ao vencimento
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-escalation"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch('escalationEnabled') && (
            <FormField
              control={form.control}
              name="escalationThresholdPercent"
              render={({ field, fieldState }) => (
                <FormItem className="mt-4">
                  <FormLabel className="flex items-center gap-1">
                    Limite de Escalonamento (%)
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-escalation-threshold"
                      placeholder="Ex: 80 (escala quando atingir 80% do tempo)"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* 🎯 SEÇÃO 6: REGRAS DE APLICAÇÃO */}
        <div className="border rounded-lg p-5 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Regras de Aplicação</h3>
            <span className="text-sm text-gray-500">(quando este SLA deve ser aplicado)</span>
          </div>
          
          <FormField
            control={form.control}
            name="applicationRules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condições de Aplicação do SLA</FormLabel>
                <FormControl>
                  <QueryBuilderComponent
                    value={field.value || { rules: [], logicalOperator: 'AND' }}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* BOTÃO DE AÇÃO */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} data-testid="button-save-sla" className="min-w-[150px]">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {isEdit ? 'Atualizar SLA' : 'Criar SLA'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ======================================
// WORKFLOW FORM COMPONENT
// ======================================

interface WorkflowFormProps {
  form: any;
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
}

function WorkflowForm({ form, onSubmit, isSubmitting }: WorkflowFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Nome do Workflow 
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome do workflow" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="flex items-center gap-1">
                    Descrição 
                    <span className="text-gray-500 text-sm">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o workflow e sua finalidade"
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trigger"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Gatilho 
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Selecione o gatilho" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sla_breach">Violação de SLA</SelectItem>
                      <SelectItem value="sla_warning">Alerta de SLA</SelectItem>
                      <SelectItem value="sla_met">SLA Cumprido</SelectItem>
                      <SelectItem value="instance_created">Instância Criada</SelectItem>
                      <SelectItem value="instance_closed">Instância Fechada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Prioridade 
                    <span className="text-red-500">*</span>
                    <span className="text-sm text-gray-500">(1-10)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="10" 
                      placeholder="1-10" 
                      className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuração</h3>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Workflow Ativo</FormLabel>
                    <div className="text-sm text-gray-600">
                      Habilitar execução automática deste workflow
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-workflow-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-1">
                Ações do Workflow 
                <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500">(pelo menos uma ação é obrigatória)</span>
              </h4>
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const currentActions = form.getValues('actions') || [];
                    form.setValue('actions', [...currentActions, {
                      type: 'send_email',
                      config: {
                        to: 'admin@empresa.com',
                        subject: 'Violação de SLA detectada',
                        template: 'sla_breach_notification'
                      }
                    }]);
                  }}
                  data-testid="button-add-email-action"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Email
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const currentActions = form.getValues('actions') || [];
                    form.setValue('actions', [...currentActions, {
                      type: 'create_ticket',
                      config: {
                        priority: 'high',
                        category: 'incident',
                        assignTo: 'sla-team'
                      }
                    }]);
                  }}
                  data-testid="button-add-ticket-action"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Criar Ticket
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const currentActions = form.getValues('actions') || [];
                    form.setValue('actions', [...currentActions, {
                      type: 'escalate',
                      config: {
                        escalateTo: 'manager',
                        urgency: 'high'
                      }
                    }]);
                  }}
                  data-testid="button-add-escalate-action"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Escalonar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Actions Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ações Configuradas</h3>
          <div className="border rounded-lg p-4">
            {form.watch('actions')?.length > 0 ? (
              <div className="space-y-2">
                {form.watch('actions').map((action: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium capitalize">{action.type.replace('_', ' ')}</span>
                      <div className="text-sm text-gray-600">
                        {JSON.stringify(action.config, null, 2).substring(0, 100)}...
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const actions = form.getValues('actions');
                        actions.splice(index, 1);
                        form.setValue('actions', actions);
                      }}
                      data-testid={`button-remove-action-${index}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Code className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Nenhuma ação configurada</p>
                <p className="text-sm">Use os botões acima para adicionar ações</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting} data-testid="button-save-workflow">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Criando Workflow...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Criar Workflow
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}