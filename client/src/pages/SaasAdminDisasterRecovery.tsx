
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, HardDrive, Clock, CheckCircle, Play, Pause, Download } from "lucide-react";
// import useLocalization from '@/hooks/useLocalization';

export default function SaasAdminDisasterRecovery() {
  // Localization temporarily disabled

  return (
    <div className=""
        {/* Header */}
        <div className=""
          <h1 className=""
            Disaster Recovery & Backup
          </h1>
          <p className=""
            Gestão de backups e recuperação de desastres para continuidade dos negócios
          </p>
        </div>

        {/* Status Overview */}
        <div className=""
          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Status do Backup</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Ativo</div>
              <p className=""
                Último backup: 2 horas atrás
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">Dados Protegidos</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4 TB</div>
              <p className=""
                Crescimento: +15% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">RTO</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15 min</div>
              <p className=""
                Recovery Time Objective
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=""
              <CardTitle className="text-sm font-medium">RPO</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5 min</div>
              <p className=""
                Recovery Point Objective
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="backup" className=""
          <TabsList className=""
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="backup" className=""
            <div className=""
              <Card>
                <CardHeader>
                  <CardTitle>Backup Automático</CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <span className="text-sm font-medium">Status</span>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                  <div className=""
                    <span className="text-sm font-medium">Frequência</span>
                    <span className="text-sm">A cada 4 horas</span>
                  </div>
                  <div className=""
                    <span className="text-sm font-medium">Próximo backup</span>
                    <span className="text-sm">Em 2h 15min</span>
                  </div>
                  <div className=""
                    <span className="text-sm font-medium">Retenção</span>
                    <span className="text-sm">30 dias</span>
                  </div>
                  <div className=""
                    <Button size="sm" variant="outline>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                    <Button size="sm>
                      <Play className="h-4 w-4 mr-2" />
                      Backup Manual
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progresso Atual</CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <span>Backup em progresso</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                    <div className=""
                      Processando tenant "acme-corp" (2.1 GB / 3.2 GB)
                    </div>
                  </div>
                  <div className=""
                    <div>Início: 08:30</div>
                    <div>Estimativa de conclusão: 09:45</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Backups</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        date: '16/01/2025 06:00',
                        type: 'Automático',
                        size: '2.4 TB',
                        duration: '1h 23min',
                        status: '[TRANSLATION_NEEDED]'
                      },
                      {
                        date: '16/01/2025 02:00',
                        type: 'Automático',
                        size: '2.4 TB',
                        duration: '1h 18min',
                        status: '[TRANSLATION_NEEDED]'
                      },
                      {
                        date: '15/01/2025 22:00',
                        type: 'Automático',
                        size: '2.4 TB',
                        duration: '1h 31min',
                        status: '[TRANSLATION_NEEDED]'
                      },
                      {
                        date: '15/01/2025 18:00',
                        type: 'Manual',
                        size: '2.4 TB',
                        duration: '1h 12min',
                        status: '[TRANSLATION_NEEDED]'
                      }
                    ].map((backup, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{backup.date}</TableCell>
                        <TableCell>{backup.type}</TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>{backup.duration}</TableCell>
                        <TableCell>
                          <Badge className=""
                            {backup.status}
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

          <TabsContent value="recovery" className=""
            <Card>
              <CardHeader>
                <CardTitle>Pontos de Recuperação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=""
                  {[
                    {
                      date: '16/01/2025 06:00',
                      type: 'Completo',
                      tenant: '[TRANSLATION_NEEDED]',
                      size: '2.4 TB',
                      verified: true
                    },
                    {
                      date: '16/01/2025 02:00',
                      type: 'Incremental',
                      tenant: '[TRANSLATION_NEEDED]',
                      size: '345 GB',
                      verified: true
                    },
                    {
                      date: '15/01/2025 22:00',
                      type: 'Incremental',
                      tenant: '[TRANSLATION_NEEDED]',
                      size: '289 GB',
                      verified: true
                    }
                  ].map((point, index) => (
                    <div key={index} className=""
                      <div className=""
                        <div className="w-3 h-3 rounded-full "" />
                        <div>
                          <div className="font-medium">{point.date}</div>
                          <div className="text-sm text-gray-500">{point.type} • {point.tenant} • {point.size}</div>
                        </div>
                      </div>
                      <div className=""
                        <Button variant="outline" size="sm>
                          Verificar
                        </Button>
                        <Button size="sm>
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teste de Recuperação</CardTitle>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  <div className=""
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Último teste: 10/01/2025</span>
                  </div>
                  <div className=""
                    Recovery completo do tenant "test-recovery" - Sucesso em 12 minutos
                  </div>
                </div>
                <Button className=""
                  Executar Teste de Recovery
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className=""
            <div className=""
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Backup</CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <div className="text-2xl font-bold text-green-600">99.8%</div>
                      <div className="text-sm text-gray-500">Taxa de sucesso</div>
                    </div>
                    <div className=""
                      <div className="text-2xl font-bold text-blue-600">1.2h</div>
                      <div className="text-sm text-gray-500">Tempo médio</div>
                    </div>
                  </div>
                  <div className=""
                    <div className=""
                      <span>Crescimento mensal</span>
                      <span>+15%</span>
                    </div>
                    <Progress value={15} className="h-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Backup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=""
                    {[
                      {
                        type: 'info',
                        message: 'Backup programado para 10:00',
                        time: '30 min'
                      },
                      {
                        type: 'warning',
                        message: 'Espaço de armazenamento 80% utilizado',
                        time: '1h'
                      },
                      {
                        type: 'success',
                        message: 'Backup completo realizado com sucesso',
                        time: '2h'
                      }
                    ].map((alert, index) => (
                      <div key={index} className=""
                        <div className={`w-2 h-2 rounded-full ${
                          alert.type === 'error' ? 'bg-red-500' :
                          alert.type === 'warning' ? 'bg-yellow-500' :
                          alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        "} />
                        <div className=""
                          <div className="text-sm">{alert.message}</div>
                          <div className="text-xs text-gray-500">{alert.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className=""
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Backup</CardTitle>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  <div className=""
                    <label className="text-sm font-medium">Frequência</label>
                    <select className=""
                      <option>A cada 4 horas</option>
                      <option>A cada 2 horas</option>
                      <option>A cada 6 horas</option>
                      <option>Diário</option>
                    </select>
                  </div>
                  <div className=""
                    <label className="text-sm font-medium">Retenção</label>
                    <select className=""
                      <option>30 dias</option>
                      <option>60 dias</option>
                      <option>90 dias</option>
                      <option>1 ano</option>
                    </select>
                  </div>
                </div>
                <div className=""
                  <input type="checkbox" id="compress" defaultChecked />
                  <label htmlFor="compress" className="text-sm">Compressão habilitada</label>
                </div>
                <div className=""
                  <input type="checkbox" id="encrypt" defaultChecked />
                  <label htmlFor="encrypt" className="text-sm">Criptografia habilitada</label>
                </div>
                <Button className=""
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}