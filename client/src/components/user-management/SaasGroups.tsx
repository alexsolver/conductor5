import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export function SaasGroups() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SaasGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [memberData, setMemberData] = useState({
    userId: '',
    role: 'member'
  });

  // Fetch SaaS groups
  const {
    data: groupsData,
    isLoading,
    error
  } = useQuery<SaasGroupsResponse>({
    queryKey: ['/api/saas/groups']
  });

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

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: { userId: string; role: string } }) =>
      apiRequest('POST', `/api/saas/groups/${groupId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saas/groups'] });
      setIsMemberDialogOpen(false);
      setMemberData({ userId: '', role: 'member' });
      toast({
        title: 'Sucesso',
        description: 'Membro adicionado ao grupo SaaS'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar membro ao grupo SaaS',
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

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    addMemberMutation.mutate({
      groupId: selectedGroup.id,
      data: memberData
    });
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

      {/* Add Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Grupo SaaS</DialogTitle>
            <DialogDescription>
              Adicione um usuário ao grupo {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMemberSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId">ID do Usuário</Label>
                <Input
                  id="userId"
                  data-testid="input-member-userId"
                  value={memberData.userId}
                  onChange={(e) => setMemberData({ ...memberData, userId: e.target.value })}
                  placeholder="UUID do usuário"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Função</Label>
                <Select 
                  value={memberData.role} 
                  onValueChange={(value) => setMemberData({ ...memberData, role: value })}
                >
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
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMemberDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={addMemberMutation.isPending}
                data-testid="button-submit-add-member"
              >
                {addMemberMutation.isPending ? 'Adicionando...' : 'Adicionar Membro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}