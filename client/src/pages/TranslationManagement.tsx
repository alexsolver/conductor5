/**
 * Translation Management Page
 * Complete enterprise translation management interface following 1qa.md patterns
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Globe, 
  Search, 
  Plus, 
  Edit, 
  Upload, 
  Download, 
  BarChart3, 
  Languages, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Save,
  X
} from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl: boolean;
}

interface Translation {
  id: string;
  key: string;
  language: string;
  value: string;
  module: string;
  context?: string;
  isGlobal: boolean;
  isCustomizable: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface TranslationStats {
  overview: {
    totalKeys: number;
    totalTranslations: number;
    languages: string[];
    modules: string[];
    lastUpdated: string;
  };
  byLanguage: Record<string, {
    totalKeys: number;
    translatedKeys: number;
    missingKeys: number;
    completeness: number;
  }>;
  gaps: Array<{
    language: string;
    module: string;
    missingKeys: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function TranslationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [newTranslation, setNewTranslation] = useState({
    key: '',
    value: '',
    module: '',
    context: '',
    isGlobal: true
  });

  // Fetch supported languages
  const { data: languagesData } = useQuery({
    queryKey: ['translation-languages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/translations/languages');
      if (!response.ok) throw new Error('Failed to fetch languages');
      return response.json();
    }
  });

  // Fetch translation statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['translation-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/translations/stats?includeModuleBreakdown=true');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Search translations
  const { data: translationsData, isLoading: translationsLoading } = useQuery({
    queryKey: ['translations-search', selectedLanguage, selectedModule, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLanguage) params.set('language', selectedLanguage);
      if (selectedModule) params.set('module', selectedModule);
      if (searchQuery) params.set('query', searchQuery);
      params.set('limit', '100');
      
      const response = await apiRequest('GET', `/api/translations/search?${params}`);
      if (!response.ok) throw new Error('Failed to search translations');
      return response.json();
    }
  });

  // Create translation mutation
  const createTranslation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/translations', {
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create translation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-search'] });
      queryClient.invalidateQueries({ queryKey: ['translation-stats'] });
      setNewTranslation({ key: '', value: '', module: '', context: '', isGlobal: true });
      toast({
        title: "✅ Translation Created",
        description: "The translation has been created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update translation mutation
  const updateTranslation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/translations/${id}`, {
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update translation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-search'] });
      queryClient.invalidateQueries({ queryKey: ['translation-stats'] });
      setEditingTranslation(null);
      toast({
        title: "✅ Translation Updated",
        description: "The translation has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const languages = languagesData?.data?.languages || [];
  const stats: TranslationStats | null = statsData?.data || null;
  const translations = translationsData?.data?.translations || [];

  const availableModules = useMemo(() => {
    const modules = new Set<string>();
    translations.forEach((t: Translation) => modules.add(t.module));
    return Array.from(modules).sort();
  }, [translations]);

  const priorityColor = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Translation Management</h1>
          <p className="text-gray-600">Manage translations across all system modules and languages</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="translations" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Translations
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Gaps Analysis
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Operations
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {statsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Keys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.overview.totalKeys || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Translation keys in system</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Translations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.overview.totalTranslations || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Across all languages</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.overview.languages.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Supported languages</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.overview.modules.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">System modules</p>
                  </CardContent>
                </Card>
              </div>

              {/* Completeness by Language */}
              <Card>
                <CardHeader>
                  <CardTitle>Translation Completeness by Language</CardTitle>
                  <CardDescription>
                    Track translation progress across all supported languages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(stats?.byLanguage || {}).map(([lang, langStats]) => {
                    const language = languages.find((l: Language) => l.code === lang);
                    return (
                      <div key={lang} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium">
                          {language?.flag} {language?.name || lang}
                        </div>
                        <div className="flex-1">
                          <Progress value={langStats.completeness} className="h-2" />
                        </div>
                        <div className="text-sm text-gray-600 w-16 text-right">
                          {langStats.completeness}%
                        </div>
                        <div className="text-xs text-gray-500 w-24 text-right">
                          {langStats.translatedKeys}/{langStats.totalKeys}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Translations Tab */}
        <TabsContent value="translations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Translations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="language-filter">Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Languages</SelectItem>
                      {languages.map((lang: Language) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="module-filter">Module</Label>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Modules</SelectItem>
                      {availableModules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="search">Search Keys or Values</Label>
                  <Input
                    id="search"
                    placeholder="Search translation keys or values..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Translation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Translation</DialogTitle>
                      <DialogDescription>
                        Add a new translation key and value to the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-key">Translation Key</Label>
                          <Input
                            id="new-key"
                            placeholder="e.g., common.buttons.save"
                            value={newTranslation.key}
                            onChange={(e) => setNewTranslation(prev => ({ ...prev, key: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-module">Module</Label>
                          <Input
                            id="new-module"
                            placeholder="e.g., common, tickets, users"
                            value={newTranslation.module}
                            onChange={(e) => setNewTranslation(prev => ({ ...prev, module: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="new-value">Translation Value</Label>
                        <Textarea
                          id="new-value"
                          placeholder="Enter the translation text..."
                          value={newTranslation.value}
                          onChange={(e) => setNewTranslation(prev => ({ ...prev, value: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-context">Context (Optional)</Label>
                        <Input
                          id="new-context"
                          placeholder="Additional context for translators"
                          value={newTranslation.context}
                          onChange={(e) => setNewTranslation(prev => ({ ...prev, context: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => createTranslation.mutate({
                            ...newTranslation,
                            language: selectedLanguage || 'en'
                          })}
                          disabled={createTranslation.isPending || !newTranslation.key || !newTranslation.value}
                        >
                          {createTranslation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Create Translation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Translations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Translations</CardTitle>
              <CardDescription>
                {translationsLoading ? 'Loading...' : `${translations.length} translations found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {translationsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {translations.map((translation: Translation) => (
                      <TableRow key={translation.id}>
                        <TableCell className="font-mono text-sm">
                          {translation.key}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {translation.value}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{translation.module}</Badge>
                        </TableCell>
                        <TableCell>
                          {languages.find((l: Language) => l.code === translation.language)?.flag}{' '}
                          {translation.language}
                        </TableCell>
                        <TableCell>
                          <Badge variant={translation.isGlobal ? 'default' : 'secondary'}>
                            {translation.isGlobal ? 'Global' : 'Tenant'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingTranslation(translation)}
                            disabled={!translation.isCustomizable}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gaps Analysis Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Translation Gaps Analysis
              </CardTitle>
              <CardDescription>
                Identify missing translations across languages and modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.gaps && stats.gaps.length > 0 ? (
                <div className="space-y-4">
                  {stats.gaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {languages.find((l: Language) => l.code === gap.language)?.flag}{' '}
                            {gap.language} - {gap.module}
                          </span>
                          <Badge className={priorityColor[gap.priority]}>
                            {gap.priority} priority
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {gap.missingKeys.length} missing keys
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Missing: {gap.missingKeys.slice(0, 5).join(', ')}
                        {gap.missingKeys.length > 5 && ` and ${gap.missingKeys.length - 5} more...`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No translation gaps found!</p>
                  <p className="text-gray-600">All translations are complete across all languages.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Bulk Import
                </CardTitle>
                <CardDescription>
                  Import translations from JSON or CSV files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Feature coming soon. You can import translations in bulk using JSON or CSV format.
                </p>
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Translations
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Translations
                </CardTitle>
                <CardDescription>
                  Export translations for external editing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Export translations in various formats for external editing and translation services.
                </p>
                <Button variant="outline" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export Translations
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Translation Dialog */}
      {editingTranslation && (
        <Dialog open={!!editingTranslation} onOpenChange={() => setEditingTranslation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Translation</DialogTitle>
              <DialogDescription>
                Update the translation value and context
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Translation Key</Label>
                <Input value={editingTranslation.key} disabled />
              </div>
              
              <div>
                <Label htmlFor="edit-value">Translation Value</Label>
                <Textarea
                  id="edit-value"
                  value={editingTranslation.value}
                  onChange={(e) => setEditingTranslation(prev => 
                    prev ? { ...prev, value: e.target.value } : null
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-context">Context (Optional)</Label>
                <Input
                  id="edit-context"
                  value={editingTranslation.context || ''}
                  onChange={(e) => setEditingTranslation(prev => 
                    prev ? { ...prev, context: e.target.value } : null
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTranslation(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (editingTranslation) {
                      updateTranslation.mutate({
                        id: editingTranslation.id,
                        data: {
                          value: editingTranslation.value,
                          context: editingTranslation.context
                        }
                      });
                    }
                  }}
                  disabled={updateTranslation.isPending}
                >
                  {updateTranslation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}