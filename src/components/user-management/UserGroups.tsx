import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Plus, Users, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../hooks/use-toast";

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

  const { data: groupsData, isLoading } = useQuery<{ groups: UserGroup[] }>({
    queryKey: ["/api/user-management/groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest("/api/user-management/groups", {
        method: "POST",
        body: data
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    createGroupMutation.mutate(formData);
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
            <form onSubmit={handleSubmit}>
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
                  onClick={() => setShowCreateDialog(false)}
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
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
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