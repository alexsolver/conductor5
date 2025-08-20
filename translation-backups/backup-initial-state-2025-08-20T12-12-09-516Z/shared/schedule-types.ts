// Shared schedule type definitions to maintain consistency across the application

export interface ScheduleTypeOption {
  value: string;
  label: string;
  description?: string;
}

// Standardized schedule type options - Single source of truth
export const SCHEDULE_TYPE_OPTIONS: ScheduleTypeOption[] = [
  { 
    value: '5x2', 
    label: '5x2 (Segunda a Sexta)', 
    description: '5 dias trabalhados, 2 dias de folga' 
  },
  { 
    value: '6x1', 
    label: '6x1 (Seis dias com folga)', 
    description: '6 dias trabalhados, 1 dia de folga' 
  },
  { 
    value: '12x36', 
    label: '12x36 (Plantões)', 
    description: '12 horas trabalhadas, 36 horas de folga' 
  },
  { 
    value: 'shift', 
    label: 'Escalas por Turno', 
    description: 'Sistema de turnos rotativos' 
  },
  { 
    value: 'flexible', 
    label: 'Horário Flexível', 
    description: 'Jornada flexível com banco de horas' 
  },
  { 
    value: 'intermittent', 
    label: 'Trabalho Intermitente', 
    description: 'Trabalho sob demanda com registro de entrada/saída' 
  }
];

// Valid schedule type values
export const SCHEDULE_TYPES = SCHEDULE_TYPE_OPTIONS.map(option => option.value) as const;
export type ScheduleType = typeof SCHEDULE_TYPES[number];

// Labels mapping for easy lookup
export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = Object.fromEntries(
  SCHEDULE_TYPE_OPTIONS.map(option => [option.value, option.label])
) as Record<ScheduleType, string>;

// Descriptions mapping for easy lookup
export const SCHEDULE_TYPE_DESCRIPTIONS: Record<ScheduleType, string> = Object.fromEntries(
  SCHEDULE_TYPE_OPTIONS.map(option => [option.value, option.description || ''])
) as Record<ScheduleType, string>;