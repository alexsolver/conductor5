
/**
 * Componentes de seleção para o template builder
 */

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Checkbox } from '../../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { X } from 'lucide-react'
import { FieldComponent } from '../DragDropCanvas'
// import { useLocalization } from '@/hooks/useLocalization';

interface SelectionFieldProps {
  field: FieldComponent
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
}

export const SelectField: React.FC<SelectionFieldProps> = ({
  // Localization temporarily disabled
 
  field, 
  value = '', 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field
  const options = properties.options || []

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">seleção única</Badge>
      </div>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required={properties.required}
      >
        <SelectTrigger className={properties.cssClass}>
          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
        </SelectTrigger>
        <SelectContent>
          {options.map((option: any, index: number) => (
            <SelectItem key={index} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
      
      <div className="text-xs text-gray-400">
        {options.length} opçõe{options.length !== 1 ? 's' : ''} disponívei{options.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export const MultiSelectField: React.FC<SelectionFieldProps> = ({ 
  field, 
  value = [], 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field
  const options = properties.options || []
  const selectedValues = Array.isArray(value) ? value : []

  const handleToggleOption = (optionValue: string) => {
    if (disabled) return

    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue]
    
    onChange?.(newValues)
  }

  const removeValue = (valueToRemove: string) => {
    if (disabled) return
    const newValues = selectedValues.filter(v => v !== valueToRemove)
    onChange?.(newValues)
  }

  const getOptionLabel = (optionValue: string) => {
    const option = options.find((opt: any) => opt.value === optionValue)
    return option?.label || optionValue
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">múltipla seleção</Badge>
      </div>
      
      {/* Valores selecionados */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50">
          {selectedValues.map((selectedValue, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {getOptionLabel(selectedValue)}
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-100"
                  onClick={() => removeValue(selectedValue)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Opções disponíveis */}
      <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
        {options.map((option: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={"
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => handleToggleOption(option.value)}
              disabled={disabled}
            />
            <Label 
              htmlFor={"
              className="text-sm cursor-pointer flex-1"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
      
      <div className="text-xs text-gray-400">
        {selectedValues.length} de {options.length} selecionado{selectedValues.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export const RadioField: React.FC<SelectionFieldProps> = ({ 
  field, 
  value = '', 
  onChange, 
  disabled = false 
}) => {
  const { properties = {} } = field
  const options = properties.options || []
  const layout = properties.layout || 'vertical'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">botões de opção</Badge>
      </div>
      
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className={layout === 'horizontal' ? 'flex gap-4' : 'space-y-2'}
      >
        {options.map((option: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem 
              value={option.value} 
              id={"
            />
            <Label 
              htmlFor={"
              className="text-sm cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {properties.description && (
        <p className="text-xs text-gray-500">{properties.description}</p>
      )}
    </div>
  )
}

export const CheckboxField: React.FC<SelectionFieldProps> = ({ 
  field, 
  value = false, 
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
        <Badge variant="outline" className="text-xs">caixa de seleção</Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id={field.id}
          checked={!!value}
          onCheckedChange={onChange}
          disabled={disabled}
          required={properties.required}
        />
        <Label 
          htmlFor={field.id}
          className="text-sm cursor-pointer"
        >
          {properties.label || 'Concordo com os termos'}
        </Label>
      </div>
      
      {properties.description && (
        <p className="text-xs text-gray-500 mt-2">{properties.description}</p>
      )}
    </div>
  )
}
