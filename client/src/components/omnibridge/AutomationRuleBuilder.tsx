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
  Upload
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

  // State for the unified mode toggle
  const [isUnifiedMode, setIsUnifiedMode] = useState(false); 

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

  // Mock saving state for demonstration
  const [saving, setSaving] = useState(false);

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
      <DialogContent className="max-w-6xl h-[90vh] p-0" data-testid="automation-rule-builder">
        <DialogHeader className="sr-only">
          <DialogTitle>Criador de Regras de Automação</DialogTitle>
          <DialogDescription>Interface para criar e configurar regras de automação de mensagens</DialogDescription>
        </DialogHeader>
        <div className="flex h-full">
          {/* Left Sidebar - Templates */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Criador de Regras
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Arraste e solte para criar automações
              </p>
            </div>

            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="p-4 space-y-6">
                {/* Triggers Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Gatilhos (QUANDO)
                  </h4>
                  <div className="space-y-2">
                    {triggerTemplates.map((template, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                        onClick={() => addTrigger(template)}
                        data-testid={`trigger-template-${template.type}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded ${template.color} text-white`}>
                              <template.icon className="h-3 w-3" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {template.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Actions Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Ações (ENTÃO)
                  </h4>
                  <div className="space-y-2">
                    {actionTemplates.map((template, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                        onClick={() => addAction(template)}
                        data-testid={`action-template-${template.type}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded ${template.color} text-white`}>
                              <template.icon className="h-3 w-3" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {template.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {existingRule ? 'Editar Regra' : 'Nova Regra de Automação'}
            </h1>
            <p className="text-sm text-gray-500">
              Configure gatilhos e ações para automatizar o atendimento
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isUnifiedMode}
              onCheckedChange={setIsUnifiedMode}
              id="unified-mode"
            />
            <Label htmlFor="unified-mode" className="text-sm font-medium">
              Modo Fluxo Visual
            </Label>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Regra'}
          </Button>
        </div>
      </div>

            {/* Tabs */}
            <Tabs defaultValue="config" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            {isUnifiedMode && <TabsTrigger value="flow">Fluxo Visual</TabsTrigger>}
            <TabsTrigger value="preview">Visualização</TabsTrigger>
            <TabsTrigger value="test">Teste</TabsTrigger>
          </TabsList>
              <TabsContent value="config" className="p-6 bg-gray-50 dark:bg-gray-900 h-[calc(100%-60px)] overflow-y-auto">
                {/* Config Content */}
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Getting Started */}
                  {rule.triggers.length === 0 && rule.actions.length === 0 && (
                    <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
                      <CardContent className="p-8 text-center">
                        <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Comece criando sua automação
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          1. Adicione gatilhos (QUANDO) da barra lateral esquerda<br />
                          2. Adicione ações (ENTÃO) que devem ser executadas<br />
                          3. Configure cada item clicando nele
                        </p>
                        <div className="flex justify-center gap-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Zap className="h-3 w-3 mr-1" />
                            Gatilhos definem QUANDO
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Settings className="h-3 w-3 mr-1" />
                            Ações definem O QUE fazer
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Triggers Section */}
                  {rule.triggers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          Gatilhos (QUANDO)
                        </CardTitle>
                        <CardDescription>
                          Condições que ativam esta automação
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rule.triggers.map((trigger) => (
                            <Card 
                              key={trigger.id} 
                              className="cursor-pointer hover:shadow-md transition-all border-blue-200 dark:border-blue-700"
                              onClick={() => openTriggerConfig(trigger)}
                              data-testid={`trigger-${trigger.id}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded ${trigger.color} text-white`}>
                                      <trigger.icon className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {trigger.name}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTrigger(trigger.id);
                                    }}
                                    data-testid={`remove-trigger-${trigger.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {trigger.description}
                                </p>
                                {Object.keys(trigger.config).length > 0 && (
                                  <Badge variant="secondary" className="mt-2">
                                    Configurado
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions Section */}
                  {rule.actions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-green-600" />
                          Ações (ENTÃO)
                        </CardTitle>
                        <CardDescription>
                          O que fazer quando os gatilhos forem ativados
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rule.actions.map((action) => (
                            <Card 
                              key={action.id} 
                              className="cursor-pointer hover:shadow-md transition-all border-green-200 dark:border-green-700"
                              onClick={() => openActionConfig(action)}
                              data-testid={`action-${action.id}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded ${action.color} text-white`}>
                                      <action.icon className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {action.name}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeAction(action.id);
                                    }}
                                    data-testid={`remove-action-${action.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {action.description}
                                </p>
                                {Object.keys(action.config).length > 0 && (
                                  <Badge variant="secondary" className="mt-2">
                                    Configurado
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Flow Tab */}
              {isUnifiedMode && (
                <TabsContent value="flow" className="p-6 bg-gray-50 dark:bg-gray-900 h-[calc(100%-60px)] overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Workflow className="h-5 w-5" />
                          Fluxo Visual da Regra
                        </CardTitle>
                        <CardDescription>
                          Configure a sequência de gatilhos e ações de forma visual
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center space-y-6">
                          {/* Triggers Section */}
                          <div className="w-full">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Gatilhos (QUANDO)</h4>
                            <div className="flex flex-wrap gap-4">
                              {rule.triggers.map((trigger) => (
                                <Card 
                                  key={trigger.id} 
                                  className="min-w-[200px] border-2 border-dashed"
                                  style={{ borderColor: trigger.color.split('-')[1] || 'gray' }}
                                  onClick={() => openTriggerConfig(trigger)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={`p-2 rounded ${trigger.color} text-white`}>
                                        <trigger.icon className="h-5 w-5" />
                                      </div>
                                      <span className="font-medium text-gray-900 dark:text-gray-100">{trigger.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{trigger.description}</p>
                                    {Object.keys(trigger.config).length > 0 && <Badge variant="secondary" className="mt-2">Configurado</Badge>}
                                  </CardContent>
                                </Card>
                              ))}
                              {rule.triggers.length === 0 && <p className="text-gray-500">Nenhum gatilho adicionado.</p>}
                            </div>
                          </div>

                          {/* Arrows */}
                          {rule.triggers.length > 0 && rule.actions.length > 0 && (
                            <ArrowRight className="h-8 w-8 text-gray-400 transform rotate-90 md:rotate-0" />
                          )}

                          {/* Actions Section */}
                          <div className="w-full">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ações (ENTÃO)</h4>
                            <div className="flex flex-wrap gap-4">
                              {rule.actions.map((action) => (
                                <Card 
                                  key={action.id} 
                                  className="min-w-[200px] border-2 border-dashed"
                                  style={{ borderColor: action.color.split('-')[1] || 'gray' }}
                                  onClick={() => openActionConfig(action)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={`p-2 rounded ${action.color} text-white`}>
                                        <action.icon className="h-5 w-5" />
                                      </div>
                                      <span className="font-medium text-gray-900 dark:text-gray-100">{action.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{action.description}</p>
                                    {Object.keys(action.config).length > 0 && <Badge variant="secondary" className="mt-2">Configurado</Badge>}
                                  </CardContent>
                                </Card>
                              ))}
                              {rule.actions.length === 0 && <p className="text-gray-500">Nenhuma ação adicionada.</p>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {/* Preview Tab */}
              <TabsContent value="preview" className="p-6 bg-gray-50 dark:bg-gray-900 h-[calc(100%-60px)] overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        Visualização da Regra
                      </CardTitle>
                      <CardDescription>
                        Como esta regra funcionará na prática
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Rule Summary */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            {rule.name || 'Nova Regra'}
                          </h4>
                          {rule.description && (
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              {rule.description}
                            </p>
                          )}
                        </div>

                        {/* Flow Visualization */}
                        <div className="flex items-center justify-center space-x-4">
                          {/* Triggers */}
                          <div className="text-center">
                            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-2">
                              <Zap className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              QUANDO
                            </p>
                            <div className="mt-2 space-y-1">
                              {rule.triggers.map((trigger) => (
                                <Badge key={trigger.id} variant="outline" className="block">
                                  {trigger.name}
                                </Badge>
                              ))}
                              {rule.triggers.length === 0 && (
                                <p className="text-xs text-gray-500">Nenhum gatilho</p>
                              )}
                            </div>
                          </div>

                          <ArrowRight className="h-6 w-6 text-gray-400" />

                          {/* Actions */}
                          <div className="text-center">
                            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-2">
                              <Settings className="h-8 w-8 mx-auto text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              ENTÃO
                            </p>
                            <div className="mt-2 space-y-1">
                              {rule.actions.map((action) => (
                                <Badge key={action.id} variant="outline" className="block">
                                  {action.name}
                                </Badge>
                              ))}
                              {rule.actions.length === 0 && (
                                <p className="text-xs text-gray-500">Nenhuma ação</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Example Scenario */}
                        {rule.triggers.length > 0 && rule.actions.length > 0 && (
                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              Exemplo de funcionamento:
                            </h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              Quando uma mensagem for recebida e atender aos critérios definidos pelos gatilhos, 
                              o sistema automaticamente executará as ações configuradas.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Test Tab */}
              <TabsContent value="test" className="p-6 bg-gray-50 dark:bg-gray-900 h-[calc(100%-60px)] overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Testar Regra de Automação</CardTitle>
                      <CardDescription>Simule uma mensagem para testar sua regra</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Label htmlFor="testMessage">Mensagem de teste</Label>
                        <Textarea
                          id="testMessage"
                          placeholder="Digite uma mensagem para testar..."
                          rows={5}
                          className="resize-none"
                        />
                        <Button onClick={() => toast({ title: 'Funcionalidade de teste em desenvolvimento!' })}>
                          <Play className="h-4 w-4 mr-2" />
                          Executar Teste
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

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
      </DialogContent>
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