import React, { useState, useRef } from 'react';
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

export default function AutomationRuleBuilder({ 
  isOpen, 
  onClose, 
  initialMessage, 
  onSave 
}: AutomationRuleBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [rule, setRule] = useState<AutomationRule>({
    name: '',
    description: '',
    enabled: true,
    triggers: [],
    actions: [],
    priority: 1
  });

  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showTriggerConfig, setShowTriggerConfig] = useState(false);
  const [showActionConfig, setShowActionConfig] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Save rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: (ruleData: AutomationRule) =>
      apiRequest('/api/omnibridge/automation-rules', {
        method: 'POST',
        body: JSON.stringify(ruleData)
      }),
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Regra de automação criada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/automation-rules'] });
      onSave?.(rule);
      onClose();
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao criar regra de automação', variant: 'destructive' });
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

  const handleSave = () => {
    if (!rule.name.trim()) {
      toast({ title: 'Erro', description: 'Nome da regra é obrigatório', variant: 'destructive' });
      return;
    }
    if (rule.triggers.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um gatilho', variant: 'destructive' });
      return;
    }
    if (rule.actions.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos uma ação', variant: 'destructive' });
      return;
    }

    saveRuleMutation.mutate(rule);
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md space-y-2">
                  <Input
                    placeholder="Nome da regra..."
                    value={rule.name}
                    onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                    className="font-medium"
                    data-testid="rule-name"
                  />
                  <Input
                    placeholder="Descrição (opcional)..."
                    value={rule.description}
                    onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                    className="text-sm"
                    data-testid="rule-description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="rule-enabled" className="text-sm">Ativa</Label>
                  <Switch
                    id="rule-enabled"
                    checked={rule.enabled}
                    onCheckedChange={(enabled) => setRule(prev => ({ ...prev, enabled }))}
                    data-testid="rule-enabled"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsPreview(!isPreview)}
                    data-testid="preview-toggle"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreview ? 'Editar' : 'Visualizar'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveRuleMutation.isPending}
                    data-testid="save-rule"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveRuleMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900" ref={canvasRef}>
              {isPreview ? (
                /* Preview Mode */
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
              ) : (
                /* Edit Mode */
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
              )}
            </div>
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
      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-500">Configuração específica será implementada</p>
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
                value={config.replyMessage || ''}
                onChange={(e) => setConfig({ ...config, replyMessage: e.target.value })}
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
                value={config.ticketPriority || 'medium'} 
                onValueChange={(value) => setConfig({ ...config, ticketPriority: value })}
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
                value={config.notificationRecipients || ''}
                onChange={(e) => setConfig({ ...config, notificationRecipients: e.target.value })}
                data-testid="notification-recipients-input"
              />
            </div>
            <div>
              <Label htmlFor="notificationMessage">Mensagem da notificação</Label>
              <Textarea
                id="notificationMessage"
                placeholder="Nova mensagem recebida que requer atenção..."
                value={config.notificationMessage || ''}
                onChange={(e) => setConfig({ ...config, notificationMessage: e.target.value })}
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
      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-500">Configuração específica será implementada</p>
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