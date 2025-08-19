
/**
 * Translation Completion Panel
 * Automated translation completion interface following 1qa.md patterns
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  Search, 
  TrendingUp,
  Globe,
  AlertCircle
} from 'lucide-react';

interface TranslationStats {
  existingKeys: number;
  missingKeys: number;
  completeness: number;
}

interface CompletionReport {
  summary: {
    totalKeys: number;
    languageStats: Record<string, TranslationStats>;
  };
  gaps: Array<{
    language: string;
    missingKeys: string[];
    moduleGaps: Record<string, string[]>;
  }>;
}

export function TranslationCompletionPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Query para análise de completude
  const { data: completionReport, isLoading: isLoadingReport, refetch } = useQuery({
    queryKey: ['/api/translation-completion/analyze'],
    staleTime: 30000, // 30 segundos
  });

  // Query para chaves escaneadas
  const { data: scannedKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['/api/translation-completion/scan-keys'],
    staleTime: 60000, // 1 minuto
  });

  // Mutation para completar traduções
  const completeTranslationsMutation = useMutation({
    mutationFn: async (data: { force: boolean; languages: string[] }) => {
      const res = await apiRequest('POST', '/api/translation-completion/complete', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Traduções Completadas",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/translation-completion/analyze'] });
      queryClient.invalidateQueries({ queryKey: ['/api/translations/keys/all'] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao completar traduções",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para validar integridade
  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/translation-completion/validate');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.data.isHealthy) {
        toast({
          title: "Sistema de Traduções Saudável",
          description: "Todas as traduções estão em bom estado!",
        });
      } else {
        toast({
          title: "Problemas Detectados",
          description: `${data.data.issues.critical.length} problemas críticos encontrados`,
          variant: "destructive",
        });
      }
    }
  });

  const handleCompleteTranslations = (force: boolean = false) => {
    completeTranslationsMutation.mutate({ 
      force, 
      languages: selectedLanguages 
    });
  };

  const getCompletenessColor = (completeness: number): string => {
    if (completeness >= 90) return 'text-green-600';
    if (completeness >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletenessVariant = (completeness: number): 'default' | 'secondary' | 'destructive' => {
    if (completeness >= 90) return 'default';
    if (completeness >= 70) return 'secondary';
    return 'destructive';
  };

  if (isLoadingReport) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Analisando completude das traduções...</span>
        </div>
      </div>
    );
  }

  const report = completionReport?.data as CompletionReport;
  const keysData = scannedKeys?.data;

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Completude das Traduções</h2>
          <p className="text-muted-foreground">
            Análise automática e completude de traduções para todos os módulos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoadingReport}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reanalizar
          </Button>
          <Button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Validar Integridade
          </Button>
        </div>
      </div>

      {/* Resumo estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Chaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.summary.totalKeys || 0}</div>
            <p className="text-xs text-muted-foreground">
              Detectadas no código fonte
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Idiomas Suportados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              en, pt-BR, es, fr, de
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completude Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report?.summary.languageStats ? 
                Math.round(
                  Object.values(report.summary.languageStats)
                    .reduce((sum, stats) => sum + stats.completeness, 0) / 
                  Object.keys(report.summary.languageStats).length
                ) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as linguagens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Módulos Escaneados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {keysData?.keysByModule ? Object.keys(keysData.keysByModule).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Com chaves detectadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="languages">Por Idioma</TabsTrigger>
          <TabsTrigger value="modules">Por Módulo</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Status dos Idiomas
              </CardTitle>
              <CardDescription>
                Completude das traduções por idioma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report?.summary.languageStats && 
                Object.entries(report.summary.languageStats).map(([language, stats]) => (
                  <div key={language} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getCompletenessVariant(stats.completeness)}>
                          {language}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {stats.existingKeys} de {stats.existingKeys + stats.missingKeys} chaves
                        </span>
                      </div>
                      <span className={`font-medium ${getCompletenessColor(stats.completeness)}`}>
                        {stats.completeness.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={stats.completeness} className="h-2" />
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          {report?.gaps.map((gap) => (
            <Card key={gap.language}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{gap.language}</span>
                  <Badge 
                    variant={gap.missingKeys.length === 0 ? 'default' : 'destructive'}
                  >
                    {gap.missingKeys.length} faltando
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gap.missingKeys.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Todas as traduções estão completas!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Chaves faltantes por módulo:
                    </div>
                    {Object.entries(gap.moduleGaps).map(([module, keys]) => (
                      <div key={module} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{module}</span>
                        <Badge variant="outline">{keys.length} chaves</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Módulo</CardTitle>
              <CardDescription>
                Chaves de tradução detectadas por módulo do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keysData?.keysByModule && (
                <div className="space-y-3">
                  {Object.entries(keysData.keysByModule).map(([module, keys]) => (
                    <div key={module} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{module}</div>
                        <div className="text-sm text-muted-foreground">
                          {keys.filter((k: any) => k.priority === 'high').length} alta prioridade, {' '}
                          {keys.filter((k: any) => k.priority === 'medium').length} média, {' '}
                          {keys.filter((k: any) => k.priority === 'low').length} baixa
                        </div>
                      </div>
                      <Badge variant="outline">{keys.length} chaves</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Completude Automática
              </CardTitle>
              <CardDescription>
                Complete automaticamente as traduções faltantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A completude automática usará traduções pré-definidas quando disponíveis 
                  ou gerará fallbacks baseados nas chaves em inglês.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Selecionar Idiomas (opcional)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['pt-BR', 'es', 'fr', 'de'].map((lang) => (
                      <Button
                        key={lang}
                        variant={selectedLanguages.includes(lang) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedLanguages(prev => 
                            prev.includes(lang) 
                              ? prev.filter(l => l !== lang)
                              : [...prev, lang]
                          );
                        }}
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para processar todos os idiomas
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCompleteTranslations(false)}
                    disabled={completeTranslationsMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {completeTranslationsMutation.isPending ? 'Processando...' : 'Completar Traduções'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCompleteTranslations(true)}
                    disabled={completeTranslationsMutation.isPending}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Forçar Todas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
