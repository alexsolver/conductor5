import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Save, 
  ArrowLeft, 
  Plus, 
  Play,
  Settings,
  TestTube,
  Zap,
  Target,
  Filter,
  MessageSquare,
  Tag,
  UserCheck,
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronDown,
  Mail,
  Clock,
  User,
  Hash,
  X
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Trigger {
  id: string;
  category: string;
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  config?: any;
}

interface Action {
  id: string;
  category: string;
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  config?: any;
}

const AVAILABLE_TRIGGERS: Trigger[] = [
  {
    id: 'email-received',
    category: 'Email',
    type: 'email_received',
    name: 'Email Recebido',
    description: 'Disparado quando um novo email é recebido',
    icon: Mail
  },
  {
    id: 'keyword-match',
    category: 'Conteúdo',
    type: 'keyword_match',
    name: 'Palavra-chave Encontrada',
    description: 'Disparado quando palavras-chave específicas são encontradas',
    icon: Hash
  },
  {
    id: 'sender-match',
    category: 'Remetente',
    type: 'sender_match',
    name: 'Remetente Específico',
    description: 'Disparado para emails de remetentes específicos',
    icon: User
  },
  {
    id: 'time-based',
    category: 'Tempo',
    type: 'time_based',
    name: 'Baseado em Tempo',
    description: 'Disparado em horários específicos',
    icon: Clock
  }
];

const AVAILABLE_ACTIONS: Action[] = [
  {
    id: 'create-ticket',
    category: 'Tickets',
    type: 'create_ticket',
    name: 'Criar Ticket',
    description: 'Cria um novo ticket no sistema',
    icon: Target
  },
  {
    id: 'assign-user',
    category: 'Atribuição',
    type: 'assign_user',
    name: 'Atribuir Usuário',
    description: 'Atribui a mensagem a um usuário específico',
    icon: UserCheck
  },
  {
    id: 'add-tag',
    category: 'Organização',
    type: 'add_tag',
    name: 'Adicionar Tag',
    description: 'Adiciona tags para categorização',
    icon: Tag
  },
  {
    id: 'send-reply',
    category: 'Resposta',
    type: 'send_reply',
    name: 'Enviar Resposta',
    description: 'Envia uma resposta automática',
    icon: MessageSquare
  }
];

const STEPS = [
  { id: 1, name: 'Detalhes', description: 'Informações básicas da regra' },
  { id: 2, name: 'Condições', description: 'Quando a regra deve ser disparada' },
  { id: 3, name: 'Ações', description: 'O que deve acontecer' },
  { id: 4, name: 'Revisar & Testar', description: 'Validação e teste final' }
];

