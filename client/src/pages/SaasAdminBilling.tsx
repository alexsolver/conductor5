
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CreditCard, DollarSign, TrendingUp, Users, Download, AlertCircle } from "lucide-react";

export default function SaasAdminBilling() {
  return (
    <div className=""
        {/* Header */}
        <div className=""
          <h1 className=""
            Billing & Usage Tracking
          </h1>
          <p className=""
            Gestão de faturamento e monitoramento de uso da plataforma
          </p>
        </div>

        {/* Revenue Overview */}
        <div className=""
          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$147,230</div>
              <p className=""
                +12% desde o mês passado
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
                +34 novos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$174</div>
              <p className=""
                +5% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3%</div>
              <p className=""
                -0.5% desde o mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className=""
          <TabsList className=""
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="usage">Uso de Recursos</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className=""
            <div className=""
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Receita por Plano</CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <span className="text-sm font-medium">Enterprise</span>
                      <span className="text-sm font-bold">$89,340 (61%)</span>
                    </div>
                    <Progress value={61} className="h-2" />
                    
                    <div className=""
                      <span className="text-sm font-medium">Professional</span>
                      <span className="text-sm font-bold">$42,180 (29%)</span>
                    </div>
                    <Progress value={29} className="h-2" />
                    
                    <div className=""
                      <span className="text-sm font-medium">Standard</span>
                      <span className="text-sm font-bold">$15,710 (10%)</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=""
                    <div className="text-3xl font-bold text-green-600">$147,230</div>
                    <div className="text-sm text-gray-500">Receita mensal atual</div>
                    
                    <div className=""
                      <div className=""
                        <span className="text-sm">Meta mensal</span>
                        <span className="text-sm font-medium">$150,000</span>
                      </div>
                      <Progress value={98} className="h-2" />
                      <div className="text-xs text-gray-500">98% da meta alcançada</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenants" className=""
            <Card>
              <CardHeader className=""
                <CardTitle>Tenants por Plano</CardTitle>
                <Button variant="outline" size="sm>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        name: 'Acme Corporation',
                        plan: 'Enterprise',
                        users: 245,
                        amount: '$2,450',
                        status: 'Ativo',
                        lastPayment: '15/12/2024'
                      },
                      {
                        name: 'Tech Startup Inc',
                        plan: 'Professional',
                        users: 87,
                        amount: '$870',
                        status: 'Ativo',
                        lastPayment: '12/12/2024'
                      },
                      {
                        name: 'Small Business Co',
                        plan: 'Standard',
                        users: 23,
                        amount: '$230',
                        status: 'Pendente',
                        lastPayment: '28/11/2024'
                      },
                      {
                        name: 'Enterprise Solutions',
                        plan: 'Enterprise',
                        users: 432,
                        amount: '$4,320',
                        status: 'Ativo',
                        lastPayment: '14/12/2024'
                      }
                    ].map((tenant, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.plan === 'Enterprise' ? 'default' : 'secondary'}>
                            {tenant.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenant.users}</TableCell>
                        <TableCell className="font-medium">{tenant.amount}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === 'Ativo' ? 'default' : 'destructive'}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenant.lastPayment}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className=""
            <div className=""
              <Card>
                <CardHeader>
                  <CardTitle>Uso de Recursos por Tenant</CardTitle>
                </CardHeader>
                <CardContent className=""
                  {[
                    { tenant: 'Acme Corporation', storage: 67, api: 45, users: 89 },
                    { tenant: 'Tech Startup Inc', storage: 34, api: 78, users: 56 },
                    { tenant: 'Enterprise Solutions', storage: 89, api: 23, users: 67 }
                  ].map((tenant, index) => (
                    <div key={index} className=""
                      <div className="font-medium">{tenant.tenant}</div>
                      <div className=""
                        <div className=""
                          <span>Storage</span>
                          <span>{tenant.storage}%</span>
                        </div>
                        <Progress value={tenant.storage} className="h-1" />
                      </div>
                      <div className=""
                        <div className=""
                          <span>API Calls</span>
                          <span>{tenant.api}%</span>
                        </div>
                        <Progress value={tenant.api} className="h-1" />
                      </div>
                      <div className=""
                        <div className=""
                          <span>Users</span>
                          <span>{tenant.users}%</span>
                        </div>
                        <Progress value={tenant.users} className="h-1" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=""
                    {[
                      {
                        tenant: 'Acme Corporation',
                        alert: 'Storage 90% utilizado',
                        type: 'warning'
                      },
                      {
                        tenant: 'Tech Startup Inc',
                        alert: 'API limit próximo (95%)',
                        type: 'error'
                      },
                      {
                        tenant: 'Small Business Co',
                        alert: 'Upgrade recomendado',
                        type: 'info'
                      }
                    ].map((alert, index) => (
                      <div key={index} className=""
                        <div>
                          <div className="font-medium">{alert.tenant}</div>
                          <div className="text-sm text-gray-500">{alert.alert}</div>
                        </div>
                        <Badge variant={alert.type === 'error' ? 'destructive' : 
                                      alert.type === 'warning' ? 'secondary' : 'default'}>
                          {alert.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className=""
            <Card>
              <CardHeader className=""
                <CardTitle>Faturas Recentes</CardTitle>
                <Button variant="outline" size="sm>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Todas
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        number: 'INV-2024-001',
                        tenant: 'Acme Corporation',
                        date: '15/12/2024',
                        amount: '$2,450',
                        status: 'Pago'
                      },
                      {
                        number: 'INV-2024-002',
                        tenant: 'Tech Startup Inc',
                        date: '12/12/2024',
                        amount: '$870',
                        status: 'Pago'
                      },
                      {
                        number: 'INV-2024-003',
                        tenant: 'Small Business Co',
                        date: '28/11/2024',
                        amount: '$230',
                        status: 'Pendente'
                      }
                    ].map((invoice, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{invoice.number}</TableCell>
                        <TableCell>{invoice.tenant}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell className="font-medium">{invoice.amount}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'Pago' ? 'default' : 'destructive'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm>
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}