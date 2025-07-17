import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  UserPlus, 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  Mail, 
  Phone, 
  Edit, 
  Trash2,
  Shield,
  Activity,
  Monitor,
  UserCheck,
  Settings,
  AlertTriangle
} from "lucide-react";
import { UserList } from "@/components/user-management/UserList";
import { UserGroups } from "@/components/user-management/UserGroups";
import { CustomRoles } from "@/components/user-management/CustomRoles";
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

export default function TenantAdminTeam() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);

  // Fetch team/user management statistics (excluding SaaS admin data)
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: UserStats }>({
    queryKey: ["/api/tenant-admin/team/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch team member list (tenant users excluding SaaS admin)
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["/api/tenant-admin/team/members"],
    refetchInterval: 60000, // Refresh every minute
  });

  const userStats = stats?.stats;
  const teamMembers = teamData?.members || [];

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("tenantAdmin.team.title", "Gestão da Equipe")}
        </h2>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowCreateUser(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.createUser", "Criar Usuário")}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowInviteUser(true)}
          >
            <Mail className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.inviteUser", "Convidar Usuário")}
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground">
        {t("tenantAdmin.team.description", "Gerencie membros da equipe, papéis e permissões do seu tenant")}
      </p>

      {/* Team Statistics */}
      {!statsLoading && userStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("tenantAdmin.team.stats.totalUsers", "Total de Usuários")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {t("tenantAdmin.team.stats.totalUsersDesc", "Usuários ativos no tenant")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("tenantAdmin.team.stats.activeUsers", "Usuários Ativos")}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {t("tenantAdmin.team.stats.activeUsersDesc", "Conectados recentemente")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("tenantAdmin.team.stats.pendingInvitations", "Convites Pendentes")}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.pendingInvitations}</div>
              <p className="text-xs text-muted-foreground">
                {t("tenantAdmin.team.stats.pendingInvitationsDesc", "Aguardando resposta")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("tenantAdmin.team.stats.activeSessions", "Sessões Ativas")}
              </CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                {t("tenantAdmin.team.stats.activeSessionsDesc", "Usuários conectados")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Distribution */}
      {!statsLoading && userStats?.roleDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>{t("tenantAdmin.team.roleDistribution", "Distribuição de Papéis")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(userStats.roleDistribution).map(([role, count]) => (
                <Badge key={role} variant="secondary">
                  {role}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Management Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.tabs.members", "Membros")}
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.tabs.groups", "Grupos")}
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.tabs.roles", "Papéis")}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <UserPlus className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.tabs.invitations", "Convites")}
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.tabs.sessions", "Sessões")}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            {t("tenantAdmin.team.tabs.activity", "Atividade")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <UserList tenantAdmin={true} />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <UserGroups tenantAdmin={true} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <CustomRoles tenantAdmin={true} />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <UserInvitations tenantAdmin={true} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <UserSessions tenantAdmin={true} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <UserActivity tenantAdmin={true} />
        </TabsContent>
      </Tabs>

      {/* Performance Overview (Additional Team-Specific Features) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tenantAdmin.team.performance", "Performance da Equipe")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Produtividade Geral</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Satisfação do Cliente</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tempo de Resposta</span>
                <span className="text-sm text-muted-foreground">4.2min</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog 
        open={showCreateUser} 
        onOpenChange={setShowCreateUser}
        tenantAdmin={true}
      />
      <InviteUserDialog 
        open={showInviteUser} 
        onOpenChange={setShowInviteUser}
        tenantAdmin={true}
      />
    </div>
  );
}