export default function RuleComposer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const isEditing = !!id;

  // Estado principal da regra
  const [currentStep, setCurrentStep] = useState(1);
  const [rule, setRule] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 1,
    triggers: [] as any[],
    actions: [] as any[]
  });

  // Estados da interface
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Email', 'Tickets']));
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [testMessages, setTestMessages] = useState<any[]>([]);

  // Buscar regra existente se estiver editando
  const { data: existingRule, isLoading: loadingRule } = useQuery({
    queryKey: ['automation-rule', id],
    enabled: isEditing && !!user && !!id,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/omnibridge/automation-rules/${id}`);
      return await response.json();
    }
  });

  // Buscar mensagens para teste
  const { data: messagesForTest } = useQuery({
    queryKey: ['omnibridge-messages-sample'],
    enabled: !!user,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/omnibridge/messages?limit=10');
      const result = await response.json();
      return result.messages || [];
    }
  });

  // Mutation para salvar regra
  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `/api/omnibridge/automation-rules/${id}` 
        : '/api/omnibridge/automation-rules';
      
      const response = await apiRequest(method, url, ruleData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: '✅ Regra salva',
        description: isEditing ? 'Regra atualizada com sucesso!' : 'Regra criada com sucesso!'
      });
      setLocation('/omnibridge/automation-rules');
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erro ao salvar',
        description: error.message || 'Não foi possível salvar a regra'
      });
    }
  });

  // Carregar regra existente
  useEffect(() => {
    if (existingRule?.data) {
      setRule({
        name: existingRule.data.name || '',
        description: existingRule.data.description || '',
        enabled: existingRule.data.enabled ?? true,
        priority: existingRule.data.priority || 1,
        triggers: existingRule.data.triggers || [],
        actions: existingRule.data.actions || []
      });
    }
  }, [existingRule]);

  // Filtrar triggers e actions por categoria e busca
  const filteredTriggers = useMemo(() => {
    return AVAILABLE_TRIGGERS.filter(trigger => 
      trigger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trigger.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredActions = useMemo(() => {
    return AVAILABLE_ACTIONS.filter(action => 
      action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Agrupar por categoria
  const triggersByCategory = useMemo(() => {
    const grouped = filteredTriggers.reduce((acc, trigger) => {
      if (!acc[trigger.category]) acc[trigger.category] = [];
      acc[trigger.category].push(trigger);
      return acc;
    }, {} as Record<string, Trigger[]>);
    return grouped;
  }, [filteredTriggers]);

  const actionsByCategory = useMemo(() => {
    const grouped = filteredActions.reduce((acc, action) => {
      if (!acc[action.category]) acc[action.category] = [];
      acc[action.category].push(action);
      return acc;
    }, {} as Record<string, Action[]>);
    return grouped;
  }, [filteredActions]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const addTrigger = (trigger: Trigger) => {
    const newTrigger = {
      id: `trigger_${Date.now()}`,
      type: trigger.type,
      config: {}
    };
    setRule(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }));
    setSelectedTrigger(trigger);
  };

  const addAction = (action: Action) => {
    const newAction = {
      id: `action_${Date.now()}`,
      type: action.type,
      config: {}
    };
    setRule(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
    setSelectedAction(action);
  };

  const removeTrigger = (index: number) => {
    setRule(prev => ({
      ...prev,
      triggers: prev.triggers.filter((_, i) => i !== index)
    }));
  };

  const removeAction = (index: number) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2:
        return rule.name.trim() !== '';
      case 3:
        return rule.triggers.length > 0;
      case 4:
        return rule.actions.length > 0;
      default:
        return true;
    }
  };

  const handleSave = () => {
    if (!rule.name.trim()) {
      toast({
        title: '❌ Nome obrigatório',
        description: 'Por favor, informe um nome para a regra'
      });
      return;
    }

    if (rule.triggers.length === 0) {
      toast({
        title: '❌ Condições obrigatórias',
        description: 'Por favor, adicione pelo menos uma condição'
      });
      return;
    }

    if (rule.actions.length === 0) {
      toast({
        title: '❌ Ações obrigatórias',
        description: 'Por favor, adicione pelo menos uma ação'
      });
      return;
    }

    saveRuleMutation.mutate(rule);
  };

  if (loadingRule) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando regra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/omnibridge/automation-rules')}
              data-testid="button-voltar"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Editar Regra' : 'Nova Regra de Automação'}
              </h1>
              <p className="text-muted-foreground">
                Configure quando e como as mensagens devem ser processadas automaticamente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/omnibridge/automation-rules')}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveRuleMutation.isPending}
              data-testid="button-salvar"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveRuleMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mt-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : canProceedToStep(step.id)
                    ? 'hover:bg-muted'
                    : 'text-muted-foreground cursor-not-allowed'
                }`}
                disabled={!canProceedToStep(step.id) && currentStep < step.id}
                data-testid={`step-${step.id}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === step.id
                    ? 'bg-background text-foreground'
                    : currentStep > step.id
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.id}
                </div>
                <div>
                  <div className="font-medium">{step.name}</div>
                  <div className="text-xs opacity-70">{step.description}</div>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal - Layout de 3 Painéis */}
      <div className="flex h-[calc(100vh-160px)]">
        
        {/* Painel Esquerdo - Palette */}
        <div className="w-80 border-r bg-muted/30">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar gatilhos e ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-buscar-palette"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="p-4 space-y-4">
              
              {/* Triggers */}
              {(currentStep === 2 || currentStep === 4) && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-purple-700 dark:text-purple-300">
                    <Zap className="h-4 w-4 inline mr-2" />
                    Gatilhos (Quando)
                  </h3>
                  {Object.entries(triggersByCategory).map(([category, triggers]) => (
                    <div key={category} className="mb-3">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium hover:bg-muted/50 rounded"
                        data-testid={`toggle-categoria-${category.toLowerCase()}`}
                      >
                        <span>{category}</span>
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      
                      {expandedCategories.has(category) && (
                        <div className="ml-2 mt-2 space-y-2">
                          {triggers.map((trigger) => {
                            const Icon = trigger.icon;
                            return (
                              <button
                                key={trigger.id}
                                onClick={() => addTrigger(trigger)}
                                className="w-full p-3 text-left bg-background hover:bg-muted rounded-lg border transition-colors"
                                data-testid={`trigger-${trigger.id}`}
                              >
                                <div className="flex items-start gap-3">
                                  <Icon className="h-4 w-4 mt-0.5 text-purple-600" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{trigger.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {trigger.description}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {(currentStep === 3 || currentStep === 4) && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-blue-700 dark:text-blue-300">
                    <Target className="h-4 w-4 inline mr-2" />
                    Ações (O que fazer)
                  </h3>
                  {Object.entries(actionsByCategory).map(([category, actions]) => (
                    <div key={category} className="mb-3">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium hover:bg-muted/50 rounded"
                        data-testid={`toggle-categoria-${category.toLowerCase()}`}
                      >
                        <span>{category}</span>
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      
                      {expandedCategories.has(category) && (
                        <div className="ml-2 mt-2 space-y-2">
                          {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.id}
                                onClick={() => addAction(action)}
                                className="w-full p-3 text-left bg-background hover:bg-muted rounded-lg border transition-colors"
                                data-testid={`action-${action.id}`}
                              >
                                <div className="flex items-start gap-3">
                                  <Icon className="h-4 w-4 mt-0.5 text-blue-600" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{action.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {action.description}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Painel Central - Rule Canvas */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              
              {/* Step 1 - Detalhes */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="rule-name">Nome da Regra *</Label>
                        <Input
                          id="rule-name"
                          value={rule.name}
                          onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Criar tickets para emails de suporte"
                          data-testid="input-nome-regra"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="rule-description">Descrição</Label>
                        <Textarea
                          id="rule-description"
                          value={rule.description}
                          onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o que esta regra faz e quando ela deve ser executada"
                          rows={3}
                          data-testid="textarea-descricao-regra"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="rule-priority">Prioridade</Label>
                          <Input
                            id="rule-priority"
                            type="number"
                            min="1"
                            max="10"
                            value={rule.priority}
                            onChange={(e) => setRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                            data-testid="input-prioridade-regra"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            1 = Menor prioridade, 10 = Maior prioridade
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="rule-enabled"
                            checked={rule.enabled}
                            onChange={(e) => setRule(prev => ({ ...prev, enabled: e.target.checked }))}
                            data-testid="checkbox-regra-ativa"
                          />
                          <Label htmlFor="rule-enabled">Regra ativa</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 2 - Condições */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-600" />
                        Condições (Quando executar)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {rule.triggers.length === 0 ? (
                        <div className="text-center py-8">
                          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Adicione gatilhos usando o painel da esquerda
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Os gatilhos determinam quando esta regra deve ser executada
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rule.triggers.map((trigger, index) => {
                            const triggerDef = AVAILABLE_TRIGGERS.find(t => t.type === trigger.type);
                            const Icon = triggerDef?.icon || Zap;
                            
                            return (
                              <div key={trigger.id} className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-purple-600" />
                                    <div>
                                      <div className="font-medium">{triggerDef?.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {triggerDef?.description}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTrigger(index)}
                                    data-testid={`remove-trigger-${index}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 3 - Ações */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Ações (O que fazer)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {rule.actions.length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Adicione ações usando o painel da esquerda
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            As ações determinam o que acontece quando a regra é disparada
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rule.actions.map((action, index) => {
                            const actionDef = AVAILABLE_ACTIONS.find(a => a.type === action.type);
                            const Icon = actionDef?.icon || Target;
                            
                            return (
                              <div key={action.id} className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-blue-600" />
                                    <div>
                                      <div className="font-medium">{actionDef?.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {actionDef?.description}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAction(index)}
                                    data-testid={`remove-action-${index}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 4 - Revisar & Testar */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        Resumo da Regra
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium">Nome:</h4>
                        <p className="text-muted-foreground">{rule.name || 'Nome não definido'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Descrição:</h4>
                        <p className="text-muted-foreground">{rule.description || 'Sem descrição'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">Prioridade:</h4>
                          <Badge variant="outline">{rule.priority}</Badge>
                        </div>
                        <div>
                          <h4 className="font-medium">Status:</h4>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">Gatilhos ({rule.triggers.length}):</h4>
                        <div className="space-y-2 mt-2">
                          {rule.triggers.map((trigger, index) => {
                            const triggerDef = AVAILABLE_TRIGGERS.find(t => t.type === trigger.type);
                            return (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Zap className="h-4 w-4 text-purple-600" />
                                <span>{triggerDef?.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">Ações ({rule.actions.length}):</h4>
                        <div className="space-y-2 mt-2">
                          {rule.actions.map((action, index) => {
                            const actionDef = AVAILABLE_ACTIONS.find(a => a.type === action.type);
                            return (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Target className="h-4 w-4 text-blue-600" />
                                <span>{actionDef?.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Navegação dos Steps */}
          <div className="border-t p-4 bg-background">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                data-testid="button-step-anterior"
              >
                Anterior
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  disabled={!canProceedToStep(currentStep + 1)}
                  data-testid="button-step-proximo"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saveRuleMutation.isPending}
                  data-testid="button-finalizar"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveRuleMutation.isPending ? 'Salvando...' : 'Finalizar'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Painel Direito - Live Preview */}
        <div className="w-80 border-l bg-muted/30">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm">Live Preview</h3>
            <p className="text-xs text-muted-foreground">
              Teste sua regra em tempo real
            </p>
          </div>

          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="p-4 space-y-4">
              {currentStep === 4 && messagesForTest?.length > 0 ? (
                <div>
                  <h4 className="font-medium text-sm mb-3">Testar com mensagens reais:</h4>
                  <div className="space-y-2">
                    {messagesForTest.slice(0, 5).map((message: any, index: number) => (
                      <div key={index} className="p-3 bg-background border rounded-lg text-sm">
                        <div className="font-medium truncate">{message.subject || 'Sem assunto'}</div>
                        <div className="text-muted-foreground text-xs">
                          De: {message.sender || 'Desconhecido'}
                        </div>
                        <div className="text-muted-foreground text-xs mt-1 line-clamp-2">
                          {message.content?.substring(0, 100)}...
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Seria processada
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Complete a regra para ver o preview
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

      </div>
    </div>
  );
}