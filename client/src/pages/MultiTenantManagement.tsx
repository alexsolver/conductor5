import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import MultiTenantInvitations from '@/components/MultiTenantInvitations';
import UserTenantRelationships from '@/components/UserTenantRelationships';
import { 
  Building, 
  Users, 
  Mail, 
  Shield, 
  Activity, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface MultiTenantStats {
  totalTenants: number;
  totalUsers: number;
  totalRelationships: number;
  pendingInvitations: number;
  activeInvitations: number;
  expiredInvitations: number;
  recentActivity: {
    id: string;
    action: string;
    userName: string;
    tenantName: string;
    timestamp: string;
  }[];
}

export default function MultiTenantManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch multi-tenant statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<MultiTenantStats>({
    queryKey: ['/api/multi-tenant/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/multi-tenant/stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'invitation_sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'invitation_accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'relationship_created':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'tenant_accessed':
        return <Activity className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'invitation_sent':
        return 'Convite enviado';
      case 'invitation_accepted':
        return 'Convite aceito';
      case 'relationship_created':
        return 'Relacionamento criado';
      case 'tenant_accessed':
        return 'Tenant acessado';
      default:
        return action;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Gestão Multi-Tenant
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários, convites e relacionamentos entre tenants
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="invitations">Convites</TabsTrigger>
          <TabsTrigger value="relationships">Relacionamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoadingStats ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando estatísticas...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
                    <p className="text-xs text-muted-foreground">Organizações ativas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">Usuários registrados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Relacionamentos</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalRelationships || 0}</div>
                    <p className="text-xs text-muted-foreground">Acessos multi-tenant</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingInvitations || 0}</div>
                    <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                  </CardContent>
                </Card>
              </div>

              {/* Invitation Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Convites</CardTitle>
                  <CardDescription>
                    Distribuição atual dos convites enviados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pendentes: {stats?.pendingInvitations || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Aceitos: {stats?.activeInvitations || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Expirados: {stats?.expiredInvitations || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>
                    Últimas ações realizadas no sistema multi-tenant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.recentActivity?.length ? (
                    <div className="space-y-4">
                      {stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3">
                          {getActivityIcon(activity.action)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {getActionLabel(activity.action)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.userName} - {activity.tenantName}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(activity.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Nenhuma atividade recente</p>
                      <p className="text-sm text-muted-foreground">
                        As atividades multi-tenant aparecerão aqui
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="invitations">
          <MultiTenantInvitations />
        </TabsContent>

        <TabsContent value="relationships">
          <UserTenantRelationships />
        </TabsContent>
      </Tabs>
    </div>
  );
}