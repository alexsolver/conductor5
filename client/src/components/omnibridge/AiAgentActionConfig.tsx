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
  const [selectedAgentId, setSelectedAgentId] = useState<string>(config.agentId || '');
  const { toast } = useToast();

  // Fetch available AI agents
  const { data: agentsResponse, isLoading: loadingAgents } = useQuery<{ success: boolean; data: AIAgent[] }>({
    queryKey: ['/api/omnibridge/ai-agents'],
  });
  
  const agents = agentsResponse?.data ?? [];

  // Fetch available actions
  const { data: availableActions = [], isLoading: loadingActions } = useQuery<AIAction[]>({
    queryKey: ['/api/omnibridge/ai-agents/actions/available'],
  });

  // Fetch selected agent details
  const { data: selectedAgentResponse, isLoading: loadingAgent } = useQuery<{ success: boolean; data: AIAgent }>({
    queryKey: ['/api/omnibridge/ai-agents', selectedAgentId],
    enabled: !!selectedAgentId && selectedAgentId !== 'new',
  });

  const selectedAgent = selectedAgentResponse?.data;

  // Update config when agent is selected or loaded
  useEffect(() => {
    if (selectedAgentId === 'new') {
      // New agent - use defaults
      onChange({
        agentId: 'new',
        name: config.name || 'Novo Agente IA',
        configPrompt: config.configPrompt || '',
        personality: config.personality || {
          tone: 'professional',
          language: 'pt-BR',
          greeting: 'Olá! Como posso ajudar?',
          fallbackMessage: 'Desculpe, não entendi. Pode reformular?',
          confirmationStyle: 'polite'
        },
        enabledActions: config.enabledActions || ['create_ticket'],
        behaviorRules: config.behaviorRules || {
          requireConfirmation: [],
          autoEscalateKeywords: [],
          maxConversationTurns: 10,
          collectionStrategy: 'conversational',
          errorHandling: 'retry'
        },
        aiConfig: config.aiConfig || {
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 500,
          systemPrompt: ''
        }
      });
    } else if (selectedAgent) {
      // Existing agent - use agent data
      console.log('🤖 [AI-AGENT-CONFIG] Loading agent data:', selectedAgent);
      onChange({
        agentId: selectedAgent.id,
        name: selectedAgent.name,
        configPrompt: selectedAgent.configPrompt,
        personality: selectedAgent.personality,
        enabledActions: selectedAgent.enabledActions,
        behaviorRules: selectedAgent.behaviorRules,
        aiConfig: selectedAgent.aiConfig
      });
    }
  }, [selectedAgentId, selectedAgent]);

  const handleAgentSelect = (agentId: string) => {
    console.log('🤖 [AI-AGENT-CONFIG] Agent selected:', agentId);
    setSelectedAgentId(agentId);
  };

  const toggleAction = (actionType: string) => {
    const currentActions = config.enabledActions || [];
    const newActions = currentActions.includes(actionType)
      ? currentActions.filter(a => a !== actionType)
      : [...currentActions, actionType];
    
    onChange({ ...config, enabledActions: newActions });
  };

  const updatePersonality = (field: string, value: any) => {
    onChange({
      ...config,
      personality: {
        ...(config.personality || {
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
    onChange({
      ...config,
      behaviorRules: {
        ...(config.behaviorRules || {
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

  const updateAiConfig = (field: string, value: any) => {
    onChange({
      ...config,
      aiConfig: {
        ...(config.aiConfig || {
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 500,
          systemPrompt: ''
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
              Selecionar Agente IA
            </CardTitle>
            <CardDescription>
              Escolha um agente existente ou crie um novo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Agente</Label>
              <Select 
                value={selectedAgentId} 
                onValueChange={handleAgentSelect}
                data-testid="select-ai-agent"
              >
                <SelectTrigger data-testid="trigger-select-agent">
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" data-testid="option-new-agent">
                    ➕ Criar Novo Agente
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem 
                      key={agent.id} 
                      value={agent.id}
                      data-testid={`option-agent-${agent.id}`}
                    >
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingAgent && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados do agente...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Tabs - Only show if agent is selected */}
        {(selectedAgentId === 'new' || selectedAgent) && (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" data-testid="tab-basic">Básico</TabsTrigger>
              <TabsTrigger value="personality" data-testid="tab-personality">Personalidade</TabsTrigger>
              <TabsTrigger value="actions" data-testid="tab-actions">Ações</TabsTrigger>
              <TabsTrigger value="advanced" data-testid="tab-advanced">Avançado</TabsTrigger>
            </TabsList>

            {/* Basic Configuration */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome do Agente</Label>
                    <Input
                      value={config.name || ''}
                      onChange={(e) => onChange({ ...config, name: e.target.value })}
                      placeholder="Ex: Agente de Suporte"
                      data-testid="input-agent-name"
                    />
                  </div>

                  <div>
                    <Label>Prompt de Configuração</Label>
                    <Textarea
                      value={config.configPrompt || ''}
                      onChange={(e) => onChange({ ...config, configPrompt: e.target.value })}
                      placeholder="Descreva como o agente deve se comportar..."
                      rows={4}
                      data-testid="textarea-config-prompt"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personality Configuration */}
            <TabsContent value="personality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personalidade do Agente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tom de Voz</Label>
                    <Select
                      value={config.personality?.tone || 'professional'}
                      onValueChange={(value) => updatePersonality('tone', value)}
                      data-testid="select-tone"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="friendly">Amigável</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Idioma</Label>
                    <Select
                      value={config.personality?.language || 'pt-BR'}
                      onValueChange={(value) => updatePersonality('language', value)}
                      data-testid="select-language"
                    >
                      <SelectTrigger>
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
                    <Label>Mensagem de Saudação</Label>
                    <Input
                      value={config.personality?.greeting || ''}
                      onChange={(e) => updatePersonality('greeting', e.target.value)}
                      placeholder="Olá! Como posso ajudar?"
                      data-testid="input-greeting"
                    />
                  </div>

                  <div>
                    <Label>Mensagem de Fallback</Label>
                    <Input
                      value={config.personality?.fallbackMessage || ''}
                      onChange={(e) => updatePersonality('fallbackMessage', e.target.value)}
                      placeholder="Desculpe, não entendi..."
                      data-testid="input-fallback"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Actions Configuration */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Disponíveis</CardTitle>
                  <CardDescription>
                    Selecione as ações que o agente pode executar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(groupedActions).map(([category, actions]) => (
                      <div key={category}>
                        <h4 className="font-medium mb-2">{category}</h4>
                        <div className="space-y-2">
                          {actions.map((action) => (
                            <div
                              key={action.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{action.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {action.description}
                                </div>
                              </div>
                              <Switch
                                checked={config.enabledActions?.includes(action.actionType) || false}
                                onCheckedChange={() => toggleAction(action.actionType)}
                                data-testid={`switch-action-${action.actionType}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Configuration */}
            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração Avançada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Modelo de IA</Label>
                    <Select
                      value={config.aiConfig?.model || 'gpt-4o'}
                      onValueChange={(value) => updateAiConfig('model', value)}
                      data-testid="select-ai-model"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Temperatura ({config.aiConfig?.temperature || 0.7})</Label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.aiConfig?.temperature || 0.7}
                      onChange={(e) => updateAiConfig('temperature', parseFloat(e.target.value))}
                      className="w-full"
                      data-testid="slider-temperature"
                    />
                  </div>

                  <div>
                    <Label>Máximo de Tokens</Label>
                    <Input
                      type="number"
                      value={config.aiConfig?.maxTokens || 500}
                      onChange={(e) => updateAiConfig('maxTokens', parseInt(e.target.value))}
                      data-testid="input-max-tokens"
                    />
                  </div>

                  <div>
                    <Label>Máximo de Turnos de Conversa</Label>
                    <Input
                      type="number"
                      value={config.behaviorRules?.maxConversationTurns || 10}
                      onChange={(e) => updateBehaviorRule('maxConversationTurns', parseInt(e.target.value))}
                      data-testid="input-max-turns"
                    />
                  </div>

                  <div>
                    <Label>Estratégia de Coleta</Label>
                    <Select
                      value={config.behaviorRules?.collectionStrategy || 'conversational'}
                      onValueChange={(value) => updateBehaviorRule('collectionStrategy', value)}
                      data-testid="select-collection-strategy"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversational">Conversacional</SelectItem>
                        <SelectItem value="sequential">Sequencial</SelectItem>
                        <SelectItem value="adaptive">Adaptativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ScrollArea>
  );
}
