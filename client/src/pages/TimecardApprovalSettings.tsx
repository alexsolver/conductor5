import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Users, Clock, CheckCircle, XCircle, Plus, Trash2, Edit } from 'lucide-react';

interface ApprovalGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

interface ApprovalSettings {
  approvalType: 'automatic' | 'manual';
  autoApproveComplete: boolean;
  autoApproveAfterHours: number;
  requireApprovalFor: string[];
  defaultApprovers: string[];
  approvalGroupId?: string;
  createAutoTickets: boolean;
  ticketRecurrence: 'daily' | 'weekly' | 'monthly';
  ticketDay: number;
  ticketTime: string;
  escalationRules: any;
  notificationSettings: any;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function TimecardApprovalSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ApprovalGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Fetch approval settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/timecard/approval/settings'],
    retry: false,
  });

  // Fetch approval groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/timecard/approval/groups'],
    retry: false,
  });

  // Fetch available users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/timecard/approval/users'],
    retry: false,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<ApprovalSettings>) => {
      return await apiRequest('/api/timecard/approval/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações de aprovação foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
      console.error('Error updating settings:', error);
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description?: string }) => {
      return await apiRequest('/api/timecard/approval/groups', {
        method: 'POST',
        body: JSON.stringify(groupData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Grupo criado",
        description: "Grupo de aprovação criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/groups'] });
      setShowGroupDialog(false);
      setNewGroupName('');
      setNewGroupDescription('');
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao criar o grupo.",
        variant: "destructive",
      });
      console.error('Error creating group:', error);
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiRequest(`/api/timecard/approval/groups/${groupId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Grupo removido",
        description: "Grupo de aprovação removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/groups'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao remover o grupo.",
        variant: "destructive",
      });
      console.error('Error deleting group:', error);
    },
  });

  const currentSettings: ApprovalSettings = settings?.settings || {
    approvalType: 'manual',
    autoApproveComplete: false,
    autoApproveAfterHours: 24,
    requireApprovalFor: ['all'],
    defaultApprovers: [],
    createAutoTickets: false,
    ticketRecurrence: 'weekly',
    ticketDay: 1,
    ticketTime: '09:00',
    escalationRules: {},
    notificationSettings: {}
  };

  const groups: ApprovalGroup[] = groupsData?.groups || [];
  const users: User[] = usersData?.users || [];

  const handleSettingsChange = (key: keyof ApprovalSettings, value: any) => {
    const updatedSettings = { ...currentSettings, [key]: value };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Tem certeza que deseja remover este grupo?')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  if (settingsLoading || groupsLoading || usersLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações de Aprovação do Timecard</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações de Aprovação do Timecard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="groups">Grupos de Aprovação</TabsTrigger>
          <TabsTrigger value="tickets">Integração com Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modelo de Aprovação</CardTitle>
              <CardDescription>
                Defina como os registros de ponto devem ser aprovados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Tipo de Aprovação</Label>
                <Select
                  value={currentSettings.approvalType}
                  onValueChange={(value) => handleSettingsChange('approvalType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">
                      Automática (após registros completos)
                    </SelectItem>
                    <SelectItem value="manual">
                      Manual (todos os registros ou tipos específicos)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentSettings.approvalType === 'automatic' && (
                <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={currentSettings.autoApproveComplete}
                      onCheckedChange={(checked) => handleSettingsChange('autoApproveComplete', checked)}
                    />
                    <Label>Aprovar automaticamente registros completos</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Aprovar automaticamente após (horas)</Label>
                    <Input
                      type="number"
                      value={currentSettings.autoApproveAfterHours}
                      onChange={(e) => handleSettingsChange('autoApproveAfterHours', parseInt(e.target.value) || 24)}
                      min="1"
                      max="168"
                    />
                  </div>
                </div>
              )}

              {currentSettings.approvalType === 'manual' && (
                <div className="space-y-4 border-l-4 border-orange-500 pl-4">
                  <Label>Requer aprovação para:</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'Todos os registros' },
                      { value: 'inconsistencies', label: 'Apenas inconsistências' },
                      { value: 'overtime', label: 'Apenas horas extras' },
                      { value: 'absences', label: 'Apenas faltas/atrasos' }
                    ].map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={option.value}
                          checked={currentSettings.requireApprovalFor.includes(option.value)}
                          onChange={(e) => {
                            const current = currentSettings.requireApprovalFor;
                            const updated = e.target.checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value);
                            handleSettingsChange('requireApprovalFor', updated);
                          }}
                        />
                        <Label htmlFor={option.value}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuração de Aprovadores</CardTitle>
              <CardDescription>
                Defina quem pode aprovar os registros de ponto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Grupo de Aprovação</Label>
                <Select
                  value={currentSettings.approvalGroupId || ''}
                  onValueChange={(value) => handleSettingsChange('approvalGroupId', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum grupo selecionado</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.memberCount} membros)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Aprovadores Individuais</Label>
                <Select
                  onValueChange={(userId) => {
                    if (!currentSettings.defaultApprovers.includes(userId)) {
                      handleSettingsChange('defaultApprovers', [...currentSettings.defaultApprovers, userId]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar aprovador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => !currentSettings.defaultApprovers.includes(user.id))
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {currentSettings.defaultApprovers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentSettings.defaultApprovers.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return user ? (
                        <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                          {user.firstName} {user.lastName}
                          <button
                            onClick={() => {
                              handleSettingsChange(
                                'defaultApprovers', 
                                currentSettings.defaultApprovers.filter(id => id !== userId)
                              );
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Grupos de Aprovação</h3>
            <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Grupo de Aprovação</DialogTitle>
                  <DialogDescription>
                    Crie um novo grupo para organizar os aprovadores de timecard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Nome do Grupo</Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Ex: Supervisores de Produção"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Descrição (opcional)</Label>
                    <Textarea
                      id="groupDescription"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Descrição do grupo..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateGroup}
                      disabled={createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {groups.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum grupo criado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crie grupos para organizar seus aprovadores de timecard.
                  </p>
                  <Button onClick={() => setShowGroupDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Grupo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              groups.map(group => (
                <Card key={group.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{group.memberCount} membros</Badge>
                          <Badge variant={group.isActive ? "default" : "secondary"}>
                            {group.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={deleteGroupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integração com Sistema de Tickets</CardTitle>
              <CardDescription>
                Configure a criação automática de tickets para aprovações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentSettings.createAutoTickets}
                  onCheckedChange={(checked) => handleSettingsChange('createAutoTickets', checked)}
                />
                <Label>Criar tickets automaticamente para aprovações</Label>
              </div>

              {currentSettings.createAutoTickets && (
                <div className="space-y-4 border-l-4 border-green-500 pl-4">
                  <div className="space-y-2">
                    <Label>Recorrência dos tickets</Label>
                    <Select
                      value={currentSettings.ticketRecurrence}
                      onValueChange={(value) => handleSettingsChange('ticketRecurrence', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diariamente</SelectItem>
                        <SelectItem value="weekly">Semanalmente</SelectItem>
                        <SelectItem value="monthly">Mensalmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {currentSettings.ticketRecurrence === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Dia da semana</Label>
                      <Select
                        value={currentSettings.ticketDay.toString()}
                        onValueChange={(value) => handleSettingsChange('ticketDay', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Segunda-feira</SelectItem>
                          <SelectItem value="2">Terça-feira</SelectItem>
                          <SelectItem value="3">Quarta-feira</SelectItem>
                          <SelectItem value="4">Quinta-feira</SelectItem>
                          <SelectItem value="5">Sexta-feira</SelectItem>
                          <SelectItem value="6">Sábado</SelectItem>
                          <SelectItem value="0">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Horário de criação</Label>
                    <Input
                      type="time"
                      value={currentSettings.ticketTime}
                      onChange={(e) => handleSettingsChange('ticketTime', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}