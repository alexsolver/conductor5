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
  Link
} from 'lucide-react';

interface Trigger {
  id: string;
  type: 'keyword' | 'channel' | 'priority' | 'sender' | 'time' | 'ai_analysis';
  name: string;
  description: string;
  icon: any;
  color: string;
  config: Record<string, any>;
}

interface Action {
  id: string;
  type: 'auto_reply' | 'create_ticket' | 'send_notification' | 'forward_message' | 'add_tags' | 'assign_agent' | 'mark_priority' | 'archive';
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
  triggers: Trigger[];
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

// Predefined trigger templates
const triggerTemplates: Omit<Trigger, 'id' | 'config'>[] = [
  {
    type: 'keyword',
    name: 'Palavra-chave',
    description: 'Ativa quando detecta palavras específicas',
    icon: Hash,
    color: 'bg-blue-500'
  },
  {
    type: 'channel',
    name: 'Canal específico',
    description: 'Ativa para mensagens de um canal',
    icon: MessageSquare,
    color: 'bg-green-500'
  },
  {
    type: 'priority',
    name: 'Prioridade alta',
    description: 'Ativa para mensagens urgentes',
    icon: AlertCircle,
    color: 'bg-red-500'
  },
  // Novos triggers focados em chamados
  {
    type: 'ticket_keywords',
    name: 'Palavras de chamado',
    description: 'Detecta termos que indicam necessidade de chamado',
    icon: Target,
    color: 'bg-red-600'
  },
  {
    type: 'complaint_detection',
    name: 'Detecção de reclamação',
    description: 'Identifica mensagens de reclamação',
    icon: AlertTriangle,
    color: 'bg-orange-600'
  },
  {
    type: 'service_request',
    name: 'Solicitação de serviço',
    description: 'Detecta pedidos de suporte técnico',
    icon: Settings,
    color: 'bg-blue-600'
  },
  {
    type: 'escalation_needed',
    name: 'Necessita escalação',
    description: 'Identifica casos que precisam de escalação',
    icon: ArrowRight,
    color: 'bg-purple-600'
  },
  {
    type: 'customer_frustrated',
    name: 'Cliente frustrado',
    description: 'Detecta sinais de frustração do cliente',
    icon: AlertCircle,
    color: 'bg-red-700'
  },
  {
    type: 'technical_issue',
    name: 'Problema técnico',
    description: 'Identifica questões técnicas',
    icon: Cog,
    color: 'bg-gray-600'
  },
  {
    type: 'billing_inquiry',
    name: 'Dúvida financeira',
    description: 'Detecta questões sobre cobrança',
    icon: CreditCard,
    color: 'bg-green-600'
  },
  // Triggers existentes
  {
    type: 'sender',
    name: 'Remetente específico',
    description: 'Ativa para um remetente específico',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    type: 'time',
    name: 'Horário específico',
    description: 'Ativa em horários determinados',
    icon: Clock,
    color: 'bg-orange-500'
  },
  {
    type: 'ai_analysis',
    name: 'Análise de IA',
    description: 'Ativa baseado em análise inteligente',
    icon: Brain,
    color: 'bg-pink-500'
  }
];

// Predefined action templates
const actionTemplates: Omit<Action, 'id' | 'config'>[] = [
  {
    type: 'auto_reply',
    name: 'Resposta automática',
    description: 'Envia resposta pré-definida',
    icon: Reply,
    color: 'bg-blue-500'
  },
  {
    type: 'create_ticket',
    name: 'Criar ticket',
    description: 'Cria ticket automaticamente',
    icon: FileText,
    color: 'bg-green-500'
  },
  // Novos nós focados em chamados
  {
    type: 'create_urgent_ticket',
    name: 'Criar ticket urgente',
    description: 'Cria ticket com prioridade alta',
    icon: AlertCircle,
    color: 'bg-red-600'
  },
  {
    type: 'create_ticket_from_template',
    name: 'Ticket por template',
    description: 'Cria ticket usando template pré-definido',
    icon: FileText,
    color: 'bg-emerald-600'
  },
  {
    type: 'assign_ticket_by_category',
    name: 'Atribuir por categoria',
    description: 'Atribui ticket baseado na categoria',
    icon: Target,
    color: 'bg-blue-600'
  },
  {
    type: 'escalate_ticket',
    name: 'Escalar chamado',
    description: 'Escala ticket para supervisor',
    icon: ArrowRight,
    color: 'bg-orange-600'
  },
  {
    type: 'set_ticket_sla',
    name: 'Definir SLA',
    description: 'Define tempo limite para resolução',
    icon: Clock,
    color: 'bg-yellow-600'
  },
  {
    type: 'link_related_tickets',
    name: 'Vincular tickets',
    description: 'Vincula a tickets relacionados',
    icon: Link,
    color: 'bg-purple-600'
  },
  {
    type: 'create_followup_task',
    name: 'Criar follow-up',
    description: 'Agenda tarefa de acompanhamento',
    icon: Calendar,
    color: 'bg-cyan-600'
  },
  {
    type: 'notify_customer',
    name: 'Notificar cliente',
    description: 'Envia notificação ao cliente',
    icon: MessageSquare,
    color: 'bg-green-600'
  },
  // Ações existentes
  {
    type: 'send_notification',
    name: 'Enviar notificação',
    description: 'Notifica equipe responsável',
    icon: Bell,
    color: 'bg-yellow-500'
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
    type: 'archive',
    name: 'Arquivar',
    description: 'Move para arquivo',
    icon: Archive,
    color: 'bg-gray-500'
  }
];

// Helper functions for mapping backend data to UI format
const getDisplayNameForTriggerType = (type: string) => {
  const mapping = {
    'keyword': 'Palavra-chave',
    'channel': 'Canal específico',
    'priority': 'Prioridade alta',
    'sender': 'Remetente específico',
    'time': 'Horário específico',
    'ai_analysis': 'Análise de IA'
  };
  return mapping[type as keyof typeof mapping] || 'Gatilho personalizado';
};

const getDescriptionForTriggerType = (type: string) => {
  const mapping = {
    'keyword': 'Ativa quando detecta palavras específicas',
    'channel': 'Ativa para mensagens de um canal',
    'priority': 'Ativa para mensagens urgentes',
    'sender': 'Ativa para um remetente específico',
    'time': 'Ativa em horários determinados',
    'ai_analysis': 'Ativa baseado em análise inteligente'
  };
  return mapping[type as keyof typeof mapping] || 'Gatilho personalizado';
};

const getIconForTriggerType = (type: string) => {
  const mapping = {
    'keyword': Hash,
    'channel': MessageSquare,
    'priority': AlertCircle,
    'sender': Users,
    'time': Clock,
    'ai_analysis': Brain
  };
  return mapping[type as keyof typeof mapping] || Target;
};

const getColorForTriggerType = (type: string) => {
  const mapping = {
    'keyword': 'bg-blue-500',
    'channel': 'bg-green-500',
    'priority': 'bg-red-500',
    'sender': 'bg-purple-500',
    'time': 'bg-orange-500',
    'ai_analysis': 'bg-pink-500'
  };
  return mapping[type as keyof typeof mapping] || 'bg-gray-500';
};

const getDisplayNameForActionType = (type: string) => {
  const mapping = {
    'auto_reply': 'Resposta automática',
    'send_auto_reply': 'Resposta automática',
    'create_ticket': 'Criar ticket',
    'send_notification': 'Enviar notificação',
    'forward_message': 'Encaminhar mensagem',
    'add_tags': 'Adicionar tags',
    'assign_agent': 'Atribuir agente',
    'mark_priority': 'Marcar prioridade',
    'archive': 'Arquivar'
  };
  return mapping[type as keyof typeof mapping] || 'Ação personalizada';
};

const getDescriptionForActionType = (type: string) => {
  const mapping = {
    'auto_reply': 'Envia resposta pré-definida',
    'send_auto_reply': 'Envia resposta pré-definida',
    'create_ticket': 'Cria ticket automaticamente',
    'send_notification': 'Notifica equipe responsável',
    'forward_message': 'Encaminha para outro agente',
    'add_tags': 'Categoriza com tags',
    'assign_agent': 'Designa agente específico',
    'mark_priority': 'Define nível de prioridade',
    'archive': 'Move para arquivo'
  };
  return mapping[type as keyof typeof mapping] || 'Ação personalizada';
};

const getIconForActionType = (type: string) => {
  const mapping = {
    'auto_reply': Reply,
    'send_auto_reply': Reply,
    'create_ticket': FileText,
    'send_notification': Bell,
    'forward_message': Forward,
    'add_tags': Tag,
    'assign_agent': Users,
    'mark_priority': Star,
    'archive': Archive
  };
  return mapping[type as keyof typeof mapping] || Settings;
};

const getColorForActionType = (type: string) => {
  const mapping = {
    'auto_reply': 'bg-blue-500',
    'send_auto_reply': 'bg-blue-500',
    'create_ticket': 'bg-green-500',
    'send_notification': 'bg-yellow-500',
    'forward_message': 'bg-purple-500',
    'add_tags': 'bg-indigo-500',
    'assign_agent': 'bg-teal-500',
    'mark_priority': 'bg-red-500',
    'archive': 'bg-gray-500'
  };
  return mapping[type as keyof typeof mapping] || 'bg-gray-500';
};

export default function AutomationRuleBuilder({ 
  isOpen, 
  onClose, 
  initialMessage, 
  existingRule,
  onSave 
}: AutomationRuleBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [rule, setRule] = useState<AutomationRule>(() => {
    if (existingRule) {
      return {
        id: existingRule.id,
        name: existingRule.name || '',
        description: existingRule.description || '',
        enabled: existingRule.enabled ?? true,
        triggers: Array.isArray(existingRule.triggers) ? existingRule.triggers : [],
        actions: Array.isArray(existingRule.actions) ? existingRule.actions : [],
        priority: existingRule.priority || 1
      };
    }
    return {
      name: '',
      description: '',
      enabled: true,
      triggers: [],
      actions: [],
      priority: 1
    };
  });

  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showTriggerConfig, setShowTriggerConfig] = useState(false);
  const [showActionConfig, setShowActionConfig] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Update rule state when existingRule prop changes
  useEffect(() => {
    if (existingRule) {
      console.log('🔧 [AutomationRuleBuilder] Loading existing rule data:', existingRule);
      console.log('🔍 [AutomationRuleBuilder] COMPLETE existingRule object:', JSON.stringify(existingRule, null, 2));

      // DEFINITIVE FIX: Complete parsing of all triggers and actions
      let triggers = [];
      let actions = [];

      // STEP 1: Parse triggers with comprehensive fallback logic
      console.log('🔧 [AutomationRuleBuilder] Step 1: Processing triggers...');

      // Debug: Show what we're checking
      console.log('🔍 [AutomationRuleBuilder] Checking existingRule.triggers:', existingRule.triggers);
      console.log('🔍 [AutomationRuleBuilder] Checking existingRule.trigger:', existingRule.trigger);
      console.log('🔍 [AutomationRuleBuilder] Checking existingRule.actions:', existingRule.actions);

      // Priority 1: Check for triggers array (modern format)
      if (Array.isArray(existingRule.triggers) && existingRule.triggers.length > 0) {
        console.log('🔧 [AutomationRuleBuilder] Found triggers array with', existingRule.triggers.length, 'items');
        triggers = existingRule.triggers.map((trigger: any, index: number) => ({
          id: trigger.id || `trigger_array_${Date.now()}_${index}`,
          type: trigger.type || 'keyword',
          name: trigger.name || getDisplayNameForTriggerType(trigger.type || 'keyword'),
          description: trigger.description || getDescriptionForTriggerType(trigger.type || 'keyword'),
          icon: getIconForTriggerType(trigger.type || 'keyword'),
          color: getColorForTriggerType(trigger.type || 'keyword'),
          config: {
            keywords: trigger.config?.keywords || trigger.config?.value || '',
            value: trigger.config?.value || trigger.config?.keywords || '',
            operator: trigger.config?.operator || 'contains',
            field: trigger.config?.field || 'content',
            caseSensitive: trigger.config?.caseSensitive || false,
            ...trigger.config
          }
        }));
      }

      // CRITICAL FIX: Check for trigger array (backend format)
      else if (Array.isArray(existingRule.trigger) && existingRule.trigger.length > 0) {
        console.log('🔧 [AutomationRuleBuilder] Found trigger array (backend format) with', existingRule.trigger.length, 'items');
        triggers = existingRule.trigger.map((trigger: any, index: number) => ({
          id: trigger.id || `trigger_backend_${Date.now()}_${index}`,
          type: trigger.type || 'keyword',
          name: trigger.name || getDisplayNameForTriggerType(trigger.type || 'keyword'),
          description: trigger.description || getDescriptionForTriggerType(trigger.type || 'keyword'),
          icon: getIconForTriggerType(trigger.type || 'keyword'),
          color: getColorForTriggerType(trigger.type || 'keyword'),
          config: {
            keywords: trigger.config?.keywords || trigger.config?.value || '',
            value: trigger.config?.value || trigger.config?.keywords || '',
            operator: trigger.config?.operator || 'contains',
            field: trigger.config?.field || 'content',
            caseSensitive: trigger.config?.caseSensitive || false,
            ...trigger.config
          }
        }));
      }

      // Priority 2: Check for trigger.conditions (legacy format)
      else if (existingRule.trigger?.conditions && Array.isArray(existingRule.trigger.conditions) && existingRule.trigger.conditions.length > 0) {
        console.log('🔧 [AutomationRuleBuilder] Found trigger conditions array with', existingRule.trigger.conditions.length, 'items');
        const baseTriggerType = existingRule.trigger.type === 'keyword_match' ? 'keyword' : existingRule.trigger.type || 'keyword';

        triggers = existingRule.trigger.conditions.map((condition: any, index: number) => {
          const conditionType = condition.type || baseTriggerType;
          return {
            id: condition.id || `condition_${Date.now()}_${index}`,
            type: conditionType,
            name: getDisplayNameForTriggerType(conditionType),
            description: getDescriptionForTriggerType(conditionType),
            icon: getIconForTriggerType(conditionType),
            color: getColorForTriggerType(conditionType),
            config: {
              keywords: condition.value || condition.keywords || '',
              value: condition.value || condition.keywords || '',
              operator: condition.operator || 'contains',
              field: condition.field || 'content',
              caseSensitive: condition.caseSensitive || false
            }
          };
        });
      }

      // Priority 3: Single trigger object (minimal format)
      else if (existingRule.trigger && existingRule.trigger.type) {
        console.log('🔧 [AutomationRuleBuilder] Found single trigger object');
        const baseTriggerType = existingRule.trigger.type === 'keyword_match' ? 'keyword' : existingRule.trigger.type;

        triggers = [{
          id: existingRule.trigger.id || `single_trigger_${Date.now()}`,
          type: baseTriggerType,
          name: getDisplayNameForTriggerType(baseTriggerType),
          description: getDescriptionForTriggerType(baseTriggerType),
          icon: getIconForTriggerType(baseTriggerType),
          color: getColorForTriggerType(baseTriggerType),
          config: {
            keywords: existingRule.trigger.keywords || existingRule.trigger.value || '',
            value: existingRule.trigger.value || existingRule.trigger.keywords || '',
            operator: existingRule.trigger.operator || 'contains',
            field: existingRule.trigger.field || 'content',
            caseSensitive: existingRule.trigger.caseSensitive || false
          }
        }];
      }

      // Fallback: Create default trigger if nothing found
      if (triggers.length === 0) {
        console.log('🔧 [AutomationRuleBuilder] No triggers found, creating default trigger');
        triggers = [{
          id: `default_trigger_${Date.now()}`,
          type: 'keyword',
          name: getDisplayNameForTriggerType('keyword'),
          description: getDescriptionForTriggerType('keyword'),
          icon: getIconForTriggerType('keyword'),
          color: getColorForTriggerType('keyword'),
          config: {
            keywords: '',
            value: '',
            operator: 'contains',
            field: 'content',
            caseSensitive: false
          }
        }];
      }

      // STEP 2: Parse actions with comprehensive support
      console.log('🔧 [AutomationRuleBuilder] Step 2: Processing actions...');

      if (Array.isArray(existingRule.actions) && existingRule.actions.length > 0) {
        console.log('🔧 [AutomationRuleBuilder] Found actions array with', existingRule.actions.length, 'items');
        actions = existingRule.actions.map((action: any, index: number) => {
          // Normalize action type
          const normalizedType = action.type === 'send_auto_reply' ? 'auto_reply' : action.type;

          return {
            id: action.id || `action_${Date.now()}_${index}`,
            type: normalizedType,
            name: action.name || getDisplayNameForActionType(normalizedType),
            description: action.description || getDescriptionForActionType(normalizedType),
            icon: getIconForActionType(normalizedType),
            color: getColorForActionType(normalizedType),
            config: {
              ...action.params,
              ...action.config,
              // Ensure common properties are available
              message: action.params?.message || action.config?.message || action.params?.replyTemplate || '',
              template: action.params?.template || action.config?.template || '',
              recipient: action.params?.recipient || action.config?.recipient || '',
              priority: action.params?.priority || action.config?.priority || 'medium'
            }
          };
        });
      } else {
        console.log('🔧 [AutomationRuleBuilder] No actions found, creating default action');
        actions = [{
          id: `default_action_${Date.now()}`,
          type: 'auto_reply',
          name: getDisplayNameForActionType('auto_reply'),
          description: getDescriptionForActionType('auto_reply'),
          icon: getIconForActionType('auto_reply'),
          color: getColorForActionType('auto_reply'),
          config: {
            message: '',
            template: '',
            recipient: '',
            priority: 'medium'
          }
        }];
      }

      console.log('🔧 [AutomationRuleBuilder] FINAL RESULT - Parsed triggers:', triggers.length, triggers);
      console.log('🔧 [AutomationRuleBuilder] FINAL RESULT - Parsed actions:', actions.length, actions);

      // Set the rule with complete data
      setRule({
        id: existingRule.id,
        name: existingRule.name || '',
        description: existingRule.description || '',
        enabled: existingRule.enabled ?? true,
        triggers: triggers,
        actions: actions,
        priority: existingRule.priority || 1
      });
    }
  }, [existingRule]);

