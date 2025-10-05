
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Settings,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  Clock,
  Filter,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Globe,
  Volume2,
  Brain,
  Sparkles
} from 'lucide-react';

interface ChannelSettings {
  id: string;
  type: string;
  enabled: boolean;
  syncFrequency: number; // minutes
  dailyLimit: number;
  hourlyLimit: number;
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  acceptedTypes: string[];
  maxMessageSize: number; // MB
}

interface FilterSettings {
  id: string;
  blacklistSenders: string[];
  whitelistSenders: string[];
  spamFilters: {
    enabled: boolean;
    confidenceThreshold: number;
    suspiciousKeywords: string[];
  };
  contentFilters: {
    maxLength: number;
    allowAttachments: boolean;
    allowedFileTypes: string[];
    blockSuspiciousLinks: boolean;
  };
}

interface SearchSettings {
  timeRange: number; // days
  maxResultsPerChannel: number;
  priorityChannels: string[];
  autoArchiveAfter: number; // days
}

interface AISettings {
  sentimentAnalysis: {
    enabled: boolean;
    provider: 'openai' | 'deepseek' | 'google' | 'fallback';
    model: string;
    confidenceThreshold: number;
    autoEscalate: {
      enabled: boolean;
      threshold: number;
      assignTo: string;
    };
  };
  fallbackKeywords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  supportedEmotions: string[];
  urgencyIndicators: string[];
  visualization: {
    positiveColor: string;
    neutralColor: string;
    negativeColor: string;
    showIntensity: boolean;
  };
}

