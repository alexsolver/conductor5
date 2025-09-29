import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useEmploymentDetection } from '@/hooks/useEmploymentDetection';
import { Clock, Play, Pause, Square, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper function to safely format dates
const safeFormatDate = (timestamp: any, formatStr: string = 'HH:mm:ss'): string => {
  if (!timestamp) return '--:--:--';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '--:--:--';
  
  return format(date, formatStr);
};

/**
 * Timecard page specifically designed for Autonomous workers
 * Uses different terminology but same backend functionality as CLT timecard
 */
export default function TimecardAutonomous() {
  const { terminology, isLoading: employmentLoading } = useEmploymentDetection();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current timecard status - ✅ 1QA.MD: Use correct endpoint
  const { data: timecardStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/timecard/current-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/current-status');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch today's records - ✅ 1QA.MD: Use available endpoint
  const { data: todayRecords } = useQuery({
    queryKey: ['/api/timecard/current-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/current-status');
      const data = await response.json();
      return { records: data.todayRecords || [] };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Clock action mutation - ✅ 1QA.MD: Fix autonomous worker API endpoint
  const clockActionMutation = useMutation({
    mutationFn: async (actionType: string) => {
      const response = await apiRequest('POST', '/api/timecard/timecard-entries', {
        action: actionType,
        timestamp: new Date().toISOString(),
        source: 'autonomous_interface'
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/current-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/today'] });
      
      toast({
        title: "✅ Registro realizado",
        description: `Atividade registrada com sucesso`,
      });
    },
    onError: (error) => {
      console.error('[TIMECARD-AUTONOMOUS] Clock action error:', error);
      toast({
        title: "❌ Erro no registro",
        description: "Não foi possível registrar a atividade",
        variant: "destructive",
      });
    },
  });

  const handleClockAction = (actionType: string) => {
    clockActionMutation.mutate(actionType);
  };

  if (employmentLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-2 text-sm text-gray-500">Carregando controle de jornada...</p>
        </div>
      </div>
    );
  }

  const currentStatus = timecardStatus?.status || 'offline';
  const isWorking = currentStatus === 'working';
  const isOnBreak = currentStatus === 'on_break';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Registro de Trabalho</h1>
          <p className="text-sm text-gray-500">
            Sistema de registro de trabalho para profissionais autônomos
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono text-gray-900">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-sm text-gray-500">
            {format(currentTime, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isWorking ? 'default' : isOnBreak ? 'secondary' : 'outline'}
                className={`${
                  isWorking ? 'bg-green-100 text-green-800' :
                  isOnBreak ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {isWorking ? terminology.statusLabels.working :
                 isOnBreak ? terminology.statusLabels.onBreak :
                 terminology.statusLabels.offline}
              </Badge>
              <span className="text-sm text-gray-600">
                {timecardStatus?.lastAction && 
                  `Última ação: ${safeFormatDate(timecardStatus.lastAction, 'HH:mm')}`
                }
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {timecardStatus?.todayTotalTime && 
                `Tempo total hoje: ${timecardStatus.todayTotalTime}`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {terminology.entryExitLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => handleClockAction('clock_in')}
              disabled={isWorking || clockActionMutation.isPending}
              className="h-16 flex flex-col gap-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-5 w-5" />
              <span className="text-xs">{terminology.actionLabels.clockIn}</span>
            </Button>
            
            <Button
              onClick={() => handleClockAction('break_start')}
              disabled={!isWorking || clockActionMutation.isPending}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Pause className="h-5 w-5" />
              <span className="text-xs">{terminology.actionLabels.break}</span>
            </Button>
            
            <Button
              onClick={() => handleClockAction('break_end')}
              disabled={!isOnBreak || clockActionMutation.isPending}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Play className="h-5 w-5" />
              <span className="text-xs">{terminology.actionLabels.return}</span>
            </Button>
            
            <Button
              onClick={() => handleClockAction('clock_out')}
              disabled={!isWorking || clockActionMutation.isPending}
              className="h-16 flex flex-col gap-1 bg-red-600 hover:bg-red-700"
            >
              <Square className="h-5 w-5" />
              <span className="text-xs">{terminology.actionLabels.clockOut}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registros de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayRecords?.records?.length > 0 ? (
            <div className="space-y-2">
              {todayRecords.records.map((record: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.type === 'clock_in' ? 'bg-green-500' :
                      record.type === 'clock_out' ? 'bg-red-500' :
                      record.type === 'break_start' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="font-medium">
                      {record.type === 'clock_in' ? terminology.actionLabels.clockIn :
                       record.type === 'clock_out' ? terminology.actionLabels.clockOut :
                       record.type === 'break_start' ? terminology.actionLabels.break :
                       terminology.actionLabels.return}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {safeFormatDate(record.timestamp, 'HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">Nenhum registro encontrado hoje</p>
              <p className="text-sm">Registre seu primeiro {terminology.actionLabels.clockIn.toLowerCase()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      
    </div>
  );
}