import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Import user management components from old system
import { UserList } from "@/components/user-management/UserList";
import { UserGroups } from "@/components/user-management/UserGroups";
import CustomRoles from "@/components/user-management/CustomRoles";
import { UserInvitations } from "@/components/user-management/UserInvitations";
import { UserActivity } from "@/components/user-management/UserActivity";
import { UserSessions } from "@/components/user-management/UserSessions";
import { CreateUserDialog } from "@/components/user-management/CreateUserDialog";
import { InviteUserDialog } from "@/components/user-management/InviteUserDialog";
import { EditMemberDialog } from "@/components/user-management/EditMemberDialog";
// Import technical skills component
import TechnicalSkillsTab from "@/components/team-management/TechnicalSkillsTab";
import { 
  Users, 
  UserCheck, 
  UserX,
  Edit,
  Clock, 
  Calendar, 
  Award, 
  TrendingUp, 
  AlertTriangle,
  MapPin,
  Settings,
  BarChart3,
  Target,
  Star,
  UserPlus,
  Filter,
  Search,
  Download,
  Mail,
  Phone,
  Building,
  Briefcase,
  GraduationCap,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Globe,
  Monitor
} from "lucide-react";
import { Link } from "wouter";

export default function TeamManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");

  // Dialog states for user management
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Handle successful user creation
  const handleUserCreated = () => {
    setShowCreateUser(false);
    // Invalidate working queries
    queryClientInstance.invalidateQueries({ queryKey: ['/api/user-management/users'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant-admin/team/stats'] });
    toast({
      title: "Usuário criado",
      description: "O usuário foi criado com sucesso.",
    });
  };

  // Handle successful user invitation
  const handleUserInvited = () => {
    setShowInviteUser(false);
    // Invalidate working queries
    queryClientInstance.invalidateQueries({ queryKey: ['/api/user-management/users'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant-admin/team/stats'] });
    toast({
      title: "Usuário convidado",
      description: "O convite foi enviado com sucesso.",
    });
  };

  // Fetch team members data
  const { data: teamMembersData, isLoading: teamMembersLoading, error: teamMembersError } = useQuery({
    queryKey: ["/api/team/members"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/team/members");
      if (!res.ok) throw new Error("Erro ao buscar membros da equipe");
      return res.json();
    },
    enabled: !!user?.tenantId,
  });

  // Fetch user management data
  const { data: userManagementData, isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ["/api/user-management/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-management/users");
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      return res.json();
    },
    enabled: !!user?.tenantId,
  });

  console.log("TeamManagement - userManagementData:", userManagementData);
  console.log("TeamManagement - membersLoading:", membersLoading);
  console.log("TeamManagement - membersError:", membersError);
  console.log("TeamManagement - teamMembersData:", teamMembersData);
  console.log("TeamManagement - teamMembersLoading:", teamMembersLoading);

  // Get members data from team API first, fallback to user management API
  const membersData = teamMembersData?.members || userManagementData?.users || [];
  const isLoadingMembers = teamMembersLoading || membersLoading;

  console.log("TeamManagement - Final membersData:", membersData);
  console.log("TeamManagement - Final isLoadingMembers:", isLoadingMembers);

  // Create team overview from available data
  const teamOverview = {
    totalMembers: Array.isArray(membersData) ? membersData.length : 0,
    activeMembers: Array.isArray(membersData) ? membersData.filter(m => m.isActive).length : 0,
    departments: Array.isArray(membersData) ? [...new Set(membersData.map(m => m.department).filter(Boolean))].length : 0,
    recentActivity: []
  };
  const overviewLoading = isLoadingMembers;

  // Fetch team stats - using working endpoint  
  const { data: tenantStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/tenant-admin/team/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tenant-admin/team/stats");
      if (!res.ok) throw new Error("Erro ao buscar estatísticas do tenant");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Use tenant stats as team stats
  const teamStats = {
    totalMembers: Array.isArray(membersData) ? membersData.length : 0,
    activeToday: Array.isArray(membersData) ? membersData.filter(m => m.isActive).length : 0,
    pendingApprovals: 0,
    averagePerformance: 85
  };

  // Fetch performance data
  const { data: performanceData } = useQuery({
    queryKey: ['/api/team-management/performance'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/team-management/performance");
      if (!res.ok) throw new Error("Erro ao buscar performance");
      return res.json();
    },
    enabled: false, // Disable until endpoint is implemented
  });

  // Fetch skills matrix
  const { data: skillsMatrix, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/team-management/skills-matrix'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/team-management/skills-matrix");
      if (!res.ok) throw new Error("Erro ao buscar matriz de habilidades");
      return res.json();
    },
    enabled: false, // Disable until endpoint is implemented
  });

  // For backward compatibility
  const tenantMembers = membersData;

  // Fetch groups for filter
  const { data: groupsData } = useQuery({
    queryKey: ['/api/user-management/groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user-management/groups');
      if (!res.ok) throw new Error('Erro ao buscar grupos');
      return res.json(); // esperado: { groups: [...] }
    },
    enabled: !!user,
  });

  // Fetch departments for filter
  const { data: departmentsData } = useQuery({
    queryKey: ['/api/team-management/departments'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/team-management/departments');
      if (!res.ok) throw new Error('Erro ao buscar departamentos');
      return res.json(); // esperado: { departments: [...] }
    },
    enabled: !!user,
  });

  // Fetch roles for filter
  const { data: rolesData } = useQuery({
    queryKey: ['/api/user-management/roles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user-management/roles');
      if (!res.ok) throw new Error('Erro ao buscar papéis');
      return res.json(); // esperado: { roles: [...] }
    },
    enabled: !!user,
  });

  // Filter team members - using membersData that works
  const filteredMembers = membersData.filter((member: any) => {
    // Build full name for search
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    const displayName = member.name || fullName || member.email || 'Unknown User';

    const matchesSearch = searchTerm === "" || 
                         displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment === "all" || 
                             member.department === filterDepartment ||
                             member.departmentName === filterDepartment;

    const matchesStatus = filterStatus === "all" || 
                         member.status === filterStatus || 
                         (member.isActive && filterStatus === "active") ||
                         (!member.isActive && filterStatus === "inactive");

    const matchesRole = filterRole === "all" || member.role === filterRole;

    // Group filter - handle different group data structures
    const matchesGroup = filterGroup === "all" || 
                        (Array.isArray(member.groupIds) && member.groupIds.some(groupId => 
                          String(groupId) === String(filterGroup)
                        )) ||
                        (member.groupId && String(member.groupId) === String(filterGroup));

    return matchesSearch && matchesDepartment && matchesStatus && matchesRole && matchesGroup;
  });

  // Mutation to toggle member status
  const toggleMemberStatusMutation = useMutation({
    mutationFn: async ({ memberId, newStatus }: { memberId: string, newStatus: string }) => {
      return apiRequest('PUT', `/api/user-management/users/${memberId}`, { 
        isActive: newStatus === 'active' 
      });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/user-management/users'] });
      toast({
        title: "Status atualizado",
        description: "O status do membro foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error?.message || "Falha ao atualizar o status do membro.",
        variant: "destructive",
      });
    },
  });

  // Handle edit member
  const handleEditMember = (member: any) => {
    console.log('TeamManagement - Opening edit dialog with member:', member);
    if (!member || !member.id) {
      toast({
        title: "Erro",
        description: "Dados do membro inválidos",
        variant: "destructive",
      });
      return;
    }
    setEditingMember(member);
    setShowEditDialog(true);
  };

  // Handle toggle member status
  const handleToggleMemberStatus = async (member: any) => {
    if (!member || !member.id) {
      toast({
        title: "Erro",
        description: "Dados do membro inválidos",
        variant: "destructive",
      });
      return;
    }

    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      toggleMemberStatusMutation.mutate({ memberId: member.id, newStatus });
    } catch (error) {
      console.error('Error toggling member status:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status do membro",
        variant: "destructive",
      });
    }
  };

  // Handle export team data
  const handleExportTeamData = () => {
    if (!membersData || membersData.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há membros da equipe para exportar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for export
      const exportData = filteredMembers.map(member => ({
        Nome: member.name,
        Email: member.email,
        Posição: member.position,
        Departamento: member.department,
        Status: member.status === 'active' ? 'Ativo' : member.status === 'inactive' ? 'Inativo' : 'Pendente',
        Telefone: member.phone,
        Performance: `${member.performance}%`,
        Metas: member.goals,
        'Metas Concluídas': member.completedGoals,
        'Última Atividade': new Date(member.lastActive).toLocaleDateString('pt-BR')
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0]).join(',');
      const csvContent = [
        headers,
        ...exportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `equipe_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Dados exportados",
        description: `${exportData.length} membros exportados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar os dados da equipe.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingMembers) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Equipe</h1>
          <p className="text-gray-600 dark:text-gray-400">Sistema integrado de gestão de recursos humanos</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowCreateUser(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Criar Usuário
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowInviteUser(true)}
          >
            <Mail className="mr-2 h-4 w-4" />
            Convidar Usuário
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportTeamData}
            disabled={!membersData || membersData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Membros</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Array.isArray(membersData) ? membersData.length : 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos Hoje</p>
                <p className="text-2xl font-bold text-green-600">
                  {Array.isArray(membersData) ? membersData.filter(m => m.isActive).length : 0}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">
                  {teamStats?.pendingApprovals ?? 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance Média</p>
                <p className="text-2xl font-bold text-purple-600">
                  {teamStats?.averagePerformance ?? 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-1">
            <BarChart3 className="h-3 w-3" />
            <span className="text-xs">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span className="text-xs">Membros</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center space-x-1">
            <Building className="h-3 w-3" />
            <span className="text-xs">Grupos</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span className="text-xs">Permissões</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span className="text-xs">Atividade</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center space-x-1">
            <Monitor className="h-3 w-3" />
            <span className="text-xs">Sessões</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center space-x-1">
            <Award className="h-3 w-3" />
            <span className="text-xs">Habilidades</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Departamento</CardTitle>
                <CardDescription>Membros ativos por departamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {overviewLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  Array.isArray(teamOverview?.departments) ? teamOverview.departments.map((dept: any) => (
                    <div key={dept.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{dept.count}</span>
                        <Progress value={dept.percentage} className="w-20" />
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-gray-500">
                      Nenhum departamento encontrado
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Últimas ações da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overviewLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  Array.isArray(teamOverview?.recentActivities) ? teamOverview.recentActivities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.user && `${activity.user} - `}
                          {typeof activity.timestamp === 'string' ? activity.timestamp : new Date(activity.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-gray-500">
                      Nenhuma atividade recente
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Skills Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Habilidades</CardTitle>
                <CardDescription>Competências da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {skillsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  Array.isArray(skillsMatrix?.topSkills) ? skillsMatrix.topSkills.map((skill: any) => (
                    <div key={skill.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{skill.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{skill.count} pessoas</span>
                        <Badge variant={skill.level === 'Avançado' ? 'default' : 'secondary'}>
                          {skill.level}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-gray-500">
                      Nenhuma habilidade encontrada
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Módulos integrados do sistema</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("skills")}
                  data-testid="button-quick-skills"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Habilidades Técnicas
                </Button>
                <Link href="/agenda-manager">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agenda de Campo
                  </Button>
                </Link>
                <Link href="/timecard">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Controle de Ponto
                  </Button>
                </Link>
                <Link href="/holiday-calendar">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendário Feriados
                  </Button>
                </Link>
                <Link href="/hour-bank">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Banco de Horas
                  </Button>
                </Link>
                <Link href="/tenant-admin/multilocation">
                  <Button variant="outline" className="w-full justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    Multi-localização
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Membros da Equipe</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os membros da sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <div className="lg:col-span-2">
                  <Label htmlFor="search">Buscar membros</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Array.isArray(departmentsData?.departments) ? departmentsData.departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      )) : Array.isArray(teamOverview?.departments) ? teamOverview.departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Array.isArray(rolesData?.roles) ? rolesData.roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="group">Grupo</Label>
                  <Select value={filterGroup} onValueChange={setFilterGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Array.isArray(groupsData?.groups) ? groupsData.groups
                        .filter((group: any) => group?.id && group?.name)
                        .map((group: any) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                            {group.description && (
                              <span className="text-xs text-gray-500 ml-1">
                                - {group.description}
                              </span>
                            )}
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-groups" disabled>
                            Nenhum grupo disponível
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Members List */}
              <div className="bg-white dark:bg-gray-800 border rounded-lg">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div className="col-span-3">Membro</div>
                  <div className="col-span-2">Posição</div>
                  <div className="col-span-2">Departamento</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMembers && filteredMembers.length > 0 ? filteredMembers.map((member: any) => (
                    <div key={member.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      {/* Member Info */}
                      <div className="col-span-3 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Usuário'}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            ID: {member.id ? member.id.slice(-8) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Position */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-300 truncate">
                          {member.position || 'Não informado'}
                        </span>
                      </div>

                      {/* Department */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {member.department || 'Geral'}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center space-x-1 min-w-0">
                          <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {member.email}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1 flex items-center">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              (member.status === 'active' || member.isActive) ? 'default' : 
                              (member.status === 'inactive' || !member.isActive) ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {(member.status === 'active' || member.isActive) ? 'Ativo' : 
                             (member.status === 'inactive' || !member.isActive) ? 'Inativo' : 'Pendente'}
                          </Badge>
                          {(member.status === 'active' || member.isActive) && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                          {(member.status === 'inactive' || !member.isActive) && (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {member.status === 'pending' && (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMember(member)}
                          className="h-8"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant={(member.status === 'active' || member.isActive) ? 'destructive' : 'default'}
                          onClick={() => handleToggleMemberStatus(member)}
                          className="h-8"
                          disabled={!user || (user.role !== 'tenant_admin' && user.role !== 'saas_admin' && user.role !== 'manager')}
                        >
                          {(member.status === 'active' || member.isActive) ? (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum membro encontrado
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {membersData && membersData.length === 0 
                          ? "Nenhum membro foi adicionado à equipe ainda."
                          : "Ajuste os filtros para encontrar membros da equipe."
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {filteredMembers.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhum membro encontrado
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ajuste os filtros ou adicione novos membros à equipe.
                    </p>
                  </div>
                )}
              </div>

              {filteredMembers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum membro encontrado com os filtros aplicados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Avaliação de Performance</CardTitle>
                <CardDescription>Métricas de desempenho da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.isArray(performanceData?.individuals) ? performanceData.individuals.map((person: any) => (
                  <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {person.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-sm text-gray-600">{person.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={person.performance} className="w-20" />
                      <span className="text-sm font-medium">{person.performance}%</span>
                    </div>
                  </div>
                )) : []}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metas e Objetivos</CardTitle>
                <CardDescription>Progresso das metas da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dynamic goals data from performance API */}
                {Array.isArray(performanceData?.goals) && performanceData.goals.length > 0 ? (
                  performanceData.goals.map((goal: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{goal.name}</h4>
                        <Badge variant={goal.percentage >= 100 ? 'default' : goal.percentage >= 75 ? 'secondary' : 'destructive'}>
                          {goal.percentage >= 100 ? 'Concluído' : goal.percentage >= 75 ? 'Em Progresso' : 'Atrasado'}
                        </Badge>
                      </div>
                      <Progress value={goal.percentage} className="mb-2" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{goal.completed} de {goal.total}</span>
                        <span>{goal.percentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhuma meta encontrada</p>
                    <p className="text-sm">Configure metas para a equipe</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <TechnicalSkillsTab />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <UserGroups />
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <CustomRoles tenantAdmin={true} />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <UserInvitations tenantAdmin={true} />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sessões Ativas dos Usuários</h3>
              <div className="flex space-x-2">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Papéis</SelectItem>
                    <SelectItem value="tenant_admin">Admin do Tenant</SelectItem>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Monitor className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sessões Ativas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Array.isArray(membersData) ? membersData.filter(m => m.isActive && m.lastLogin && 
                          new Date(m.lastLogin) > new Date(Date.now() - 30 * 60 * 1000)).length : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sessões Hoje</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Array.isArray(membersData) ? membersData.filter(m => m.lastLogin && 
                          new Date(m.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                      <p className="text-2xl font-bold text-gray-900">2.5h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usuários Únicos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Array.isArray(membersData) ? membersData.filter(m => m.lastLogin).length : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Sessões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(membersData) && membersData.length > 0 ? (
                    membersData
                      .filter(member => filterRole === "all" || member.role === filterRole)
                      .filter(member => member.lastLogin)
                      .sort((a, b) => new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime())
                      .slice(0, 15)
                      .map((member, index) => {
                        const lastLogin = new Date(member.lastLogin);
                        const now = new Date();
                        const timeDiff = now.getTime() - lastLogin.getTime();
                        const isOnline = timeDiff < 30 * 60 * 1000; // 30 minutos
                        const isRecentlyActive = timeDiff < 24 * 60 * 60 * 1000; // 24 horas

                        return (
                          <div key={member.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                                  {(member.firstName || member.name || member.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                  isOnline ? 'bg-green-500' : isRecentlyActive ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}></div>
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Usuário Desconhecido'}
                                </h4>
                                <p className="text-sm text-gray-600">{member.email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {member.role || 'Sem papel'}
                                  </Badge>
                                  {isOnline && (
                                    <Badge variant="default" className="text-xs bg-green-500">
                                      Online
                                    </Badge>
                                  )}
                                  {!isOnline && isRecentlyActive && (
                                    <Badge variant="secondary" className="text-xs">
                                      Recente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {lastLogin.toLocaleString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {timeDiff < 60 * 1000 ? 
                                  'Agora mesmo' :
                                  timeDiff < 60 * 60 * 1000 ? 
                                    `${Math.floor(timeDiff / (60 * 1000))} min atrás` :
                                    timeDiff < 24 * 60 * 60 * 1000 ?
                                      `${Math.floor(timeDiff / (60 * 60 * 1000))} h atrás` :
                                      `${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} dias atrás`
                                }
                              </p>
                              <div className="flex items-center space-x-1 mt-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  isOnline ? 'bg-green-500' : isRecentlyActive ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}></div>
                                <span className="text-xs text-gray-500">
                                  {isOnline ? 'Ativo' : isRecentlyActive ? 'Recente' : 'Inativo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma sessão encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Atividade da Equipe</h3>
              <div className="flex space-x-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usuários Online</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Array.isArray(membersData) ? membersData.filter(m => m.isActive && m.lastLogin && 
                          new Date(m.lastLogin) > new Date(Date.now() - 30 * 60 * 1000)).length : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Últimas 24h</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Array.isArray(membersData) ? membersData.filter(m => m.lastLogin && 
                          new Date(m.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Membros</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Array.isArray(membersData) ? membersData.length : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente dos Membros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(membersData) && membersData.length > 0 ? (
                    membersData
                      .filter(member => filterStatus === "all" || 
                        (filterStatus === "active" && member.isActive) ||
                        (filterStatus === "inactive" && !member.isActive))
                      .sort((a, b) => new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime())
                      .slice(0, 20)
                      .map((member, index) => (
                        <div key={member.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                              {(member.firstName || member.name || member.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Usuário Desconhecido'}
                              </h4>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              <p className="text-xs text-gray-500">{member.role || 'Sem papel definido'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {member.isActive ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm ${member.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                {member.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {member.lastLogin ? 
                                `Último acesso: ${new Date(member.lastLogin).toLocaleString('pt-BR')}` : 
                                'Nunca acessou'}
                            </p>
                            {member.groups && member.groups.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.groups.slice(0, 2).map((group: any, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {group.name}
                                  </Badge>
                                ))}
                                {member.groups.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{member.groups.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma atividade encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Escalas e Horários</CardTitle>
              <CardDescription>
                Controle de escalas de trabalho e agenda de campo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Agenda de Campo para técnicos
                  </p>
                  <Link href="/agenda-manager">
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Acessar Agenda de Campo
                    </Button>
                  </Link>
                </div>

                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Controle de Ponto e Jornadas
                  </p>
                  <Link href="/timecard">
                    <Button>
                      <Clock className="h-4 w-4 mr-2" />
                      Acessar Timecard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Absence Tab */}
        <TabsContent value="absence">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Ausências e Férias</CardTitle>
              <CardDescription>
                Controle de ausências, férias e banco de horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Gestão de Ausências
                  </p>
                  <Link href="/absence-management">
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Acessar Gestão de Ausências
                    </Button>
                  </Link>
                </div>

                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Banco de Horas
                  </p>
                  <Link href="/hour-bank">
                    <Button>
                      <Clock className="h-4 w-4 mr-2" />
                      Acessar Banco de Horas
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* User Management Dialogs */}
      <CreateUserDialog 
        open={showCreateUser} 
        onOpenChange={setShowCreateUser}
        onSuccess={handleUserCreated}
        tenantAdmin={true}
      />
      <InviteUserDialog 
        open={showInviteUser} 
        onOpenChange={setShowInviteUser}
        onSuccess={handleUserInvited}
        tenantAdmin={true}
      />
      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={editingMember}
      />
    </div>
  );
}