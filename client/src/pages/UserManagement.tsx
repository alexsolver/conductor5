import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Activity, 
  UserCheck,
  AlertTriangle,
  Clock,
  Monitor
} from "lucide-react";
import { UserList } from "@/components/user-management/UserList";
import { UserGroups } from "@/components/user-management/UserGroups";
import { SaasGroups } from "@/components/user-management/SaasGroups";
import CustomRoles from "@/components/user-management/CustomRoles";
import { UserInvitations } from "@/components/user-management/UserInvitations";
import { UserActivity } from "@/components/user-management/UserActivity";
import { UserSessions } from "@/components/user-management/UserSessions";
import { CreateUserDialog } from "@/components/user-management/CreateUserDialog";
import { InviteUserDialog } from "@/components/user-management/InviteUserDialog";
import { apiRequest } from "@/lib/queryClient";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingInvitations: number;
  activeSessions: number;
  roleDistribution: Record<string, number>;
}

export function UserManagement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);

  // Check if this is SaaS Admin page (global user management)
  const isSaasAdmin = location.includes('/saas-admin/user-management');
  
  // Fetch user management statistics
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: UserStats }>({
    queryKey: isSaasAdmin ? ["/api/saas-admin/users/stats"] : ["/api/user-management/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const userStats = stats?.stats;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {isSaasAdmin 
              ? t("userManagement.saasAdmin.title", "Gestão Global de Usuários")
              : t("userManagement.title", "Gestão de Usuários")
            }
          </h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowInviteUser(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("userManagement.inviteUser", "Convidar Usuário")}
            </Button>
            <Button onClick={() => setShowCreateUser(true)}>
              <Users className="mr-2 h-4 w-4" />
              {t("userManagement.createUser", "Criar Usuário")}
            </Button>
          </div>
        </div>

        {/* SaaS Admin Indicator */}
        {isSaasAdmin && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">
                {t("userManagement.saasAdmin.indicator", "Administração Global")}
              </h3>
            </div>
            <p className="text-purple-700 text-sm mt-1">
              {t("userManagement.saasAdmin.warning", "Você está visualizando dados de todas as tenants da plataforma")}
            </p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("userManagement.stats.totalUsers", "Total de Usuários")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : userStats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.stats.totalUsersDesc", "Usuários registrados")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("userManagement.stats.activeUsers", "Usuários Ativos")}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? "..." : userStats?.activeUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.stats.activeUsersDesc", "Contas ativas")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("userManagement.stats.pendingInvitations", "Convites Pendentes")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statsLoading ? "..." : userStats?.pendingInvitations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.stats.pendingInvitationsDesc", "Aguardando resposta")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("userManagement.stats.activeSessions", "Sessões Ativas")}
              </CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statsLoading ? "..." : userStats?.activeSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.stats.activeSessionsDesc", "Usuários conectados")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        {userStats?.roleDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("userManagement.roleDistribution", "Distribuição de Papéis")}
              </CardTitle>
              <CardDescription>
                {t("userManagement.roleDistributionDesc", "Quantidade de usuários por papel no sistema")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(userStats.roleDistribution).map(([role, count]) => (
                  <Badge key={role} variant="secondary" className="px-3 py-1">
                    {role}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.users", "Usuários")}
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.groups", "Grupos")}
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.roles", "Papéis")}
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <UserPlus className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.invitations", "Convites")}
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Monitor className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.sessions", "Sessões")}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.activity", "Atividade")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {isSaasAdmin ? (
              <div className="text-center p-8">
                <h3 className="text-lg font-semibold mb-2">
                  {t("userManagement.saasAdmin.globalUsers", "Gestão Global de Usuários")}
                </h3>
                <p className="text-muted-foreground">
                  {t("userManagement.saasAdmin.description", "Visualização e gestão de usuários em todas as tenants da plataforma")}
                </p>
              </div>
            ) : null}
            <UserList />
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            {isSaasAdmin ? <SaasGroups /> : <UserGroups />}
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <CustomRoles />
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <UserInvitations />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <UserSessions />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <UserActivity />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateUserDialog 
          open={showCreateUser} 
          onOpenChange={setShowCreateUser}
        />
        <InviteUserDialog 
          open={showInviteUser} 
          onOpenChange={setShowInviteUser}
        />
      </div>
  );
}