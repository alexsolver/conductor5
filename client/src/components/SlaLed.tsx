// ✅ 1QA.MD COMPLIANCE: SLA LED INDICATOR COMPONENT
// Visual LED indicator for SLA expiration tracking

import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ======================================
// TYPES AND INTERFACES
// ======================================

export interface SlaLedProps {
  slaStatus?: 'none' | 'active' | 'warning' | 'breached';
  slaElapsedPercent?: number;
  slaExpirationDate?: string;
  slaStartDate?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
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
// MAIN COMPONENT
// ======================================

export function SlaLed({
  slaStatus,
  slaElapsedPercent = 0,
  slaExpirationDate,
  slaStartDate,
  size = 'md',
  showText = false,
  className = ''
}: SlaLedProps) {
  // Calcular status automaticamente se não fornecido
  const finalStatus = slaStatus || calculateSlaStatus(slaElapsedPercent, slaExpirationDate);
  
  const config = ledStyles[finalStatus];
  const IconComponent = config.icon;
  
  // LED simples (apenas círculo colorido)
  if (!showText) {
    return (
      <div 
        className={`${sizeClasses[size]} ${config.color} rounded-full shadow-sm ${className}`}
        title={`SLA: ${config.label} (${slaElapsedPercent.toFixed(1)}%)`}
        data-testid={`sla-led-${finalStatus}`}
      />
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
          
          {slaExpirationDate && (
            <div className="text-xs text-gray-500 mt-1">
              <div>Tempo restante: {formatTimeRemaining(slaExpirationDate)}</div>
              <div>Progresso: {slaElapsedPercent.toFixed(1)}%</div>
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

export default SlaLed;