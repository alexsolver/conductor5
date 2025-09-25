import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Search, 
  Play, 
  Save, 
  Check,
  Settings,
  Zap,
  MessageCircle,
  AlertTriangle,
  Clock,
  User,
  Hash,
  Target,
  Mail,
  Phone,
  Bell
} from 'lucide-react';

interface Condition {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  config: Record<string, any>;
  category: string;
}

interface Action {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  config: Record<string, any>;
  category: string;
}

interface Rule {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: Condition[];
  actions: Action[];
}

// Templates organizados por categoria
const conditionTemplates = {
  "Conteúdo": [
    {
      type: 'keyword',
      name: 'Palavra-chave',
      description: 'Ativa quando detecta palavras específicas',
      icon: Hash,
      color: 'bg-blue-500',
      category: 'Conteúdo'
    },
    {
      type: 'ai_analysis',
      name: 'Análise de IA',
      description: 'Usa IA para analisar sentimento e intenção',
      icon: Settings,
      color: 'bg-purple-500',
      category: 'Conteúdo'
    }
  ],
  "Canal": [
    {
      type: 'channel',
      name: 'Canal específico',
      description: 'Ativa para mensagens de um canal específico',
      icon: MessageCircle,
      color: 'bg-green-500',
      category: 'Canal'
    }
  ],
  "Prioridade": [
    {
      type: 'priority',
      name: 'Prioridade alta',
      description: 'Ativa para mensagens urgentes',
      icon: AlertTriangle,
      color: 'bg-red-500',
      category: 'Prioridade'
    }
  ],
  "Tempo": [
    {
      type: 'time',
      name: 'Horário específico',
      description: 'Ativa em horários determinados',
      icon: Clock,
      color: 'bg-orange-500',
      category: 'Tempo'
    }
  ],
  "Remetente": [
    {
      type: 'sender',
      name: 'Remetente específico',
      description: 'Ativa para remetentes específicos',
      icon: User,
      color: 'bg-indigo-500',
      category: 'Remetente'
    }
  ]
};

const actionTemplates = {
  "Resposta": [
    {
      type: 'auto_reply',
      name: 'Resposta automática',
      description: 'Envia resposta pré-definida',
      icon: MessageCircle,
      color: 'bg-blue-500',
      category: 'Resposta'
    }
  ],
  "Ticket": [
    {
      type: 'create_ticket',
      name: 'Criar ticket',
      description: 'Cria ticket automaticamente',
      icon: Target,
      color: 'bg-green-500',
      category: 'Ticket'
    }
  ],
  "Notificação": [
    {
      type: 'send_notification',
      name: 'Enviar notificação',
      description: 'Notifica equipe ou usuário específico',
      icon: Bell,
      color: 'bg-yellow-500',
      category: 'Notificação'
    }
  ],
  "Encaminhamento": [
    {
      type: 'forward_message',
      name: 'Encaminhar mensagem',
      description: 'Encaminha para outro canal ou agente',
      icon: Mail,
      color: 'bg-purple-500',
      category: 'Encaminhamento'
    }
  ],
  "Organização": [
    {
      type: 'add_tags',
      name: 'Adicionar tags',
      description: 'Adiciona tags para organização',
      icon: Hash,
      color: 'bg-cyan-500',
      category: 'Organização'
    },
    {
      type: 'assign_agent',
      name: 'Atribuir agente',
      description: 'Atribui automaticamente a um agente',
      icon: User,
      color: 'bg-indigo-500',
      category: 'Organização'
    },
    {
      type: 'mark_priority',
      name: 'Marcar prioridade',
      description: 'Define nível de prioridade',
      icon: AlertTriangle,
      color: 'bg-red-500',
      category: 'Organização'
    },
    {
      type: 'archive',
      name: 'Arquivar',
      description: 'Arquiva mensagem automaticamente',
      icon: Target,
      color: 'bg-gray-500',
      category: 'Organização'
    }
  ]
};

const steps = [
  { id: 1, name: 'Detalhes', description: 'Nome e configurações básicas' },
  { id: 2, name: 'Condições', description: 'Quando a regra deve ser ativada' },
  { id: 3, name: 'Ações', description: 'O que fazer quando ativada' },
  { id: 4, name: 'Revisar', description: 'Testar e finalizar regra' }
];

