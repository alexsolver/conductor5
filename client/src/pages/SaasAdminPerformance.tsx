import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Server, Database, Clock, Users, Activity, HardDrive } from "lucide-react";
export default function SaasAdminPerformance() {
  return (
    <div className="p-4"
        {/* Header */}
        <div className="p-4"
          <h1 className="p-4"
            Performance & Saúde do Sistema
          </h1>
          <p className="p-4"
            Monitoramento em tempo real da performance e saúde da plataforma
          </p>
        </div>
        {/* System Overview */}
        <div className="p-4"
          <Card>
            <CardHeader className="p-4"
              <CardTitle className="text-lg">"Status Geral</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"Saudável</div>
              <Badge className="mt-2" variant="outline>
                99.9% uptime
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4"
              <CardTitle className="text-lg">"Tempo de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"142ms</div>
              <p className="p-4"
                Média nas últimas 24h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4"
              <CardTitle className="text-lg">"Tenants Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"847</div>
              <p className="p-4"
                +12% desde ontem
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4"
              <CardTitle className="text-lg">"Requests/min</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"15,234</div>
              <p className="p-4"
                Pico atual
              </p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="infrastructure" className="p-4"
          <TabsList className="p-4"
            <TabsTrigger value="infrastructure">Infraestrutura</TabsTrigger>
            <TabsTrigger value="database">Base de Dados</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>
          <TabsContent value="infrastructure" className="p-4"
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <Server className="h-5 w-5" />
                  Recursos do Servidor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                <div className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <span>CPU</span>
                      <span>34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div className="p-4"
                    <div className="p-4"
                      <span>Memória</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="p-4"
                    <div className="p-4"
                      <span>Disco</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div className="p-4"
                    <div className="p-4"
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
                <div className="p-4"
                  {[
                    { name: 'app-node-1', status: 'Ativo', cpu: 45, memory: 68, region: 'US-East' },
                    { name: 'app-node-2', status: 'Ativo', cpu: 23, memory: 45, region: 'US-West' },
                    { name: 'app-node-3', status: 'Ativo', cpu: 56, memory: 78, region: 'EU-West' },
                  ].map((node) => (
                    <div key={node.name} className="p-4"
                      <div className="p-4"
                        <Badge variant="outline" className="p-4"
                          {node.status}
                        </Badge>
                        <div>
                          <div className="text-lg">"{node.name}</div>
                          <div className="text-lg">"{node.region}</div>
                        </div>
                      </div>
                      <div className="p-4"
                        <span>CPU: {node.cpu}%</span>
                        <span>MEM: {node.memory}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="database" className="p-4"
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <Database className="h-5 w-5" />
                  Performance da Base de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                <div className="p-4"
                  <div className="p-4"
                    <div className="text-lg">"2.3ms</div>
                    <div className="text-lg">"Tempo médio de query</div>
                  </div>
                  <div className="p-4"
                    <div className="text-lg">"1,245</div>
                    <div className="text-lg">"Queries por segundo</div>
                  </div>
                  <div className="p-4"
                    <div className="text-lg">"34</div>
                    <div className="text-lg">"Conexões ativas</div>
                  </div>
                </div>
                <div className="p-4"
                  <h4 className="text-lg">"Conexões por Tenant</h4>
                  <div className="p-4"
                    {[
                      { tenant: 'acme-corp', connections: 12, queries: 234 },
                      { tenant: 'tech-startup', connections: 8, queries: 156 },
                      { tenant: 'enterprise-co', connections: 15, queries: 445 },
                    ].map((tenant) => (
                      <div key={tenant.tenant} className="p-4"
                        <span className="text-lg">"{tenant.tenant}</span>
                        <div className="p-4"
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
          <TabsContent value="alerts" className="p-4"
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <AlertCircle className="h-5 w-5" />
                  Alertas Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4"
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
                    <div key={index} className="p-4"
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'error' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      "} />
                      <div className="p-4"
                        <div className="text-lg">"{alert.title}</div>
                        <div className="text-lg">"{alert.description}</div>
                        <div className="text-lg">"{alert.time}</div>
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