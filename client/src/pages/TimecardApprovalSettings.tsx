import React, { useState, useEffect } from 'react';
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
import { Settings, Users, Clock, CheckCircle, XCircle, Plus, Trash2, Edit, UserPlus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
// import useLocalization from '@/hooks/useLocalization';

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
  // Localization temporarily disabled

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ApprovalGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

  const groups: ApprovalGroup[] = (groupsData as any)?.groups || [];
  const users: User[] = (usersData as any)?.users || [];

  // Estado para contadores de membros 
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<string, number>>({});

  // Buscar contadores de membros quando grupos mudarem
  useEffect(() => {
    const fetchMemberCounts = async () => {
      if (groups.length === 0) return;
      
      const counts: Record<string, number> = {};
      
      for (const group of groups) {
        try {
          // Usar queries individuais para cada grupo para evitar problemas de cache
          const response = await fetch(`/api/timecard/approval/groups/${group.id}/members`, {
            headers: {
              'Authorization': `Bearer " + (localStorage.getItem("accessToken") || ""),
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            counts[group.id] = data.members?.length || 0;
            console.log("Group " + group.name + " (" + group.id + ") has " + counts[group.id] + " members");
          } else {
            console.error("Failed to fetch members for group " + group.id + ":", response.status);
            counts[group.id] = 0;
          }
        } catch (error) {
          console.error('Error fetching member count for group:', group.id, error);
          counts[group.id] = 0;
        }
      }
      
      console.log('Final member counts:', counts);
      setGroupMemberCounts(counts);
    };

    fetchMemberCounts();
  }, [groups]);

  // Fetch group members when a group is selected
  const { data: groupMembersData, isLoading: membersLoading } = useQuery({
    queryKey: ['/api/timecard/approval/groups', selectedGroup?.id, 'members'],
    enabled: !!selectedGroup?.id && showMembersDialog,
    retry: false,
  });

  const groupMembers: User[] = (groupMembersData as any)?.members || [];

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<ApprovalSettings>) => {
      const response = await apiRequest('PUT', '/api/timecard/approval/settings', newSettings);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Configurações Salvas',
        description: "As configurações de aprovação foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/settings'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
      console.error('Error updating settings:', error);
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description?: string }) => {
      return await apiRequest('POST', '/api/timecard/approval/groups', groupData);
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
        title: 'Erro',
        description: "Falha ao criar o grupo.",
        variant: "destructive",
      });
      console.error('Error creating group:', error);
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      return await apiRequest('PUT', /api/timecard/approval/groups/" + id, data);
    },
    onSuccess: () => {
      toast({
        title: "Grupo atualizado",
        description: "Grupo de aprovação atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/groups'] });
      setShowGroupDialog(false);
      setSelectedGroup(null);
      setNewGroupName('');
      setNewGroupDescription('');
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: "Falha ao atualizar o grupo.",
        variant: "destructive",
      });
      console.error('Error updating group:', error);
    },
  });

  // Update group members mutation
  const updateMembersMutation = useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      return await apiRequest('PUT', /api/timecard/approval/groups/" + groupId + "/members", { userIds });
    },
    onSuccess: () => {
      toast({
        title: "Membros atualizados",
        description: "Membros do grupo atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/groups', selectedGroup?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/approval/group-member-counts'] });
      
      setShowMembersDialog(false);
      setSelectedGroup(null);
      setSelectedUsers([]);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: "Falha ao atualizar membros do grupo.",
        variant: "destructive",
      });
      console.error('[TRANSLATION_NEEDED]', error);
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiRequest('DELETE', `/api/timecard/approval/groups/${groupId");
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
        title: 'Erro',
        description: "Falha ao remover o grupo.",
        variant: "destructive",
      });
      console.error('[TRANSLATION_NEEDED]', error);
    },
  });

  const currentSettings: ApprovalSettings = (settings as any)?.settings || {
    approvalType: 'manual',
    autoApproveComplete: false,
    autoApproveAfterHours: 24,
    requireApprovalFor: ['all'],
    defaultApprovers: [],
    approvalGroupId: null,
    createAutoTickets: false,
    ticketRecurrence: 'weekly',
    ticketDay: 1,
    ticketTime: '09:00',
    escalationRules: {},
    notificationSettings: {}
  };



  const handleSettingsChange = (key: keyof ApprovalSettings, value: any) => {
    const updatedSettings = { ...currentSettings, [key]: value };
    console.log('Sending settings update:', updatedSettings);
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: 'Erro',
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

  const handleUpdateGroup = () => {
    if (!selectedGroup || !newGroupName.trim()) {
      toast({
        title: 'Erro',
        description: "Nome do grupo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    updateGroupMutation.mutate({
      id: selectedGroup.id,
      data: {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined
      }
    });
  };

  const handleUpdateMembers = () => {
    if (!selectedGroup) return;

    updateMembersMutation.mutate({
      groupId: selectedGroup.id,
      userIds: selectedUsers
    });
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Initialize selected users when members dialog opens
  const handleOpenMembersDialog = (group: ApprovalGroup) => {
    setSelectedGroup(group);
    setSelectedUsers([]); // Reset first
    setShowMembersDialog(true);
  };

  // Update selected users when group members data changes
  React.useEffect(() => {
    if (groupMembers.length > 0 && showMembersDialog) {
      setSelectedUsers(groupMembers.map(member => member.id));
    }
  }, [groupMembers, showMembersDialog]);

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
                      { value: 'all', label: '[TRANSLATION_NEEDED]' },
                      { value: 'inconsistencies', label: 'Inconsistências' },
                      { value: 'overtime', label: 'Horas extras' },
                      { value: 'absences', label: 'Faltas/atrasos' }
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
                    <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum grupo selecionado</SelectItem>
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
                  <DialogTitle>
                    {selectedGroup ? '[TRANSLATION_NEEDED]' : '[TRANSLATION_NEEDED]'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedGroup 
                      ? '[TRANSLATION_NEEDED]'
                      : 'Crie um novo grupo para organizar os aprovadores de timecard.'
                    }
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
                    <Button variant="outline" onClick={() => {
                      setShowGroupDialog(false);
                      setSelectedGroup(null);
                      setNewGroupName('');
                      setNewGroupDescription('');
                    }}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={selectedGroup ? handleUpdateGroup : handleCreateGroup}
                      disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                    >
                      {selectedGroup 
                        ? (updateGroupMutation.isPending ? 'Salvando...' : 'Salvar Alterações')
                        : (createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo')
                      }
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Members Management Dialog */}
            <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Gerenciar Membros - {selectedGroup?.name}
                  </DialogTitle>
                  <DialogDescription>
                    Selecione os funcionários que farão parte deste grupo de aprovação.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {membersLoading ? (
                    <div className="text-center py-4">Carregando membros...</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 rounded border">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserToggle(user.id, !!checked)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email} • {user.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      {selectedUsers.length} de {users.length} funcionários selecionados
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowMembersDialog(false);
                          setSelectedGroup(null);
                          setSelectedUsers([]);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleUpdateMembers}
                        disabled={updateMembersMutation.isPending}
                      >
                        {updateMembersMutation.isPending ? 'Salvando...' : '[TRANSLATION_NEEDED]'}
                      </Button>
                    </div>
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
                          <Badge variant="outline">{groupMemberCounts[group.id] || 0} membros</Badge>
                          <Badge variant={group.isActive ? "default" : "secondary">
                            {group.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
                          setNewGroupName(group.name);
                          setNewGroupDescription(group.description || '');
                          setShowGroupDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenMembersDialog(group)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Membros
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