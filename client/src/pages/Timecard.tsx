import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, AlertTriangle, FileText, Calendar, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { detectEmploymentType } from '@/lib/employmentDetection';

interface TimeRecord {
  id: string;
  userId: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
  location?: string;
  isManualEntry?: boolean;
  status?: string;
  totalHours?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CurrentStatus {
  status: 'not_started' | 'working' | 'on_break' | 'finished';
  todayRecords: TimeRecord[];
  timesheet?: any;
  lastRecord?: TimeRecord;
}

interface TimeAlert {
  id: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  createdAt: string;
}

interface MirrorRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  firstEntry: string;
  firstExit: string;
  secondEntry: string;
  secondExit: string;
  totalHours: string;
  overtimeHours: string;
  status: string;
  workScheduleType: string;
  isConsistent: boolean;
  observations: string;
}

// Função para transformar dados do frontend para backend
const transformTimecardData = (frontendData: any) => {
  const now = new Date().toISOString();
  const payload: any = {
    isManualEntry: frontendData.deviceType !== 'web',
    notes: frontendData.notes || null
  };

  // Apenas entrada ou saída - pausas são calculadas automaticamente
  switch (frontendData.recordType) {
    case 'clock_in':
      payload.checkIn = now;
      break;
    case 'clock_out':
      payload.checkOut = now;
      break;
    default:
      // Default to clock in if no specific type
      payload.checkIn = now;
      break;
  }

  // Adicionar localização se disponível
  if (frontendData.location) {
    try {
      payload.location = JSON.stringify(frontendData.location);
    } catch (e) {
      console.warn('Error serializing location data:', e);
      payload.location = null;
    }
  }

  // Remove undefined values to prevent JSON issues
  return Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );
};

