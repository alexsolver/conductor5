
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Database, 
  Code, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Warehouse,
  Users,
  Truck,
  Settings,
  FileText,
  Shield,
  BarChart3
} from "lucide-react";

interface ImplementationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  dependencies: string[];
  estimatedTime: string;
  category: 'database' | 'backend' | 'frontend' | 'testing' | 'integration';
}

interface ModuleComponent {
  name: string;
  description: string;
  icon: any;
  status: 'not_started' | 'in_progress' | 'completed' | 'error';
  steps: ImplementationStep[];
  priority: 'high' | 'medium' | 'low';
}

export default function PartsServicesImplementationControl() {
  const [selectedModule, setSelectedModule] = useState<string>('items');
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  const moduleComponents: Record<string, ModuleComponent> = {
    items: {
      name: "Gestão de Itens",
      description: "Cadastro e gestão de peças e serviços com vínculos",
      icon: Package,
      status: 'not_started',
      priority: 'high',
      steps: [
        {
          id: 'items-schema',
          name: 'Schema de Banco - Itens',
          description: 'Criar tabelas para itens, vínculos e anexos',
          status: 'pending',
          progress: 0,
          dependencies: [],
          estimatedTime: '30 min',
          category: 'database'
        },
        {
          id: 'items-entities',
          name: 'Entidades de Domínio',
          description: 'Criar entidades Item, ItemLink, ItemAttachment',
          status: 'pending',
          progress: 0,
          dependencies: ['items-schema'],
          estimatedTime: '45 min',
          category: 'backend'
        },
        {
          id: 'items-repositories',
          name: 'Repositórios',
          description: 'Implementar repositórios com padrão CRUD completo',
          status: 'pending',
          progress: 0,
          dependencies: ['items-entities'],
          estimatedTime: '60 min',
          category: 'backend'
        },
        {
          id: 'items-controllers',
          name: 'Controllers e Rotas',
          description: 'APIs REST para gestão de itens',
          status: 'pending',
          progress: 0,
          dependencies: ['items-repositories'],
          estimatedTime: '45 min',
          category: 'backend'
        },
        {
          id: 'items-frontend',
          name: 'Interface Frontend',
          description: 'Páginas e componentes para gestão de itens',
          status: 'pending',
          progress: 0,
          dependencies: ['items-controllers'],
          estimatedTime: '90 min',
          category: 'frontend'
        }
      ]
    },
    inventory: {
      name: "Controle de Estoque",
      description: "Gestão multi-localização com movimentações e inventário",
      icon: Warehouse,
      status: 'not_started',
      priority: 'high',
      steps: [
        {
          id: 'inventory-schema',
          name: 'Schema de Estoque',
          description: 'Tabelas para localizações, estoques e movimentações',
          status: 'pending',
          progress: 0,
          dependencies: ['items-schema'],
          estimatedTime: '45 min',
          category: 'database'
        },
        {
          id: 'inventory-entities',
          name: 'Entidades de Estoque',
          description: 'Location, Stock, StockMovement, Inventory',
          status: 'pending',
          progress: 0,
          dependencies: ['inventory-schema'],
          estimatedTime: '60 min',
          category: 'backend'
        },
        {
          id: 'inventory-logic',
          name: 'Lógica de Negócio',
          description: 'Regras de movimentação e controle de níveis',
          status: 'pending',
          progress: 0,
          dependencies: ['inventory-entities'],
          estimatedTime: '75 min',
          category: 'backend'
        },
        {
          id: 'inventory-frontend',
          name: 'Interface de Estoque',
          description: 'Dashboard e controles de movimentação',
          status: 'pending',
          progress: 0,
          dependencies: ['inventory-logic'],
          estimatedTime: '120 min',
          category: 'frontend'
        }
      ]
    },
    suppliers: {
      name: "Fornecedores",
      description: "Cadastro e catálogo de fornecedores",
      icon: Users,
      status: 'not_started',
      priority: 'medium',
      steps: [
        {
          id: 'suppliers-schema',
          name: 'Schema de Fornecedores',
          description: 'Tabelas para fornecedores e catálogos',
          status: 'pending',
          progress: 0,
          dependencies: ['items-schema'],
          estimatedTime: '30 min',
          category: 'database'
        },
        {
          id: 'suppliers-entities',
          name: 'Entidades de Fornecedores',
          description: 'Supplier, SupplierCatalog, Quote',
          status: 'pending',
          progress: 0,
          dependencies: ['suppliers-schema'],
          estimatedTime: '45 min',
          category: 'backend'
        },
        {
          id: 'suppliers-apis',
          name: 'APIs de Fornecedores',
          description: 'CRUD e cotações múltiplas',
          status: 'pending',
          progress: 0,
          dependencies: ['suppliers-entities'],
          estimatedTime: '60 min',
          category: 'backend'
        },
        {
          id: 'suppliers-frontend',
          name: 'Interface de Fornecedores',
          description: 'Gestão e cotações',
          status: 'pending',
          progress: 0,
          dependencies: ['suppliers-apis'],
          estimatedTime: '75 min',
          category: 'frontend'
        }
      ]
    },
    logistics: {
      name: "Logística",
      description: "Transferências e distribuição",
      icon: Truck,
      status: 'not_started',
      priority: 'medium',
      steps: [
        {
          id: 'logistics-schema',
          name: 'Schema de Logística',
          description: 'Transferências e expedições',
          status: 'pending',
          progress: 0,
          dependencies: ['inventory-schema'],
          estimatedTime: '30 min',
          category: 'database'
        },
        {
          id: 'logistics-entities',
          name: 'Entidades de Logística',
          description: 'Transfer, Shipment, Delivery',
          status: 'pending',
          progress: 0,
          dependencies: ['logistics-schema'],
          estimatedTime: '45 min',
          category: 'backend'
        },
        {
          id: 'logistics-apis',
          name: 'APIs de Logística',
          description: 'Controle de transferências',
          status: 'pending',
          progress: 0,
          dependencies: ['logistics-entities'],
          estimatedTime: '60 min',
          category: 'backend'
        }
      ]
    },
    assets: {
      name: "Controle de Ativos",
      description: "Gestão de ativos com hierarquia",
      icon: Settings,
      status: 'not_started',
      priority: 'medium',
      steps: [
        {
          id: 'assets-schema',
          name: 'Schema de Ativos',
          description: 'Hierarquia de ativos e rastreamento',
          status: 'pending',
          progress: 0,
          dependencies: ['items-schema'],
          estimatedTime: '45 min',
          category: 'database'
        },
        {
          id: 'assets-entities',
          name: 'Entidades de Ativos',
          description: 'Asset, AssetHierarchy, AssetMaintenance',
          status: 'pending',
          progress: 0,
          dependencies: ['assets-schema'],
          estimatedTime: '60 min',
          category: 'backend'
        }
      ]
    },
    pricing: {
      name: "Lista de Preços (LPU)",
      description: "Tabelas de preços unitários",
      icon: BarChart3,
      status: 'not_started',
      priority: 'low',
      steps: [
        {
          id: 'pricing-schema',
          name: 'Schema de Preços',
          description: 'LPUs e versionamento',
          status: 'pending',
          progress: 0,
          dependencies: ['items-schema'],
          estimatedTime: '30 min',
          category: 'database'
        },
        {
          id: 'pricing-entities',
          name: 'Entidades de Preços',
          description: 'PriceList, PriceItem, PriceVersion',
          status: 'pending',
          progress: 0,
          dependencies: ['pricing-schema'],
          estimatedTime: '45 min',
          category: 'backend'
        }
      ]
    },
    compliance: {
      name: "Compliance e Auditoria",
      description: "Rastreabilidade e controle de acesso",
      icon: Shield,
      status: 'not_started',
      priority: 'low',
      steps: [
        {
          id: 'compliance-schema',
          name: 'Schema de Auditoria',
          description: 'Logs e rastreabilidade',
          status: 'pending',
          progress: 0,
          dependencies: ['items-schema'],
          estimatedTime: '30 min',
          category: 'database'
        }
      ]
    }
  };

  const executeStep = async (stepId: string) => {
    toast({
      title: "Executando Etapa",
      description: `Iniciando execução da etapa: ${stepId}`,
    });
    
    // Simulate step execution
    setTimeout(() => {
      toast({
        title: "Etapa Concluída",
        description: `Etapa ${stepId} executada com sucesso!`,
      });
    }, 2000);
  };

  const startImplementation = async (moduleId: string) => {
    toast({
      title: "Iniciando Implementação",
      description: `Começando implementação do módulo: ${moduleComponents[moduleId].name}`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'database': return 'bg-blue-100 text-blue-800';
      case 'backend': return 'bg-green-100 text-green-800';
      case 'frontend': return 'bg-purple-100 text-purple-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'integration': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Controle de Implantação - Peças e Serviços
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sistema de controle e execução da implementação modular
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => startImplementation('items')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Implementação
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso Geral</CardTitle>
          <CardDescription>Status da implementação do módulo Peças e Serviços</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progresso Total</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-500">Módulos Completos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-gray-500">Em Progresso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">7</div>
                <div className="text-sm text-gray-500">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-500">Etapas Concluídas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
          <TabsTrigger value="dependencies">Dependências</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(moduleComponents).map(([moduleId, module]) => {
              const ModuleIcon = module.icon;
              const completedSteps = module.steps.filter(step => step.status === 'completed').length;
              const totalSteps = module.steps.length;
              const moduleProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

              return (
                <Card key={moduleId} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ModuleIcon className="h-8 w-8 text-blue-600" />
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{module.name}</span>
                            <Badge variant={module.priority === 'high' ? 'destructive' : module.priority === 'medium' ? 'secondary' : 'outline'}>
                              {module.priority}
                            </Badge>
                            <Badge variant={module.status === 'completed' ? 'default' : module.status === 'in_progress' ? 'secondary' : 'outline'}>
                              {getStatusIcon(module.status)}
                              <span className="ml-1">{module.status.replace('_', ' ')}</span>
                            </Badge>
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{Math.round(moduleProgress)}%</div>
                        <div className="text-sm text-gray-500">{completedSteps}/{totalSteps} etapas</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={moduleProgress} className="h-2" />
                      
                      {/* Steps List */}
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {module.steps.map((step, index) => (
                            <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="text-sm font-medium text-gray-500">
                                  {index + 1}
                                </div>
                                {getStatusIcon(step.status)}
                                <div className="flex-1">
                                  <div className="font-medium">{step.name}</div>
                                  <div className="text-sm text-gray-500">{step.description}</div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className={getCategoryColor(step.category)}>
                                      {step.category}
                                    </Badge>
                                    <span className="text-xs text-gray-500">~{step.estimatedTime}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {step.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => executeStep(step.id)}
                                    disabled={step.dependencies.length > 0}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Executar
                                  </Button>
                                )}
                                {step.progress > 0 && step.progress < 100 && (
                                  <Progress value={step.progress} className="w-16 h-2" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModule(moduleId)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => startImplementation(moduleId)}
                          disabled={module.status === 'completed'}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Módulo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Implementação</CardTitle>
              <CardDescription>Sequência recomendada de execução</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ordem de Prioridade</AlertTitle>
                <AlertDescription>
                  1. Gestão de Itens (base fundamental)<br />
                  2. Controle de Estoque (dependente dos itens)<br />
                  3. Fornecedores (paralelo ao estoque)<br />
                  4. Logística (após estoque)<br />
                  5. Controle de Ativos<br />
                  6. Lista de Preços<br />
                  7. Compliance e Auditoria
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Dependências</CardTitle>
              <CardDescription>Relações entre módulos e etapas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p><strong>Itens:</strong> Base fundamental - não possui dependências</p>
                <p><strong>Estoque:</strong> Depende do módulo de Itens</p>
                <p><strong>Fornecedores:</strong> Depende do módulo de Itens</p>
                <p><strong>Logística:</strong> Depende do módulo de Estoque</p>
                <p><strong>Ativos:</strong> Depende do módulo de Itens</p>
                <p><strong>Preços:</strong> Depende do módulo de Itens</p>
                <p><strong>Compliance:</strong> Pode ser implementado independentemente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