  // Save rule mutation
  const saveMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const url = ruleData.id 
        ? `/api/omnibridge/automation-rules/${ruleData.id}` 
        : '/api/omnibridge/automation-rules';
      const method = ruleData.id ? 'PUT' : 'POST'; // Use PUT for updates

      // Remove id from the payload for updates
      const { id, ...payload } = ruleData;

      console.log(`🔄 [AutomationRuleBuilder] Sending ${method} request to ${url} with payload:`, payload);

      const response = await apiRequest(method, url, payload);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: '✅ Sucesso',
        description: `Regra ${existingRule ? 'atualizada' : 'criada'} com sucesso!`
      });
      onSave?.(data);
      onClose();
    },
    onError: (error: any) => {
      console.error('❌ [AutomationRuleBuilder] Save error:', error);
      toast({
        title: '❌ Erro',
        description: error.message || 'Falha ao salvar regra de automação',
        variant: 'destructive'
      });
    }
  });

  const addTrigger = (template: Omit<Trigger, 'id' | 'config'>) => {
    const newTrigger: Trigger = {
      ...template,
      id: `trigger_${Date.now()}`,
      config: {}
    };
    setRule(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }));
  };

  const addAction = (template: Omit<Action, 'id' | 'config'>) => {
    const newAction: Action = {
      ...template,
      id: `action_${Date.now()}`,
      config: {}
    };
    setRule(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const removeTrigger = (triggerId: string) => {
    setRule(prev => ({
      ...prev,
      triggers: prev.triggers.filter(t => t.id !== triggerId)
    }));
  };

  const removeAction = (actionId: string) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== actionId)
    }));
  };

  const updateTriggerConfig = (triggerId: string, config: Record<string, any>) => {
    setRule(prev => ({
      ...prev,
      triggers: prev.triggers.map(t => 
        t.id === triggerId ? { ...t, config } : t
      )
    }));
  };

  const updateActionConfig = (actionId: string, config: Record<string, any>) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.map(a => 
        a.id === actionId ? { ...a, config } : a
      )
    }));
  };

  // Save handler
  const handleSave = async () => {
    if (!rule.name.trim()) {
      toast({
        title: '❌ Erro de validação',
        description: 'O nome da regra é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (rule.triggers.length === 0) {
      toast({
        title: '❌ Erro de validação', 
        description: 'Pelo menos um gatilho é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (rule.actions.length === 0) {
      toast({
        title: '❌ Erro de validação',
        description: 'Pelo menos uma ação é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    try {
      const ruleData = {
        name: rule.name,
        description: rule.description,
        isEnabled: rule.enabled, // Use isEnabled instead of enabled for DTO
        priority: rule.priority,
        triggers: rule.triggers,
        actions: rule.actions
      };

      console.log('🔧 [AutomationRuleBuilder] Saving rule data:', ruleData);

      if (existingRule?.id) {
        await saveMutation.mutateAsync({ 
          ...ruleData, 
          id: existingRule.id 
        });
      } else {
        await saveMutation.mutateAsync(ruleData);
      }
    } catch (error) {
      console.error('❌ [AutomationRuleBuilder] Error saving rule:', error);
      toast({
        title: '❌ Erro ao salvar',
        description: 'Não foi possível salvar a regra de automação',
        variant: 'destructive'
      });
    }
  };

  const openTriggerConfig = (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    setShowTriggerConfig(true);
  };

  const openActionConfig = (action: Action) => {
    setSelectedAction(action);
    setShowActionConfig(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col px-6 min-h-0">
          {/* Header */}
          <div className="pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {existingRule ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
              </DialogTitle>
              <DialogDescription>
                {existingRule 
                  ? 'Modifique os gatilhos e ações desta regra de automação.'
                  : 'Configure gatilhos e ações para automatizar processos no OmniBridge.'
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          <Tabs defaultValue="builder" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="builder">Construtor Visual</TabsTrigger>
              <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex gap-4 min-h-0">
                {/* Left Panel - Form */}
                <div className="w-1/3 flex flex-col gap-4 min-h-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Configurações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="rule-name">Nome da Regra</Label>
                        <Input
                          id="rule-name"
                          value={rule.name}
                          onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Resposta Automática para Problemas"
                        />
                      </div>

                      <div>
                        <Label htmlFor="rule-description">Descrição</Label>
                        <Textarea
                          id="rule-description"
                          value={rule.description}
                          onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o que esta regra faz..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="rule-enabled">Regra Ativa</Label>
                        <Switch
                          id="rule-enabled"
                          checked={rule.enabled}
                          onCheckedChange={(checked) => 
                            setRule(prev => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="rule-priority">Prioridade</Label>
                        <Select
                          value={rule.priority.toString()}
                          onValueChange={(value) => 
                            setRule(prev => ({ ...prev, priority: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Alta (1)</SelectItem>
                            <SelectItem value="2">Média (2)</SelectItem>
                            <SelectItem value="3">Baixa (3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Middle Panel - Rule Builder */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  <ScrollArea className="flex-1">
                    <div className="space-y-6">
                      {/* Triggers Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Zap className="w-5 h-5" />
                              Gatilhos ({rule.triggers.length})
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {rule.triggers.map((trigger, index) => (
                              <div
                                key={trigger.id}
                                className="flex items-center gap-3 p-3 border rounded-lg"
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trigger.color}`}>
                                  <trigger.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{trigger.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {trigger.description}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTrigger(trigger);
                                      setShowTriggerConfig(true);
                                    }}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTrigger(trigger.id)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Actions Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Bot className="w-5 h-5" />
                              Ações ({rule.actions.length})
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {rule.actions.map((action, index) => (
                              <div
                                key={action.id}
                                className="flex items-center gap-3 p-3 border rounded-lg"
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${action.color}`}>
                                  <action.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{action.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {action.description}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAction(action);
                                      setShowActionConfig(true);
                                    }}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAction(action.id)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </div>

                {/* Right Panel - Templates */}
                <div className="w-1/3 flex flex-col gap-4 min-h-0">
                  <ScrollArea className="flex-1">
                    <div className="space-y-4">
                      {/* Trigger Templates */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Gatilhos Disponíveis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {triggerTemplates.map((template) => (
                              <div
                                key={template.type}
                                className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                onClick={() => addTrigger(template)}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${template.color}`}>
                                  <template.icon className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{template.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {template.description}
                                  </div>
                                </div>
                                <Plus className="w-4 h-4" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Action Templates */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Ações Disponíveis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {actionTemplates.map((template) => (
                              <div
                                key={template.type}
                                className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                onClick={() => addAction(template)}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${template.color}`}>
                                  <template.icon className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{template.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {template.description}
                                  </div>
                                </div>
                                <Plus className="w-4 h-4" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Pré-visualização da Regra</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Nome:</h4>
                      <p>{rule.name || 'Sem nome'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Descrição:</h4>
                      <p>{rule.description || 'Sem descrição'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Status:</h4>
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold">Gatilhos ({rule.triggers.length}):</h4>
                      {rule.triggers.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum gatilho configurado</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1">
                          {rule.triggers.map((trigger) => (
                            <li key={trigger.id}>{trigger.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">Ações ({rule.actions.length}):</h4>
                      {rule.actions.length === 0 ? (
                        <p className="text-muted-foreground">Nenhuma ação configurada</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1">
                          {rule.actions.map((action) => (
                            <li key={action.id}>{action.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsPreview(!isPreview)}
                disabled={saveMutation.isPending}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreview ? 'Editar' : 'Pré-visualizar'}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending || !rule.name.trim()}
              >
                {saveMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Regra
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      {/* Trigger Configuration Modal */}
      <Dialog open={showTriggerConfig} onOpenChange={setShowTriggerConfig}>
        <DialogContent data-testid="trigger-config-modal">
          <DialogHeader>
            <DialogTitle>Configurar {selectedTrigger?.name}</DialogTitle>
            <DialogDescription>
              {selectedTrigger?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedTrigger && (
            <TriggerConfigForm
              trigger={selectedTrigger}
              onSave={(config) => {
                updateTriggerConfig(selectedTrigger.id, config);
                setShowTriggerConfig(false);
              }}
              onCancel={() => setShowTriggerConfig(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Action Configuration Modal */}
      <Dialog open={showActionConfig} onOpenChange={setShowActionConfig}>
        <DialogContent data-testid="action-config-modal">
          <DialogHeader>
            <DialogTitle>Configurar {selectedAction?.name}</DialogTitle>
            <DialogDescription>
              {selectedAction?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <ActionConfigForm
              action={selectedAction}
              onSave={(config) => {
                updateActionConfig(selectedAction.id, config);
                setShowActionConfig(false);
              }}
              onCancel={() => setShowActionConfig(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Trigger Configuration Form Component
function TriggerConfigForm({ 
  trigger, 
  onSave, 
  onCancel 
}: { 
  trigger: Trigger; 
  onSave: (config: Record<string, any>) => void; 
  onCancel: () => void; 
}) {
  const [config, setConfig] = useState(trigger.config);

  const renderConfigFields = () => {
    switch (trigger.type) {
      case 'keyword':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="keywords"
                placeholder="ex: urgente, problema, ajuda"
                value={config.keywords || ''}
                onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
                data-testid="keywords-input"
              />
            </div>
            <div>
              <Label htmlFor="matchType">Tipo de correspondência</Label>
              <Select 
                value={config.matchType || 'contains'} 
                onValueChange={(value) => setConfig({ ...config, matchType: value })}
              >
                <SelectTrigger data-testid="match-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contém a palavra</SelectItem>
                  <SelectItem value="exact">Palavra exata</SelectItem>
                  <SelectItem value="starts">Inicia com</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'channel':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="channelType">Tipo de canal</Label>
              <Select 
                value={config.channelType || ''} 
                onValueChange={(value) => setConfig({ ...config, channelType: value })}
              >
                <SelectTrigger data-testid="channel-type-select">
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="channelKeywords">Palavras-chave para monitorar</Label>
              <Input
                id="channelKeywords"
                placeholder="ex: ajuda, suporte, problema"
                value={config.keywords || config.value || ''}
                onChange={(e) => setConfig({ 
                  ...config, 
                  keywords: e.target.value,
                  value: e.target.value 
                })}
                data-testid="channel-keywords-input"
              />
            </div>
            <div>
              <Label htmlFor="channelMatchType">Tipo de correspondência</Label>
              <Select 
                value={config.operator || 'contains'} 
                onValueChange={(value) => setConfig({ ...config, operator: value })}
              >
                <SelectTrigger data-testid="channel-match-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contém a palavra</SelectItem>
                  <SelectItem value="exact">Palavra exata</SelectItem>
                  <SelectItem value="starts">Inicia com</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'priority':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="priorityLevel">Nível de prioridade</Label>
              <Select 
                value={config.priorityLevel || 'high'} 
                onValueChange={(value) => setConfig({ ...config, priorityLevel: value })}
              >
                <SelectTrigger data-testid="priority-level-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'sender':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="senderPattern">Padrão do remetente</Label>
              <Input
                id="senderPattern"
                placeholder="ex: cliente@empresa.com, *@empresa.com"
                value={config.senderPattern || ''}
                onChange={(e) => setConfig({ ...config, senderPattern: e.target.value })}
                data-testid="sender-pattern-input"
              />
            </div>
          </div>
        );
      case 'time':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Horário início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={config.startTime || '09:00'}
                  onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  data-testid="start-time-input"
                />
              </div>
              <div>
                <Label htmlFor="endTime">Horário fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={config.endTime || '18:00'}
                  onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                  data-testid="end-time-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="weekdays">Dias da semana</Label>
              <div className="flex gap-2 mt-2">
                {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day, index) => (
                  <Button
                    key={day}
                    variant={config.weekdays?.includes(index) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const weekdays = config.weekdays || [];
                      const newWeekdays = weekdays.includes(index)
                        ? weekdays.filter((d: number) => d !== index)
                        : [...weekdays, index];
                      setConfig({ ...config, weekdays: newWeekdays });
                    }}
                    data-testid={`weekday-${index}`}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'ai_analysis':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">Modelo de IA</Label>
              <select
                id="aiModel"
                value={config.aiModel || 'gpt-4'}
                onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                className="w-full p-2 border rounded-md"
                data-testid="ai-model-select"
              >
                <option value="gpt-4">GPT-4 (Análise avançada)</option>
                <option value="gpt-3.5">GPT-3.5 (Análise rápida)</option>
                <option value="claude">Claude (Análise detalhada)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="analysisType">Tipo de análise</Label>
              <select
                id="analysisType"
                value={config.analysisType || 'sentiment'}
                onChange={(e) => setConfig({ ...config, analysisType: e.target.value })}
                className="w-full p-2 border rounded-md"
                data-testid="analysis-type-select"
              >
                <option value="sentiment">Análise de sentimento</option>
                <option value="intent">Detecção de intenção</option>
                <option value="urgency">Nível de urgência</option>
                <option value="category">Categorização automática</option>
                <option value="language">Detecção de idioma</option>
              </select>
            </div>
            <div>
              <Label htmlFor="confidence">Confiança mínima (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="50"
                max="100"
                value={config.confidence || '80'}
                onChange={(e) => setConfig({ ...config, confidence: e.target.value })}
                data-testid="confidence-input"
              />
            </div>
            <div>
              <Label htmlFor="customPrompt">Prompt personalizado (opcional)</Label>
              <Textarea
                id="customPrompt"
                placeholder="Analise esta mensagem e identifique..."
                value={config.customPrompt || ''}
                onChange={(e) => setConfig({ ...config, customPrompt: e.target.value })}
                rows={3}
                data-testid="custom-prompt-input"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-500">Tipo de gatilho não reconhecido</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderConfigFields()}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(config)} data-testid="save-trigger-config">
          Salvar
        </Button>
      </div>
    </div>
  );
}

// Action Configuration Form Component
function ActionConfigForm({ 
  action, 
  onSave, 
  onCancel 
}: { 
  action: Action; 
  onSave: (config: Record<string, any>) => void; 
  onCancel: () => void; 
}) {
  const [config, setConfig] = useState(action.config);

  const renderConfigFields = () => {
    switch (action.type) {
      case 'auto_reply':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="replyMessage">Mensagem de resposta</Label>
              <Textarea
                id="replyMessage"
                placeholder="Digite a mensagem automática..."
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={4}
                data-testid="reply-message-input"
              />
            </div>
          </div>
        );
      case 'create_ticket':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ticketTitle">Título do ticket</Label>
              <Input
                id="ticketTitle"
                placeholder="ex: Ticket criado automaticamente"
                value={config.ticketTitle || ''}
                onChange={(e) => setConfig({ ...config, ticketTitle: e.target.value })}
                data-testid="ticket-title-input"
              />
            </div>
            <div>
              <Label htmlFor="ticketPriority">Prioridade do ticket</Label>
              <Select 
                value={config.priority || 'medium'} 
                onValueChange={(value) => setConfig({ ...config, priority: value })}
              >
                <SelectTrigger data-testid="ticket-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notificationRecipients">Destinatários (emails separados por vírgula)</Label>
              <Input
                id="notificationRecipients"
                placeholder="ex: admin@empresa.com, suporte@empresa.com"
                value={config.recipient || ''}
                onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                data-testid="notification-recipients-input"
              />
            </div>
            <div>
              <Label htmlFor="notificationMessage">Mensagem da notificação</Label>
              <Textarea
                id="notificationMessage"
                placeholder="Nova mensagem recebida que requer atenção..."
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={3}
                data-testid="notification-message-input"
              />
            </div>
          </div>
        );
      case 'add_tags':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="ex: urgente, suporte, cliente-vip"
                value={config.tags || ''}
                onChange={(e) => setConfig({ ...config, tags: e.target.value })}
                data-testid="tags-input"
              />
            </div>
          </div>
        );
      case 'forward_message':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetAgent">Agente de destino</Label>
              <Input
                id="targetAgent"
                placeholder="ex: suporte@empresa.com"
                value={config.recipient || ''}
                onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                data-testid="target-agent-input"
              />
            </div>
            <div>
              <Label htmlFor="forwardNote">Nota para encaminhamento (opcional)</Label>
              <Textarea
                id="forwardNote"
                placeholder="Mensagem encaminhada automaticamente devido a..."
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={2}
                data-testid="forward-note-input"
              />
            </div>
          </div>
        );
      case 'assign_agent':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="agentEmail">Email do agente</Label>
              <Input
                id="agentEmail"
                placeholder="ex: joao.silva@empresa.com"
                value={config.recipient || ''}
                onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                data-testid="agent-email-input"
              />
            </div>
            <div>
              <Label htmlFor="assignmentReason">Motivo da atribuição</Label>
              <select
                id="assignmentReason"
                value={config.assignmentReason || 'expertise'}
                onChange={(e) => setConfig({ ...config, assignmentReason: e.target.value })}
                className="w-full p-2 border rounded-md"
                data-testid="assignment-reason-select"
              >
                <option value="expertise">Especialidade técnica</option>
                <option value="availability">Disponibilidade</option>
                <option value="workload">Balanceamento de carga</option>
                <option value="language">Idioma</option>
                <option value="client">Relacionamento com cliente</option>
              </select>
            </div>
          </div>
        );
      case 'mark_priority':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="priorityLevel">Nível de prioridade</Label>
              <select
                id="priorityLevel"
                value={config.priority || 'high'}
                onChange={(e) => setConfig({ ...config, priority: e.target.value })}
                className="w-full p-2 border rounded-md"
                data-testid="priority-level-select"
              >
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <Label htmlFor="priorityReason">Motivo da prioridade</Label>
              <Input
                id="priorityReason"
                placeholder="ex: Cliente VIP, problema crítico, SLA..."
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                data-testid="priority-reason-input"
              />
            </div>
          </div>
        );
      case 'archive':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="archiveFolder">Pasta de arquivo</Label>
              <select
                id="archiveFolder"
                value={config.archiveFolder || 'general'}
                onChange={(e) => setConfig({ ...config, archiveFolder: e.target.value })}
                className="w-full p-2 border rounded-md"
                data-testid="archive-folder-select"
              >
                <option value="general">Arquivo geral</option>
                <option value="resolved">Resolvidos</option>
                <option value="spam">Spam</option>
                <option value="auto-reply">Respostas automáticas</option>
                <option value="low-priority">Baixa prioridade</option>
              </select>
            </div>
            <div>
              <Label htmlFor="archiveDelay">Arquivar após (dias)</Label>
              <Input
                id="archiveDelay"
                type="number"
                min="0"
                max="365"
                value={config.archiveDelay || '7'}
                onChange={(e) => setConfig({ ...config, archiveDelay: e.target.value })}
                data-testid="archive-delay-input"
              />
            </div>
            <div>
              <Label htmlFor="archiveNote">Nota de arquivamento (opcional)</Label>
              <Textarea
                id="archiveNote"
                placeholder="Arquivado automaticamente por..."
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={2}
                data-testid="archive-note-input"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-500">Tipo de ação não reconhecido</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderConfigFields()}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(config)} data-testid="save-action-config">
          Salvar
        </Button>
      </div>
    </div>
  );
}