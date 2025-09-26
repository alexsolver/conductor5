// ✅ 1QA.MD COMPLIANCE: SLA LED INDICATOR COMPONENT
// Visual LED indicator for SLA expiration tracking with real backend integration

import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSlaStatus } from '@/hooks/useSlaData';

// ======================================
// TYPES AND INTERFACES
// ======================================

export interface SlaLedProps {
  ticketId: string;
  slaStatus?: 'none' | 'active' | 'warning' | 'breached';
  slaElapsedPercent?: number;
  slaExpirationDate?: string;
  slaStartDate?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

interface SlaInstance {
  id: string;
  slaDefinitionId: string;
  ticketId: string;
  status: 'running' | 'paused' | 'completed' | 'violated';
  currentMetric: 'response_time' | 'resolution_time' | 'update_time' | 'idle_time';
  elapsedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  isBreached: boolean;
  breachPercentage: number;
  startedAt: string;
  violatedAt?: string;
}

// ======================================
// LED STYLES CONFIGURATION
// ======================================

const ledStyles = {
  none: {
    color: 'bg-gray-400',
    text: 'text-gray-600',
    label: 'Sem SLA',
    icon: Clock,
    badge: 'secondary'
  },
  active: {
    color: 'bg-green-500',
    text: 'text-green-600',
    label: 'No Prazo',
    icon: CheckCircle,
    badge: 'default'
  },
  warning: {
    color: 'bg-yellow-500',
    text: 'text-yellow-600',
    label: 'Atenção',
    icon: AlertTriangle,
    badge: 'warning'
  },
  breached: {
    color: 'bg-red-500',
    text: 'text-red-600',
    label: 'Vencido',
    icon: XCircle,
    badge: 'destructive'
  }
} as const;

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
} as const;

// ======================================
// UTILITY FUNCTIONS
// ======================================

function calculateSlaStatus(
  slaElapsedPercent: number,
  slaExpirationDate?: string
): 'none' | 'active' | 'warning' | 'breached' {
  if (!slaExpirationDate) return 'none';
  
  const now = new Date();
  const expiration = new Date(slaExpirationDate);
  
  // Se já passou da data de expiração
  if (now > expiration) {
    return 'breached';
  }
  
  // Baseado no percentual decorrido
  if (slaElapsedPercent >= 80) {
    return 'warning';
  } else {
    return 'active';
  }
}

function formatTimeRemaining(slaExpirationDate: string): string {
  const now = new Date();
  const expiration = new Date(slaExpirationDate);
  const diffMs = expiration.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Vencido';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
}

// ======================================
// CUSTOM HOOKS
// ======================================

