
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
  Volume2
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
      return response.json();
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await apiRequest('PUT', '/api/omnibridge/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Configurações Salvas',
        description: 'As configurações do OmniBridge foram atualizadas com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/omnibridge/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações: ' + error.message,
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
    } as SearchSettings
  });

  useEffect(() => {
    if (settings?.data) {
      setLocalSettings(settings.data);
    }
  }, [settings]);

  const handleSave = () => {
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
    setLocalSettings(prev => ({
      ...prev,
      channels: prev.channels.map(channel =>
        channel.id === channelId ? { ...channel, [field]: value } : channel
      )
    }));
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
        <TabsList className="grid w-full grid-cols-4">
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
      </Tabs>
    </div>
  );
}
