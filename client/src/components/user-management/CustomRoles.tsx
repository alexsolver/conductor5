import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  User,
  UserPlus,
  UserMinus,
  Settings,
  Eye,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  isSystem: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
  level: 'workspace' | 'tenant' | 'user';
}

interface RoleAssignment {
  userId: string;
  roleId: string;
  assignedAt: string;
}

const PERMISSION_CATEGORIES = {
  'workspace_admin': 'Administração do Workspace',
  'user_access': 'Gestão de Usuários e Acesso',
  'customer_support': 'Atendimento ao Cliente',
  'customer_management': 'Gestão de Clientes',

  'hr_team': 'Recursos Humanos e Equipe',
  'timecard': 'Timecard e Ponto',
  // 'projects': Completely removed - module eliminated from system
  'analytics': 'Analytics e Relatórios',
  'settings': 'Configurações e Personalização',
  'multilocation': 'Localização e Multilocation',
  'compliance': 'Compliance e Segurança'
};

const PERMISSION_LEVELS = {
  'view': 'Visualizar',
  'create': 'Criar',
  'edit': 'Editar',
  'delete': 'Excluir',
  'manage': 'Administrar',
  'configure': 'Configurar'
};

interface CustomRolesProps {
  tenantAdmin?: boolean;
}

export default function CustomRoles({ tenantAdmin = false }: CustomRolesProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Queries
  // Roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/user-management/roles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-management/roles");
      if (!res.ok) throw new Error("Erro ao buscar permissões");
      const json = await res.json();
      return {
        permissions: Array.isArray(json.permissions) ? json.permissions : [],
      };
    },
    select: (data) => data.permissions,
  });

  // Permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/user-management/permissions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-management/permissions");
      if (!res.ok) throw new Error("Erro ao buscar permissões");
      const json = await res.json();
      return {
        permissions: Array.isArray(json.permissions) ? json.permissions : [],
      };
    },
    select: (data) => data.permissions,
  });

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/user-management/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-management/users");
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const json = await res.json();
      return {
        users: Array.isArray(json.users) ? json.users : [],
      };
    },
    select: (data) => data.users,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/user-management/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/roles'] });
      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
      setSelectedPermissions([]);
      toast({
        title: "Sucesso",
        description: "Permissão criada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar permissão",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest('PUT', `/api/user-management/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/roles'] });
      setEditingRole(null);
      setFormData({ name: "", description: "" });
      setSelectedPermissions([]);
      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiRequest('DELETE', `/api/user-management/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/roles'] });
      toast({
        title: "Sucesso",
        description: "Permissão excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir permissão",
        variant: "destructive",
      });
    },
  });

  const assignUserToRoleMutation = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      apiRequest('POST', `/api/user-management/roles/${roleId}/users`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/roles'] });
      toast({
        title: "Sucesso",
        description: "Usuário atribuído à permissão com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atribuir usuário à permissão",
        variant: "destructive",
      });
    },
  });

  const removeUserFromRoleMutation = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      apiRequest('DELETE', `/api/user-management/roles/${roleId}/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/roles'] });
      toast({
        title: "Sucesso",
        description: "Usuário removido da permissão com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover usuário da permissão",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createRoleMutation.mutate({
      ...formData,
      permissions: selectedPermissions
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingRole) return;
    updateRoleMutation.mutate({
      id: editingRole.id,
      data: {
        ...formData,
        permissions: selectedPermissions
      }
    });
  };

  const handleEditClick = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || ""
    });
    setSelectedPermissions(role.permissions || []);
  };

  const handleDeleteClick = (role: Role) => {
    if (window.confirm(`Tem certeza que deseja excluir a permissão "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingRole(null);
    setFormData({ name: "", description: "" });
    setSelectedPermissions([]);
    setSelectedUsers([]);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleAssignUserToRole = (userId: string) => {
    if (editingRole) {
      assignUserToRoleMutation.mutate({ roleId: editingRole.id, userId });
    }
  };

  const handleRemoveUserFromRole = (userId: string) => {
    if (editingRole) {
      removeUserFromRoleMutation.mutate({ roleId: editingRole.id, userId });
    }
  };

  const groupedPermissions = permissionsData?.reduce((acc: any, permission: Permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Permissões Customizadas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie permissões customizadas e permissões granulares para o workspace
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Permissão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>Criar Nova Permissão</DialogTitle>
                <DialogDescription>
                  Defina uma nova permissão com funcionalidades específicas
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="permissions">Funcionalidades</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Permissão</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Administração de Tickets"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição da permissão e suas responsabilidades"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES] || category}
                          </h4>
                          <div className="space-y-2">
                            {(permissions as Permission[]).map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                                <Label
                                  htmlFor={`perm-${permission.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {permission.name}
                                  {permission.description && (
                                    <span className="text-xs text-muted-foreground block">
                                      {permission.description}
                                    </span>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <Separator />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createRoleMutation.isPending || !formData.name.trim()}>
                  {createRoleMutation.isPending ? "Criando..." : "Criar Permissão"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição com Abas */}
        <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Permissão</DialogTitle>
              <DialogDescription>
                Gerencie informações da permissão, funcionalidades e usuários associados
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="info" className="flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Informações</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Funcionalidades</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Usuários</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba Informações */}
              <TabsContent value="info" className="space-y-4">
                <form onSubmit={handleEditSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome da Permissão</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Administração de Tickets"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Descrição</Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição da permissão e suas responsabilidades"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateRoleMutation.isPending || !formData.name.trim()}>
                      {updateRoleMutation.isPending ? "Atualizando..." : "Atualizar"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Aba Permissões */}
              <TabsContent value="permissions" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">Funcionalidades da Permissão</h4>
                  <Badge variant="outline">
                    {selectedPermissions.length} funcionalidades selecionadas
                  </Badge>
                </div>

                <ScrollArea className="h-96 border rounded-lg p-4">
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES] || category}
                        </h4>
                        <div className="space-y-2">
                          {(permissions as Permission[]).map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-perm-${permission.id}`}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => handlePermissionToggle(permission.id)}
                              />
                              <Label
                                htmlFor={`edit-perm-${permission.id}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {permission.name}
                                {permission.description && (
                                  <span className="text-xs text-muted-foreground block">
                                    {permission.description}
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (editingRole) {
                        updateRoleMutation.mutate({
                          id: editingRole.id,
                          data: { permissions: selectedPermissions }
                        });
                      }
                    }}
                    disabled={updateRoleMutation.isPending}
                  >
                    {updateRoleMutation.isPending ? "Atualizando..." : "Salvar Funcionalidades"}
                  </Button>
                </div>
              </TabsContent>

              {/* Aba Usuários */}
              <TabsContent value="users" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Atribuir Usuários à Permissão</h4>
                    <Badge variant="outline">
                      {editingRole?.userCount || 0} usuários atribuídos
                    </Badge>
                  </div>

                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {Array.isArray(usersData) && usersData.length > 0 ? (
                        usersData.map((user: any) => {
                          const hasRole = false; // TODO: Check if user has this role
                          return (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
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
                                {hasRole ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveUserFromRole(user.id)}
                                    disabled={removeUserFromRoleMutation.isPending}
                                  >
                                    <UserMinus className="h-3 w-3 mr-1" />
                                    Remover
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAssignUserToRole(user.id)}
                                    disabled={assignUserToRoleMutation.isPending}
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
                          <p>Nenhum usuário disponível</p>
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

      {rolesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando permissões...</p>
        </div>
      ) : rolesData?.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma permissão encontrada</h3>
          <p className="text-gray-600 mb-4">
            Comece criando sua primeira permissão customizada
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Permissão
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(rolesData) && rolesData.map((role: Role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>{role.name}</span>
                  </CardTitle>
                  <Badge variant={role.isActive ? "default" : "secondary"}>
                    {role.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                {role.description && (
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Funcionalidades:</span>
                  <Badge variant="outline">
                    {role.permissions?.length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usuários:</span>
                  <Badge variant="outline">
                    {role.userCount || 0}
                  </Badge>
                </div>

                {role.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Permissão do Sistema
                  </Badge>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(role)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  {!role.isSystem && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(role)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}