import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  FileCode, 
  Database, 
  Globe, 
  Users, 
  Ticket, 
  Shield,
  ChevronDown,
  ChevronRight,
  TestTube,
  Activity,
  GitBranch
} from "lucide-react";

interface FileIssue {
  type: 'warning' | 'error';
  line?: number;
  description: string;
  problemFound: string;
  correctionPrompt: string;
}

interface ModuleFile {
  path: string;
  type: 'frontend' | 'backend' | 'shared' | 'config';
  size: number;
  lastModified: string;
  integrity: 'healthy' | 'warning' | 'error';
  dependencies: string[];
  checksum: string;
  issues?: FileIssue[];
}

interface ModuleInfo {
  name: string;
  description: string;
  icon: any;
  files: ModuleFile[];
  tests: {
    unit: number;
    integration: number;
    e2e: number;
  };
  healthScore: number;
  status: 'healthy' | 'warning' | 'error';
}

interface IntegrityCheck {
  id: string;
  timestamp: string;
  type: 'pre-change' | 'post-change' | 'scheduled';
  status: 'running' | 'completed' | 'failed';
  modules: {
    name: string;
    passed: number;
    failed: number;
    warnings: number;
  }[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warnings: number;
  };
}

const moduleIcons = {
  auth: Shield,
  customers: Users,
  tickets: Ticket,
  dashboard: Activity,
  api: Globe,
  database: Database,
  shared: GitBranch
};

