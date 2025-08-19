import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  
  const { data: completionReport, isLoading, refetch } = useQuery({
    queryKey: ['translation-completion-report'],
    queryFn: async () => {
      const response = await fetch('/api/translation-completion/analyze');
      if (!response.ok) {
        throw new Error('Failed to fetch completion report');
      }
      return response.json();
    },
  });

  const autoCompleteTranslations = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/translation-completion/auto-complete-all', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to auto-complete translations');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Tradução Automática Concluída!",
        description: data.message,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro na Tradução Automática",
        description: "Falha ao completar traduções automaticamente",
        variant: "destructive"
      });
      console.error('Auto-completion error:', error);
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
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reanalizar
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
          {completionReport.summary?.languageStats && 
            Object.entries(completionReport.summary.languageStats).map(([language, stats]: [string, TranslationStats]) => (
              <div key={language} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={stats.completeness >= 90 ? 'default' : 'destructive'}>
                      {language}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {stats.existingKeys} de {stats.existingKeys + stats.missingKeys} chaves
                    </span>
                  </div>
                  <span className={`font-medium ${
                    stats.completeness >= 90 ? 'text-green-600' : 
                    stats.completeness >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.completeness.toFixed(1)}%
                  </span>
                </div>
                <Progress value={stats.completeness} className="h-2" />
              </div>
            ))
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
            {completionReport.gaps?.map((gap: any) => (
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