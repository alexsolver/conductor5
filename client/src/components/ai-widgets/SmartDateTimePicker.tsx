import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { format, parse, addDays, addWeeks, addMonths, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SmartDateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  hint?: string;
  mode?: 'date' | 'datetime' | 'time';
  showSuggestions?: boolean;
}

interface DateSuggestion {
  label: string;
  value: Date;
  description?: string;
}

export function SmartDateTimePicker({
  value,
  onChange,
  placeholder = 'Selecione data e hora',
  hint,
  mode = 'datetime',
  showSuggestions = true
}: SmartDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [naturalInput, setNaturalInput] = useState('');
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [timeInput, setTimeInput] = useState('');

  // Parse natural language input
  const parseNaturalLanguage = (input: string): Date | null => {
    if (!input) return null;

    const now = new Date();
    const lowerInput = input.toLowerCase().trim();

    // Hoje
    if (lowerInput.includes('hoje')) {
      return startOfDay(now);
    }

    // Amanhã
    if (lowerInput.includes('amanhã') || lowerInput.includes('amanha')) {
      return startOfDay(addDays(now, 1));
    }

    // Depois de amanhã
    if (lowerInput.includes('depois de amanhã') || lowerInput.includes('depois de amanha')) {
      return startOfDay(addDays(now, 2));
    }

    // Próxima semana
    if (lowerInput.includes('próxima semana') || lowerInput.includes('proxima semana')) {
      return startOfDay(addWeeks(now, 1));
    }

    // Próximo mês
    if (lowerInput.includes('próximo mês') || lowerInput.includes('proximo mes')) {
      return startOfDay(addMonths(now, 1));
    }

    // Em X dias
    const daysMatch = lowerInput.match(/em (\d+) dias?/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      return startOfDay(addDays(now, days));
    }

    // Em X semanas
    const weeksMatch = lowerInput.match(/em (\d+) semanas?/);
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1]);
      return startOfDay(addWeeks(now, weeks));
    }

    // Datas no formato DD/MM/YYYY ou DD/MM
    const dateMatch = lowerInput.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]);
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
      
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Horários (HH:MM ou HHhMM ou HH:MM:SS)
    const timeMatch = lowerInput.match(/(\d{1,2})[h:](\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      
      let date = value || now;
      date = setHours(date, hours);
      date = setMinutes(date, minutes);
      return date;
    }

    return null;
  };

  // Quick suggestions
  const suggestions: DateSuggestion[] = [
    {
      label: 'Agora',
      value: new Date(),
      description: 'Data e hora atual'
    },
    {
      label: 'Hoje às 9h',
      value: setHours(setMinutes(startOfDay(new Date()), 0), 9),
      description: 'Início do expediente'
    },
    {
      label: 'Hoje às 14h',
      value: setHours(setMinutes(startOfDay(new Date()), 0), 14),
      description: 'Início da tarde'
    },
    {
      label: 'Hoje às 18h',
      value: setHours(setMinutes(startOfDay(new Date()), 0), 18),
      description: 'Fim do expediente'
    },
    {
      label: 'Amanhã às 9h',
      value: setHours(setMinutes(startOfDay(addDays(new Date(), 1)), 0), 9),
      description: 'Amanhã de manhã'
    },
    {
      label: 'Próxima semana',
      value: startOfDay(addWeeks(new Date(), 1)),
      description: 'Segunda-feira da próxima semana'
    }
  ];

  // Handle natural input
  useEffect(() => {
    if (naturalInput) {
      const parsed = parseNaturalLanguage(naturalInput);
      if (parsed) {
        setParsedDate(parsed);
      }
    }
  }, [naturalInput]);

  // Handle time input separately
  const handleTimeChange = (time: string) => {
    setTimeInput(time);
    
    const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        let newDate = value || new Date();
        newDate = setHours(newDate, hours);
        newDate = setMinutes(newDate, minutes);
        onChange(newDate);
      }
    }
  };

  const formatValue = (date: Date | undefined) => {
    if (!date) return '';
    
    switch (mode) {
      case 'date':
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      case 'time':
        return format(date, 'HH:mm', { locale: ptBR });
      case 'datetime':
      default:
        return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  };

  return (
    <div className="space-y-2" data-testid="smart-datetime-picker">
      {hint && (
        <p className="text-sm text-muted-foreground" data-testid="text-picker-hint">
          {hint}
        </p>
      )}

      {/* Natural Language Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
          <Input
            placeholder="Ex: amanhã às 14h, em 3 dias, 25/12/2024..."
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && parsedDate) {
                onChange(parsedDate);
                setNaturalInput('');
                setParsedDate(null);
              }
            }}
            className="pl-10"
            data-testid="input-natural-language"
          />
        </div>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
              data-testid="button-open-calendar"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? formatValue(value) : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="space-y-3 p-3">
              {mode !== 'time' && (
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={(date) => {
                    if (date) {
                      // Preserve time if in datetime mode
                      if (mode === 'datetime' && value) {
                        date = setHours(date, value.getHours());
                        date = setMinutes(date, value.getMinutes());
                      }
                      onChange(date);
                    }
                  }}
                  locale={ptBR}
                  initialFocus
                />
              )}
              
              {mode !== 'date' && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={timeInput || (value ? format(value, 'HH:mm') : '')}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="flex-1"
                      data-testid="input-time"
                    />
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Parsed Preview */}
      {parsedDate && (
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Interpretado como:</span>
                <span className="text-sm">{formatValue(parsedDate)}</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onChange(parsedDate);
                  setNaturalInput('');
                  setParsedDate(null);
                }}
                data-testid="button-apply-parsed"
              >
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Suggestions */}
      {showSuggestions && !value && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sugestões rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => onChange(suggestion.value)}
                data-testid={`badge-suggestion-${index}`}
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                {suggestion.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
