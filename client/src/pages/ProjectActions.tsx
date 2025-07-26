import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Pause, 
  ExternalLink,
  Users,
  Settings,
  Flag,
  ArrowRight,
  Link2,
  Zap
} from 'lucide-react';

// Types for project actions
interface ProjectAction {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  description?: string;
  type: 'internal_meeting' | 'internal_approval' | 'internal_review' | 'internal_task' | 
        'external_delivery' | 'external_validation' | 'external_meeting' | 'external_feedback' |
        'milestone' | 'checkpoint';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate?: string;
  dueDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours: number;
  assignedToId?: string;
  responsibleIds: string[];
  clientContactId?: string;
  externalReference?: string;
  deliveryMethod?: string;
  dependsOnActionIds: string[];
  blockedByActionIds: string[];
  tags: string[];
  attachments: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Integration with Tickets System
  relatedTicketId?: string;
  canConvertToTicket?: string;
  ticketConversionRules?: {
    autoConvert?: boolean;
    triggerOnStatus?: string[];
    assignToSameUser?: boolean;
    inheritPriority?: boolean;
    copyAttachments?: boolean;
  };
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
}

const actionTypeLabels = {
  internal_meeting: 'Reunião Interna',
  internal_approval: 'Aprovação Interna',
  internal_review: 'Revisão Interna',
  internal_task: 'Tarefa Interna',
  external_delivery: 'Entrega Externa',
  external_validation: 'Validação Externa',
  external_meeting: 'Reunião com Cliente',
  external_feedback: 'Feedback Externo',
  milestone: 'Marco',
  checkpoint: 'Ponto de Controle'
};

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  blocked: 'Bloqueada'
};

const statusColors = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
  blocked: 'bg-red-500'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

const priorityColors = {
  low: 'border-gray-300 text-gray-600',
  medium: 'border-yellow-400 text-yellow-600',
  high: 'border-orange-400 text-orange-600',
  critical: 'border-red-500 text-red-600'
};

const CreateActionSchema = z.object({
  projectId: z.string().min(1, 'Projeto é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum([
    'internal_meeting', 'internal_approval', 'internal_review', 'internal_task',
    'external_delivery', 'external_validation', 'external_meeting', 'external_feedback',
    'milestone', 'checkpoint'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  scheduledDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  assignedToId: z.string().optional(),
  clientContactId: z.string().optional(),
  externalReference: z.string().optional(),
  deliveryMethod: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'blocked']).default('pending')
});

type CreateActionFormData = z.infer<typeof CreateActionSchema>;