export default function Timecard() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>({
    status: 'not_started',
    todayRecords: [],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obter dados do usuário
  const { data: userInfo } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: true,
  });

  const detectedType = detectEmploymentType(userInfo);
  
  console.log('[EMPLOYMENT-DETECTION] Input user:', userInfo);
  console.log('[EMPLOYMENT-DETECTION] Using employmentType field:', userInfo?.employmentType);
  console.log('[EMPLOYMENT-DEBUG] User data:', { email: userInfo?.email, role: userInfo?.role, employmentType: userInfo?.employmentType, detectedType });

  // Query para buscar dados do espelho de ponto eletrônico
  const currentPeriod = format(new Date(), 'yyyy-MM');
  
  const { data: mirrorData, isLoading: mirrorLoading, error: mirrorError } = useQuery({
    queryKey: ['/api/timecard/reports/attendance', currentPeriod],
    queryFn: async () => {
      console.log('[TIMECARD-MIRROR] Fetching report for:', currentPeriod);
      try {
        const response = await apiRequest('GET', `/api/timecard/reports/attendance/${currentPeriod}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('[TIMECARD-MIRROR] Report data received:', data);
        console.log('[TIMECARD-MIRROR] Records count:', data?.records?.length || 0);
        return data;
      } catch (error) {
        console.error('[TIMECARD-MIRROR] Error fetching report:', error);
        throw error;
      }
    },
    enabled: true,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Query para obter status atual
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['/api/timecard/current-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/current-status');
      const data = await response.json();
      return data;
    },
    enabled: true,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Atualizar estado local quando dados chegarem
  useEffect(() => {
    if (statusData) {
      console.log('[TIMECARD-DEBUG] Status data received:', statusData);
      
      // ✅ 1QA.MD: Usar o status correto que vem do backend, não recalcular
      // O backend já calcula o status corretamente usando os nomes corretos das colunas
      setCurrentStatus({
        ...statusData,
        status: statusData.status // Usar o status que vem do backend
      });
    }
  }, [statusData]);

  // Obter localização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
        },
        (error) => {
          setLocationError('Não foi possível obter a localização');
          console.warn('Erro ao obter localização:', error);
        }
      );
    }
  }, []);

  // Mutation para registrar ponto
  const recordMutation = useMutation({
    mutationFn: async (data: { recordType: string; deviceType: string; location?: any; notes?: string }) => {
      try {
        // Transformar dados do frontend para formato backend
        const transformedData = transformTimecardData(data);
        console.log('[TIMECARD-DEBUG] Sending data:', transformedData);
        
        const response = await apiRequest('POST', '/api/timecard/timecard-entries', transformedData);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('[TIMECARD-DEBUG] Response:', result);
        
        if (!result.success && result.success !== undefined) {
          throw new Error(result.message || 'Falha ao processar registro');
        }
        
        return result.data || result;
      } catch (error) {
        console.error('[TIMECARD-DEBUG] API Error:', error);
        throw error;
      }
    },
    onSuccess: (result: any) => {
      console.log('Registro de ponto bem-sucedido:', result);
      toast({
        title: 'Ponto registrado com sucesso!',
        description: 'Seu registro foi salvo e processado.',
      });
      // Invalidar cache e forçar nova busca para atualizar status
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/current-status'] });
      queryClient.refetchQueries({ queryKey: ['/api/timecard/current-status'] });
    },
    onError: (error: any) => {
      console.error('Erro ao registrar ponto:', error);
      
      let errorTitle = 'Erro ao registrar ponto';
      let errorMessage = 'Tente novamente em alguns instantes.';
      
      // Extract specific error messages
      if (error?.message) {
        if (error.message.includes('UNAUTHORIZED')) {
          errorTitle = 'Erro de Autenticação';
          errorMessage = 'Faça login novamente para continuar.';
        } else if (error.message.includes('VALIDATION_ERROR')) {
          errorTitle = 'Dados Inválidos';
          errorMessage = 'Verifique os dados e tente novamente.';
        } else if (error.message.includes('DUPLICATE_ENTRY')) {
          errorTitle = 'Registro Duplicado';
          errorMessage = 'Este ponto já foi registrado.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleTimeRecord = async (recordType: string) => {
    const locationData = location ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: undefined, // Poderia usar reverse geocoding aqui
    } : undefined;

    recordMutation.mutate({
      recordType,
      deviceType: 'web',
      location: locationData,
    });
  };

  const getStatusBadge = (status: string) => {
    console.log('[TIMECARD-DEBUG] Getting status badge for:', status);
    switch (status) {
      case 'working':
        return <Badge className="bg-green-500">Trabalhando</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500">Finalizado</Badge>;
      default:
        return <Badge variant="outline">Não iniciado</Badge>;
    }
  };

  const getAvailableActions = (status: string, todayRecords: TimeRecord[] = []) => {
    console.log('[TIMECARD-DEBUG] Determining available actions for status:', status, 'Records:', todayRecords.length);
    
    const actions = [];
    
    // ✅ 1QA.MD: Usar nomes corretos das colunas do banco (check_in, check_out)
    const validRecords = todayRecords.filter(record => record.check_in || record.check_out);
    const hasActiveEntry = validRecords.some(record => record.check_in && !record.check_out);
    
    if (hasActiveEntry) {
      // Há uma entrada ativa sem saída - mostrar botão de saída
      actions.push({ type: 'clock_out', label: 'Registrar Saída', color: 'bg-red-600', primary: true });
    } else {
      // Não há entrada ativa - mostrar botão de entrada
      actions.push({ type: 'clock_in', label: 'Registrar Entrada', color: 'bg-green-600', primary: true });
    }
    
    return actions;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    try {
      return format(new Date(dateString), 'HH:mm', { locale: ptBR });
    } catch (error) {
      console.warn('Error formatting time:', dateString, error);
      return '--:--';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--/----';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return '--/--/----';
    }
  };

  // Calcular horas trabalhadas hoje
  const calculateTodayHours = (records: TimeRecord[]) => {
    let totalMinutes = 0;
    const completedRecords = records.filter(r => r.checkIn && r.checkOut);
    
    completedRecords.forEach(record => {
      if (record.checkIn && record.checkOut) {
        const start = new Date(record.checkIn);
        const end = new Date(record.checkOut);
        const diff = end.getTime() - start.getTime();
        totalMinutes += Math.max(0, diff / (1000 * 60));
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  // Componente do Espelho de Ponto Completo - Conforme CLT
  const TimecardMirror = () => {
    // Usar os dados já carregados pela query principal
    const monthlyReport = mirrorData;
    const monthlyLoading = mirrorLoading;
    const monthlyError = mirrorError;

    const { data: userInfo } = useQuery({
      queryKey: ['/api/auth/user'],
      queryFn: async () => {
        const response = await apiRequest('GET', '/api/auth/user');
        return response.json();
      }
    });

    const calculateMonthlyTotals = (records: any[]) => {
      if (!records || !Array.isArray(records)) {
        console.log('[TIMECARD-MIRROR] No records or invalid records:', records);
        return { totalHours: 0, totalDays: 0, overtimeHours: 0 };
      }
      
      const totalHours = records.reduce((sum, record) => {
        const hours = parseFloat(record.totalHours || '0');
        return sum + hours;
      }, 0);
      
      const workingDays = records.filter(r => parseFloat(r.totalHours || '0') > 0).length;
      const normalHours = workingDays * 8; // 8h por dia
      const overtimeHours = Math.max(0, totalHours - normalHours);
      
      return {
        totalHours: totalHours.toFixed(1),
        totalDays: workingDays,
        overtimeHours: overtimeHours.toFixed(1)
      };
    };

    // Use data from monthlyReport.summary if available, otherwise calculate
    const monthlyTotals = monthlyReport?.summary || 
      (monthlyReport?.records ? calculateMonthlyTotals(monthlyReport.records) : null);

    return (
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-6 w-6" />
                ESPELHO DE PONTO ELETRÔNICO
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {format(new Date(), 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Portaria MTE 671/2021</div>
              <div>Sistema CLT Compliant</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Cabeçalho com informações do funcionário */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Funcionário:</strong> {userInfo?.firstName} {userInfo?.lastName}<br/>
                <strong>Matrícula:</strong> {userInfo?.id?.slice(-8) || 'N/A'}<br/>
                <strong>Setor:</strong> Tecnologia da Informação
              </div>
              <div>
                <strong>Empresa:</strong> Conductor Support Platform<br/>
                <strong>Período:</strong> {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}<br/>
                <strong>Regime:</strong> CLT - 44h semanais
              </div>
            </div>
          </div>

          {monthlyLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Carregando espelho de ponto...</div>
            </div>
          ) : monthlyError ? (
            <div className="text-center text-gray-500 py-8">
              <div>📄 Carregando espelho de ponto...</div>
              <div className="text-sm mt-2">Aguarde enquanto os dados são processados</div>
            </div>
          ) : monthlyReport?.records && monthlyReport.records.length > 0 ? (
            <>
              {/* Tabela de registros */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2">Data</th>
                      <th className="border border-gray-300 px-3 py-2">Dia</th>
                      <th className="border border-gray-300 px-3 py-2">1ª Entrada</th>
                      <th className="border border-gray-300 px-3 py-2">1ª Saída</th>
                      <th className="border border-gray-300 px-3 py-2">2ª Entrada</th>
                      <th className="border border-gray-300 px-3 py-2">2ª Saída</th>
                      <th className="border border-gray-300 px-3 py-2">Horas</th>
                      <th className="border border-gray-300 px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.records
                      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((record: any, index: number) => {
                        const recordDate = new Date(record.date);
                        const dayName = format(recordDate, 'EEEE', { locale: ptBR });
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-3 py-2">
                              {formatDate(record.date)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 capitalize">
                              {dayName.slice(0, 3)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-mono">
                              {record.checkIn ? formatTime(record.checkIn) : '--:--'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-mono">
                              {record.breakStart ? formatTime(record.breakStart) : '--:--'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-mono">
                              {record.breakEnd ? formatTime(record.breakEnd) : '--:--'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-mono">
                              {record.checkOut ? formatTime(record.checkOut) : '--:--'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-mono text-center">
                              {record.totalHours ? `${parseFloat(record.totalHours).toFixed(1)}h` : '0:00'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <span className={`px-2 py-1 text-xs rounded ${
                                record.status === 'approved' ? 'bg-green-100 text-green-800' :
                                record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {record.status === 'approved' ? 'OK' : 
                                 record.status === 'pending' ? 'Pend' : 
                                 'Proc'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Resumo mensal */}
              {monthlyTotals && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {typeof monthlyTotals.totalHours === 'string' ? monthlyTotals.totalHours : monthlyTotals.totalHours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Total de Horas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{monthlyTotals.totalDays || monthlyTotals.workingDays || 0}</div>
                    <div className="text-sm text-gray-600">Dias Trabalhados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {typeof monthlyTotals.overtimeHours === 'string' ? monthlyTotals.overtimeHours : monthlyTotals.overtimeHours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Horas Extras</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {monthlyTotals.averageHoursPerDay || '0.0'}h
                    </div>
                    <div className="text-sm text-gray-600">Média/Dia</div>
                  </div>
                </div>
              )}

              {/* Observações e assinaturas */}
              <div className="mt-6 space-y-4 text-xs">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <strong>Observações:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    <li>Registros realizados através de sistema eletrônico CLT-compliant</li>
                    <li>Integridade garantida por hash SHA-256 conforme Portaria MTE 671/2021</li>
                    <li>Todos os horários estão em fuso horário UTC-3 (Brasília)</li>
                  </ul>
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-1 w-48">
                      <strong>Funcionário</strong><br/>
                      {userInfo?.firstName} {userInfo?.lastName}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-1 w-48">
                      <strong>Responsável RH</strong><br/>
                      Sistema Automatizado CLT
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="font-medium">Nenhum registro para este período</div>
              <div className="text-sm mt-1">
                Os registros de ponto aparecerão aqui após serem processados
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };



  const status = currentStatus?.status || 'not_started';
  const availableActions = getAvailableActions(status, currentStatus?.todayRecords);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Registro de Ponto</h1>
        {getStatusBadge(status)}
      </div>

      {/* Card Principal - Registrar Ponto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registro de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-mono">
              {format(new Date(), 'HH:mm:ss', { locale: ptBR })}
            </div>
            <div className="text-gray-500">
              {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              Localização capturada: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </div>
          )}

          {locationError && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              {locationError}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-2">
            {availableActions.map((action, index) => (
              <Button
                key={action.type}
                className={`w-full ${action.color} hover:opacity-90 text-white ${action.primary ? '' : 'opacity-80'}`}
                size={action.primary ? "lg" : "default"}
                onClick={() => handleTimeRecord(action.type)}
                disabled={recordMutation.isPending}
              >
                {recordMutation.isPending ? 'Registrando...' : action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registros de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registros de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-pulse">Carregando registros...</div>
            </div>
          ) : statusError ? (
            <div className="text-center text-red-500 py-8">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar registros
              </div>
              <div className="text-sm mt-2">Tente recarregar a página</div>
            </div>
          ) : (statusData?.todayRecords?.length > 0 || currentStatus?.todayRecords?.length > 0) ? (
            <div className="space-y-3">
              {(statusData?.todayRecords || currentStatus?.todayRecords || [])
                .sort((a, b) => {
                  // Ordenar por data de criação, mais recente primeiro
                  const dateA = new Date(a.createdAt || a.checkIn || a.checkOut || a.breakStart || a.breakEnd || '');
                  const dateB = new Date(b.createdAt || b.checkIn || b.checkOut || b.breakStart || b.breakEnd || '');
                  return dateB.getTime() - dateA.getTime();
                })
                .map((record: TimeRecord) => (
                <div key={record.id} className="flex justify-between items-center py-3 border-b">
                  <div>
                    <div className="font-medium">
                      {record.checkIn && record.checkOut ? 'Entrada/Saída Completa' : 
                       record.checkIn ? 'Entrada Registrada' :
                       record.checkOut ? 'Saída Registrada' : 'Registro'}
                    </div>
                    <div className="text-sm text-gray-500 flex gap-2">
                      <span>Status: {record.status === 'pending' ? 'Aguardando aprovação' : record.status || 'pending'}</span>
                      {record.totalHours && <span>• {record.totalHours}h</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {record.checkIn && record.checkOut ? (
                      <div>
                        <div className="font-mono text-sm">
                          Entrada: {formatTime(record.checkIn)}
                        </div>
                        <div className="font-mono text-sm">
                          Saída: {formatTime(record.checkOut)}
                        </div>
                      </div>
                    ) : (
                      <div className="font-mono">
                        {formatTime(record.checkIn || record.checkOut || record.breakStart || record.breakEnd || record.createdAt || '')}
                      </div>
                    )}
                    {record.location && (
                      <div className="text-xs text-gray-400 mt-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Geo localizado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="mb-2">📝</div>
              <div className="font-medium">Nenhum registro para hoje</div>
              <div className="text-sm mt-1">
                Registre seu primeiro ponto do dia usando o botão acima
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status e Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horas Trabalhadas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateTodayHours(currentStatus?.todayRecords || [])}
            </div>
            <p className="text-xs text-gray-500">Meta: 8h</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStatus?.timesheet?.totalHours?.toFixed(1) || '0'}h
            </div>
            <p className="text-xs text-gray-500">Registradas hoje</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status CLT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(currentStatus?.todayRecords?.length || 0) > 0 ? 'OK' : 'Pendente'}
            </div>
            <p className="text-xs text-gray-500">Conformidade</p>
          </CardContent>
        </Card>
      </div>

      {/* Espelho de Ponto Eletrônico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Espelho de Ponto Eletrônico
          </CardTitle>
          <div className="text-sm text-gray-600">
            {format(new Date(), 'MMMM yyyy', { locale: ptBR }).toUpperCase()} - Portaria MTE 671/2021 Sistema CLT Compliant
          </div>
        </CardHeader>
        <CardContent>
          {mirrorLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-pulse">Carregando espelho de ponto...</div>
            </div>
          ) : mirrorError ? (
            <div className="text-center text-red-500 py-8">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar espelho de ponto
              </div>
              <div className="text-sm mt-2">Tente recarregar a página</div>
            </div>
          ) : mirrorData?.records && mirrorData.records.length > 0 ? (
            <div className="space-y-4">
              {/* Cabeçalho do Relatório */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Funcionário:</strong> {userInfo?.firstName || 'Alex'} {userInfo?.lastName || 'Silva'}<br/>
                    <strong>Matrícula:</strong> {userInfo?.id?.slice(-8) || '55440001'}<br/>
                    <strong>Setor:</strong> Tecnologia da Informação
                  </div>
                  <div>
                    <strong>Empresa:</strong> Conductor Support Platform<br/>
                    <strong>Período:</strong> {format(new Date(), 'MM/yyyy', { locale: ptBR })}<br/>
                    <strong>Regime:</strong> CLT - 44h semanais
                  </div>
                </div>
              </div>

              {/* Tabela de Registros */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 text-left">Data</th>
                      <th className="border border-gray-300 px-2 py-2 text-left">Dia</th>
                      <th className="border border-gray-300 px-2 py-2 text-center">1ª Entrada</th>
                      <th className="border border-gray-300 px-2 py-2 text-center">1ª Saída</th>
                      <th className="border border-gray-300 px-2 py-2 text-center">2ª Entrada</th>
                      <th className="border border-gray-300 px-2 py-2 text-center">2ª Saída</th>
                      <th className="border border-gray-300 px-2 py-2 text-center">Total</th>
                      <th className="border border-gray-300 px-2 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mirrorData.records
                      .sort((a: any, b: any) => {
                        const dateA = new Date(a.date.split('/').reverse().join('-'));
                        const dateB = new Date(b.date.split('/').reverse().join('-'));
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((record: any, index: number) => (
                        <tr key={index} className={`hover:bg-gray-50 ${!record.isConsistent ? 'bg-red-50' : ''}`}>
                          <td className="border border-gray-300 px-2 py-2 font-medium">{record.date}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center">{record.dayOfWeek}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-mono">{record.firstEntry || '--:--'}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-mono">{record.firstExit || '--:--'}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-mono">{record.secondEntry || '--:--'}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-mono">{record.secondExit || '--:--'}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-mono font-semibold">{record.totalHours}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              record.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                              record.status === 'Inconsistente' ? 'bg-red-100 text-red-800' :
                              record.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'Em andamento' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status === 'Aprovado' ? 'OK' :
                               record.status === 'Inconsistente' ? 'INC' :
                               record.status === 'Pendente' ? 'PEN' : 
                               record.status === 'Em andamento' ? 'AND' : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Resumo do Período */}
              {mirrorData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{mirrorData.summary.totalHours || '0.0'}h</div>
                    <div className="text-gray-600">Total de Horas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{mirrorData.summary.workingDays || 0}</div>
                    <div className="text-gray-600">Dias Trabalhados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">{mirrorData.summary.overtimeHours || '0.0'}h</div>
                    <div className="text-gray-600">Horas Extras</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">{mirrorData.summary.averageHoursPerDay || '0.0'}h</div>
                    <div className="text-gray-600">Média Diária</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="font-medium">Nenhum registro para este período</div>
              <div className="text-sm mt-1">
                Os registros de ponto aparecerão aqui após serem processados
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/timecard-reports'}>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="font-medium">Espelho de Ponto</div>
            <div className="text-sm text-gray-500">Ver registros mensais</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/clt-compliance'}>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="font-medium">Banco de Horas</div>
            <div className="text-sm text-gray-500">Saldo e movimentações</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/timecard-reports'}>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="font-medium">Relatórios</div>
            <div className="text-sm text-gray-500">Análises e compliance</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}