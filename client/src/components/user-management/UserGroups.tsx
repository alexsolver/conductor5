import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Edit, Trash2, User, UserPlus, UserMinus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  memberships?: Array<{ id: string; userId: string; role: string }>;
}

interface UserGroupsProps {
  tenantAdmin?: boolean;
}

export function UserGroups({ tenantAdmin = false }: UserGroupsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: groupsData, isLoading } = useQuery<{ groups: UserGroup[] }>({
    queryKey: ["/api/user-management/groups"],
  });

  // Query para buscar usuários disponíveis
  const { data: usersData } = useQuery({
    queryKey: ["/api/team-management/members"],
    enabled: !!editingGroup,
  });

  // Query para buscar membros do grupo atual
  const { data: groupMembersData } = useQuery({
    queryKey: ["/api/user-management/groups", editingGroup?.id, "members"],
    enabled: !!editingGroup?.id,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest("POST", "/api/user-management/groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/groups"] });
      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.groupCreated", "Grupo criado com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.groupCreateError", "Erro ao criar grupo"),
        variant: "destructive",
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      return apiRequest("PUT", `/api/user-management/groups/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/groups"] });
      setEditingGroup(null);
      setFormData({ name: "", description: "" });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.groupUpdated", "Grupo atualizado com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.groupUpdateError", "Erro ao atualizar grupo"),
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/user-management/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/groups"] });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.groupDeleted", "Grupo excluído com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.groupDeleteError", "Erro ao excluir grupo"),
        variant: "destructive",
      });
    },
  });

  // Mutation to add user to group
  const addUserToGroupMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string, userId: string }) => {
      console.log(`Mutation: Adding user ${userId} to group ${groupId}`);
      const response = await apiRequest('POST', `/api/user-management/groups/${groupId}/members`, { userId });
      console.log('Add user response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('User added successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/groups'] });
      if (editingGroup?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/user-management/groups/${editingGroup.id}/members`] });
      }
      // Refresh the editing group data
      if (editingGroup) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/user-management/groups'] });
        }, 500);
      }
      toast({
        title: "Usuário adicionado",
        description: "Usuário foi adicionado ao grupo com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error adding user to group:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Falha ao adicionar usuário ao grupo.";
      toast({
        title: "Erro ao adicionar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation to remove user from group
  const removeUserFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string, userId: string }) => {
      console.log(`Mutation: Removing user ${userId} from group ${groupId}`);
      const response = await apiRequest('DELETE', `/api/user-management/groups/${groupId}/members/${userId}`);
      console.log('Remove user response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('User removed successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/groups'] });
      if (editingGroup?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/user-management/groups/${editingGroup.id}/members`] });
      }
      // Refresh the editing group data
      if (editingGroup) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/user-management/groups'] });
        }, 500);
      }
      toast({
        title: "Usuário removido",
        description: "Usuário foi removido do grupo com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error removing user from group:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Falha ao remover usuário do grupo.";
      toast({
        title: "Erro ao remover usuário",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createGroupMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingGroup) return;
    updateGroupMutation.mutate({ 
      id: editingGroup.id, 
      data: formData 
    });
  };

  const handleEditClick = (group: UserGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || ""
    });
    // Inicializar usuários selecionados com os membros atuais do grupo
    const currentMemberIds = group.memberships?.map(membership => membership.userId) || [];
    setSelectedUsers(currentMemberIds);
  };

  const handleDeleteClick = (group: UserGroup) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingGroup(null);
    setFormData({ name: "", description: "" });
    setSelectedUsers([]);
  };

  // Funções para gerenciar usuários no grupo
  const handleAddUserToGroup = (userId: string) => {
    if (!editingGroup || !userId) return;
    console.log(`Adding user ${userId} to group ${editingGroup.id}`);
    addUserToGroupMutation.mutate({ groupId: editingGroup.id, userId });
  };

  const handleRemoveUserFromGroup = (userId: string) => {
    if (!editingGroup || !userId) return;
    console.log(`Removing user ${userId} from group ${editingGroup.id}`);
    removeUserFromGroupMutation.mutate({ groupId: editingGroup.id, userId });
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("userManagement.userGroups", "Grupos de Usuários")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("userManagement.userGroupsDesc", "Organize usuários em grupos para facilitar o gerenciamento de permissões")}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("userManagement.createGroup", "Criar Grupo")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>{t("userManagement.createGroup", "Criar Grupo")}</DialogTitle>
                <DialogDescription>
                  {t("userManagement.createGroupDesc", "Crie um novo grupo para organizar usuários")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("userManagement.groupName", "Nome do Grupo")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("userManagement.groupNamePlaceholder", "Ex: Suporte Técnico")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("userManagement.description", "Descrição")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("userManagement.descriptionPlaceholder", "Descrição opcional do grupo")}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                >
                  {t("common.cancel", "Cancelar")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createGroupMutation.isPending || !formData.name.trim()}
                >
                  {createGroupMutation.isPending 
                    ? t("common.creating", "Criando...") 
                    : t("common.create", "Criar")
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição com Abas */}
        <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("userManagement.editGroup", "Editar Grupo")}</DialogTitle>
              <DialogDescription>
                Gerencie as informações do grupo e associe técnicos
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="info" className="flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Informações</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Técnicos</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba Informações */}
              <TabsContent value="info" className="space-y-4">
                <form onSubmit={handleEditSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome do Grupo</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Suporte Técnico"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Descrição</Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição opcional do grupo"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateGroupMutation.isPending || !formData.name.trim()}>
                      {updateGroupMutation.isPending ? "Atualizando..." : "Atualizar"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Aba Técnicos */}
              <TabsContent value="members" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Associar Técnicos ao Grupo</h4>
                    <Badge variant="outline">
                      {editingGroup?.memberships?.length || 0} técnicos associados
                    </Badge>
                  </div>

                  {/* Lista de Usuários Disponíveis */}
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {Array.isArray(usersData) && usersData.length > 0 ? (
                        usersData.map((user: any) => {
                          const isInGroup = editingGroup?.memberships?.some(m => m.userId === user.id);

                          // Criar handlers únicos para cada usuário para evitar conflitos de evento
                          const createAddHandler = (userId: string) => (e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`Adding user ${userId} to group`);
                            handleAddUserToGroup(userId);
                          };

                          const createRemoveHandler = (userId: string) => (e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`Removing user ${userId} from group`);
                            handleRemoveUserFromGroup(userId);
                          };

                          return (
                            <div 
                              key={user.id} 
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-xs">
                                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{user.name || 'Nome não informado'}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                  <p className="text-xs text-gray-400">{user.role || 'Função não informada'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isInGroup ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={createRemoveHandler(user.id)}
                                    disabled={removeUserFromGroupMutation.isPending}
                                  >
                                    <UserMinus className="h-3 w-3 mr-1" />
                                    Remover
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={createAddHandler(user.id)}
                                    disabled={addUserToGroupMutation.isPending}
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Atribuir
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nenhum técnico disponível</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleCloseDialog}>
                      Concluir
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          {t("common.loading", "Carregando...")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupsData?.groups?.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive 
                      ? t("userManagement.active", "Ativo")
                      : t("userManagement.inactive", "Inativo")
                    }
                  </Badge>
                </div>
                {group.description && (
                  <CardDescription className="text-sm">
                    {group.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    {group.memberships?.length || 0} membros
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditClick(group)}
                      title={t("userManagement.editGroup", "Editar Grupo")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClick(group)}
                      title={t("userManagement.deleteGroup", "Excluir Grupo")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {groupsData?.groups?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t("userManagement.noGroups", "Nenhum grupo foi criado ainda")}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setShowCreateDialog(true)}
            >
              {t("userManagement.createFirstGroup", "Criar primeiro grupo")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}