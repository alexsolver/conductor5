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
  const [reportType, setReportType] = useState('frequency');

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

  const { data: attendanceReport, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['/api/timecard/reports/attendance', selectedPeriod],
    queryFn: async () => {
      console.log('[TIMECARD-REPORTS] Fetching attendance report for:', selectedPeriod);
      const response = await apiRequest('GET', `/api/timecard/reports/attendance/${selectedPeriod}`);
      if (!response.ok) {
        console.error('[TIMECARD-REPORTS] Request failed:', response.status, response.statusText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const textResponse = await response.text();
      console.log('[TIMECARD-REPORTS] Raw response text:', textResponse.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(textResponse);
        console.log('[TIMECARD-REPORTS] Parsed JSON data:', data);
        console.log('[TIMECARD-REPORTS] Records found:', data.records?.length || 0);
      } catch (parseError) {
        console.error('[TIMECARD-REPORTS] JSON parse error:', parseError);
        console.error('[TIMECARD-REPORTS] Full response:', textResponse);
        throw new Error(`Resposta inválida da API: ${textResponse.substring(0, 100)}...`);
      }
      
      return data;
    },
    enabled: reportType === 'frequency'
  });

  const { data: overtimeReport, isLoading: overtimeLoading, error: overtimeError } = useQuery({
    queryKey: ['/api/timecard/reports/overtime', selectedPeriod],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/timecard/reports/overtime/${selectedPeriod}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: reportType === 'overtime'
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

  const currentReport = reportType === 'frequency' ? attendanceReport : 
                       reportType === 'overtime' ? overtimeReport : 
                       complianceReport;

  const isLoading = attendanceLoading || overtimeLoading || complianceLoading;
  const currentError = attendanceError || overtimeError;

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
                  <SelectItem value="frequency">Frequência</SelectItem>
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

      {/* Detalhes por Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes por Funcionário
          </CardTitle>
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
          ) : currentReport?.records && Array.isArray(currentReport.records) && currentReport.records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">Data</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Dia da Semana</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Entrada</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Saída</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Total Horas</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.records
                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((record: any, index: number) => {
                      const date = new Date(record.date);
                      const dayOfWeek = format(date, 'EEEE', { locale: ptBR });
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">
                            {formatDate(record.date)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 capitalize">
                            {dayOfWeek}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {record.checkIn ? formatTime(record.checkIn) : '--:--'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {record.checkOut ? formatTime(record.checkOut) : '--:--'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {record.totalHours || '8.0'}h
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.status === 'approved' ? 'Aprovado' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              
              {/* Totais */}
              {currentReport.summary && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Total de Horas:</strong> {currentReport.summary.totalHours || '0.0'}h
                    </div>
                    <div>
                      <strong>Dias Trabalhados:</strong> {currentReport.summary.workingDays || 0}
                    </div>
                    <div>
                      <strong>Horas Extras:</strong> {currentReport.summary.overtimeHours || '0.0'}h
                    </div>
                    <div>
                      <strong>Média por Dia:</strong> {currentReport.summary.averageHoursPerDay || '0.0'}h
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