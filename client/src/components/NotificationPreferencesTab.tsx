import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Globe,
  Webhook,
  Shield,
  Settings,
  Clock,
  Volume2,
  Vibrate,
  Save,
  AlertCircle,
  RefreshCw,
  Sliders
} from "lucide-react";

interface NotificationChannel {
  id: string;
  name: string;
  icon: any;
  description: string;
}

interface NotificationType {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface NotificationPreferences {
  id?: string;
  userId: string;
  tenantId: string;
  preferences: {
    types: Record<string, {
      enabled: boolean;
      channels: string[];
      priority: string;
      frequency: string;
    }>;
    deliveryWindow?: {
      startTime: string;
      endTime: string;
      timezone: string;
      daysOfWeek: number[];
    };
    globalSettings: {
      doNotDisturb: boolean;
      soundEnabled: boolean;
      vibrationEnabled: boolean;
      emailDigest: boolean;
      digestFrequency: string;
      globalChannels?: {
        email: boolean;
        sms: boolean;
        push: boolean;
        in_app: boolean;
        webhook: boolean;
        slack: boolean;
        dashboard_alert: boolean;
      };
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  { id: 'email', name: 'Email', icon: Mail, description: 'Receber por email' },
  { id: 'sms', name: 'SMS', icon: MessageSquare, description: 'Mensagem de texto' },
  { id: 'push', name: 'Push', icon: Smartphone, description: 'Notificação push' },
  { id: 'in_app', name: 'In-App', icon: Bell, description: 'Dentro da aplicação' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'API webhook' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, description: 'Canal Slack' },
  { id: 'dashboard_alert', name: 'Dashboard', icon: Globe, description: 'Alerta no painel' }
];

const NOTIFICATION_TYPES: NotificationType[] = [
  {
    id: 'system_maintenance',
    name: 'Manutenção do Sistema',
    description: 'Avisos sobre manutenção programada',
    priority: 'medium'
  },
  {
    id: 'system_alert',
    name: 'Alertas do Sistema',
    description: 'Alertas críticos do sistema',
    priority: 'high'
  },
  {
    id: 'ticket_created',
    name: 'Ticket Criado',
    description: 'Quando um novo ticket é criado',
    priority: 'medium'
  },
  {
    id: 'ticket_updated',
    name: 'Ticket Atualizado',
    description: 'Quando um ticket é modificado',
    priority: 'medium'
  },
  {
    id: 'field_emergency',
    name: 'Emergência de Campo',
    description: 'Situações de emergência em campo',
    priority: 'critical'
  },
  {
    id: 'security_alert',
    name: 'Alerta de Segurança',
    description: 'Questões de segurança da conta',
    priority: 'critical'
  }
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];

export default function NotificationPreferencesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isModified, setIsModified] = useState(false);

