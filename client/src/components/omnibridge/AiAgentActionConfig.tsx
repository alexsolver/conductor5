import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Brain,
  Settings,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Wand2,
  ArrowRightLeft
} from 'lucide-react';
import FieldMappingConfig, { FieldMapping } from './FieldMappingConfig';
import SentimentConfig, { SentimentConfig as SentimentConfigType } from './SentimentConfig';

// Simplified AI Agent Configuration Component
// Integrates with new AI Agent backend

interface AIAgent {
  id: string;
  name: string;
  configPrompt: string;
  personality: {
    tone: string;
    language: string;
    greeting: string;
    fallbackMessage: string;
    confirmationStyle: string;
  };
  enabledActions: string[];
  behaviorRules: {
    requireConfirmation: string[];
    autoEscalateKeywords: string[];
    maxConversationTurns: number;
    collectionStrategy: string;
    errorHandling: string;
  };
  aiConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  status: string;
}

interface AIAction {
  id: string;
  actionType: string;
  name: string;
  description: string;
  category: string;
  riskLevel: string;
}

export interface AiAgentConfig {
  agentId?: string;
  name?: string;
  configPrompt?: string;
  personality?: {
    tone: string;
    language: string;
    greeting: string;
    fallbackMessage: string;
    confirmationStyle: string;
  };
  enabledActions?: string[];
  behaviorRules?: {
    requireConfirmation: string[];
    autoEscalateKeywords: string[];
    maxConversationTurns: number;
    collectionStrategy: string;
    errorHandling: string;
  };
  aiConfig?: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  fieldMappings?: FieldMapping[];
  sentimentConfig?: SentimentConfigType;
}

interface AiAgentActionConfigProps {
  config: AiAgentConfig;
  onChange: (config: AiAgentConfig) => void;
}

