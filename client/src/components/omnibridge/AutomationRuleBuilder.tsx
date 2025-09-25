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
        actions: (existingRule.actions || []).map((action, index) => {
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
      aiEnabled: rule.aiEnabled,
      actions: rule.actions.map(action => ({
        id: action.id,
        type: action.type,
        name: action.name,
        description: action.description,
        config: action.config || {},
        priority: action.priority || 1 // Assuming priority might be a field in Action in the future
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
  const renderActionConfig = (action: Action) => {
    if (!action || !action.type) {
      return (
        <div className="text-sm text-muted-foreground">
          Configurações específicas para esta ação serão implementadas em breve.
        </div>
      );
    }

    switch (action.type) {
      case 'send_auto_reply':
      case 'auto_reply':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border">
              <h4 className="font-medium text-blue-900 mb-2">Resposta Automática</h4>
              <p className="text-sm text-blue-700">Configure a mensagem que será enviada automaticamente</p>
            </div>
            <div>
              <Label htmlFor="replyMessage">Mensagem de Resposta</Label>
              <Textarea
                id="replyMessage"
                placeholder="Digite a mensagem de resposta automática..."
                value={actionConfig.message || action.config?.message || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  message: e.target.value
                }))}
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="replyDelay">Atraso (segundos)</Label>
              <Input
                id="replyDelay"
                type="number"
                placeholder="0"
                value={actionConfig.delay || action.config?.delay || 0}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  delay: parseInt(e.target.value) || 0
                }))}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Tempo de espera antes de enviar a resposta (0 = imediato)
              </p>
            </div>
          </div>
        );

      case 'send_notification':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg border">
              <h4 className="font-medium text-yellow-900 mb-2">Enviar Notificação</h4>
              <p className="text-sm text-yellow-700">Configure os destinatários e mensagem da notificação</p>
            </div>
            <div>
              <Label htmlFor="notificationMessage">Mensagem da Notificação</Label>
              <Textarea
                id="notificationMessage"
                placeholder="Digite a mensagem da notificação..."
                value={actionConfig.message || action.config?.message || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  message: e.target.value
                }))}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notificationUsers">Usuários para Notificar</Label>
              <Input
                id="notificationUsers"
                placeholder="emails@exemplo.com (separados por vírgula)"
                value={actionConfig.users || action.config?.users || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  users: e.target.value
                }))}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Separe múltiplos emails por vírgula
              </p>
            </div>
          </div>
        );

      case 'create_ticket':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border">
              <h4 className="font-medium text-green-900 mb-2">Criar Ticket</h4>
              <p className="text-sm text-green-700">Configure os dados do ticket que será criado automaticamente</p>
            </div>
            <div>
              <Label htmlFor="ticketTitle">Título do Ticket</Label>
              <Input
                id="ticketTitle"
                placeholder="Título automático do ticket..."
                value={actionConfig.title || action.config?.title || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ticketDescription">Descrição do Ticket</Label>
              <Textarea
                id="ticketDescription"
                placeholder="Descrição automática do ticket..."
                value={actionConfig.description || action.config?.description || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ticketPriority">Prioridade</Label>
              <Select 
                value={actionConfig.priority || action.config?.priority || 'medium'}
                onValueChange={(value) => setActionConfig(prev => ({
                  ...prev,
                  priority: value
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar prioridade" />
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
            <div className="bg-indigo-50 p-3 rounded-lg border">
              <h4 className="font-medium text-indigo-900 mb-2">Adicionar Tags</h4>
              <p className="text-sm text-indigo-700">Configure as tags que serão adicionadas automaticamente</p>
            </div>
            <div>
              <Label htmlFor="tagsToAdd">Tags para Adicionar</Label>
              <Input
                id="tagsToAdd"
                placeholder="tag1, tag2, tag3..."
                value={actionConfig.tags || action.config?.tags || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  tags: e.target.value
                }))}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Separe múltiplas tags por vírgula
              </p>
            </div>
          </div>
        );

      case 'assign_agent':
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 p-3 rounded-lg border">
              <h4 className="font-medium text-teal-900 mb-2">Atribuir Agente</h4>
              <p className="text-sm text-teal-700">Configure o agente que receberá a atribuição automática</p>
            </div>
            <div>
              <Label htmlFor="agentEmail">Email do Agente</Label>
              <Input
                id="agentEmail"
                type="email"
                placeholder="agente@exemplo.com"
                value={actionConfig.agentEmail || action.config?.agentEmail || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  agentEmail: e.target.value
                }))}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'forward_message':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-lg border">
              <h4 className="font-medium text-purple-900 mb-2">Encaminhar Mensagem</h4>
              <p className="text-sm text-purple-700">Configure o destino e nota para o encaminhamento</p>
            </div>
            <div>
              <Label htmlFor="forwardTo">Encaminhar Para</Label>
              <Input
                id="forwardTo"
                type="email"
                placeholder="destino@exemplo.com"
                value={actionConfig.forwardTo || action.config?.forwardTo || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  forwardTo: e.target.value
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="forwardNote">Nota de Encaminhamento</Label>
              <Textarea
                id="forwardNote"
                placeholder="Nota adicional para o encaminhamento..."
                value={actionConfig.note || action.config?.note || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  note: e.target.value
                }))}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        );

      case 'mark_priority':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg border">
              <h4 className="font-medium text-red-900 mb-2">Marcar Prioridade</h4>
              <p className="text-sm text-red-700">Configure a nova prioridade que será atribuída</p>
            </div>
            <div>
              <Label htmlFor="newPriority">Nova Prioridade</Label>
              <Select 
                value={actionConfig.priority || action.config?.priority || 'medium'}
                onValueChange={(value) => setActionConfig(prev => ({
                  ...prev,
                  priority: value
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar prioridade" />
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

      case 'archive':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Arquivar</h4>
              <p className="text-sm text-gray-700">Configure o arquivamento automático da mensagem</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoArchive"
                checked={actionConfig.autoArchive || action.config?.autoArchive || false}
                onCheckedChange={(checked) => setActionConfig(prev => ({
                  ...prev,
                  autoArchive: checked
                }))}
              />
              <Label htmlFor="autoArchive">Arquivar automaticamente</Label>
            </div>
            <div>
              <Label htmlFor="archiveReason">Motivo do Arquivamento</Label>
              <Input
                id="archiveReason"
                placeholder="Motivo do arquivamento automático..."
                value={actionConfig.reason || action.config?.reason || ''}
                onChange={(e) => setActionConfig(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                className="mt-1"
              />
            </div>
          </div>
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
                      {/* Ações existentes */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Ações Configuradas ({rule.actions.length})</Label>
                          {rule.actions.map((action, index) => {
                            // Determinar nome e descrição baseado no tipo da ação
                            const getActionInfo = (actionType: string) => {
                              switch (actionType) {
                                case 'send_auto_reply':
                                case 'auto_reply':
                                  return {
                                    name: 'Resposta Automática',
                                    description: 'Envia resposta pré-definida automaticamente',
                                    icon: Reply,
                                    color: 'text-blue-600'
                                  };
                                case 'send_notification':
                                  return {
                                    name: 'Enviar Notificação',
                                    description: 'Notifica equipe responsável',
                                    icon: Bell,
                                    color: 'text-yellow-600'
                                  };
                                case 'create_ticket':
                                  return {
                                    name: 'Criar Ticket',
                                    description: 'Cria ticket automaticamente',
                                    icon: FileText,
                                    color: 'text-green-600'
                                  };
                                case 'forward_message':
                                  return {
                                    name: 'Encaminhar Mensagem',
                                    description: 'Encaminha para outro agente',
                                    icon: Forward,
                                    color: 'text-purple-600'
                                  };
                                case 'add_tags':
                                  return {
                                    name: 'Adicionar Tags',
                                    description: 'Categoriza com tags',
                                    icon: Tag,
                                    color: 'text-indigo-600'
                                  };
                                case 'assign_agent':
                                  return {
                                    name: 'Atribuir Agente',
                                    description: 'Designa agente específico',
                                    icon: Users,
                                    color: 'text-teal-600'
                                  };
                                case 'mark_priority':
                                  return {
                                    name: 'Marcar Prioridade',
                                    description: 'Define nível de prioridade',
                                    icon: Star,
                                    color: 'text-red-600'
                                  };
                                case 'archive':
                                  return {
                                    name: 'Arquivar',
                                    description: 'Move para arquivo',
                                    icon: Archive,
                                    color: 'text-gray-600'
                                  };
                                default:
                                  return {
                                    name: action.name || `Ação ${action.type}`,
                                    description: action.description || `Descrição da ação ${action.type}`,
                                    icon: Settings,
                                    color: 'text-muted-foreground'
                                  };
                              }
                            };

                            const actionInfo = getActionInfo(action.type);
                            const hasConfig = action.config && Object.keys(action.config).length > 0;

                            return (
                              <div 
                                key={action.id || index} 
                                className="flex items-center justify-between p-3 bg-secondary rounded-md border"
                              >
                                <div className="flex items-center gap-3">
                                  {React.createElement(actionInfo.icon, { 
                                    size: 16, 
                                    className: actionInfo.color
                                  })}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      {actionInfo.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {actionInfo.description}
                                    </div>
                                    {hasConfig && (
                                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <CheckCircle size={10} />
                                        Configurada
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => editAction(action, index)}
                                    title="Configurar ação"
                                  >
                                    <Cog size={14} />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeAction(index)}
                                    title="Remover ação"
                                  >
                                    <Minus size={14} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

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
                    <currentAction.icon className="w-4 h-4 text-white" />
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
            {currentAction && renderActionConfig(currentAction)}
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
    </Dialog>
  );
}