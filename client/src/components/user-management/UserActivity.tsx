import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Activity, 
  Search, 
  Filter,
  Calendar,
  User,
  Shield,
  Settings,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserActivityItem {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  performedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  performedByUser?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface UserActivityProps {
  tenantAdmin?: boolean;
}

export function UserActivity({ tenantAdmin = false }: UserActivityProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7");

  const { data: activityData, isLoading } = useQuery<{ activities: UserActivityItem[] }>({
    queryKey: ["/api/user-management/activity", {
      search: searchTerm,
      action: actionFilter !== "all" ? actionFilter : undefined,
      days: parseInt(dateRange)
    }],
  });

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'login': <LogIn className="h-4 w-4" />,
      'logout': <LogOut className="h-4 w-4" />,
      'create': <Plus className="h-4 w-4" />,
      'update': <Edit className="h-4 w-4" />,
      'delete': <Trash2 className="h-4 w-4" />,
      'view': <Eye className="h-4 w-4" />,
      'permission_change': <Shield className="h-4 w-4" />,
      'role_change': <Shield className="h-4 w-4" />,
      'settings_change': <Settings className="h-4 w-4" />,
    };
    return iconMap[action] || <Activity className="h-4 w-4" />;
  };

  const getActionDisplayName = (action: string) => {
    const actionNames: Record<string, string> = {
      'login': 'Login',
      'logout': 'Logout',
      'create': 'Criação',
      'update': 'Atualização',
      'delete': 'Exclusão',
      'view': 'Visualização',
      'permission_change': 'Mudança de Permissão',
      'role_change': 'Mudança de Papel',
      'settings_change': 'Mudança de Configuração',
      'user_create': 'Usuário Criado',
      'user_update': 'Usuário Atualizado',
      'user_delete': 'Usuário Excluído',
      'customer_create': 'Cliente Criado',
      'customer_update': 'Cliente Atualizado',
      'ticket_create': 'Ticket Criado',
      'ticket_update': 'Ticket Atualizado',
      'ticket_assign': 'Ticket Atribuído',
      'ticket_resolve': 'Ticket Resolvido',
    };
    return actionNames[action] || action;
  };

  const getResourceDisplayName = (resource?: string) => {
    if (!resource) return '';
    
    const resourceNames: Record<string, string> = {
      'user': 'Usuário',
      'customer': 'Cliente',
      'ticket': 'Ticket',
      'group': 'Grupo',
      'role': 'Papel',
      'permission': 'Permissão',
      'settings': '[TRANSLATION_NEEDED]',
    };
    return resourceNames[resource] || resource;
  };

  const filteredActivities = activityData?.activities || [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("userManagement.userActivity", "Atividade dos Usuários")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("userManagement.userActivityDesc", "Monitore ações e atividades dos usuários no sistema")}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("userManagement.filters", "Filtros")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("userManagement.searchActivity", "Buscar por usuário, ação ou recurso...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("userManagement.filterByAction", "Filtrar por ação")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("userManagement.allActions", "Todas as ações")}</SelectItem>
                <SelectItem value="login">{t("userManagement.loginActions", "Login/Logout")}</SelectItem>
                <SelectItem value="create">{t("userManagement.createActions", "Criações")}</SelectItem>
                <SelectItem value="update">{t("userManagement.updateActions", "Atualizações")}</SelectItem>
                <SelectItem value="delete">{t("userManagement.deleteActions", "Exclusões")}</SelectItem>
                <SelectItem value="permission_change">{t("userManagement.permissionActions", "Mudanças de Permissão")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t("userManagement.last24h", "Últimas 24h")}</SelectItem>
                <SelectItem value="7">{t("userManagement.last7days", "Últimos 7 dias")}</SelectItem>
                <SelectItem value="30">{t("userManagement.last30days", "Últimos 30 dias")}</SelectItem>
                <SelectItem value="90">{t("userManagement.last90days", "Últimos 90 dias")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>{t("userManagement.activityLog", "Log de Atividades")}</CardTitle>
          <CardDescription>
            {t("userManagement.activityLogDesc", "Histórico detalhado de ações realizadas no sistema")}
          </CardDescription>
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
                  <TableHead>{t("userManagement.user", "Usuário")}</TableHead>
                  <TableHead>{t("userManagement.action", "Ação")}</TableHead>
                  <TableHead>{t("userManagement.resource", "Recurso")}</TableHead>
                  <TableHead>{t("userManagement.status", "Status")}</TableHead>
                  <TableHead>{t("userManagement.ipAddress", "IP")}</TableHead>
                  <TableHead>{t("userManagement.performedAt", "Data/Hora")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {activity.user 
                              ? `${activity.user.firstName || ''} ${activity.user.lastName || ''".trim() || activity.user.email
                              : t("userManagement.unknownUser", "Usuário desconhecido")
                            }
                          </div>
                          {activity.performedByUser && activity.performedByUser.email !== activity.user?.email && (
                            <div className="text-xs text-muted-foreground">
                              por {`${activity.performedByUser.firstName || ''} ${activity.performedByUser.lastName || ''".trim() || activity.performedByUser.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(activity.action)}
                        <span>{getActionDisplayName(activity.action)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {activity.resource && (
                          <span className="font-medium">
                            {getResourceDisplayName(activity.resource)}
                          </span>
                        )}
                        {activity.resourceId && (
                          <div className="text-xs text-muted-foreground">
                            ID: {activity.resourceId.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activity.success ? "default" : "destructive">
                        {activity.success 
                          ? t("userManagement.success", "Sucesso")
                          : t("userManagement.failed", "Falha")
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.ipAddress || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(activity.performedAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredActivities.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || actionFilter !== "all" 
                  ? t("userManagement.noActivityMatch", "Nenhuma atividade encontrada com os filtros aplicados")
                  : t("userManagement.noActivity", "Nenhuma atividade registrada")
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Summary */}
      {filteredActivities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredActivities.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.totalActivities", "Total de Atividades")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {filteredActivities.filter(a => a.success).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.successfulActivities", "Atividades Bem-sucedidas")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {filteredActivities.filter(a => !a.success).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.failedActivities", "Atividades com Falha")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}