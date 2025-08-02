import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
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
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: myProductivity, isLoading: myProductivityLoading, error: myProductivityError } = useQuery({
    queryKey: ['/api/productivity/my-productivity', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await apiRequest('GET', `/api/productivity/my-productivity?${params}`);
      const jsonData = await response.json();
      return jsonData;
    },
  });

  const { data: teamProductivity, isLoading: teamProductivityLoading } = useQuery({
    queryKey: ['/api/productivity/team-productivity', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await apiRequest('GET', `/api/productivity/team-productivity?${params}`);
      return await response.json();
    },
  });

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Em análise';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      'view_ticket': 'Visualizar Tickets',
      'edit_ticket': 'Editar Tickets',
      'create_ticket': 'Criar Tickets',
      'send_message': 'Enviar Mensagens',
      'view_customer': 'Visualizar Clientes',
      'create_note': 'Criar Nota',
      'edit_note': 'Editar Nota',
      'view_notes': 'Visualizar Notas',
      'create_internal_action': 'Criar Ação Interna',
      'edit_internal_action': 'Editar Ação Interna',
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
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatórios de Produtividade</h1>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Status do Sistema */}
      {summary.totalActivities > 0 && summary.totalTimeSeconds === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white p-1 rounded">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Sistema de Tracking Ativo</h3>
                <p className="text-sm text-blue-700 mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <Tabs defaultValue="my-productivity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-productivity" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Minha Produtividade
          </TabsTrigger>
          <TabsTrigger value="team-productivity" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Equipe
          </TabsTrigger>
        </TabsList>

        {/* Minha Produtividade */}
        <TabsContent value="my-productivity" className="space-y-4">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Atividades</p>
                    <p className="text-2xl font-bold">{summary.totalActivities}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tempo Total</p>
                    <p className="text-2xl font-bold">{formatDuration(summary.totalTimeSeconds)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tempo Médio por Atividade</p>
                    <p className="text-2xl font-bold">{formatDuration(summary.averageSessionTime)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dias Ativos</p>
                    <p className="text-2xl font-bold">{Object.keys(summary.dailyBreakdown).length}</p>
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
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(summary.activitiesByType).length > 0 ? 
                    Object.entries(summary.activitiesByType).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between p-4 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${getActivityColor(type)}`}></div>
                          <div>
                            <div className="font-medium">{getActivityTypeLabel(type)}</div>
                            <div className="text-sm text-gray-600">
                              {data.count} atividades • {formatDuration(data.avgTime)} média
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatDuration(data.totalTime)}</div>
                          <Badge variant="secondary">
                            {formatPercentage(data.totalTime, summary.totalTimeSeconds)}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 py-8">
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
              <div className="space-y-3">
                {Object.entries(summary.dailyBreakdown).length > 0 ?
                  Object.entries(summary.dailyBreakdown)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, data]) => (
                      <div key={date} className="flex items-center justify-between p-4 border rounded">
                        <div>
                          <div className="font-medium">
                            {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {data.totalActivities} atividades • {formatDuration(data.totalTime)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {Object.entries(data.activities).map(([actType, actData]) => (
                            <Badge key={actType} variant="outline" className="text-xs">
                              {getActivityTypeLabel(actType)}: {actData.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 py-8">
                        Nenhuma atividade registrada no período
                      </div>
                    )
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produtividade da Equipe */}
        <TabsContent value="team-productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              {teamProductivityLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {teamProductivity?.data?.userSummaries?.map((user: any, index: number) => (
                    <div key={user.userId} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">Usuário {user.userId.substring(0, 8)}</div>
                          <div className="text-sm text-gray-600">
                            {user.totalActivities} atividades
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatDuration(user.totalTime)}</div>
                        <div className="text-sm text-gray-600">
                          {Math.floor(user.totalTime / user.totalActivities)}s/atividade
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
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