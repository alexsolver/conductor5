/**
 * Translation Manager Page
 * SaaS Admin interface for managing translations across all languages
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { TranslationCompletionPanel } from '@/components/TranslationCompletionPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Languages, 
  Save, 
  RotateCcw, 
  Search, 
  Plus, 
  Edit3, 
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

// Schema for translation updates
const updateTranslationSchema = z.object({
  translations: z.record(z.any())
});

type UpdateTranslationFormData = z.infer<typeof updateTranslationSchema>;

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

export default function TranslationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyDialog, setNewKeyDialog] = useState(false);

  // Verificar se usuário é SaaS admin
  if (user?.role !== 'saas_admin') {
    return (
      <div className="p-8 text-center">
        <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('translationManager.accessDenied')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('translationManager.accessDeniedDescription')}
        </p>
      </div>
    );
  }

  // Query para idiomas disponíveis
  const { data: languagesData, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['/api/translations/languages'],
    staleTime: 5 * 60 * 1000,
  });

  // Query para traduções do idioma selecionado
  const { data: translationData, isLoading: isLoadingTranslations } = useQuery({
    queryKey: ['/api/translations', selectedLanguage],
    staleTime: 60 * 1000,
    enabled: !!selectedLanguage
  });

  // Query para todas as chaves de tradução
  const { data: allKeysData, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['/api/translations/keys/all'],
    staleTime: 2 * 60 * 1000,
  });

  // Form para edição de traduções
  const form = useForm<UpdateTranslationFormData>({
    resolver: zodResolver(updateTranslationSchema),
    defaultValues: {
      translations: {}
    }
  });

  // Atualizar form quando translations carregam
  useEffect(() => {
    if ((translationData as any)?.translations) {
      form.reset({ translations: (translationData as any).translations });
    }
  }, [translationData, form]);

  // Mutation para salvar traduções
  const saveTranslationMutation = useMutation({
    mutationFn: async (data: UpdateTranslationFormData) => {
      const res = await apiRequest('PUT', `/api/translations/${selectedLanguage}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations', selectedLanguage] });
      queryClient.invalidateQueries({ queryKey: ['/api/translations/keys/all'] });
      toast({
        title: t('translationManager.translationsSaved'),
        description: t('translationManager.translationsUpdated', { language: selectedLanguage }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('translationManager.errorSavingTranslations'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para restaurar backup
  const restoreBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/translations/${selectedLanguage}/restore`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations', selectedLanguage] });
      toast({
        title: t('translationManager.backupRestored'),
        description: t('translationManager.backupRestoredDescription', { language: selectedLanguage }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('translationManager.errorRestoringBackup'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: UpdateTranslationFormData) => {
    saveTranslationMutation.mutate(data);
  };

  const handleRestore = () => {
    if (confirm(t('translationManager.confirmRestore', { language: selectedLanguage }))) {
      restoreBackupMutation.mutate();
    }
  };

  // Função para buscar valor nested
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Função para definir valor nested
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  // Filtrar chaves baseado na busca
  const filteredKeys = allKeysData?.keys?.filter((key: string) => 
    key.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('translationManager.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('translationManager.description')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleRestore}
            disabled={restoreBackupMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('translationManager.restoreBackup')}
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={saveTranslationMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveTranslationMutation.isPending ? t('translationManager.saving') : t('translationManager.saveChanges')}
          </Button>
        </div>
      </div>

      {/* Language Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            {t('translationManager.selectLanguage')}
          </CardTitle>
          <CardDescription>
            {t('translationManager.selectLanguageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {isLoadingLanguages ? (
              <div>{t('translationManager.loadingLanguages')}</div>
            ) : (
              ((languagesData as any)?.languages)?.map((lang: Language) => (
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
              placeholder={t('translationManager.searchPlaceholder')}
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
            <TabsTrigger value="editor">{t('translationManager.translationEditor')}</TabsTrigger>
            <TabsTrigger value="completion">{t('translationManager.autoCompletion')}</TabsTrigger>
            <TabsTrigger value="keys">{t('translationManager.allKeys')}</TabsTrigger>
          </TabsList>

        {/* Translation Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                {t('translationManager.translationEditor')} - {selectedLanguage}
              </CardTitle>
              <CardDescription>
                {(translationData as any)?.lastModified && (
                  <span>{t('translationManager.lastModified')}: {new Date((translationData as any).lastModified).toLocaleString()}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTranslations ? (
                <div className="text-center py-8">{t('translationManager.loadingTranslations')}</div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredKeys.map((key: string) => {
                        const currentValue = getNestedValue(form.watch('translations'), key);
                        return (
                          <div key={key} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {key}
                              </Label>
                              <Badge variant="secondary" className="text-xs">
                                {typeof currentValue === 'string' ? t('translationManager.text') : t('translationManager.object')}
                              </Badge>
                            </div>

                            {typeof currentValue === 'string' ? (
                              <Textarea
                                value={currentValue || ''}
                                onChange={(e) => {
                                  const newTranslations = { ...form.getValues('translations') };
                                  setNestedValue(newTranslations, key, e.target.value);
                                  form.setValue('translations', newTranslations);
                                }}
                                placeholder={`${t('translationManager.translationFor')} ${key}`}
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

                    {filteredKeys.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm ? t('translationManager.noKeysFound') : t('translationManager.noTranslationsFound')}
                      </div>
                    )}
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="completion" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('translationManager.autoCompleteTitle')}</h3>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/translation-completion/auto-complete-all', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      toast({
                        title: t('translationManager.success'),
                        description: data.message,
                      });
                      // Recarrega a página para ver as mudanças
                      window.location.reload();
                    } else {
                      throw new Error(data.message);
                    }
                  } catch (error) {
                    toast({
                      title: t('translationManager.error'),
                      description: t('translationManager.autoCompleteError'),
                      variant: "destructive"
                    });
                    console.error('Error auto-completing translations:', error);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                {t('translationManager.autoCompleteButton')}
              </Button>
            </div>
            <TranslationCompletionPanel />
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t('translationManager.allTranslationKeys')}
                </CardTitle>
                <CardDescription>
                  {t('translationManager.allKeysDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="text-center py-8">{t('translationManager.loadingKeys')}</div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {((allKeysData as any)?.keys)?.map((key: string) => (
                      <div key={key} className="border rounded-lg p-4 flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {key}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {key.split('.').length > 1 ? t('translationManager.nested') : t('translationManager.topLevel')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('translationManager.totalKeys')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((allKeysData as any)?.keys)?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('translationManager.keysInSystem')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('translationManager.supportedLanguages')}</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((languagesData as any)?.languages)?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('translationManager.availableLanguages')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('translationManager.currentLanguage')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedLanguage.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('translationManager.languageBeingEdited')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}