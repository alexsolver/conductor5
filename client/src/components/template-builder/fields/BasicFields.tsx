
/**
 * Componentes básicos de campo para o template builder
 */

import React from 'react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { FieldComponent } from '../DragDropCanvas'

interface BasicFieldProps {
  field: FieldComponent
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
}

export const TextField: React.FC<BasicFieldProps> = ({ 
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
        <Badge variant="outline" className="text-xs">texto</Badge>
      </div>
      
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={properties.placeholder || 'Digite aqui...'}
        disabled={disabled}
        maxLength={properties.maxLength}
        minLength={properties.minLength}
        required={properties.required}
        className={properties.cssClass}
      />
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
      
      {properties.maxLength && (
        <div className="text-xs text-gray-400 text-right">
          {value?.length || 0}/{properties.maxLength}
        </div>
      )}
    </div>
  )
}

export const TextAreaField: React.FC<BasicFieldProps> = ({ 
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
        <Badge variant="outline" className="text-xs">texto longo</Badge>
      </div>
      
      <Textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={properties.placeholder || 'Digite uma descrição...'}
        disabled={disabled}
        rows={properties.rows || 4}
        maxLength={properties.maxLength}
        required={properties.required}
        className="resize-none "`}
      />
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
      
      {properties.maxLength && (
        <div className="text-xs text-gray-400 text-right">
          {value?.length || 0}/{properties.maxLength}
        </div>
      )}
    </div>
  )
}

export const NumberField: React.FC<BasicFieldProps> = ({ 
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
        <Badge variant="outline" className="text-xs">número</Badge>
      </div>
      
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value) || '')}
        placeholder={properties.placeholder || '0'}
        disabled={disabled}
        min={properties.min}
        max={properties.max}
        step={properties.step || 1}
        required={properties.required}
        className={properties.cssClass}
      />
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
      
      {(properties.min !== undefined || properties.max !== undefined) && (
        <div className="text-xs text-gray-400">
          {properties.min !== undefined && `Min: ${properties.min"}
          {properties.min !== undefined && properties.max !== undefined && ' • '}
          {properties.max !== undefined && `Max: ${properties.max"}
        </div>
      )}
    </div>
  )
}

export const EmailField: React.FC<BasicFieldProps> = ({ 
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
        <Badge variant="outline" className="text-xs">email</Badge>
      </div>
      
      <Input
        type="email"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={properties.placeholder || 'exemplo@email.com'}
        disabled={disabled}
        required={properties.required}
        className={properties.cssClass}
      />
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}

export const PhoneField: React.FC<BasicFieldProps> = ({ 
  field, 
  value = '', 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field

  const formatPhone = (input: string) => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '')
    
    // Aplica máscara baseada no tamanho
    if (numbers.length <= 10) {
      // Telefone fixo: (99) 9999-9999
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      // Celular: (99) 99999-9999
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    onChange?.(formatted)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">telefone</Badge>
      </div>
      
      <Input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={properties.mask || '(99) 99999-9999'}
        disabled={disabled}
        required={properties.required}
        className={properties.cssClass}
        maxLength={15} // Máximo para celular formatado
      />
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}

export const URLField: React.FC<BasicFieldProps> = ({ 
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
        <Badge variant="outline" className="text-xs">url</Badge>
      </div>
      
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={properties.placeholder || 'https://exemplo.com'}
        disabled={disabled}
        required={properties.required}
        className={properties.cssClass}
      />
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}
