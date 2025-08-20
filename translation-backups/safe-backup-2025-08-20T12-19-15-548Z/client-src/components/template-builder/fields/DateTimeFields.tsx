
/**
 * Componentes de data e hora para o template builder
 */

import React from 'react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Calendar } from '../../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FieldComponent } from '../DragDropCanvas'

interface DateTimeFieldProps {
  field: FieldComponent
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
}

export const DateField: React.FC<DateTimeFieldProps> = ({ 
  field, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field
  const selectedDate = value ? new Date(value) : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(date.toISOString().split('T')[0]) // YYYY-MM-DD format
    } else {
      onChange?.(null)
    }
  }

  const formatDisplay = properties.format || 'dd/MM/yyyy'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">data</Badge>
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal ${
              !selectedDate && "text-muted-foreground"
            } ${properties.cssClass || ''}`}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, formatDisplay, { locale: ptBR })
            ) : (
              <span>Selecione uma data...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({ 
  field, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field
  const selectedDateTime = value ? new Date(value) : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (date && selectedDateTime) {
      // Mantém o horário se já existe
      const newDateTime = new Date(date)
      newDateTime.setHours(selectedDateTime.getHours())
      newDateTime.setMinutes(selectedDateTime.getMinutes())
      onChange?.(newDateTime.toISOString())
    } else if (date) {
      // Define horário padrão como agora
      const now = new Date()
      date.setHours(now.getHours())
      date.setMinutes(now.getMinutes())
      onChange?.(date.toISOString())
    } else {
      onChange?.(null)
    }
  }

  const handleTimeChange = (timeString: string) => {
    if (selectedDateTime && timeString) {
      const [hours, minutes] = timeString.split(':').map(Number)
      const newDateTime = new Date(selectedDateTime)
      newDateTime.setHours(hours)
      newDateTime.setMinutes(minutes)
      onChange?.(newDateTime.toISOString())
    }
  }

  const formatDisplay = properties.format || 'dd/MM/yyyy HH:mm'
  const timeValue = selectedDateTime 
    ? `${selectedDateTime.getHours().toString().padStart(2, '0')}:${selectedDateTime.getMinutes().toString().padStart(2, '0')}`
    : ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">data e hora</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Seletor de Data */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`justify-start text-left font-normal ${
                !selectedDateTime && "text-muted-foreground"
              }`}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDateTime ? (
                format(selectedDateTime, 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                <span>Data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDateTime}
              onSelect={handleDateSelect}
              disabled={disabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Seletor de Hora */}
        <div className="relative">
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={disabled || !selectedDateTime}
            className="pl-8"
          />
          <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Preview do valor selecionado */}
      {selectedDateTime && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selecionado:</strong> {format(selectedDateTime, formatDisplay, { locale: ptBR })}
        </div>
      )}
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}

export const TimeField: React.FC<DateTimeFieldProps> = ({ 
  field, 
  value = '', 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">horário</Badge>
      </div>
      
      <div className="relative">
        <Input
          type="time"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          required={properties.required}
          className={`pl-8 ${properties.cssClass || ''}`}
        />
        <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}
