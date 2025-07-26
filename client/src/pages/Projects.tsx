import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Users, BarChart3, Settings } from 'lucide-react';
import { GanttChart } from '@/components/charts/GanttChart';

type ProjectStatus = 'planning' | 'approved' | 'in_progress' | 'on_hold' | 'review' | 'completed' | 'cancelled';
type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  endDate?: string;
  estimatedHours?: number;
  actualHours: number;
  budget?: number;
  currentCost: number;
  tags?: string[];
}

interface ProjectStats {
  data?: {
    total_projects: number;
    active_projects: number;
    total_budget: number;
    completed_projects: number;
  };
}

const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Planejamento',
  approved: 'Aprovado',
  in_progress: 'Em Execução',
  on_hold: 'Em Espera',
  review: 'Em Revisão',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

const statusColors: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  review: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityLabels: Record<ProjectPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

const priorityColors: Record<ProjectPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('grid');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning' as const,
    priority: 'medium' as const,
    startDate: '',
    endDate: '',
    estimatedHours: '',
    budget: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, [statusFilter, priorityFilter, searchTerm]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/projects?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        const safeProjects = Array.isArray(result?.data) ? result.data : 
                           Array.isArray(result) ? result : 
                           Array.isArray(result?.projects) ? result.projects : [];
        setProjects(safeProjects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/projects/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        const statsData = result?.data || result;
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const projectData = {
        ...newProject,
        estimatedHours: newProject.estimatedHours ? parseInt(newProject.estimatedHours) : undefined,
        budget: newProject.budget ? parseFloat(newProject.budget) : undefined,
        startDate: newProject.startDate || undefined,
        endDate: newProject.endDate || undefined
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Projeto criado com sucesso!'
        });
        setShowCreateDialog(false);
        setNewProject({
          name: '',
          description: '',
          status: 'planning',
          priority: 'medium',
          startDate: '',
          endDate: '',
          estimatedHours: '',
          budget: ''
        });
        fetchProjects();
        fetchStats();
      } else {
        throw new Error('Erro ao criar projeto');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar projeto',
        variant: 'destructive'
      });
    }
  };

  const filteredProjects = useMemo(() => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    return safeProjects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">Carregando projetos...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between ml-[20px] mr-[20px]">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão de Projetos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie projetos com ações internas e externas
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => window.location.href = '/project-actions'}
            variant="outline"
            className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200"
          >
            <Settings className="h-4 w-4 mr-2 text-green-600" />
            Gerenciar Ações
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Preencha as informações básicas do projeto
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome do Projeto</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Digite o nome do projeto"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Descreva o projeto"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateProject}>
                  Criar Projeto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.data?.total_projects || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Execução</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.data?.active_projects || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(stats?.data?.total_budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.data?.completed_projects || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.isArray(filteredProjects) && filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                    <Badge className={priorityColors[project.priority]}>
                      {priorityLabels[project.priority]}
                    </Badge>
                  </div>
                  
                  {project.budget && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Orçamento:</span> R$ {(project.budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  
                  {project.estimatedHours && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Horas:</span> {project.actualHours}/{project.estimatedHours}h
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">Nenhum projeto encontrado</div>
          </div>
        )}
      </div>
    </div>
  );
}