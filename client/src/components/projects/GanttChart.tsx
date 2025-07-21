
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface Project {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: string;
  priority: string;
  estimatedHours?: number;
  actualHours: number;
  progress?: number;
}

interface ProjectAction {
  id: string;
  projectId: string;
  title: string;
  scheduledDate?: string;
  dueDate?: string;
  status: string;
  priority: string;
  estimatedHours?: number;
}

interface GanttChartProps {
  projects: Project[];
  viewMode?: 'days' | 'weeks' | 'months';
  className?: string;
}

const statusColors = {
  planning: 'bg-gray-500',
  approved: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  on_hold: 'bg-orange-500',
  review: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500'
};

const priorityColors = {
  low: 'border-gray-300',
  medium: 'border-yellow-400',
  high: 'border-orange-400',
  critical: 'border-red-500'
};

export function GanttChart({ projects, viewMode = 'weeks', className = ' }: GanttChartProps) {
  const [currentViewMode, setCurrentViewMode] = useState<'days' | 'weeks' | 'months'>(viewMode);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const today = new Date();

  // Fetch project actions
  const { data: actions = [] } = useQuery<ProjectAction[]>({
    queryKey: ['/api/actions'],
    staleTime: 30000
  });

  // Calculate date range based on view mode
  const { startDate, endDate, timeUnits } = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (currentViewMode === 'days') {
      start.setDate(start.getDate() - 15);
      end.setDate(end.getDate() + 15);
      const units: Date[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        units.push(new Date(d));
      }
      return { startDate: start, endDate: end, timeUnits: units };
    } else if (currentViewMode === 'weeks') {
      start.setDate(start.getDate() - (start.getDay() + 7 * 8));
      end.setDate(start.getDate() + (7 * 16));
      const units: Date[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        units.push(new Date(d));
      }
      return { startDate: start, endDate: end, timeUnits: units };
    } else {
      start.setMonth(start.getMonth() - 6);
      start.setDate(1);
      end.setMonth(start.getMonth() + 12);
      end.setDate(0);
      const units: Date[] = [];
      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        units.push(new Date(d));
      }
      return { startDate: start, endDate: end, timeUnits: units };
    }
  }, [currentDate, currentViewMode]);

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getProjectPosition = (project: Project) => {
    if (!project.startDate) return null;

    const projectStart = new Date(project.startDate);
    const projectEnd = project.endDate ? new Date(project.endDate) : new Date(projectStart.getTime() + (project.estimatedHours || 40) * 60 * 60 * 1000);

    const startOffset = Math.max(0, (projectStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (projectEnd.getTime() - Math.max(projectStart.getTime(), startDate.getTime())) / (1000 * 60 * 60 * 24));

    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      projectStart,
      projectEnd
    };
  };

  const getActionPosition = (action: ProjectAction) => {
    if (!action.scheduledDate && !action.dueDate) return null;

    const actionDate = new Date(action.scheduledDate || action.dueDate!);
    const actionEnd = action.dueDate ? new Date(action.dueDate) : actionDate;

    const startOffset = Math.max(0, (actionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(0.5, (actionEnd.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24));

    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 1)}%`
    };
  };

  const formatTimeUnit = (date: Date) => {
    if (currentViewMode === 'days') {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (currentViewMode === 'weeks') {
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }
  };

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (currentViewMode === 'days') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (currentViewMode === 'weeks') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 28 : -28));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    }
    setCurrentDate(newDate);
  };

  const visibleProjects = projects.filter(project => {
    // Se não tem data de início, ainda mostra o projeto mas com posicionamento especial
    if (!project.startDate) return true;
    const projectStart = new Date(project.startDate);
    const projectEnd = project.endDate ? new Date(project.endDate) : new Date(projectStart.getTime() + (project.estimatedHours || 40) * 60 * 60 * 1000);
    return projectStart <= endDate && projectEnd >= startDate;
  });

  const GanttContent = ({ isFullscreen = false }: { isFullscreen?: boolean }) => (
    <div className={`space-y-4 ${isFullscreen ? 'h-full' : '}`}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateTime('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(today)}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTime('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={currentViewMode} onValueChange={(value: 'days' | 'weeks' | 'months') => setCurrentViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Dias</SelectItem>
              <SelectItem value="weeks">Semanas</SelectItem>
              <SelectItem value="months">Meses</SelectItem>
            </SelectContent>
          </Select>
          
          {!isFullscreen && (
            <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Visualização Gantt - Tela Completa</DialogTitle>
                </DialogHeader>
                <div className="h-full overflow-auto">
                  <GanttContent isFullscreen={true} />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Timeline Header */}
      <div className="relative">
        <div className="flex border-b border-gray-200">
          <div className="w-64 flex-shrink-0 p-2 bg-gray-50 border-r">
            <span className="font-medium text-sm">Projeto</span>
          </div>
          <div className="flex-1 relative">
            <div className="flex">
              {timeUnits.map((unit, index) => (
                <div
                  key={index}
                  className="flex-1 p-2 text-center text-xs border-r border-gray-100 min-w-16"
                >
                  {formatTimeUnit(unit)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today indicator */}
        {today >= startDate && today <= endDate && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{
              left: `${264 + ((today.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * (100)}%`
            }}
          />
        )}
      </div>

      {/* Gantt Rows */}
      <div className={`space-y-1 ${isFullscreen ? 'max-h-[calc(100vh-200px)] overflow-y-auto' : 'max-h-96 overflow-y-auto'}`}>
        {visibleProjects.map((project) => {
          const position = getProjectPosition(project);
          const projectActions = actions.filter(action => action.projectId === project.id);

          return (
            <div key={project.id} className="relative group">
              <div className="flex items-center hover:bg-gray-50 transition-colors">
                <div className="w-64 flex-shrink-0 p-3 border-r">
                  <div className="space-y-1">
                    <div className="font-medium text-sm truncate" title={project.name}>
                      {project.name}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[project.status]} text-white border-none`}
                      >
                        {project.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityColors[project.priority]} border-2`}
                      >
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 relative h-12 border-r">
                  {/* Project bar */}
                  {position ? (
                    <div
                      className={`absolute top-2 h-6 ${statusColors[project.status]} rounded-sm cursor-pointer transition-all hover:opacity-80 ${priorityColors[project.priority]} border-2`}
                      style={{
                        left: position.left,
                        width: position.width
                      }}
                      onClick={() => setSelectedProject(project)}
                      title={`${project.name} - ${position.projectStart.toLocaleDateString('pt-BR')} até ${position.projectEnd.toLocaleDateString('pt-BR')}`}
                    >
                      <div className="h-full flex items-center px-2">
                        <span className="text-white text-xs font-medium truncate">
                          {project.progress ? `${project.progress}%` : `${project.actualHours}h`}
                        </span>
                      </div>
                      
                      {/* Progress indicator */}
                      {project.progress && (
                        <div
                          className="absolute top-0 left-0 h-full bg-white bg-opacity-30 rounded-sm"
                          style={{ width: `${project.progress}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    // Projeto sem data - mostra barra cinza indicativa
                    <div
                      className="absolute top-2 h-6 bg-gray-300 rounded-sm cursor-pointer transition-all hover:opacity-80 border-2 border-gray-400"
                      style={{
                        left: '10%',
                        width: '80%'
                      }}
                      onClick={() => setSelectedProject(project)}
                      title={`${project.name} - Sem datas definidas`}
                    >
                      <div className="h-full flex items-center px-2">
                        <span className="text-gray-700 text-xs font-medium truncate">
                          Sem data - {project.actualHours}h
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Project actions */}
                  {projectActions.map((action) => {
                    const actionPos = getActionPosition(action);
                    if (!actionPos) return null;
                    
                    return (
                      <div
                        key={action.id}
                        className="absolute top-9 h-2 bg-blue-400 rounded-sm opacity-70"
                        style={{
                          left: actionPos.left,
                          width: actionPos.width
                        }}
                        title={`${action.title} - ${action.status}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum projeto cadastrado</p>
          <p className="text-sm">Crie um projeto para visualizar no cronograma</p>
        </div>
      ) : visibleProjects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum projeto visível no período selecionado</p>
          <p className="text-sm">Ajuste o período ou adicione datas aos projetos</p>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProject.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={`${statusColors[selectedProject.status]} text-white mt-1`}>
                    {selectedProject.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Badge variant="outline" className={`${priorityColors[selectedProject.priority]} border-2 mt-1`}>
                    {selectedProject.priority}
                  </Badge>
                </div>
              </div>
              
              {selectedProject.startDate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data Início</label>
                    <p className="text-sm mt-1">{new Date(selectedProject.startDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {selectedProject.endDate && (
                    <div>
                      <label className="text-sm font-medium">Data Fim</label>
                      <p className="text-sm mt-1">{new Date(selectedProject.endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Horas Estimadas</label>
                  <p className="text-sm mt-1">{selectedProject.estimatedHours || 'Não definido'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Horas Realizadas</label>
                  <p className="text-sm mt-1">{selectedProject.actualHours}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Cronograma Gantt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GanttContent />
      </CardContent>
    </Card>
  );
}

export default GanttChart;
