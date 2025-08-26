import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreHorizontal, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Shield,
  Users,
  Clock,
  Monitor
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnhancedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  groups?: Array<{ id: string; name: string }>;
  roles?: Array<{ systemRole?: string; name?: string }>;
  permissions?: Array<{
    resource: string;
    action: string;
    granted: boolean;
    source: string;
  }>;
  sessions?: Array<{ id: string; isActive: boolean; lastActivity: string }>;
}

interface UserListProps {
  tenantAdmin?: boolean;
}

export function UserList({ tenantAdmin = false }: UserListProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Fetch users (different endpoint for tenant admin vs saas admin)
  const apiEndpoint = tenantAdmin ? "/api/tenant-admin/users" : "/api/user-management/users";
  const { data: usersData, isLoading } = useQuery<{ users: EnhancedUser[] }>({
    queryKey: [apiEndpoint],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Enhanced user details query
  const { data: userDetails } = useQuery<{ user: EnhancedUser }>({
    queryKey: ["/api/user-management/users", selectedUser?.id, {
      includePermissions: true,
      includeGroups: true,
      includeRoles: true,
      includeSessions: true,
      includeActivity: true
    }],
    enabled: !!selectedUser?.id,
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const endpoint = tenantAdmin ? `/api/tenant-admin/users/${userId}` : `/api/user-management/users/${userId}`;
      return apiRequest(endpoint, {
        method: "PUT",
        body: { isActive: !isActive }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.userStatusUpdated", "Status do usuário atualizado com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.userStatusUpdateError", "Erro ao atualizar status do usuário"),
        variant: "destructive",
      });
    },
  });

  const filteredUsers = usersData?.users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'saas_admin':
        return 'destructive';
      case 'tenant_admin':
        return 'default';
      case 'agent':
        return 'secondary';
      case 'customer':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'saas_admin': 'SaaS Admin',
      'tenant_admin': 'Admin do Tenant',
      'agent': 'Agente',
      'customer': 'Cliente'
    };
    return roleNames[role] || role;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("userManagement.userList", "Lista de Usuários")}</CardTitle>
              <CardDescription>
                {t("userManagement.userListDesc", "Gerencie usuários da sua organização")}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("userManagement.searchUsers", "Buscar usuários...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              {t("common.loading", "Carregando...")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("userManagement.name", "Nome")}</TableHead>
                  <TableHead>{t("userManagement.email", "Email")}</TableHead>
                  <TableHead>{t("userManagement.role", "Papel")}</TableHead>
                  <TableHead>{t("userManagement.status", "Status")}</TableHead>
                  <TableHead>{t("userManagement.lastLogin", "Último Login")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Ações")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : t("userManagement.noName", "Sem nome")
                      }
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive 
                          ? t("userManagement.active", "Ativo")
                          : t("userManagement.inactive", "Inativo")
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin 
                        ? format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : t("userManagement.neverLoggedIn", "Nunca fez login")
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {t("common.actions", "Ações")}
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("common.view", "Visualizar")}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("common.edit", "Editar")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => toggleUserStatus.mutate({ 
                              userId: user.id, 
                              isActive: user.isActive 
                            })}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            {user.isActive 
                              ? t("userManagement.deactivate", "Desativar")
                              : t("userManagement.activate", "Ativar")
                            }
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("userManagement.userDetails", "Detalhes do Usuário")}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {userDetails?.user && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("userManagement.basicInfo", "Informações Básicas")}</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Email:</strong> {userDetails.user.email}</div>
                    <div><strong>Telefone:</strong> {userDetails.user.phone || "Não informado"}</div>
                    <div><strong>Papel:</strong> {getRoleDisplayName(userDetails.user.role)}</div>
                    <div><strong>Status:</strong> {userDetails.user.isActive ? "Ativo" : "Inativo"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("userManagement.accountInfo", "Informações da Conta")}</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Criado em:</strong> {format(new Date(userDetails.user.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                    <div><strong>Último login:</strong> {userDetails.user.lastLogin ? format(new Date(userDetails.user.lastLogin), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Nunca"}</div>
                  </div>
                </div>
              </div>

              {/* Groups */}
              {userDetails.user.groups && userDetails.user.groups.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    {t("userManagement.groups", "Grupos")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userDetails.user.groups.map((group) => (
                      <Badge key={group.id} variant="outline">
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions */}
              {userDetails.user.permissions && userDetails.user.permissions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    {t("userManagement.permissions", "Permissões")}
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Origem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDetails.user.permissions.map((permission, index) => (
                          <TableRow key={index}>
                            <TableCell>{permission.resource}</TableCell>
                            <TableCell>{permission.action}</TableCell>
                            <TableCell>
                              <Badge variant={permission.granted ? "default" : "destructive"}>
                                {permission.granted ? "Permitido" : "Negado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {permission.source}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Active Sessions */}
              {userDetails.user.sessions && userDetails.user.sessions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Monitor className="mr-2 h-4 w-4" />
                    {t("userManagement.activeSessions", "Sessões Ativas")}
                  </h4>
                  <div className="text-sm">
                    {userDetails.user.sessions.filter(s => s.isActive).length} sessões ativas
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}