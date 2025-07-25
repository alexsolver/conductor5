import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Package, 
  Warehouse, 
  Users, 
  Wrench, 
  Shield, 
  DollarSign,
  FileText,
  Database,
  Globe,
  Settings,
  BarChart3
} from "lucide-react";

// Definição dos módulos e suas funcionalidades
const moduleDefinitions = [
  {
    id: 1,
    name: "Catálogo e Cadastro de Itens",
    icon: Package,
    description: "Cadastro completo de materiais, serviços e ativos",
    features: [
      "Campos básicos do item (ativo, tipo, nome, código, descrição)",
      "Unidade de medida e categorização",
      "Plano de manutenção e checklist padrão",
      "Sistema de anexos e uploads",
      "Vínculos com outros itens (kits, substitutos)",
      "Vínculos com clientes (SKU, códigos, asset)",
      "Vínculos com fornecedores (part number, códigos)",
      "Compatibilidade item ↔ equipamento",
      "Documentação técnica",
      "Status do item (ativo, análise, descontinuado)"
    ],
    progress: 85,
    status: "in-progress",
    priority: "high"
  },
  {
    id: 2,
    name: "Gestão de Estoque",
    icon: Warehouse,
    description: "Controle multi-local de estoque e movimentações",
    features: [
      "Estoque em armazéns fixos e móveis",
      "Controle de níveis (mín, máx, reposição, lote)",
      "Inventário físico (cíclico e geral)",
      "Estoque consignado",
      "Movimentações (entrada, saída, transferência)",
      "Reservas para serviços programados",
      "Controle de lotes e números de série",
      "Controle de validade",
      "Kits de serviço por manutenção"
    ],
    progress: 0,
    status: "pending",
    priority: "high"
  },
  {
    id: 3,
    name: "Gestão de Fornecedores",
    icon: Users,
    description: "Cadastro e gestão completa de fornecedores",
    features: [
      "Cadastro completo de fornecedores",
      "Catálogo de itens por fornecedor",
      "Solicitação de cotações múltiplas",
      "Gestão de cotações",
      "Histórico de preços",
      "Performance do fornecedor",
      "Avaliação e rating",
      "Contratos e acordos"
    ],
    progress: 0,
    status: "pending",
    priority: "medium"
  },
  {
    id: 4,
    name: "Gestão de Serviços",
    icon: Wrench,
    description: "Catálogo e execução de serviços técnicos",
    features: [
      "Catálogo padronizado de serviços",
      "Tempo estimado por tipo de serviço",
      "Checklist e procedimentos técnicos",
      "Lista de itens necessários",
      "Histórico de execução",
      "Controle de garantias",
      "Classificação por complexidade",
      "Integração com OS"
    ],
    progress: 0,
    status: "pending",
    priority: "medium"
  },
  {
    id: 5,
    name: "Controle de Ativos",
    icon: Shield,
    description: "Gestão hierárquica e rastreamento de ativos",
    features: [
      "Cadastro hierárquico (máquina > componente)",
      "Geolocalização e rastreamento",
      "Histórico de manutenção completo",
      "Medidores (horímetro, km, tempo uso)",
      "Garantias e contratos vinculados",
      "Etiquetas QR code ou RFID",
      "Vínculo com OS e custos",
      "Ciclo de vida do ativo"
    ],
    progress: 0,
    status: "pending",
    priority: "medium"
  },
  {
    id: 6,
    name: "Lista de Preços Unitários (LPU)",
    icon: DollarSign,
    description: "Gestão avançada de precificação",
    features: [
      "Múltiplas LPUs (cliente, contrato, centro custo)",
      "Versionamento e vigência",
      "Preços para materiais, ativos, serviços",
      "Descontos por escala",
      "Margens automáticas",
      "Preços especiais",
      "Histórico de alterações",
      "Simulação de preços",
      "Aplicação automática em OS",
      "Geração de orçamentos"
    ],
    progress: 0,
    status: "pending",
    priority: "low"
  },
  {
    id: 7,
    name: "Compliance e Auditoria",
    icon: FileText,
    description: "Rastreabilidade e compliance completo",
    features: [
      "Rastreabilidade completa de movimentações",
      "Logs de auditoria detalhados",
      "Controle de acesso e permissões",
      "Certificações de qualidade",
      "Processos de recall",
      "Compliance ambiental",
      "Gestão de resíduos e reciclagem"
    ],
    progress: 0,
    status: "pending",
    priority: "medium"
  }
];

