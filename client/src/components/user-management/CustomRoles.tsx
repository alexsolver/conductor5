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
  AlertTriangle
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
  'analytics': '[TRANSLATION_NEEDED]',
  'settings': '[TRANSLATION_NEEDED]',
  'multilocation': 'Localização e Multilocation',
  'compliance': 'Compliance e Segurança'
};

const PERMISSION_LEVELS = {
  'view': 'Visualizar',
  'create': '[TRANSLATION_NEEDED]',
  'edit': '[TRANSLATION_NEEDED]',
  'delete': '[TRANSLATION_NEEDED]',
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
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['/api/user-management/roles'],
    select: (data: any) => data?.roles || []
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['/api/user-management/permissions'],
    select: (data: any) => data?.permissions || []
  });

  const { data: usersData } = useQuery({
    queryKey: ['/api/user-management/users'],
    select: (data: any) => data?.users || []
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
        title: '[TRANSLATION_NEEDED]',
        description: "Papel criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
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
        title: '[TRANSLATION_NEEDED]',
        description: "Papel atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiRequest('DELETE', `/api/user-management/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-management/roles'] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Papel excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
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
        title: '[TRANSLATION_NEEDED]',
        description: "Usuário atribuído ao papel com sucesso",
      });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
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
        title: '[TRANSLATION_NEEDED]',
        description: "Usuário removido do papel com sucesso",
      });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
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
    if (window.confirm(`Tem certeza que deseja excluir o papel "${role.name}"?`)) {
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
          <h3 className="text-lg font-medium">Papéis e Permissões</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie papéis customizados e permissões granulares para o workspace
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Papel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>Criar Novo Papel</DialogTitle>
                <DialogDescription>
                  Defina um novo papel com permissões específicas
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="permissions">Permissões</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Papel</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder='[TRANSLATION_NEEDED]'
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição do papel e suas responsabilidades"
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
                  {createRoleMutation.isPending ? "Criando..." : '[TRANSLATION_NEEDED]'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição com Abas */}
        <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Papel</DialogTitle>
              <DialogDescription>
                Gerencie informações do papel, permissões e usuários associados
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
                  <span>Permissões</span>
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
                      <Label htmlFor="edit-name">Nome do Papel</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder='[TRANSLATION_NEEDED]'
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Descrição</Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição do papel e suas responsabilidades"
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
                  <h4 className="text-sm font-medium">Permissões do Papel</h4>
                  <Badge variant="outline">
                    {selectedPermissions.length} permissões selecionadas
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
                    {updateRoleMutation.isPending ? "Atualizando..." : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </TabsContent>

              {/* Aba Usuários */}
              <TabsContent value="users" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Atribuir Usuários ao Papel</h4>
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

      {isLoading ? (
        <div className="text-center py-8">
          Carregando papéis...
        </div>
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
                    {role.isActive ? "Ativo" : "Inativo"}
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
                  <span className="text-muted-foreground">Permissões:</span>
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
                    Papel do Sistema
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