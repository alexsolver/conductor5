
/**
 * Componentes condicionais para o template builder
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Switch } from '../../ui/switch'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Alert, AlertDescription } from '../../ui/alert'
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Star, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'

interface ConditionalRule {
  sourceFieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less' | 'is_empty' | 'is_not_empty'
  value: any
  action: 'show' | 'hide' | 'require' | 'unrequire' | 'enable' | 'disable'
}

interface ConditionalFieldProps {
  field: any
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
  allFields?: any[]
  formData?: Record<string, any>
}

export const ConditionalField: React.FC<ConditionalFieldProps> = ({
  // Localization temporarily disabled

  field,
  value,
  onChange,
  disabled = false,
  allFields = [],
  formData = {}
}) => {
  const [isVisible, setIsVisible] = useState(field.isVisible !== false)
  const [isRequired, setIsRequired] = useState(field.isRequired || false)
  const [isEnabled, setIsEnabled] = useState(!disabled)
  const [conditionsMet, setConditionsMet] = useState(true)

  // Avaliar condições do campo
  useEffect(() => {
    if (!field.conditionalLogic?.conditions?.length) {
      setIsVisible(field.isVisible !== false)
      setIsRequired(field.isRequired || false)
      setIsEnabled(!disabled)
      setConditionsMet(true)
      return
    }

    const conditions = field.conditionalLogic.conditions as ConditionalRule[]
    const operator = field.conditionalLogic.operator || 'AND'

    const results = conditions.map((condition) => {
      const sourceValue = formData[condition.sourceFieldId]
      
      switch (condition.operator) {
        case 'equals':
          return sourceValue === condition.value
        case 'not_equals':
          return sourceValue !== condition.value
        case 'contains':
          return String(sourceValue || '').includes(String(condition.value))
        case 'greater':
          return Number(sourceValue) > Number(condition.value)
        case 'less':
          return Number(sourceValue) < Number(condition.value)
        case 'is_empty':
          return !sourceValue || sourceValue === ''
        case 'is_not_empty':
          return sourceValue && sourceValue !== ''
        default:
          return true
      }
    })

    const allMet = operator === 'AND' 
      ? results.every(r => r)
      : results.some(r => r)

    setConditionsMet(allMet)

    // Aplicar ações baseadas nas condições
    conditions.forEach((condition, index) => {
      if (results[index] || (operator === 'OR' && allMet)) {
        switch (condition.action) {
          case 'show':
            setIsVisible(true)
            break
          case 'hide':
            setIsVisible(false)
            break
          case 'require':
            setIsRequired(true)
            break
          case 'unrequire':
            setIsRequired(false)
            break
          case 'enable':
            setIsEnabled(true)
            break
          case 'disable':
            setIsEnabled(false)
            break
        }
      }
    })
  }, [formData, field.conditionalLogic, field.isVisible, field.isRequired, disabled])

  // Renderizar o campo base baseado no tipo
  const renderBaseField = () => {
    const commonProps = {
      value: value || '',
      onChange: (e: any) => onChange?.(e.target ? e.target.value : e),
      disabled: !isEnabled,
      required: isRequired
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            {...commonProps}
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
          />
        )

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={field.validationRules?.min}
            max={field.validationRules?.max}
            placeholder={field.placeholder || 'Digite um número'}
          />
        )

      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={(val) => onChange?.(val)}
            disabled={!isEnabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || '[TRANSLATION_NEEDED]'} />
            </SelectTrigger>
            <SelectContent>
              {field.fieldOptions?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'switch':
        return (
          <Switch
            checked={value || false}
            onCheckedChange={(checked) => onChange?.(checked)}
            disabled={!isEnabled}
          />
        )

      default:
        return (
          <Input
            {...commonProps}
            placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <div className="flex items-center gap-1">
          {field.conditionalLogic?.conditions?.length > 0 && (
            <Badge 
              variant={conditionsMet ? "default" : "secondary"} 
              className="text-xs"
            >
              <Zap className="w-3 h-3 mr-1" />
              Condicional
            </Badge>
          )}
          
          {!isEnabled && <Lock className="w-4 h-4 text-gray-400" />}
          {!isVisible && <EyeOff className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}

      {renderBaseField()}

      {field.conditionalLogic?.conditions?.length > 0 && (
        <div className="mt-2">
          <Alert className={`text-xs ${conditionsMet ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <AlertDescription className="flex items-center gap-2">
              {conditionsMet ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-700">Condições atendidas</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-700">
                    Aguardando condições: {field.conditionalLogic.conditions.length} regra(s)
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}

// Hook para gerenciar campos condicionais
export const useConditionalFields = (fields: any[], formData: Record<string, any>) => {
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({})
  const [requirementMap, setRequirementMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const newVisibility: Record<string, boolean> = {}
    const newRequirements: Record<string, boolean> = {}

    fields.forEach(field => {
      // Default values
      newVisibility[field.id] = field.isVisible !== false
      newRequirements[field.id] = field.isRequired || false

      // Apply conditional logic
      if (field.conditionalLogic?.conditions?.length) {
        const conditions = field.conditionalLogic.conditions
        const operator = field.conditionalLogic.operator || 'AND'

        const results = conditions.map((condition: ConditionalRule) => {
          const sourceValue = formData[condition.sourceFieldId]
          
          switch (condition.operator) {
            case 'equals':
              return sourceValue === condition.value
            case 'not_equals':
              return sourceValue !== condition.value
            case 'contains':
              return String(sourceValue || '').includes(String(condition.value))
            case 'greater':
              return Number(sourceValue) > Number(condition.value)
            case 'less':
              return Number(sourceValue) < Number(condition.value)
            case 'is_empty':
              return !sourceValue || sourceValue === ''
            case 'is_not_empty':
              return sourceValue && sourceValue !== ''
            default:
              return true
          }
        })

        const conditionsMet = operator === 'AND' 
          ? results.every(r => r)
          : results.some(r => r)

        if (conditionsMet) {
          conditions.forEach((condition: ConditionalRule) => {
            switch (condition.action) {
              case 'show':
                newVisibility[field.id] = true
                break
              case 'hide':
                newVisibility[field.id] = false
                break
              case 'require':
                newRequirements[field.id] = true
                break
              case 'unrequire':
                newRequirements[field.id] = false
                break
            }
          })
        }
      }
    })

    setVisibilityMap(newVisibility)
    setRequirementMap(newRequirements)
  }, [fields, formData])

  return {
    isVisible: (fieldId: string) => visibilityMap[fieldId] !== false,
    isRequired: (fieldId: string) => requirementMap[fieldId] || false,
    visibilityMap,
    requirementMap
  }
}

export default ConditionalField