export default function AiAgentActionConfig({ config, onChange }: AiAgentActionConfigProps) {
  const [localConfig, setLocalConfig] = useState<AiAgentConfig>(config);
  const { toast } = useToast();

  // Fetch available AI agents
  const { data: agents = [], isLoading: loadingAgents } = useQuery<AIAgent[]>({
    queryKey: ['/api/ai-agents'],
  });

  // Auto-generate configuration mutation
  const generateConfigMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest('POST', '/api/ai-agents/generate-config', { prompt });
      if (!response.ok) {
        throw new Error('Failed to generate configuration');
      }
      return await response.json();
    },
    onSuccess: (data: { success: boolean; config: any }) => {
      if (data.success && data.config) {
        setLocalConfig({
          ...localConfig,
          name: data.config.name,
          personality: data.config.personality,
          enabledActions: data.config.enabledActions,
          behaviorRules: data.config.behaviorRules,
          aiConfig: data.config.aiConfig
        });
        toast({
          title: 'Configuração gerada com sucesso!',
          description: 'Revise as configurações antes de salvar.'
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar configuração',
        description: error.message || 'Tente novamente',
        variant: 'destructive'
      });
    }
  });

  // Fetch available actions
  const { data: availableActions = [], isLoading: loadingActions, error: actionsError } = useQuery<AIAction[]>({
    queryKey: ['/api/ai-agents/actions/available'],
  });

  // Debug logs
  useEffect(() => {
    console.log('🔍 [AI-AGENT-CONFIG] Component state:', {
      loadingActions,
      availableActionsCount: availableActions?.length || 0,
      hasError: !!actionsError,
      error: actionsError,
      errorMessage: actionsError?.message || 'No error',
      errorStack: actionsError?.stack || 'No stack'
    });
    
    if (actionsError) {
      console.error('❌ [AI-AGENT-CONFIG] Actions query error:', actionsError);
    }
  }, [loadingActions, availableActions, actionsError]);

  // Fetch selected agent details if agentId is provided
  const { data: selectedAgent, isLoading: loadingAgent } = useQuery<AIAgent>({
    queryKey: ['/api/ai-agents', localConfig.agentId],
    enabled: !!localConfig.agentId && localConfig.agentId !== 'new',
  });

  // Update local config when agent is loaded
  useEffect(() => {
    if (selectedAgent) {
      setLocalConfig({
        agentId: selectedAgent.id,
        name: selectedAgent.name,
        configPrompt: selectedAgent.configPrompt,
        personality: selectedAgent.personality,
        enabledActions: selectedAgent.enabledActions,
        behaviorRules: selectedAgent.behaviorRules,
        aiConfig: selectedAgent.aiConfig
      });
    }
  }, [selectedAgent]);

  // Sync changes back to parent
  useEffect(() => {
    onChange(localConfig);
  }, [localConfig, onChange]);

  const handleAgentSelect = (agentId: string) => {
    setLocalConfig({ ...localConfig, agentId });
  };

  const toggleAction = (actionType: string) => {
    const currentActions = localConfig.enabledActions || [];
    const newActions = currentActions.includes(actionType)
      ? currentActions.filter(a => a !== actionType)
      : [...currentActions, actionType];
    
    setLocalConfig({ ...localConfig, enabledActions: newActions });
  };

  const updatePersonality = (field: string, value: any) => {
    setLocalConfig({
      ...localConfig,
      personality: {
        ...(localConfig.personality || {
          tone: 'professional',
          language: 'pt-BR',
          greeting: 'Olá! Como posso ajudá-lo hoje?',
          fallbackMessage: 'Desculpe, não entendi. Pode reformular?',
          confirmationStyle: 'explicit'
        }),
        [field]: value
      }
    });
  };

  const updateBehaviorRule = (field: string, value: any) => {
    setLocalConfig({
      ...localConfig,
      behaviorRules: {
        ...(localConfig.behaviorRules || {
          requireConfirmation: ['create_ticket', 'create_customer'],
          autoEscalateKeywords: ['urgente', 'emergência'],
          maxConversationTurns: 10,
          collectionStrategy: 'sequential',
          errorHandling: 'retry'
        }),
        [field]: value
      }
    });
  };

  if (loadingAgents || loadingActions) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando configuração...</span>
      </div>
    );
  }

  const groupedActions = (availableActions || []).reduce((acc: Record<string, AIAction[]>, action: AIAction) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {});

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        {/* Agent Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Configuração do Agente IA
            </CardTitle>
            <CardDescription>
              Configure o comportamento e capacidades do agente de IA conversacional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select Existing Agent or Create New */}
            <div>
              <Label>Selecionar Agente Existente</Label>
              <Select value={localConfig.agentId} onValueChange={handleAgentSelect}>
                <SelectTrigger data-testid="select-ai-agent">
                  <SelectValue placeholder="Criar novo agente ou selecionar existente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Criar Novo Agente</SelectItem>
                  {(agents || []).map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} {agent.status === 'active' && '✓'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {localConfig.agentId === 'new' && (
              <>
                <div>
                  <Label htmlFor="name">Nome do Agente</Label>
                  <Input
                    id="name"
                    value={localConfig.name || ''}
                    onChange={(e) => setLocalConfig({ ...localConfig, name: e.target.value })}
                    placeholder="Ex: Assistente de Atendimento"
                    data-testid="input-agent-name"
                  />
                </div>

                <div>
                  <Label htmlFor="configPrompt">Descrição do Comportamento (Prompt Natural)</Label>
                  <Textarea
                    id="configPrompt"
                    value={localConfig.configPrompt || ''}
                    onChange={(e) => setLocalConfig({ ...localConfig, configPrompt: e.target.value })}
                    placeholder="Descreva em linguagem natural o que você quer que o agente faça. Ex: 'Você é um assistente que ajuda clientes a criar tickets e responder dúvidas sobre produtos.'"
                    className="min-h-[100px]"
                    data-testid="input-config-prompt"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      O sistema irá interpretar automaticamente e configurar as ações necessárias
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!localConfig.configPrompt || generateConfigMutation.isPending}
                      onClick={() => {
                        if (localConfig.configPrompt) {
                          generateConfigMutation.mutate(localConfig.configPrompt);
                        }
                      }}
                      data-testid="button-generate-config"
                      className="gap-2"
                    >
                      {generateConfigMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          Gerar Configuração Automática
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {loadingAgent && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando detalhes do agente...
              </div>
            )}

            {selectedAgent && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{selectedAgent.name}</span>
                  <Badge variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}>
                    {selectedAgent.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selectedAgent.configPrompt}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Tabs */}
        {(localConfig.agentId === 'new' || selectedAgent) && (
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="actions">Ações</TabsTrigger>
              <TabsTrigger value="personality">Personalidade</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="mapping" data-testid="tab-mapping">
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Mapeamento
              </TabsTrigger>
              <TabsTrigger value="sentiment" data-testid="tab-sentiment">
                Sentimento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ações Habilitadas</CardTitle>
                  <CardDescription>
                    Selecione as ações que o agente pode executar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableActions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma ação disponível no momento.</p>
                      <p className="text-xs mt-1">As ações serão criadas automaticamente quando necessário.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] pr-4">
                      {Object.entries(groupedActions).map(([category, actions]) => (
                        <div key={category} className="mb-6">
                          <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                            {category}
                          </h3>
                          <div className="space-y-3">
                            {actions.map((action) => (
                              <div
                                key={action.actionType}
                                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={action.actionType} className="font-medium cursor-pointer">
                                      {action.name}
                                    </Label>
                                    <Badge variant={action.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                                      {action.riskLevel}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {action.description}
                                  </p>
                                </div>
                                <Switch
                                  id={action.actionType}
                                  checked={(localConfig.enabledActions || []).includes(action.actionType)}
                                  onCheckedChange={() => toggleAction(action.actionType)}
                                  data-testid={`switch-action-${action.actionType}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Personalidade do Agente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tone">Tom de Voz</Label>
                    <Select
                      value={localConfig.personality?.tone || 'professional'}
                      onValueChange={(value) => updatePersonality('tone', value)}
                    >
                      <SelectTrigger id="tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="friendly">Amigável</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={localConfig.personality?.language || 'pt-BR'}
                      onValueChange={(value) => updatePersonality('language', value)}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="greeting">Saudação Inicial</Label>
                    <Input
                      id="greeting"
                      value={localConfig.personality?.greeting || ''}
                      onChange={(e) => updatePersonality('greeting', e.target.value)}
                      placeholder="Olá! Como posso ajudá-lo hoje?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fallback">Mensagem de Fallback</Label>
                    <Input
                      id="fallback"
                      value={localConfig.personality?.fallbackMessage || ''}
                      onChange={(e) => updatePersonality('fallbackMessage', e.target.value)}
                      placeholder="Desculpe, não entendi. Pode reformular?"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Mensagem quando o agente não entende
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Regras de Comportamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="escalate-keywords">Palavras-chave de Escalação Automática</Label>
                    <Input
                      id="escalate-keywords"
                      value={(localConfig.behaviorRules?.autoEscalateKeywords || []).join(', ')}
                      onChange={(e) => updateBehaviorRule('autoEscalateKeywords', e.target.value.split(',').map(k => k.trim()))}
                      placeholder="urgente, emergência, crítico"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Palavras que acionam escalação para humano (separadas por vírgula)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="maxTurns">Máximo de Turnos de Conversa</Label>
                    <Input
                      id="maxTurns"
                      type="number"
                      value={localConfig.behaviorRules?.maxConversationTurns || 10}
                      onChange={(e) => updateBehaviorRule('maxConversationTurns', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Após este limite, a conversa será escalada
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="collection-strategy">Estratégia de Coleta de Dados</Label>
                    <Select
                      value={localConfig.behaviorRules?.collectionStrategy || 'sequential'}
                      onValueChange={(value) => updateBehaviorRule('collectionStrategy', value)}
                    >
                      <SelectTrigger id="collection-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequencial (uma pergunta por vez)</SelectItem>
                        <SelectItem value="batch">Lote (múltiplas perguntas)</SelectItem>
                        <SelectItem value="adaptive">Adaptativo (baseado no contexto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="error-handling">Tratamento de Erros</Label>
                    <Select
                      value={localConfig.behaviorRules?.errorHandling || 'retry'}
                      onValueChange={(value) => updateBehaviorRule('errorHandling', value)}
                    >
                      <SelectTrigger id="error-handling">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retry">Tentar novamente</SelectItem>
                        <SelectItem value="escalate">Escalar imediatamente</SelectItem>
                        <SelectItem value="fallback">Usar resposta padrão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <FieldMappingConfig
                mappings={localConfig.fieldMappings || []}
                onChange={(fieldMappings) => setLocalConfig({ ...localConfig, fieldMappings })}
              />
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-4">
              <SentimentConfig
                config={localConfig.sentimentConfig || {
                  enabled: true,
                  thresholds: { negative: -0.3, neutral: 0.3, positive: 0.7 },
                  alerts: [],
                  autoEscalate: { enabled: true, sentimentThreshold: -0.6, consecutiveMessages: 3 },
                  visualizationEnabled: true
                }}
                onChange={(sentimentConfig) => setLocalConfig({ ...localConfig, sentimentConfig })}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Summary */}
        {localConfig.enabledActions && localConfig.enabledActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Resumo da Configuração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ações habilitadas:</span>
                  <Badge>{localConfig.enabledActions.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tom de voz:</span>
                  <span>{localConfig.personality?.tone || 'professional'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Idioma:</span>
                  <span>{localConfig.personality?.language || 'pt-BR'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!localConfig.agentId && (
          <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Nenhum agente selecionado
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Selecione um agente existente ou crie um novo para continuar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
