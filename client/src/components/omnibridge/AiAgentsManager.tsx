import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Bot,
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  MessageCircle,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Brain,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

// Types
interface AiAgent {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  supportedChannels: string[];
  availableActions: string[];
  personality: {
    tone: string;
    language: string;
    greeting: string;
    fallbackMessage: string;
  };
  escalationConfig: {
    escalateAfterSteps: number;
    escalateToUsers: string[];
    escalateKeywords: string[];
  };
  menuConfig: {
    enabled: boolean;
    maxOptions: number;
    timeoutMinutes: number;
    showNumbers: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  channelType: string;
  status: 'active' | 'waiting_input' | 'completed' | 'escalated';
  currentStep: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentMetrics {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  escalatedConversations: number;
  avgResolutionTime: number;
  successRate: number;
  actionsExecuted: number;
}

// Form schemas
const agentFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  supportedChannels: z.array(z.string()).min(1, 'Pelo menos um canal deve ser selecionado'),
  availableActions: z.array(z.string()).min(1, 'Pelo menos uma ação deve ser selecionada'),
  personality: z.object({
    tone: z.string(),
    language: z.string(),
    greeting: z.string().min(1, 'Mensagem de saudação é obrigatória'),
    fallbackMessage: z.string().min(1, 'Mensagem de fallback é obrigatória')
  }),
  escalationConfig: z.object({
    escalateAfterSteps: z.number().min(1).max(20),
    escalateToUsers: z.array(z.string()),
    escalateKeywords: z.array(z.string())
  }),
  menuConfig: z.object({
    enabled: z.boolean(),
    maxOptions: z.number().min(2).max(10),
    timeoutMinutes: z.number().min(1).max(60),
    showNumbers: z.boolean()
  })
});

type AgentFormData = z.infer<typeof agentFormSchema>;

const AiAgentsManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAgent, setSelectedAgent] = useState<AiAgent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Queries
  const { data: agents = [], isLoading: agentsLoading } = useQuery<AiAgent[]>({
    queryKey: ['/api/omnibridge/agents'],
    enabled: !!user?.tenantId
  });

  const { data: agentMetrics = {}, isLoading: metricsLoading } = useQuery<AgentMetrics>({
    queryKey: ['/api/omnibridge/agents/metrics'],
    enabled: !!user?.tenantId
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/omnibridge/conversations'],
    enabled: !!user?.tenantId
  });

  // Mutations
  const createAgentMutation = useMutation({
    mutationFn: (data: AgentFormData) => apiRequest('POST', '/api/omnibridge/agents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/agents'] });
      setShowCreateDialog(false);
      toast({
        title: "Agente criado com sucesso",
        description: "O novo agente IA foi configurado e está pronto para uso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar agente",
        description: error.message || "Não foi possível criar o agente IA.",
        variant: "destructive"
      });
    }
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentFormData> }) => 
      apiRequest('PUT', `/api/omnibridge/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/agents'] });
      toast({
        title: "Agente atualizado",
        description: "As configurações do agente foram salvas com sucesso."
      });
    }
  });

  const toggleAgentMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest('PUT', `/api/omnibridge/agents/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/agents'] });
    }
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/omnibridge/agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/agents'] });
      toast({
        title: "Agente removido",
        description: "O agente IA foi removido permanentemente."
      });
    }
  });

  // Form
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      supportedChannels: [],
      availableActions: [],
      personality: {
        tone: 'professional',
        language: 'pt-BR',
        greeting: 'Olá! Como posso ajudar você hoje?',
        fallbackMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?'
      },
      escalationConfig: {
        escalateAfterSteps: 5,
        escalateToUsers: [],
        escalateKeywords: ['falar com humano', 'atendente', 'reclamação']
      },
      menuConfig: {
        enabled: true,
        maxOptions: 5,
        timeoutMinutes: 10,
        showNumbers: true
      }
    }
  });

  const onSubmit = (data: AgentFormData) => {
    if (selectedAgent) {
      updateAgentMutation.mutate({ id: selectedAgent.id, data });
    } else {
      createAgentMutation.mutate(data);
    }
  };

  const handleEdit = (agent: AiAgent) => {
    setSelectedAgent(agent);
    form.reset({
      name: agent.name,
      description: agent.description || '',
      supportedChannels: agent.supportedChannels,
      availableActions: agent.availableActions,
      personality: agent.personality,
      escalationConfig: agent.escalationConfig,
      menuConfig: agent.menuConfig
    });
    setShowCreateDialog(true);
  };

  const handleCreate = () => {
    setSelectedAgent(null);
    form.reset();
    setShowCreateDialog(true);
  };

  const availableChannels = [
    { value: 'email', label: 'Email' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'slack', label: 'Slack' },
    { value: 'sms', label: 'SMS' }
  ];

  const availableActions = [
    { value: 'send_auto_reply', label: 'Resposta Automática' },
    { value: 'create_ticket', label: 'Criar Ticket' },
    { value: 'send_notification', label: 'Enviar Notificação' },
    { value: 'add_tags', label: 'Adicionar Tags' },
    { value: 'assign_agent', label: 'Atribuir Agente' },
    { value: 'mark_priority', label: 'Marcar Prioridade' }
  ];

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agentes Conversacionais IA</h2>
          <p className="text-muted-foreground">
            Configure agentes IA para automatizar respostas através de conversas naturais
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-agent">
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agentes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-agents">
              {agents.filter((a: AiAgent) => a.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {agents.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Conversas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-conversations">
              {conversations.filter((c: Conversation) => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-success-rate">
              94%
            </div>
            <p className="text-xs text-muted-foreground">
              últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ações Executadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-actions-executed">
              1,247
            </div>
            <p className="text-xs text-muted-foreground">
              este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>Agentes Configurados</CardTitle>
          <CardDescription>
            Gerencie seus agentes IA conversacionais e suas configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum agente configurado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro agente IA para começar a automatizar respostas
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Agente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent: AiAgent) => (
                <div key={agent.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agent.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={agent.isActive ? "default" : "secondary"}>
                            {agent.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline">
                            {agent.supportedChannels.length} canais
                          </Badge>
                          <Badge variant="outline">
                            {agent.availableActions.length} ações
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={agent.isActive}
                        onCheckedChange={(checked) => 
                          toggleAgentMutation.mutate({ id: agent.id, isActive: checked })
                        }
                        data-testid={`switch-agent-${agent.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setShowDetailsDialog(true);
                        }}
                        data-testid={`button-view-agent-${agent.id}`}
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(agent)}
                        data-testid={`button-edit-agent-${agent.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAgentMutation.mutate(agent.id)}
                        data-testid={`button-delete-agent-${agent.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgent ? 'Editar Agente IA' : 'Criar Novo Agente IA'}
            </DialogTitle>
            <DialogDescription>
              Configure as características e comportamentos do seu agente conversacional
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium">Informações Básicas</h4>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Agente</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Assistente de Suporte" data-testid="input-agent-name" />
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
                        <Textarea {...field} placeholder="Descreva a função e especialidade do agente" data-testid="textarea-agent-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Channels and Actions */}
              <div className="space-y-4">
                <h4 className="font-medium">Canais e Ações Suportados</h4>
                
                <FormField
                  control={form.control}
                  name="supportedChannels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canais de Comunicação</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {availableChannels.map((channel) => (
                          <div key={channel.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`channel-${channel.value}`}
                              checked={field.value?.includes(channel.value) || false}
                              onChange={(e) => {
                                const currentChannels = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentChannels, channel.value]);
                                } else {
                                  field.onChange(currentChannels.filter(c => c !== channel.value));
                                }
                              }}
                              data-testid={`checkbox-channel-${channel.value}`}
                            />
                            <label htmlFor={`channel-${channel.value}`} className="text-sm">
                              {channel.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ações Disponíveis</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {availableActions.map((action) => (
                          <div key={action.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`action-${action.value}`}
                              checked={field.value?.includes(action.value) || false}
                              onChange={(e) => {
                                const currentActions = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentActions, action.value]);
                                } else {
                                  field.onChange(currentActions.filter(a => a !== action.value));
                                }
                              }}
                              data-testid={`checkbox-action-${action.value}`}
                            />
                            <label htmlFor={`action-${action.value}`} className="text-sm">
                              {action.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Personality */}
              <div className="space-y-4">
                <h4 className="font-medium">Personalidade e Linguagem</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="personality.tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tom de Voz</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-agent-tone">
                              <SelectValue placeholder="Selecione o tom" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="professional">Profissional</SelectItem>
                            <SelectItem value="friendly">Amigável</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personality.language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-agent-language">
                              <SelectValue placeholder="Selecione o idioma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                            <SelectItem value="en-US">English (US)</SelectItem>
                            <SelectItem value="es-ES">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="personality.greeting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Saudação</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Mensagem inicial que o agente enviará" data-testid="textarea-agent-greeting" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personality.fallbackMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Fallback</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Mensagem quando o agente não entender" data-testid="textarea-agent-fallback" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Escalation Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Configuração de Escalação</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="escalationConfig.escalateAfterSteps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escalar após X tentativas</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            min={1}
                            max={20}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-escalate-steps"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="escalationConfig.escalateKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palavras-chave para Escalação</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                          placeholder="falar com humano, atendente, reclamação"
                          data-testid="textarea-escalate-keywords"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Menu Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Configuração de Menu</h4>
                
                <FormField
                  control={form.control}
                  name="menuConfig.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Habilitar Menu Estruturado
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Oferecer opções múltipla escolha além da conversa livre
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-menu-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="menuConfig.maxOptions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máx. Opções</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            min={2}
                            max={10}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-options"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="menuConfig.timeoutMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeout (min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            min={1}
                            max={60}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-timeout-minutes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="menuConfig.showNumbers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">
                            Numerar Opções
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-numbers"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAgentMutation.isPending || updateAgentMutation.isPending} data-testid="button-save-agent">
                  {createAgentMutation.isPending || updateAgentMutation.isPending ? 'Salvando...' : 'Salvar Agente'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Agent Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Agente</DialogTitle>
            <DialogDescription>
              Métricas e conversas do agente {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Conversas Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Taxa de Resolução</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">87%</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2">Conversas Recentes</h4>
                <div className="space-y-2">
                  {conversations
                    .filter((c: Conversation) => c.agentId === selectedAgent.id)
                    .slice(0, 5)
                    .map((conversation: Conversation) => (
                      <div key={conversation.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="text-sm font-medium">{conversation.userId}</span>
                          <Badge variant="outline" className="ml-2">
                            {conversation.channelType}
                          </Badge>
                        </div>
                        <Badge variant={
                          conversation.status === 'completed' ? 'default' :
                          conversation.status === 'escalated' ? 'destructive' :
                          conversation.status === 'active' ? 'default' : 'secondary'
                        }>
                          {conversation.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AiAgentsManager;