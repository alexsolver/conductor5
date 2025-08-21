import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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

export function TranslationCompletionPanel() {
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  // State for selected language filter, initialized to 'en' (English)
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const queryClient = useQueryClient();

  const { data: completionReport, isLoading, refetch } = useQuery({
    queryKey: ['translation-completion-report'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/translation-completion/analyze');
      if (!response.ok) {
        throw new Error('Failed to fetch completion report');
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache the data
  });

  const autoCompleteTranslations = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/translation-completion/auto-complete-all');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to auto-complete translations');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Auto-completion completed! Added ${data.data?.summary?.translationsAdded || 0} translations`,
      });

      // Force multiple refreshes to ensure data is updated
      setTimeout(() => refetch(), 500);
      setTimeout(() => refetch(), 1500);
      setTimeout(() => refetch(), 3000);
    },
    onError: (error) => {
      console.error('Auto-completion error:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to complete translations automatically",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analisando traduções...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!completionReport) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-semibold mb-2">Dados Indisponíveis</h3>
            <p className="text-gray-600 mb-4">
              Não foi possível carregar o relatório de completude das traduções.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper functions to get language names and flags
  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      'en': 'English',
      'pt-BR': 'Português (Brasil)',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch'
    };
    return names[code] || code;
  };

  const getLanguageFlag = (code: string): string => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'pt-BR': '🇧🇷',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪'
    };
    return flags[code] || '🌐';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Completude das Traduções</h2>
          <p className="text-gray-600">
            Análise automática e completude de traduções para todos os módulos
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                // Clear all related caches first
                await queryClient.invalidateQueries({ queryKey: ['translation-completion-report'] });
                await queryClient.refetchQueries({ queryKey: ['translation-completion-report'] });

                toast({
                  title: "Análise iniciada",
                  description: "Recarregando dados de completude das traduções...",
                });
              } catch (error) {
                console.error('Error reanalyzing:', error);
                toast({
                  title: "Erro",
                  description: "Falha ao reanalizar traduções",
                  variant: "destructive",
                });
              }
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analisando...' : 'Reanalizar'}
          </Button>
          <Button
            onClick={() => autoCompleteTranslations.mutate()}
            disabled={autoCompleteTranslations.isPending || isCompleting}
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoCompleteTranslations.isPending ? 'Completando...' : 'Completar Automaticamente'}
          </Button>
        </div>
      </div>

      {/* Language Selection Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Selecione um Idioma
          </CardTitle>
          <CardDescription>
            Filtre as estatísticas por idioma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['en', 'pt-BR', 'es', 'fr', 'de'].map((language) => {
              const stats = completionReport?.summary?.languageStats?.[language] || { totalKeys: 0, missingKeys: 0, completeness: 0 };
              const totalKeys = isNaN(stats.totalKeys) ? 0 : stats.totalKeys;
              const missingKeys = isNaN(stats.missingKeys) ? 0 : stats.missingKeys;
              const completeness = isNaN(stats.completeness) ? 0 : stats.completeness;
              const existingKeys = totalKeys - missingKeys;

              return (
                <div key={language} className="space-y-2">
                  <Button
                    variant={selectedLanguage === language ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedLanguage(language)}
                  >
                    {getLanguageFlag(language)} {getLanguageName(language)}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Chaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionReport.summary?.totalKeys || 0}</div>
            <p className="text-xs text-gray-500">detectadas no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Idiomas Suportados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completionReport.summary?.languageStats ? 
                Object.keys(completionReport.summary.languageStats).length : 0
              }
            </div>
            <p className="text-xs text-gray-500">configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completude Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completionReport.summary?.languageStats ? 
                Math.round(
                  Object.values(completionReport.summary.languageStats)
                    .reduce((sum, stats) => sum + (stats as TranslationStats).completeness, 0) / 
                  Object.keys(completionReport.summary.languageStats).length
                ) : 0}%
            </div>
            <p className="text-xs text-gray-500">todas as linguagens</p>
          </CardContent>
        </Card>
      </div>

      {/* Languages Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Status dos Idiomas
          </CardTitle>
          <CardDescription>
            Completude das traduções por idioma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {completionReport.summary?.languageStats && Object.entries(completionReport.summary.languageStats).map(([language, stats]: [string, any]) => {
              // Ensure we have valid numbers, fallback to 0 if NaN
              const totalKeys = isNaN(stats.totalKeys) ? 0 : stats.totalKeys;
              const missingKeys = isNaN(stats.missingKeys) ? 0 : stats.missingKeys;
              const completeness = isNaN(stats.completeness) ? 0 : stats.completeness;
              const existingKeys = totalKeys - missingKeys;

              // Only render if it's the selected language or if no language is selected
              if (selectedLanguage === 'all' || language === selectedLanguage) {
                return (
                  <div key={language} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={completeness >= 90 ? 'default' : 'destructive'}>
                          {language}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {existingKeys} de {totalKeys} chaves
                        </span>
                      </div>
                      <span className={`font-medium ${
                        completeness >= 90 ? 'text-green-600' : 
                        completeness >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {completeness.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={completeness} className="h-2" />
                  </div>
                );
              }
              return null; // Don't render if not the selected language
            })
          }
        </CardContent>
      </Card>

      {/* Translation Gaps */}
      <Card>
        <CardHeader>
          <CardTitle>Gaps de Tradução por Módulo</CardTitle>
          <CardDescription>
            Chaves faltantes organizadas por módulo do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completionReport.gaps?.filter(gap => selectedLanguage === 'all' || gap.language === selectedLanguage).map((gap: any) => (
              <div key={gap.language} className="space-y-2">
                <h4 className="font-medium">{gap.language}</h4>
                {Object.entries(gap.moduleGaps).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(gap.moduleGaps).map(([module, missingKeys]: [string, any]) => (
                      <Badge key={module} variant="outline" className="justify-between">
                        {module}
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 rounded">
                          {missingKeys.length}
                        </span>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-green-600">✅ Todas as traduções completas</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}