import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    // Initialize roadmap data with comprehensive functionality list
    const phases: RoadmapPhase[] = [
      {
        id: 'phase1',
        title: 'Fase 1: Estrutura Inicial',
        description: 'Arquitetura base e fundações do sistema',
        progress: 85,
        items: [
          {
            id: 'arch-review',
            title: 'Revisar Arquitetura Atual',
            description: 'Analisar estrutura existente de tenants e customers para identificar integrações',
            status: 'completed',
            priority: 'high',
            category: 'Arquitetura',
            estimatedHours: 16,
            completedHours: 16
          },
          {
            id: 'clean-arch',
            title: 'Clean Architecture Implementada',
            description: 'Repository, Service, Controller e Routes layers implementadas',
            status: 'completed',
            priority: 'critical',
            category: 'Arquitetura',
            estimatedHours: 40,
            completedHours: 40
          },
          {
            id: 'multitenancy',
            title: 'Sistema Multi-tenant',
            description: 'Isolamento completo de dados por tenant com PostgreSQL schemas',
            status: 'completed',
            priority: 'critical',
            category: 'Arquitetura',
            estimatedHours: 60,
            completedHours: 60
          },
          {
            id: 'auth-system',
            title: 'Sistema de Autenticação Local',
            description: 'JWT tokens, sessões persistentes e middleware de autenticação',
            status: 'completed',
            priority: 'critical',
            category: 'Segurança',
            estimatedHours: 32,
            completedHours: 32
          },
          {
            id: 'customer-entities',
            title: 'Entidades CustomerCompany e UserGroup',
            description: 'Implementar relacionamentos entre clientes e organizações',
            status: 'in_progress',
            priority: 'high',
            category: 'Backend',
            estimatedHours: 24,
            completedHours: 18
          }
        ]
      },
      {
        id: 'phase2',
        title: 'Fase 2: Funcionalidades Core',
        description: 'Implementação das funcionalidades principais do sistema',
        progress: 70,
        items: [
          {
            id: 'dashboard-monitoring',
            title: 'Dashboard de Monitoramento',
            description: 'Visualização em tempo real do status de todos os módulos com score de saúde',
            status: 'completed',
            priority: 'high',
            category: 'Dashboard',
            estimatedHours: 32,
            completedHours: 32
          },
          {
            id: 'ticket-system',
            title: 'Sistema de Tickets Completo',
            description: 'CRUD completo, relacionamentos, templates e visibilidade por grupos',
            status: 'completed',
            priority: 'critical',
            category: 'Core',
            estimatedHours: 80,
            completedHours: 80
          },
          {
            id: 'email-integration',
            title: 'Integração de Email IMAP',
            description: 'Monitoramento em tempo real de emails com alexsolver@gmail.com',
            status: 'completed',
            priority: 'high',
            category: 'Integrações',
            estimatedHours: 48,
            completedHours: 48
          },
          {
            id: 'project-management',
            title: 'Gestão de Projetos',
            description: 'CRUD completo de projetos com ações, timeline e relatórios',
            status: 'completed',
            priority: 'medium',
            category: 'Projetos',
            estimatedHours: 40,
            completedHours: 40
          },
          {
            id: 'user-groups',
            title: 'Gerenciamento de Grupos de Usuários',
            description: 'Lógica para atribuição automática de tickets e análise de desempenho',
            status: 'in_progress',
            priority: 'high',
            category: 'Usuários',
            estimatedHours: 36,
            completedHours: 24
          },
          {
            id: 'company-management',
            title: 'Gestão de Empresas Clientes',
            description: 'Adaptar cadastro de clientes para incluir estrutura CustomerCompany',
            status: 'in_progress',
            priority: 'high',
            category: 'Clientes',
            estimatedHours: 28,
            completedHours: 20
          }
        ]
      },
      {
        id: 'phase3',
        title: 'Fase 3: Interfaces e UX',
        description: 'Desenvolvimento das interfaces de usuário e experiência',
        progress: 60,
        items: [
          {
            id: 'customer-interface',
            title: 'Interface de Gestão de Empresas',
            description: 'Componentes para administração das empresas clientes',
            status: 'planned',
            priority: 'medium',
            category: 'Frontend',
            estimatedHours: 32
          },
          {
            id: 'user-groups-ui',
            title: 'Interface de Grupos de Usuários',
            description: 'Expandir interface para incluir funcionalidades de User Groups',
            status: 'planned',
            priority: 'medium',
            category: 'Frontend',
            estimatedHours: 28
          },
          {
            id: 'ticket-visibility',
            title: 'Dashboard de Visibilidade de Tickets',
            description: 'Visualizações para relatórios e visibilidade de tickets por grupos',
            status: 'planned',
            priority: 'high',
            category: 'Dashboard',
            estimatedHours: 40
          },
          {
            id: 'skills-management',
            title: 'Gestão de Habilidades Técnicas',
            description: 'Interface completa para certificações e competências',
            status: 'completed',
            priority: 'medium',
            category: 'Recursos Humanos',
            estimatedHours: 36,
            completedHours: 36
          }
        ]
      },
      {
        id: 'phase4',
        title: 'Fase 4: Qualidade e Validação',
        description: 'Testes, validação e garantia de qualidade',
        progress: 40,
        items: [
          {
            id: 'integrity-check',
            title: 'Verificação Automática de Integridade',
            description: 'Escaneamento de arquivos críticos e validação de sintaxe',
            status: 'completed',
            priority: 'high',
            category: 'Qualidade',
            estimatedHours: 48,
            completedHours: 48
          },
          {
            id: 'integration-tests',
            title: 'Testes de Integração',
            description: 'Validar interações entre Customer Companies e User Groups',
            status: 'planned',
            priority: 'high',
            category: 'Testes',
            estimatedHours: 60
          },
          {
            id: 'performance-tests',
            title: 'Testes de Performance',
            description: 'Medir performance da nova estrutura e operações de banco',
            status: 'planned',
            priority: 'medium',
            category: 'Testes',
            estimatedHours: 40
          },
          {
            id: 'validation-system',
            title: 'Sistema de Validação de Mudanças',
            description: 'Pré-validação, pós-validação e rollback automático',
            status: 'backlog',
            priority: 'medium',
            category: 'Qualidade',
            estimatedHours: 56
          }
        ]
      },
      {
        id: 'phase5',
        title: 'Fase 5: Avançado e Otimização',
        description: 'Funcionalidades avançadas e otimizações',
        progress: 25,
        items: [
          {
            id: 'oauth2-integrations',
            title: 'Integrações OAuth2',
            description: 'Gmail OAuth2, Outlook OAuth2 e outras integrações',
            status: 'completed',
            priority: 'medium',
            category: 'Integrações',
            estimatedHours: 32,
            completedHours: 32
          },
          {
            id: 'advanced-auth',
            title: 'Autenticação Avançada',
            description: 'OAuth2, Magic Link, 2FA e proteção contra brute-force',
            status: 'planned',
            priority: 'high',
            category: 'Segurança',
            estimatedHours: 72
          },
          {
            id: 'feature-flags',
            title: 'Feature Flags por Tenant',
            description: 'Controle por tenant, rollout gradual e A/B testing',
            status: 'completed',
            priority: 'medium',
            category: 'Sistema',
            estimatedHours: 28,
            completedHours: 28
          },
          {
            id: 'cache-optimization',
            title: 'Cache e Performance',
            description: 'Redis para sessões, cache de queries e invalidação inteligente',
            status: 'planned',
            priority: 'medium',
            category: 'Performance',
            estimatedHours: 48
          },
          {
            id: 'ci-cd',
            title: 'CI/CD Completo',
            description: 'Pipeline automatizada, testes e Blue/Green Deployment',
            status: 'backlog',
            priority: 'low',
            category: 'DevOps',
            estimatedHours: 80
          }
        ]
      },
      {
        id: 'phase6',
        title: 'Fase 6: Documentação e Entrega',
        description: 'Finalização, documentação e entrega',
        progress: 30,
        items: [
          {
            id: 'api-documentation',
            title: 'Documentação Automática OpenAPI',
            description: 'Swagger para todas as APIs com exemplos e validação',
            status: 'planned',
            priority: 'medium',
            category: 'Documentação',
            estimatedHours: 32
          },
          {
            id: 'user-documentation',
            title: 'Documentação de Usuário',
            description: 'Guias de uso, tutorials e FAQ',
            status: 'planned',
            priority: 'medium',
            category: 'Documentação',
            estimatedHours: 48
          },
          {
            id: 'onboarding',
            title: 'Onboarding Wizard',
            description: 'Cadastro público, criação automática de tenant e emails de boas-vindas',
            status: 'backlog',
            priority: 'medium',
            category: 'UX',
            estimatedHours: 56
          },
          {
            id: 'billing-system',
            title: 'Sistema de Billing',
            description: 'Integração com Stripe e billing self-service',
            status: 'backlog',
            priority: 'low',
            category: 'Financeiro',
            estimatedHours: 72
          }
        ]
      }
    ];

    setRoadmapData(phases);
  }, []);

  const categories = [
    'all', 'Arquitetura', 'Backend', 'Frontend', 'Dashboard', 'Core', 
    'Integrações', 'Segurança', 'Usuários', 'Clientes', 'Projetos',
    'Qualidade', 'Testes', 'Performance', 'Sistema', 'DevOps',
    'Documentação', 'UX', 'Financeiro', 'Recursos Humanos'
  ];

  const filteredPhases = roadmapData.map(phase => ({
    ...phase,
    items: phase.items.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
      return categoryMatch && statusMatch;
    })
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'planned':
        return <Target className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <Star className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'Arquitetura': Code2,
      'Backend': Database,
      'Frontend': Globe,
      'Dashboard': BarChart3,
      'Segurança': Shield,
      'Usuários': Users,
      'Sistema': Settings
    };
    const Icon = iconMap[category];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const overallProgress = Math.round(
    roadmapData.reduce((sum, phase) => sum + phase.progress, 0) / roadmapData.length
  );

  const totalItems = roadmapData.reduce((sum, phase) => sum + phase.items.length, 0);
  const completedItems = roadmapData.reduce(
    (sum, phase) => sum + phase.items.filter(item => item.status === 'completed').length, 
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roadmap de Desenvolvimento</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso de implementação das funcionalidades do sistema
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
          <div className="text-sm text-muted-foreground">Progresso Geral</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{completedItems}</div>
                <div className="text-sm text-muted-foreground">Concluídos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {roadmapData.reduce((sum, phase) => 
                    sum + phase.items.filter(item => item.status === 'in_progress').length, 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Em Progresso</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {roadmapData.reduce((sum, phase) => 
                    sum + phase.items.filter(item => item.status === 'planned').length, 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Planejados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Circle className="h-8 w-8 text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {roadmapData.reduce((sum, phase) => 
                    sum + phase.items.filter(item => item.status === 'backlog').length, 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Backlog</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium">Categoria:</span>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'Todas' : category}
            </Button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium">Status:</span>
          {Object.entries(statusLabels).map(([status, label]) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
            >
              {label}
            </Button>
          ))}
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            Todos
          </Button>
        </div>
      </div>

      {/* Roadmap Phases */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          {filteredPhases.map((phase) => (
            <Card key={phase.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{phase.title}</CardTitle>
                    <CardDescription>{phase.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{phase.progress}%</div>
                    <Progress value={phase.progress} className="w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phase.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        {getPriorityIcon(item.priority)}
                        {getCategoryIcon(item.category)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge variant="outline" className={priorityColors[item.priority]}>
                            {priorityLabels[item.priority]}
                          </Badge>
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        
                        {(item.estimatedHours || item.completedHours) && (
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            {item.estimatedHours && (
                              <span>Estimado: {item.estimatedHours}h</span>
                            )}
                            {item.completedHours && (
                              <span>Realizado: {item.completedHours}h</span>
                            )}
                            {item.estimatedHours && item.completedHours && (
                              <Progress 
                                value={(item.completedHours / item.estimatedHours) * 100} 
                                className="w-20 h-2"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Badge className={statusColors[item.status]}>
                        {statusLabels[item.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(statusLabels).map(([status, label]) => (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span>{label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {roadmapData.flatMap(phase => 
                    phase.items
                      .filter(item => item.status === status)
                      .filter(item => {
                        const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
                        return categoryMatch;
                      })
                      .map(item => (
                        <Card key={item.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-sm">{item.title}</h5>
                              {getPriorityIcon(item.priority)}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" size="sm">{item.category}</Badge>
                              <Badge size="sm" className={priorityColors[item.priority]}>
                                {priorityLabels[item.priority]}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <div className="space-y-6">
            {roadmapData.map((phase) => (
              <Card key={phase.id}>
                <CardHeader>
                  <CardTitle>{phase.title}</CardTitle>
                  <CardDescription>{phase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progresso da Fase</span>
                      <span className="text-sm font-medium">{phase.progress}%</span>
                    </div>
                    <Progress value={phase.progress} />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {phase.items.filter(item => item.status === 'completed').length}
                        </div>
                        <div className="text-muted-foreground">Concluídos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {phase.items.filter(item => item.status === 'in_progress').length}
                        </div>
                        <div className="text-muted-foreground">Em Progresso</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                          {phase.items.filter(item => item.status === 'planned').length}
                        </div>
                        <div className="text-muted-foreground">Planejados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">
                          {phase.items.filter(item => item.status === 'backlog').length}
                        </div>
                        <div className="text-muted-foreground">Backlog</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}