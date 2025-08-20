
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Server, Database, Clock, Users, Activity, HardDrive } from "lucide-react";

export default function SaasAdminPerformance() {
  return (
    <div className=""
        {/* Header */}
        <div className=""
          <h1 className=""
            Performance & Saúde do Sistema
          </h1>
          <p className=""
            Monitoramento em tempo real da performance e saúde da plataforma
          </p>
        </div>

        {/* System Overview */}
        <div className=""
          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Saudável</div>
              <Badge className="mt-2" variant="outline>
                99.9% uptime
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142ms</div>
              <p className=""
                Média nas últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">847</div>
              <p className=""
                +12% desde ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15,234</div>
              <p className=""
                Pico atual
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="infrastructure" className=""
          <TabsList className=""
            <TabsTrigger value="infrastructure">Infraestrutura</TabsTrigger>
            <TabsTrigger value="database">Base de Dados</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="infrastructure" className=""
            <Card>
              <CardHeader>
                <CardTitle className=""
                  <Server className="h-5 w-5" />
                  Recursos do Servidor
                </CardTitle>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  <div className=""
                    <div className=""
                      <span>CPU</span>
                      <span>34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div className=""
                    <div className=""
                      <span>Memória</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className=""
                    <div className=""
                      <span>Disco</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div className=""
                    <div className=""
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
                <div className=""
                  {[
                    { name: 'app-node-1', status: 'Ativo', cpu: 45, memory: 68, region: 'US-East' },
                    { name: 'app-node-2', status: 'Ativo', cpu: 23, memory: 45, region: 'US-West' },
                    { name: 'app-node-3', status: 'Ativo', cpu: 56, memory: 78, region: 'EU-West' },
                  ].map((node) => (
                    <div key={node.name} className=""
                      <div className=""
                        <Badge variant="outline" className=""
                          {node.status}
                        </Badge>
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-sm text-gray-500">{node.region}</div>
                        </div>
                      </div>
                      <div className=""
                        <span>CPU: {node.cpu}%</span>
                        <span>MEM: {node.memory}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className=""
            <Card>
              <CardHeader>
                <CardTitle className=""
                  <Database className="h-5 w-5" />
                  Performance da Base de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  <div className=""
                    <div className="text-2xl font-bold text-blue-600">2.3ms</div>
                    <div className="text-sm text-gray-500">Tempo médio de query</div>
                  </div>
                  <div className=""
                    <div className="text-2xl font-bold text-green-600">1,245</div>
                    <div className="text-sm text-gray-500">Queries por segundo</div>
                  </div>
                  <div className=""
                    <div className="text-2xl font-bold text-purple-600">34</div>
                    <div className="text-sm text-gray-500">Conexões ativas</div>
                  </div>
                </div>

                <div className=""
                  <h4 className="font-medium mb-3">Conexões por Tenant</h4>
                  <div className=""
                    {[
                      { tenant: 'acme-corp', connections: 12, queries: 234 },
                      { tenant: 'tech-startup', connections: 8, queries: 156 },
                      { tenant: 'enterprise-co', connections: 15, queries: 445 },
                    ].map((tenant) => (
                      <div key={tenant.tenant} className=""
                        <span className="font-medium">{tenant.tenant}</span>
                        <div className=""
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

          <TabsContent value="alerts" className=""
            <Card>
              <CardHeader>
                <CardTitle className=""
                  <AlertCircle className="h-5 w-5" />
                  Alertas Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=""
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
                    <div key={index} className=""
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'error' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      "} />
                      <div className=""
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-gray-500">{alert.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{alert.time}</div>
                      </div>
                      <Button size="sm" variant="outline>
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