function useSlaInstances(ticketId: string) {
  return useQuery({
    queryKey: [`/api/sla/instances/ticket/${ticketId}`],
    queryFn: () => apiRequest('GET', `/api/sla/instances/ticket/${ticketId}`).then(res => res.json()),
    enabled: !!ticketId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

// ======================================
// MAIN COMPONENT
// ======================================

export function SlaLed({
  ticketId,
  slaStatus,
  slaElapsedPercent,
  slaExpirationDate,
  slaStartDate,
  size = 'md',
  showText = false,
  className = ''
}: SlaLedProps) {
  console.log(`🔍 [SLA-LED] Rendering for ticket: ${ticketId}`);
  console.log(`🔍 [SLA-LED] Fetching real SLA data from backend`);
  
  // Usar hook customizado para obter dados de SLA
  const { 
    status: realStatus, 
    elapsedPercent: realElapsedPercent, 
    expirationDate: realExpirationDate,
    activeSla,
    isLoading,
    hasActiveSla
  } = useSlaStatus(ticketId);
  
  // Usar dados reais se disponíveis, senão usar props fornecidos
  const finalStatus = hasActiveSla ? realStatus : (slaStatus || 'none');
  const finalElapsedPercent = hasActiveSla ? realElapsedPercent : (slaElapsedPercent || 0);
  const finalExpirationDate = hasActiveSla ? realExpirationDate?.toISOString() : slaExpirationDate;
  
  // Mostrar loading state se necessário
  if (isLoading && !slaStatus) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className={`${sizeClasses[size]} bg-gray-300 rounded-full animate-pulse`} />
        <span className="text-xs text-gray-400">SLA</span>
      </div>
    );
  }
  
  // Log para debug
  if (activeSla) {
    console.log(`🔍 [SLA-LED] Real SLA data:`, {
      status: finalStatus,
      elapsedPercent: finalElapsedPercent.toFixed(1),
      isBreached: activeSla.isBreached,
      targetMinutes: activeSla.targetMinutes,
      elapsedMinutes: activeSla.elapsedMinutes
    });
  }
  
  const config = ledStyles[finalStatus];
  const IconComponent = config.icon;
  
  // LED simples (apenas círculo colorido)
  if (!showText) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div 
          className={`${sizeClasses[size]} ${config.color} rounded-full shadow-lg border-2 border-white ${className}`}
          title={`SLA: ${config.label} (${finalElapsedPercent.toFixed(1)}% decorrido)${activeSla ? ' - Dados Reais' : ' - Demo'}`}
          data-testid={`sla-led-${finalStatus}`}
        />
        <span className="text-xs text-gray-500 font-medium">SLA</span>
      </div>
    );
  }
  
  // LED com texto e informações detalhadas
  return (
    <div className={`flex items-center space-x-2 ${className}`} data-testid={`sla-led-detailed-${finalStatus}`}>
      <div className={`${sizeClasses[size]} ${config.color} rounded-full shadow-sm`} />
      
      <div className="flex items-center space-x-2">
        <IconComponent className={`w-4 h-4 ${config.text}`} />
        
        <div className="text-sm">
          <Badge variant={config.badge as any} className="text-xs">
            {config.label}
          </Badge>
          
          {finalExpirationDate && (
            <div className="text-xs text-gray-500 mt-1">
              <div>Tempo restante: {formatTimeRemaining(finalExpirationDate)}</div>
              <div>Progresso: {finalElapsedPercent.toFixed(1)}%</div>
              {activeSla && (
                <div className="text-xs text-blue-600 mt-1">
                  Tipo: {activeSla.currentMetric.replace('_', ' ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================
// PROGRESS BAR COMPONENT
// ======================================

interface SlaProgressBarProps {
  slaElapsedPercent: number;
  slaStatus?: 'none' | 'active' | 'warning' | 'breached';
  showPercentage?: boolean;
  className?: string;
}

export function SlaProgressBar({
  slaElapsedPercent,
  slaStatus = 'active',
  showPercentage = true,
  className = ''
}: SlaProgressBarProps) {
  const config = ledStyles[slaStatus];
  
  return (
    <div className={`space-y-1 ${className}`} data-testid={`sla-progress-${slaStatus}`}>
      <div className="flex justify-between items-center text-xs">
        <span className={config.text}>SLA Progress</span>
        {showPercentage && (
          <span className={config.text}>{slaElapsedPercent.toFixed(1)}%</span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${config.color}`}
          style={{ width: `${Math.min(slaElapsedPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ======================================
// SLA REAL-TIME MONITOR COMPONENT
// ======================================

interface SlaRealTimeMonitorProps {
  ticketId: string;
  compact?: boolean;
}

export function SlaRealTimeMonitor({ ticketId, compact = false }: SlaRealTimeMonitorProps) {
  const { allInstances, isLoading, hasActiveSla } = useSlaStatus(ticketId);
  
  if (isLoading) {
    return <div className="animate-pulse text-xs text-gray-400">Carregando SLA...</div>;
  }
  
  if (!hasActiveSla || allInstances.length === 0) {
    return compact ? null : <div className="text-xs text-gray-500">Nenhum SLA ativo</div>;
  }
  
  return (
    <div className="space-y-2">
      {allInstances.map((instance) => (
        <div key={instance.id} className="flex items-center space-x-2">
          <SlaLed 
            ticketId={ticketId} 
            size="sm" 
            showText={!compact}
          />
          {!compact && (
            <div className="text-xs">
              <div className="font-medium">{instance.currentMetric.replace('_', ' ')}</div>
              <div className="text-gray-500">
                {instance.elapsedMinutes}min / {instance.targetMinutes}min
              </div>
              <div className={`text-xs ${instance.isBreached ? 'text-red-600' : 'text-green-600'}`}>
                {instance.isBreached ? 'Violado' : 'No prazo'}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ======================================
// SIMPLE SLA LED COMPONENT EXPORT
// ======================================

export function SlaLedSimple({ ticketId, size = 'md' }: { ticketId: string; size?: 'sm' | 'md' | 'lg' }) {
  console.log(`🔍 [SLA-LED-SIMPLE] Rendering for ticket: ${ticketId}`);
  console.log(`🔍 [SLA-LED-SIMPLE] Using real SLA data from backend`);
  
  // Usar o componente principal SlaLed que já está integrado com o backend
  return (
    <div data-testid="sla-led-simple">
      <SlaLed 
        ticketId={ticketId}
        size={size}
        showText={false}
        className="inline-flex"
      />
    </div>
  );
}

export default SlaLed;