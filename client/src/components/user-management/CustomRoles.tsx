import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Shield, Edit, Trash2, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  category: string;
  resource: string;
  action: string;
  description: string;
}

interface CustomRole {
  id: string;
  name: string;
  description?: string;
  basedOnRole?: string;
  permissions: Array<{ resource: string; action: string; conditions?: Record<string, any> }>;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
}

interface CustomRolesProps {
  tenantAdmin?: boolean;
}

export function CustomRoles({ tenantAdmin = false }: CustomRolesProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basedOnRole: "",
    permissions: [] as Array<{ resource: string; action: string }>
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery<{ roles: CustomRole[] }>({
    queryKey: ["/api/user-management/roles", { includeSystem: true }],
  });

  const { data: permissionsData } = useQuery<{ permissions: Permission[] }>({
    queryKey: ["/api/user-management/permissions"],
  });

  const { data: systemRolesData } = useQuery<{ roles: Array<{ name: string; displayName: string; description: string }> }>({
    queryKey: ["/api/user-management/system-roles"],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; basedOnRole?: string; permissions: Array<{ resource: string; action: string }> }) => {
      return apiRequest("/api/user-management/roles", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/roles"] });
      setShowCreateDialog(false);
      setFormData({ name: "", description: "", basedOnRole: "", permissions: [] });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.roleCreated", "Papel customizado criado com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.roleCreateError", "Erro ao criar papel customizado"),
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = (permission: Permission, checked: boolean) => {
    const permissionKey = { resource: permission.resource, action: permission.action };
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionKey]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => 
          !(p.resource === permission.resource && p.action === permission.action)
        )
      }));
    }
  };

  const isPermissionSelected = (permission: Permission) => {
    return formData.permissions.some(p => 
      p.resource === permission.resource && p.action === permission.action
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    createRoleMutation.mutate(formData);
  };

  const groupedPermissions = permissionsData?.permissions?.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("userManagement.customRoles", "Papéis Customizados")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("userManagement.customRolesDesc", "Crie papéis customizados com permissões específicas para sua organização")}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("userManagement.createRole", "Criar Papel")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t("userManagement.createRole", "Criar Papel Customizado")}</DialogTitle>
                <DialogDescription>
                  {t("userManagement.createRoleDesc", "Defina um novo papel com permissões específicas")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("userManagement.roleName", "Nome do Papel")}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t("userManagement.roleNamePlaceholder", "Ex: Supervisor de Suporte")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basedOnRole">{t("userManagement.basedOnRole", "Baseado em")}</Label>
                    <select 
                      id="basedOnRole"
                      value={formData.basedOnRole}
                      onChange={(e) => setFormData({ ...formData, basedOnRole: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">{t("userManagement.selectBaseRole", "Selecionar papel base")}</option>
                      {systemRolesData?.roles?.map((role) => (
                        <option key={role.name} value={role.name}>
                          {role.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{t("userManagement.description", "Descrição")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("userManagement.roleDescriptionPlaceholder", "Descrição do papel e suas responsabilidades")}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("userManagement.permissions", "Permissões")}</Label>
                  <ScrollArea className="h-64 border rounded-md p-4">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="font-semibold text-sm">{category}</h4>
                        <div className="space-y-2 ml-4">
                          {permissions.map((permission) => (
                            <div key={`${permission.resource}-${permission.action}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${permission.resource}-${permission.action}`}
                                checked={isPermissionSelected(permission)}
                                onCheckedChange={(checked) => handlePermissionToggle(permission, !!checked)}
                              />
                              <Label 
                                htmlFor={`${permission.resource}-${permission.action}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                <span className="font-medium">{permission.action}</span> em <span className="text-muted-foreground">{permission.resource}</span>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </ScrollArea>
                  <p className="text-sm text-muted-foreground">
                    {formData.permissions.length} permissões selecionadas
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  {t("common.cancel", "Cancelar")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRoleMutation.isPending || !formData.name.trim()}
                >
                  {createRoleMutation.isPending 
                    ? t("common.creating", "Criando...") 
                    : t("common.create", "Criar")
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rolesLoading ? (
        <div className="text-center py-8">
          {t("common.loading", "Carregando...")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rolesData?.roles?.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {role.isSystem && (
                      <Badge variant="outline">
                        {t("userManagement.systemRole", "Sistema")}
                      </Badge>
                    )}
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive 
                        ? t("userManagement.active", "Ativo")
                        : t("userManagement.inactive", "Inativo")
                      }
                    </Badge>
                  </div>
                </div>
                {role.description && (
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Shield className="mr-1 h-4 w-4" />
                    {role.permissions.length} permissões
                  </div>
                  {role.basedOnRole && (
                    <div className="text-sm text-muted-foreground">
                      Baseado em: {role.basedOnRole}
                    </div>
                  )}
                  {!role.isSystem && (
                    <div className="flex items-center justify-end space-x-1 pt-2">
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rolesData?.roles?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t("userManagement.noCustomRoles", "Nenhum papel customizado foi criado ainda")}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setShowCreateDialog(true)}
            >
              {t("userManagement.createFirstRole", "Criar primeiro papel")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}