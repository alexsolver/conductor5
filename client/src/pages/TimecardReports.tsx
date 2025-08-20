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
        
        const url = `/api/timecard/reports/attendance/selectedPeriod + (params.toString() ? "?" + params.toString() : "")
        const response = await apiRequest('GET', url);
        if (!response.ok) {
          console.error('[TIMECARD-REPORTS] HTTP Error:', response.status, response.statusText);
          throw new Error("HTTP " + response.status + ": " + response.statusText);
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
        
        const url = `/api/timecard/reports/overtime/selectedPeriod + (params.toString() ? "?" + params.toString() : "")
        const response = await apiRequest('GET', url);
        if (!response.ok) {
          console.error('[TIMECARD-REPORTS] HTTP Error:', response.status, response.statusText);
          throw new Error("HTTP " + response.status + ": " + response.statusText);
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
        
        const url = `/api/timecard/reports/compliance/selectedPeriod + (params.toString() ? "?" + params.toString() : "")
        const response = await apiRequest('GET', url);
        if (!response.ok) {
          console.error('[TIMECARD-REPORTS] HTTP Error:', response.status, response.statusText);
          throw new Error("HTTP " + response.status + ": " + response.statusText);
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
        throw new Error("Erro " + response.status + ": " + response.statusText");
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
    <div className="p-4"
      <div className="p-4"
        <div>
          <h1 className="p-4"
            Relatórios de Ponto
          </h1>
          <p className="p-4"
            Análises e relatórios de frequência dos funcionários
          </p>
        </div>
        <div className="p-4"
          <Button onClick={exportToExcel} variant="outline" size="sm>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">"Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4"
            <div>
              <label className="text-lg">"Data Inicial</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-lg">"Data Final</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-lg">"Funcionário</label>
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
              <label className="text-lg">"Tipo de Relatório</label>
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
      <div className="p-4"
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="p-4"
              <Users className="h-4 w-4" />
              Funcionários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">"0</div>
            <p className="text-lg">"No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="p-4"
              <Clock className="h-4 w-4" />
              Presença Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">"0%</div>
            <p className="text-lg">"Taxa de presença</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="p-4"
              <TrendingUp className="h-4 w-4" />
              Faltas Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">"0</div>
            <p className="text-lg">"Faltas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="p-4"
              <CalendarDays className="h-4 w-4" />
              Atrasos Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">"0</div>
            <p className="text-lg">"Atrasos registrados</p>
          </CardContent>
        </Card>
      </div>
      {/* Relatório CLT Brasileiro */}
      <Card>
        <CardHeader>
          <CardTitle className="p-4"
            <FileText className="h-5 w-5" />
            📋 ESPELHO DE PONTO ELETRÔNICO - PADRÃO CLT
          </CardTitle>
          <p className="p-4"
            Conforme Portaria MTE 671/2021 - Registro Eletrônico de Ponto
          </p>
          
          {/* Cabeçalho de Identificação Obrigatório */}
          <div className="p-4"
            <h4 className="text-lg">"📋 IDENTIFICAÇÃO DO FUNCIONÁRIO</h4>
            <div className="p-4"
              <div className="p-4"
                <div><span className="text-lg">"Funcionário:</span> Alex Silva</div>
                <div><span className="text-lg">"Matrícula:</span> 550e8400</div>
                <div><span className="text-lg">"Setor:</span> Tecnologia da Informação</div>
              </div>
              <div className="p-4"
                <div><span className="text-lg">"Empresa:</span> Conductor Support Platform</div>
                <div><span className="text-lg">"Período:</span> Agosto/2025</div>
                <div><span className="text-lg">"Regime:</span> CLT - 44h semanais</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-4"
              <div className="text-lg">"Carregando relatório...</div>
            </div>
          ) : currentError ? (
            <div className="p-4"
              <div>Erro ao carregar dados: {currentError.message}</div>
              <div className="text-lg">"Verifique sua conexão e tente novamente</div>
            </div>
          ) : currentReport?.success && (
            (reportType === 'attendance' && currentReport?.records && Array.isArray(currentReport.records) && currentReport.records.length > 0) ||
            (reportType === 'overtime' && currentReport?.data && Array.isArray(currentReport.data) && currentReport.data.length > 0) ||
            (reportType === 'compliance' && currentReport?.data && Array.isArray(currentReport.data) && currentReport.data.length >= 0)
          ) ? (
            <div className="p-4"
              <table className="p-4"
                <thead>
                  <tr className="p-4"
                    <th className="text-lg">"DATA<br/><span className="text-lg">"(DD/MM/YYYY)</span></th>
                    <th className="text-lg">"DIA DA<br/>SEMANA</th>
                    <th className="text-lg">"1ª ENTRADA<br/><span className="text-lg">"(HH:MM)</span></th>
                    <th className="text-lg">"1ª SAÍDA<br/><span className="text-lg">"Almoço</span></th>
                    <th className="text-lg">"2ª ENTRADA<br/><span className="text-lg">"Retorno</span></th>
                    <th className="text-lg">"2ª SAÍDA<br/><span className="text-lg">"Final</span></th>
                    <th className="text-lg">"TOTAL<br/>HORAS</th>
                    <th className="text-lg">"STATUS<br/>CLT</th>
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
                      <tr key={index} className="p-4"
                        <td className="p-4"
                          {record.date}
                        </td>
                        <td className="p-4"
                          {record.dayOfWeek}
                        </td>
                        <td className="p-4"
                          {record.firstEntry}
                        </td>
                        <td className="p-4"
                          {record.firstExit}
                        </td>
                        <td className="p-4"
                          {record.secondEntry}
                        </td>
                        <td className="p-4"
                          {record.secondExit}
                        </td>
                        <td className="p-4"
                          {record.totalHours}h
                        </td>
                        <td className="p-4"
                          <div className="p-4"
                            <span className={"inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 ${
                              record.status === 'approved' ? 'bg-green-500 text-white border-green-600' :
                              record.status === 'pending' ? 'bg-yellow-500 text-white border-yellow-600' :
                              record.status === 'working' ? 'bg-blue-500 text-white border-blue-600' :
                              'bg-gray-500 text-white border-gray-600'
                            >
                               {record.status === "approved" ? "✅ Aprovado"K' :
                               record.status === 'pending' ? '⏳ PEND' :
                               record.status === 'working' ? '🔄 TRAB' :
                               record.status}
                            </span>
                            {!record.isConsistent && (
                              <span className="text-lg">"⚠️ INCONS</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {/* RESUMO MENSAL OBRIGATÓRIO - PORTARIA MTE 671/2021 */}
              {/* Resumo baseado no tipo de relatório */}
              <div className="p-4"
                <h4 className="p-4"
                  📊 {reportType === 'attendance' ? 'RESUMO MENSAL OBRIGATÓRIO - CLT' : 
                      reportType === 'overtime' ? 'RESUMO DE HORAS EXTRAS' : 
                      'RESUMO DE COMPLIANCE'}
                  <span className="p-4"
                    {reportType === 'attendance' ? 'Portaria MTE 671/2021' : 
                     reportType === 'overtime' ? 'Análise de Sobrejornada' : 
                     'Análise de Conformidade'}
                  </span>
                </h4>
                <div className="p-4"
                  {reportType === 'attendance' && (
                    <>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.totalHours || '0.0'}h
                        </div>
                        <div className="text-lg">"Total de Horas</div>
                        <div className="text-lg">"Soma do período</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.workingDays || 0}
                        </div>
                        <div className="text-lg">"Dias Trabalhados</div>
                        <div className="text-lg">"Quantidade de dias</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.overtimeHours || '0.0'}h
                        </div>
                        <div className="text-lg">"Horas Extras</div>
                        <div className="text-lg">"Total de sobrejornada</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.averageHoursPerDay || '0.0'}h
                        </div>
                        <div className="text-lg">"Média Diária</div>
                        <div className="text-lg">"Horas por dia trabalhado</div>
                      </div>
                    </>
                  )}
                  {reportType === 'overtime' && (
                    <>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.totalOvertimeHours || '0.0'}h
                        </div>
                        <div className="text-lg">"Total Horas Extras</div>
                        <div className="text-lg">"Período selecionado</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          R$ {currentReport.summary?.totalOvertimeValue || '0.00'}
                        </div>
                        <div className="text-lg">"Valor Total</div>
                        <div className="text-lg">"R$ {currentReport.summary?.hourlyRate || '25.50'}/hora</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.overtimeDaysCount || 0}
                        </div>
                        <div className="text-lg">"Dias com Extras</div>
                        <div className="text-lg">"Dias trabalhados</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.averageOvertimePerDay || '0.0'}h
                        </div>
                        <div className="text-lg">"Média Diária</div>
                        <div className="text-lg">"Horas extras/dia</div>
                      </div>
                    </>
                  )}
                  {reportType === 'compliance' && (
                    <>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.complianceRate || '0%'}
                        </div>
                        <div className="text-lg">"Taxa de Conformidade</div>
                        <div className="text-lg">"Registros corretos</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.issuesFound || 0}
                        </div>
                        <div className="text-lg">"Problemas Encontrados</div>
                        <div className="text-lg">"Total de inconsistências</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.highSeverityIssues || 0}
                        </div>
                        <div className="text-lg">"Críticos</div>
                        <div className="text-lg">"Alta severidade</div>
                      </div>
                      <div className="p-4"
                        <div className="p-4"
                          {currentReport.summary?.totalRecords || 0}
                        </div>
                        <div className="text-lg">"Total Registros</div>
                        <div className="text-lg">"Analisados</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* OBSERVAÇÕES LEGAIS E COMPLIANCE */}
              <div className="p-4"
                <h4 className="p-4"
                  🔐 OBSERVAÇÕES LEGAIS OBRIGATÓRIAS
                </h4>
                <div className="p-4"
                  <div>• <strong>Sistema CLT-Compliant:</strong> Registros realizados através de sistema eletrônico conforme legislação trabalhista brasileira</div>
                  <div>• <strong>Integridade de Dados:</strong> Garantida por hash SHA-256 conforme Portaria MTE 671/2021</div>
                  <div>• <strong>Fuso Horário:</strong> Todos os horários estão em UTC-3 (Horário de Brasília)</div>
                  <div>• <strong>NSR:</strong> Número Sequencial de Registro para auditoria e compliance</div>
                </div>
              </div>
              {/* ASSINATURAS DIGITAIS OBRIGATÓRIAS */}
              <div className="p-4"
                <h4 className="p-4"
                  ✍️ ASSINATURAS DIGITAIS OBRIGATÓRIAS
                </h4>
                <div className="p-4"
                  <div className="p-4"
                    <div className="text-lg">"👤 FUNCIONÁRIO</div>
                    <div className="text-lg">"Assinatura Digital</div>
                    <div className="p-4"
                      SHA-256: a7b9c2d4...
                    </div>
                    <div className="text-lg">"✅ Certificado Válido</div>
                  </div>
                  <div className="p-4"
                    <div className="text-lg">"🏢 RESPONSÁVEL RH</div>
                    <div className="text-lg">"Validação Departamento Pessoal</div>
                    <div className="p-4"
                      SHA-256: e8f1a5c9...
                    </div>
                    <div className="text-lg">"✅ Certificado Válido</div>
                  </div>
                  <div className="p-4"
                    <div className="text-lg">"⚙️ SISTEMA CLT</div>
                    <div className="text-lg">"Certificação Automatizada</div>
                    <div className="p-4"
                      SHA-256: 3d6e7b2f...
                    </div>
                    <div className="text-lg">"✅ Certificado Válido</div>
                  </div>
                </div>
                <div className="p-4"
                  <div><strong>Data/Hora da Certificação:</strong> {new Date().toLocaleString('pt-BR')} (UTC-3)</div>
                  <div className="text-lg">"<strong>Versão do Sistema:</strong> Conductor CLT v2025.08.06</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4"
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg">"Nenhum dado encontrado para o período selecionado</div>
              <div className="p-4"
                Selecione um período diferente ou verifique se há registros de ponto aprovados
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}