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
// import useLocalization from '@/hooks/useLocalization';
export default function TenantAdminWorkflows() {
  // Localization temporarily disabled
  return (
    <div className=""
        {/* Header */}
        <div className=""
          <div className=""
            <div>
              <h1 className=""
                Gestão de Workflows
              </h1>
              <p className=""
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
              <DialogContent className=""
                <DialogHeader>
                  <DialogTitle>Criar Novo Workflow</DialogTitle>
                </DialogHeader>
                <div className=""
                  <div className=""
                    <div className=""
                      <Label htmlFor="name">Nome do Workflow</Label>
                      <Input id="name" placeholder="Ex: Escalação Automática" />
                    </div>
                    <div className=""
                      <Label htmlFor="trigger">Gatilho</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                  <div className=""
                    <Label htmlFor="conditions">Condições</Label>
                    <Textarea id="conditions" placeholder="Descreva as condições que ativam este workflow" />
                  </div>
                  <div className=""
                    <Label htmlFor="actions">Ações</Label>
                    <Textarea id="actions" placeholder='[TRANSLATION_NEEDED]' />
                  </div>
                  <div className=""
                    <Switch id="active" />
                    <Label htmlFor="active">Ativo</Label>
                  </div>
                  <Button className="text-lg">"Criar Workflow</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Workflow Overview */}
        <div className=""
          <Card>
            <CardHeader className=""
              <CardTitle className="text-lg">"Workflows Ativos</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"12</div>
              <p className=""
                3 novos este mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className=""
              <CardTitle className="text-lg">"Execuções Hoje</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"847</div>
              <p className=""
                +12% desde ontem
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className=""
              <CardTitle className="text-lg">"Taxa de Sucesso</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"98.5%</div>
              <p className=""
                +0.3% esta semana
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className=""
              <CardTitle className="text-lg">"SLA Compliance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">"94.2%</div>
              <p className=""
                Meta: 95%
              </p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="workflows" className=""
          <TabsList className=""
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="slas">SLAs</TabsTrigger>
            <TabsTrigger value="automation">Automação</TabsTrigger>
          </TabsList>
          <TabsContent value="workflows" className=""
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
                        <TableCell className="text-lg">"{workflow.name}</TableCell>
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
                          <div className=""
                            <Button variant="ghost" size="sm>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm>
                              {workflow.status === 'Ativo' ? 
                                <PauseCircle className="h-4 w-4" /> : 
                                <PlayCircle className="h-4 w-4" />
                              }
                            </Button>
                            <Button variant="ghost" size="sm" className=""
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
          <TabsContent value="slas" className=""
            <Card>
              <CardHeader>
                <CardTitle>Níveis de Serviço (SLAs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=""
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
                    <div key={index} className=""
                      <div className=""
                        <div>
                          <h3 className="text-lg">"{sla.priority}</h3>
                          <div className=""
                            Resposta: {sla.responseTime} | Resolução: {sla.resolutionTime}
                          </div>
                        </div>
                        <Badge variant={sla.currentCompliance >= sla.target ? 'default' : 'destructive'}>
                          {sla.currentCompliance >= sla.target ? 'Atendido' : 'Abaixo da Meta'}
                        </Badge>
                      </div>
                      <div className=""
                        <div className=""
                          <span>Compliance atual</span>
                          <span className="text-lg">"{sla.currentCompliance}%</span>
                        </div>
                        <Progress value={sla.currentCompliance} className="h-2" />
                        <div className=""
                          <span>Meta: {sla.target}%</span>
                          <span>{sla.currentCompliance >= sla.target ? 
                            "%": 
                            "%"
                          }</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="automation" className=""
            <div className=""
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Automação</CardTitle>
                </CardHeader>
                <CardContent className=""
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
                    <div key={index} className=""
                      <div className=""
                        <div className="text-lg">"{rule.name}</div>
                        <div className="text-lg">"{rule.description}</div>
                        <div className="text-lg">"{rule.triggers} execuções hoje</div>
                      </div>
                      <div className=""
                        <Switch checked={rule.active} />
                        <Button variant="ghost" size="sm>
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
                <CardContent className=""
                  {[
                    { trigger: 'Ticket criado', count: 145, icon: '📝' },
                    { trigger: 'Status alterado', count: 89, icon: '🔄' },
                    { trigger: 'Prioridade mudou', count: 23, icon: '⚡' },
                    { trigger: 'Comentário adicionado', count: 67, icon: '💬' },
                    { trigger: 'Tempo limite SLA', count: 12, icon: '⏰' },
                    { trigger: 'Atribuição mudou', count: 34, icon: '👤' }
                  ].map((trigger, index) => (
                    <div key={index} className=""
                      <div className=""
                        <span className="text-lg">"{trigger.icon}</span>
                        <span className="text-lg">"{trigger.trigger}</span>
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
                <div className=""
                  {[
                    {
                      workflow: 'Escalação Automática',
                      ticket: 'TICK-2024-001',
                      time: '2 min atrás',
                      status: 'Sucesso',
                      action: 'Escalado para supervisor'
                    },
                    {
                      workflow: 'Atribuição por Prioridade',
                      ticket: 'TICK-2024-002',
                      time: '5 min atrás',
                      status: 'Sucesso',
                      action: 'Atribuído a João Silva'
                    },
                    {
                      workflow: 'Notificação de Atraso',
                      ticket: 'TICK-2024-003',
                      time: '10 min atrás',
                      status: 'Erro',
                      action: 'Falha no envio de email'
                    },
                    {
                      workflow: 'Fechamento Automático',
                      ticket: 'TICK-2024-004',
                      time: '15 min atrás',
                      status: 'Sucesso',
                      action: 'Ticket fechado automaticamente'
                    }
                  ].map((execution, index) => (
                    <div key={index} className=""
                      <div className=""
                        <div className={`w-2 h-2 rounded-full ${
                          execution.status === 'Sucesso' ? 'bg-green-500' : 'bg-red-500'
                        "} />
                        <div>
                          <div className="text-lg">"{execution.workflow}</div>
                          <div className="text-lg">"{execution.ticket} • {execution.action}</div>
                        </div>
                      </div>
                      <div className=""
                        <Badge variant={execution.status === 'Sucesso' ? 'default' : 'destructive'}>
                          {execution.status}
                        </Badge>
                        <div className="text-lg">"{execution.time}</div>
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