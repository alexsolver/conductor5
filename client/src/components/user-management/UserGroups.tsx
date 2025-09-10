import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
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
  Loader2,
  Globe
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SaasGroups } from "./SaasGroups";

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  memberCount?: number;
  createdAt?: string;
  memberships?: Array<{
    id: string;
    userId: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

interface UserForGroup {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name?: string;
}

interface UserGroupsProps {
  tenantAdmin?: boolean;
}

export function UserGroups({ tenantAdmin = false }: UserGroupsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user is SaaS Admin
  const isSaasAdmin = user?.role === 'saas_admin';

  // Estados principais
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [mainTab, setMainTab] = useState("tenant-groups");

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Estados para adicionar membro
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<UserGroup | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [isUpdatingMemberships, setIsUpdatingMemberships] = useState(false);

  // Fetch grupos
  const { 
    data: groupsData, 
    isLoading: groupsLoading, 
    error: groupsError,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['/api/user-management/groups'],
    enabled: true,
  });

  // Fetch todos os usuários para adicionar aos grupos
  const { 
    data: allUsersData, 
    isLoading: allUsersLoading 
  } = useQuery({
    queryKey: ['/api/user-management/members'],
    enabled: showAddMemberDialog,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!showCreateDialog && !editingGroup) {
      setFormData({ name: "", description: "" });
    }
  }, [showCreateDialog, editingGroup]);

  // Set form data when editing
  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name || "",
        description: editingGroup.description || "",
      });
    }
  }, [editingGroup]);

  // Update selected group members when group changes
  useEffect(() => {
    if (selectedGroupForMember) {
      const memberIds = selectedGroupForMember.memberships?.map(m => m.userId) || [];
      setSelectedGroupMembers(memberIds);
    }
  }, [selectedGroupForMember]);

  // Mutation para criar grupo
  const createGroupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/user-management/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso",
      });
      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
      refetchGroups();
    },
    onError: (error: any) => {
      console.error("Error creating group:", error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erro ao criar grupo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar grupo
  const updateGroupMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      return apiRequest(`/api/user-management/groups/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Grupo atualizado com sucesso",
      });
      setEditingGroup(null);
      setFormData({ name: "", description: "" });
      refetchGroups();
    },
    onError: (error: any) => {
      console.error("Error updating group:", error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erro ao atualizar grupo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar grupo
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest(`/api/user-management/groups/${groupId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso",
      });
      refetchGroups();
    },
    onError: (error: any) => {
      console.error("Error deleting group:", error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erro ao excluir grupo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Função para criar/atualizar grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingGroup) {
      updateGroupMutation.mutate({ ...formData, id: editingGroup.id });
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  // Função para fechar dialog de adicionar membro
  const handleCloseAddMemberDialog = () => {
    setShowAddMemberDialog(false);
    setSelectedGroupForMember(null);
    setSelectedMembers([]);
    setSelectedGroupMembers([]);
  };

  // Função para fechar dialog de edição
  const handleCloseDialog = () => {
    setEditingGroup(null);
    setActiveTab("info");
  };

  // Função para adicionar/remover membro
  const handleToggleMember = (userId: string) => {
    const isCurrentlySelected = selectedGroupMembers.includes(userId);
    
    if (isCurrentlySelected) {
      setSelectedGroupMembers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedGroupMembers(prev => [...prev, userId]);
    }
  };

  // Função para atualizar membros do grupo
  const handleUpdateGroupMemberships = async () => {
    if (!selectedGroupForMember) return;

    setIsUpdatingMemberships(true);

    try {
      await apiRequest(`/api/user-management/groups/${selectedGroupForMember.id}/members`, {
        method: 'PUT',
        body: JSON.stringify({
          userIds: selectedGroupMembers
        }),
      });

      toast({
        title: "Sucesso",
        description: "Membros do grupo atualizados com sucesso",
      });

      handleCloseAddMemberDialog();
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
        <span className="ml-2">Carregando grupos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Grupos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie grupos de usuários do tenant {isSaasAdmin && 'e grupos globais SaaS'}
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className={`grid w-full ${isSaasAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="tenant-groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Grupos do Tenant
          </TabsTrigger>
          {isSaasAdmin && (
            <TabsTrigger value="saas-groups" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Grupos SaaS
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tenant Groups Tab */}
        <TabsContent value="tenant-groups" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium">Grupos do Tenant</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Grupos específicos deste tenant
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Grupo</DialogTitle>
                  <DialogDescription>
                    Crie um novo grupo de usuários para organizar sua equipe
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Grupo</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Suporte Técnico"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descrição do grupo..."
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
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createGroupMutation.isPending || !formData.name.trim()}
                    >
                      {createGroupMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Criar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Grupos do Tenant */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum grupo encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Crie seu primeiro grupo para organizar sua equipe
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Grupo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              groups.filter(Boolean).map((group: UserGroup) => (
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
                        {group?.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{group?.memberCount || group?.memberships?.length || 0} membros</span>
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
        </TabsContent>

        {/* SaaS Groups Tab */}
        {isSaasAdmin && (
          <TabsContent value="saas-groups" className="space-y-6">
            <SaasGroups />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog de Adicionar Membro */}
      <Dialog open={showAddMemberDialog} onOpenChange={handleCloseAddMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Grupo</DialogTitle>
            <DialogDescription>
              Selecione usuários para adicionar ao grupo "{selectedGroupForMember?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {allUsersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando usuários...</span>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {(allUsersData?.members || [])
                    .map((user: UserForGroup) => {
                      const isInGroup = selectedGroupMembers.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={isInGroup}
                              onCheckedChange={() => handleToggleMember(user.id)}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {user.name || `${user.firstName} ${user.lastName}`}
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          {isInGroup && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCloseAddMemberDialog}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateGroupMemberships}
              disabled={isUpdatingMemberships}
            >
              {isUpdatingMemberships ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Grupo */}
      {editingGroup && (
        <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Grupo</DialogTitle>
              <DialogDescription>
                Atualize as informações do grupo "{editingGroup.name}"
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="members">Membros</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome do Grupo</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCloseDialog}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateGroupMutation.isPending || !formData.name.trim()}
                    >
                      {updateGroupMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Membros do Grupo</h4>
                  <Badge variant="secondary">
                    {editingGroup.memberships?.length || 0} membros
                  </Badge>
                </div>

                {(editingGroup.memberships?.length || 0) === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Nenhum membro neste grupo
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        setSelectedGroupForMember(editingGroup);
                        setShowAddMemberDialog(true);
                        setEditingGroup(null);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Membros
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                      {editingGroup.memberships?.map((membership) => (
                        <div
                          key={membership.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">
                                {membership.user ? 
                                  `${membership.user.firstName} ${membership.user.lastName}` : 
                                  'Usuário não encontrado'
                                }
                              </p>
                              <p className="text-xs text-gray-500">
                                {membership.user?.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Implementar remoção de membro específico
                              console.log('Remove member:', membership.userId);
                            }}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    <X className="h-4 w-4 mr-2" />
                    Fechar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}