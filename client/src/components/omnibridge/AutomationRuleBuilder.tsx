import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import QueryBuilderComponent from '@/components/QueryBuilder';
import {
  MessageSquare,
  Mail,
  Phone,
  Zap,
  Bot,
  Bell,
  Users,
  Calendar,
  FileText,
  Tag,
  Archive,
  Reply,
  Forward,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Play,
  Pause,
  Save,
  Eye,
  Copy,
  Trash2,
  Settings,
  Target,
  Brain,
  Workflow,
  CheckCircle,
  AlertCircle,
  Clock,
  Hash,
  Filter,
  Send,
  Lightbulb,
  MousePointer2,
  Sparkles,
  Cog,
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  AlertTriangle,
  CreditCard,
  Link,
  BarChart3
} from 'lucide-react';

// Campos específicos para automações do OmniBridge
const omnibridgeFields = [
  { value: 'channelType', label: 'Tipo de Canal' },
  { value: 'from', label: 'Remetente' },
  { value: 'to', label: 'Destinatário' },
  { value: 'subject', label: 'Assunto' },
  { value: 'content', label: 'Conteúdo da Mensagem' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'tags', label: 'Tags' },
  { value: 'receivedAt', label: 'Data/Hora de Recebimento' },
  { value: 'sentAt', label: 'Data/Hora de Envio' },
  { value: 'messageType', label: 'Tipo de Mensagem' },
  { value: 'attachments', label: 'Possui Anexos' },
  { value: 'isRead', label: 'Mensagem Lida' },
  { value: 'senderType', label: 'Tipo de Remetente' },
  { value: 'customerGroup', label: 'Grupo do Cliente' },
  { value: 'messageLength', label: 'Tamanho da Mensagem' },
  { value: 'businessHours', label: 'Horário Comercial' },
  { value: 'responseTime', label: 'Tempo de Resposta' },
  { value: 'sentiment', label: 'Sentimento (IA)' },
  { value: 'intent', label: 'Intenção (IA)' },
  { value: 'urgency', label: 'Urgência (IA)' },
  { value: 'language', label: 'Idioma Detectado' },
  { value: 'metadata', label: 'Metadados' }
];

// Operadores específicos para OmniBridge
const omnibridgeOperators = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'starts_with', label: 'Inicia com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'regex', label: 'Expressão Regular' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'greater_than_or_equal', label: 'Maior ou igual' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'less_than_or_equal', label: 'Menor ou igual' },
  { value: 'between', label: 'Entre' },
  { value: 'in', label: 'Está em' },
  { value: 'not_in', label: 'Não está em' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' },
  { value: 'ai_matches', label: 'IA corresponde' }
];

interface Action {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  config: Record<string, any>;
}

interface AutomationRule {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: any; // Query Builder structure
  actions: Action[];
  priority: number;
  aiEnabled: boolean;
}

interface AutomationRuleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: any;
  existingRule?: any;
  onSave?: (rule: AutomationRule) => void;
}

// Templates de ações (mantemos os mesmos do código original)
const actionTemplates: Omit<Action, 'id' | 'config'>[] = [
  {
    type: 'auto_reply',
    name: 'Resposta automática',
    description: 'Envia resposta pré-definida',
    icon: Reply,
    color: 'bg-blue-500'
  },
  {
    type: 'send_notification',
    name: 'Enviar notificação',
    description: 'Notifica equipe responsável',
    icon: Bell,
    color: 'bg-yellow-500'
  },
  {
    type: 'create_ticket',
    name: 'Criar ticket',
    description: 'Cria ticket automaticamente',
    icon: FileText,
    color: 'bg-green-500'
  },
  {
    type: 'forward_message',
    name: 'Encaminhar mensagem',
    description: 'Encaminha para outro agente',
    icon: Forward,
    color: 'bg-purple-500'
  },
  {
    type: 'add_tags',
    name: 'Adicionar tags',
    description: 'Categoriza com tags',
    icon: Tag,
    color: 'bg-indigo-500'
  },
  {
    type: 'assign_agent',
    name: 'Atribuir agente',
    description: 'Designa agente específico',
    icon: Users,
    color: 'bg-teal-500'
  },
  {
    type: 'mark_priority',
    name: 'Marcar prioridade',
    description: 'Define nível de prioridade',
    icon: Star,
    color: 'bg-red-500'
  },
  {
    type: 'ai_response',
    name: 'Resposta com IA',
    description: 'Gera resposta usando IA',
    icon: Brain,
    color: 'bg-pink-500'
  },
  {
    type: 'escalate',
    name: 'Escalar',
    description: 'Escala para supervisor',
    icon: ArrowRight,
    color: 'bg-orange-500'
  },
  {
    type: 'archive',
    name: 'Arquivar',
    description: 'Move para arquivo',
    icon: Archive,
    color: 'bg-gray-500'
  }
];

