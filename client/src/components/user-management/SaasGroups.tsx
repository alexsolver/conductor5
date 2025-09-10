import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Edit, Trash2, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SaasGroup {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  memberCount: number;
  memberships: Array<{
    id: string;
    userId: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    assignedById: string;
  }>;
}

interface SaasGroupsResponse {
  success: boolean;
  groups: SaasGroup[];
  count: number;
}

interface UserForGroup {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface UsersResponse {
  success: boolean;
  users?: UserForGroup[];
  members?: UserForGroup[];
}

export function SaasGroups() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SaasGroup | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [memberRole, setMemberRole] = useState('member');

  // Fetch SaaS groups
  const {
    data: groupsData,
    isLoading,
    error
  } = useQuery<SaasGroupsResponse>({
    queryKey: ['/api/saas/groups']
  });

  // Fetch todos os usuários para adicionar como membros (usando endpoint de SaaS Admin)
  const {
    data: allUsersData,
    isLoading: allUsersLoading,
  } = useQuery<UsersResponse>({
    queryKey: ['/api/saas-admin/users'],
    enabled: isMemberDialogOpen,
  });

  // Update selected group members when group changes
  useEffect(() => {
    if (selectedGroup) {
      const memberIds = selectedGroup.memberships?.map(m => m.userId) || [];
      setSelectedGroupMembers(memberIds);
    }
  }, [selectedGroup]);

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiRequest('POST', '/api/saas/groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas/groups'] });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
      toast({
        title: 'Sucesso',
        description: 'Grupo SaaS criado com sucesso'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar grupo SaaS',
        variant: 'destructive'
      });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
      apiRequest('PUT', `/api/saas/groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas/groups'] });
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
      setFormData({ name: '', description: '' });
      toast({
        title: 'Sucesso',
        description: 'Grupo SaaS atualizado com sucesso'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar grupo SaaS',
        variant: 'destructive'
      });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/saas/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas/groups'] });
      toast({
        title: 'Sucesso',
        description: 'Grupo SaaS excluído com sucesso'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir grupo SaaS',
        variant: 'destructive'
      });
    }
  });

  // Add member mutation - agora suporta múltiplos membros
  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userIds, role }: { groupId: string; userIds: string[]; role: string }) =>
      apiRequest('POST', `/api/saas/groups/${groupId}/members/bulk`, { userIds, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas/groups'] });
      setIsMemberDialogOpen(false);
      setSelectedGroupMembers([]);
      setMemberRole('member');
      toast({
        title: 'Sucesso',
        description: 'Membros adicionados ao grupo SaaS com sucesso'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar membros ao grupo SaaS',
        variant: 'destructive'
      });
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      apiRequest('DELETE', `/api/saas/groups/${groupId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas/groups'] });
      toast({
        title: 'Sucesso',
        description: 'Membro removido do grupo SaaS'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover membro do grupo SaaS',
        variant: 'destructive'
      });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate(formData);
  };

  const handleEditClick = (group: SaasGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    updateGroupMutation.mutate({
      id: selectedGroup.id,
      data: formData
    });
  };

  const handleAddMemberClick = (group: SaasGroup) => {
    setSelectedGroup(group);
    setIsMemberDialogOpen(true);
  };

  const handleCloseMemberDialog = () => {
    setIsMemberDialogOpen(false);
    setSelectedGroup(null);
    setSelectedGroupMembers([]);
    setMemberRole('member');
  };

  const handleAddMembers = () => {
    if (!selectedGroup) return;
    
    const currentMemberIds = selectedGroup.memberships?.map(m => m.userId) || [];
    const newMemberIds = selectedGroupMembers.filter(id => !currentMemberIds.includes(id));
    
    if (newMemberIds.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum novo membro foi selecionado",
        variant: "destructive",
      });
      return;
    }
    
    addMemberMutation.mutate({
      groupId: selectedGroup.id,
      userIds: newMemberIds,
      role: memberRole,
    });
  };

  const handleMemberToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroupMembers(prev => [...prev, userId]);
    } else {
      setSelectedGroupMembers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleRemoveMember = (groupId: string, userId: string) => {
    removeMemberMutation.mutate({ groupId, userId });
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este grupo SaaS?')) {
      deleteGroupMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando grupos SaaS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-destructive">Erro ao carregar grupos SaaS</div>
      </div>
    );
  }

  const groups = groupsData?.groups || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grupos SaaS</h2>
          <p className="text-muted-foreground">
            Gerencie grupos globais disponíveis para todos os tenants
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-saas-group">
              <Plus className="mr-2 h-4 w-4" />
              Novo Grupo SaaS
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo SaaS</DialogTitle>
              <DialogDescription>
                Crie um novo grupo global gerenciado pelo SaaS Admin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Grupo</Label>
                  <Input
                    id="name"
                    data-testid="input-group-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    data-testid="input-group-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createGroupMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo SaaS encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando seu primeiro grupo global SaaS
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} data-testid={`card-saas-group-${group.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Badge variant="secondary" data-testid={`badge-member-count-${group.id}`}>
                    {group.memberCount} membros
                  </Badge>
                </div>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {group.memberships.slice(0, 3).map((membership) => (
                    <Badge key={membership.id} variant="outline">
                      {membership.userId} ({membership.role})
                    </Badge>
                  ))}
                  {group.memberships.length > 3 && (
                    <Badge variant="outline">+{group.memberships.length - 3} mais</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(group)}
                    data-testid={`button-edit-${group.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMemberClick(group)}
                    data-testid={`button-add-member-${group.id}`}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteGroup(group.id)}
                    data-testid={`button-delete-${group.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Members List */}
                {group.memberships.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">Membros:</Label>
                    {group.memberships.map((membership) => (
                      <div 
                        key={membership.id} 
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{membership.userId} - {membership.role}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(group.id, membership.userId)}
                          data-testid={`button-remove-member-${membership.id}`}
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo SaaS</DialogTitle>
            <DialogDescription>
              Atualize as informações do grupo SaaS
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Grupo</Label>
                <Input
                  id="edit-name"
                  data-testid="input-edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  data-testid="input-edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateGroupMutation.isPending}
                data-testid="button-submit-edit"
              >
                {updateGroupMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog - Múltipla Seleção */}
      <Dialog open={isMemberDialogOpen} onOpenChange={handleCloseMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Membros ao Grupo SaaS</DialogTitle>
            <DialogDescription>
              Selecione usuários para adicionar ao grupo "{selectedGroup?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seletor de função para todos os membros */}
            <div>
              <Label htmlFor="memberRole">Função para os membros selecionados</Label>
              <Select value={memberRole} onValueChange={setMemberRole}>
                <SelectTrigger data-testid="select-member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {allUsersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando usuários...</span>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {(allUsersData?.users || allUsersData?.members || []).map((user: UserForGroup) => {
                    const isInGroup = selectedGroupMembers.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isInGroup}
                            onCheckedChange={(checked) =>
                              handleMemberToggle(user.id, checked as boolean)
                            }
                          />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseMemberDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={addMemberMutation.isPending || selectedGroupMembers.length === 0}
              data-testid="button-submit-add-members"
            >
              {addMemberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                `Adicionar ${selectedGroupMembers.filter(id => 
                  !(selectedGroup?.memberships?.map(m => m.userId) || []).includes(id)
                ).length} Membros`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}