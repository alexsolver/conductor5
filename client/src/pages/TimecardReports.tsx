import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Calendar, Clock, Users, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';

interface ReportFilters {
  startDate: string;
  endDate: string;
  userId?: string;
  reportType: string;
}

export default function TimecardReports() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reportType: 'attendance'
  });

  // Convert date range to period format (YYYY-MM) for the API
  const getPeriodFromDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    return format(start, 'yyyy-MM');
  };

  // Buscar relatórios
  const { data: attendanceReport, isLoading: attendanceLoading } = useQuery({
    queryKey: ['/api/timecard/reports/attendance', filters],
    queryFn: async () => {
      const period = getPeriodFromDates(filters.startDate, filters.endDate);
      const response = await apiRequest('GET', `/api/timecard/reports/attendance/${period}`);
      return response.json();
    },
    enabled: filters.reportType === 'attendance',
  });

  const { data: overtimeReport, isLoading: overtimeLoading } = useQuery({
    queryKey: ['/api/timecard/reports/overtime', filters],
    queryFn: async () => {
      const period = getPeriodFromDates(filters.startDate, filters.endDate);
      const response = await apiRequest('GET', `/api/timecard/reports/overtime/${period}`);
      return response.json();
    },
    enabled: filters.reportType === 'overtime',
  });

  const { data: complianceReport, isLoading: complianceLoading } = useQuery({
    queryKey: ['/api/timecard/reports/compliance', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/compliance/reports');
      return response.json();
    },
    enabled: filters.reportType === 'compliance',
  });

  // Buscar usuários para filtros
  const { data: users } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
  });

  const handleExport = (format: 'pdf' | 'excel') => {
    // Implementar exportação
    console.log(`Exportando relatório em ${format}`);
  };

  const updateFilters = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value 
    }));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatórios de Ponto</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilters('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilters('endDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="userId">Funcionário</Label>
              <Select value={filters.userId || 'all'} onValueChange={(value) => updateFilters('userId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(users as any)?.users?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={filters.reportType} onValueChange={(value) => updateFilters('reportType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Frequência</SelectItem>
                  <SelectItem value="overtime">Horas Extras</SelectItem>
                  <SelectItem value="compliance">Compliance CLT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={filters.reportType} onValueChange={(value) => updateFilters('reportType', value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Frequência
          </TabsTrigger>
          <TabsTrigger value="overtime" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horas Extras
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Relatório de Frequência */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Funcionários Ativos</p>
                    <p className="text-2xl font-bold">{attendanceReport?.totalEmployees || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Presença Média</p>
                    <p className="text-2xl font-bold">{attendanceReport?.averageAttendance || 0}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Faltas Total</p>
                    <p className="text-2xl font-bold">{attendanceReport?.totalAbsences || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Atrasos Total</p>
                    <p className="text-2xl font-bold">{attendanceReport?.totalLateArrivals || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceReport?.employeeDetails?.map((employee: any) => (
                    <div key={employee.userId} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <div className="font-medium">{employee.userName}</div>
                        <div className="text-sm text-gray-600">
                          {employee.workedDays} dias trabalhados de {employee.totalDays} dias
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{employee.attendanceRate}%</div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {employee.lateArrivals} atrasos
                          </Badge>
                          <Badge variant="destructive">
                            {employee.absences} faltas
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      Nenhum dado encontrado para o período selecionado
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Horas Extras */}
        <TabsContent value="overtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Horas Extras</p>
                    <p className="text-2xl font-bold">{overtimeReport?.totalOvertimeHours || 0}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold">R$ {overtimeReport?.totalOvertimeValue?.toFixed(2) || '0,00'}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Média por Funcionário</p>
                    <p className="text-2xl font-bold">{overtimeReport?.averageOvertimePerEmployee || 0}h</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de Horas Extras</CardTitle>
            </CardHeader>
            <CardContent>
              {overtimeLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {overtimeReport?.employeeRanking?.map((employee: any, index: number) => (
                    <div key={employee.userId} className="flex justify-between items-center p-4 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{employee.userName}</div>
                          <div className="text-sm text-gray-600">
                            {employee.overtimeHours}h extras
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">R$ {employee.overtimeValue.toFixed(2)}</div>
                        <Badge variant="outline">
                          {employee.overtimeDays} dias
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      Nenhuma hora extra registrada no período
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Compliance */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conformidade Geral</p>
                    <p className="text-2xl font-bold">{complianceReport?.overallCompliance || 0}%</p>
                  </div>
                  <div className={`h-8 w-8 rounded ${(complianceReport?.overallCompliance || 0) >= 95 ? 'bg-green-500' : (complianceReport?.overallCompliance || 0) >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Violações CLT</p>
                    <p className="text-2xl font-bold">{complianceReport?.cltViolations || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Jornadas Excessivas</p>
                    <p className="text-2xl font-bold">{complianceReport?.excessiveWorkdays || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Registros Pendentes</p>
                    <p className="text-2xl font-bold">{complianceReport?.pendingRecords || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas de Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              {complianceLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceReport?.alerts?.map((alert: any) => (
                    <div key={alert.id} className="flex items-start gap-3 p-4 border rounded">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-gray-600">{alert.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(alert.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'destructive' : 'secondary'
                      }>
                        {alert.severity === 'critical' ? 'Crítico' :
                         alert.severity === 'high' ? 'Alto' :
                         alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      Nenhum alerta de compliance no período
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