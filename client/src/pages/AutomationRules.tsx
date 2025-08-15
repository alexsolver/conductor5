import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Zap,
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Activity,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Inbox,
  Send,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  FileText,
  Workflow,
  Hash,
  MessageSquare,
  RefreshCw,
  Bot
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function AutomationRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // Form states
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [priority, setPriority] = useState(1);
  const [conditions, setConditions] = useState([{ field: '', operator: 'equals', value: '' }]);
  const [actions, setActions] = useState([{ type: 'sendNotification', parameters: {} }]);

  // Test data
  const [testData, setTestData] = useState('{}');

  // Fetch automation rules
  const { data: rulesData, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['/api/automation-rules'],
    staleTime: 0,
  });

  // Fetch metrics
  const { data: metricsData } = useQuery({
    queryKey: ['/api/automation-rules/metrics/overview'],
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      return await apiRequest('POST', '/api/automation-rules', ruleData);
    },
    onSuccess: () => {
      toast({
        title: "Regra criada com sucesso",
        description: "A regra de automação foi criada e está ativa."
      });
      resetForm();
      setRuleDialogOpen(false);
      refetchRules();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar regra",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiRequest('DELETE', `/api/automation-rules/${ruleId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Regra excluída",
        description: "A regra de automação foi excluída com sucesso."
      });
      refetchRules();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir regra",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Test rule mutation
  const testRuleMutation = useMutation({
    mutationFn: async ({ ruleId, testData }: { ruleId: string, testData: any }) => {
      return await apiRequest('POST', `/api/automation-rules/${ruleId}/test`, { testData });
    },
    onSuccess: (data: any) => {
      toast({
        title: `Teste ${data.test.matches ? 'APROVADO' : 'REPROVADO'}`,
        description: `Regra "${data.test.ruleName}": ${data.test.matches ? 'condições atendidas' : 'condições não atendidas'}`,
        variant: data.test.matches ? "default" : "destructive"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setRuleName('');
    setRuleDescription('');
    setEnabled(true);
    setPriority(1);
    setConditions([{ field: '', operator: 'equals', value: '' }]);
    setActions([{ type: 'sendNotification', parameters: {} }]);
  };

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const addAction = () => {
    setActions([...actions, { type: 'sendNotification', parameters: {} }]);
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    newActions[index][field] = value;
    setActions(newActions);
  };

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index));
    }
  };

  const handleCreateRule = () => {
    if (!ruleName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da regra é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (conditions.some(c => !c.field || !c.value)) {
      toast({
        title: "Condições incompletas",
        description: "Todas as condições devem ter campo e valor preenchidos.",
        variant: "destructive"
      });
      return;
    }

    createRuleMutation.mutate({
      name: ruleName,
      description: ruleDescription,
      conditions,
      actions,
      enabled,
      priority
    });
  };

  const handleTestRule = () => {
    if (!selectedRule) return;

    try {
      const parsedTestData = JSON.parse(testData);
      testRuleMutation.mutate({
        ruleId: selectedRule.id,
        testData: parsedTestData
      });
    } catch (error) {
      toast({
        title: "Dados de teste inválidos",
        description: "Os dados de teste devem ser um JSON válido.",
        variant: "destructive"
      });
    }
  };

  const rules = rulesData?.rules || [];
  const metrics = metricsData?.metrics || {};

  if (rulesLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Regras de Automação - OmniBridge</h1>
          <Activity className="h-4 w-4 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Regras de Automação - OmniBridge
          </h1>
          <p className="text-gray-600 mt-1">Gerencie regras automáticas para processamento de mensagens em todos os canais</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Sistema Ativo</span>
          </div>
          <Button 
            onClick={() => setRuleDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Regras</p>
                <p className="text-2xl font-bold">{metrics.rulesCount || 0}</p>
              </div>
              <Workflow className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.enabledRulesCount || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Execuções</p>
                <p className="text-2xl font-bold">{metrics.totalExecutions || 0}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{metrics.successRate || 0}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              média geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens Processadas</p>
                <p className="text-2xl font-bold">{metrics.messagesProcessed || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              hoje
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Regras de Automação
              </CardTitle>
              <CardDescription>
                Configure regras para processamento automático de mensagens de todos os canais do OmniBridge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {rules.map((rule: any) => (
                    <Card key={rule.id} className="relative border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <Bot className="h-4 w-4 text-blue-600" />
                              {rule.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.enabled ? "default" : "secondary"}>
                              {rule.enabled ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Filter className="h-3 w-3" />
                              {rule.conditionsCount} condições
                            </span>
                            <span className="flex items-center gap-1 mt-1">
                              <Zap className="h-3 w-3" />
                              {rule.actionsCount} ações
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Prioridade {rule.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedRule(rule);
                              setTestData('{\n  "message": "Exemplo de mensagem do OmniBridge",\n  "sender": "user@example.com",\n  "channel": "email",\n  "subject": "Teste de Automação"\n}');
                              setTestDialogOpen(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Testar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                            disabled={deleteRuleMutation.isPending}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma regra configurada</h3>
                  <p className="text-gray-500 mb-4">Crie sua primeira regra de automação para o OmniBridge</p>
                  <Button onClick={() => setRuleDialogOpen(true)} className="flex items-center gap-2 mx-auto">
                    <Plus className="h-4 w-4" />
                    Nova Regra
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Regras
              </CardTitle>
              <CardDescription>
                Templates pré-configurados para cenários comuns de automação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email Auto-Reply Template */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Mail className="h-8 w-8 text-blue-500" />
                      <Badge variant="secondary">Email</Badge>
                    </div>
                    <h4 className="font-medium mb-2">Resposta Automática por Email</h4>
                    <p className="text-sm text-gray-500 mb-4">Responde automaticamente emails de suporte com template padrão</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>

                {/* WhatsApp Auto-Response Template */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <MessageCircle className="h-8 w-8 text-green-500" />
                      <Badge variant="secondary">WhatsApp</Badge>
                    </div>
                    <h4 className="font-medium mb-2">Resposta WhatsApp Business</h4>
                    <p className="text-sm text-gray-500 mb-4">Resposta automática para mensagens fora do horário comercial</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>

                {/* Ticket Creation Template */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="h-8 w-8 text-purple-500" />
                      <Badge variant="secondary">Ticket</Badge>
                    </div>
                    <h4 className="font-medium mb-2">Criação Automática de Ticket</h4>
                    <p className="text-sm text-gray-500 mb-4">Cria tickets automaticamente para palavras-chave específicas</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics de Automação
              </CardTitle>
              <CardDescription>
                Monitore o desempenho das suas regras de automação do OmniBridge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Execuções por Canal</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </span>
                        <Badge variant="outline">45%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </span>
                        <Badge variant="outline">30%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Telegram
                        </span>
                        <Badge variant="outline">25%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Performance Recente</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Execuções Hoje</span>
                        <Badge variant="default">{metrics.todayExecutions || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Taxa de Sucesso</span>
                        <Badge variant="default">{metrics.successRate || 0}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tempo Médio</span>
                        <Badge variant="outline">{metrics.averageTime || 0}ms</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Gráficos detalhados em desenvolvimento</p>
                    <p className="text-sm text-gray-400 mt-2">Visualizações avançadas e relatórios personalizados</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema de Automação
              </CardTitle>
              <CardDescription>
                Configure parâmetros globais do sistema de automação do OmniBridge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Sistema de Automação
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Sistema Ativo</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Log Detalhado</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Retry Automático</Label>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Limites e Timeouts
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Max. Execuções/min</Label>
                          <Input type="number" defaultValue="100" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-sm">Timeout (ms)</Label>
                          <Input type="number" defaultValue="5000" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-sm">Tentativas</Label>
                          <Input type="number" defaultValue="3" className="mt-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Integrações Disponíveis
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <Label className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <Label className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Telegram
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch />
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Webhook
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Nova Regra de Automação - OmniBridge
            </DialogTitle>
            <DialogDescription>
              Configure uma nova regra para processar mensagens automaticamente em todos os canais do OmniBridge
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Nome da Regra</Label>
                <Input
                  id="ruleName"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Ex: Resposta Automática para Suporte"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority.toString()} onValueChange={(value) => setPriority(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Baixa</SelectItem>
                    <SelectItem value="2">2 - Média</SelectItem>
                    <SelectItem value="3">3 - Alta</SelectItem>
                    <SelectItem value="4">4 - Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleDescription">Descrição</Label>
              <Textarea
                id="ruleDescription"
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                placeholder="Descreva o que esta regra faz..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="enabled">Regra ativada</Label>
            </div>

            <Separator />

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Condições</Label>
                <Button size="sm" variant="outline" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Condição
                </Button>
              </div>

              {conditions.map((condition, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-sm">Campo</Label>
                    <Select 
                      value={condition.field} 
                      onValueChange={(value) => updateCondition(index, 'field', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sender">Remetente</SelectItem>
                        <SelectItem value="subject">Assunto</SelectItem>
                        <SelectItem value="body">Conteúdo</SelectItem>
                        <SelectItem value="channel">Canal (email, whatsapp, telegram)</SelectItem>
                        <SelectItem value="priority">Prioridade</SelectItem>
                        <SelectItem value="attachments">Anexos</SelectItem>
                        <SelectItem value="keywords">Palavras-chave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Label className="text-sm">Operador</Label>
                    <Select 
                      value={condition.operator} 
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Igual a</SelectItem>
                        <SelectItem value="contains">Contém</SelectItem>
                        <SelectItem value="startsWith">Começa com</SelectItem>
                        <SelectItem value="endsWith">Termina com</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                        <SelectItem value="not_equals">Diferente de</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4">
                    <Label className="text-sm">Valor</Label>
                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Valor para comparação"
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCondition(index)}
                      disabled={conditions.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Ações</Label>
                <Button size="sm" variant="outline" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Ação
                </Button>
              </div>

              {actions.map((action, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Label className="text-sm">Tipo de Ação</Label>
                    <Select 
                      value={action.type} 
                      onValueChange={(value) => updateAction(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendNotification">Enviar Notificação</SelectItem>
                        <SelectItem value="createTicket">Criar Ticket</SelectItem>
                        <SelectItem value="assignUser">Atribuir Usuário</SelectItem>
                        <SelectItem value="sendEmail">Enviar Email</SelectItem>
                        <SelectItem value="sendWhatsApp">Enviar WhatsApp</SelectItem>
                        <SelectItem value="sendTelegram">Enviar Telegram</SelectItem>
                        <SelectItem value="webhook">Chamar Webhook</SelectItem>
                        <SelectItem value="markAsRead">Marcar como Lida</SelectItem>
                        <SelectItem value="moveToFolder">Mover para Pasta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-5">
                    <Label className="text-sm">Parâmetros (JSON)</Label>
                    <Input
                      value={JSON.stringify(action.parameters)}
                      onChange={(e) => {
                        try {
                          const params = JSON.parse(e.target.value);
                          updateAction(index, 'parameters', params);
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      placeholder='{"message": "Texto da ação", "template": "nome_template"}'
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeAction(index)}
                      disabled={actions.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateRule}
              disabled={createRuleMutation.isPending}
              className="flex items-center gap-2"
            >
              {createRuleMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Criar Regra
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Rule Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Testar Regra: {selectedRule?.name}
            </DialogTitle>
            <DialogDescription>
              Teste a regra com dados simulados do OmniBridge para verificar se funciona corretamente
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="testData">Dados de Teste (JSON)</Label>
              <Textarea
                id="testData"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder='{"sender": "test@example.com", "subject": "Teste", "body": "Mensagem de teste", "channel": "email"}'
                className="font-mono text-sm"
                rows={8}
              />
              <p className="text-xs text-gray-500">
                Forneça dados no formato JSON simulando uma mensagem real do OmniBridge
              </p>
              <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                <strong>Campos disponíveis:</strong> sender, subject, body, channel, priority, attachments, keywords, timestamp
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleTestRule}
              disabled={testRuleMutation.isPending}
              className="flex items-center gap-2"
            >
              {testRuleMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Executar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}