export default function AutomationRuleBuilder({
  isOpen,
  onClose,
  initialMessage,
  existingRule,
  onSave
}: AutomationRuleBuilderProps) {
  const [rule, setRule] = useState<AutomationRule>({
    name: '',
    description: '',
    enabled: true,
    conditions: { rules: [], logicalOperator: 'AND' },
    actions: [],
    priority: 1,
    aiEnabled: false
  });

  const [activeTab, setActiveTab] = useState('conditions');
  const [showActionConfig, setShowActionConfig] = useState(false);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});
  const [editingActionIndex, setEditingActionIndex] = useState<number>(-1);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ 1QA.MD: Carregar dados da regra existente quando disponível
  useEffect(() => {
    if (existingRule) {
      
      // Mapear dados da regra existente para o formato do formulário
      const mappedRule: AutomationRule = {
        name: existingRule.name || '',
        description: existingRule.description || '',
        enabled: existingRule.enabled ?? true,
        conditions: existingRule.conditions || { rules: [], logicalOperator: 'AND' },
        actions: (existingRule.actions || []).map((action, index) => {
          // Encontrar template correspondente para hidratar campos UI
          const template = actionTemplates.find(t => t.type === action.type);
          
          // Gerar ID determinístico se não existir
          const stableId = action.id || `${existingRule.id}_${action.type}_${index}`;
          
          return {
            ...template, // Hidrata icon, color, name, description do template
            ...action,   // Sobrescreve com dados persistidos (id, type, config)
            id: stableId
          };
        }),
        priority: existingRule.priority || 1,
        aiEnabled: existingRule.aiEnabled || false
      };

      setRule(mappedRule);
    } else {
      // Reset para regra nova
      setRule({
        name: '',
        description: '',
        enabled: true,
        conditions: { rules: [], logicalOperator: 'AND' },
        actions: [],
        priority: 1,
        aiEnabled: false
      });
    }
  }, [existingRule]);

  // Mutation para salvar regra
  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: AutomationRule) => {
      const endpoint = existingRule?.id
        ? `/api/omnibridge/automation-rules/${existingRule.id}`
        : '/api/omnibridge/automation-rules';

      const method = existingRule?.id ? 'PUT' : 'POST';

      return apiRequest(method, endpoint, ruleData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: `Regra ${existingRule?.id ? 'atualizada' : 'criada'} com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      onSave?.(rule);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar regra",
        variant: "destructive",
      });
    }
  });

  // Adicionar ação
  const addAction = (template: typeof actionTemplates[0]) => {
    const newAction: Action = {
      id: `new_${template.type}_${rule.actions.length}_${Date.now()}`,
      ...template,
      config: {}
    };

    setCurrentAction(newAction);
    setActionConfig({});
    setEditingActionIndex(-1);
    setShowActionConfig(true);
  };

  // Confirmar configuração da ação
  const confirmActionConfig = () => {
    if (currentAction) {
      let actionIndex = rule.actions.findIndex(a => a.id === currentAction.id);
      
      // Fallback para editingActionIndex se ID lookup falhar
      if (actionIndex === -1 && editingActionIndex >= 0 && editingActionIndex < rule.actions.length) {
        actionIndex = editingActionIndex;
      }
      
      if (actionIndex >= 0) {
        // Editar ação existente
        setRule(prev => {
          const newActions = [...prev.actions];
          newActions[actionIndex] = {
            ...newActions[actionIndex],
            config: actionConfig
          };
          return { ...prev, actions: newActions };
        });
      } else {
        // Adicionar nova ação
        const updatedAction = {
          ...currentAction,
          config: actionConfig
        };

        setRule(prev => ({
          ...prev,
          actions: [...prev.actions, updatedAction]
        }));
      }

      setShowActionConfig(false);
      setCurrentAction(null);
      setActionConfig({});
      setEditingActionIndex(-1);
    }
  };

  // Remover ação
  const removeAction = (actionId: string) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== actionId)
    }));
  };

  // Salvar regra
  const handleSave = () => {
    if (!rule.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da regra é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (rule.conditions.rules.length === 0) {
      toast({
        title: "Erro",
        description: "Pelo menos uma condição deve ser configurada",
        variant: "destructive",
      });
      return;
    }

    if (rule.actions.length === 0) {
      toast({
        title: "Erro",
        description: "Pelo menos uma ação deve ser configurada",
        variant: "destructive",
      });
      return;
    }

    // Sanitizar payload removendo campos UI-only
    const sanitizedRule = {
      ...rule,
      actions: rule.actions.map(action => ({
        id: action.id,
        type: action.type,
        name: action.name,
        description: action.description,
        config: action.config
        // Removemos icon, color e outros campos UI-only
      }))
    };

    saveRuleMutation.mutate(sanitizedRule);
  };

  // Helper para atualizar configuração da ação
  const updateActionConfig = (key: string, value: any) => {
    setActionConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Renderizar configuração da ação
  const renderActionConfig = (action: Action, actionIndex: number) => {
    switch (action.type) {
      case 'auto_reply':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`action-message-${actionIndex}`}>Mensagem de Resposta</Label>
                <Textarea
                  id={`action-message-${actionIndex}`}
                  placeholder="Digite a mensagem de resposta automática..."
                  value={actionConfig?.message || ''}
                  onChange={(e) => updateActionConfig('message', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor={`action-delay-${actionIndex}`}>Atraso (segundos)</Label>
                <Input
                  id={`action-delay-${actionIndex}`}
                  type="number"
                  placeholder="0"
                  value={actionConfig?.delay || 0}
                  onChange={(e) => updateActionConfig('delay', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        );

      case 'ai_response':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`action-tone-${actionIndex}`}>Tom da Resposta</Label>
                <Select
                  value={actionConfig?.tone || 'professional'}
                  onValueChange={(value) => updateActionConfig('tone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="empathetic">Empático</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`action-language-${actionIndex}`}>Idioma</Label>
                <Select
                  value={actionConfig?.language || 'pt-BR'}
                  onValueChange={(value) => updateActionConfig('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                    <SelectItem value="fr-FR">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor={`action-instructions-${actionIndex}`}>Instruções Personalizadas</Label>
              <Textarea
                id={`action-instructions-${actionIndex}`}
                placeholder="Digite instruções específicas para a IA sobre como responder..."
                value={actionConfig?.customInstructions || ''}
                onChange={(e) => updateActionConfig('customInstructions', e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Exemplo: "Responda de forma empática, oferecendo soluções práticas e incluindo informações de contato."
              </p>
            </div>
            <div>
              <Label htmlFor={`action-template-${actionIndex}`}>Template de Resposta (Opcional)</Label>
              <Textarea
                id={`action-template-${actionIndex}`}
                placeholder="Olá! {response} Caso precise de mais alguma coisa, estou à disposição."
                value={actionConfig?.template || ''}
                onChange={(e) => updateActionConfig('template', e.target.value)}
                rows={2}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use {'{response}'} onde a resposta da IA deve ser inserida. Se vazio, apenas a resposta da IA será enviada.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`action-include-original-${actionIndex}`}
                checked={actionConfig?.includeOriginalMessage || false}
                onChange={(e) => updateActionConfig('includeOriginalMessage', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor={`action-include-original-${actionIndex}`}>
                Incluir mensagem original na resposta
              </Label>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Funcionalidade de IA Ativa</span>
              </div>
              <p className="text-sm text-blue-700">
                Esta ação usa inteligência artificial para gerar respostas contextuais baseadas no conteúdo da mensagem recebida.
                A IA analisará o sentimento, intenção e contexto antes de gerar uma resposta adequada.
              </p>
            </div>
          </div>
        );

      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`action-recipient-${actionIndex}`}>Destinatário</Label>
              <Input
                id={`action-recipient-${actionIndex}`}
                value={actionConfig?.recipient || ''}
                onChange={(e) => updateActionConfig('recipient', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor={`action-message-${actionIndex}`}>Mensagem</Label>
              <Textarea
                id={`action-message-${actionIndex}`}
                value={actionConfig?.message || ''}
                onChange={(e) => updateActionConfig('message', e.target.value)}
                placeholder="Mensagem de notificação..."
              />
            </div>
          </div>
        );

      case 'create_ticket':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`action-title-${actionIndex}`}>Título do ticket</Label>
              <Input
                id={`action-title-${actionIndex}`}
                value={actionConfig?.title || ''}
                onChange={(e) => updateActionConfig('title', e.target.value)}
                placeholder="Título automático do ticket"
              />
            </div>
            <div>
              <Label htmlFor={`action-priority-${actionIndex}`}>Prioridade</Label>
              <Select value={actionConfig?.priority || 'medium'} onValueChange={(value) => updateActionConfig('priority', value)}>
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
        );

      case 'add_tags':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`action-tags-${actionIndex}`}>Tags (separadas por vírgula)</Label>
              <Input
                id={`action-tags-${actionIndex}`}
                value={actionConfig?.tags || ''}
                onChange={(e) => updateActionConfig('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
        );

      case 'assign_agent':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`action-agentId-${actionIndex}`}>ID do Agente</Label>
              <Input
                id={`action-agentId-${actionIndex}`}
                value={actionConfig?.agentId || ''}
                onChange={(e) => updateActionConfig('agentId', e.target.value)}
                placeholder="ID ou email do agente"
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <p className="text-sm text-gray-600">
              Configurações específicas para esta ação serão implementadas em breve.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            {existingRule ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
          </DialogTitle>
          <DialogDescription>
            Use o Query Builder para criar condições complexas e configure ações para automatizar seu atendimento.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)] pr-2"> {/* Ajustado para acomodar o cabeçalho e rodapé */}
          <div className="flex flex-col gap-4 px-2 pb-4">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Regra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">Nome da Regra</Label>
                    <Input
                      id="rule-name"
                      value={rule.name}
                      onChange={(e) => setRule({...rule, name: e.target.value})}
                      placeholder="Ex: Resposta automática para urgente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-priority">Prioridade</Label>
                    <Select value={rule.priority.toString()} onValueChange={(value) => setRule({...rule, priority: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Mais alta</SelectItem>
                        <SelectItem value="2">2 - Alta</SelectItem>
                        <SelectItem value="3">3 - Normal</SelectItem>
                        <SelectItem value="4">4 - Baixa</SelectItem>
                        <SelectItem value="5">5 - Mais baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rule-description">Descrição</Label>
                  <Textarea
                    id="rule-description"
                    value={rule.description}
                    onChange={(e) => setRule({...rule, description: e.target.value})}
                    placeholder="Descreva o que esta regra faz..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="rule-enabled"
                    checked={rule.enabled}
                    onCheckedChange={(enabled) => setRule({...rule, enabled})}
                  />
                  <Label htmlFor="rule-enabled">Regra ativa</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ai-enabled"
                    checked={rule.aiEnabled}
                    onCheckedChange={(aiEnabled) => setRule({...rule, aiEnabled})}
                  />
                  <Label htmlFor="ai-enabled">Usar análise de IA</Label>
                </div>
              </CardContent>
            </Card>

            {/* Tabs para Condições e Ações */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conditions">Condições</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>

              {/* Tab de Condições */}
              <TabsContent value="conditions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Condições da Regra
                    </CardTitle>
                    <CardDescription>
                      Configure quando esta regra deve ser executada usando o Query Builder avançado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QueryBuilderComponent
                      value={rule.conditions}
                      onChange={(conditions) => setRule({...rule, conditions})}
                      fieldOptions={omnibridgeFields}
                      operatorOptions={omnibridgeOperators}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab de Ações */}
              <TabsContent value="actions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Ações da Regra
                    </CardTitle>
                    <CardDescription>
                      Configure o que acontece quando as condições são atendidas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ações Configuradas */}
                    {rule.actions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Ações Configuradas:</h4>
                        {rule.actions.map((action, index) => (
                          <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${action.color}`}>
                                <action.icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium">{action.name}</p>
                                <p className="text-sm text-gray-600">{action.description}</p>
                              </div>
                              <Badge variant="outline">#{index + 1}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentAction(action);
                                  setActionConfig(action.config || {});
                                  setEditingActionIndex(index);
                                  setShowActionConfig(true);
                                }}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAction(action.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Templates de Ações */}
                    <div>
                      <h4 className="font-medium mb-3">Adicionar Ação:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {actionTemplates.map((template) => (
                          <Button
                            key={template.type}
                            variant="outline"
                            className="justify-start h-auto p-3"
                            onClick={() => {
                              const newAction: Action = {
                                id: `action_${Date.now()}_${template.type}`,
                                ...template,
                                config: {}
                              };
                              setRule(prev => ({
                                ...prev,
                                actions: [...prev.actions, newAction]
                              }));
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${template.color}`}>
                                <template.icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-gray-600">{template.description}</p>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab(activeTab === 'conditions' ? 'actions' : 'conditions')}>
                  {activeTab === 'conditions' ? 'Configurar Ações' : 'Voltar às Condições'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveRuleMutation.isPending}
                >
                  {saveRuleMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Dialog de Configuração de Ação */}
        <Dialog open={showActionConfig} onOpenChange={(open) => {
          if (!open) {
            setShowActionConfig(false);
            setCurrentAction(null);
            setActionConfig({});
            setEditingActionIndex(-1);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {currentAction && <currentAction.icon className="w-5 h-5" />}
                Configurar {currentAction?.name}
              </DialogTitle>
              <DialogDescription>
                {currentAction?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {currentAction && renderActionConfig(currentAction, rule.actions.findIndex(a => a.id === currentAction.id))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowActionConfig(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmActionConfig}>
                Confirmar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}