export default function ProjectActions() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CreateActionFormData>({
    resolver: zodResolver(CreateActionSchema),
    defaultValues: {
      type: 'internal_task',
      priority: 'medium',
      status: 'pending'
    }
  });

  // Fetch projects
  const { data: projectsResponse } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 30000
  });
  
  // Extract projects array from API response
  const projects = Array.isArray(projectsResponse?.data) ? projectsResponse.data : 
                  Array.isArray(projectsResponse) ? projectsResponse : [];

  // Fetch all actions
  const { data: actions = [], isLoading } = useQuery<ProjectAction[]>({
    queryKey: ['/api/actions'],
    staleTime: 30000
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: CreateActionFormData) => {
      console.log('Creating action with data:', data);
      const { projectId, ...actionData } = data;
      const response = await apiRequest('POST', `/api/projects/${projectId}/actions`, actionData);
      const result = await response.json();
      console.log('Action created successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Ação criada com sucesso"
      });
    },
    onError: (error: any) => {
      console.error('Error creating action:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar ação",
        variant: "destructive"
      });
    }
  });

  // Update action status mutation
  const updateActionStatusMutation = useMutation({
    mutationFn: async ({ actionId, status }: { actionId: string; status: string }) => {
      return apiRequest('PUT', `/api/actions/${actionId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
    }
  });

  // Convert action to ticket mutation
  const convertToTicketMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest('POST', `/api/project-actions/${actionId}/convert-to-ticket`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Sucesso",
        description: `Ação convertida para ticket ${data.ticketId} com sucesso`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao converter ação para ticket",
        variant: "destructive"
      });
    }
  });

  // Get integration suggestions query
  const { data: integrationSuggestions } = useQuery({
    queryKey: ['/api/project-actions/integration-suggestions'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleCreateAction = (data: CreateActionFormData) => {
    createActionMutation.mutate(data);
  };

  const handleStatusUpdate = (actionId: string, status: string) => {
    updateActionStatusMutation.mutate({ actionId, status });
  };

  const handleConvertToTicket = (actionId: string) => {
    convertToTicketMutation.mutate(actionId);
  };

  // Filter actions
  const filteredActions = actions.filter(action => {
    const projectMatch = selectedProject === 'all' || action.projectId === selectedProject;
    
    if (selectedTab === 'all') return projectMatch;
    if (selectedTab === 'internal') return projectMatch && action.type.startsWith('internal');
    if (selectedTab === 'external') return projectMatch && action.type.startsWith('external');
    if (selectedTab === 'milestones') return projectMatch && (action.type === 'milestone' || action.type === 'checkpoint');
    if (selectedTab === 'dependencies') return projectMatch && action.dependsOnActionIds.length > 0;
    
    return projectMatch && action.status === selectedTab;
  });

  const getActionIcon = (type: string) => {
    if (type.startsWith('internal')) return <Users className="h-4 w-4" />;
    if (type.startsWith('external')) return <ExternalLink className="h-4 w-4" />;
    if (type === 'milestone' || type === 'checkpoint') return <Flag className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <Pause className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between ml-[20px] mr-[20px]">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ações de Projeto
          </h1>
          <p className="text-gray-600 mt-2">
            Gerenciamento de ações internas e externas dos projetos
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Integration Suggestions Button */}
          {integrationSuggestions && (
            <Button
              variant="outline"
              className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200"
            >
              <Zap className="h-4 w-4 mr-2 text-orange-600" />
              Sugestões ({integrationSuggestions.summary.autoConvertCandidates + integrationSuggestions.summary.blockedActions})
            </Button>
          )}
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Ação</DialogTitle>
              <DialogDescription>
                Adicione uma nova ação ao projeto selecionado
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateAction)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projeto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o projeto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Ação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(actionTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite o título da ação" />
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
                        <Textarea {...field} placeholder="Descreva os detalhes da ação" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(priorityLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horas Estimadas</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(Number(e.target.value))}
                            placeholder="0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Agendada</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Limite</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createActionMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    {createActionMutation.isPending ? 'Criando...' : 'Criar Ação'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      {/* Integration Statistics */}
      {integrationSuggestions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Conversão Automática</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {integrationSuggestions.summary.autoConvertCandidates}
                  </p>
                </div>
                <ArrowRight className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium">Ações Bloqueadas</p>
                  <p className="text-2xl font-bold text-red-900">
                    {integrationSuggestions.summary.blockedActions}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-medium">Ações Atrasadas</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {integrationSuggestions.summary.overdueActions}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">Tickets Ligados</p>
                  <p className="text-2xl font-bold text-green-900">
                    {actions.filter(a => a.relatedTicketId).length}
                  </p>
                </div>
                <Link2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Projeto</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white min-w-[200px]"
          >
            <option value="all">Todos os Projetos</option>
            {Array.isArray(projects) && projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Tabs for action categories */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="internal">Internas</TabsTrigger>
          <TabsTrigger value="external">Externas</TabsTrigger>
          <TabsTrigger value="milestones">Marcos</TabsTrigger>
          <TabsTrigger value="dependencies">Dependências</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="in_progress">Em Progresso</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Carregando ações...</p>
            </div>
          ) : filteredActions.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhuma ação encontrada
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedTab === 'all' 
                    ? 'Não há ações cadastradas ainda.'
                    : `Não há ações na categoria "${selectedTab}".`
                  }
                </p>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Ação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActions.map((action) => {
                const project = projects.find(p => p.id === action.projectId);
                
                return (
                  <Card key={action.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getActionIcon(action.type)}
                          <Badge variant="outline" className="text-xs">
                            {actionTypeLabels[action.type]}
                          </Badge>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${priorityColors[action.priority]} border-2`}
                        >
                          {priorityLabels[action.priority]}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-semibold leading-tight">
                        {action.title}
                      </CardTitle>
                      {project && (
                        <CardDescription className="text-xs">
                          Projeto: {project.name}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {action.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {action.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(action.status)}
                          <Badge variant="outline" className="text-xs">
                            <div className={`w-2 h-2 rounded-full ${statusColors[action.status]} mr-1`} />
                            {statusLabels[action.status]}
                          </Badge>
                        </div>
                        
                        {action.estimatedHours && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {action.actualHours}/{action.estimatedHours}h
                          </div>
                        )}
                      </div>

                      {action.dependsOnActionIds.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <Link2 className="h-3 w-3" />
                          <span>{action.dependsOnActionIds.length} dependência(s)</span>
                        </div>
                      )}

                      {action.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Prazo: {new Date(action.dueDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {action.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(action.id, 'in_progress');
                            }}
                          >
                            Iniciar
                          </Button>
                        )}
                        {action.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(action.id, 'completed');
                            }}
                          >
                            Concluir
                          </Button>
                        )}
                        
                        {/* Integration with Tickets */}
                        {!action.relatedTicketId && action.canConvertToTicket !== 'false' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToTicket(action.id);
                            }}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Ticket
                          </Button>
                        )}
                        
                        {action.relatedTicketId && (
                          <Badge variant="secondary" className="text-xs">
                            <Link2 className="w-3 h-3 mr-1" />
                            Ticket: #{action.relatedTicketId.slice(-6)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}