import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Bot, Save, TestTube, Sparkles } from 'lucide-react';

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

export default function AIAgentConfig() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Fetch AI agents
  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ['/api/ai-agents'],
  });

  // Fetch available actions
  const { data: availableActions = [], isLoading: loadingActions } = useQuery({
    queryKey: ['/api/ai-agents/actions/available'],
  });

  // Get selected agent details
  const { data: agent, isLoading: loadingAgent } = useQuery({
    queryKey: ['/api/ai-agents', selectedAgent],
    enabled: !!selectedAgent,
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: (data: Partial<AIAgent>) => apiRequest('POST', '/api/ai-agents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents'] });
      toast({ title: 'Agente criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar agente', variant: 'destructive' });
    }
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AIAgent> }) =>
      apiRequest('PATCH', `/api/ai-agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents'] });
      toast({ title: 'Agente atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar agente', variant: 'destructive' });
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    configPrompt: '',
    personality: {
      tone: 'professional',
      language: 'pt-BR',
      greeting: 'Olá! Como posso ajudá-lo hoje?',
      fallbackMessage: 'Desculpe, não entendi. Pode reformular?',
      confirmationStyle: 'explicit'
    },
    enabledActions: [] as string[],
    behaviorRules: {
      requireConfirmation: ['create_ticket', 'create_customer', 'send_email'],
      autoEscalateKeywords: ['urgente', 'emergência', 'crítico'],
      maxConversationTurns: 10,
      collectionStrategy: 'sequential',
      errorHandling: 'retry'
    },
    aiConfig: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'Você é um assistente virtual prestativo.'
    },
    status: 'testing'
  });

  // Update form when agent is loaded
  useState(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        configPrompt: agent.configPrompt || '',
        personality: agent.personality || formData.personality,
        enabledActions: agent.enabledActions || [],
        behaviorRules: agent.behaviorRules || formData.behaviorRules,
        aiConfig: agent.aiConfig || formData.aiConfig,
        status: agent.status || 'testing'
      });
    }
  });

  const handleSave = () => {
    if (selectedAgent) {
      updateAgentMutation.mutate({ id: selectedAgent, data: formData });
    } else {
      createAgentMutation.mutate(formData);
    }
  };

  const toggleAction = (actionType: string) => {
    setFormData(prev => ({
      ...prev,
      enabledActions: prev.enabledActions.includes(actionType)
        ? prev.enabledActions.filter(a => a !== actionType)
        : [...prev.enabledActions, actionType]
    }));
  };

  const groupedActions = availableActions.reduce((acc: Record<string, AIAction[]>, action: AIAction) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {});

  if (loadingAgents || loadingActions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-ai-config">
            <Bot className="h-8 w-8" />
            Configuração do Agente IA
          </h1>
          <p className="text-muted-foreground">
            Configure seu assistente virtual inteligente
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateAgentMutation.isPending || createAgentMutation.isPending} data-testid="button-save-agent">
          <Save className="h-4 w-4 mr-2" />
          Salvar Agente
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Agent List */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Agentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setSelectedAgent(null);
                setFormData({
                  name: '',
                  configPrompt: '',
                  personality: formData.personality,
                  enabledActions: [],
                  behaviorRules: formData.behaviorRules,
                  aiConfig: formData.aiConfig,
                  status: 'testing'
                });
              }}
              data-testid="button-new-agent"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Novo Agente
            </Button>
            {agents.map((agent: AIAgent) => (
              <Button
                key={agent.id}
                variant={selectedAgent === agent.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedAgent(agent.id)}
                data-testid={`button-agent-${agent.id}`}
              >
                <Bot className="h-4 w-4 mr-2" />
                {agent.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="col-span-9 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Defina o nome e comportamento inicial do agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Agente</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Assistente de Atendimento"
                  data-testid="input-agent-name"
                />
              </div>

              <div>
                <Label htmlFor="configPrompt">Prompt de Configuração</Label>
                <Textarea
                  id="configPrompt"
                  value={formData.configPrompt}
                  onChange={(e) => setFormData({ ...formData, configPrompt: e.target.value })}
                  placeholder="Descreva o que você quer que o agente faça. Ex: 'Você é um assistente que ajuda clientes a criar tickets e responder dúvidas sobre produtos.'"
                  className="min-h-[120px]"
                  data-testid="input-config-prompt"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Descreva em linguagem natural o que você quer que o agente faça
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="select-agent-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testing">Testando</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={formData.personality.language}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      personality: { ...formData.personality, language: value }
                    })}
                  >
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="actions">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="actions" data-testid="tab-actions">Ações</TabsTrigger>
              <TabsTrigger value="personality" data-testid="tab-personality">Personalidade</TabsTrigger>
              <TabsTrigger value="behavior" data-testid="tab-behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="advanced" data-testid="tab-advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Habilitadas</CardTitle>
                  <CardDescription>
                    Selecione as ações que o agente pode executar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(groupedActions).map(([category, actions]) => (
                    <div key={category} className="mb-6">
                      <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                        {category}
                      </h3>
                      <div className="space-y-3">
                        {(actions as AIAction[]).map((action) => (
                          <div
                            key={action.actionType}
                            className="flex items-start justify-between p-3 border rounded-lg"
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
                              checked={formData.enabledActions.includes(action.actionType)}
                              onCheckedChange={() => toggleAction(action.actionType)}
                              data-testid={`switch-action-${action.actionType}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personalidade do Agente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tone">Tom de Voz</Label>
                    <Select
                      value={formData.personality.tone}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        personality: { ...formData.personality, tone: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-tone">
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
                    <Label htmlFor="greeting">Saudação Inicial</Label>
                    <Input
                      id="greeting"
                      value={formData.personality.greeting}
                      onChange={(e) => setFormData({
                        ...formData,
                        personality: { ...formData.personality, greeting: e.target.value }
                      })}
                      data-testid="input-greeting"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fallback">Mensagem de Fallback</Label>
                    <Input
                      id="fallback"
                      value={formData.personality.fallbackMessage}
                      onChange={(e) => setFormData({
                        ...formData,
                        personality: { ...formData.personality, fallbackMessage: e.target.value }
                      })}
                      data-testid="input-fallback"
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
                  <CardTitle>Regras de Comportamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Palavras-chave de Escalação</Label>
                    <Input
                      value={formData.behaviorRules.autoEscalateKeywords.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        behaviorRules: {
                          ...formData.behaviorRules,
                          autoEscalateKeywords: e.target.value.split(',').map(k => k.trim())
                        }
                      })}
                      placeholder="urgente, emergência, crítico"
                      data-testid="input-escalate-keywords"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Palavras que acionam escalação automática (separadas por vírgula)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="maxTurns">Máximo de Turnos de Conversa</Label>
                    <Input
                      id="maxTurns"
                      type="number"
                      value={formData.behaviorRules.maxConversationTurns}
                      onChange={(e) => setFormData({
                        ...formData,
                        behaviorRules: {
                          ...formData.behaviorRules,
                          maxConversationTurns: parseInt(e.target.value)
                        }
                      })}
                      data-testid="input-max-turns"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="model">Modelo OpenAI</Label>
                    <Select
                      value={formData.aiConfig.model}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        aiConfig: { ...formData.aiConfig, model: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="temperature">Temperature: {formData.aiConfig.temperature}</Label>
                    <input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.aiConfig.temperature}
                      onChange={(e) => setFormData({
                        ...formData,
                        aiConfig: { ...formData.aiConfig, temperature: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                      data-testid="input-temperature"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Controla a criatividade das respostas (0 = determinístico, 1 = criativo)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                    <Textarea
                      id="systemPrompt"
                      value={formData.aiConfig.systemPrompt}
                      onChange={(e) => setFormData({
                        ...formData,
                        aiConfig: { ...formData.aiConfig, systemPrompt: e.target.value }
                      })}
                      className="min-h-[100px]"
                      data-testid="input-system-prompt"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
