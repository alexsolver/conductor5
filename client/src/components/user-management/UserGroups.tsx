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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus, 
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  memberships?: Array<{
    id: string;
    userId: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    assignedById: string;
  }>;
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

interface GroupsResponse {
  success: boolean;
  groups: UserGroup[];
  count: number;
}

interface UsersResponse {
  success: boolean;
  members: UserForGroup[];
}

export function UserGroups() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<UserGroup | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Fetch grupos do tenant (não grupos SaaS)
  const {
    data: groupsData,
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
  } = useQuery<GroupsResponse>({
    queryKey: ['/api/user-management/groups'],
  });

  // Fetch todos os usuários para adicionar como membros
  const {
    data: allUsersData,
    isLoading: allUsersLoading,
  } = useQuery<UsersResponse>({
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
      return apiRequest('POST', '/api/user-management/groups', data);
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
      const errorMessage = error?.message || 'Erro ao criar grupo';
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
      return apiRequest('PUT', `/api/user-management/groups/${data.id}`, data);
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
      const errorMessage = error?.message || 'Erro ao atualizar grupo';
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
      return apiRequest('DELETE', `/api/user-management/groups/${groupId}`);
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
      const errorMessage = error?.message || 'Erro ao excluir grupo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation para adicionar membros - usando rota bulk
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      return apiRequest('POST', `/api/user-management/groups/${groupId}/members/bulk`, { userIds });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Membros adicionados com sucesso",
      });
      setShowAddMemberDialog(false);
      setSelectedGroupForMember(null);
      setSelectedGroupMembers([]);
      refetchGroups();
    },
    onError: (error: any) => {
      console.error("Error adding members:", error);
      const errorMessage = error?.message || 'Erro ao adicionar membros';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (editingGroup) {
      updateGroupMutation.mutate({ ...formData, id: editingGroup.id });
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  const handleDeleteGroup = (group: UserGroup) => {
    if (confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  const handleCloseAddMemberDialog = () => {
    setShowAddMemberDialog(false);
    setSelectedGroupForMember(null);
    setSelectedGroupMembers([]);
  };

  const handleAddMembers = () => {
    console.log("🐛 [TENANT-GROUPS] handleAddMembers called");
    console.log("🐛 [TENANT-GROUPS] selectedGroupForMember:", selectedGroupForMember);
    console.log("🐛 [TENANT-GROUPS] selectedGroupMembers:", selectedGroupMembers);
    
    if (!selectedGroupForMember) {
      console.log("🐛 [TENANT-GROUPS] No group selected, returning early");
      return;
    }
    
    const currentMemberIds = selectedGroupForMember.memberships?.map(m => m.userId) || [];
    const newMemberIds = selectedGroupMembers.filter(id => !currentMemberIds.includes(id));
    
    console.log("🐛 [TENANT-GROUPS] currentMemberIds:", currentMemberIds);
    console.log("🐛 [TENANT-GROUPS] newMemberIds:", newMemberIds);
    
    if (newMemberIds.length === 0) {
      console.log("🐛 [TENANT-GROUPS] No new members selected");
      toast({
        title: "Aviso",
        description: "Nenhum novo membro foi selecionado",
        variant: "destructive",
      });
      return;
    }
    
    console.log("🐛 [TENANT-GROUPS] Calling mutation with:", {
      groupId: selectedGroupForMember.id,
      userIds: newMemberIds,
    });
    
    addMemberMutation.mutate({
      groupId: selectedGroupForMember.id,
      userIds: newMemberIds,
    });
  };

  const handleMemberToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroupMembers(prev => [...prev, userId]);
    } else {
      setSelectedGroupMembers(prev => prev.filter(id => id !== userId));
    }
  };

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando grupos...</span>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Erro ao carregar grupos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Não foi possível carregar os grupos. Tente novamente.
          </p>
          <Button onClick={() => refetchGroups()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const groups = groupsData?.groups || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grupos do Tenant</h2>
          <p className="text-muted-foreground">
            Gerencie grupos de usuários específicos deste tenant
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Grupo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {group.memberCount || 0}
                </Badge>
              </div>
              {group.description && (
                <CardDescription>{group.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
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
                  onClick={() => setEditingGroup(group)}
                  title="Editar grupo"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteGroup(group)}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para criar/editar grupo */}
      <Dialog open={showCreateDialog || !!editingGroup} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingGroup(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar Grupo" : "Criar Novo Grupo"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup ? "Atualize as informações do grupo" : "Insira as informações do novo grupo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Digite o nome do grupo"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Digite uma descrição para o grupo"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingGroup(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
              >
                {createGroupMutation.isPending || updateGroupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingGroup ? "Atualizando..." : "Criando..."}
                  </>
                ) : (
                  editingGroup ? "Atualizar" : "Criar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar membros */}
      <Dialog open={showAddMemberDialog} onOpenChange={handleCloseAddMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Membros ao Grupo</DialogTitle>
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
                  {(allUsersData?.members || []).map((user: UserForGroup) => {
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseAddMemberDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={addMemberMutation.isPending || selectedGroupMembers.length === 0}
            >
              {addMemberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Membros"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}