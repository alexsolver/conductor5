import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle, Clock, AlertTriangle, Star, Target, Users, Settings, Shield, BarChart3, Code2, Database, Globe } from 'lucide-react';

// Types for roadmap items
interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'planned' | 'backlog';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  estimatedHours?: number;
  completedHours?: number;
  dependencies?: string[];
  assignedTo?: string;
  dueDate?: string;
}

interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  progress: number;
  items: RoadmapItem[];
}

const statusColors = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  planned: 'bg-yellow-500',
  backlog: 'bg-gray-400'
};

const statusLabels = {
  completed: 'Concluído',
  in_progress: 'Em Progresso',
  planned: 'Planejado',
  backlog: 'Backlog'
};

const priorityColors = {
  low: 'border-gray-300 text-gray-600',
  medium: 'border-yellow-400 text-yellow-600',
  high: 'border-orange-400 text-orange-600',
  critical: 'border-red-500 text-red-600'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

export default function Roadmap() {
  const [roadmapData, setRoadmapData] = useState<RoadmapPhase[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    // Initialize roadmap data with project management functionality list
    const phases: RoadmapPhase[] = [
      {
        id: 'implemented',
        title: '✅ Recursos Implementados',
        description: 'Funcionalidades já desenvolvidas e operacionais',
        progress: 100,
        items: [
          {
            id: 'project-crud',
            title: 'Criação, edição e exclusão de projetos',
            description: 'Sistema completo de CRUD para gestão de projetos',
            status: 'completed',
            priority: 'high',
            category: 'Gestão Básica',
            estimatedHours: 20,
            completedHours: 25
          },
          {
            id: 'project-status',
            title: 'Status do projeto (planejamento, aprovado, em execução, etc.)',
            description: 'Sistema de status completo com workflow de aprovação',
            status: 'completed',
            priority: 'high',
            category: 'Gestão Básica',
            estimatedHours: 15,
            completedHours: 18
          },
          {
            id: 'project-priorities',
            title: 'Prioridades (baixa, média, alta, crítica)',
            description: 'Sistema de priorização com indicadores visuais',
            status: 'completed',
            priority: 'medium',
            category: 'Gestão Básica',
            estimatedHours: 10,
            completedHours: 12
          },
          {
            id: 'project-fields',
            title: 'Campos básicos (nome, descrição, datas, orçamento, horas)',
            description: 'Estrutura completa de dados do projeto com validação',
            status: 'completed',
            priority: 'high',
            category: 'Gestão Básica',
            estimatedHours: 25,
            completedHours: 30
          },
          {
            id: 'project-tags',
            title: 'Sistema de tags',
            description: 'Classificação flexível de projetos por tags customizáveis',
            status: 'completed',
            priority: 'medium',
            category: 'Gestão Básica',
            estimatedHours: 15,
            completedHours: 18
          },
          {
            id: 'project-dashboard',
            title: 'Dashboard com estatísticas',
            description: 'Visão geral com métricas e indicadores de performance',
            status: 'completed',
            priority: 'high',
            category: 'Interface',
            estimatedHours: 20,
            completedHours: 22
          },
          {
            id: 'project-listing',
            title: 'Listagem de projetos com filtros',
            description: 'Interface de busca e filtragem avançada',
            status: 'completed',
            priority: 'high',
            category: 'Interface',
            estimatedHours: 18,
            completedHours: 20
          },
          {
            id: 'project-search',
            title: 'Busca por nome e descrição',
            description: 'Sistema de busca textual em tempo real',
            status: 'completed',
            priority: 'medium',
            category: 'Interface',
            estimatedHours: 12,
            completedHours: 10
          },
          {
            id: 'project-cards',
            title: 'Cards visuais para cada projeto',
            description: 'Interface visual com cards informativos e ações rápidas',
            status: 'completed',
            priority: 'medium',
            category: 'Interface',
            estimatedHours: 15,
            completedHours: 10
          }
        ]
      },
      {
        id: 'project-actions',
        title: '✅ Ações de Projeto',
        description: 'Sistema de ações internas e externas para projetos',
        progress: 100,
        items: [
          {
            id: 'internal-actions',
            title: 'Ações internas (reuniões, aprovações, revisões, tarefas)',
            description: 'Sistema de workflow interno com aprovações e tarefas',
            status: 'completed',
            priority: 'high',
            category: 'Ações',
            estimatedHours: 35,
            completedHours: 35
          },
          {
            id: 'external-actions',
            title: 'Ações externas (entregas, validações, reuniões com cliente)',
            description: 'Gestão de interações com clientes e entregas',
            status: 'completed',
            priority: 'high',
            category: 'Ações',
            estimatedHours: 30,
            completedHours: 30
          },
          {
            id: 'milestones',
            title: 'Marcos e pontos de controle',
            description: 'Sistema de marcos com datas fixas e validações',
            status: 'completed',
            priority: 'medium',
            category: 'Ações',
            estimatedHours: 25,
            completedHours: 25
          },
          {
            id: 'dependencies',
            title: 'Sistema de dependências entre ações',
            description: 'Controle de precedências e dependências entre tarefas',
            status: 'completed',
            priority: 'medium',
            category: 'Ações',
            estimatedHours: 30,
            completedHours: 30
          }
        ]
      },
      {
        id: 'team-management',
        title: '👥 Gestão de Equipe e Recursos',
        description: 'Gerenciamento completo de equipes e recursos',
        progress: 0,
        items: [
          {
            id: 'project-manager',
            title: 'Gerente de projeto designado',
            description: 'Atribuição e gestão de gerentes de projeto',
            status: 'planned',
            priority: 'high',
            category: 'Equipe',
            estimatedHours: 25
          },
          {
            id: 'team-members',
            title: 'Membros da equipe com papéis',
            description: 'Sistema de papéis e responsabilidades da equipe',
            status: 'planned',
            priority: 'high',
            category: 'Equipe',
            estimatedHours: 40
          },
          {
            id: 'capacity-control',
            title: 'Controle de capacidade e disponibilidade',
            description: 'Monitoramento de carga de trabalho e disponibilidade',
            status: 'planned',
            priority: 'medium',
            category: 'Recursos',
            estimatedHours: 45
          },
          {
            id: 'resource-calendar',
            title: 'Calendário de recursos',
            description: 'Visualização temporal de alocação de recursos',
            status: 'planned',
            priority: 'medium',
            category: 'Recursos',
            estimatedHours: 35
          },
          {
            id: 'workload-distribution',
            title: 'Distribuição automática de carga',
            description: 'Sistema inteligente de distribuição de tarefas',
            status: 'planned',
            priority: 'low',
            category: 'Automação',
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'client-stakeholders',
        title: '💼 Cliente e Stakeholders',
        description: 'Gestão de relacionamento com clientes e stakeholders',
        progress: 0,
        items: [
          {
            id: 'client-management',
            title: 'Gestão de clientes vinculados',
            description: 'Associação e gestão de clientes por projeto',
            status: 'planned',
            priority: 'high',
            category: 'Clientes',
            estimatedHours: 30
          },
          {
            id: 'external-contacts',
            title: 'Contatos externos por projeto',
            description: 'Base de contatos específicos para cada projeto',
            status: 'planned',
            priority: 'medium',
            category: 'Clientes',
            estimatedHours: 25
          },
          {
            id: 'client-portal',
            title: 'Portal do cliente para acompanhamento',
            description: 'Interface dedicada para acompanhamento de projetos',
            status: 'planned',
            priority: 'medium',
            category: 'Portal',
            estimatedHours: 50
          },
          {
            id: 'stakeholder-communication',
            title: 'Comunicação direta com stakeholders',
            description: 'Sistema de comunicação integrada com stakeholders',
            status: 'planned',
            priority: 'medium',
            category: 'Comunicação',
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'financial-management',
        title: '💰 Gestão Financeira Avançada',
        description: 'Controle financeiro completo de projetos',
        progress: 0,
        items: [
          {
            id: 'cost-control',
            title: 'Controle de custos detalhado',
            description: 'Monitoramento detalhado de custos por categoria',
            status: 'planned',
            priority: 'high',
            category: 'Financeiro',
            estimatedHours: 35
          },
          {
            id: 'project-billing',
            title: 'Faturamento por projeto',
            description: 'Sistema de faturamento baseado em projetos',
            status: 'planned',
            priority: 'high',
            category: 'Financeiro',
            estimatedHours: 40
          },
          {
            id: 'profitability-analysis',
            title: 'Análise de rentabilidade',
            description: 'Relatórios de lucratividade e ROI por projeto',
            status: 'planned',
            priority: 'medium',
            category: 'Analytics',
            estimatedHours: 30
          },
          {
            id: 'financial-reports',
            title: 'Relatórios financeiros',
            description: 'Dashboards e relatórios financeiros detalhados',
            status: 'planned',
            priority: 'medium',
            category: 'Relatórios',
            estimatedHours: 35
          },
          {
            id: 'budget-approvals',
            title: 'Aprovações de orçamento',
            description: 'Workflow de aprovação de orçamentos e gastos',
            status: 'planned',
            priority: 'medium',
            category: 'Aprovações',
            estimatedHours: 20
          }
        ]
      },
      {
        id: 'planning-analytics',
        title: '📊 Planejamento e Analytics',
        description: 'Ferramentas avançadas de planejamento e análise',
        progress: 0,
        items: [
          {
            id: 'gantt-chart',
            title: 'Gráfico de Gantt',
            description: 'Visualização temporal avançada de projetos',
            status: 'planned',
            priority: 'medium',
            category: 'Planejamento',
            estimatedHours: 50
          },
          {
            id: 'visual-timeline',
            title: 'Cronograma visual',
            description: 'Interface visual para planejamento temporal',
            status: 'planned',
            priority: 'medium',
            category: 'Planejamento',
            estimatedHours: 40
          },
          {
            id: 'executive-dashboard',
            title: 'Dashboard executivo',
            description: 'Visão estratégica para gestores e executivos',
            status: 'planned',
            priority: 'high',
            category: 'Dashboard',
            estimatedHours: 35
          },
          {
            id: 'performance-reports',
            title: 'Relatórios de performance',
            description: 'Análise detalhada de performance de projetos',
            status: 'planned',
            priority: 'medium',
            category: 'Relatórios',
            estimatedHours: 30
          },
          {
            id: 'custom-kpis',
            title: 'KPIs personalizáveis',
            description: 'Sistema de indicadores customizáveis por usuário',
            status: 'planned',
            priority: 'low',
            category: 'Analytics',
            estimatedHours: 25
          },
          {
            id: 'trend-analysis',
            title: 'Análise de tendências',
            description: 'Identificação de padrões e tendências em projetos',
            status: 'planned',
            priority: 'low',
            category: 'Analytics',
            estimatedHours: 20
          }
        ]
      },
      {
        id: 'automation-integrations',
        title: '🔧 Automação e Integrações',
        description: 'Automação de processos e integrações externas',
        progress: 0,
        items: [
          {
            id: 'custom-workflows',
            title: 'Workflows personalizados',
            description: 'Sistema de workflow customizável por projeto',
            status: 'backlog',
            priority: 'medium',
            category: 'Automação',
            estimatedHours: 45
          },
          {
            id: 'automatic-approvals',
            title: 'Aprovações automáticas',
            description: 'Sistema inteligente de aprovações baseado em regras',
            status: 'backlog',
            priority: 'medium',
            category: 'Automação',
            estimatedHours: 35
          },
          {
            id: 'smart-notifications',
            title: 'Notificações inteligentes',
            description: 'Sistema avançado de notificações contextuais',
            status: 'backlog',
            priority: 'low',
            category: 'Notificações',
            estimatedHours: 30
          },
          {
            id: 'calendar-sync',
            title: 'Sincronização com calendários',
            description: 'Integração com Google Calendar, Outlook e outros',
            status: 'backlog',
            priority: 'low',
            category: 'Integrações',
            estimatedHours: 25
          },
          {
            id: 'crm-integration',
            title: 'Integração com CRM',
            description: 'Sincronização com sistemas CRM externos',
            status: 'backlog',
            priority: 'medium',
            category: 'Integrações',
            estimatedHours: 30
          },
          {
            id: 'external-apis',
            title: 'APIs para sistemas externos',
            description: 'APIs RESTful para integração com terceiros',
            status: 'backlog',
            priority: 'low',
            category: 'APIs',
            estimatedHours: 15
          }
        ]
      },
      {
        id: 'documentation-quality',
        title: '📚 Documentação e Qualidade',
        description: 'Gestão de documentos e controle de qualidade',
        progress: 0,
        items: [
          {
            id: 'document-repository',
            title: 'Repositório de documentos',
            description: 'Sistema centralizado de gestão de documentos',
            status: 'backlog',
            priority: 'medium',
            category: 'Documentação',
            estimatedHours: 30
          },
          {
            id: 'file-versioning',
            title: 'Versionamento de arquivos',
            description: 'Controle de versões para documentos e arquivos',
            status: 'backlog',
            priority: 'medium',
            category: 'Documentação',
            estimatedHours: 25
          },
          {
            id: 'document-templates',
            title: 'Templates de documentos',
            description: 'Biblioteca de templates para documentos padrão',
            status: 'backlog',
            priority: 'low',
            category: 'Templates',
            estimatedHours: 20
          },
          {
            id: 'acceptance-criteria',
            title: 'Critérios de aceitação',
            description: 'Sistema de definição e validação de critérios',
            status: 'backlog',
            priority: 'medium',
            category: 'Qualidade',
            estimatedHours: 15
          },
          {
            id: 'quality-checklists',
            title: 'Checklists de qualidade',
            description: 'Listas de verificação para controle de qualidade',
            status: 'backlog',
            priority: 'medium',
            category: 'Qualidade',
            estimatedHours: 15
          },
          {
            id: 'risk-management',
            title: 'Gestão de riscos',
            description: 'Identificação, análise e mitigação de riscos',
            status: 'backlog',
            priority: 'low',
            category: 'Riscos',
            estimatedHours: 15
          }
        ]
      }
    ];

    setRoadmapData(phases);
  }, []);

  const filteredData = roadmapData.map(phase => ({
    ...phase,
    items: phase.items.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
      return categoryMatch && statusMatch;
    })
  }));

  const totalItems = roadmapData.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedItems = roadmapData.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.status === 'completed').length, 0
  );
  const overallProgress = Math.round((completedItems / totalItems) * 100);

  const categories = Array.from(new Set(roadmapData.flatMap(phase => phase.items.map(item => item.category))));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'planned':
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'backlog':
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Gestão Básica': <Target className="h-4 w-4" />,
      'Interface': <Globe className="h-4 w-4" />,
      'Ações': <Settings className="h-4 w-4" />,
      'Equipe': <Users className="h-4 w-4" />,
      'Recursos': <BarChart3 className="h-4 w-4" />,
      'Automação': <Code2 className="h-4 w-4" />,
      'Clientes': <Users className="h-4 w-4" />,
      'Portal': <Globe className="h-4 w-4" />,
      'Comunicação': <Settings className="h-4 w-4" />,
      'Financeiro': <BarChart3 className="h-4 w-4" />,
      'Analytics': <BarChart3 className="h-4 w-4" />,
      'Relatórios': <BarChart3 className="h-4 w-4" />,
      'Aprovações': <CheckCircle className="h-4 w-4" />,
      'Planejamento': <Target className="h-4 w-4" />,
      'Dashboard': <BarChart3 className="h-4 w-4" />,
      'Notificações': <Settings className="h-4 w-4" />,
      'Integrações': <Code2 className="h-4 w-4" />,
      'APIs': <Database className="h-4 w-4" />,
      'Documentação': <Database className="h-4 w-4" />,
      'Templates': <Database className="h-4 w-4" />,
      'Qualidade': <Shield className="h-4 w-4" />,
      'Riscos': <AlertTriangle className="h-4 w-4" />
    };
    return iconMap[category] || <Settings className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Roadmap de Projetos
        </h1>
        <p className="text-gray-600 mt-2">
          Planejamento e evolução das funcionalidades de gestão de projetos
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              {completedItems} de {totalItems} funcionalidades implementadas
            </span>
            <span className="text-2xl font-bold text-green-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roadmap Phases */}
      <div className="space-y-6">
        {filteredData.map((phase) => (
          <Card key={phase.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{phase.title}</CardTitle>
                  <CardDescription>{phase.description}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{phase.progress}%</div>
                  <div className="text-sm text-gray-500">
                    {phase.items.filter(item => item.status === 'completed').length} de {phase.items.length} concluídas
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phase.items.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <Badge variant="outline" className={statusColors[item.status]}>
                            <div className={`w-2 h-2 rounded-full ${statusColors[item.status]} mr-2`} />
                            {statusLabels[item.status]}
                          </Badge>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${priorityColors[item.priority]} border-2`}
                        >
                          {priorityLabels[item.priority]}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-semibold leading-tight">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                        </div>
                        {item.estimatedHours && (
                          <div className="text-gray-500">
                            {item.completedHours ? `${item.completedHours}/` : ''}{item.estimatedHours}h
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}