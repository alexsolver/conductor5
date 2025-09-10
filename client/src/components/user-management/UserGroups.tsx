import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  User, 
  UserPlus, 
  UserMinus, 
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  memberships?: Array<{ id: string; userId: string; role: string }>;
  memberCount: number;
}

interface TeamMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  position?: string;
}

interface UserGroupsProps {
  tenantAdmin?: boolean;
}

export function UserGroups({ tenantAdmin = false }: UserGroupsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados principais
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  // Estados para gerenciamento de membros
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isUpdatingMemberships, setIsUpdatingMemberships] = useState(false);

  // Estados para adicionar membro via card
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<UserGroup | null>(null);

  // Query para buscar grupos com tratamento de erro
  const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups, error: groupsError } = useQuery<{ groups: UserGroup[] }>({
    queryKey: ["/api/user-management/groups"],
    refetchInterval: 30000,
    staleTime: 5000,
    placeholderData: { groups: [] },
    retry: 2,
    retryDelay: 1000,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user-management/groups");
        if (!res.ok) {
          console.warn("API user-management/groups returned error:", res.status);
          return { groups: [] }; // Retorna array vazio em caso de erro
        }
        const json = await res.json();
        return {
          groups: Array.isArray(json.groups)
            ? json.groups.filter(Boolean).map((group: any) => ({
                ...group,
                id: group.id || '',
                name: group.name || 'Grupo sem nome',
                description: group.description || '',
                memberCount: group.memberCount || 0,
                isActive: group.isActive !== false,
              }))
            : [],
        };
      } catch (error) {
        console.warn("Error fetching groups:", error);
        return { groups: [] }; // Retorna array vazio em caso de erro
      }
    },
  });


  // Query para buscar membros da equipe - usando API que funciona
  const { data: teamMembersData, isLoading: teamMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/user-management/users"],
    enabled: !!editingGroup,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-management/users");
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const json = await res.json();
      return Array.isArray(json.users) ? json.users : [];
    },
  });

  // Query para buscar todos os usuários para o diálogo de adicionar membro
  const { data: allUsersData, isLoading: allUsersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/user-management/users", "all"],
    enabled: showAddMemberDialog,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-management/users");
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const json = await res.json();
      return Array.isArray(json.users) ? json.users : [];
    },
  });

  // Query para buscar membros do grupo selecionado para adicionar
  const { data: selectedGroupMembers } = useQuery({
    queryKey: ["/api/user-management/groups", selectedGroupForMember?.id, "members"],
    enabled: !!selectedGroupForMember?.id && showAddMemberDialog,
    refetchOnWindowFocus: false,
    staleTime: 10000,
    select: (data: any) => {
      if (data && Array.isArray(data.members)) {
        return data.members.map((member: any) => member.userId);
      }
      return [];
    }
  });

  // Query para buscar membros do grupo atual
  const { data: currentGroupMembers, refetch: refetchCurrentGroupMembers } = useQuery({
    queryKey: ["/api/user-management/groups", editingGroup?.id, "members"],
    enabled: !!editingGroup?.id,
    refetchOnWindowFocus: false, // Evitar refetch desnecessário
    staleTime: 10000, // Cache por 10 segundos
    select: (data: any) => {
      if (data && Array.isArray(data.members)) {
        return data.members.map((member: any) => member.userId);
      }
      return [];
    }
  });

  // Mutation para criar grupo
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest('POST', '/api/user-management/groups', data);
      const json = await res.json();
      return json;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ groups: UserGroup[] }>(
        ["/api/user-management/groups"],
        (old) => {
          if (!old) return { groups: [data.group] }; // se não existe cache, cria
          return { groups: [...old.groups, data.group] }; // adiciona novo grupo
        }
      );
      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
      toast({
        title: "Grupo criado",
        description: "Grupo criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar grupo",
        description: error?.message || "Falha ao criar grupo",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar grupo
  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string }) => {
      const res = await apiRequest('PUT', `/api/user-management/groups/${data.id}`, {
        name: data.name,
        description: data.description
      });
      const json = await res.json();
      return json;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ groups: UserGroup[] }>(
        ["/api/user-management/groups"],
        (old) => {
          if (!old) return { groups: [data.group] };
          return {
            groups: old.groups.map((g) =>
              g.id === data.group.id ? { ...g, ...data.group } : g
            ),
          };
        }
      );
      setEditingGroup(null);
      setFormData({ name: "", description: "" });
      toast({
        title: "Grupo atualizado",
        description: "Grupo atualizado com sucesso!",
      });
    },
  });

  // Mutation para deletar grupo
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest('DELETE', `/api/user-management/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/groups"] });
      toast({
        title: "Grupo excluído",
        description: "Grupo excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir grupo",
        description: error?.message || "Falha ao excluir grupo",
        variant: "destructive",
      });
    },
  });

  // Mutation para adicionar usuário ao grupo
  const addUserToGroupMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const response = await apiRequest('POST', `/api/user-management/groups/${groupId}/members`, { userId });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add user to group');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Não fazer refetch imediato para evitar conflito de estado
      setTimeout(() => {
        refetchCurrentGroupMembers();
        refetchGroups();
        queryClient.invalidateQueries({ queryKey: ["/api/user-management/groups"] });
      }, 1000);
      toast({
        title: "Usuário adicionado",
        description: "Usuário adicionado ao grupo com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error("Error adding user to group:", error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erro ao adicionar usuário ao grupo';
      toast({
        title: "Erro ao adicionar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation para remover usuário do grupo
  const removeUserFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const response = await apiRequest('DELETE', `/api/user-management/groups/${groupId}/members/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to remove user from group');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Não fazer refetch imediato para evitar conflito de estado
      setTimeout(() => {
        refetchCurrentGroupMembers();
        refetchGroups();
        queryClient.invalidateQueries({ queryKey: ["/api/user-management/groups"] });
      }, 1000);
      toast({
        title: "Usuário removido",
        description: "Usuário removido do grupo com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error("Error removing user from group:", error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erro ao remover usuário do grupo';
      toast({
        title: "Erro ao remover usuário",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Função para alternar usuário no grupo
  const toggleUserInGroup = async (groupId: string, userId: string, isCurrentlyInGroup: boolean) => {
    try {
      if (isCurrentlyInGroup) {
        await removeUserFromGroupMutation.mutateAsync({ groupId, userId });
      } else {
        await addUserToGroupMutation.mutateAsync({ groupId, userId });
      }
    } catch (error: any) {
      console.error("Error toggling user in group:", error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erro ao alterar usuário no grupo';
      toast({
        title: "Erro na operação",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Efeito para sincronizar formulário quando editando
  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name,
        description: editingGroup.description || ""
      });
      setActiveTab("info");
    }
  }, [editingGroup]);

  // Efeito para sincronizar usuários selecionados apenas quando abrir o dialog
  useEffect(() => {
    if (editingGroup && currentGroupMembers && Array.isArray(currentGroupMembers)) {
      setSelectedUsers(currentGroupMembers);
    }
  }, [editingGroup?.id]); // Só executa quando mudar o grupo sendo editado

  // Função para fechar diálogo
  const handleCloseDialog = () => {
    setEditingGroup(null);
    setFormData({ name: "", description: "" });
    setSelectedUsers([]);
  };

  // Função para fechar diálogo de adicionar membro
  const handleCloseAddMemberDialog = () => {
    setShowAddMemberDialog(false);
    setSelectedGroupForMember(null);
  };

  // Função para criar grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(formData);
  };

  // Função para atualizar grupo
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !formData.name.trim()) {
      toast({
        title: "Dados inválidos",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }
    updateGroupMutation.mutate({
      id: editingGroup.id,
      name: formData.name,
      description: formData.description,
    });
  };

  // Function to toggle user membership in group
  const handleToggleUserInGroup = async (userId: string, shouldBeInGroup: boolean) => {
    if (!editingGroup || isUpdatingMemberships) return;

    setIsUpdatingMemberships(true);

    try {
      if (shouldBeInGroup) {
        // Add user to group  
        await addUserToGroupMutation.mutateAsync({
          groupId: editingGroup.id,
          userId: userId
        });
      } else {
        // Remove user from group
        await removeUserFromGroupMutation.mutateAsync({
          groupId: editingGroup.id,
          userId: userId
        });
      }
    } catch (error: any) {
      // Revert local state on error
      if (shouldBeInGroup) {
        setSelectedUsers(prev => prev.filter(id => id !== userId));
      } else {
        setSelectedUsers(prev => [...prev, userId]);
      }
      
      const errorMessage = error?.message || 'Erro na operação';
      toast({
        title: "Erro na operação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMemberships(false);
    }
  };

  // Função para salvar alterações nos membros do grupo
  const handleSaveMembershipChanges = async () => {
    if (!editingGroup) return;

    setIsUpdatingMemberships(true);

    try {
      // Buscar membros atuais do grupo
      const membersResponse = await apiRequest('GET', `/api/user-management/groups/${editingGroup.id}/members`);
      const currentMembersData = await membersResponse.json();
      const currentMemberIds = currentMembersData.members?.map((m: any) => m.userId) || [];

      // Determinar usuários para adicionar e remover
      const usersToAdd = selectedUsers.filter(userId => !currentMemberIds.includes(userId));
      const usersToRemove = currentMemberIds.filter((userId: string) => !selectedUsers.includes(userId));

      // Executar operações sequencialmente para melhor controle de erro
      for (const userId of usersToAdd) {
        await addUserToGroupMutation.mutateAsync({ groupId: editingGroup.id, userId });
      }

      for (const userId of usersToRemove) {
        await removeUserFromGroupMutation.mutateAsync({ groupId: editingGroup.id, userId });
      }

      toast({
        title: "Sucesso",
        description: "Membros do grupo atualizados com sucesso",
      });

      refetchGroups();
    } catch (error: any) {
      console.error("Error updating group memberships:", error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erro ao atualizar membros do grupo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMemberships(false);
    }
  };

  // Função para confirmar exclusão
  const handleDeleteGroup = (group: UserGroup) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  const groups = groupsData?.groups || [];

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('userGroups.loadingGroups')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('userGroups.title')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('userGroups.description')}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
{t('userGroups.createGroup')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('userGroups.createNewGroup')}</DialogTitle>
              <DialogDescription>
                {t('userGroups.createNewGroupDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('userGroups.groupName')}</Label>
                <Input
                  id="name"
                  placeholder="Ex: Suporte Técnico"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('userGroups.groupDescription')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('userGroups.groupDescriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createGroupMutation.isPending || !formData.name.trim()}
                >
                  {createGroupMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('userGroups.creating')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('common.create')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(groupsData?.groups || []).length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('userGroups.noGroupsFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('userGroups.noGroupsDescription')}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('userGroups.createFirstGroup')}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          (groupsData?.groups || []).filter(Boolean).map((group: UserGroup) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{group?.name || 'Grupo sem nome'}</CardTitle>
                    {group?.description && (
                      <CardDescription className="mt-1 text-sm">
                        {group.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={group?.isActive ? "default" : "secondary"}>
                    {group?.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{group?.memberCount || group?.memberships?.length || 0} {t('userGroups.members')}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedGroupForMember(group);
                        setShowAddMemberDialog(true);
                      }}
                      title="Adicionar membro"
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => group && setEditingGroup(group)}
                      title="Editar grupo"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => group && handleDeleteGroup(group)}
                      disabled={deleteGroupMutation.isPending}
                      title="Excluir grupo"
                    >
                      {deleteGroupMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Adicionar Membro */}
      <Dialog open={showAddMemberDialog} onOpenChange={handleCloseAddMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Grupo</DialogTitle>
            <DialogDescription>
              Selecione um usuário para adicionar ao grupo "{selectedGroupForMember?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {allUsersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando usuários...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {(allUsersData || [])
                  .filter(user => !selectedGroupMembers?.includes(user.id))
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                        {user.role && (
                          <div className="text-xs text-gray-500">{user.role}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedGroupForMember) {
                            addUserToGroupMutation.mutate({
                              groupId: selectedGroupForMember.id,
                              userId: user.id
                            });
                            handleCloseAddMemberDialog();
                          }
                        }}
                        disabled={addUserToGroupMutation.isPending}
                      >
                        {addUserToGroupMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Adicionar
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                {(allUsersData || []).filter(user => !selectedGroupMembers?.includes(user.id)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Todos os usuários já são membros deste grupo
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={!!editingGroup} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('userGroups.editGroupTitle')}: {editingGroup?.name}</DialogTitle>
            <DialogDescription>
              Gerencie as informações e membros do grupo
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="members">
                {t('userGroups.members')} ({editingGroup?.memberCount || editingGroup?.memberships?.length || selectedUsers.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('userGroups.groupName')}</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">{t('userGroups.groupDescription')}</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateGroupMutation.isPending || !formData.name.trim()}
                  >
                    {updateGroupMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('userGroups.updating')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('common.save')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Gerenciar Membros</h4>
                  <Badge variant="outline">
                    {selectedUsers.length} selecionados
                  </Badge>
                </div>

                {teamMembersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando membros...</span>
                  </div>
                ) : (
                  <ScrollArea className="h-64 border rounded-lg p-4">
                    <div className="space-y-2">
                      {teamMembersData && teamMembersData.length > 0 ? (
                        teamMembersData.map((member) => {
                          const isInGroup = selectedUsers.includes(member.id);
                          return (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div 
                                className="flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  id={`member-checkbox-${member.id}`}
                                  checked={isInGroup}
                                  onCheckedChange={(checked) => {
                                    if (!isUpdatingMemberships) {
                                      // Update local state immediately
                                      const newCheckedState = !!checked;
                                      if (newCheckedState && !selectedUsers.includes(member.id)) {
                                        setSelectedUsers(prev => [...prev, member.id]);
                                      } else if (!newCheckedState && selectedUsers.includes(member.id)) {
                                        setSelectedUsers(prev => prev.filter(id => id !== member.id));
                                      }
                                      // Then make API call
                                      handleToggleUserInGroup(member.id, newCheckedState);
                                    }
                                  }}
                                  disabled={isUpdatingMemberships}
                                />
                              </div>
                              <div className="flex-1 min-w-0 ml-2">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium truncate">{member.name}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {member.email} {member.position && `• ${member.position}`}
                                </p>
                              </div>
                              {isInGroup && (
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            Nenhum membro da equipe encontrado
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    <X className="h-4 w-4 mr-2" />
                    Fechar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}