export default function RuleComposer() {
  const [, params] = useRoute('/omnibridge/automation-rules/:action/:id?');
  const isEditing = params?.action === 'edit';
  const ruleId = params?.id;

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rule, setRule] = useState<Rule>({
    name: '',
    description: 'Regra criada automaticamente',
    enabled: true,
    priority: 1,
    conditions: [],
    actions: []
  });

  // Filtragem para o Palette
  const filterTemplates = (templates: any, query: string) => {
    if (!query) return templates;
    const filtered: any = {};
    Object.keys(templates).forEach(category => {
      const items = templates[category].filter((item: any) => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      if (items.length > 0) {
        filtered[category] = items;
      }
    });
    return filtered;
  };

  const filteredConditions = filterTemplates(conditionTemplates, searchQuery);
  const filteredActions = filterTemplates(actionTemplates, searchQuery);

  const addCondition = (template: any) => {
    const newCondition: Condition = {
      id: `condition_${Date.now()}`,
      ...template,
      config: {}
    };
    setRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
    if (currentStep === 1) setCurrentStep(2);
  };

  const addAction = (template: any) => {
    const newAction: Action = {
      id: `action_${Date.now()}`,
      ...template,
      config: {}
    };
    setRule(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
    if (currentStep <= 2) setCurrentStep(3);
  };

  const removeCondition = (id: string) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== id)
    }));
  };

  const removeAction = (id: string) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id)
    }));
  };

  const canProceed = (step: number) => {
    switch (step) {
      case 1: return rule.name.trim() !== '';
      case 2: return rule.conditions.length > 0;
      case 3: return rule.actions.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/omnibridge/automation-rules">
              <Button variant="ghost" size="sm" data-testid="back-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">
                {isEditing ? 'Editar Automação' : 'Nova Automação'}
              </h1>
              <p className="text-sm text-gray-500">
                Configure gatilhos e ações para automatizar suas operações
              </p>
            </div>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  } ${
                    canProceed(step.id - 1) || currentStep > step.id 
                      ? 'cursor-pointer hover:bg-blue-700' 
                      : ''
                  }`}
                  onClick={() => {
                    if (canProceed(step.id - 1) || currentStep > step.id) {
                      setCurrentStep(step.id);
                    }
                  }}
                  data-testid={`step-${step.id}`}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-2 text-sm">
                  <div className="font-medium text-gray-700">{step.name}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Palette */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar gatilhos e ações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="search-input"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Conditions Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Gatilhos (Quando)
                </h3>
                <div className="space-y-3">
                  {Object.keys(filteredConditions).map(category => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {filteredConditions[category].map((template: any) => {
                          const IconComponent = template.icon;
                          return (
                            <Card 
                              key={template.type}
                              className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200 p-3"
                              onClick={() => addCondition(template)}
                              data-testid={`condition-template-${template.type}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${template.color}`}>
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{template.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Actions Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  Ações (O que fazer)
                </h3>
                <div className="space-y-3">
                  {Object.keys(filteredActions).map(category => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {filteredActions[category].map((template: any) => {
                          const IconComponent = template.icon;
                          return (
                            <Card 
                              key={template.type}
                              className="cursor-pointer transition-all hover:shadow-md hover:border-green-200 p-3"
                              onClick={() => addAction(template)}
                              data-testid={`action-template-${template.type}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${template.color}`}>
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{template.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200">
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-4xl mx-auto space-y-8">
              
              {/* Step 1: Details */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Automação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="rule-name">Nome da automação *</Label>
                      <Input
                        id="rule-name"
                        placeholder="Ex: Responder tickets urgentes automaticamente"
                        value={rule.name}
                        onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                        data-testid="rule-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rule-description">Descrição</Label>
                      <Input
                        id="rule-description"
                        placeholder="Descrição opcional da automação"
                        value={rule.description}
                        onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                        data-testid="rule-description-input"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="rule-enabled"
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => setRule(prev => ({ ...prev, enabled }))}
                        data-testid="rule-enabled-switch"
                      />
                      <Label htmlFor="rule-enabled">Ativar automação imediatamente</Label>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={() => setCurrentStep(2)}
                        disabled={!canProceed(1)}
                        data-testid="next-to-conditions"
                      >
                        Próximo: Definir Condições
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Conditions */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Condições (Quando ativar)</CardTitle>
                    <p className="text-sm text-gray-500">
                      Defina quando esta automação deve ser executada. Clique nos gatilhos na barra lateral.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rule.conditions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma condição adicionada ainda</p>
                        <p className="text-sm">Use a barra lateral para adicionar gatilhos</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rule.conditions.map((condition) => {
                          const IconComponent = condition.icon;
                          return (
                            <Card key={condition.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${condition.color}`}>
                                    <IconComponent className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{condition.name}</h4>
                                    <p className="text-sm text-gray-500">{condition.description}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCondition(condition.id)}
                                  className="text-red-500 hover:text-red-700"
                                  data-testid={`remove-condition-${condition.id}`}
                                >
                                  Remover
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                    
                    {rule.conditions.length > 0 && (
                      <div className="pt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          data-testid="back-to-details"
                        >
                          Voltar
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep(3)}
                          disabled={!canProceed(2)}
                          data-testid="next-to-actions"
                        >
                          Próximo: Definir Ações
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Actions */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ações (O que fazer)</CardTitle>
                    <p className="text-sm text-gray-500">
                      Defina o que acontece quando as condições forem atendidas. Use a barra lateral.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rule.actions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma ação adicionada ainda</p>
                        <p className="text-sm">Use a barra lateral para adicionar ações</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rule.actions.map((action) => {
                          const IconComponent = action.icon;
                          return (
                            <Card key={action.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${action.color}`}>
                                    <IconComponent className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{action.name}</h4>
                                    <p className="text-sm text-gray-500">{action.description}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAction(action.id)}
                                  className="text-red-500 hover:text-red-700"
                                  data-testid={`remove-action-${action.id}`}
                                >
                                  Remover
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                    
                    {rule.actions.length > 0 && (
                      <div className="pt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(2)}
                          data-testid="back-to-conditions"
                        >
                          Voltar
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep(4)}
                          disabled={!canProceed(3)}
                          data-testid="next-to-review"
                        >
                          Próximo: Revisar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Revisar Automação</CardTitle>
                    <p className="text-sm text-gray-500">
                      Revise sua automação antes de salvar
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Detalhes</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div><strong>Nome:</strong> {rule.name}</div>
                        <div><strong>Descrição:</strong> {rule.description}</div>
                        <div><strong>Status:</strong> 
                          <Badge className={`ml-2 ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {rule.enabled ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Condições ({rule.conditions.length})</h4>
                      <div className="space-y-2">
                        {rule.conditions.map((condition) => (
                          <div key={condition.id} className="bg-blue-50 p-3 rounded-lg">
                            <strong>{condition.name}</strong> - {condition.description}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Ações ({rule.actions.length})</h4>
                      <div className="space-y-2">
                        {rule.actions.map((action) => (
                          <div key={action.id} className="bg-green-50 p-3 rounded-lg">
                            <strong>{action.name}</strong> - {action.description}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                        data-testid="back-to-actions"
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="outline"
                        data-testid="test-rule"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Testar Regra
                      </Button>
                      <Button 
                        data-testid="save-rule"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Automação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Preview Panel */}
        <div className="w-80 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Preview & Teste</h3>
            <p className="text-sm text-gray-500 mt-1">
              Visualize como sua automação funcionará
            </p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resumo da Regra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="text-gray-600">Nome:</div>
                    <div className="font-medium">{rule.name || 'Sem nome'}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600">Condições:</div>
                    <div className="font-medium">{rule.conditions.length}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600">Ações:</div>
                    <div className="font-medium">{rule.actions.length}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600">Status:</div>
                    <Badge className={`${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.enabled ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {currentStep === 4 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Teste da Automação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500 mb-3">
                      Em breve: sistema de teste em tempo real
                    </p>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <Play className="h-4 w-4 mr-2" />
                      Simular Execução
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}