export default function ModuleIntegrityControl() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Check if this is SaaS Admin page
  const isSaasAdmin = location.includes('/saas-admin/module-integrity');

  // Fetch module information
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/integrity/modules"],
    retry: 3,
  });

  // Fetch integrity checks history
  const { data: checksData, isLoading: checksLoading } = useQuery({
    queryKey: ["/api/integrity/checks"],
    retry: 3,
  });

  // Fetch real-time monitoring data
  const { data: monitoringData } = useQuery({
    queryKey: ["/api/integrity/monitoring"],
    refetchInterval: 5000, // Update every 5 seconds
    retry: 3,
  });

  const modules: ModuleInfo[] = modulesData?.modules || [];
  const checks: IntegrityCheck[] = checksData?.checks || [];
  const monitoring = monitoringData || {};

  // Run integrity check mutation
  const runIntegrityCheckMutation = useMutation({
    mutationFn: async (type: 'full' | 'quick' | 'module') => {
      const response = await apiRequest('POST', '/api/integrity/run-check', { type, module: selectedModule });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verificação de Integridade Iniciada",
        description: "A verificação está sendo executada. Acompanhe o progresso abaixo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrity/checks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Verificação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/integrity/backup');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup Criado",
        description: "Backup de segurança criado com sucesso.",
      });
    },
  });

  const toggleModuleExpansion = (moduleName: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleName)) {
      newExpanded.delete(moduleName);
    } else {
      newExpanded.add(moduleName);
    }
    setExpandedModules(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (modulesLoading || checksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando Sistema de Controle de Integridade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Controle de Integridade de Módulos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sistema avançado de prevenção de regressões e controle de qualidade
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Criar Backup
          </Button>
          <Button
            onClick={() => runIntegrityCheckMutation.mutate('quick')}
            disabled={runIntegrityCheckMutation.isPending}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Verificação Rápida
          </Button>
          <Button
            onClick={() => runIntegrityCheckMutation.mutate('full')}
            disabled={runIntegrityCheckMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Verificação Completa
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos Saudáveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {modules.filter(m => m.status === 'healthy').length}
            </div>
            <p className="text-xs text-green-600">
              de {modules.length} módulos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avisos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {modules.filter(m => m.status === 'warning').length}
            </div>
            <p className="text-xs text-yellow-600">
              requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {modules.filter(m => m.status === 'error').length}
            </div>
            <p className="text-xs text-red-600">
              correção urgente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integridade Geral</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(modules.reduce((acc, m) => acc + m.healthScore, 0) / modules.length)}%
            </div>
            <Progress 
              value={modules.reduce((acc, m) => acc + m.healthScore, 0) / modules.length} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="checks">Verificações</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4">
            {modules.map((module) => {
              const ModuleIcon = moduleIcons[module.name as keyof typeof moduleIcons] || FileCode;
              const isExpanded = expandedModules.has(module.name);

              return (
                <Card key={module.name} className="overflow-hidden">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => toggleModuleExpansion(module.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <ModuleIcon className="h-8 w-8 text-blue-600" />
                            <div>
                              <CardTitle className="flex items-center space-x-2">
                                <span>{module.name}</span>
                                <Badge 
                                  variant={module.status === 'healthy' ? 'default' : 
                                          module.status === 'warning' ? 'secondary' : 'destructive'}
                                  className={`${getStatusColor(module.status)}`}
                                >
                                  {getStatusIcon(module.status)}
                                  <span className="ml-1">{module.status}</span>
                                </Badge>
                              </CardTitle>
                              <CardDescription>{module.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-bold">{module.healthScore}%</div>
                              <div className="text-sm text-gray-500">Integridade</div>
                            </div>
                            {isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        
                        {/* Module Statistics */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{module.files.length}</div>
                            <div className="text-sm text-gray-500">Arquivos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {module.tests.unit + module.tests.integration + module.tests.e2e}
                            </div>
                            <div className="text-sm text-gray-500">Testes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {module.files.reduce((acc, f) => acc + f.dependencies.length, 0)}
                            </div>
                            <div className="text-sm text-gray-500">Dependências</div>
                          </div>
                        </div>

                        {/* Files List */}
                        <div className="space-y-2">
                          <h4 className="font-semibold">Arquivos do Módulo</h4>
                          <ScrollArea className="h-64">
                            {module.files.map((file, index) => (
                              <div key={index} className="p-3 border rounded mb-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <FileCode className="h-4 w-4" />
                                    <span className="text-sm font-mono">{file.path}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {file.type}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(file.integrity)}
                                    <span className="text-xs text-gray-500">
                                      {new Date(file.lastModified).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                {file.issues && file.issues.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {file.issues.map((issue, issueIndex) => (
                                      <div key={issueIndex} className={cn(
                                        "p-3 rounded-lg border-l-4",
                                        issue.type === 'error' ? "bg-red-50 border-red-400 dark:bg-red-900/20" : "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20"
                                      )}>
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h5 className={cn(
                                              "text-sm font-medium",
                                              issue.type === 'error' ? "text-red-800 dark:text-red-200" : "text-yellow-800 dark:text-yellow-200"
                                            )}>
                                              {issue.description}
                                              {issue.line && <span className="ml-1 text-xs">(linha {issue.line})</span>}
                                            </h5>
                                            <p className={cn(
                                              "text-xs mt-1",
                                              issue.type === 'error' ? "text-red-600 dark:text-red-300" : "text-yellow-600 dark:text-yellow-300"
                                            )}>
                                              <strong>Problema:</strong> {issue.problemFound}
                                            </p>
                                            <div className="mt-2">
                                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                <strong>Prompt para correção:</strong>
                                              </p>
                                              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-20 overflow-y-auto">
                                                {issue.correctionPrompt}
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-2 text-xs"
                                                onClick={() => navigator.clipboard.writeText(issue.correctionPrompt)}
                                              >
                                                📋 Copiar Prompt
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </ScrollArea>
                        </div>

                        <div className="flex justify-end space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedModule(module.name);
                              runIntegrityCheckMutation.mutate('module');
                            }}
                            disabled={runIntegrityCheckMutation.isPending}
                          >
                            <TestTube className="h-4 w-4 mr-2" />
                            Testar Módulo
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Checks Tab */}
        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Verificações</CardTitle>
              <CardDescription>
                Registro completo de todas as verificações de integridade realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {checks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma verificação encontrada. Execute uma verificação para começar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checks.map((check) => (
                      <Card key={check.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                Verificação {check.type}
                              </CardTitle>
                              <CardDescription>
                                {new Date(check.timestamp).toLocaleString()}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={check.status === 'completed' ? 'default' : 
                                      check.status === 'running' ? 'secondary' : 'destructive'}
                            >
                              {check.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-bold">{check.summary.totalTests}</div>
                              <div className="text-sm text-gray-500">Total</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{check.summary.passedTests}</div>
                              <div className="text-sm text-gray-500">Passou</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">{check.summary.failedTests}</div>
                              <div className="text-sm text-gray-500">Falhou</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-600">{check.summary.warnings}</div>
                              <div className="text-sm text-gray-500">Avisos</div>
                            </div>
                          </div>
                          
                          {check.modules.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-semibold text-sm">Resultados por Módulo</h5>
                              {check.modules.map((module, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span>{module.name}</span>
                                  <div className="flex space-x-2">
                                    <span className="text-green-600">✓ {module.passed}</span>
                                    <span className="text-red-600">✗ {module.failed}</span>
                                    <span className="text-yellow-600">⚠ {module.warnings}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monitoramento em Tempo Real</CardTitle>
                <CardDescription>
                  Acompanhe a saúde dos módulos em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertTitle>Sistema Ativo</AlertTitle>
                    <AlertDescription>
                      Monitoramento contínuo ativo. Próxima verificação automática em 5 minutos.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Performance dos Módulos</h4>
                      <div className="space-y-2">
                        {modules.map((module) => (
                          <div key={module.name} className="flex items-center justify-between">
                            <span className="text-sm">{module.name}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={module.healthScore} className="w-20" />
                              <span className="text-xs">{module.healthScore}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Alertas Recentes</h4>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">
                          Nenhum alerta crítico nas últimas 24 horas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configure as regras de integridade e automação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Proteção Ativa</AlertTitle>
                  <AlertDescription>
                    Sistema configurado para prevenir modificações que quebrem a integridade dos módulos.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-semibold">Verificações Automáticas</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Configure quando e como as verificações devem ser executadas
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Verificação antes de cada commit</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Verificação diária automática</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Alertas em tempo real</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">Backup Automático</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Configurações de backup para proteção de dados
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Backup antes de modificações críticas</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Backup diário automático</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}