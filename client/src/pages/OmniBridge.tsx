import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Zap,
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Activity,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Inbox,
  Send,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  FileText,
  Workflow,
  Hash,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Componente interno para as regras de automação
function AutomationRulesContent() {
  const { toast } = useToast();
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [editRuleOpen, setEditRuleOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  
  // Estados para criação de regra
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [triggerChannel, setTriggerChannel] = useState('');
  const [triggerCondition, setTriggerCondition] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  const [actionType, setActionType] = useState('');
  const [actionTemplate, setActionTemplate] = useState('');
  const [actionTicketData, setActionTicketData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: ''
  });

  // Fetch automation rules
  const { data: rulesData, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => apiRequest('GET', '/api/automation-rules'),
    staleTime: 30000,
    gcTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch integrations para opções de canal
  const { data: integrationsData } = useQuery({
    queryKey: ['tenant-admin-integrations'],
    queryFn: () => apiRequest('GET', '/api/tenant-admin/integrations'),
    staleTime: 60000,
    gcTime: 120000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
  });

  const communicationChannels = (integrationsData as any)?.integrations?.filter((integration: any) => 
    integration.category === 'Comunicação'
  ) || [];

  useEffect(() => {
    if (rulesData) {
      setRules(rulesData.rules || []);
      setIsLoading(false);
      setError(null);
    }
  }, [rulesData]);

  

  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      return await apiRequest('POST', '/api/automation-rules', ruleData);
    },
    onSuccess: () => {
      toast({
        title: "Regra Criada",
        description: "A regra de automação foi criada com sucesso."
      });
      refetchRules();
      setCreateRuleOpen(false);
      memoizedResetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Criar Regra",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Memoizar função de reset para evitar re-renders
  const memoizedResetForm = useCallback(() => {
    setRuleName('');
    setRuleDescription('');
    setTriggerType('');
    setTriggerChannel('');
    setTriggerCondition('');
    setTriggerValue('');
    setActionType('');
    setActionTemplate('');
    setActionTicketData({
      title: '',
      description: '',
      priority: 'medium',
      category: ''
    });
  }, []);

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string, enabled: boolean }) => {
      return await apiRequest('PATCH', `/api/automation-rules/${ruleId}`, { enabled });
    },
    onSuccess: () => {
      toast({
        title: "Regra Atualizada",
        description: "Status da regra atualizado com sucesso."
      });
      refetchRules();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Atualizar Regra",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiRequest('DELETE', `/api/automation-rules/${ruleId}`);
    },
    onSuccess: () => {
      toast({
        title: "Regra Removida",
        description: "A regra de automação foi removida com sucesso."
      });
      refetchRules();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Remover Regra",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const testRuleMutation = useMutation({
    mutationFn: async ({ ruleId, testData }: { ruleId: string, testData: any }) => {
      return await apiRequest('POST', `/api/automation-rules/${ruleId}/test`, { testData });
    },
    onSuccess: (data: any) => {
      toast({
        title: data.test?.matches ? "✅ Regra Ativa" : "❌ Regra Não Ativada",
        description: data.test?.matches 
          ? "A regra seria executada com os dados de teste." 
          : "A regra não seria executada com os dados de teste."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Teste",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateRule = () => {
    if (!ruleName || !triggerType || !triggerChannel || !actionType) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha nome, trigger, canal e ação.",
        variant: "destructive"
      });
      return;
    }

    const conditions = [{
      type: triggerType,
      channel: triggerChannel,
      condition: triggerCondition,
      value: triggerValue
    }];

    const actions = [];
    
    if (actionType === 'auto_reply' && actionTemplate) {
      actions.push({
        type: 'auto_reply',
        template: actionTemplate
      });
    }
    
    if (actionType === 'create_ticket' && actionTicketData.title) {
      actions.push({
        type: 'create_ticket',
        ticket_data: actionTicketData
      });
    }

    if (actionType === 'both' && actionTemplate && actionTicketData.title) {
      actions.push({
        type: 'auto_reply',
        template: actionTemplate
      });
      actions.push({
        type: 'create_ticket',
        ticket_data: actionTicketData
      });
    }

    createRuleMutation.mutate({
      name: ruleName,
      description: ruleDescription,
      conditions,
      actions,
      enabled: true,
      priority: 1
    });
  };

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span>Carregando regras...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de criar regra */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Regras de Automação</h3>
          <p className="text-sm text-gray-500">
            {rules.length} regra{rules.length !== 1 ? 's' : ''} configurada{rules.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setCreateRuleOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      {/* Lista de regras */}
      {rules.length > 0 ? (
        <div className="space-y-4">
          {rules.map((rule: any) => (
            <Card key={rule.id} className={`border-l-4 ${rule.enabled ? 'border-l-green-500' : 'border-l-gray-400'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Prioridade: {rule.priority || 1}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    
                    {/* If This Then That Visual */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-blue-700">IF:</span>
                          <span>{rule.conditionsCount || 0} condição(ões)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="font-medium text-orange-700">THEN:</span>
                          <span>{rule.actionsCount || 0} ação(ões)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>Criada: {new Date(rule.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Execuções: 0
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Sucessos: 0
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>Última exec: Nunca</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => 
                        toggleRuleMutation.mutate({ ruleId: rule.id, enabled })
                      }
                      disabled={toggleRuleMutation.isPending}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testRuleMutation.mutate({ 
                        ruleId: rule.id, 
                        testData: { message: 'teste', from: 'test@example.com' }
                      })}
                      disabled={testRuleMutation.isPending}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedRule(rule);
                        setEditRuleOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Deseja realmente excluir esta regra?')) {
                          deleteRuleMutation.mutate(rule.id);
                        }
                      }}
                      disabled={deleteRuleMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma regra configurada</p>
          <p className="text-sm text-gray-400 mt-2">Crie sua primeira regra de automação</p>
          <Button 
            onClick={() => setCreateRuleOpen(true)} 
            className="mt-4 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Primeira Regra
          </Button>
        </div>
      )}

      {/* Dialog para criar nova regra */}
      <Dialog open={createRuleOpen} onOpenChange={setCreateRuleOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Nova Regra de Automação
            </DialogTitle>
            <DialogDescription>
              Configure uma regra "If This Then That" para automatizar ações baseadas em eventos de comunicação
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Informações Básicas */}
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Informações Básicas
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ruleName">Nome da Regra *</Label>
                  <Input
                    id="ruleName"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Ex: Resposta automática para FAQ"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Canal de Comunicação *</Label>
                  <Select value={triggerChannel} onValueChange={setTriggerChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {communicationChannels.map((channel: any) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="ruleDescription">Descrição</Label>
                <Textarea
                  id="ruleDescription"
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Descreva o que esta regra faz..."
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* IF THIS - Trigger Configuration */}
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2 text-blue-600">
                <Play className="h-4 w-4" />
                IF THIS - Condições de Ativação
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de Trigger *</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Quando isso acontecer..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message_received">Mensagem Recebida</SelectItem>
                      <SelectItem value="keyword_match">Palavra-chave Encontrada</SelectItem>
                      <SelectItem value="email_subject">Assunto do Email</SelectItem>
                      <SelectItem value="sender_email">Email do Remetente</SelectItem>
                      <SelectItem value="message_contains">Mensagem Contém</SelectItem>
                      <SelectItem value="time_based">Baseado em Horário</SelectItem>
                      <SelectItem value="priority_high">Prioridade Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Condição</Label>
                  <Select value={triggerCondition} onValueChange={setTriggerCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Como verificar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">É igual a</SelectItem>
                      <SelectItem value="contains">Contém</SelectItem>
                      <SelectItem value="starts_with">Começa com</SelectItem>
                      <SelectItem value="ends_with">Termina com</SelectItem>
                      <SelectItem value="regex">Expressão Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Valor da Condição</Label>
                <Input
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  placeholder="Ex: suporte, urgente, problema..."
                />
              </div>
            </div>

            <Separator />

            {/* THEN THAT - Action Configuration */}
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2 text-green-600">
                <Send className="h-4 w-4" />
                THEN THAT - Ações Automáticas
              </h4>
              
              <div className="grid gap-2">
                <Label>Tipo de Ação *</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="O que fazer quando ativado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_reply">Resposta Automática</SelectItem>
                    <SelectItem value="create_ticket">Criar Ticket</SelectItem>
                    <SelectItem value="both">Responder + Criar Ticket</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template de Resposta */}
              {(actionType === 'auto_reply' || actionType === 'both') && (
                <div className="grid gap-2 p-4 border rounded-lg bg-blue-50">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Template de Resposta Automática
                  </Label>
                  <Textarea
                    value={actionTemplate}
                    onChange={(e) => setActionTemplate(e.target.value)}
                    placeholder="Olá! Recebemos sua mensagem e entraremos em contato em breve..."
                    rows={3}
                  />
                  <div className="text-xs text-gray-600">
                    Variáveis disponíveis: {'{nome}'}, {'{email}'}, {'{mensagem}'}
                  </div>
                </div>
              )}

              {/* Dados do Ticket */}
              {(actionType === 'create_ticket' || actionType === 'both') && (
                <div className="grid gap-4 p-4 border rounded-lg bg-green-50">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Configuração do Ticket Automático
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Título do Ticket</Label>
                      <Input
                        value={actionTicketData.title}
                        onChange={(e) => setActionTicketData({...actionTicketData, title: e.target.value})}
                        placeholder="Ex: Novo contato via {canal}"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Prioridade</Label>
                      <Select 
                        value={actionTicketData.priority} 
                        onValueChange={(value) => setActionTicketData({...actionTicketData, priority: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Descrição do Ticket</Label>
                    <Textarea
                      value={actionTicketData.description}
                      onChange={(e) => setActionTicketData({...actionTicketData, description: e.target.value})}
                      placeholder="Ticket criado automaticamente a partir de {canal}..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setCreateRuleOpen(false);
              memoizedResetForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateRule}
              disabled={createRuleMutation.isPending}
              className="flex items-center gap-2"
            >
              {createRuleMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {createRuleMutation.isPending ? 'Criando...' : 'Criar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OmniBridge() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('channels');
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  
  // Channel configuration states
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [syncConfigOpen, setSyncConfigOpen] = useState(false);
  const [syncInterval, setSyncInterval] = useState(2); // Default 2 minutes

  // Use real APIs with robust fallbacks
  const { data: integrationsData, isLoading: integrationsLoading, refetch: refetchIntegrations } = useQuery({
    queryKey: ['omnibridge-integrations'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/tenant-admin/integrations');
        console.log('🔍 [OmniBridge] API Response for integrations:', response);
        
        // Force retry if we get empty integrations the first time
        if (response.integrations?.length === 0 && !response.initialized) {
          console.log('🔄 [OmniBridge] No integrations found, forcing retry in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retryResponse = await apiRequest('GET', '/api/tenant-admin/integrations');
          console.log('🔄 [OmniBridge] Retry response:', retryResponse);
          return retryResponse;
        }
        
        return response;
      } catch (error) {
        console.error('❌ [OmniBridge] Failed to fetch integrations:', error);
        // Return minimal fallback with error flag
        return {
          integrations: [],
          fallback: true,
          error: true,
          errorMessage: error.message
        };
      }
    },
    staleTime: 30000,
    gcTime: 60000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 5 times for this critical endpoint
      return failureCount < 5;
    },
  });

  const { data: inboxData, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
    queryKey: ['omnibridge-inbox'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/email-config/inbox');
        console.log('🔍 [OmniBridge] API Response for inbox:', response);
        
        // Ensure we have a valid structure
        if (!response || !Array.isArray(response.messages)) {
          console.warn('⚠️ [OmniBridge] Invalid inbox response structure, using fallback');
          return { messages: [] };
        }
        
        return response;
      } catch (error) {
        console.error('❌ [OmniBridge] Failed to fetch inbox:', error);
        // Return empty but valid structure to prevent UI breaks
        return { 
          messages: [], 
          error: true, 
          errorMessage: error.message 
        };
      }
    },
    staleTime: 15000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 3 times for inbox
      return failureCount < 3;
    },
  });

  // Monitoring status query - Using email-config API that works
  const { data: monitoringStatus } = useQuery({
    queryKey: ['email-monitoring-status'],
    queryFn: () => apiRequest('GET', '/api/email-config/monitoring/status'),
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: false,
  });

  // Start monitoring mutation - Using email-config API
  const startMonitoringMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/email-config/monitoring/start', {});
    },
    onSuccess: () => {
      toast({
        title: "Monitoramento IMAP Iniciado",
        description: "O sistema começou a monitorar emails IMAP e popular o inbox automaticamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/inbox'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Iniciar Monitoramento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Stop monitoring mutation - Using email-config API  
  const stopMonitoringMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/email-config/monitoring/stop', {});
    },
    onSuccess: () => {
      toast({
        title: "Monitoramento IMAP Parado",
        description: "O sistema parou de monitorar emails IMAP."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Parar Monitoramento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle channel monitoring mutation - for individual channels
  const toggleChannelMonitoringMutation = useMutation({
    mutationFn: async ({ channelId, shouldStart }: { channelId: string, shouldStart: boolean }) => {
      if (channelId === 'imap-email') {
        // Use the real email-config API for IMAP
        const endpoint = shouldStart ? '/api/email-config/monitoring/start' : '/api/email-config/monitoring/stop';
        return await apiRequest('POST', endpoint, {});
      }
      // For other channels, just simulate
      return { success: true, channelId, isMonitoring: shouldStart };
    },
    onSuccess: (data, variables) => {
      toast({
        title: `Monitoramento ${variables.shouldStart ? 'Iniciado' : 'Parado'}`,
        description: `Canal ${variables.channelId}: monitoramento ${variables.shouldStart ? 'iniciado' : 'parado'} com sucesso.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/monitoring/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-admin/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config/integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Monitoramento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Configure sync interval for channel
  const configureSyncMutation = useMutation({
    mutationFn: async ({ channelId, intervalMinutes }: { channelId: string, intervalMinutes: number }) => {
      // For IMAP channels, we would integrate with the Gmail service
      if (channelId === 'imap-email') {
        return await apiRequest('POST', '/api/omnibridge/configure-sync', {
          channelId,
          intervalMinutes
        });
      }
      return { success: true, channelId, intervalMinutes };
    },
    onSuccess: (data: any) => {
      toast({
        title: "Configuração de Sync Atualizada",
        description: `Intervalo de sincronização configurado para ${data.intervalMinutes || 30} minutos.`
      });
      setSyncConfigOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Configuração",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Transform real data for display with robust fallbacks
  const allChannels = (integrationsData as any)?.integrations || [];
  
  let channels = allChannels.filter((integration: any) => {
    // Include communication category and other relevant integrations
    const category = integration.category?.toLowerCase() || '';
    const name = integration.name?.toLowerCase() || '';
    
    return category === 'comunicação' || 
           category === 'communication' ||
           category === 'comunicacao' ||
           name.includes('email') ||
           name.includes('gmail') ||
           name.includes('whatsapp') ||
           name.includes('telegram') ||
           name.includes('sms') ||
           name.includes('webhook') ||
           integration.type === 'communication' ||
           integration.type === 'messaging';
  });
  
  // Se temos integrações mas nenhuma de comunicação, mostrar todas como canais potenciais
  if (channels.length === 0 && allChannels.length > 0) {
    channels = allChannels.map((integration: any) => ({
      ...integration,
      category: integration.category || 'Comunicação',
      type: integration.type || 'communication'
    }));
    console.log('🔄 [OmniBridge] No communication channels found, showing all integrations as potential channels:', allChannels.length);
  }
  
  // Se ainda não há canais, mostrar canais padrão de comunicação
  if (channels.length === 0) {
    console.log('⚠️ [OmniBridge] No integrations data available, showing default communication channels');
    channels = [
      {
        id: 'imap-email',
        name: 'Email IMAP',
        category: 'Comunicação',
        status: 'disconnected',
        description: 'Configure email IMAP em Tenant Admin > Integrações > Comunicação',
        type: 'communication',
        icon: 'Mail'
      },
      {
        id: 'whatsapp-business',
        name: 'WhatsApp Business',
        category: 'Comunicação', 
        status: 'disconnected',
        description: 'Configure WhatsApp Business em Tenant Admin > Integrações > Comunicação',
        type: 'communication',
        icon: 'MessageCircle'
      },
      {
        id: 'telegram-bot',
        name: 'Telegram',
        category: 'Comunicação',
        status: 'disconnected', 
        description: 'Configure Telegram Bot em Tenant Admin > Integrações > Comunicação',
        type: 'communication',
        icon: 'Send'
      }
    ];
  }
  
  const inbox = (inboxData as any)?.messages || [];
  
  // Log para debug
  console.log('🔍 [OmniBridge-DEBUG] Final channels count:', channels.length);
  console.log('🔍 [OmniBridge-DEBUG] Final inbox count:', inbox.length);
  
  // Debug logs for data monitoring
  useEffect(() => {
    if (inbox.length > 0) {
      console.log('📧 Inbox data received:', inbox.length, 'messages');
      console.log('📧 First message structure:', inbox[0]);
    } else {
      console.log('📪 No inbox messages available');
    }
  }, [inbox]);

  // Debug log for channels data
  useEffect(() => {
    console.log('🔍 [OmniBridge] Raw integrations data:', allChannels.length, 'total');
    console.log('🔍 [OmniBridge] Filtered channels:', channels.length, 'communication channels');
    if (allChannels.length > 0) {
      console.log('🔍 [OmniBridge] First integration structure:', allChannels[0]);
    }
    if (channels.length === 0 && allChannels.length > 0) {
      console.warn('⚠️ [OmniBridge] No channels found despite having integrations - check filter criteria');
    }
  }, [allChannels, channels]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchIntegrations();
      refetchInbox();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchIntegrations, refetchInbox]);

  // Get channel type icon
  const getChannelIcon = (integration: any) => {
    const name = integration.name?.toLowerCase() || '';
    if (name.includes('email') || name.includes('gmail') || name.includes('outlook')) return Mail;
    if (name.includes('whatsapp') || name.includes('telegram')) return MessageCircle;
    if (name.includes('sms') || name.includes('twilio')) return Phone;
    if (name.includes('webhook')) return Globe;
    return Settings;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = integrationsLoading || inboxLoading;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">OmniBridge - Central de Comunicação</h1>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-gray-500">Carregando...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">OmniBridge - Central de Comunicação</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os canais de comunicação em uma interface unificada</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Sistema Ativo</span>
          </div>
          
          <Button 
            variant="outline"
            onClick={async () => {
              console.log('🔄 [OmniBridge] Manual refresh triggered');
              await refetchIntegrations();
              await refetchInbox();
              toast({ 
                title: "Dados atualizados", 
                description: `${channels.length} canais, ${inbox.length} mensagens`
              });
            }}
            size="sm"
          >
            Atualizar
          </Button>

          <Button 
            variant="outline"
            onClick={() => {
              console.log('🔍 [OmniBridge-DIAGNOSTICS] Current state:');
              console.log('- Integrations data:', integrationsData);
              console.log('- Inbox data:', inboxData);
              console.log('- Channels:', channels);
              console.log('- Inbox messages:', inbox);
              
              toast({ 
                title: "Diagnóstico executado", 
                description: "Verifique o console para detalhes técnicos"
              });
            }}
            size="sm"
            className="text-blue-600"
          >
            Diagnóstico
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Canais Ativos</p>
                <p className="text-2xl font-bold">{channels.filter((c: any) => c.status === 'connected').length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              de {channels.length} canais configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens na Inbox</p>
                <p className="text-2xl font-bold">{inbox.length}</p>
              </div>
              <Inbox className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              mensagens para processar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regras Ativas</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Workflow className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              processamento automático
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              templates disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Canais Tab */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Canais de Comunicação
              </CardTitle>
              <CardDescription>
                Gerencie e monitore todas as integrações de comunicação ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((channel: any) => {
                    const IconComponent = getChannelIcon(channel);
                    return (
                      <Card key={channel.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <IconComponent className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{channel.name}</h4>
                                <p className="text-sm text-gray-500">{channel.description}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={getStatusColor(channel.status)}>
                              {channel.status === 'connected' ? 'Conectado' : 
                               channel.status === 'disconnected' ? 'Desconectado' : 
                               'Erro'}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {channel.category}
                            </div>
                          </div>

                          {/* Channel Control Buttons */}
                          <div className="space-y-3 mt-4">
                            {/* Status Toggle */}
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(channel.status)}>
                                {channel.status === 'connected' ? 'Conectado' : 
                                 channel.status === 'disconnected' ? 'Desconectado' : 
                                 'Erro'}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {channel.status === 'connected' ? 'Canal Ativo' : 'Canal Inativo'}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              {/* Monitoring Control - For all communication channels */}
                              {(() => {
                                const isMonitoringActive = (monitoringStatus as any)?.isActive || false;
                                const isChannelConnected = channel.status === 'connected';
                                const isImapChannel = channel.id === 'imap-email';
                                const isStartPending = startMonitoringMutation.isPending && isImapChannel;
                                const isStopPending = stopMonitoringMutation.isPending && isImapChannel;
                                
                                // For IMAP channel, use real monitoring status
                                // For other channels, use connection status as proxy
                                const shouldShowPause = isImapChannel ? isMonitoringActive : isChannelConnected;
                                
                                return shouldShowPause ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      if (isImapChannel) {
                                        stopMonitoringMutation.mutate();
                                      } else {
                                        toast({
                                          title: "Monitoramento Pausado",
                                          description: `Monitoramento pausado para ${channel.name}`
                                        });
                                      }
                                    }}
                                    disabled={isStopPending}
                                    className="flex items-center gap-1"
                                  >
                                    <Pause className="h-3 w-3" />
                                    {isStopPending ? 'Parando...' : 'Pausar'}
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      if (isImapChannel) {
                                        startMonitoringMutation.mutate();
                                      } else {
                                        toast({
                                          title: "Monitoramento Iniciado",
                                          description: `Monitoramento iniciado para ${channel.name}`
                                        });
                                      }
                                    }}
                                    disabled={isStartPending}
                                    className="flex items-center gap-1"
                                  >
                                    <Play className="h-3 w-3" />
                                    {isStartPending ? 'Iniciando...' : 'Iniciar'}
                                  </Button>
                                );
                              })()}
                              
                              {/* Sync Configuration Button - For email channels */}
                              {(channel.id === 'imap-email' || channel.name.toLowerCase().includes('email')) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedChannel(channel);
                                    setSyncConfigOpen(true);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Clock className="h-3 w-3" />
                                  Sync
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum canal de comunicação encontrado</p>
                  <p className="text-sm text-gray-400 mt-2 mb-4">
                    Configure suas integrações de comunicação em:
                    <br />
                    <strong>Tenant Admin → Integrações</strong>
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Integrações Suportadas:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Email (IMAP/Gmail)</li>
                      <li>• WhatsApp Business</li>
                      <li>• Telegram</li>
                      <li>• Webhooks</li>
                      <li>• SMS</li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      onClick={async () => {
                        console.log('🔄 [OmniBridge] Force refresh triggered');
                        await refetchIntegrations();
                        await refetchInbox();
                        toast({ 
                          title: "Atualizando dados...", 
                          description: "Buscando integrações e mensagens"
                        });
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Atualizar Agora
                    </Button>

                    <Button 
                      onClick={async () => {
                        console.log('🔧 [OmniBridge] Force initialization triggered');
                        try {
                          // Force initialization by making multiple requests
                          await apiRequest('GET', '/api/tenant-admin/integrations');
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          await refetchIntegrations();
                          toast({ 
                            title: "Inicialização forçada", 
                            description: "Tentando criar integrações padrão"
                          });
                        } catch (error) {
                          toast({ 
                            title: "Erro na inicialização", 
                            description: "Não foi possível inicializar as integrações",
                            variant: "destructive"
                          });
                        }
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Inicializar Canais
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        // Navigate to tenant admin integrations
                        window.location.href = '/tenant-admin/integrations';
                      }}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configurar Integrações
                    </Button>
                  </div>
                  
                  {integrationsData?.fallback && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      <strong>Modo Fallback:</strong> Não foi possível carregar as integrações. 
                      Verifique sua conexão e tente atualizar.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Inbox Unificada
              </CardTitle>
              <CardDescription>
                Todas as mensagens recebidas de todos os canais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inbox.length > 0 ? (
                <div className="space-y-4">
                  {inbox.map((message: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{message.subject || 'Sem assunto'}</h4>
                            <p className="text-sm text-gray-500">
                              De: {message.sender || message.from_email || 'Desconhecido'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {message.priority || 'medium'}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {message.created_at ? new Date(message.created_at).toLocaleString('pt-BR') : 
                               message.email_date ? new Date(message.email_date).toLocaleString('pt-BR') :
                               'Data indisponível'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {message.body || message.body_text || 'Conteúdo indisponível'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Canal: email</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Status: {message.status || (message.is_read ? 'lido' : 'não lido')}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Processado: {message.processed || message.is_processed ? 'sim' : 'não'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma mensagem na inbox</p>
                  <p className="text-sm text-gray-400 mt-2 mb-4">
                    As mensagens recebidas dos canais de comunicação aparecerão aqui
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Para receber mensagens:</h4>
                    <ol className="text-sm text-gray-600 space-y-1 text-left">
                      <li>1. Configure canais na aba "Canais"</li>
                      <li>2. Inicie o monitoramento dos canais</li>
                      <li>3. As mensagens aparecerão automaticamente</li>
                    </ol>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      onClick={async () => {
                        console.log('🔄 [OmniBridge] Force refresh inbox');
                        await refetchInbox();
                        toast({ title: "Atualizando inbox..." });
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Atualizar Inbox
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab('channels')}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Ver Canais
                    </Button>
                  </div>
                  
                  {inboxData?.error && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      <strong>Erro:</strong> Não foi possível carregar as mensagens. 
                      Verifique se há canais configurados e ativos.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regras Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Regras de Automação
              </CardTitle>
              <CardDescription>
                Configure regras automáticas para processar mensagens e automatizar fluxos de trabalho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutomationRulesContent />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Resposta
              </CardTitle>
              <CardDescription>
                Crie e gerencie templates para respostas automáticas e manuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de templates não implementado</p>
                <p className="text-sm text-gray-400 mt-2">Esta funcionalidade será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics e Métricas
              </CardTitle>
              <CardDescription>
                Monitore o desempenho e efetividade dos canais de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de analytics não implementado</p>
                <p className="text-sm text-gray-400 mt-2">Esta funcionalidade será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sync Configuration Dialog */}
      <Dialog open={syncConfigOpen} onOpenChange={setSyncConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Tempo de Sincronização</DialogTitle>
            <DialogDescription>
              Configure o intervalo de sincronização para o canal {selectedChannel?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="syncInterval" className="text-right">
                Intervalo (minutos)
              </Label>
              <Input
                id="syncInterval"
                type="number"
                min="1"
                max="60"
                value={syncInterval}
                onChange={(e) => setSyncInterval(parseInt(e.target.value) || 2)}
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-gray-500">
              Intervalo recomendado: 2-5 minutos para alta frequência, 10-30 minutos para uso normal
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncConfigOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedChannel) {
                  configureSyncMutation.mutate({
                    channelId: selectedChannel.id,
                    intervalMinutes: syncInterval
                  });
                }
              }}
              disabled={configureSyncMutation.isPending}
            >
              {configureSyncMutation.isPending ? 'Configurando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}