export default function OmniBridgeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('channels');
  const [newSender, setNewSender] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Load current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/omnibridge/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/omnibridge/settings');
      const data = await response.json();
      return data;
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await apiRequest('PUT', '/api/omnibridge/settings', newSettings);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Falha ao salvar configurações');
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Configurações Salvas',
        description: 'As configurações do OmniBridge foram atualizadas com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/settings'] });
      // Update local state with saved data
      if (data.data) {
        setLocalSettings(data.data);
      }
    },
    onError: (error: any) => {
      console.error('Settings save error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações: ' + (error.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  });

  const [localSettings, setLocalSettings] = useState({
    channels: [] as ChannelSettings[],
    filters: {
      blacklistSenders: [],
      whitelistSenders: [],
      spamFilters: {
        enabled: true,
        confidenceThreshold: 0.7,
        suspiciousKeywords: []
      },
      contentFilters: {
        maxLength: 10000,
        allowAttachments: true,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
        blockSuspiciousLinks: true
      }
    } as FilterSettings,
    search: {
      timeRange: 30,
      maxResultsPerChannel: 1000,
      priorityChannels: [],
      autoArchiveAfter: 90
    } as SearchSettings,
    ai: {
      sentimentAnalysis: {
        enabled: true,
        provider: 'openai' as const,
        model: 'gpt-4o-mini',
        confidenceThreshold: 0.6,
        autoEscalate: {
          enabled: false,
          threshold: -0.7,
          assignTo: ''
        }
      },
      fallbackKeywords: {
        positive: ['obrigado', 'excelente', 'ótimo', 'perfeito', 'maravilhoso', 'resolvido', 'funcionou'],
        negative: ['problema', 'erro', 'não funciona', 'urgente', 'crítico', 'horrível', 'péssimo', 'insatisfeito'],
        neutral: ['ok', 'entendi', 'aguardando', 'verificar', 'analisar']
      },
      supportedEmotions: ['feliz', 'frustrado', 'neutro', 'ansioso', 'satisfeito', 'irritado', 'confuso'],
      urgencyIndicators: ['urgente', 'crítico', 'emergência', 'imediato', 'agora', 'asap'],
      visualization: {
        positiveColor: '#10b981',
        neutralColor: '#f59e0b',
        negativeColor: '#ef4444',
        showIntensity: true
      }
    } as AISettings
  });

  useEffect(() => {
    if (settings?.success && settings?.data) {
      console.log('Loading settings:', settings.data);
      // Deep merge to preserve nested structure
      setLocalSettings(prev => ({
        ...prev,
        channels: settings.data.channels || prev.channels,
        filters: settings.data.filters ? {
          ...prev.filters,
          ...settings.data.filters,
          spamFilters: settings.data.filters.spamFilters ? {
            ...prev.filters.spamFilters,
            ...settings.data.filters.spamFilters
          } : prev.filters.spamFilters,
          contentFilters: settings.data.filters.contentFilters ? {
            ...prev.filters.contentFilters,
            ...settings.data.filters.contentFilters
          } : prev.filters.contentFilters
        } : prev.filters,
        search: settings.data.search ? {
          ...prev.search,
          ...settings.data.search
        } : prev.search,
        ai: settings.data.ai ? {
          ...prev.ai,
          ...settings.data.ai,
          sentimentAnalysis: settings.data.ai.sentimentAnalysis ? {
            ...prev.ai.sentimentAnalysis,
            ...settings.data.ai.sentimentAnalysis,
            autoEscalate: settings.data.ai.sentimentAnalysis.autoEscalate ? {
              ...prev.ai.sentimentAnalysis.autoEscalate,
              ...settings.data.ai.sentimentAnalysis.autoEscalate
            } : prev.ai.sentimentAnalysis.autoEscalate
          } : prev.ai.sentimentAnalysis,
          fallbackKeywords: settings.data.ai.fallbackKeywords || prev.ai.fallbackKeywords,
          supportedEmotions: settings.data.ai.supportedEmotions || prev.ai.supportedEmotions,
          urgencyIndicators: settings.data.ai.urgencyIndicators || prev.ai.urgencyIndicators,
          visualization: settings.data.ai.visualization ? {
            ...prev.ai.visualization,
            ...settings.data.ai.visualization
          } : prev.ai.visualization
        } : prev.ai
      }));
    }
  }, [settings]);

  const handleSave = () => {
    console.log('Saving settings:', localSettings);
    saveSettingsMutation.mutate(localSettings);
  };

  const addToList = (listType: 'blacklist' | 'whitelist' | 'keywords', value: string) => {
    if (!value.trim()) return;

    setLocalSettings(prev => {
      const newSettings = { ...prev };
      if (listType === 'blacklist') {
        newSettings.filters.blacklistSenders.push(value.trim());
      } else if (listType === 'whitelist') {
        newSettings.filters.whitelistSenders.push(value.trim());
      } else if (listType === 'keywords') {
        newSettings.filters.spamFilters.suspiciousKeywords.push(value.trim());
      }
      return newSettings;
    });

    if (listType === 'keywords') {
      setNewKeyword('');
    } else {
      setNewSender('');
    }
  };

  const removeFromList = (listType: 'blacklist' | 'whitelist' | 'keywords', index: number) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      if (listType === 'blacklist') {
        newSettings.filters.blacklistSenders.splice(index, 1);
      } else if (listType === 'whitelist') {
        newSettings.filters.whitelistSenders.splice(index, 1);
      } else if (listType === 'keywords') {
        newSettings.filters.spamFilters.suspiciousKeywords.splice(index, 1);
      }
      return newSettings;
    });
  };

  const updateChannelSetting = (channelId: string, field: string, value: any) => {
    console.log(`🔧 [SETTINGS] Updating channel ${channelId}, field ${field}, value:`, value);
    setLocalSettings(prev => {
      const updated = {
        ...prev,
        channels: prev.channels.map(channel =>
          channel.id === channelId ? { ...channel, [field]: value } : channel
        )
      };
      console.log(`📝 [SETTINGS] Updated local settings:`, updated);
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações do OmniBridge</h2>
          <p className="text-muted-foreground">
            Configure como as mensagens são recebidas e processadas
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveSettingsMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="channels">
            <Globe className="h-4 w-4 mr-2" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Shield className="h-4 w-4 mr-2" />
            Filtros
          </TabsTrigger>
          <TabsTrigger value="search">
            <Filter className="h-4 w-4 mr-2" />
            Busca
          </TabsTrigger>
          <TabsTrigger value="limits">
            <Volume2 className="h-4 w-4 mr-2" />
            Limites
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="h-4 w-4 mr-2" />
            IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações por Canal</CardTitle>
              <CardDescription>
                Configure cada canal de comunicação individualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {localSettings.channels.map((channel) => (
                <div key={channel.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {channel.type === 'email' && <Mail className="h-5 w-5" />}
                      {channel.type === 'telegram' && <MessageSquare className="h-5 w-5" />}
                      {channel.type === 'whatsapp' && <MessageSquare className="h-5 w-5" />}
                      {channel.type === 'sms' && <Phone className="h-5 w-5" />}
                      <h3 className="font-medium capitalize">{channel.type}</h3>
                    </div>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(checked) => updateChannelSetting(channel.id, 'enabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frequência de Sincronização (minutos)</Label>
                      <Select
                        value={channel.syncFrequency.toString()}
                        onValueChange={(value) => updateChannelSetting(channel.id, 'syncFrequency', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Tempo Real (1 min)</SelectItem>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Limite por Hora</Label>
                      <Input
                        type="number"
                        value={channel.hourlyLimit}
                        onChange={(e) => updateChannelSetting(channel.id, 'hourlyLimit', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={channel.workingHours.enabled}
                        onCheckedChange={(checked) => 
                          updateChannelSetting(channel.id, 'workingHours', { ...channel.workingHours, enabled: checked })
                        }
                      />
                      <Label>Horário de Funcionamento</Label>
                    </div>
                    {channel.workingHours.enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="time"
                          value={channel.workingHours.start}
                          onChange={(e) => 
                            updateChannelSetting(channel.id, 'workingHours', { 
                              ...channel.workingHours, 
                              start: e.target.value 
                            })
                          }
                        />
                        <Input
                          type="time"
                          value={channel.workingHours.end}
                          onChange={(e) => 
                            updateChannelSetting(channel.id, 'workingHours', { 
                              ...channel.workingHours, 
                              end: e.target.value 
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista Negra de Remetentes</CardTitle>
                <CardDescription>
                  Remetentes bloqueados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="email@exemplo.com ou +5511999999999"
                      value={newSender}
                      onChange={(e) => setNewSender(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addToList('blacklist', newSender)}
                    />
                    <Button onClick={() => addToList('blacklist', newSender)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {localSettings.filters.blacklistSenders.map((sender, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{sender}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromList('blacklist', index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista Branca de Remetentes</CardTitle>
                <CardDescription>
                  Remetentes prioritários (sempre aceitos)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="email@exemplo.com ou +5511999999999"
                      value={newSender}
                      onChange={(e) => setNewSender(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addToList('whitelist', newSender)}
                    />
                    <Button onClick={() => addToList('whitelist', newSender)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {localSettings.filters.whitelistSenders.map((sender, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{sender}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromList('whitelist', index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtros Anti-Spam</CardTitle>
              <CardDescription>
                Configure proteções contra spam e conteúdo suspeito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Habilitar Filtro Anti-Spam</Label>
                <Switch
                  checked={localSettings.filters.spamFilters.enabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        spamFilters: { ...prev.filters.spamFilters, enabled: checked }
                      }
                    }))
                  }
                />
              </div>

              <div>
                <Label>Limiar de Confiança ({localSettings.filters.spamFilters.confidenceThreshold})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.filters.spamFilters.confidenceThreshold}
                  onChange={(e) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        spamFilters: { 
                          ...prev.filters.spamFilters, 
                          confidenceThreshold: parseFloat(e.target.value) 
                        }
                      }
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <Label>Palavras-chave Suspeitas</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    placeholder="Digite uma palavra suspeita"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('keywords', newKeyword)}
                  />
                  <Button onClick={() => addToList('keywords', newKeyword)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {localSettings.filters.spamFilters.suspiciousKeywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {keyword}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeFromList('keywords', index)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Busca</CardTitle>
              <CardDescription>
                Configure como as mensagens são buscadas e organizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Período de Busca</Label>
                <Select
                  value={localSettings.search.timeRange.toString()}
                  onValueChange={(value) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      search: { ...prev.search, timeRange: parseInt(value) }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="15">Últimos 15 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="60">Últimos 60 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Máximo de Mensagens por Canal</Label>
                <Input
                  type="number"
                  value={localSettings.search.maxResultsPerChannel}
                  onChange={(e) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      search: { ...prev.search, maxResultsPerChannel: parseInt(e.target.value) }
                    }))
                  }
                />
              </div>

              <div>
                <Label>Arquivar Automaticamente Após (dias)</Label>
                <Input
                  type="number"
                  value={localSettings.search.autoArchiveAfter}
                  onChange={(e) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      search: { ...prev.search, autoArchiveAfter: parseInt(e.target.value) }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Limites de Conteúdo</CardTitle>
              <CardDescription>
                Configure limites para tamanho e tipos de mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tamanho Máximo de Mensagem (caracteres)</Label>
                <Input
                  type="number"
                  value={localSettings.filters.contentFilters.maxLength}
                  onChange={(e) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        contentFilters: {
                          ...prev.filters.contentFilters,
                          maxLength: parseInt(e.target.value)
                        }
                      }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Permitir Anexos</Label>
                <Switch
                  checked={localSettings.filters.contentFilters.allowAttachments}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        contentFilters: {
                          ...prev.filters.contentFilters,
                          allowAttachments: checked
                        }
                      }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Bloquear Links Suspeitos</Label>
                <Switch
                  checked={localSettings.filters.contentFilters.blockSuspiciousLinks}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        contentFilters: {
                          ...prev.filters.contentFilters,
                          blockSuspiciousLinks: checked
                        }
                      }
                    }))
                  }
                />
              </div>

              <div>
                <Label>Tipos de Arquivo Permitidos</Label>
                <Textarea
                  value={localSettings.filters.contentFilters.allowedFileTypes.join(', ')}
                  onChange={(e) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        contentFilters: {
                          ...prev.filters.contentFilters,
                          allowedFileTypes: e.target.value.split(',').map(type => type.trim())
                        }
                      }
                    }))
                  }
                  placeholder="pdf, doc, docx, txt, jpg, png, gif"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Análise de Sentimento com IA
              </CardTitle>
              <CardDescription>
                Configure como a inteligência artificial analisa e classifica o sentimento das mensagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex-1">
                  <Label className="text-base font-semibold">Habilitar Análise de Sentimento</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detecta automaticamente o sentimento (positivo, neutro, negativo) em todas as mensagens
                  </p>
                </div>
                <Switch
                  checked={localSettings.ai.sentimentAnalysis.enabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({
                      ...prev,
                      ai: {
                        ...prev.ai,
                        sentimentAnalysis: { ...prev.ai.sentimentAnalysis, enabled: checked }
                      }
                    }))
                  }
                />
              </div>

              {localSettings.ai.sentimentAnalysis.enabled && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Provedor de IA</Label>
                      <Select
                        value={localSettings.ai.sentimentAnalysis.provider}
                        onValueChange={(value: any) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              sentimentAnalysis: { ...prev.ai.sentimentAnalysis, provider: value }
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI (GPT-4o-mini)</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                          <SelectItem value="google">Google AI (Gemini)</SelectItem>
                          <SelectItem value="fallback">Fallback (Keywords)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Escolha o modelo de IA para análise de sentimento
                      </p>
                    </div>

                    <div>
                      <Label>Modelo</Label>
                      <Select
                        value={localSettings.ai.sentimentAnalysis.model}
                        onValueChange={(value) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              sentimentAnalysis: { ...prev.ai.sentimentAnalysis, model: value }
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {localSettings.ai.sentimentAnalysis.provider === 'openai' && (
                            <>
                              <SelectItem value="gpt-4o-mini">GPT-4o-mini (Recomendado)</SelectItem>
                              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            </>
                          )}
                          {localSettings.ai.sentimentAnalysis.provider === 'deepseek' && (
                            <>
                              <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                              <SelectItem value="deepseek-reasoner">DeepSeek Reasoner</SelectItem>
                            </>
                          )}
                          {localSettings.ai.sentimentAnalysis.provider === 'google' && (
                            <>
                              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                            </>
                          )}
                          {localSettings.ai.sentimentAnalysis.provider === 'fallback' && (
                            <SelectItem value="keywords">Keywords Matching</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Limiar de Confiança: {localSettings.ai.sentimentAnalysis.confidenceThreshold.toFixed(2)}
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={localSettings.ai.sentimentAnalysis.confidenceThreshold}
                      onChange={(e) =>
                        setLocalSettings(prev => ({
                          ...prev,
                          ai: {
                            ...prev.ai,
                            sentimentAnalysis: { 
                              ...prev.ai.sentimentAnalysis, 
                              confidenceThreshold: parseFloat(e.target.value) 
                            }
                          }
                        }))
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nível mínimo de confiança para considerar a análise válida (0 = menos rigoroso, 1 = mais rigoroso)
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-base font-semibold text-red-900">Auto-Escalação por Sentimento Negativo</Label>
                        <p className="text-sm text-red-700 mt-1">
                          Escala automaticamente tickets com sentimento muito negativo
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.ai.sentimentAnalysis.autoEscalate.enabled}
                        onCheckedChange={(checked) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              sentimentAnalysis: {
                                ...prev.ai.sentimentAnalysis,
                                autoEscalate: { ...prev.ai.sentimentAnalysis.autoEscalate, enabled: checked }
                              }
                            }
                          }))
                        }
                      />
                    </div>

                    {localSettings.ai.sentimentAnalysis.autoEscalate.enabled && (
                      <div className="space-y-3 mt-4">
                        <div>
                          <Label className="text-red-900">
                            Limiar de Escalação: {localSettings.ai.sentimentAnalysis.autoEscalate.threshold.toFixed(2)}
                          </Label>
                          <input
                            type="range"
                            min="-1"
                            max="0"
                            step="0.1"
                            value={localSettings.ai.sentimentAnalysis.autoEscalate.threshold}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  sentimentAnalysis: {
                                    ...prev.ai.sentimentAnalysis,
                                    autoEscalate: {
                                      ...prev.ai.sentimentAnalysis.autoEscalate,
                                      threshold: parseFloat(e.target.value)
                                    }
                                  }
                                }
                              }))
                            }
                            className="w-full"
                          />
                          <p className="text-xs text-red-700 mt-1">
                            Score abaixo do qual o ticket será escalado (-1 = muito negativo, 0 = neutro)
                          </p>
                        </div>

                        <div>
                          <Label className="text-red-900">Atribuir Para (User ID)</Label>
                          <Input
                            placeholder="ID do usuário para escalação"
                            value={localSettings.ai.sentimentAnalysis.autoEscalate.assignTo}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  sentimentAnalysis: {
                                    ...prev.ai.sentimentAnalysis,
                                    autoEscalate: {
                                      ...prev.ai.sentimentAnalysis.autoEscalate,
                                      assignTo: e.target.value
                                    }
                                  }
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Keywords de Fallback - Positivas</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Palavras-chave para detecção de sentimento positivo quando IA não está disponível
                      </p>
                      <Textarea
                        value={localSettings.ai.fallbackKeywords.positive.join(', ')}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              fallbackKeywords: {
                                ...prev.ai.fallbackKeywords,
                                positive: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                              }
                            }
                          }))
                        }
                        placeholder="obrigado, excelente, ótimo, perfeito..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Keywords de Fallback - Negativas</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Palavras-chave para detecção de sentimento negativo quando IA não está disponível
                      </p>
                      <Textarea
                        value={localSettings.ai.fallbackKeywords.negative.join(', ')}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              fallbackKeywords: {
                                ...prev.ai.fallbackKeywords,
                                negative: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                              }
                            }
                          }))
                        }
                        placeholder="problema, erro, não funciona, urgente, crítico..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Keywords de Fallback - Neutras</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Palavras-chave para detecção de sentimento neutro quando IA não está disponível
                      </p>
                      <Textarea
                        value={localSettings.ai.fallbackKeywords.neutral.join(', ')}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              fallbackKeywords: {
                                ...prev.ai.fallbackKeywords,
                                neutral: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                              }
                            }
                          }))
                        }
                        placeholder="ok, entendi, aguardando, verificar..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Emoções Suportadas</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Lista de emoções que o sistema pode detectar nas mensagens
                      </p>
                      <Textarea
                        value={localSettings.ai.supportedEmotions.join(', ')}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              supportedEmotions: e.target.value.split(',').map(e => e.trim()).filter(e => e)
                            }
                          }))
                        }
                        placeholder="feliz, frustrado, neutro, ansioso, satisfeito..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Indicadores de Urgência</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Palavras que indicam urgência nas mensagens
                      </p>
                      <Textarea
                        value={localSettings.ai.urgencyIndicators.join(', ')}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              urgencyIndicators: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                            }
                          }))
                        }
                        placeholder="urgente, crítico, emergência, imediato, agora, asap..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-base font-semibold">Configurações de Visualização</Label>
                      <Switch
                        checked={localSettings.ai.visualization.showIntensity}
                        onCheckedChange={(checked) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            ai: {
                              ...prev.ai,
                              visualization: { ...prev.ai.visualization, showIntensity: checked }
                            }
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">Mostrar Intensidade</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Cor Positiva</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={localSettings.ai.visualization.positiveColor}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  visualization: { ...prev.ai.visualization, positiveColor: e.target.value }
                                }
                              }))
                            }
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={localSettings.ai.visualization.positiveColor}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  visualization: { ...prev.ai.visualization, positiveColor: e.target.value }
                                }
                              }))
                            }
                            placeholder="#10b981"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Cor Neutra</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={localSettings.ai.visualization.neutralColor}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  visualization: { ...prev.ai.visualization, neutralColor: e.target.value }
                                }
                              }))
                            }
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={localSettings.ai.visualization.neutralColor}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  visualization: { ...prev.ai.visualization, neutralColor: e.target.value }
                                }
                              }))
                            }
                            placeholder="#f59e0b"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Cor Negativa</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={localSettings.ai.visualization.negativeColor}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  visualization: { ...prev.ai.visualization, negativeColor: e.target.value }
                                }
                              }))
                            }
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={localSettings.ai.visualization.negativeColor}
                            onChange={(e) =>
                              setLocalSettings(prev => ({
                                ...prev,
                                ai: {
                                  ...prev.ai,
                                  visualization: { ...prev.ai.visualization, negativeColor: e.target.value }
                                }
                              }))
                            }
                            placeholder="#ef4444"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="flex gap-2">
                        <div 
                          className="px-3 py-1 rounded text-white text-sm"
                          style={{ backgroundColor: localSettings.ai.visualization.positiveColor }}
                        >
                          Positivo
                        </div>
                        <div 
                          className="px-3 py-1 rounded text-white text-sm"
                          style={{ backgroundColor: localSettings.ai.visualization.neutralColor }}
                        >
                          Neutro
                        </div>
                        <div 
                          className="px-3 py-1 rounded text-white text-sm"
                          style={{ backgroundColor: localSettings.ai.visualization.negativeColor }}
                        >
                          Negativo
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
