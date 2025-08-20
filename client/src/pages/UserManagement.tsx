import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);

  // Fetch user management statistics
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: UserStats }>({
    queryKey: ["/api/user-management/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const userStats = stats?.stats;

  return (
    <div className="p-4"
        <div className="p-4"
          <h2 className="p-4"
            {t("userManagement.title", "Gestão de Usuários")}
          </h2>
          <div className="p-4"
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

        {/* Statistics Cards */}
        <div className="p-4"
          <Card>
            <CardHeader className="p-4"
              <CardTitle className="p-4"
                {t("userManagement.stats.totalUsers", "Total de Usuários")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="p-4"
                {statsLoading ? "..." : userStats?.totalUsers || 0}
              </div>
              <p className="p-4"
                {t("userManagement.stats.totalUsersDesc", "Usuários registrados")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4"
              <CardTitle className="p-4"
                {t("userManagement.stats.activeUsers", "Usuários Ativos")}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="p-4"
                {statsLoading ? "..." : userStats?.activeUsers || 0}
              </div>
              <p className="p-4"
                {t("userManagement.stats.activeUsersDesc", "Contas ativas")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4"
              <CardTitle className="p-4"
                {t("userManagement.stats.pendingInvitations", "Convites Pendentes")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="p-4"
                {statsLoading ? "..." : userStats?.pendingInvitations || 0}
              </div>
              <p className="p-4"
                {t("userManagement.stats.pendingInvitationsDesc", "Aguardando resposta")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4"
              <CardTitle className="p-4"
                {t("userManagement.stats.activeSessions", "Sessões Ativas")}
              </CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="p-4"
                {statsLoading ? "..." : userStats?.activeSessions || 0}
              </div>
              <p className="p-4"
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
              <div className="p-4"
                {Object.entries(userStats.roleDistribution).map(([role, count]) => (
                  <Badge key={role} variant="secondary" className="p-4"
                    {role}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="p-4"
          <TabsList>
            <TabsTrigger value="users>
              <Users className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.users", "Usuários")}
            </TabsTrigger>
            <TabsTrigger value="groups>
              <Users className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.groups", "Grupos")}
            </TabsTrigger>
            <TabsTrigger value="roles>
              <Shield className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.roles", "Papéis")}
            </TabsTrigger>
            <TabsTrigger value="invitations>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.invitations", "Convites")}
            </TabsTrigger>
            <TabsTrigger value="sessions>
              <Monitor className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.sessions", "Sessões")}
            </TabsTrigger>
            <TabsTrigger value="activity>
              <Activity className="mr-2 h-4 w-4" />
              {t("userManagement.tabs.activity", "Atividade")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="p-4"
            <UserList />
          </TabsContent>

          <TabsContent value="groups" className="p-4"
            <UserGroups />
          </TabsContent>

          <TabsContent value="roles" className="p-4"
            <CustomRoles />
          </TabsContent>

          <TabsContent value="invitations" className="p-4"
            <UserInvitations />
          </TabsContent>

          <TabsContent value="sessions" className="p-4"
            <UserSessions />
          </TabsContent>

          <TabsContent value="activity" className="p-4"
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