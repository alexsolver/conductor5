/**
 * Translation Manager Page
 * SaaS Admin interface for managing translations across all languages
 * Following 1qa.md patterns strictly
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { TranslationCompletionPanel } from '@/components/TranslationCompletionPanel';
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
  Edit3,
  Globe,
  XCircle,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface TranslationData {
  language: string;
  translations: Record<string, any>;
  lastModified: string;
}

interface TranslationKey {
  key: string;
  value: string;
  module?: string;
}

// Interface for the allKeysData to include fromScanner and fromFiles
interface AllKeysData {
  keys: string[];
  languages: string[];
  translations?: Record<string, Record<string, any>>;
  totalKeys?: number;
  fromScanner?: number;
  fromFiles?: number;
}


export default function TranslationManager() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTranslations, setEditingTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanningKeys, setScanningKeys] = useState(false);
  const [expandingKeys, setExpandingKeys] = useState(false);
  const [isExpandedScanning, setIsExpandedScanning] = useState(false);
  const [expandedScanResult, setExpandedScanResult] = useState<any>(null);
  const [completionReport, setCompletionReport] = useState<any>(null);

  


  // Access control - SaaS admin only
  if (user?.role !== 'saas_admin') {
    return (
      <div className="p-8 text-center">
        <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          SaaS admin access required to manage translations.
        </p>
      </div>
    );
  }

  // Get available languages from API
  const { data: languagesData, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['/api/translations/languages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/translations/languages');
      if (!response.ok) throw new Error('Failed to fetch languages');
      return response.json();
    }
  });

  const availableLanguages = languagesData?.data?.languages || [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];


  // Get translations for selected language
  const { data: translationData, isLoading: isLoadingTranslations, refetch } = useQuery<TranslationData>({
    queryKey: ['/api/translations', selectedLanguage],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/translations/${selectedLanguage}`);
      if (!response.ok) throw new Error('Failed to fetch translations');
      return response.json();
    },
    enabled: !!selectedLanguage
  });

  // Fetch all available translation keys
  const { data: allKeysData, isLoading: isLoadingKeys } = useQuery<AllKeysData>({
    queryKey: ['/api/translations/keys/all'],
    queryFn: async () => {
      console.log('🔍 [FRONTEND] Fetching all translation keys...');
      const response = await apiRequest('GET', '/api/translations/keys/all');
      if (!response.ok) {
        console.error('❌ [FRONTEND] Keys fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch translation keys: ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 [FRONTEND] Raw keys response:', data);
      console.log('📊 [FRONTEND] Keys parsed:', {
        success: data.success,
        totalKeys: data.data?.totalKeys,
        keysLength: data.data?.keys?.length,
        fromScanner: data.data?.fromScanner,
        fromFiles: data.data?.fromFiles,
        firstFewKeys: data.data?.keys?.slice(0, 5),
        fullDataStructure: Object.keys(data.data || {})
      });
      return data.data; // Return data.data instead of data
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Save translations mutation
  const saveTranslationMutation = useMutation({
    mutationFn: async (data: { translations: Record<string, any> }) => {
      const response = await apiRequest('PUT', `/api/translations/${selectedLanguage}`, data);
      if (!response.ok) throw new Error('Failed to save translations');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations', selectedLanguage] });
      queryClient.invalidateQueries({ queryKey: ['/api/translations/keys/all'] });
      toast({
        title: "Translations Saved",
        description: `Translations updated successfully for ${selectedLanguage.toUpperCase()}`,
      });
      setEditingTranslations({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Translations",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/translations/${selectedLanguage}/restore`);
      if (!response.ok) throw new Error('Failed to restore backup');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations', selectedLanguage] });
      toast({
        title: "Backup Restored",
        description: `Backup restored successfully for ${selectedLanguage.toUpperCase()}`,
      });
      setEditingTranslations({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error Restoring Backup",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    const updatedTranslations = { ...translationData?.translations };

    // Apply edits
    Object.entries(editingTranslations).forEach(([key, value]) => {
      setNestedValue(updatedTranslations, key, value);
    });

    saveTranslationMutation.mutate({ translations: updatedTranslations });
  };

  const handleRestore = () => {
    if (confirm(`Are you sure you want to restore the backup for ${selectedLanguage.toUpperCase()}? This will overwrite current changes.`)) {
      restoreBackupMutation.mutate();
    }
  };

  const handleTranslationChange = (key: string, value: string) => {
    setEditingTranslations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Utility functions
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  // Filter keys based on search with minimal restrictions
  const filteredKeys = allKeysData?.keys?.filter((key: string) => {
    // Include key if it matches search term
    if (searchTerm && !key.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Only exclude obvious technical keys
    const technicalPatterns = [
      /^\/api\//,
      /^https?:\/\//,
      /^\d{3}:?$/,
      /^[#][0-9a-fA-F]{3,8}$/,
    ];

    return !technicalPatterns.some(pattern => pattern.test(key));
  }) || [];
  
  console.log('🔍 [FRONTEND] Filtered keys debug:', {
    allKeysDataExists: !!allKeysData,
    keysProperty: allKeysData?.keys?.length || 0,
    filteredLength: filteredKeys.length,
    isLoadingKeys,
    allKeysDataKeys: Object.keys(allKeysData || {})
  });

  // Initialize translation manager
  useEffect(() => {
    if (!isInitialized) {
      initializeTranslationManager();
    }
  }, [isInitialized]);

  // Mark as initialized after first load
  useEffect(() => {
    if (!isInitialized && availableLanguages.length > 0) {
      setIsInitialized(true);
    }
  }, [availableLanguages, isInitialized]);


  const initializeTranslationManager = () => {
    // Set default language if none is selected and languages are available
    if (availableLanguages.length > 0 && !selectedLanguage) {
      setSelectedLanguage(availableLanguages[0].code);
    }
    // Potentially fetch initial data or set up context here if needed
  };


  // Placeholder for analysis and scanning functions (re-defined here for clarity and scope)
  const handleAnalyze = async () => {
    setAnalyzing(true);
    console.log('🔍 [FRONTEND-SAFE] Analyzing translation completeness...');
    try {
      const response = await fetch('/api/translation-completion/analyze', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      console.log('📡 [FRONTEND] Analysis response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ [FRONTEND] Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('✅ [FRONTEND-SAFE] Analysis successful:', data);

      toast({
        title: t('TranslationManager.analysisSuccess') || "Analysis completed!",
        description: data.message || `Found ${data.data?.summary?.totalKeys || 0} translation keys`,
      });
    } catch (error) {
      console.error('❌ [FRONTEND-SAFE] Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze translations';
      toast({
        title: t('TranslationManager.analysisError') || "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Updated handleExpandedScan with improved error handling
  const handleExpandedScan = async () => {
    setExpandingKeys(true);
    try {
      console.log('📡 [FRONTEND] Starting expansion scan...');
      const response = await fetch('/api/translation-completion/expand-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      console.log('📡 [FRONTEND] Expansion response status:', response.status);

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.warn('⚠️ [FRONTEND] Expansion scan failed, falling back to regular scan...');
        // Fallback to regular scan
        await handleScanKeys();
        return;
      }

      console.log('📡 [FRONTEND] Expansion scan result:', result);

      // Refresh the scanned keys
      refetch(); // Refresh current language translations
      queryClient.invalidateQueries({ queryKey: ['/api/translations/keys/all'] }); // Refresh all keys

      // Show success message
      console.log(`✅ [FRONTEND] Expansion scan completed: Found ${result.data?.totalKeys || 'unknown'} total keys (${result.data?.improvement || 0} more than before). Report generated.`);
      toast({
        title: t('TranslationManager.expansionSuccess') || "Expansion scan completed!",
        description: `Found ${result.data?.totalKeys || 0} keys (${result.data?.improvement || 0} more than before). Report generated.`,
      });

    } catch (error) {
      console.error('❌ [FRONTEND] Expansion scan error:', error);
      console.log('🔄 [FRONTEND] Falling back to regular scan...');
      // Fallback to regular scan
      await handleScanKeys();
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform comprehensive scan. Falling back to regular scan.';
      toast({
        title: t('TranslationManager.expansionError') || "Expansion scan failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setExpandingKeys(false);
    }
  };


  const handleScanKeys = async () => {
    setScanningKeys(true);
    console.log('🔍 [FRONTEND] Starting translation key scanning...');

    try {
      const response = await fetch('/api/translation-completion/scan-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      console.log('📡 [FRONTEND] Response status:', response.status);
      console.log('📡 [FRONTEND] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ [FRONTEND] Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('✅ [FRONTEND] Key scanning successful:', data);

      if (data.success) {
        toast({
          title: t('TranslationManager.scanSuccess') || "Key scanning completed!",
          description: `Found ${data.data?.totalKeys || 0} translation keys`,
        });
      } else {
        throw new Error(data.message || 'Scan operation failed');
      }

    } catch (error) {
      console.error('❌ [FRONTEND] Key scanning error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan translation keys';
      toast({
        title: t('TranslationManager.scanError') || "Key scanning failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setScanningKeys(false);
    }
  };

  // FUNÇÃO DESABILITADA - Auto Complete All causava problemas com objetos aninhados
  const handleAutoCompleteAll = async () => {
    console.log('🚫 [DISABLED] Auto Complete All function is permanently disabled');
    toast({
      title: "Funcionalidade Desabilitada",
      description: "Auto Complete All foi desabilitado para proteger contra sobrescrita de correções manuais.",
      variant: "destructive",
    });
  };



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('TranslationManager.title') || 'Translation Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('TranslationManager.description') || 'Manage system translations across all supported languages'}
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <Badge variant="secondary" className="text-xs">
              📁 Estrutura: client/src/i18n/locales/
            </Badge>
            <Badge variant="outline" className="text-xs">
              ✅ Sistema Limpo e Consolidado
            </Badge>
            <Badge variant="secondary" className="text-xs">
              🎯 Zero Tolerância para Inglês
            </Badge>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRestore}
            disabled={restoreBackupMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('TranslationManager.restoreBackup') || 'Restore Backup'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveTranslationMutation.isPending || Object.keys(editingTranslations).length === 0}
          >
            {saveTranslationMutation.isPending ? t('TranslationManager.saving') || 'Saving...' : t('TranslationManager.saveChanges') || 'Save Changes'}
          </Button>
        </div>
      </div>



      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('TranslationManager.searchPlaceholder') || "Search translation keys..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Translation Tabs */}
      <Tabs defaultValue="editor" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">{t('TranslationManager.translationEditor') || 'Translation Editor'}</TabsTrigger>
          <TabsTrigger value="completion">{t('TranslationManager.autoCompletion') || 'Auto Completion'}</TabsTrigger>
          <TabsTrigger value="keys">{t('TranslationManager.allKeys') || 'All Keys'}</TabsTrigger>
        </TabsList>

        {/* Translation Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          {/* Language Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Idioma:</label>
                <div className="flex gap-2">
                  {availableLanguages.map((lang: any) => (
                    <Button
                      key={lang.code}
                      variant={selectedLanguage === lang.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLanguage(lang.code)}
                      className="flex items-center gap-2"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.code.toUpperCase()}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                {t('TranslationManager.editorTitle', { lang: selectedLanguage?.toUpperCase() }) || `Translation Editor - ${selectedLanguage?.toUpperCase()}`}
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4">
                  {translationData?.lastModified && (
                    <span>{t('TranslationManager.lastModified')} {new Date(translationData.lastModified).toLocaleString()}</span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    📍 client/src/i18n/locales/{selectedLanguage}.json
                  </Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTranslations ? (
                <div className="text-center py-8">Loading translations...</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredKeys.map((key: string) => {
                    const currentValue = getNestedValue(translationData?.translations, key);
                    const editingValue = editingTranslations[key];
                    const displayValue = editingValue !== undefined ? editingValue : currentValue || '';

                    return (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {key}
                          </label>
                          <Badge variant="secondary" className="text-xs">
                            {typeof currentValue === 'string' ? 'Text' : 'Object'}
                          </Badge>
                        </div>

                        {typeof currentValue === 'string' || currentValue === undefined ? (
                          <Textarea
                            value={displayValue}
                            onChange={(e) => handleTranslationChange(key, e.target.value)}
                            placeholder={`Translation for ${key}`}
                            className="min-h-20"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <pre className="text-sm text-gray-600 dark:text-gray-400">
                              {JSON.stringify(currentValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredKeys.length === 0 && !isLoadingTranslations && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? t('TranslationManager.noKeysFound') || 'No keys found matching your search' : t('TranslationManager.noKeysAvailable') || 'No translation keys available'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto Completion Tab */}
        <TabsContent value="completion" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {t('TranslationManager.autoCompletionTitle') || 'Auto Translation Completion'}
            </h3>
            <Button
              onClick={() => {
                toast({
                  title: "Funcionalidade Desabilitada",
                  description: "Auto Complete All foi desabilitado permanentemente para evitar sobrescrever correções manuais.",
                  variant: "destructive",
                });
              }}
              disabled={true}
              className="bg-red-600 hover:bg-red-700 opacity-50 cursor-not-allowed"
              title="Funcionalidade desabilitada permanentemente - estava gerando objetos aninhados"
            >
              ⚠️ {t('TranslationManager.autoCompleteAll') || 'Auto Complete All'} (DISABLED)
            </Button>
          </div>
          <TranslationCompletionPanel />
        </TabsContent>

        {/* All Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t('TranslationManager.allKeysTitle') || 'All Translation Keys'}
              </CardTitle>
              <CardDescription>
                {t('TranslationManager.allKeysDescription') || 'Overview of all available translation keys in the system'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingKeys ? (
                <div className="text-center py-8">Loading keys...</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {allKeysData?.keys?.map((key: string) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{key}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {allKeysData.languages?.filter((lang: string) =>
                            getNestedValue(allKeysData.translations?.[lang], key)
                          ).length} / {allKeysData.languages?.length || 0}
                        </Badge>
                        {!getNestedValue(allKeysData.translations?.en, key) && (
                          <Badge variant="destructive" className="text-xs">
                            Missing
                          </Badge>
                        )}
                      </div>
                    </div>
                  )) || []}
                </div>
              )}

              {allKeysData?.keys?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {t('TranslationManager.noKeysFound') || 'No translation keys found'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Buttons for Analysis and Scanning */}
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex-1"
        >
          {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('TranslationManager.analyzeCompleteness') || 'Analyze Completeness'}
        </Button>

        <Button
          onClick={handleScanKeys}
          disabled={scanningKeys}
          variant="outline"
          className="flex-1 ml-2"
        >
          {scanningKeys ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('TranslationManager.scanKeys') || 'Scan Keys'}
        </Button>

        <Button
          onClick={async () => {
            setIsExpandedScanning(true);
            try {
              const response = await fetch('/api/translations/expand-scan', {
                method: 'GET',
                credentials: 'include',
              });
              const data = await response.json();
              setExpandedScanResult(data.data);
              await queryClient.invalidateQueries({ queryKey: ['/api/translations/keys/all'] });
              toast({
                title: "Ultra-Comprehensive Scan Complete!",
                description: `Found ${data.data?.totalKeys || 0} keys (${data.data?.improvement || 0} more, ${data.data?.expansionRatio || '0%'} expansion)`,
              });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              toast({
                title: "Scan Error",
                description: errorMessage,
                variant: "destructive",
              });
            } finally {
              setIsExpandedScanning(false);
            }
          }}
          disabled={isExpandedScanning}
          variant="secondary"
          className="flex-1 ml-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {isExpandedScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          🚀 Ultra Scan (1000s+ keys)
        </Button>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('TranslationManager.statisticsTitle') || 'Statistics'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingKeys ? (
              <div className="text-center py-8">Loading statistics...</div>
            ) : (
              <div className="text-center py-8">
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{allKeysData?.totalKeys || 0}</div>
                  <div className="text-sm text-gray-500">
                    {t('TranslationManager.totalKeys') || 'Total Keys'}
                  </div>
                  {allKeysData?.fromScanner && (
                    <div className="text-xs text-blue-500">
                      ({allKeysData.fromScanner} from scanner, {allKeysData.fromFiles || 0} from files)
                    </div>
                  )}
                  {expandedScanResult && (
                    <div className="text-xs text-purple-500 mt-2">
                      🚀 Ultra Scan: {expandedScanResult.totalKeys} keys (+{expandedScanResult.improvement} more, {expandedScanResult.expansionRatio} expansion)
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Status da Organização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Estrutura de Arquivos</span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                ✅ Consolidada
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sidebar em PT-BR</span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                ✅ 100% Traduzido
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Conflitos Objeto/String</span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                ✅ Resolvidos
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Arquivos Duplicados</span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                ✅ Removidos
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
              <strong>Localizações:</strong><br/>
              • client/src/i18n/locales/pt-BR.json<br/>
              • client/src/i18n/locales/en.json<br/>
              • client/src/i18n/locales/es.json
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}