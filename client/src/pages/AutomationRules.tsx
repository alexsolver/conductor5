
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
// import useLocalization from '@/hooks/useLocalization';
  Bot, 
  Settings, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  TestTube,
  BarChart3,
  Zap,
  Target,
  Filter,
  MessageSquare,
  Tag,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const automationRuleSchema = z.object({
  // Localization temporarily disabled

  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string(),
  enabled: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string(),
    logicalOperator: z.string().optional()
  })).min(1, 'Pelo menos uma condição é necessária'),
  actions: z.array(z.object({
    type: z.string(),
    target: z.string(),
    params: z.record(z.any())
  })).min(1, 'Pelo menos uma ação é necessária')
});

type AutomationRuleForm = z.infer<typeof automationRuleSchema>;

export default function AutomationRules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [testData, setTestData] = useState('{}');
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Debug log para verificar se o componente está montando
  useEffect(() => {
    console.log('🤖 [AutomationRules] Component mounted');
    return () => console.log('🤖 [AutomationRules] Component unmounted');
  }, []);

  const form = useForm<AutomationRuleForm>({
    resolver: zodResolver(automationRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      enabled: true,
      priority: 1,
      conditions: [{ field: 'message', operator: 'contains', value: '', logicalOperator: 'AND' }],
      actions: [{ type: 'send_message', target: 'telegram', params: {} }]
    }
  });

  // Buscar regras de automação
  const { data: rulesData, isLoading, error: rulesError } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      console.log('🔄 [AutomationRules] Attempting to fetch rules...');
      try {
        const result = await apiRequest('/api/automation-rules');
        console.log('✅ [AutomationRules] Rules fetched successfully:', result);
        
        // Garantir estrutura consistente
        if (!result || typeof result !== 'object') {
          console.warn('🚨 [AutomationRules] Invalid API response format');
          return { success: false, rules: [], total: 0 };
        }
        
        return {
          success: result.success || false,
          rules: Array.isArray(result.rules) ? result.rules : [],
          total: result.total || 0,
          metadata: result.metadata || {}
        };
      } catch (error) {
        console.error('❌ [AutomationRules] API Request failed:', error);
        // Retornar estrutura segura mesmo com erro
        return { success: false, rules: [], total: 0, error: error.message };
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 30000,
    cacheTime: 300000,
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      console.error('❌ [AutomationRules] Final error after retries:', error);
      setLoadingError('[TRANSLATION_NEEDED]'Serviço temporariamente indisponível'");
    },
    onSuccess: (data) => {
      console.log('✅ [AutomationRules] Rules query successful:', data);
      setLoadingError(null);
    }
  });

  // Buscar métricas
  const { data: metricsData, error: metricsError } = useQuery({
    queryKey: ['automation-metrics'],
    queryFn: () => apiRequest('/api/automation-rules/metrics/overview'),
    retry: 1,
    retryDelay: 1000,
    onError: (error: any) => {
      console.error('❌ [AutomationRules] Error loading metrics:', error);
    },
    onSuccess: (data) => {
      console.log('✅ [AutomationRules] Metrics loaded successfully:', data);
    }
  });

  // Mutation para criar regra
  const createRuleMutation = useMutation({
    mutationFn: (data: AutomationRuleForm) =>
      apiRequest('/api/automation-rules', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-metrics'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: '✅ Regra criada',
        description: 'Regra de automação criada com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: 'destructive'
      });
    }
  });

  // Mutation para deletar regra
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) =>
      apiRequest("
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-metrics'] });
      toast({
        title: '✅ Regra deletada',
        description: 'Regra de automação deletada com sucesso!'
      });
    }
  });

  // Mutation para testar regra
  const testRuleMutation = useMutation({
    mutationFn: ({ ruleId, testData }: { ruleId: string; testData: any }) =>
      apiRequest("/test`, {
        method: 'POST',
        body: JSON.stringify({ testData })
      }),
    onSuccess: (data) => {
      toast({
        title: data.test.matches ? '✅ Regra Compatível' : '❌ Regra Não Compatível',
        description: "
        variant: data.test.matches ? 'default' : 'destructive'
      });
    }
  });

  const handleSubmit = (data: AutomationRuleForm) => {
    createRuleMutation.mutate(data);
  };

  const handleTestRule = (ruleId: string) => {
    try {
      const parsedTestData = JSON.parse(testData);
      testRuleMutation.mutate({ ruleId, testData: parsedTestData });
    } catch (error) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: 'Dados de teste inválidos (JSON malformado)',
        variant: 'destructive'
      });
    }
  };

  const addCondition = () => {
    const currentConditions = form.getValues('conditions');
    form.setValue('conditions', [
      ...currentConditions,
      { field: 'message', operator: 'contains', value: '', logicalOperator: 'AND' }
    ]);
  };

  const addAction = () => {
    const currentActions = form.getValues('actions');
    form.setValue('actions', [
      ...currentActions,
      { type: 'send_message', target: 'telegram', params: {} }
    ]);
  };

  // Fallback de dados para desenvolvimento se API falhar
  const mockRules = [];
  const mockMetrics = {
    rulesCount: 0,
    enabledRulesCount: 0,
    rulesExecuted: 0,
    actionsTriggered: 0,
    successRate: 100,
    avgExecutionTime: 0
  };

  // Verificações robustas de segurança para evitar undefined errors
  const rules = useMemo(() => {
    try {
      if (Array.isArray(rulesData?.rules)) {
        return rulesData.rules.filter(rule => rule && typeof rule === 'object');
      }
      if (Array.isArray(rulesData)) {
        return rulesData.filter(rule => rule && typeof rule === 'object');
      }
      return mockRules;
    } catch (error) {
      console.error('🚨 [AutomationRules] Error processing rules data:', error);
      return mockRules;
    }
  }, [rulesData]);

  const metrics = useMemo(() => {
    try {
      if (metricsData?.metrics && typeof metricsData.metrics === 'object') {
        return {
          ...mockMetrics,
          ...metricsData.metrics
        };
      }
      return mockMetrics;
    } catch (error) {
      console.error('🚨 [AutomationRules] Error processing metrics data:', error);
      return mockMetrics;
    }
  }, [metricsData]);

  // Validação robusta para evitar erros de includes e undefined
  const safeRules = useMemo(() => {
    console.log('🔍 [AutomationRules] Processing rules data:', { rules, type: typeof rules, isArray: Array.isArray(rules) });
    
    if (!rules) {
      console.warn('🚨 [AutomationRules] Rules is null/undefined');
      return [];
    }
    
    if (!Array.isArray(rules)) {
      console.warn('🚨 [AutomationRules] Rules is not an array:', rules);
      return [];
    }
    
    const processedRules = rules
      .filter(rule => {
        const isValid = rule && typeof rule === 'object' && rule.id;
        if (!isValid) {
          console.warn('🚨 [AutomationRules] Invalid rule filtered out:', rule);
        }
        return isValid;
      })
      .map(rule => {
        const safeRule = {
          id: String(rule.id || "
          name: String(rule.name || 'Nome não disponível'),
          description: String(rule.description || 'Descrição não disponível'),
          enabled: Boolean(rule.enabled),
          priority: Number(rule.priority) || 1,
          conditionsCount: Number(rule.conditionsCount) || 0,
          actionsCount: Number(rule.actionsCount) || 0,
          createdAt: rule.createdAt || new Date().toISOString(),
          updatedAt: rule.updatedAt || new Date().toISOString()
        };
        
        console.log('🔄 [AutomationRules] Processed rule:', safeRule.id, safeRule.name);
        return safeRule;
      });
    
    console.log('✅ [AutomationRules] Total processed rules:', processedRules.length);
    return processedRules;
  }, [rules]);

  // Early return se houver erro crítico
  if (loadingError || rulesError) {
    return (
      <div className=""
        <div className=""
          <div className=""
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Página</h3>
            <p className=""
              {loadingError || rulesError?.message || 'Não foi possível carregar as regras de automação'}
            </p>
            <div className=""
              <Button 
                onClick={() => {
                  setLoadingError(null);
                  queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
                }}
              >
                🔄 Tentar Novamente
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                🔃 Recarregar Página
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className=""
                <summary className=""
                  Detalhes do Erro (Dev)
                </summary>
                <pre className=""
                  {JSON.stringify(rulesError || loadingError, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  console.log('🤖 [AutomationRules] Rendering with data:', { 
    rulesCount: rules.length, 
    metricsLoaded: !!metricsData,
    isLoading 
  });

  return (
    <div className=""
      <div className=""
        <div>
          <h2 className="text-3xl font-bold tracking-tight">🤖 Regras de Automação</h2>
          <p className=""
            Configure regras inteligentes para automatizar o roteamento e resposta de mensagens
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          
          <DialogContent className=""
            <DialogHeader>
              <DialogTitle>🤖 Criar Regra de Automação</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className=""
                <div className=""
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Regra</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Auto-resposta suporte" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Maior número = maior prioridade</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o que esta regra faz..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className=""
                      <div className=""
                        <FormLabel className="text-base">Regra Ativa</FormLabel>
                        <FormDescription>
                          A regra será executada automaticamente quando ativa
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Condições */}
                <div className=""
                  <div className=""
                    <Label className="text-base font-medium">🎯 Condições (IF)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Condição
                    </Button>
                  </div>

                  {(form.watch('conditions') || []).map((_, index) => (
                    <div key={index} className=""
                      <div className=""
                        <Label className="text-xs">Campo</Label>
                        <Select
                          value={form.watch(".field`)}
                          onValueChange={(value) => form.setValue(".field`, value)}
                        >
                          <SelectTrigger className=""
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="message">Mensagem</SelectItem>
                            <SelectItem value="sender">Remetente</SelectItem>
                            <SelectItem value="priority">Prioridade</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="hour">Hora</SelectItem>
                            <SelectItem value="platform">Plataforma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className=""
                        <Label className="text-xs">Operador</Label>
                        <Select
                          value={form.watch(".operator`)}
                          onValueChange={(value) => form.setValue(".operator`, value)}
                        >
                          <SelectTrigger className=""
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Igual a</SelectItem>
                            <SelectItem value="contains">Contém</SelectItem>
                            <SelectItem value="startsWith">Começa com</SelectItem>
                            <SelectItem value="endsWith">Termina com</SelectItem>
                            <SelectItem value="greaterThan">Maior que</SelectItem>
                            <SelectItem value="lessThan">Menor que</SelectItem>
                            <SelectItem value="regex">Regex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className=""
                        <Label className="text-xs">Valor</Label>
                        <Input
                          className="h-8"
                          placeholder="Valor para comparação"
                          value={form.watch(".value`)}
                          onChange={(e) => form.setValue(".value`, e.target.value)}
                        />
                      </div>

                      <div className=""
                        <Label className="text-xs">Lógica</Label>
                        <Select
                          value={form.watch(".logicalOperator`) || 'AND'}
                          onValueChange={(value) => form.setValue(".logicalOperator`, value)}
                        >
                          <SelectTrigger className=""
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">E</SelectItem>
                            <SelectItem value="OR">OU</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className=""
                  <div className=""
                    <Label className="text-base font-medium">⚡ Ações (THEN)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAction}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Ação
                    </Button>
                  </div>

                  {(form.watch('actions') || []).map((_, index) => (
                    <div key={index} className=""
                      <div className=""
                        <Label className="text-xs">Tipo de Ação</Label>
                        <Select
                          value={form.watch(".type`)}
                          onValueChange={(value) => form.setValue(".type`, value)}
                        >
                          <SelectTrigger className=""
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                            <SelectItem value="assign_user">Atribuir Usuário</SelectItem>
                            <SelectItem value="add_tag">Adicionar Tag</SelectItem>
                            <SelectItem value="change_status">Mudar Status</SelectItem>
                            <SelectItem value="escalate">Escalar</SelectItem>
                            <SelectItem value="create_ticket">Criar Ticket</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className=""
                        <Label className="text-xs">Destino</Label>
                        <Input
                          className="h-8"
                          placeholder="Ex: telegram, manager, high_priority"
                          value={form.watch(".target`)}
                          onChange={(e) => form.setValue(".target`, e.target.value)}
                        />
                      </div>

                      <div className=""
                        <Label className="text-xs">Parâmetros (JSON)</Label>
                        <Input
                          className="h-8"
                          placeholder='{"message": "Auto-resposta"}'
                          value={JSON.stringify(form.watch(".params`))}
                          onChange={(e) => {
                            try {
                              const params = JSON.parse(e.target.value);
                              form.setValue(".params`, params);
                            } catch {
                              // Ignore invalid JSON while typing
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className=""
                  <Button type="submit" disabled={createRuleMutation.isPending}>
                    {createRuleMutation.isPending ? '🔄 Criando...' : '✅ Criar Regra'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas */}
      <div className=""
        <Card>
          <CardHeader className=""
            <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rulesCount || 0}</div>
            <p className=""
              {metrics.enabledRulesCount || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className=""
            <CardTitle className="text-sm font-medium">Regras Executadas</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rulesExecuted || 0}</div>
            <p className=""
              Total executadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className=""
            <CardTitle className="text-sm font-medium">Ações Disparadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.actionsTriggered || 0}</div>
            <p className=""
              Ações executadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className=""
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate || 100}%</div>
            <p className=""
              {metrics.avgExecutionTime || 0}ms média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Regras */}
      <Card>
        <CardHeader>
          <CardTitle className=""
            <Settings className="h-5 w-5" />
            Regras Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className=""
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando regras de automação...</p>
              <p className=""
                Conectando com o serviço de automação...
              </p>
            </div>
          ) : rules.length === 0 ? (
            <div className=""
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma regra de automação configurada</p>
              <p className=""
                Crie sua primeira regra para automatizar o processamento de mensagens
              </p>
            </div>
          ) : (
            <div className=""
              {Array.isArray(safeRules) && safeRules.length > 0 ? (
                safeRules.map((rule: any, index: number) => {
                  // Validação tripla para cada regra
                  if (!rule || typeof rule !== 'object') {
                    console.warn(":`, rule);
                    return null;
                  }

                  if (!rule.id) {
                    console.warn(":`, rule);
                    return null;
                  }

                  // Garantir que todas as propriedades sejam seguras
                  const displayRule = {
                    id: String(rule.id),
                    name: String(rule.name || 'Nome não disponível'),
                    description: String(rule.description || 'Descrição não disponível'),
                    enabled: Boolean(rule.enabled),
                    priority: Number(rule.priority) || 1,
                    conditionsCount: Number(rule.conditionsCount) || 0,
                    actionsCount: Number(rule.actionsCount) || 0
                  };
                  
                  return (
                    <div key={displayRule.id} className=""
                      <div className=""
                        <div className=""
                          {displayRule.enabled ? (
                            <Play className="h-4 w-4 text-green-600" />
                          ) : (
                            <Pause className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium">{displayRule.name}</p>
                            <p className="text-sm text-muted-foreground">{displayRule.description}</p>
                            <div className=""
                              <Badge variant="outline" className=""
                                Prioridade {displayRule.priority}
                              </Badge>
                              <Badge variant="outline" className=""
                                {displayRule.conditionsCount} condições
                              </Badge>
                              <Badge variant="outline" className=""
                                {displayRule.actionsCount} ações
                              </Badge>
                              <Badge variant={displayRule.enabled ? 'default' : 'secondary'} className=""
                                {displayRule.enabled ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className=""
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRule(displayRule);
                            setTestData('{"message": "teste suporte", "sender": "João", "hour": 14}');
                          }}
                        >
                          <TestTube className="h-4 w-4" />
                          Testar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(displayRule.id)}
                          disabled={deleteRuleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className=""
                  <p className="text-muted-foreground">Nenhuma regra processada com segurança</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Teste */}
      {selectedRule && (
        <Dialog open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
          <DialogContent className=""
            <DialogHeader>
              <DialogTitle>🧪 Testar Regra: {selectedRule.name || 'Regra'}</DialogTitle>
            </DialogHeader>
            
            <div className=""
              <div>
                <Label>Dados de Teste (JSON)</Label>
                <Textarea
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  placeholder='{"message": "suporte", "sender": "João", "hour": 14}'
                  className="h-32 font-mono text-sm"
                />
                <p className=""
                  Configure os dados que serão usados para testar a regra
                </p>
              </div>

              <div className=""
                <Button
                  onClick={() => handleTestRule(selectedRule.id)}
                  disabled={testRuleMutation.isPending}
                >
                  {testRuleMutation.isPending ? '🔄 Testando...' : '🧪 Executar Teste'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedRule(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
