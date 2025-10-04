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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  BarChart3,
  ArrowUp,
  Webhook
} from 'lucide-react';
import { UserMultiSelect } from '@/components/ui/UserMultiSelect';
import { UserGroupSelect } from '@/components/ui/UserGroupSelect';
import AiAgentActionConfig from './AiAgentActionConfig';
import { ActionGrid, ACTION_DEFINITIONS, type ActionDefinition } from './ActionGrid';
import { ActionConfigModal } from './ActionConfigModal';



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
    type: 'send_auto_reply',
    name: 'Resposta automática',
    description: 'Envia resposta pré-definida automaticamente',
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
  },
  {
    type: 'ai_agent',
    name: 'Agente de IA Conversacional',
    description: 'IA que conversa e executa ações',
    icon: Brain,
    color: 'bg-purple-500'
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
    priority: 1
  });

  const [activeTab, setActiveTab] = useState('conditions');
  const [showActionConfig, setShowActionConfig] = useState(false);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});
  const [editingActionIndex, setEditingActionIndex] = useState<number>(-1);
  const [showActionConfigModal, setShowActionConfigModal] = useState(false);
  const [selectedActionForConfig, setSelectedActionForConfig] = useState<ActionDefinition | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Helper para obter ícone de ação com base no nome ou componente
  const getActionIcon = (iconName: string | React.ComponentType<any>) => {
    if (typeof iconName === 'function') {
      const IconComponent = iconName;
      return <IconComponent className="h-4 w-4" />;
    }

    const iconMap: { [key: string]: React.ComponentType<any> } = {
      MessageSquare,
      Bot,
      Zap,
      Mail,
      Phone,
      Users,
      Tag,
      ArrowRight,
      Archive,
      Reply,
      Forward,
      Star,
      Bell,
      FileText,
      Brain
    };

    const IconComponent = iconMap[iconName as string];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };


  // ✅ 1QA.MD: Carregar dados da regra existente quando disponível
  useEffect(() => {
    if (existingRule) {
      // Garantir que conditions sempre tenha a estrutura correta
      let conditions = { rules: [], logicalOperator: 'AND' };

      if (existingRule.conditions && typeof existingRule.conditions === 'object') {
        conditions = {
          rules: existingRule.conditions.rules || [],
          logicalOperator: existingRule.conditions.logicalOperator || 'AND'
        };
      } else if (existingRule.trigger && typeof existingRule.trigger === 'object') {
        // Fallback para compatibilidade com formato trigger
        conditions = {
          rules: existingRule.trigger.rules || [],
          logicalOperator: existingRule.trigger.logicalOperator || 'AND'
        };
      }

      // Mapear dados da regra existente para o formato do formulário
      const mappedRule: AutomationRule = {
        name: existingRule.name || '',
        description: existingRule.description || '',
        enabled: existingRule.enabled ?? true,
        conditions: conditions,
        actions: (existingRule.actions || []).map((action: any, index: number) => {
          // Encontrar template correspondente para hidratar campos UI
          const template = actionTemplates.find(t => t.type === action.type);

          // Gerar ID determinístico se não existir
          const stableId = action.id || `${existingRule.id}_${action.type}_${index}`;

          // ✅ FIXED: Template com fallback mais robusto
          const safeTemplate = template || {
            type: action.type,
            name: action.type === 'auto_reply' ? 'Resposta automática' :
                  action.type === 'send_auto_reply' ? 'Resposta automática' :
                  action.type === 'send_notification' ? 'Enviar notificação' :
                  action.type === 'create_ticket' ? 'Criar ticket' :
                  action.type === 'forward_message' ? 'Encaminhar mensagem' :
                  action.type === 'add_tags' ? 'Adicionar tags' :
                  action.type === 'assign_agent' ? 'Atribuir agente' :
                  action.type === 'mark_priority' ? 'Marcar prioridade' :
                  action.type === 'ai_response' ? 'Resposta com IA' :
                  action.type === 'ai_agent' ? 'Agente de IA Conversacional' :
                  action.type === 'escalate' ? 'Escalar' :
                  action.type === 'archive' ? 'Arquivar' :
                  `Ação ${action.type}`,
            description: action.type === 'auto_reply' ? 'Envia resposta pré-definida' :
                        action.type === 'send_auto_reply' ? 'Envia resposta pré-definida automaticamente' :
                        action.type === 'send_notification' ? 'Notifica equipe responsável' :
                        action.type === 'create_ticket' ? 'Cria ticket automaticamente' :
                        action.type === 'forward_message' ? 'Encaminha para outro agente' :
                        action.type === 'add_tags' ? 'Categoriza com tags' :
                        action.type === 'assign_agent' ? 'Designa agente específico' :
                        action.type === 'mark_priority' ? 'Define nível de prioridade' :
                        action.type === 'ai_response' ? 'Gera resposta usando IA' :
                        action.type === 'ai_agent' ? 'IA que conversa e executa ações' :
                        action.type === 'escalate' ? 'Escala para supervisor' :
                        action.type === 'archive' ? 'Move para arquivo' :
                        `Descrição da ação ${action.type}`,
            icon: Settings, // ícone padrão para ações não reconhecidas
            color: 'bg-gray-500'
          };

          return {
            ...safeTemplate, // Hidrata icon, color, name, description do template
            ...action,       // Sobrescreve com dados persistidos (id, type, config)
            // ✅ CRITICAL FIX: Sempre usar nome do template se disponível
            name: template?.name || safeTemplate.name,
            description: template?.description || safeTemplate.description,
            id: stableId
          };
        }),
        priority: existingRule.priority || 1
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
        priority: 1
      });
    }
  }, [existingRule]);

  // Pré-preencher mensagem da notificação com dados da mensagem recebida
  useEffect(() => {
    if (currentAction?.type === 'send_notification' && initialMessage && !actionConfig.message) {
      const messageContent = `Nova mensagem recebida via ${initialMessage.channelType}

De: ${initialMessage.from}
${initialMessage.subject ? `Assunto: ${initialMessage.subject}` : ''}

Mensagem:
${initialMessage.content}

---
Recebida em: ${new Date(initialMessage.receivedAt).toLocaleString('pt-BR')}`;

      setActionConfig(prev => ({ ...prev, message: messageContent }));
    }
  }, [currentAction, initialMessage]);

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
    if (!currentAction) return;

    // Process users array to string for send_notification action
    let processedConfig = { ...actionConfig };
    if (currentAction.type === 'send_notification' && Array.isArray(actionConfig.users)) {
      processedConfig.users = actionConfig.users.join(',');
    }
    // Handle groups if necessary
    if (currentAction.type === 'send_notification' && actionConfig.groups) {
      processedConfig.groups = actionConfig.groups;
    }


    const updatedAction = {
      ...currentAction,
      config: processedConfig
    };

    const newActions = [...rule.actions];
    if (editingActionIndex >= 0) {
      newActions[editingActionIndex] = updatedAction;
    } else {
      newActions.push(updatedAction);
    }

    setRule(prev => ({ ...prev, actions: newActions }));
    setShowActionConfig(false);
    setCurrentAction(null);
    setActionConfig({});
    setEditingActionIndex(-1);
  };

  // Remover ação
  const removeAction = (actionIndexToRemove: number) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter((_, index) => index !== actionIndexToRemove)
    }));
  };

  // Editar ação
  const editAction = (actionToEdit: Action, index: number) => {
    console.log('🔧 [AutomationRuleBuilder] Editing action:', actionToEdit, 'at index:', index);

    setCurrentAction(actionToEdit);
    setActionConfig(actionToEdit.config || {});
    setEditingActionIndex(index);
    setShowActionConfig(true);
  };

  // Funções para ActionGrid
  const handleToggleAction = (action: ActionDefinition, enabled: boolean) => {
    if (enabled) {
      // Adicionar ação
      const newAction: Action = {
        id: `${action.id}_${Date.now()}`,
        type: action.type,
        name: action.name,
        description: action.description,
        icon: action.icon,
        color: action.color,
        config: {}
      };
      setRule(prev => ({ ...prev, actions: [...prev.actions, newAction] }));
    } else {
      // Remover ação
      setRule(prev => ({
        ...prev,
        actions: prev.actions.filter(a => a.type !== action.type)
      }));
    }
  };

  const handleConfigureAction = (action: ActionDefinition) => {
    // Encontrar ação existente ou criar nova
    const existingAction = rule.actions.find(a => a.type === action.type);
    
    if (existingAction) {
      setSelectedActionForConfig({
        ...action,
        config: existingAction.config || {}
      });
    } else {
      setSelectedActionForConfig(action);
    }
    
    setShowActionConfigModal(true);
  };

  const handleSaveActionConfig = (config: Record<string, any>) => {
    if (!selectedActionForConfig) return;

    setRule(prev => {
      const existingIndex = prev.actions.findIndex(a => a.type === selectedActionForConfig.type);
      const updatedActions = [...prev.actions];

      if (existingIndex >= 0) {
        // Atualizar ação existente
        updatedActions[existingIndex] = {
          ...updatedActions[existingIndex],
          config
        };
      } else {
        // Adicionar nova ação
        updatedActions.push({
          id: `${selectedActionForConfig.id}_${Date.now()}`,
          type: selectedActionForConfig.type,
          name: selectedActionForConfig.name,
          description: selectedActionForConfig.description,
          icon: selectedActionForConfig.icon,
          color: selectedActionForConfig.color,
          config
        });
      }

      return { ...prev, actions: updatedActions };
    });

    setShowActionConfigModal(false);
    setSelectedActionForConfig(null);
  };

  // Converter rule.actions para formato ActionDefinition[]
  const getSelectedActions = (): ActionDefinition[] => {
    return rule.actions.map(action => ({
      id: action.id,
      type: action.type,
      name: action.name,
      description: action.description,
      icon: action.icon,
      color: action.color,
      category: ACTION_DEFINITIONS.find(def => def.type === action.type)?.category || 'tickets',
      enabled: true,
      config: action.config
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

    if (!rule.conditions || !rule.conditions.rules || rule.conditions.rules.length === 0) {
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
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      conditions: rule.conditions,
      priority: rule.priority,
      actions: rule.actions.map(action => ({
        id: action.id,
        type: action.type,
        name: action.name,
        description: action.description,
        config: action.config || {}
      }))
    };

    console.log('💾 [AutomationRuleBuilder] Saving sanitized rule:', sanitizedRule);
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
  const renderActionConfig = () => {
    console.log('[AutomationRuleBuilder] renderActionConfig called', { 
      hasCurrentAction: !!currentAction, 
      actionType: currentAction?.type 
    });

    if (!currentAction) return null;

    switch (currentAction.type) {
      case 'auto_reply':
      case 'send_auto_reply':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="replyMessage">Mensagem de Resposta</Label>
              <Textarea
                id="replyMessage"
                placeholder="Digite a mensagem de resposta automática..."
                value={actionConfig.replyMessage || actionConfig.message || ''}
                onChange={(e) => setActionConfig(prev => ({ ...prev, replyMessage: e.target.value, message: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-users">Usuários para notificar</Label>
              <UserMultiSelect
                value={Array.isArray(actionConfig.users) ? actionConfig.users : (actionConfig.users ? actionConfig.users.split(',') : [])}
                onChange={(selectedUsers: string[]) =>
                  setActionConfig(prev => ({ ...prev, users: selectedUsers }))
                }
                placeholder="Selecionar usuários para notificar..."
              />
            </div>

            <div>
              <Label htmlFor="notification-groups">Grupos para notificar</Label>
              <UserGroupSelect
                value={actionConfig.notificationGroup || ''}
                onChange={(selectedGroup: string) =>
                  setActionConfig(prev => ({ ...prev, notificationGroup: selectedGroup }))
                }
                placeholder="Selecionar grupo para notificar..."
              />
            </div>

            <div>
              <Label htmlFor="notification-message">Mensagem da notificação</Label>
              <Textarea
                id="notification-message"
                value={actionConfig.message || ''}
                onChange={(e) => setActionConfig(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Digite a mensagem da notificação"
                rows={3}
              />
            </div>
          </div>
        );

      case 'ai_agent':
        return (
          <AiAgentActionConfig
            config={actionConfig.aiAgentConfig || {}}
            onChange={(aiAgentConfig) =>
              setActionConfig(prev => ({ ...prev, aiAgentConfig }))
            }
          />
        );

      default:
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 p-3 rounded-lg border">
              <h4 className="font-medium text-orange-900 mb-2">Ação Personalizada</h4>
              <p className="text-sm text-orange-700">Esta ação ainda não possui configurações específicas</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Configurações específicas para esta ação serão implementadas em breve.
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            {existingRule ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
          </DialogTitle>
          <DialogDescription>
            Use o Query Builder para criar condições complexas e configure ações para automatizar seu atendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          <ScrollArea className="flex-1 pr-2">
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
                        Ações da Regra ({rule.actions.length} selecionadas)
                      </CardTitle>
                      <CardDescription>
                        Selecione e configure as ações que serão executadas quando as condições forem atendidas.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                      <ActionGrid
                        selectedActions={getSelectedActions()}
                        onToggleAction={handleToggleAction}
                        onConfigureAction={handleConfigureAction}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Footer com botões - sempre visível */}
          <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveRuleMutation.isPending || !rule.name.trim() || rule.actions.length === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saveRuleMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {existingRule ? 'Atualizar Regra' : 'Salvar Regra'}
                    </>
                  )}
                </Button>
              </div>
        </div>
      </DialogContent>

      {/* Dialog de configuração de ação */}
      <Dialog open={showActionConfig} onOpenChange={(open) => {
          if (!open) {
            setShowActionConfig(false);
            setCurrentAction(null);
            setActionConfig({});
            setEditingActionIndex(-1);
          }
        }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentAction && (
                <>
                  <div className={`p-2 rounded-lg ${currentAction.color}`}>
                    {getActionIcon(currentAction.icon)}
                  </div>
                  Configurar: {currentAction.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {currentAction?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {currentAction && renderActionConfig()}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowActionConfig(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmActionConfig}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração de Ação (novo sistema) */}
      <ActionConfigModal
        isOpen={showActionConfigModal}
        action={selectedActionForConfig}
        config={selectedActionForConfig?.config || {}}
        onClose={() => {
          setShowActionConfigModal(false);
          setSelectedActionForConfig(null);
        }}
        onSave={handleSaveActionConfig}
      />
    </Dialog>
  );
}