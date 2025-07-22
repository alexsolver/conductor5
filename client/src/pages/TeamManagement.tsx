import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { 
  Users, 
  UserCheck, 
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
  Globe
} from "lucide-react";
import { Link } from "wouter";

export default function TeamManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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
  const { data: skillsMatrix } = useQuery({
    queryKey: ['/api/team-management/skills-matrix'],
    enabled: !!user,
  });

  // Filter team members
  const filteredMembers = Array.isArray(teamMembers) ? teamMembers.filter((member: any) => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || member.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || member.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  }) : [];

  if (overviewLoading || membersLoading || statsLoading) {
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Membro
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
                  {teamStats?.totalMembers ?? 0}
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
                  {teamStats?.activeToday ?? 0}
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Membros</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Habilidades</span>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Escalas</span>
          </TabsTrigger>
          <TabsTrigger value="absence" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Ausências</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
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
                {Array.isArray(teamOverview?.departments) ? teamOverview.departments.map((dept: any) => (
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
                )) : []}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Últimas ações da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.isArray(teamOverview?.recentActivities) ? teamOverview.recentActivities.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                )) : []}
              </CardContent>
            </Card>

            {/* Skills Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Habilidades</CardTitle>
                <CardDescription>Competências da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.isArray(skillsMatrix?.topSkills) ? skillsMatrix.topSkills.map((skill: any) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{skill.experts} experts</span>
                      <Badge variant={skill.level === 'high' ? 'default' : 'secondary'}>
                        {skill.level}
                      </Badge>
                    </div>
                  </div>
                )) : []}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Módulos integrados do sistema</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/technical-skills">
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="h-4 w-4 mr-2" />
                    Habilidades Técnicas
                  </Button>
                </Link>
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
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
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
                      <SelectItem value="all">Todos os Departamentos</SelectItem>
                      <SelectItem value="engineering">Engenharia</SelectItem>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="hr">Recursos Humanos</SelectItem>
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
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member: any) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {member.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {member.position}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.department}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600 truncate">
                                {member.email}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <Badge 
                              variant={
                                member.status === 'active' ? 'default' : 
                                member.status === 'inactive' ? 'destructive' : 'secondary'
                              }
                            >
                              {member.status}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              {member.status === 'active' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {member.status === 'inactive' && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {member.status === 'pending' && (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                {Array.isArray(performanceData?.goals) ? performanceData.goals.map((goal: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{goal.title}</h4>
                      <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                        {goal.status}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="mb-2" />
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                )) : []}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Habilidades da Equipe</CardTitle>
              <CardDescription>
                Visualização completa das competências técnicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Integração com o módulo de Habilidades Técnicas
                </p>
                <Link href="/technical-skills">
                  <Button>
                    <Award className="h-4 w-4 mr-2" />
                    Acessar Habilidades Técnicas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Avançados de RH</CardTitle>
                <CardDescription>Métricas e insights da equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Dashboard de analytics em desenvolvimento
                  </p>
                  <p className="text-sm text-gray-500">
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
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Sistema de compliance em desenvolvimento
                  </p>
                  <p className="text-sm text-gray-500">
                    Tracking de conformidade, auditoria e riscos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}