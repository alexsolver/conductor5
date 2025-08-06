import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, FileText, Download, TrendingUp, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function TimecardReports() {
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [reportType, setReportType] = useState('attendance');

  // Generate last 12 months for period selection
  const generatePeriods = () => {
    const periods = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      periods.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR })
      });
    }
    return periods;
  };

  // Fetch attendance report for selected period
  const { data: attendanceReport, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['attendance-report', selectedPeriod],
    queryFn: async () => {
      console.log('[TIMECARD-REPORTS] Fetching attendance report for period:', selectedPeriod);
      try {
        const response = await apiRequest('GET', `/api/timecard/reports/attendance/${selectedPeriod}`);

        if (!response.ok) {
          console.error('[TIMECARD-REPORTS] HTTP Error:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('[TIMECARD-REPORTS] Non-JSON response:', text.substring(0, 200));
          throw new Error('Resposta inválida do servidor - esperado JSON');
        }

        const data = await response.json();
        console.log('[TIMECARD-REPORTS] Report data received:', data);

        if (!data.success && data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (error) {
        console.error('[TIMECARD-REPORTS] Error fetching report:', error);
        throw error;
      }
    },
    enabled: reportType === 'attendance',
    retry: false
  });

  // Fetch overtime report for selected period
  const { data: overtimeReport, isLoading: overtimeLoading, error: overtimeError } = useQuery({
    queryKey: ['overtime-report', selectedPeriod],
    queryFn: async () => {
      console.log('[TIMECARD-REPORTS] Fetching overtime report for period:', selectedPeriod);
      try {
        const response = await apiRequest('GET', `/api/timecard/reports/overtime/${selectedPeriod}`);

        if (!response.ok) {
          console.error('[TIMECARD-REPORTS] HTTP Error:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('[TIMECARD-REPORTS] Non-JSON response:', text.substring(0, 200));
          throw new Error('Resposta inválida do servidor - esperado JSON');
        }

        const data = await response.json();
        console.log('[TIMECARD-REPORTS] Overtime report data received:', data);

        if (!data.success && data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (error) {
        console.error('[TIMECARD-REPORTS] Error fetching overtime report:', error);
        throw error;
      }
    },
    enabled: reportType === 'overtime',
    retry: false
  });

  const { data: complianceReport, isLoading: complianceLoading } = useQuery({
    queryKey: ['/api/timecard/compliance/reports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/compliance/reports');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: reportType === 'compliance'
  });

  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const exportToExcel = () => {
    // Implement Excel export functionality
    console.log('Exportando para Excel...');
  };

  const exportToPDF = () => {
    // Implement PDF export functionality
    console.log('Exportando para PDF...');
  };

  const currentReport = reportType === 'attendance' ? attendanceReport : 
                       reportType === 'overtime' ? overtimeReport : 
                       complianceReport;

  const isLoading = attendanceLoading || overtimeLoading || complianceLoading;
  const currentError = attendanceError || overtimeError;

  // Debug logging for data rendering
  console.log('[TIMECARD-REPORTS-DEBUG] Current state:', {
    reportType,
    currentReport: currentReport ? {
      success: currentReport.success,
      hasData: !!currentReport.data,
      isArray: Array.isArray(currentReport.data),
      dataLength: currentReport.data?.length,
      firstItem: currentReport.data?.[0]
    } : null,
    isLoading,
    currentError: currentError?.message
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Relatórios de Ponto
          </h1>
          <p className="text-gray-600 mt-1">
            Análises e relatórios de frequência dos funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <input 
                type="date" 
                defaultValue="01/08/2025"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <input 
                type="date" 
                defaultValue="06/08/2025"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Funcionário</label>
              <Select defaultValue="todos">
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="alex">Alex Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Frequência</SelectItem>
                  <SelectItem value="overtime">Horas Extras</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Funcionários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Presença Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-gray-500">Taxa de presença</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Faltas Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500">Faltas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Atrasos Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500">Atrasos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Relatório CLT Brasileiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Ponto - Padrão CLT
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Relatório conforme legislação brasileira com dados obrigatórios
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Carregando relatório...</div>
            </div>
          ) : currentError ? (
            <div className="text-center text-red-600 py-8">
              <div>Erro ao carregar dados: {currentError.message}</div>
              <div className="text-sm mt-2">Verifique sua conexão e tente novamente</div>
            </div>
          ) : currentReport?.success && currentReport?.data && Array.isArray(currentReport.data) && currentReport.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-left">Data</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Dia</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">1ª Entrada</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">1ª Saída</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">2ª Entrada</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">2ª Saída</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">H. Trabalhadas</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">H. Extras</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Escala</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.data
                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((record: any, index: number) => (
                      <tr key={index} className={`hover:bg-gray-50 ${!record.isConsistent ? 'bg-red-50 border-red-200' : ''}`}>
                        <td className="border border-gray-300 px-2 py-2 font-medium">
                          {record.date}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {record.dayOfWeek}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-mono">
                          {record.firstEntry}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-mono">
                          {record.firstExit}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-mono">
                          {record.secondEntry}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-mono">
                          {record.secondExit}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-mono font-semibold">
                          {record.totalHours}h
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-mono">
                          <span className={record.overtimeHours && parseFloat(record.overtimeHours) > 0 ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                            {record.overtimeHours || '0.00'}h
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'approved' ? 'bg-green-100 text-green-800' :
                            record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            record.status === 'working' ? 'bg-blue-100 text-blue-800' :
                            record.status === 'inconsistent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status === 'approved' ? 'Aprovado' :
                             record.status === 'pending' ? 'Pendente' :
                             record.status === 'rejected' ? 'Rejeitado' :
                             record.status === 'working' ? 'Em Andamento' :
                             record.status === 'inconsistent' ? 'INCONSISTENTE' :
                             record.status}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                          {record.workScheduleType}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-sm">
                          {!record.isConsistent && (
                            <span className="text-red-600 font-semibold">⚠️ INCONSISTENTE</span>
                          )}
                          {record.observations && (
                            <div className={!record.isConsistent ? 'mt-1' : ''}>
                              {record.observations}
                            </div>
                          )}
                          {!record.observations && record.isConsistent && '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Resumo do Relatório */}
              {currentReport.summary && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Resumo do Período</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total de Horas:</span>
                      <div className="font-medium">{currentReport.summary.totalHours}h</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Dias Trabalhados:</span>
                      <div className="font-medium">{currentReport.summary.workingDays}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Horas Extras:</span>
                      <div className="font-medium">{currentReport.summary.overtimeHours}h</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Média Diária:</span>
                      <div className="font-medium">{currentReport.summary.averageHoursPerDay}h</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="font-medium">Nenhum dado encontrado para o período selecionado</div>
              <div className="text-sm mt-1">
                Selecione um período diferente ou verifique se há registros de ponto aprovados
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}