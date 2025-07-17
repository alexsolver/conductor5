import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantAdmin?: boolean;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
}

interface CustomRole {
  id: string;
  name: string;
  description?: string;
}

export function CreateUserDialog({ open, onOpenChange, tenantAdmin = false }: CreateUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "agent",
    groupIds: [] as string[],
    customRoleIds: [] as string[],
    sendInvitation: true,
    isActive: true,
  });

  const { data: groupsData } = useQuery<{ groups: UserGroup[] }>({
    queryKey: ["/api/user-management/groups"],
    enabled: open,
  });

  const { data: rolesData } = useQuery<{ roles: CustomRole[] }>({
    queryKey: ["/api/user-management/roles"],
    enabled: open,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/user-management/users", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/stats"] });
      onOpenChange(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "agent",
        groupIds: [],
        customRoleIds: [],
        sendInvitation: true,
        isActive: true,
      });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.userCreated", "Usuário criado com sucesso"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: error.message || t("userManagement.userCreateError", "Erro ao criar usuário"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;
    
    createUserMutation.mutate(formData);
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        groupIds: [...prev.groupIds, groupId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        groupIds: prev.groupIds.filter(id => id !== groupId)
      }));
    }
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        customRoleIds: [...prev.customRoleIds, roleId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customRoleIds: prev.customRoleIds.filter(id => id !== roleId)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("userManagement.createUser", "Criar Usuário")}</DialogTitle>
            <DialogDescription>
              {t("userManagement.createUserDesc", "Adicione um novo usuário à sua organização")}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="py-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{t("userManagement.basicInfo", "Informações Básicas")}</TabsTrigger>
              <TabsTrigger value="permissions">{t("userManagement.permissions", "Permissões")}</TabsTrigger>
              <TabsTrigger value="groups">{t("userManagement.groups", "Grupos")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("userManagement.firstName", "Nome")}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={t("userManagement.firstNamePlaceholder", "João")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("userManagement.lastName", "Sobrenome")}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder={t("userManagement.lastNamePlaceholder", "Silva")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("userManagement.email", "Email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("userManagement.emailPlaceholder", "joao.silva@empresa.com")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("userManagement.phone", "Telefone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t("userManagement.phonePlaceholder", "+55 11 99999-9999")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t("userManagement.systemRole", "Papel do Sistema")} *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">{t("userManagement.roles.customer", "Cliente")}</SelectItem>
                    <SelectItem value="agent">{t("userManagement.roles.agent", "Agente")}</SelectItem>
                    <SelectItem value="tenant_admin">{t("userManagement.roles.tenantAdmin", "Admin do Tenant")}</SelectItem>
                    {!tenantAdmin && (
                      <SelectItem value="saas_admin">{t("userManagement.roles.saasAdmin", "SaaS Admin")}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive">{t("userManagement.accountActive", "Conta ativa")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInvitation"
                  checked={formData.sendInvitation}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendInvitation: !!checked })}
                />
                <Label htmlFor="sendInvitation">{t("userManagement.sendInvitationEmail", "Enviar email de convite")}</Label>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t("userManagement.customRoles", "Papéis Customizados")}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("userManagement.customRolesDesc", "Selecione papéis customizados adicionais para este usuário")}
                </p>
                
                <ScrollArea className="h-48 border rounded-md p-4">
                  {rolesData?.roles?.length ? (
                    <div className="space-y-3">
                      {rolesData.roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={formData.customRoleIds.includes(role.id)}
                            onCheckedChange={(checked) => handleRoleToggle(role.id, !!checked)}
                          />
                          <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{role.name}</div>
                            {role.description && (
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {t("userManagement.noCustomRoles", "Nenhum papel customizado disponível")}
                    </p>
                  )}
                </ScrollArea>
                
                {formData.customRoleIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Papéis selecionados:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.customRoleIds.map((roleId) => {
                        const role = rolesData?.roles?.find(r => r.id === roleId);
                        return role ? (
                          <Badge key={roleId} variant="secondary">
                            {role.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t("userManagement.userGroups", "Grupos de Usuários")}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("userManagement.userGroupsAssignDesc", "Adicione este usuário a grupos da organização")}
                </p>
                
                <ScrollArea className="h-48 border rounded-md p-4">
                  {groupsData?.groups?.length ? (
                    <div className="space-y-3">
                      {groupsData.groups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={formData.groupIds.includes(group.id)}
                            onCheckedChange={(checked) => handleGroupToggle(group.id, !!checked)}
                          />
                          <Label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-muted-foreground">{group.description}</div>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {t("userManagement.noGroups", "Nenhum grupo disponível")}
                    </p>
                  )}
                </ScrollArea>
                
                {formData.groupIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Grupos selecionados:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.groupIds.map((groupId) => {
                        const group = groupsData?.groups?.find(g => g.id === groupId);
                        return group ? (
                          <Badge key={groupId} variant="secondary">
                            {group.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button 
              type="submit" 
              disabled={createUserMutation.isPending || !formData.email.trim()}
            >
              {createUserMutation.isPending 
                ? t("common.creating", "Criando...") 
                : t("common.create", "Criar")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}