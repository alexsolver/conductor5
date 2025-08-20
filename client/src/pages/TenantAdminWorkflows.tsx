
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow, Clock, Target, AlertCircle, Plus, Edit, Trash2, PlayCircle, PauseCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function TenantAdminWorkflows() {

  return (
    <div className="space-y-8 p-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Gestão de Workflows
              </h1>
              <p className="text-gray-600 mt-2">
                Configurar workflows automatizados e regras de negócio
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Workflow</Label>
                      <Input id="name" placeholder="Ex: Escalação Automática" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trigger">Gatilho</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="[Translation]" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ticket-created">Ticket criado</SelectItem>
                          <SelectItem value="ticket-updated">Ticket atualizado</SelectItem>
                          <SelectItem value="time-based">Baseado em tempo</SelectItem>
                          <SelectItem value="priority-change">Mudança de prioridade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conditions">Condições</Label>
                    <Textarea id="conditions" placeholder="Descreva as condições que ativam este workflow" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actions">Ações</Label>
                    <Textarea id="actions" placeholder="[Translation]" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="active" />
                    <Label htmlFor="active">Ativo</Label>
                  </div>
                  <Button className="w-full">Criar Workflow</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Workflow Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflows Ativos</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                3 novos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">
                +0.3% esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                Meta: 95%
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="workflows" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="slas">SLAs</TabsTrigger>
            <TabsTrigger value="automation">Automação</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflows Configurados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Gatilho</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Execuções</TableHead>
                      <TableHead>Taxa de Sucesso</TableHead>
                      <TableHead>Última Execução</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        name: 'Escalação Automática',
                        trigger: 'Tempo limite SLA',
                        status: 'Ativo',
                        executions: 156,
                        successRate: 98.5,
                        lastRun: '2 min atrás'
                      },
                      {
                        name: 'Atribuição por Prioridade',
                        trigger: 'Ticket criado',
                        status: 'Ativo',
                        executions: 423,
                        successRate: 99.2,
                        lastRun: '5 min atrás'
                      },
                      {
                        name: 'Notificação de Atraso',
                        trigger: 'Baseado em tempo',
                        status: 'Pausado',
                        executions: 89,
                        successRate: 97.8,
                        lastRun: '1 hora atrás'
                      },
                      {
                        name: 'Fechamento Automático',
                        trigger: 'Ticket resolvido',
                        status: 'Ativo',
                        executions: 234,
                        successRate: 100,
                        lastRun: '10 min atrás'
                      }
                    ].map((workflow, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{workflow.name}</TableCell>
                        <TableCell>{workflow.trigger}</TableCell>
                        <TableCell>
                          <Badge variant={workflow.status === 'Ativo' ? 'default' : 'secondary'}>
                            {workflow.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{workflow.executions}</TableCell>
                        <TableCell>{workflow.successRate}%</TableCell>
                        <TableCell>{workflow.lastRun}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              {workflow.status === 'Ativo' ? 
                                <PauseCircle className="h-4 w-4" /> : 
                                <PlayCircle className="h-4 w-4" />
                              }
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Níveis de Serviço (SLAs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      priority: 'Crítico',
                      responseTime: '15 min',
                      resolutionTime: '4 horas',
                      currentCompliance: 96.5,
                      target: 95,
                      color: 'red'
                    },
                    {
                      priority: 'Alto',
                      responseTime: '1 hora',
                      resolutionTime: '8 horas',
                      currentCompliance: 94.2,
                      target: 90,
                      color: 'orange'
                    },
                    {
                      priority: 'Médio',
                      responseTime: '4 horas',
                      resolutionTime: '24 horas',
                      currentCompliance: 92.8,
                      target: 85,
                      color: 'yellow'
                    },
                    {
                      priority: 'Baixo',
                      responseTime: '8 horas',
                      resolutionTime: '72 horas',
                      currentCompliance: 89.3,
                      target: 80,
                      color: 'green'
                    }
                  ].map((sla, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{sla.priority}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            Resposta: {sla.responseTime} | Resolução: {sla.resolutionTime}
                          </div>
                        </div>
                        <Badge variant={sla.currentCompliance >= sla.target ? 'default' : 'destructive'}>
                          {sla.currentCompliance >= sla.target ? 'Atendido' : 'Abaixo da Meta'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Compliance atual</span>
                          <span className="font-medium">{sla.currentCompliance}%</span>
                        </div>
                        <Progress value={sla.currentCompliance} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Meta: {sla.target}%</span>
                          <span>{sla.currentCompliance >= sla.target ? 
                            `+${(sla.currentCompliance - sla.target).toFixed(1)}%` : 
                            `${(sla.currentCompliance - sla.target).toFixed(1)}%`
                          }</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Automação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: 'Auto-assign por skill',
                      description: 'Atribuir tickets baseado na expertise do agente',
                      active: true,
                      triggers: 234
                    },
                    {
                      name: 'Escalação por tempo',
                      description: 'Escalar tickets não respondidos em 2 horas',
                      active: true,
                      triggers: 67
                    },
                    {
                      name: 'Notificação cliente',
                      description: 'Notificar cliente sobre mudanças de status',
                      active: false,
                      triggers: 156
                    },
                    {
                      name: 'Fechamento automático',
                      description: 'Fechar tickets resolvidos após 24h',
                      active: true,
                      triggers: 89
                    }
                  ].map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-gray-500">{rule.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{rule.triggers} execuções hoje</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.active} />
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Triggers Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { trigger: 'Ticket criado', count: 145, icon: '📝' },
                    { trigger: 'Status alterado', count: 89, icon: '🔄' },
                    { trigger: 'Prioridade mudou', count: 23, icon: '⚡' },
                    { trigger: 'Comentário adicionado', count: 67, icon: '💬' },
                    { trigger: 'Tempo limite SLA', count: 12, icon: '⏰' },
                    { trigger: 'Atribuição mudou', count: 34, icon: '👤' }
                  ].map((trigger, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{trigger.icon}</span>
                        <span className="text-sm font-medium">{trigger.trigger}</span>
                      </div>
                      <Badge variant="outline">{trigger.count} hoje</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      workflow: 'Escalação Automática',
                      ticket: 'TICK-2024-001',
                      time: '2 min atrás',
                      status: "[Translation]",
                      action: 'Escalado para supervisor'
                    },
                    {
                      workflow: 'Atribuição por Prioridade',
                      ticket: 'TICK-2024-002',
                      time: '5 min atrás',
                      status: "[Translation]",
                      action: 'Atribuído a João Silva'
                    },
                    {
                      workflow: 'Notificação de Atraso',
                      ticket: 'TICK-2024-003',
                      time: '10 min atrás',
                      status: "[Translation]",
                      action: 'Falha no envio de email'
                    },
                    {
                      workflow: 'Fechamento Automático',
                      ticket: 'TICK-2024-004',
                      time: '15 min atrás',
                      status: "[Translation]",
                      action: 'Ticket fechado automaticamente'
                    }
                  ].map((execution, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          execution.status === "[Translation]" ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium">{execution.workflow}</div>
                          <div className="text-sm text-gray-500">{execution.ticket} • {execution.action}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={execution.status === "[Translation]" ? 'default' : 'destructive'}>
                          {execution.status}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">{execution.time}</div>
                      </div>
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