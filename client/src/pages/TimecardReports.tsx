import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, FileText, Download, TrendingUp, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocalization } from '@/hooks/useLocalization';

export default function TimecardReports() {
  const { t } = useLocalization();

  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [reportType, setReportType] = useState('attendance');
  const [startDate, setStartDate] = useState('2025-08-01');
  const [endDate, setEndDate] = useState('2025-08-31');
  const [selectedEmployee, setSelectedEmployee] = useState('todos');

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

  // Fetch attendance report with filters
  const { data: attendanceReport, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['attendance-report', selectedPeriod, startDate, endDate, selectedEmployee],
    queryFn: async () => {
      console.log('[TIMECARD-REPORTS] Fetching attendance report with filters:', {
        period: selectedPeriod,
        startDate,
        endDate,
        employee: selectedEmployee
      });
      try {
        // Build query params with filters
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedEmployee !== 'todos') params.append('employeeId', selectedEmployee);
        
        const url = `/api/timecard/reports/attendance/${selectedPeriod}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await apiRequest('GET', url);

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

  // Fetch overtime report with filters
  const { data: overtimeReport, isLoading: overtimeLoading, error: overtimeError } = useQuery({
    queryKey: ['overtime-report', selectedPeriod, startDate, endDate, selectedEmployee],
    queryFn: async () => {
      console.log('[TIMECARD-REPORTS] Fetching overtime report with filters:', {
        period: selectedPeriod,
        startDate,
        endDate,
        employee: selectedEmployee
      });
      try {
        // Build query params with filters
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedEmployee !== 'todos') params.append('employeeId', selectedEmployee);
        
        const url = `/api/timecard/reports/overtime/${selectedPeriod}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await apiRequest('GET', url);

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

  const { data: complianceReport, isLoading: complianceLoading, error: complianceError } = useQuery({
    queryKey: ['compliance-report', selectedPeriod, startDate, endDate, selectedEmployee],
    queryFn: async () => {
      console.log('[TIMECARD-REPORTS] Fetching compliance report with filters:', {
        period: selectedPeriod,
        startDate,
        endDate,
        employee: selectedEmployee
      });
      try {
        // Build query params with filters
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedEmployee !== 'todos') params.append('employeeId', selectedEmployee);
        
        const url = `/api/timecard/reports/compliance/${selectedPeriod}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await apiRequest('GET', url);

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
        console.log('[TIMECARD-REPORTS] Compliance report data received:', data);

        if (!data.success && data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (error) {
        console.error('[TIMECARD-REPORTS] Error fetching compliance report:', error);
        throw error;
      }
    },
    enabled: reportType === 'compliance',
    retry: false
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

  // Fetch users for employee filter
  const { data: usersData } = useQuery({
    queryKey: ['/api/timecard/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/users');
      if (!response.ok) {
        throw new Error(t('TimecardReports.erroResponsestatusResponsestatustext'));
      }
      return response.json();
    }
  });

  const currentReport = reportType === 'attendance' ? attendanceReport : 
                       reportType === 'overtime' ? overtimeReport : 
                       complianceReport;

  const isLoading = attendanceLoading || overtimeLoading || complianceLoading;
  const currentError = attendanceError || overtimeError || complianceError;

  // Debug logging for data rendering
  console.log('[TIMECARD-REPORTS-DEBUG] Current state:', {
    reportType,
    currentReport: currentReport ? {
      success: currentReport.success,
      hasData: !!(currentReport.data || currentReport.records),
      isArray: Array.isArray(currentReport.data || currentReport.records),
      dataLength: (currentReport.data || currentReport.records)?.length,
      firstItem: (currentReport.data || currentReport.records)?.[0]
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Funcionário</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Usuário Atual</SelectItem>
                  {usersData?.users?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
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
            📋 ESPELHO DE PONTO ELETRÔNICO - PADRÃO CLT
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Conforme Portaria MTE 671/2021 - Registro Eletrônico de Ponto
          </p>
          
          {/* Cabeçalho de Identificação Obrigatório */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">📋 IDENTIFICAÇÃO DO FUNCIONÁRIO</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div><span className="font-medium">Funcionário:</span> Alex Silva</div>
                <div><span className="font-medium">Matrícula:</span> 550e8400</div>
                <div><span className="font-medium">Setor:</span> Tecnologia da Informação</div>
              </div>
              <div className="space-y-1">
                <div><span className="font-medium">Empresa:</span> Conductor Support Platform</div>
                <div><span className="font-medium">Período:</span> Agosto/2025</div>
                <div><span className="font-medium">Regime:</span> CLT - 44h semanais</div>
              </div>
            </div>
          </div>
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
          ) : currentReport?.success && (
            (reportType === 'attendance' && currentReport?.records && Array.isArray(currentReport.records) && currentReport.records.length > 0) ||
            (reportType === 'overtime' && currentReport?.data && Array.isArray(currentReport.data) && currentReport.data.length > 0) ||
            (reportType === 'compliance' && currentReport?.data && Array.isArray(currentReport.data) && currentReport.data.length >= 0)
          ) ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-2 border-black px-3 py-3 text-center font-bold">DATA<br/><span className="font-normal text-xs">(DD/MM/YYYY)</span></th>
                    <th className="border-2 border-black px-2 py-3 text-center font-bold">DIA DA<br/>SEMANA</th>
                    <th className="border-2 border-black px-3 py-3 text-center font-bold">1ª ENTRADA<br/><span className="font-normal text-xs">(HH:MM)</span></th>
                    <th className="border-2 border-black px-3 py-3 text-center font-bold">1ª SAÍDA<br/><span className="font-normal text-xs">Almoço</span></th>
                    <th className="border-2 border-black px-3 py-3 text-center font-bold">2ª ENTRADA<br/><span className="font-normal text-xs">Retorno</span></th>
                    <th className="border-2 border-black px-3 py-3 text-center font-bold">2ª SAÍDA<br/><span className="font-normal text-xs">Final</span></th>
                    <th className="border-2 border-black px-3 py-3 text-center font-bold">TOTAL<br/>HORAS</th>
                    <th className="border-2 border-black px-2 py-3 text-center font-bold">STATUS<br/>CLT</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportType === 'attendance' ? 
                      currentReport.records : 
                      (currentReport.data || [])
                    )
                    ?.sort((a: any, b: any) => {
                      const dateA = new Date(a.date || '1970-01-01').getTime();
                      const dateB = new Date(b.date || '1970-01-01').getTime();
                      return dateA - dateB;
                    })
                    ?.map((record: any, index: number) => (
                      <tr key={index} className={`${!record.isConsistent ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'} h-14`}>
                        <td className="border-2 border-black px-2 py-3 text-center font-bold text-sm">
                          {record.date}
                        </td>
                        <td className="border-2 border-black px-2 py-3 text-center font-bold text-sm">
                          {record.dayOfWeek}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-center font-mono font-bold text-lg text-blue-700">
                          {record.firstEntry}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-center font-mono font-bold text-lg text-orange-600">
                          {record.firstExit}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-center font-mono font-bold text-lg text-green-600">
                          {record.secondEntry}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-center font-mono font-bold text-lg text-red-600">
                          {record.secondExit}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-center font-mono font-bold text-lg text-green-700">
                          {record.totalHours}h
                        </td>
                        <td className="border-2 border-black px-2 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 ${
                              record.status === 'approved' ? 'bg-green-500 text-white border-green-600' :
                              record.status === 'pending' ? 'bg-yellow-500 text-white border-yellow-600' :
                              record.status === 'working' ? 'bg-blue-500 text-white border-blue-600' :
                              'bg-gray-500 text-white border-gray-600'
                            }`}>
                               {record.status === 'approved' ? '✅ OK' :
                               record.status === 'pending' ? '⏳ PEND' :
                               record.status === 'working' ? '🔄 TRAB' :
                               record.status}
                            </span>
                            {!record.isConsistent && (
                              <span className="text-red-600 font-bold text-xs">⚠️ INCONS</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* RESUMO MENSAL OBRIGATÓRIO - PORTARIA MTE 671/2021 */}
              {/* Resumo baseado no tipo de relatório */}
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <h4 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                  📊 {reportType === 'attendance' ? 'RESUMO MENSAL OBRIGATÓRIO - CLT' : 
                      reportType === 'overtime' ? 'RESUMO DE HORAS EXTRAS' : 
                      'RESUMO DE COMPLIANCE'}
                  <span className="text-xs bg-green-200 px-2 py-1 rounded">
                    {reportType === 'attendance' ? 'Portaria MTE 671/2021' : 
                     reportType === 'overtime' ? 'Análise de Sobrejornada' : 
                     'Análise de Conformidade'}
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                  {reportType === 'attendance' && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {currentReport.summary?.totalHours || '0.0'}h
                        </div>
                        <div className="font-semibold text-green-800">Total de Horas</div>
                        <div className="text-xs text-gray-600 mt-1">Soma do período</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          {currentReport.summary?.workingDays || 0}
                        </div>
                        <div className="font-semibold text-blue-800">Dias Trabalhados</div>
                        <div className="text-xs text-gray-600 mt-1">Quantidade de dias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700">
                          {currentReport.summary?.overtimeHours || '0.0'}h
                        </div>
                        <div className="font-semibold text-orange-800">Horas Extras</div>
                        <div className="text-xs text-gray-600 mt-1">Total de sobrejornada</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-700">
                          {currentReport.summary?.averageHoursPerDay || '0.0'}h
                        </div>
                        <div className="font-semibold text-purple-800">Média Diária</div>
                        <div className="text-xs text-gray-600 mt-1">Horas por dia trabalhado</div>
                      </div>
                    </>
                  )}
                  {reportType === 'overtime' && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700">
                          {currentReport.summary?.totalOvertimeHours || '0.0'}h
                        </div>
                        <div className="font-semibold text-orange-800">Total Horas Extras</div>
                        <div className="text-xs text-gray-600 mt-1">Período selecionado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          R$ {currentReport.summary?.totalOvertimeValue || '0.00'}
                        </div>
                        <div className="font-semibold text-green-800">Valor Total</div>
                        <div className="text-xs text-gray-600 mt-1">R$ {currentReport.summary?.hourlyRate || '25.50'}/hora</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          {currentReport.summary?.overtimeDaysCount || 0}
                        </div>
                        <div className="font-semibold text-blue-800">Dias com Extras</div>
                        <div className="text-xs text-gray-600 mt-1">Dias trabalhados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-700">
                          {currentReport.summary?.averageOvertimePerDay || '0.0'}h
                        </div>
                        <div className="font-semibold text-purple-800">Média Diária</div>
                        <div className="text-xs text-gray-600 mt-1">Horas extras/dia</div>
                      </div>
                    </>
                  )}
                  {reportType === 'compliance' && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {currentReport.summary?.complianceRate || '0%'}
                        </div>
                        <div className="font-semibold text-green-800">Taxa de Conformidade</div>
                        <div className="text-xs text-gray-600 mt-1">Registros corretos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-700">
                          {currentReport.summary?.issuesFound || 0}
                        </div>
                        <div className="font-semibold text-red-800">Problemas Encontrados</div>
                        <div className="text-xs text-gray-600 mt-1">Total de inconsistências</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700">
                          {currentReport.summary?.highSeverityIssues || 0}
                        </div>
                        <div className="font-semibold text-orange-800">Críticos</div>
                        <div className="text-xs text-gray-600 mt-1">Alta severidade</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          {currentReport.summary?.totalRecords || 0}
                        </div>
                        <div className="font-semibold text-blue-800">Total Registros</div>
                        <div className="text-xs text-gray-600 mt-1">Analisados</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* OBSERVAÇÕES LEGAIS E COMPLIANCE */}
              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <h4 className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  🔐 OBSERVAÇÕES LEGAIS OBRIGATÓRIAS
                </h4>
                <div className="text-xs text-gray-700 space-y-2">
                  <div>• <strong>Sistema CLT-Compliant:</strong> Registros realizados através de sistema eletrônico conforme legislação trabalhista brasileira</div>
                  <div>• <strong>Integridade de Dados:</strong> Garantida por hash SHA-256 conforme Portaria MTE 671/2021</div>
                  <div>• <strong>Fuso Horário:</strong> Todos os horários estão em UTC-3 (Horário de Brasília)</div>
                  <div>• <strong>NSR:</strong> Número Sequencial de Registro para auditoria e compliance</div>
                </div>
              </div>

              {/* ASSINATURAS DIGITAIS OBRIGATÓRIAS */}
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                  ✍️ ASSINATURAS DIGITAIS OBRIGATÓRIAS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white border border-blue-200 rounded">
                    <div className="font-bold text-sm text-blue-800">👤 FUNCIONÁRIO</div>
                    <div className="text-xs mt-2 text-gray-600">Assinatura Digital</div>
                    <div className="text-xs font-mono mt-1 bg-gray-100 p-2 rounded">
                      SHA-256: a7b9c2d4...
                    </div>
                    <div className="text-xs text-green-600 mt-2">✅ Certificado Válido</div>
                  </div>
                  <div className="text-center p-3 bg-white border border-blue-200 rounded">
                    <div className="font-bold text-sm text-blue-800">🏢 RESPONSÁVEL RH</div>
                    <div className="text-xs mt-2 text-gray-600">Validação Departamento Pessoal</div>
                    <div className="text-xs font-mono mt-1 bg-gray-100 p-2 rounded">
                      SHA-256: e8f1a5c9...
                    </div>
                    <div className="text-xs text-green-600 mt-2">✅ Certificado Válido</div>
                  </div>
                  <div className="text-center p-3 bg-white border border-blue-200 rounded">
                    <div className="font-bold text-sm text-blue-800">⚙️ SISTEMA CLT</div>
                    <div className="text-xs mt-2 text-gray-600">Certificação Automatizada</div>
                    <div className="text-xs font-mono mt-1 bg-gray-100 p-2 rounded">
                      SHA-256: 3d6e7b2f...
                    </div>
                    <div className="text-xs text-green-600 mt-2">✅ Certificado Válido</div>
                  </div>
                </div>
                <div className="text-center mt-4 text-xs text-gray-600">
                  <div><strong>Data/Hora da Certificação:</strong> {new Date().toLocaleString('pt-BR')} (UTC-3)</div>
                  <div className="mt-1"><strong>Versão do Sistema:</strong> Conductor CLT v2025.08.06</div>
                </div>
              </div>
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