
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, DollarSign, BarChart3, Filter, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'approved' | 'in_progress' | 'on_hold' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  estimatedHours?: number;
  actualHours: number;
  budget?: number;
  actualCost: number;
  projectManagerId?: string;
  clientId?: string;
  teamMemberIds: string[];
  tags: string[];
  createdAt: string;
}

interface ProjectStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  totalBudget: number;
  totalActualCost: number;
}

const statusColors = {
  planning: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  review: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusLabels = {
  planning: 'Planejamento',
  approved: 'Aprovado',
  in_progress: 'Em Execução',
  on_hold: 'Em Espera',
  review: 'Em Revisão',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
  const [editProject, setEditProject] = useState({
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
        const data = await response.json();
        setProjects(data);
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
        const data = await response.json();
        setStats(data);
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

  const handleEditProject = async () => {
    try {
      if (!selectedProject) return;
      
      const token = localStorage.getItem('accessToken');
      
      const projectData = {
        ...editProject,
        estimatedHours: editProject.estimatedHours ? parseInt(editProject.estimatedHours) : undefined,
        budget: editProject.budget ? parseFloat(editProject.budget) : undefined,
        startDate: editProject.startDate || undefined,
        endDate: editProject.endDate || undefined
      };

      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Projeto atualizado com sucesso!'
        });
        setShowEditDialog(false);
        setSelectedProject(null);
        fetchProjects();
        fetchStats();
      } else {
        throw new Error('Erro ao atualizar projeto');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar projeto',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Projeto excluído com sucesso!'
        });
        fetchProjects();
        fetchStats();
      } else {
        throw new Error('Erro ao excluir projeto');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir projeto',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setEditProject({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      estimatedHours: project.estimatedHours?.toString() || '',
      budget: project.budget?.toString() || ''
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (project: Project) => {
    setSelectedProject(project);
    setShowViewDialog(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Carregando projetos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão de Projetos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie projetos com ações internas e externas
          </p>
        </div>
        
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
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newProject.status} onValueChange={(value) => setNewProject({ ...newProject, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="in_progress">Em Execução</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={newProject.priority} onValueChange={(value) => setNewProject({ ...newProject, priority: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={newProject.estimatedHours}
                  onChange={(e) => setNewProject({ ...newProject, estimatedHours: e.target.value })}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                  placeholder="0.00"
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

        {/* Edit Project Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
              <DialogDescription>
                Atualize as informações do projeto
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-name">Nome do Projeto</Label>
                <Input
                  id="edit-name"
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  placeholder="Digite o nome do projeto"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editProject.description}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  placeholder="Descreva o projeto"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editProject.status} onValueChange={(value) => setEditProject({ ...editProject, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="in_progress">Em Execução</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="review">Em Revisão</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-priority">Prioridade</Label>
                <Select value={editProject.priority} onValueChange={(value) => setEditProject({ ...editProject, priority: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-startDate">Data de Início</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editProject.startDate}
                  onChange={(e) => setEditProject({ ...editProject, startDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-endDate">Data de Término</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editProject.endDate}
                  onChange={(e) => setEditProject({ ...editProject, endDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-estimatedHours">Horas Estimadas</Label>
                <Input
                  id="edit-estimatedHours"
                  type="number"
                  value={editProject.estimatedHours}
                  onChange={(e) => setEditProject({ ...editProject, estimatedHours: e.target.value })}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-budget">Orçamento (R$)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  step="0.01"
                  value={editProject.budget}
                  onChange={(e) => setEditProject({ ...editProject, budget: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditProject}>
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Project Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Projeto</DialogTitle>
              <DialogDescription>
                Visualize as informações completas do projeto
              </DialogDescription>
            </DialogHeader>
            
            {selectedProject && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nome do Projeto</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedProject.name}</p>
                </div>
                
                {selectedProject.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Descrição</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProject.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge className={statusColors[selectedProject.status]}>
                        {statusLabels[selectedProject.status]}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Prioridade</Label>
                    <div className="mt-1">
                      <Badge className={priorityColors[selectedProject.priority]}>
                        {priorityLabels[selectedProject.priority]}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {(selectedProject.startDate || selectedProject.endDate) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProject.startDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Data de Início</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedProject.startDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    
                    {selectedProject.endDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Data de Término</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedProject.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedProject.estimatedHours && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Horas Estimadas</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedProject.estimatedHours}h</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Horas Realizadas</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProject.actualHours}h</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedProject.budget && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Orçamento</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        R$ {selectedProject.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Custo Atual</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      R$ {selectedProject.actualCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                {selectedProject.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedProject.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Data de Criação</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedProject.createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(selectedProject.createdAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Execução</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.in_progress || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.completed || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="in_progress">Em Execução</SelectItem>
                <SelectItem value="on_hold">Em Espera</SelectItem>
                <SelectItem value="review">Em Revisão</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openViewDialog(project)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
                    <span className="font-medium">Orçamento:</span> R$ {project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
                
                {project.estimatedHours && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Horas:</span> {project.actualHours}/{project.estimatedHours}h
                  </div>
                )}
                
                {(project.startDate || project.endDate) && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Período:</span> 
                    {project.startDate && ` ${new Date(project.startDate).toLocaleDateString('pt-BR')}`}
                    {project.startDate && project.endDate && ' - '}
                    {project.endDate && `${new Date(project.endDate).toLocaleDateString('pt-BR')}`}
                  </div>
                )}
                
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">Nenhum projeto encontrado</div>
        </div>
      )}
    </div>
  );
}
