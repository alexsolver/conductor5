import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
// import useLocalization from '@/hooks/useLocalization';
  Activity, 
  Users, 
  MessageSquare, 
  Eye, 
  Edit, 
  Plus,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  Filter,
  FileText,
  Wrench,
  Settings,
  Download,
  User
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
interface ProductivitySummary {
  totalActivities: number;
  totalTimeSeconds: number;
  averageSessionTime: number;
  activitiesByType: Record<string, {
    count: number;
    totalTime: number;
    avgTime: number;
  }>;
  dailyBreakdown: Record<string, {
    totalActivities: number;
    totalTime: number;
    activities: Record<string, { count: number; time: number }>;
  }>;
}
export default function ProductivityReports() {
  // Localization temporarily disabled
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const { data: myProductivity, isLoading: myProductivityLoading, error: myProductivityError } = useQuery({
    queryKey: ['/api/productivity/my-productivity', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await apiRequest('GET', "
      const jsonData = await response.json();
      return jsonData;
    },
  });
  const { data: teamProductivity, isLoading: teamProductivityLoading } = useQuery({
    queryKey: ['/api/productivity/team-productivity', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await apiRequest('GET', "
      return await response.json();
    },
  });
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Em análise';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return "m`;
  };
  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return "%`;
  };
  const getActivityTypeLabel = (type: string) => {
    const labels = {
      'view_ticket': 'Visualizar Tickets',
      'edit_ticket': '[TRANSLATION_NEEDED]',
      'create_ticket': '[TRANSLATION_NEEDED]',
      'send_message': 'Enviar Mensagens',
      'view_customer': 'Visualizar Clientes',
      'create_note': '[TRANSLATION_NEEDED]',
      'edit_note': '[TRANSLATION_NEEDED]',
      'view_notes': 'Visualizar Notas',
      'create_internal_action': '[TRANSLATION_NEEDED]',
      'edit_internal_action': '[TRANSLATION_NEEDED]',
      'view_actions': 'Visualizar Ações',
    };
    return labels[type] || type;
  };
  const getActivityColor = (type: string) => {
    const colors = {
      'view_ticket': 'bg-blue-500',
      'edit_ticket': 'bg-green-500',
      'create_ticket': 'bg-purple-500',
      'send_message': 'bg-orange-500',
      'view_customer': 'bg-teal-500'
    };
    return colors[type] || 'bg-gray-500';
  };
  const summary: ProductivitySummary = myProductivity?.data?.summary || {
    totalActivities: 0,
    totalTimeSeconds: 0,
    averageSessionTime: 0,
    activitiesByType: {},
    dailyBreakdown: {}
  };
  return (
    <div className="p-4"
      <div className="p-4"
        <h1 className="text-lg">"Relatórios de Produtividade</h1>
        <Button variant="outline>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>
      {/* Status do Sistema */}
      {summary.totalActivities > 0 && summary.totalTimeSeconds === 0 && (
        <Card className="p-4"
          <CardContent className="p-4"
            <div className="p-4"
              <div className="p-4"
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg">"Sistema de Tracking Ativo</h3>
                <p className="p-4"
                  O sistema está registrando suas atividades com sucesso. 
                  O cálculo de tempo detalhado está sendo ajustado para fornecer métricas mais precisas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4"
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="my-productivity" className="p-4"
        <TabsList>
          <TabsTrigger value="my-productivity" className="p-4"
            <User className="h-4 w-4" />
            Minha Produtividade
          </TabsTrigger>
          <TabsTrigger value="team-productivity" className="p-4"
            <BarChart3 className="h-4 w-4" />
            Equipe
          </TabsTrigger>
        </TabsList>
        {/* Minha Produtividade */}
        <TabsContent value="my-productivity" className="p-4"
          {/* Resumo Geral */}
          <div className="p-4"
            <Card>
              <CardContent className="p-4"
                <div className="p-4"
                  <div>
                    <p className="text-lg">"Total de Atividades</p>
                    <p className="text-lg">"{summary.totalActivities}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4"
                <div className="p-4"
                  <div>
                    <p className="text-lg">"Tempo Total</p>
                    <p className="text-lg">"{formatDuration(summary.totalTimeSeconds)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4"
                <div className="p-4"
                  <div>
                    <p className="text-lg">"Tempo Médio por Atividade</p>
                    <p className="text-lg">"{formatDuration(summary.averageSessionTime)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4"
                <div className="p-4"
                  <div>
                    <p className="text-lg">"Dias Ativos</p>
                    <p className="text-lg">"{Object.keys(summary.dailyBreakdown).length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Atividades por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              {myProductivityLoading ? (
                <div className="p-4"
                  {[1, 2, 3].map(i => (
                    <div key={i} className="text-lg">"</div>
                  ))}
                </div>
              ) : (
                <div className="p-4"
                  {Object.entries(summary.activitiesByType).length > 0 ? 
                    Object.entries(summary.activitiesByType).map(([type, data]) => (
                      <div key={type} className="p-4"
                        <div className="p-4"
                          <div className="w-4 h-4 rounded "</div>
                          <div>
                            <div className="text-lg">"{getActivityTypeLabel(type)}</div>
                            <div className="p-4"
                              {data.count} atividades • {formatDuration(data.avgTime)} média
                            </div>
                          </div>
                        </div>
                        <div className="p-4"
                          <div className="text-lg">"{formatDuration(data.totalTime)}</div>
                          <Badge variant="secondary>
                            {formatPercentage(data.totalTime, summary.totalTimeSeconds)}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <div className="p-4"
                        Nenhuma atividade registrada no período
                      </div>
                    )
                  }
                </div>
              )}
            </CardContent>
          </Card>
          {/* Breakdown Diário */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Diária</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                {Object.entries(summary.dailyBreakdown).length > 0 ?
                  Object.entries(summary.dailyBreakdown)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, data]) => (
                      <div key={date} className="p-4"
                        <div>
                          <div className="p-4"
                            {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="p-4"
                            {data.totalActivities} atividades • {formatDuration(data.totalTime)}
                          </div>
                        </div>
                        <div className="p-4"
                          {Object.entries(data.activities).map(([actType, actData]) => (
                            <Badge key={actType} variant="outline" className="p-4"
                              {getActivityTypeLabel(actType)}: {actData.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <div className="p-4"
                        Nenhuma atividade registrada no período
                      </div>
                    )
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Produtividade da Equipe */}
        <TabsContent value="team-productivity" className="p-4"
          <Card>
            <CardHeader>
              <CardTitle>Ranking da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              {teamProductivityLoading ? (
                <div className="p-4"
                  {[1, 2, 3].map(i => (
                    <div key={i} className="text-lg">"</div>
                  ))}
                </div>
              ) : (
                <div className="p-4"
                  {teamProductivity?.data?.userSummaries?.map((user: any, index: number) => (
                    <div key={user.userId} className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-lg">"Usuário {user.userId.substring(0, 8)}</div>
                          <div className="p-4"
                            {user.totalActivities} atividades
                          </div>
                        </div>
                      </div>
                      <div className="p-4"
                        <div className="text-lg">"{formatDuration(user.totalTime)}</div>
                        <div className="p-4"
                          {Math.floor(user.totalTime / user.totalActivities)}s/atividade
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="p-4"
                      Nenhum dado de equipe disponível
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}