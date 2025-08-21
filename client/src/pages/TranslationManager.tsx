/**
 * Translation Manager Page
 * SaaS Admin interface for managing translations across all languages
 * Following 1qa.md patterns strictly
 */

import { useState } from "react";
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

export default function TranslationManager() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTranslations, setEditingTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanningKeys, setScanningKeys] = useState(false);
  const [expandingKeys, setExpandingKeys] = useState(false);


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

  // Get all translation keys
  const { data: allKeysData, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['/api/translations/keys/all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/translations/keys/all');
      if (!response.ok) throw new Error('Failed to fetch translation keys');
      return response.json();
    }
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

  // Placeholder for analysis and scanning functions
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
      toast({
        title: t('TranslationManager.analysisError') || "Analysis failed",
        description: error.message || 'Failed to analyze translations',
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
      toast({
        title: t('TranslationManager.expansionError') || "Expansion scan failed",
        description: error.message || 'Failed to perform comprehensive scan. Falling back to regular scan.',
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
      toast({
        title: t('TranslationManager.scanError') || "Key scanning failed",
        description: error.message || 'Failed to scan translation keys',
        variant: "destructive",
      });
    } finally {
      setScanningKeys(false);
    }
  };

  const handleAutoCompleteAll = async () => {
    console.log('🔒 [FRONTEND-SAFE] Starting ultra-safe translation completion...');
    setLoading(true);
    try {
      const response = await fetch('/api/translation-completion/auto-complete-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      console.log('🔒 [FRONTEND-SAFE] Response received:', data);

      if (data.success) {
        const { summary, safetyInfo } = data.data || {};
        console.log('✅ [FRONTEND-SAFE] Safe completion successful:', summary);

        const translationsAdded = summary?.translationsAdded || summary?.languagesProcessed || 0;
        const codeFilesProtected = safetyInfo?.codeFilesProtected || 'All';

        toast({
          title: t('TranslationManager.autoCompletionSuccess') || "Auto-completion completed safely!",
          description: `${t('TranslationManager.translationsAdded') || 'Added'}: ${translationsAdded}, ${t('TranslationManager.codeFilesProtected') || 'Code files protected'}: ${codeFilesProtected}`,
        });

        // Refresh the analysis
        await handleAnalyze();
      } else {
        throw new Error(data.message || t('TranslationManager.autoCompletionFailed') || 'Failed to auto-complete translations');
      }
    } catch (error) {
      console.error('❌ [FRONTEND-SAFE] Auto-completion error:', error);
      toast({
        title: t('TranslationManager.autoCompletionError') || "Auto-completion failed",
        description: error.message || t('TranslationManager.autoCompletionErrorDesc') || 'Failed to auto-complete translations',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🔒 [FRONTEND-SAFE] Operation completed');
    }
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

      {/* Language Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            {t('TranslationManager.languageSelection') || 'Language Selection'}
          </CardTitle>
          <CardDescription>
            {t('TranslationManager.chooseLanguage') || 'Choose the language to edit translations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {isLoadingLanguages ? (
              <div>Loading languages...</div>
            ) : (
              languagesData?.languages?.map((lang: Language) => (
                <Button
                  key={lang.code}
                  variant={selectedLanguage === lang.code ? "default" : "outline"}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">{lang.flag}</span>
                  {lang.name}
                </Button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                {t('TranslationManager.editorTitle', { lang: selectedLanguage?.toUpperCase() }) || `Translation Editor - ${selectedLanguage?.toUpperCase()}`}
              </CardTitle>
              <CardDescription>
                {translationData?.lastModified && (
                  <span>{t('TranslationManager.lastModified')} {new Date(translationData.lastModified).toLocaleString()}</span>
                )}
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
              onClick={handleAutoCompleteAll}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
              title={t('TranslationManager.ultraSafeMode') || 'Ultra-safe mode: Only JSON files modified, code protected'}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              🔒 {t('TranslationManager.autoCompleteAll') || 'Auto Complete All'}
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
                      <Badge variant="outline" className="text-xs">
                        {allKeysData.languages?.filter((lang: string) =>
                          getNestedValue(allKeysData.translations?.[lang], key)
                        ).length} / {allKeysData.languages?.length || 0}
                      </Badge>
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
          onClick={handleExpandedScan}
          disabled={expandingKeys}
          variant="secondary"
          className="flex-1 ml-2"
        >
          {expandingKeys ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('TranslationManager.expandedScan') || 'Full Expansion Scan'}
        </Button>
      </div>
    </div>
  );
}