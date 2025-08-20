
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Server, Database, Clock, Users, Activity, HardDrive } from "lucide-react";

export default function SaasAdminPerformance() {
  return (
    <div className="space-y-8 p-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Performance & Saúde do Sistema
          </h1>
          <p className="text-gray-600 mt-2">
            Monitoramento em tempo real da performance e saúde da plataforma
          </p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Saudável</div>
              <Badge className="mt-2" variant="outline">
                99.9% uptime
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142ms</div>
              <p className="text-xs text-muted-foreground">
                Média nas últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">847</div>
              <p className="text-xs text-muted-foreground">
                +12% desde ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15,234</div>
              <p className="text-xs text-muted-foreground">
                Pico atual
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="infrastructure" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="infrastructure">Infraestrutura</TabsTrigger>
            <TabsTrigger value="database">Base de Dados</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="infrastructure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Recursos do Servidor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU</span>
                      <span>34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memória</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Disco</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rede</span>
                      <span>12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nós da Aplicação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'app-node-1', status: 'Ativo', cpu: 45, memory: 68, region: 'US-East' },
                    { name: 'app-node-2', status: 'Ativo', cpu: 23, memory: 45, region: 'US-West' },
                    { name: 'app-node-3', status: 'Ativo', cpu: 56, memory: 78, region: 'EU-West' },
                  ].map((node) => (
                    <div key={node.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-green-600">
                          {node.status}
                        </Badge>
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-sm text-gray-500">{node.region}</div>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>CPU: {node.cpu}%</span>
                        <span>MEM: {node.memory}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Performance da Base de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">2.3ms</div>
                    <div className="text-sm text-gray-500">Tempo médio de query</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">1,245</div>
                    <div className="text-sm text-gray-500">Queries por segundo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">34</div>
                    <div className="text-sm text-gray-500">Conexões ativas</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Conexões por Tenant</h4>
                  <div className="space-y-2">
                    {[
                      { tenant: 'acme-corp', connections: 12, queries: 234 },
                      { tenant: 'tech-startup', connections: 8, queries: 156 },
                      { tenant: 'enterprise-co', connections: 15, queries: 445 },
                    ].map((tenant) => (
                      <div key={tenant.tenant} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{tenant.tenant}</span>
                        <div className="flex gap-4 text-sm">
                          <span>{tenant.connections} conexões</span>
                          <span>{tenant.queries} queries/min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Alertas Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      type: 'warning',
                      title: 'Alto uso de CPU no app-node-3',
                      description: 'CPU acima de 80% nos últimos 10 minutos',
                      time: '2 min atrás'
                    },
                    {
                      type: 'info',
                      title: 'Novo tenant provisionado',
                      description: 'Tenant "new-customer" criado com sucesso',
                      time: '5 min atrás'
                    },
                    {
                      type: 'error',
                      title: 'Falha temporária no backup',
                      description: 'Backup automático falhou - tentando novamente',
                      time: '15 min atrás'
                    }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'error' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-gray-500">{alert.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{alert.time}</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Resolver
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}