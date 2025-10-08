import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Clock, Flag, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface PriorityOption {
  value: Priority;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface PriorityPickerProps {
  value?: Priority;
  onChange: (priority: Priority) => void;
  hint?: string;
  showDescription?: boolean;
  conversationContext?: {
    urgentKeywords?: string[];
    slaViolation?: boolean;
  };
}

const priorityOptions: PriorityOption[] = [
  {
    value: 'critical',
    label: 'Crítica',
    description: 'Problema grave que impede operação. Requer ação imediata.',
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-300 dark:border-red-800'
  },
  {
    value: 'high',
    label: 'Alta',
    description: 'Problema sério que afeta múltiplos usuários ou funções importantes.',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-300 dark:border-orange-800'
  },
  {
    value: 'medium',
    label: 'Média',
    description: 'Problema que afeta alguns usuários mas há workaround.',
    icon: <Flag className="h-5 w-5" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-300 dark:border-yellow-800'
  },
  {
    value: 'low',
    label: 'Baixa',
    description: 'Problema menor ou melhoria que pode ser tratada quando possível.',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-300 dark:border-blue-800'
  }
];

export function PriorityPicker({
  value,
  onChange,
  hint,
  showDescription = true,
  conversationContext
}: PriorityPickerProps) {
  // Detect urgency from conversation context
  const suggestedPriority = (): Priority | null => {
    if (!conversationContext) return null;

    if (conversationContext.slaViolation) {
      return 'critical';
    }

    if (conversationContext.urgentKeywords) {
      const urgentWords = conversationContext.urgentKeywords.map(k => k.toLowerCase());
      
      const criticalKeywords = ['urgente', 'emergência', 'parado', 'crítico', 'grave', 'bloqueado'];
      const highKeywords = ['importante', 'sério', 'problema grande', 'múltiplos usuários'];
      
      if (urgentWords.some(word => criticalKeywords.some(kw => word.includes(kw)))) {
        return 'critical';
      }
      
      if (urgentWords.some(word => highKeywords.some(kw => word.includes(kw)))) {
        return 'high';
      }
    }

    return null;
  };

  const suggested = suggestedPriority();
  const selectedOption = priorityOptions.find(opt => opt.value === value);

  return (
    <div className="space-y-3" data-testid="priority-picker">
      {hint && (
        <p className="text-sm text-muted-foreground" data-testid="text-picker-hint">
          {hint}
        </p>
      )}

      {suggested && !value && (
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Sugestão baseada no contexto:</span>
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                {priorityOptions.find(opt => opt.value === suggested)?.label}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onChange(suggested)}
                className="ml-auto"
                data-testid="button-apply-suggestion"
              >
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {priorityOptions.map((option) => (
          <Card
            key={option.value}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              value === option.value && `${option.bgColor} ${option.borderColor} border-2`,
              suggested === option.value && !value && 'ring-2 ring-purple-400'
            )}
            onClick={() => onChange(option.value)}
            data-testid={`card-priority-${option.value}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', option.color)}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn('font-semibold', option.color)}>
                      {option.label}
                    </h3>
                    {value === option.value && (
                      <Badge variant="default" className="text-xs">
                        Selecionada
                      </Badge>
                    )}
                    {suggested === option.value && !value && (
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                        Sugerida
                      </Badge>
                    )}
                  </div>
                  {showDescription && (
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedOption && (
        <Card className={cn(selectedOption.bgColor, selectedOption.borderColor, 'border')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={selectedOption.color}>
                {selectedOption.icon}
              </div>
              <div>
                <div className="font-medium text-sm">
                  Prioridade Selecionada: {selectedOption.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedOption.description}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
