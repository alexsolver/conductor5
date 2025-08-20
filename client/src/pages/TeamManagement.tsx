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
// import useLocalization from '@/hooks/useLocalization';
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
  // Localization temporarily disabled
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
    // Invalidate all team management queries
    queryClientInstance.invalidateQueries({ queryKey: ['/api/team-management/members'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/team-management/stats'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/team-management/overview'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant-admin/team/members'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant-admin/team/stats'] });
  };
  // Handle successful user invitation
  const handleUserInvited = () => {
    setShowInviteUser(false);
    // Invalidate all team management queries
    queryClientInstance.invalidateQueries({ queryKey: ['/api/team-management/members'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/team-management/stats'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/team-management/overview'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant-admin/team/members'] });
    queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant-admin/team/stats'] });
  };
  // Fetch team overview data
  const { data: teamOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/team-management/overview'],
    enabled: !!user,
  });
  // Fetch team members
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['/api/team-management/members'],
    enabled: !!user,
  });
  // Fetch team stats
  const { data: teamStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/team-management/stats'],
    enabled: !!user,
  });
  // Fetch performance data
  const { data: performanceData } = useQuery({
    queryKey: ['/api/team-management/performance'],
    enabled: !!user,
  });
  // Fetch skills matrix
  const { data: skillsMatrix, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/team-management/skills-matrix'],
    enabled: !!user,
  });
  // Fetch old system data for consolidated functionality
  const { data: tenantStats, isLoading: tenantStatsLoading } = useQuery({
    queryKey: ["/api/tenant-admin/team/stats"],
    enabled: !!user,
    refetchInterval: 30000,
  });
  // Usar user-management/users que funciona em vez de tenant-admin/team/members
  const { data: userManagementData, isLoading: tenantMembersLoading } = useQuery({
    queryKey: ["/api/user-management/users"],
    enabled: !!user,
    refetchInterval: 60000,
  });
  // Extrair users do objeto retornado
  const tenantMembers = userManagementData?.users || [];
  // Fetch groups for filter
  const { data: groupsData } = useQuery({
    queryKey: ['/api/user-management/groups'],
    enabled: !!user,
  });
  // Fetch departments for filter
  const { data: departmentsData } = useQuery({
    queryKey: ['/api/team-management/departments'],
    enabled: !!user,
  });
  // Fetch roles for filter
  const { data: rolesData } = useQuery({
    queryKey: ['/api/team-management/roles'],
    enabled: !!user,
  });
  // Filter team members - usando tenantMembers que funciona
  const membersArray = Array.isArray(tenantMembers) ? tenantMembers : 
                       (tenantMembers && Array.isArray(tenantMembers.members) ? tenantMembers.members : []);
  
  const filteredMembers = membersArray.filter((member: any) => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         " ${member.lastName || ''.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || 
                             member.department === filterDepartment ||
                             member.departmentName === filterDepartment;
    const matchesStatus = filterStatus === "all" || member.status === filterStatus || 
                         (member.isActive && filterStatus === "active") ||
                         (!member.isActive && filterStatus === "inactive");
    const matchesRole = filterRole === "all" || member.role === filterRole;
    // Filtro por grupo agora funciona com array de groupIds do relacionamento
    const matchesGroup = filterGroup === "all" || 
                        (Array.isArray(member.groupIds) && member.groupIds.some(groupId => 
                          String(groupId) === String(filterGroup)
                        ));
    return matchesSearch && matchesDepartment && matchesStatus && matchesRole && matchesGroup;
  });
  // Mutation to toggle member status
  const toggleMemberStatusMutation = useMutation({
    mutationFn: async ({ memberId, newStatus }: { memberId: string, newStatus: string }) => {
      return apiRequest('PUT', "/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/team-management/members'] });
      toast({
        title: "Status atualizado",
        description: "O status do membro foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Atualizar Status',
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
        title: 'Erro',
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
        title: 'Erro',
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
        title: 'Erro',
        description: "Falha ao alterar status do membro",
        variant: "destructive",
      });
    }
  };
  // Handle export team data
  const handleExportTeamData = () => {
    if (!teamMembers || teamMembers.length === 0) {
      toast({
        title: '[TRANSLATION_NEEDED]',
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
        Performance: "%`,
        Metas: member.goals,
        'Metas Concluídas': member.completedGoals,
        'Última Atividade': new Date(member.lastActive).toLocaleDateString('pt-BR')
      }));
      // Convert to CSV
      const headers = Object.keys(exportData[0]).join(',');
      const csvContent = [
        headers,
        ...exportData.map(row => Object.values(row).map(value => ""`).join(','))
      ].join('\n');
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', ".csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Dados exportados",
        description: " membros exportados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Falha ao exportar os dados da equipe.",
        variant: "destructive",
      });
    }
  };
  if (overviewLoading || membersLoading || statsLoading) {
    return (
      <div className=""
        <div className=""
          <div className="text-lg">"</div>
          <div className=""
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-lg">"</div>
            ))}
          </div>
          <div className="text-lg">"</div>
        </div>
      </div>
    );
  }
  return (
    <div className=""
      {/* Header */}
      <div className=""
        <div>
          <h1 className="text-lg">"Gestão de Equipe</h1>
          <p className="text-lg">"Sistema integrado de gestão de recursos humanos</p>
        </div>
        <div className=""
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
            disabled={!teamMembers || teamMembers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      {/* Quick Stats Cards */}
      <div className=""
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Total de Membros</p>
                <p className=""
                  {teamStats?.totalMembers ?? 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Ativos Hoje</p>
                <p className=""
                  {teamStats?.activeToday ?? 0}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Pending Approval</p>
                <p className=""
                  {teamStats?.pendingApprovals ?? 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Performance Média</p>
                <p className=""
                  {teamStats?.averagePerformance ?? 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className=""
        <TabsList className=""
          <TabsTrigger value="overview" className=""
            <BarChart3 className="h-3 w-3" />
            <span className="text-lg">"Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="members" className=""
            <Users className="h-3 w-3" />
            <span className="text-lg">"Membros</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className=""
            <Building className="h-3 w-3" />
            <span className="text-lg">"Grupos</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className=""
            <Shield className="h-3 w-3" />
            <span className="text-lg">"Papéis</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className=""
            <Mail className="h-3 w-3" />
            <span className="text-lg">"Convites</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className=""
            <Monitor className="h-3 w-3" />
            <span className="text-lg">"Sessões</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className=""
            <Activity className="h-3 w-3" />
            <span className="text-lg">"Atividade</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className=""
            <Target className="h-3 w-3" />
            <span className="text-lg">"Performance</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className=""
            <Award className="h-3 w-3" />
            <span className="text-lg">"Habilidades</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className=""
            <TrendingUp className="h-3 w-3" />
            <span className="text-lg">"Analytics</span>
          </TabsTrigger>
        </TabsList>
        {/* Overview Tab */}
        <TabsContent value="overview>
          <div className=""
            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Departamento</CardTitle>
                <CardDescription>Membros ativos por departamento</CardDescription>
              </CardHeader>
              <CardContent className=""
                {overviewLoading ? (
                  <div className=""
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className=""
                        <div className="text-lg">"</div>
                        <div className="text-lg">"</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  Array.isArray(teamOverview?.departments) ? teamOverview.departments.map((dept: any) => (
                    <div key={dept.name} className=""
                      <div className=""
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-lg">"{dept.name}</span>
                      </div>
                      <div className=""
                        <span className="text-lg">"{dept.count}</span>
                        <Progress value={dept.percentage} className="w-20" />
                      </div>
                    </div>
                  )) : (
                    <div className=""
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
              <CardContent className=""
                {overviewLoading ? (
                  <div className=""
                    {[1, 2, 3].map((i) => (
                      <div key={i} className=""
                        <div className="text-lg">"</div>
                        <div className=""
                          <div className="text-lg">"</div>
                          <div className="text-lg">"</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  Array.isArray(teamOverview?.recentActivities) ? teamOverview.recentActivities.map((activity: any, index: number) => (
                    <div key={index} className=""
                      <Activity className="h-4 w-4 text-blue-500" />
                      <div className=""
                        <p className="text-lg">"{activity.description}</p>
                        <p className=""
                          {activity.user && " - "
                          {typeof activity.timestamp === 'string' ? activity.timestamp : new Date(activity.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className=""
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
              <CardContent className=""
                {skillsLoading ? (
                  <div className=""
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className=""
                        <div className="text-lg">"</div>
                        <div className="text-lg">"</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  Array.isArray(skillsMatrix?.topSkills) ? skillsMatrix.topSkills.map((skill: any) => (
                    <div key={skill.name} className=""
                      <div className=""
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-lg">"{skill.name}</span>
                      </div>
                      <div className=""
                        <span className="text-lg">"{skill.count} pessoas</span>
                        <Badge variant={skill.level === 'Avançado' ? 'default' : 'secondary'}>
                          {skill.level}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className=""
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
              <CardContent className=""
                <Link href="/technical-skills>
                  <Button variant="outline" className=""
                    <Award className="h-4 w-4 mr-2" />
                    Habilidades Técnicas
                  </Button>
                </Link>
                <Link href="/agenda-manager>
                  <Button variant="outline" className=""
                    <Calendar className="h-4 w-4 mr-2" />
                    Agenda de Campo
                  </Button>
                </Link>
                <Link href="/timecard>
                  <Button variant="outline" className=""
                    <Clock className="h-4 w-4 mr-2" />
                    Controle de Ponto
                  </Button>
                </Link>
                <Link href="/holiday-calendar>
                  <Button variant="outline" className=""
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendário Feriados
                  </Button>
                </Link>
                <Link href="/hour-bank>
                  <Button variant="outline" className=""
                    <Clock className="h-4 w-4 mr-2" />
                    Banco de Horas
                  </Button>
                </Link>
                <Link href="/tenant-admin/multilocation>
                  <Button variant="outline" className=""
                    <Globe className="h-4 w-4 mr-2" />
                    Multi-localização
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Members Tab */}
        <TabsContent value="members>
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Membros da Equipe</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os membros da sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className=""
                <div className=""
                  <Label htmlFor="search">Buscar membros</Label>
                  <div className=""
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
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Array.isArray(groupsData?.groups) ? groupsData.groups
                        .filter((group: any) => group?.id && group?.name)
                        .map((group: any) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                            {group.description && (
                              <span className=""
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
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
              <div className=""
                {/* Table Header */}
                <div className=""
                  <div className="text-lg">"Membro</div>
                  <div className="text-lg">"Posição</div>
                  <div className="text-lg">"Departamento</div>
                  <div className="text-lg">"Email</div>
                  <div className="text-lg">"Status</div>
                  <div className="text-lg">"Ações</div>
                </div>
                {/* Table Body */}
                <div className=""
                  {filteredMembers && filteredMembers.length > 0 ? filteredMembers.map((member: any) => (
                    <div key={member.id} className=""
                      {/* Member Info */}
                      <div className=""
                        <div className=""
                          <span className=""
                            {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className=""
                          <h3 className=""
                            {member.name || "
                          </h3>
                          <p className=""
                            ID: {member.id ? member.id.slice(-8) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {/* Position */}
                      <div className=""
                        <span className=""
                          {member.position || 'Não informado'}
                        </span>
                      </div>
                      {/* Department */}
                      <div className=""
                        <span className=""
                          {member.department || 'Geral'}
                        </span>
                      </div>
                      {/* Email */}
                      <div className=""
                        <div className=""
                          <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className=""
                            {member.email}
                          </span>
                        </div>
                      </div>
                      {/* Status */}
                      <div className=""
                        <div className=""
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
                      <div className=""
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
                    <div className=""
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className=""
                        Nenhum membro encontrado
                      </h3>
                      <p className=""
                        {teamMembers && teamMembers.length === 0 
                          ? '[TRANSLATION_NEEDED]'
                          : "Ajuste os filtros para encontrar membros da equipe."
                        }
                      </p>
                    </div>
                  )}
                </div>
                {/* Empty State */}
                {filteredMembers.length === 0 && (
                  <div className=""
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className=""
                      Nenhum membro encontrado
                    </h3>
                    <p className=""
                      Ajuste os filtros ou adicione novos membros à equipe.
                    </p>
                  </div>
                )}
              </div>
              {filteredMembers.length === 0 && (
                <div className=""
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg">"Nenhum membro encontrado com os filtros aplicados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Performance Tab */}
        <TabsContent value="performance>
          <div className=""
            <Card>
              <CardHeader>
                <CardTitle>Avaliação de Performance</CardTitle>
                <CardDescription>Métricas de desempenho da equipe</CardDescription>
              </CardHeader>
              <CardContent className=""
                {Array.isArray(performanceData?.individuals) ? performanceData.individuals.map((person: any) => (
                  <div key={person.id} className=""
                    <div className=""
                      <div className=""
                        <span className=""
                          {person.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg">"{person.name}</p>
                        <p className="text-lg">"{person.role}</p>
                      </div>
                    </div>
                    <div className=""
                      <Progress value={person.performance} className="w-20" />
                      <span className="text-lg">"{person.performance}%</span>
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
              <CardContent className=""
                {/* Dynamic goals data from performance API */}
                {Array.isArray(performanceData?.goals) && performanceData.goals.length > 0 ? (
                  performanceData.goals.map((goal: any, index: number) => (
                    <div key={index} className=""
                      <div className=""
                        <h4 className="text-lg">"{goal.name}</h4>
                        <Badge variant={goal.percentage >= 100 ? 'default' : goal.percentage >= 75 ? 'secondary' : 'destructive'}>
                          {goal.percentage >= 100 ? 'Concluído' : goal.percentage >= 75 ? 'Em Progresso' : 'Atrasado'}
                        </Badge>
                      </div>
                      <Progress value={goal.percentage} className="mb-2" />
                      <div className=""
                        <span>{goal.completed} de {goal.total}</span>
                        <span>{goal.percentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className=""
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhuma meta encontrada</p>
                    <p className="text-lg">"Configure metas para a equipe</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Skills Tab */}
        <TabsContent value="skills>
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Habilidades da Equipe</CardTitle>
              <CardDescription>
                Visualização completa das competências técnicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=""
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className=""
                  Integração com o módulo de Habilidades Técnicas
                </p>
                <Link href="/technical-skills>
                  <Button>
                    <Award className="h-4 w-4 mr-2" />
                    Acessar Habilidades Técnicas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Groups Tab */}
        <TabsContent value="groups" className=""
          <UserGroups tenantAdmin={true} />
        </TabsContent>
        {/* Roles Tab */}
        <TabsContent value="roles" className=""
          <CustomRoles tenantAdmin={true} />
        </TabsContent>
        {/* Invitations Tab */}
        <TabsContent value="invitations" className=""
          <UserInvitations tenantAdmin={true} />
        </TabsContent>
        {/* Sessions Tab */}
        <TabsContent value="sessions" className=""
          <UserSessions tenantAdmin={true} />
        </TabsContent>
        {/* Activity Tab */}
        <TabsContent value="activity" className=""
          <UserActivity tenantAdmin={true} />
        </TabsContent>
        {/* Schedules Tab */}
        <TabsContent value="schedules>
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Escalas e Horários</CardTitle>
              <CardDescription>
                Controle de escalas de trabalho e agenda de campo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=""
                <div className=""
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className=""
                    Agenda de Campo para técnicos
                  </p>
                  <Link href="/agenda-manager>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Acessar Agenda de Campo
                    </Button>
                  </Link>
                </div>
                <div className=""
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className=""
                    Controle de Ponto e Jornadas
                  </p>
                  <Link href="/timecard>
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
        <TabsContent value="absence>
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Ausências e Férias</CardTitle>
              <CardDescription>
                Controle de ausências, férias e banco de horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=""
                <div className=""
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className=""
                    Gestão de Ausências
                  </p>
                  <Link href="/absence-management>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Acessar Gestão de Ausências
                    </Button>
                  </Link>
                </div>
                <div className=""
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className=""
                    Banco de Horas
                  </p>
                  <Link href="/hour-bank>
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
        {/* Analytics Tab */}
        <TabsContent value="analytics>
          <div className=""
            <Card>
              <CardHeader>
                <CardTitle>Analytics Avançados de RH</CardTitle>
                <CardDescription>Métricas e insights da equipe</CardDescription>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className=""
                    Dashboard de analytics em desenvolvimento
                  </p>
                  <p className=""
                    Incluirá métricas de produtividade, turnover, satisfação e retenção
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Compliance e Auditoria</CardTitle>
                <CardDescription>Status de conformidade da equipe</CardDescription>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className=""
                    Sistema de compliance em desenvolvimento
                  </p>
                  <p className=""
                    Tracking de conformidade, auditoria e riscos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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