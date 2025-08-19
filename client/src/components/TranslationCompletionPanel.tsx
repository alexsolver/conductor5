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
  AlertCircle,
  Loader2,
  Eye,
  Replace
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

interface HardcodedText {
  file: string;
  line: number;
  text: string;
  suggestedKey: string;
  context: string;
}

export function TranslationCompletionPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDetectingHardcoded, setIsDetectingHardcoded] = useState(false);
  const [isReplacingHardcoded, setIsReplacingHardcoded] = useState(false);
  const [hardcodedTexts, setHardcodedTexts] = useState<HardcodedText[]>([]);
  const [replacementResults, setReplacementResults] = useState<any>(null);


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

  // Completar traduções automaticamente
  const handleCompleteTranslations = async (force = false) => {
    setIsCompleting(true);
    try {
      const response = await apiRequest('/api/translation-completion/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force })
      });

      if (response.success) {
        toast({
          title: "Traduções Completadas",
          description: response.message,
        });

        // Atualiza os dados
        await refetch(); // Usando refetch diretamente para revalidar
      }
    } catch (error: any) {
      console.error('Error completing translations:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao completar traduções",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Detectar textos hardcoded
  const handleDetectHardcoded = async () => {
    setIsDetectingHardcoded(true);
    try {
      const response = await apiRequest('/api/translation-completion/detect-hardcoded');

      if (response.success) {
        setHardcodedTexts(response.data.hardcodedTexts || []);
        toast({
          title: "Detecção Completa",
          description: `Encontrados ${response.data.summary.totalTexts} textos hardcoded em ${response.data.summary.totalFiles} arquivos`,
        });
      }
    } catch (error: any) {
      console.error('Error detecting hardcoded texts:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao detectar textos hardcoded",
        variant: "destructive",
      });
    } finally {
      setIsDetectingHardcoded(false);
    }
  };

  // Substituir textos hardcoded
  const handleReplaceHardcoded = async (dryRun = true) => {
    setIsReplacingHardcoded(true);
    try {
      const response = await apiRequest('/api/translation-completion/replace-hardcoded', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun })
      });

      if (response.success) {
        setReplacementResults(response.data);
        toast({
          title: dryRun ? "Simulação Completa" : "Substituição Completa",
          description: response.message,
        });

        if (!dryRun) {
          // Atualiza dados após aplicar mudanças reais
          queryClient.invalidateQueries({ queryKey: ['/api/translation-completion/analyze'] });
          await handleDetectHardcoded();
        }
      }
    } catch (error: any) {
      console.error('Error replacing hardcoded texts:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao substituir textos hardcoded",
        variant: "destructive",
      });
    } finally {
      setIsReplacingHardcoded(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await refetch(); // Revalida os dados da análise
    setIsAnalyzing(false);
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
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="gaps">Gaps por Idioma</TabsTrigger>
            <TabsTrigger value="keys">Chaves Detectadas</TabsTrigger>
            <TabsTrigger value="hardcoded">Textos Hardcoded</TabsTrigger>
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

        <TabsContent value="gaps" className="space-y-4">
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

        <TabsContent value="keys" className="space-y-4">
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

          {/* Aba de Textos Hardcoded */}
          <TabsContent value="hardcoded" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Textos Hardcoded Detectados</h3>
                <p className="text-sm text-muted-foreground">
                  Detecta e substitui textos hardcoded por chaves de tradução
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  onClick={handleDetectHardcoded}
                  disabled={isDetectingHardcoded}
                  variant="outline"
                >
                  {isDetectingHardcoded ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Detectando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Detectar Hardcoded
                    </>
                  )}
                </Button>
                {hardcodedTexts.length > 0 && (
                  <>
                    <Button
                      onClick={() => handleReplaceHardcoded(true)}
                      disabled={isReplacingHardcoded}
                      variant="outline"
                    >
                      {isReplacingHardcoded ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Simulando...
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Simular Substituição
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReplaceHardcoded(false)}
                      disabled={isReplacingHardcoded}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isReplacingHardcoded ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <Replace className="mr-2 h-4 w-4" />
                          Aplicar Substituições
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Resultados da Substituição */}
            {replacementResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Resultados da {replacementResults.mode === 'simulation' ? 'Simulação' : 'Aplicação'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Arquivos Processados</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {replacementResults.summary.totalFiles}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Substituições</div>
                      <div className="text-2xl font-bold text-green-600">
                        {replacementResults.summary.totalReplacements}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Sucessos</div>
                      <div className="text-2xl font-bold text-green-600">
                        {replacementResults.summary.successfulFiles}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Erros</div>
                      <div className="text-2xl font-bold text-red-600">
                        {replacementResults.summary.filesWithErrors}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Textos Hardcoded */}
            {hardcodedTexts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Textos Hardcoded Encontrados ({hardcodedTexts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {hardcodedTexts.map((item, index) => (
                      <div key={index} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {item.file.split('/').pop()}:{item.line}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {item.suggestedKey}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-red-600">"{item.text}"</div>
                          <div className="text-muted-foreground text-xs mt-1">
                            Contexto: {item.context}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hardcodedTexts.length === 0 && !isDetectingHardcoded && (
              <Card>
                <CardContent className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum Texto Hardcoded Detectado</h3>
                  <p className="text-muted-foreground mb-4">
                    Clique em "Detectar Hardcoded" para escanear o código
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
      </Tabs>
    </div>
  );
}