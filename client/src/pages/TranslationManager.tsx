/**
 * Translation Manager - SaaS Admin
 * Complete rebuild following 1qa.md strict patterns
 * Multi-language support: PT-BR, EN, ES, FR, DE
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Languages,
  Save,
  RotateCcw,
  Search,
  Globe,
  Loader2,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  BarChart3,
  FileText
} from "lucide-react";

// Types following 1qa.md patterns
interface Language {
  code: string;
  name: string;
  flag: string;
  completeness: number;
}

interface TranslationStats {
  totalKeys: number;
  existingKeys: number;
  missingKeys: number;
  completeness: number;
}

interface CompletionReport {
  success: boolean;
  data: {
    summary: {
      totalKeys: number;
      languageStats: Record<string, TranslationStats>;
    };
    scannedAt: string;
  };
}

interface AutoCompleteResponse {
  success: boolean;
  data: {
    summary: {
      totalKeys: number;
      translationsAnalyzed: number;
      languagesProcessed: number;
      simulationMode: boolean;
      safeMode: boolean;
    };
    recommendations: {
      mostNeeded: Array<{
        language: string;
        missing: number;
        completeness: number;
      }>;
    };
  };
  message: string;
}

// Language definitions following platform standards
const LANGUAGES: Language[] = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', completeness: 0 },
  { code: 'en', name: 'English', flag: '🇺🇸', completeness: 0 },
  { code: 'es', name: 'Español', flag: '🇪🇸', completeness: 0 },
  { code: 'fr', name: 'Français', flag: '🇫🇷', completeness: 0 },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', completeness: 0 }
];

export default function TranslationManager() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management following 1qa.md patterns
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pt-BR');
  const [searchTerm, setSearchTerm] = useState('');
  const [languages, setLanguages] = useState<Language[]>(LANGUAGES);
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});

  // Translation analysis query - 1qa.md compliant
  const { data: analysisData, isLoading: isAnalyzing, refetch: refetchAnalysis } = useQuery({
    queryKey: ['/api/saas-admin/translations/keys/all'],
    enabled: user?.role === 'saas_admin'
  });

  // Translation data query for selected language
  const { data: translationData, isLoading: isLoadingTranslations } = useQuery({
    queryKey: ['/api/saas-admin/translations', selectedLanguage],
    enabled: !!selectedLanguage && user?.role === 'saas_admin'
  });

  // AI-powered auto-complete mutation following 1qa.md patterns
  const autoCompleteMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/saas-admin/translation-completion/auto-complete-all'),
    onSuccess: (response: AutoCompleteResponse) => {
      const completedCount = response.data?.completed || 0;
      toast({
        title: "🤖 Tradução IA Concluída",
        description: `${completedCount} traduções criadas automaticamente pela IA`,
        duration: 6000
      });
      refetchAnalysis();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na IA",
        description: error.message || "Falha na tradução automática com IA",
        variant: "destructive"
      });
    }
  });

  // Scan keys mutation
  const scanKeysMutation = useMutation({
    mutationFn: () => apiRequest('GET', '/api/saas-admin/translations/keys/all'),
    onSuccess: (response: any) => {
      toast({
        title: "Scan Concluído",
        description: `${response.data?.totalKeys || 0} chaves encontradas`,
        duration: 5000
      });
      refetchAnalysis();
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Scan",
        description: error.message || "Falha ao escanear chaves",
        variant: "destructive"
      });
    }
  });

  // Update language completeness when analysis data changes
  useEffect(() => {
    if (analysisData?.success && analysisData.data) {
      const totalKeys = analysisData.data.totalKeys || 0;
      const translations = analysisData.data.translations || {};
      
      const updatedLanguages = LANGUAGES.map(lang => {
        const langTranslations = translations[lang.code] || {};
        const existingKeys = Object.keys(langTranslations).length;
        const completeness = totalKeys > 0 ? Math.round((existingKeys / totalKeys) * 100) : 0;
        
        return {
          ...lang,
          completeness
        };
      });
      setLanguages(updatedLanguages);
    }
  }, [analysisData]);

  // Save translations mutation
  const saveTranslationsMutation = useMutation({
    mutationFn: (data: { language: string; translations: Record<string, string> }) =>
      apiRequest('PUT', `/api/saas-admin/translations/${data.language}`, data.translations),
    onSuccess: () => {
      toast({
        title: "Traduções Salvas",
        description: "As traduções foram salvas com sucesso",
      });
      setEditingKeys({});
      queryClient.invalidateQueries({ queryKey: ['/api/saas-admin/translations'] });
      refetchAnalysis();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Falha ao salvar traduções",
        variant: "destructive"
      });
    }
  });

  // Handle auto-complete action
  const handleAutoComplete = () => {
    autoCompleteMutation.mutate();
  };

  // Handle scan keys action
  const handleScanKeys = () => {
    scanKeysMutation.mutate();
  };

  // Handle save translations
  const handleSaveTranslations = () => {
    if (Object.keys(editingKeys).length === 0) {
      toast({
        title: "Nenhuma Alteração",
        description: "Não há traduções para salvar",
        variant: "default"
      });
      return;
    }

    saveTranslationsMutation.mutate({
      language: selectedLanguage,
      translations: editingKeys
    });
  };

  // Filter translations based on search
  const filteredTranslations = translationData?.translations 
    ? Object.entries(translationData.translations).filter(([key, value]) =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  // Get completion stats
  const getLanguageStats = (langCode: string): TranslationStats | null => {
    if (!analysisData?.success || !analysisData.data) return null;
    
    const totalKeys = analysisData.data.totalKeys || 0;
    const translations = analysisData.data.translations || {};
    const langTranslations = translations[langCode] || {};
    const existingKeys = Object.keys(langTranslations).length;
    const missingKeys = totalKeys - existingKeys;
    const completeness = totalKeys > 0 ? Math.round((existingKeys / totalKeys) * 100) : 0;
    
    return {
      totalKeys,
      existingKeys,
      missingKeys,
      completeness
    };
  };

  // Render language badge with completeness
  const renderLanguageBadge = (lang: Language) => {
    const stats = getLanguageStats(lang.code);
    const completeness = stats?.completeness || 0;
    
    return (
      <Badge 
        key={lang.code}
        variant={completeness >= 80 ? "default" : completeness >= 50 ? "secondary" : "destructive"}
        className="flex items-center gap-2 px-3 py-1"
      >
        <span className="text-lg">{lang.flag}</span>
        <span>{lang.name}</span>
        <span className="font-mono text-xs">
          {completeness}%
        </span>
      </Badge>
    );
  };

  // Check if user has access
  if (user?.role !== 'saas_admin') {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Acesso Restrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Esta funcionalidade requer privilégios de SaaS Admin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="translation-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Gerenciador de Traduções
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema completo de gerenciamento de traduções com IA - 5 idiomas suportados
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
            Powered by OpenAI GPT-4o para traduções automáticas inteligentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleScanKeys}
            disabled={scanKeysMutation.isPending}
            variant="outline"
            data-testid="button-scan-keys"
          >
            {scanKeysMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Escanear Chaves
          </Button>
          <Button
            onClick={handleAutoComplete}
            disabled={autoCompleteMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            data-testid="button-auto-complete"
          >
            {autoCompleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Completar com IA
          </Button>
        </div>
      </div>

      {/* Language Overview */}
      <Card data-testid="language-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Visão Geral dos Idiomas
          </CardTitle>
          <CardDescription>
            Status de completude das traduções por idioma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Analisando traduções...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {languages.map(renderLanguageBadge)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Language Selector */}
        <Card data-testid="language-selector">
          <CardHeader>
            <CardTitle className="text-lg">Idiomas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {languages.map(lang => {
              const stats = getLanguageStats(lang.code);
              return (
                <Button
                  key={lang.code}
                  variant={selectedLanguage === lang.code ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedLanguage(lang.code)}
                  data-testid={`language-${lang.code}`}
                >
                  <span className="text-lg mr-2">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div>{lang.name}</div>
                    {stats && (
                      <div className="text-xs text-muted-foreground">
                        {stats.existingKeys}/{stats.totalKeys} chaves ({stats.completeness}%)
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Translation Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search and Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar traduções..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveTranslations}
                  disabled={Object.keys(editingKeys).length === 0 || saveTranslationsMutation.isPending}
                  data-testid="button-save"
                >
                  {saveTranslationsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Translation List */}
          <Card data-testid="translation-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Traduções - {languages.find(l => l.code === selectedLanguage)?.name}
              </CardTitle>
              <CardDescription>
                {filteredTranslations.length} de {translationData?.translations ? Object.keys(translationData.translations).length : 0} chaves
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTranslations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Carregando traduções...</span>
                </div>
              ) : filteredTranslations.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredTranslations.map(([key, value]) => (
                    <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Chave
                        </label>
                        <Input
                          value={key}
                          readOnly
                          className="font-mono text-sm bg-muted"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Tradução
                        </label>
                        <Textarea
                          value={editingKeys[key] ?? (typeof value === 'string' ? value : JSON.stringify(value))}
                          onChange={(e) => setEditingKeys(prev => ({ ...prev, [key]: e.target.value }))}
                          className="min-h-[40px]"
                          data-testid={`translation-${key}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma tradução encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auto-complete Results */}
      {autoCompleteMutation.data?.success && (
        <Card className="border-green-200 bg-green-50" data-testid="auto-complete-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Análise de Auto-Completar Concluída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Total de Chaves:</strong> {autoCompleteMutation.data.data.summary.totalKeys}
              </div>
              <div>
                <strong>Traduções Analisadas:</strong> {autoCompleteMutation.data.data.summary.translationsAnalyzed}
              </div>
              <div>
                <strong>Idiomas Processados:</strong> {autoCompleteMutation.data.data.summary.languagesProcessed}
              </div>
            </div>
            
            {autoCompleteMutation.data.data.recommendations?.mostNeeded?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-green-800 mb-2">Idiomas que Mais Precisam de Traduções:</h4>
                <div className="space-y-1">
                  {autoCompleteMutation.data.data.recommendations.mostNeeded.map(rec => (
                    <div key={rec.language} className="flex justify-between text-sm">
                      <span>{languages.find(l => l.code === rec.language)?.name} {languages.find(l => l.code === rec.language)?.flag}</span>
                      <span>{rec.missing} chaves ausentes ({rec.completeness}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}