const implementationPhases = [
  {
    id: 1,
    name: "Arquitetura e Schema",
    description: "Definição da estrutura de banco e schemas",
    items: ["Schema do banco de dados", "Enums e tipos", "Relacionamentos FK", "Índices de performance"],
    status: "completed"
  },
  {
    id: 2,
    name: "Backend Core",
    description: "APIs REST e lógica de negócio",
    items: ["Controladores", "Repositórios", "Serviços", "Middleware de autenticação", "Validações"],
    status: "pending"
  },
  {
    id: 3,
    name: "Frontend Interface",
    description: "Interfaces de usuário e componentes",
    items: ["Páginas principais", "Modais e formulários", "Componentes reutilizáveis", "Navegação"],
    status: "pending"
  },
  {
    id: 4,
    name: "Integrações",
    description: "Conectividade e sincronização",
    items: ["APIs externas", "Importação/Exportação", "Sincronização de dados"],
    status: "pending"
  },
  {
    id: 5,
    name: "Testes e QA",
    description: "Validação e qualidade",
    items: ["Testes unitários", "Testes de integração", "Validação de dados", "Performance"],
    status: "pending"
  }
];

export default function MaterialsServicesControl() {
  const [selectedModule, setSelectedModule] = useState(moduleDefinitions[0]);

  // Calcular estatísticas gerais
  const totalFeatures = moduleDefinitions.reduce((acc, module) => acc + module.features.length, 0);
  const completedFeatures = moduleDefinitions.reduce((acc, module) => 
    acc + Math.floor(module.features.length * (module.progress / 100)), 0
  );
  const overallProgress = Math.round((completedFeatures / totalFeatures) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-400';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Materiais e Serviços - Controle de Implantação
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Acompanhamento completo do desenvolvimento e progresso do módulo
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedFeatures} de {totalFeatures} funcionalidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moduleDefinitions.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              7 módulos principais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tabelas DB</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-2">
              Tabelas do schema criadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APIs REST</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">
              Endpoints implementados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="phases">Fases de Implementação</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Módulos Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Módulos */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold">Módulos do Sistema</h3>
              {moduleDefinitions.map((module) => {
                const IconComponent = module.icon;
                return (
                  <Card 
                    key={module.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedModule.id === module.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedModule(module)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-sm">{module.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusIcon(module.status)}
                              <Badge className={getPriorityColor(module.priority)}>
                                {module.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Progress value={module.progress} className="mt-2" />
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Detalhes do Módulo Selecionado */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <selectedModule.icon className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle>{selectedModule.name}</CardTitle>
                      <CardDescription>{selectedModule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4">
                      <Badge className={getPriorityColor(selectedModule.priority)}>
                        Prioridade: {selectedModule.priority}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedModule.status)}
                        <span className="text-sm capitalize">{selectedModule.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{selectedModule.progress}%</div>
                      <Progress value={selectedModule.progress} className="w-32 mt-1" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Funcionalidades ({selectedModule.features.length})</h4>
                      <div className="space-y-2">
                        {selectedModule.features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3 p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                            <Circle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      {selectedModule.id === 1 ? (
                        <Button size="sm" onClick={() => window.location.href = '/item-catalog'}>
                          <Package className="h-4 w-4 mr-2" />
                          Acessar Catálogo de Itens
                        </Button>
                      ) : (
                        <Button size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Iniciar Desenvolvimento
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Ver Detalhes Técnicos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Fases Tab */}
        <TabsContent value="phases" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fases de Implementação</h3>
            {implementationPhases.map((phase) => (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(phase.status)}`} />
                      <div>
                        <CardTitle className="text-lg">{phase.name}</CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusIcon(phase.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {phase.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                        <Circle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Implementação</CardTitle>
              <CardDescription>
                Timeline estimado para desenvolvimento completo do módulo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="text-center text-slate-600 dark:text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2">Timeline em Desenvolvimento</h3>
                  <p>O cronograma detalhado será definido após o início da implementação.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}