  // Fetch user notification preferences
  const { data: userPreferences, isLoading, refetch } = useQuery({
    queryKey: ['/api/user/notification-preferences'],
    enabled: !!user
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: NotificationPreferences) => {
      const response = await apiRequest('PUT', '/api/user/notification-preferences', updatedPreferences.preferences);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferências Salvas",
        description: "Suas preferências de notificação foram atualizadas com sucesso.",
      });
      setIsModified(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Não foi possível salvar as preferências.",
        variant: "destructive",
      });
    },
  });

  // Reset preferences mutation - following 1qa.md patterns
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/notification-preferences/reset', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações Resetadas",
        description: "Suas preferências foram restauradas para os valores padrão.",
      });
      setIsModified(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Resetar",
        description: error.message || "Não foi possível resetar as preferências.",
        variant: "destructive",
      });
    },
  });

  // Load preferences when data is fetched - following 1qa.md safety patterns
  useEffect(() => {
    if (userPreferences && typeof userPreferences === 'object' && 'data' in userPreferences) {
      const data = (userPreferences as any).data;
      // Ensure all required properties exist following 1qa.md patterns
      const safePreferences = {
        userId: user?.id || '',
        tenantId: user?.tenantId || '',
        ...data,
        preferences: {
          types: data?.preferences?.types || {},
          deliveryWindow: data?.preferences?.deliveryWindow || {
            startTime: '08:00',
            endTime: '20:00',
            timezone: 'America/Sao_Paulo',
            daysOfWeek: [1, 2, 3, 4, 5]
          },
          globalSettings: data?.preferences?.globalSettings || {
            doNotDisturb: false,
            soundEnabled: true,
            vibrationEnabled: true,
            emailDigest: false,
            digestFrequency: 'daily',
            globalChannels: {
              email: true,
              sms: true,
              push: true,
              in_app: true,
              webhook: true,
              slack: true,
              dashboard_alert: true
            }
          }
        }
      };
      setPreferences(safePreferences);
      setIsModified(false);
    }
  }, [userPreferences, user]);

  const handleTypeToggle = (typeId: string) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        types: {
          ...preferences.preferences.types,
          [typeId]: {
            ...preferences.preferences.types[typeId],
            enabled: !preferences.preferences.types[typeId]?.enabled
          }
        }
      }
    };

    setPreferences(updatedPreferences);
    setIsModified(true);
  };

  const handleChannelToggle = (typeId: string, channelId: string) => {
    if (!preferences) return;

    const currentChannels = preferences.preferences.types[typeId]?.channels || [];
    const updatedChannels = currentChannels.includes(channelId)
      ? currentChannels.filter(ch => ch !== channelId)
      : [...currentChannels, channelId];

    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        types: {
          ...preferences.preferences.types,
          [typeId]: {
            ...preferences.preferences.types[typeId],
            channels: updatedChannels
          }
        }
      }
    };

    setPreferences(updatedPreferences);
    setIsModified(true);
  };

  const handleGlobalSettingToggle = (setting: string) => {
    if (!preferences?.preferences?.globalSettings) return;

    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        globalSettings: {
          ...preferences.preferences.globalSettings,
          [setting]: !preferences.preferences.globalSettings[setting as keyof typeof preferences.preferences.globalSettings]
        }
      }
    };

    setPreferences(updatedPreferences);
    setIsModified(true);
  };

  // Handle global channel toggle - following 1qa.md patterns
  const handleGlobalChannelToggle = (channelId: string) => {
    if (!preferences?.preferences?.globalSettings?.globalChannels) return;

    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        globalSettings: {
          ...preferences.preferences.globalSettings,
          globalChannels: {
            ...preferences.preferences.globalSettings.globalChannels,
            [channelId]: !preferences.preferences.globalSettings.globalChannels[channelId]
          }
        }
      }
    };

    setPreferences(updatedPreferences);
    setIsModified(true);
  };

  // Handle reset to defaults - following 1qa.md patterns
  const handleResetToDefaults = () => {
    resetPreferencesMutation.mutate();
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        deliveryWindow: {
          ...preferences.preferences.deliveryWindow,
          [field]: value,
          startTime: preferences.preferences.deliveryWindow?.startTime || '08:00',
          endTime: preferences.preferences.deliveryWindow?.endTime || '20:00',
          timezone: preferences.preferences.deliveryWindow?.timezone || 'America/Sao_Paulo',
          daysOfWeek: preferences.preferences.deliveryWindow?.daysOfWeek || [1,2,3,4,5]
        }
      }
    };

    setPreferences(updatedPreferences);
    setIsModified(true);
  };

  const handleSave = () => {
    if (preferences) {
      updatePreferencesMutation.mutate(preferences);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Erro ao carregar preferências de notificação</p>
            <Button onClick={() => refetch()} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save and Reset Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Preferências de Notificação</h2>
          <p className="text-gray-600">Configure como deseja receber suas notificações</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleResetToDefaults} 
            disabled={resetPreferencesMutation.isPending}
            data-testid="button-reset-preferences"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {resetPreferencesMutation.isPending ? 'Resetando...' : 'Resetar Padrão'}
          </Button>
          {isModified && (
            <Button 
              onClick={handleSave} 
              disabled={updatePreferencesMutation.isPending}
              data-testid="button-save-preferences"
            >
              <Save className="h-4 w-4 mr-2" />
              {updatePreferencesMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </div>

      {/* Global Channel Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Controles Globais de Canais
          </CardTitle>
          <CardDescription>
            Ativar/desativar canais específicos para todas as notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {NOTIFICATION_CHANNELS.map((channel) => {
              const IconComponent = channel.icon;
              const isEnabled = preferences?.preferences?.globalSettings?.globalChannels?.[channel.id] ?? true;

              return (
                <div
                  key={channel.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    isEnabled
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                  }`}
                  onClick={() => handleGlobalChannelToggle(channel.id)}
                  data-testid={`global-channel-${channel.id}`}
                >
                  <IconComponent className={`h-5 w-5 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${isEnabled ? 'text-blue-900 dark:text-blue-100' : 'text-gray-500'}`}>
                        {channel.name}
                      </span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleGlobalChannelToggle(channel.id)}
                        size="sm"
                        data-testid={`switch-global-${channel.id}`}
                      />
                    </div>
                    <p className={`text-xs ${isEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400'}`}>
                      {channel.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 h-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Configurações globais de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Não Perturbe</Label>
              <p className="text-sm text-gray-600">Suspender todas as notificações temporariamente</p>
            </div>
            <Switch
              checked={preferences?.preferences?.globalSettings?.doNotDisturb || false}
              onCheckedChange={() => handleGlobalSettingToggle('doNotDisturb')}
              data-testid="switch-do-not-disturb"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <div>
                <Label>Som Habilitado</Label>
                <p className="text-sm text-gray-600">Reproduzir som nas notificações</p>
              </div>
            </div>
            <Switch
              checked={preferences?.preferences?.globalSettings?.soundEnabled || false}
              onCheckedChange={() => handleGlobalSettingToggle('soundEnabled')}
              data-testid="switch-sound-enabled"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="h-4 w-4" />
              <div>
                <Label>Vibração Habilitada</Label>
                <p className="text-sm text-gray-600">Vibrar dispositivo nas notificações</p>
              </div>
            </div>
            <Switch
              checked={preferences?.preferences?.globalSettings?.vibrationEnabled || false}
              onCheckedChange={() => handleGlobalSettingToggle('vibrationEnabled')}
              data-testid="switch-vibration-enabled"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Resumo por Email</Label>
              <p className="text-sm text-gray-600">Receber resumo das notificações por email</p>
            </div>
            <Switch
              checked={preferences?.preferences?.globalSettings?.emailDigest || false}
              onCheckedChange={() => handleGlobalSettingToggle('emailDigest')}
              data-testid="switch-email-digest"
            />
          </div>

          {preferences?.preferences?.globalSettings?.emailDigest && (
            <div className="flex items-center justify-between pl-4">
              <Label>Frequência do Resumo</Label>
              <Select
                value={preferences?.preferences?.globalSettings?.digestFrequency || 'daily'}
                onValueChange={(value) => {
                  if (!preferences?.preferences?.globalSettings) return;
                  const updatedPreferences = {
                    ...preferences,
                    preferences: {
                      ...preferences.preferences,
                      globalSettings: {
                        ...preferences.preferences.globalSettings,
                        digestFrequency: value
                      }
                    }
                  };
                  setPreferences(updatedPreferences);
                  setIsModified(true);
                }}
              >
                <SelectTrigger className="w-32" data-testid="select-digest-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Window */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Janela de Entrega
          </CardTitle>
          <CardDescription>
            Configure o horário para receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Horário Inicial</Label>
              <Input
                type="time"
                value={preferences?.preferences?.deliveryWindow?.startTime || '08:00'}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                data-testid="input-start-time"
              />
            </div>
            <div>
              <Label>Horário Final</Label>
              <Input
                type="time"
                value={preferences?.preferences?.deliveryWindow?.endTime || '20:00'}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                data-testid="input-end-time"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tipos de Notificação</h3>

        {NOTIFICATION_TYPES.map((type) => {
          const typePrefs = preferences?.preferences?.types?.[type.id];
          const isEnabled = typePrefs?.enabled || false;
          const selectedChannels = typePrefs?.channels || [];

          return (
            <Card key={type.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{type.name}</h4>
                        <Badge variant={
                          type.priority === 'critical' ? 'destructive' :
                          type.priority === 'high' ? 'default' :
                          type.priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {type.priority === 'critical' ? 'Crítico' :
                           type.priority === 'high' ? 'Alto' :
                           type.priority === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleTypeToggle(type.id)}
                      data-testid={`switch-type-${type.id}`}
                    />
                  </div>

                  {isEnabled && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium">Canais de Entrega</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {NOTIFICATION_CHANNELS.map((channel) => {
                          const isSelected = selectedChannels.includes(channel.id);
                          const IconComponent = channel.icon;

                          return (
                            <div
                              key={channel.id}
                              className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleChannelToggle(type.id, channel.id)}
                              data-testid={`channel-${type.id}-${channel.id}`}
                            >
                              <IconComponent className="h-4 w-4" />
                              <div className="flex-1">
                                <span className="text-sm font-medium">{channel.name}</span>
                                <p className="text-xs text-gray-500">{channel.description}</p>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                isSelected ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons at Bottom */}
      <div className="flex justify-center gap-4 pt-4">
        <Button 
          variant="outline"
          onClick={handleResetToDefaults} 
          disabled={resetPreferencesMutation.isPending}
          size="lg"
          data-testid="button-reset-preferences-bottom"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {resetPreferencesMutation.isPending ? 'Resetando...' : 'Resetar para Padrão'}
        </Button>
        {isModified && (
          <Button 
            onClick={handleSave} 
            disabled={updatePreferencesMutation.isPending}
            size="lg"
            data-testid="button-save-preferences-bottom"
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePreferencesMutation.isPending ? 'Salvando Preferências...' : 'Salvar Todas as Alterações'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default NotificationPreferencesTab;