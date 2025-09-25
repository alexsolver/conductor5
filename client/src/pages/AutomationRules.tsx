import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Settings, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
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
import AutomationRuleBuilder from '@/components/omnibridge/AutomationRuleBuilder';


export default function AutomationRules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Debug log para verificar se o componente está montando
  useEffect(() => {
    console.log('🤖 [AutomationRules] Component mounted, user:', !!user);
    console.log('🤖 [AutomationRules] User details:', { 
      hasUser: !!user, 
      hasEmail: !!user?.email, 
      tenantId: user?.tenantId 
    });
    return () => console.log('🤖 [AutomationRules] Component unmounted');
  }, []);

  // Debug quando user muda
  useEffect(() => {
    console.log('🔍 [AutomationRules] User state changed:', {
      hasUser: !!user,
      userEmail: user?.email,
      tenantId: user?.tenantId,
      queryEnabled: !!user
    });
  }, [user]);


  // Buscar regras de automação
  const { data: rulesData, isLoading, error: rulesError } = useQuery({
    queryKey: ['automation-rules'],
    enabled: !!user, // ✅ Aguarda autenticação estar pronta
    queryFn: async () => {
      console.log('🔄 [AutomationRules] Attempting to fetch rules...');
      const response = await apiRequest('GET', '/api/omnibridge/automation-rules');
      const result = await response.json();
      console.log('✅ [AutomationRules] Rules fetched successfully:', result);

      // ✅ Mapeamento correto da resposta do backend
      return {
        success: result.success || false,
        rules: Array.isArray(result.data) ? result.data : [], // ✅ backend retorna result.data
        total: result.total || 0,
        metadata: result.stats || {}
      };
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 5000, // ✅ Reduzido para debug
    gcTime: 300000,
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: any) => {
        console.error('❌ [AutomationRules] Final error after retries:', error);
        setLoadingError(`Erro ao carregar regras de automação: ${error?.message || 'Serviço temporariamente indisponível'}`);
      },
      onSuccess: (data: any) => {
        console.log('✅ [AutomationRules] Rules query successful:', data);
        setLoadingError(null);
      }
    }
  });

  // Fallback de dados para desenvolvimento se API falhar
  const mockRules: any[] = [];
  const mockMetrics = {
    rulesCount: 0,
    enabledRulesCount: 0,
    rulesExecuted: 0,
    actionsTriggered: 0,
    successRate: 100,
    avgExecutionTime: 0
  };

  // Métricas (usando dados mock enquanto endpoint não existe)
  const metricsData = mockMetrics;
  const metricsError = null;

  // Mutation para deletar regra
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiRequest('DELETE', `/api/omnibridge/automation-rules/${ruleId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-metrics'] });
      toast({
        title: '✅ Regra deletada',
        description: 'Regra de automação deletada com sucesso!'
      });
    }
  });


  // Verificações robustas de segurança para evitar undefined errors
  const rules = useMemo(() => {
    try {
      if (Array.isArray(rulesData?.rules)) {
        return rulesData.rules.filter(rule => rule && typeof rule === 'object');
      }
      if (Array.isArray(rulesData)) {
        return rulesData.filter(rule => rule && typeof rule === 'object');
      }
      return [];
    } catch (error) {
      console.error('🚨 [AutomationRules] Error processing rules data:', error);
      return [];
    }
  }, [rulesData]);

  const metrics = useMemo(() => {
    try {
      const defaultMetrics = { rulesCount: 0, enabledRulesCount: 0, rulesExecuted: 0, actionsTriggered: 0, successRate: 100, avgExecutionTime: 0 };
      if (metricsData && typeof metricsData === 'object') {
        return {
          ...defaultMetrics,
          ...metricsData
        };
      }
      return defaultMetrics;
    } catch (error) {
      console.error('🚨 [AutomationRules] Error processing metrics data:', error);
      return { rulesCount: 0, enabledRulesCount: 0, rulesExecuted: 0, actionsTriggered: 0, successRate: 100, avgExecutionTime: 0 };
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
          id: String(rule.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
          name: String(rule.name || 'Nome não disponível'),
          description: String(rule.description || 'Descrição não disponível'),
          enabled: Boolean(rule.enabled),
          priority: Number(rule.priority) || 1,
          conditionsCount: Number(rule.conditionsCount) || 0,
          actionsCount: Number(rule.actionsCount) || 0,
          // CRITICAL FIX: Include trigger and actions data
          trigger: rule.trigger || null,
          triggers: rule.triggers || null,
          actions: rule.actions || null,
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Página</h3>
            <p className="text-muted-foreground mb-4">
              {loadingError || rulesError?.message || 'Não foi possível carregar as regras de automação'}
            </p>
            <div className="flex gap-2 justify-center">
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
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Detalhes do Erro (Dev)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Regras de Automação</h2>
          <p className="text-muted-foreground">
            Configure regras inteligentes para automatizar o roteamento e resposta de mensagens
          </p>
        </div>

        <div>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-nova-regra">
            <Plus className="mr-2 h-4 w-4" />
            Nova Regra
          </Button>

          <AutomationRuleBuilder
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onSave={async (rule) => {
              console.log('🔄 [AutomationRules] Rule saved, invalidating cache and refetching...');

              try {
                // Force immediate cache invalidation and refetch with no cache
                await queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
                await queryClient.refetchQueries({ 
                  queryKey: ['automation-rules'],
                  type: 'active'
                });

                // Force a hard refresh of the data
                await new Promise(resolve => setTimeout(resolve, 100));
                await queryClient.refetchQueries({ queryKey: ['automation-rules'] });

                console.log('✅ [AutomationRules] Cache invalidated and refetched successfully');
              } catch (error) {
                console.error('❌ [AutomationRules] Error refreshing data:', error);
              }

              setIsCreateDialogOpen(false);
              toast({
                title: '✅ Regra criada',
                description: 'Regra de automação criada com sucesso!'
              });
            }}
          />

          <AutomationRuleBuilder
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingRule(null);
            }}
            existingRule={editingRule}
            onSave={async (rule) => {
              console.log('🔄 [AutomationRules] Rule updated, invalidating cache and refetching...');

              try {
                // Force immediate cache invalidation and refetch with no cache
                await queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
                await queryClient.refetchQueries({ 
                  queryKey: ['automation-rules'],
                  type: 'active'
                });

                // Force a hard refresh of the data
                await new Promise(resolve => setTimeout(resolve, 100));
                await queryClient.refetchQueries({ queryKey: ['automation-rules'] });

                console.log('✅ [AutomationRules] Cache invalidated and refetched successfully');
              } catch (error) {
                console.error('❌ [AutomationRules] Error refreshing data:', error);
              }

              setIsEditDialogOpen(false);
              setEditingRule(null);
              toast({
                title: '✅ Regra atualizada',
                description: 'Regra de automação atualizada com sucesso!'
              });
            }}
          />
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rulesCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.enabledRulesCount || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regras Executadas</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rulesExecuted || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total executadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Disparadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.actionsTriggered || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ações executadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate || 100}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgExecutionTime || 0}ms média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Regras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Regras Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando regras de automação...</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Conectando com o serviço de automação...
              </p>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma regra de automação configurada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crie sua primeira regra para automatizar o processamento de mensagens
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(safeRules) && safeRules.length > 0 ? (
                safeRules.map((rule: any, index: number) => {
                  // Validação tripla para cada regra
                  if (!rule || typeof rule !== 'object') {
                    console.warn(`🚨 [AutomationRules] Invalid rule at index ${index}:`, rule);
                    return null;
                  }

                  if (!rule.id) {
                    console.warn(`🚨 [AutomationRules] Rule without ID at index ${index}:`, rule);
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
                    <div key={displayRule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {displayRule.enabled ? (
                            <Play className="h-4 w-4 text-green-600" />
                          ) : (
                            <Pause className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium">{displayRule.name}</p>
                            <p className="text-sm text-muted-foreground">{displayRule.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Prioridade {displayRule.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {displayRule.conditionsCount} condições
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {displayRule.actionsCount} ações
                              </Badge>
                              <Badge variant={displayRule.enabled ? 'default' : 'secondary'} className="text-xs">
                                {displayRule.enabled ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRule(rule);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
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
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Nenhuma regra processada com segurança</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}