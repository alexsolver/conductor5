import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Sparkles, 
  MessageCircle, 
  Zap, 
  Shield, 
  Check,
  Plus,
  Settings,
  Users,
  ChevronRight,
  Play,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AIAgentConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('identity');
  
  // Buscar configuração do agente
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['/api/ai-agent/config'],
  });

  const [agentConfig, setAgentConfig] = useState({
    name: 'Ana',
    avatar: '😊',
    greeting: 'Olá! Como posso ajudar?',
    farewell: 'Até breve!',
    tone: 'friendly',
    maxTurns: 10,
    confidence: 70,
    escalationKeywords: ['urgente', 'emergência', 'crítico'],
    escalationQueue: 'support',
    autoLearn: true,
    uncertainBehavior: 'ask_again',
    flowIds: [] as string[]
  });

  // Atualizar estado quando dados chegarem
  useEffect(() => {
    if (configData?.data) {
      setAgentConfig(configData.data);
    }
  }, [configData]);

  // Buscar ações disponíveis
  const { data: actionsData, isLoading: actionsLoading } = useQuery({
    queryKey: ['/api/ai-agent/available-actions'],
  });

  // Buscar fluxos disponíveis
  const { data: flowsData, isLoading: flowsLoading } = useQuery({
    queryKey: ['/api/ai-flows'],
  });

  const availableFlows = flowsData?.data || [];

  const availableActions = actionsData?.data || [
    {
      id: '1',
      name: 'Criar Ticket',
      description: 'Criar chamados automaticamente',
      icon: '🎫',
      createdBy: 'Admin',
      usage: 245,
      enabled: true,
      category: 'tickets'
    },
    {
      id: '2',
      name: 'Consultar Status',
      description: 'Verificar andamento de tickets',
      icon: '📋',
      createdBy: 'Admin',
      usage: 892,
      enabled: true,
      category: 'tickets'
    },
    {
      id: '3',
      name: 'Agendar Atendimento',
      description: 'Marcar horário com técnico',
      icon: '📅',
      createdBy: 'Admin',
      usage: 0,
      enabled: false,
      category: 'scheduling'
    },
    {
      id: '4',
      name: 'Consultar Fatura',
      description: 'Ver valores e pagamentos',
      icon: '💰',
      createdBy: 'Tenant',
      usage: 0,
      enabled: false,
      category: 'billing'
    }
  ];

  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: async (config: typeof agentConfig) => {
      return apiRequest('/api/ai-agent/config', {
        method: 'POST',
        data: config
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agent/config'] });
      toast({
        title: "Configuração salva",
        description: "As alterações foram salvas com sucesso"
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive"
      });
    }
  });

  // Mutation para toggle de ação
  const toggleActionMutation = useMutation({
    mutationFn: async ({ actionId, enabled }: { actionId: string, enabled: boolean }) => {
      return apiRequest(`/api/ai-agent/toggle-action/${actionId}`, {
        method: 'POST',
        data: { enabled }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agent/available-actions'] });
      toast({
        title: "Ação atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ação",
        variant: "destructive"
      });
    }
  });

  const toggleAction = (actionId: string, currentState: boolean) => {
    toggleActionMutation.mutate({ actionId, enabled: !currentState });
  };

  const handleSave = () => {
    saveConfigMutation.mutate(agentConfig);
  };

  return (
    <div className="space-y-6">
      {/* Agent Card Header */}
      <Card className="border-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-6xl">{agentConfig.avatar}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{agentConfig.name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </Badge>
                <span className="text-sm text-muted-foreground">128 conversas hoje</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Testar Agente
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={saveConfigMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identity" className="gap-2">
            <Bot className="h-4 w-4" />
            Identidade
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2">
            <Zap className="h-4 w-4" />
            Ações
          </TabsTrigger>
          <TabsTrigger value="flows" className="gap-2">
            <ChevronRight className="h-4 w-4" />
            Fluxos
          </TabsTrigger>
          <TabsTrigger value="escalation" className="gap-2">
            <Shield className="h-4 w-4" />
            Escalação
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Inteligência
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Identidade */}
        <TabsContent value="identity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personalidade do Agente</CardTitle>
              <CardDescription>Configure como o agente se apresenta e conversa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome do Agente</Label>
                  <Input 
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig({...agentConfig, name: e.target.value})}
                    placeholder="Ex: Ana, Assistente Virtual..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <div className="flex gap-2">
                    {['😊', '🤖', '👨‍💼', '👩‍💼', '🎯'].map((emoji) => (
                      <Button
                        key={emoji}
                        variant={agentConfig.avatar === emoji ? 'default' : 'outline'}
                        size="lg"
                        className="text-2xl h-12 w-12"
                        onClick={() => setAgentConfig({...agentConfig, avatar: emoji})}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Saudação</Label>
                <Textarea 
                  value={agentConfig.greeting}
                  onChange={(e) => setAgentConfig({...agentConfig, greeting: e.target.value})}
                  placeholder="Como o agente inicia a conversa"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Despedida</Label>
                <Textarea 
                  value={agentConfig.farewell}
                  onChange={(e) => setAgentConfig({...agentConfig, farewell: e.target.value})}
                  placeholder="Como o agente finaliza a conversa"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'formal', label: 'Formal', icon: '🎩' },
                    { value: 'friendly', label: 'Amigável', icon: '😊' },
                    { value: 'casual', label: 'Casual', icon: '😎' }
                  ].map((tone) => (
                    <Button
                      key={tone.value}
                      variant={agentConfig.tone === tone.value ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setAgentConfig({...agentConfig, tone: tone.value})}
                    >
                      <span className="mr-2">{tone.icon}</span>
                      {tone.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Ações */}
        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que o agente pode fazer?</CardTitle>
              <CardDescription>Ative as ações que o agente poderá executar</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {availableActions.map((action) => (
                    <Card key={action.id} className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{action.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">{action.name}</h3>
                              <Switch
                                checked={action.enabled}
                                onCheckedChange={() => toggleAction(action.id, action.enabled)}
                                disabled={toggleActionMutation.isPending}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Por: {action.createdBy}
                              </div>
                              {action.usage > 0 && (
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  Usada {action.usage}x
                                </div>
                              )}
                              {action.usage === 0 && (
                                <Badge variant="secondary" className="text-xs">Nova</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <Button variant="outline" className="w-full" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Criar Minha Própria Ação
                <Badge variant="secondary" className="ml-2">Em breve</Badge>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Fluxos */}
        <TabsContent value="flows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fluxos Visuais</CardTitle>
              <CardDescription>Selecione os fluxos que o agente pode executar</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {flowsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando fluxos...
                    </div>
                  ) : availableFlows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-4">Nenhum fluxo criado ainda</p>
                      <Button variant="outline" onClick={() => window.location.href = '/ai-agent/flows'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Fluxo
                      </Button>
                    </div>
                  ) : (
                    availableFlows.map((flow: any) => (
                      <Card 
                        key={flow.id} 
                        className={`border-2 transition-colors cursor-pointer ${
                          agentConfig.flowIds.includes(flow.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          const newFlowIds = agentConfig.flowIds.includes(flow.id)
                            ? agentConfig.flowIds.filter((id: string) => id !== flow.id)
                            : [...agentConfig.flowIds, flow.id];
                          setAgentConfig({...agentConfig, flowIds: newFlowIds});
                        }}
                        data-testid={`flow-card-${flow.id}`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{flow.icon || '⚡'}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">{flow.name}</h3>
                                <Switch
                                  checked={agentConfig.flowIds.includes(flow.id)}
                                  onCheckedChange={() => {
                                    const newFlowIds = agentConfig.flowIds.includes(flow.id)
                                      ? agentConfig.flowIds.filter((id: string) => id !== flow.id)
                                      : [...agentConfig.flowIds, flow.id];
                                    setAgentConfig({...agentConfig, flowIds: newFlowIds});
                                  }}
                                  data-testid={`flow-toggle-${flow.id}`}
                                />
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{flow.description || 'Sem descrição'}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <Badge variant={flow.is_active ? 'default' : 'secondary'} className="text-xs">
                                  {flow.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                                <span>{flow.nodes?.length || 0} nós</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {agentConfig.flowIds.length === 0 
                    ? 'Nenhum fluxo selecionado' 
                    : `${agentConfig.flowIds.length} fluxo${agentConfig.flowIds.length > 1 ? 's' : ''} selecionado${agentConfig.flowIds.length > 1 ? 's' : ''}`
                  }
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/ai-agent/flows'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gerenciar Fluxos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Escalação */}
        <TabsContent value="escalation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quando Transferir para Humano?</CardTitle>
              <CardDescription>Configure as regras de escalação para atendimento humano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Cliente usar palavras-chave</Label>
                    <p className="text-sm text-muted-foreground">Transferir quando detectar urgência</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pl-6 space-y-2">
                  <Label className="text-sm">Palavras de escalação</Label>
                  <div className="flex flex-wrap gap-2">
                    {agentConfig.escalationKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="px-3 py-1">
                        {keyword}
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7">
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Limite de tentativas</Label>
                  <p className="text-sm text-muted-foreground">Não conseguir resolver em X turnos</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="pl-6">
                <Label className="text-sm">Máximo de turnos</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[agentConfig.maxTurns]}
                    onValueChange={([value]) => setAgentConfig({...agentConfig, maxTurns: value})}
                    max={20}
                    min={3}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-semibold w-8 text-center">{agentConfig.maxTurns}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Cliente pedir explicitamente</Label>
                  <p className="text-sm text-muted-foreground">"Falar com humano", "atendente"</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Transferir para fila</Label>
                <Select defaultValue="support">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Fila de Suporte</SelectItem>
                    <SelectItem value="technical">Fila Técnica</SelectItem>
                    <SelectItem value="billing">Fila Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Inteligência */}
        <TabsContent value="intelligence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comportamento Inteligente</CardTitle>
              <CardDescription>Configure como o agente toma decisões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base">Confiança para executar ações</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Sempre perguntar</span>
                    <span>Sempre fazer</span>
                  </div>
                  <Slider
                    value={[agentConfig.confidence]}
                    onValueChange={([value]) => setAgentConfig({...agentConfig, confidence: value})}
                    max={100}
                    min={0}
                    step={10}
                  />
                  <div className="text-center">
                    <span className="text-2xl font-bold">{agentConfig.confidence}%</span>
                    <p className="text-sm text-muted-foreground">
                      {agentConfig.confidence < 30 && "Sempre pedir confirmação"}
                      {agentConfig.confidence >= 30 && agentConfig.confidence < 70 && "Equilibrado"}
                      {agentConfig.confidence >= 70 && "Executar com autonomia"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-base">Quando incerto sobre dados</Label>
                <Select 
                  value={agentConfig.uncertainBehavior}
                  onValueChange={(value) => setAgentConfig({...agentConfig, uncertainBehavior: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ask_again">Perguntar novamente</SelectItem>
                    <SelectItem value="use_widget">Usar widget interativo</SelectItem>
                    <SelectItem value="use_profile">Preencher com dados do perfil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Aprendizado Contínuo</Label>
                  <p className="text-sm text-muted-foreground">Lembrar preferências do cliente</p>
                </div>
                <Switch
                  checked={agentConfig.autoLearn}
                  onCheckedChange={(checked) => setAgentConfig({...agentConfig, autoLearn: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Preview */}
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Esperada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-3xl font-bold text-green-600">~85%</div>
                  <p className="text-sm text-muted-foreground mt-1">Taxa de Resolução</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-3xl font-bold text-blue-600">~2min</div>
                  <p className="text-sm text-muted-foreground mt-1">Tempo Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
