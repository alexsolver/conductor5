
/**
 * Notification Preferences Component
 * Allows users to configure their notification settings
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiRequest } from '../../lib/queryClient';
import { toast } from '../ui/use-toast';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Monitor,
  Webhook,
  Clock,
  Filter
} from 'lucide-react';

interface NotificationPreference {
  id: string;
  notificationType: string;
  channels: string[];
  enabled: boolean;
  scheduleSettings: {
    doNotDisturbStart?: string;
    doNotDisturbEnd?: string;
    timezone?: string;
    weekdaysOnly?: boolean;
  };
  filters: {
    minSeverity?: string;
    categories?: string[];
  };
}

export function NotificationPreferences() {
  const [selectedType, setSelectedType] = useState('all');
  const queryClient = useQueryClient();

  // Fetch preferences
  const { data: preferencesData, isLoading } = useQuery({
    queryKey: ['/api/notification-preferences'],
    queryFn: () => apiRequest('GET', '/api/notification-preferences'),
  });

  const preferences = preferencesData?.data || [];

  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationPreference> }) =>
      apiRequest('PUT', `/api/notification-preferences/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({ title: 'Preferências atualizadas com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar preferências', variant: 'destructive' });
    }
  });

  const notificationTypes = [
    { value: 'ticket_assignment', label: 'Atribuição de Tickets', icon: <Bell className="h-4 w-4" /> },
    { value: 'ticket_overdue', label: 'Tickets Atrasados', icon: <Clock className="h-4 w-4" /> },
    { value: 'sla_breach', label: 'Quebra de SLA', icon: <Bell className="h-4 w-4" /> },
    { value: 'compliance_expiry', label: 'Vencimento de Compliance', icon: <Bell className="h-4 w-4" /> },
    { value: 'timecard_approval', label: 'Aprovação de Timecard', icon: <Clock className="h-4 w-4" /> },
    { value: 'stock_low', label: 'Estoque Baixo', icon: <Bell className="h-4 w-4" /> },
    { value: 'system_alert', label: 'Alertas do Sistema', icon: <Monitor className="h-4 w-4" /> }
  ];

  const channels = [
    { value: 'in_app', label: 'No App', icon: <Bell className="h-4 w-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'sms', label: 'SMS', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'push', label: 'Push', icon: <Monitor className="h-4 w-4" /> },
    { value: 'webhook', label: 'Webhook', icon: <Webhook className="h-4 w-4" /> }
  ];

  const severityLevels = [
    { value: 'info', label: 'Informação' },
    { value: 'warning', label: 'Aviso' },
    { value: 'error', label: 'Erro' },
    { value: 'critical', label: 'Crítico' }
  ];

  const getPreferenceForType = (type: string) => {
    return preferences.find((p: NotificationPreference) => p.notificationType === type);
  };

  const handleToggleEnabled = (type: string, enabled: boolean) => {
    const preference = getPreferenceForType(type);
    if (preference) {
      updatePreferenceMutation.mutate({
        id: preference.id,
        data: { enabled }
      });
    }
  };

  const handleToggleChannel = (type: string, channel: string) => {
    const preference = getPreferenceForType(type);
    if (preference) {
      const currentChannels = preference.channels || [];
      const newChannels = currentChannels.includes(channel)
        ? currentChannels.filter(c => c !== channel)
        : [...currentChannels, channel];
      
      updatePreferenceMutation.mutate({
        id: preference.id,
        data: { channels: newChannels }
      });
    }
  };

  const handleUpdateSchedule = (type: string, scheduleSettings: any) => {
    const preference = getPreferenceForType(type);
    if (preference) {
      updatePreferenceMutation.mutate({
        id: preference.id,
        data: { scheduleSettings }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Carregando preferências...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferências de Notificação
          </CardTitle>
          <CardDescription>
            Configure como e quando você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Configurações Globais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dnd-start">Não perturbe - Início</Label>
                <Input id="dnd-start" type="time" placeholder="22:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dnd-end">Não perturbe - Fim</Label>
                <Input id="dnd-end" type="time" placeholder="08:00" />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Switch id="weekdays-only" />
              <Label htmlFor="weekdays-only">Apenas dias úteis</Label>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium mb-4">Tipos de Notificação</h3>
            <div className="space-y-4">
              {notificationTypes.map((type) => {
                const preference = getPreferenceForType(type.value);
                const isEnabled = preference?.enabled ?? true;
                const enabledChannels = preference?.channels || ['in_app'];

                return (
                  <Card key={type.value} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {type.icon}
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => 
                          handleToggleEnabled(type.value, checked)
                        }
                      />
                    </div>

                    {isEnabled && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Canais</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {channels.map((channel) => (
                              <Badge
                                key={channel.value}
                                variant={enabledChannels.includes(channel.value) ? "default" : "outline"}
                                className="cursor-pointer flex items-center gap-1"
                                onClick={() => handleToggleChannel(type.value, channel.value)}
                              >
                                {channel.icon}
                                {channel.label}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Severidade Mínima</Label>
                          <Select defaultValue={preference?.filters?.minSeverity || 'info'}>
                            <SelectTrigger className="w-48 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {severityLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button>
              Salvar Preferências
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
