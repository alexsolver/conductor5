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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Monitor, 
  Search, 
  MoreHorizontal,
  Smartphone,
  Laptop,
  Tablet,
  LogOut,
  MapPin,
  Clock,
  Wifi
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export function UserSessions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sessionsData, isLoading } = useQuery<{ sessions: UserSession[] }>({
    queryKey: ["/api/user-management/sessions", {
      search: searchTerm,
      includeInactive: false
    }],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest(`/api/user-management/sessions/${sessionId}/terminate`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/sessions"] });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.sessionTerminated", "Sessão encerrada com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.sessionTerminateError", "Erro ao encerrar sessão"),
        variant: "destructive",
      });
    },
  });

  const terminateAllUserSessionsMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/user-management/users/${userId}/sessions/terminate-all`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/sessions"] });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.allSessionsTerminated", "Todas as sessões do usuário foram encerradas"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.allSessionsTerminateError", "Erro ao encerrar todas as sessões"),
        variant: "destructive",
      });
    },
  });

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return 'Desktop';
    
    const ua = userAgent.toLowerCase();
    
    // Browser detection
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    
    // OS detection
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    return `${browser} em ${os}`;
  };

  const filteredSessions = sessionsData?.sessions?.filter(session => 
    session.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${session.user?.firstName || ''} ${session.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.ipAddress?.includes(searchTerm) ||
    session.location?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeSessions = filteredSessions.filter(s => s.isActive);
  const uniqueUsers = new Set(activeSessions.map(s => s.userId)).size;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("userManagement.userSessions", "Sessões de Usuários")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("userManagement.userSessionsDesc", "Monitore e gerencie sessões ativas dos usuários")}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {activeSessions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("userManagement.activeSessions", "Sessões Ativas")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {uniqueUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("userManagement.uniqueUsers", "Usuários Únicos")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {filteredSessions.filter(s => 
                new Date(s.lastActivity) > new Date(Date.now() - 5 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("userManagement.recentActivity", "Atividade Recente (5min)")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("userManagement.sessionManagement", "Gerenciamento de Sessões")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("userManagement.searchSessions", "Buscar por usuário, IP ou localização...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("userManagement.activeSessionsList", "Lista de Sessões Ativas")}</CardTitle>
          <CardDescription>
            {t("userManagement.activeSessionsDesc", "Visualize e controle sessões ativas dos usuários")}
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
                  <TableHead>{t("userManagement.device", "Dispositivo")}</TableHead>
                  <TableHead>{t("userManagement.location", "Localização")}</TableHead>
                  <TableHead>{t("userManagement.ipAddress", "Endereço IP")}</TableHead>
                  <TableHead>{t("userManagement.lastActivity", "Última Atividade")}</TableHead>
                  <TableHead>{t("userManagement.duration", "Duração")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Ações")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium">
                            {session.user 
                              ? `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email
                              : t("userManagement.unknownUser", "Usuário desconhecido")
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {session.user?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(session.userAgent)}
                        <div>
                          <div className="text-sm">{getDeviceInfo(session.userAgent)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {session.location || t("userManagement.unknownLocation", "Localização desconhecida")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {session.ipAddress || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Wifi className={`h-3 w-3 ${
                          new Date(session.lastActivity) > new Date(Date.now() - 5 * 60 * 1000)
                            ? 'text-green-500'
                            : 'text-gray-400'
                        }`} />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(session.lastActivity), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(session.createdAt), { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => terminateSessionMutation.mutate(session.id)}
                            className="text-destructive"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {t("userManagement.terminateSession", "Encerrar Sessão")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => terminateAllUserSessionsMutation.mutate(session.userId)}
                            className="text-destructive"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {t("userManagement.terminateAllSessions", "Encerrar Todas as Sessões")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredSessions.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm 
                  ? t("userManagement.noSessionsMatch", "Nenhuma sessão encontrada com os filtros aplicados")
                  : t("userManagement.noActiveSessions", "Nenhuma sessão ativa no momento")
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}