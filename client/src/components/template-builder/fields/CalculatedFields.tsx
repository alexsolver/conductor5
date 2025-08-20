
/**
 * Componentes de campos calculados para o template builder
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Alert, AlertDescription } from '../../ui/alert'
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Calculator, 
  Code, 
  TrendingUp, 
  Hash, 
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

interface CalculationFormula {
  type: 'arithmetic' | 'conditional' | 'lookup' | 'date' | 'text' | 'custom'
  expression: string
  dependencies: string[] // IDs dos campos dependentes
  format?: 'number' | 'currency' | 'percentage' | 'date' | 'text'
  precision?: number
}

interface CalculatedFieldProps {
  field: any
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
  allFields?: any[]
  formData?: Record<string, any>
}

export const CalculatedField: React.FC<CalculatedFieldProps> = ({
  // Localization temporarily disabled

  field,
  value,
  onChange,
  disabled = false,
  allFields = [],
  formData = {}
}) => {
  const [calculatedValue, setCalculatedValue] = useState<any>('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  // Funções de cálculo predefinidas
  const calculationFunctions = {
    // Funções matemáticas
    sum: (...values: number[]) => values.reduce((a, b) => a + b, 0),
    avg: (...values: number[]) => values.reduce((a, b) => a + b, 0) / values.length,
    min: (...values: number[]) => Math.min(...values),
    max: (...values: number[]) => Math.max(...values),
    count: (...values: any[]) => values.filter(v => v != null && v !== '').length,
    
    // Funções de texto
    concat: (...values: string[]) => values.join(''),
    upper: (text: string) => String(text).toUpperCase(),
    lower: (text: string) => String(text).toLowerCase(),
    length: (text: string) => String(text).length,
    
    // Funções de data
    now: () => new Date(),
    today: () => new Date().toISOString().split('T')[0],
    daysBetween: (date1: string, date2: string) => {
      const d1 = new Date(date1)
      const d2 = new Date(date2)
      return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
    },
    
    // Funções condicionais
    if: (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,
    isEmpty: (value: any) => value == null || value === '',
    isNotEmpty: (value: any) => value != null && value !== ''
  }

  // Executar cálculo
  const executeCalculation = useMemo(() => {
    if (!field.calculationFormula?.expression) return ''

    setIsCalculating(true)
    setCalculationError(null)

    try {
      const formula = field.calculationFormula as CalculationFormula
      let expression = formula.expression

      // Substituir referências de campos pelos valores
      formula.dependencies?.forEach(fieldId => {
        const fieldValue = formData[fieldId] || 0
        expression = expression.replace(
          new RegExp("\\", 'g'), 
          String(fieldValue)
        )
      })

      // Criar contexto seguro para avaliação
      const context = {
        ...calculationFunctions,
        ...formData
      }

      let result: any

      switch (formula.type) {
        case 'arithmetic':
          // Avaliação matemática segura
          result = evaluateArithmetic(expression)
          break
          
        case 'conditional':
          result = evaluateConditional(expression, context)
          break
          
        case 'date':
          result = evaluateDate(expression, context)
          break
          
        case 'text':
          result = evaluateText(expression, context)
          break
          
        case 'custom':
          result = evaluateCustom(expression, context)
          break
          
        default:
          result = evaluateArithmetic(expression)
      }

      // Aplicar formatação
      if (formula.format) {
        result = formatValue(result, formula.format, formula.precision)
      }

      setCalculatedValue(result)
      onChange?.(result)
      setIsCalculating(false)
      
      return result

    } catch (error) {
      setCalculationError(error instanceof Error ? error.message : 'Erro no cálculo')
      setIsCalculating(false)
      return ''
    }
  }, [field.calculationFormula, formData, onChange])

  useEffect(() => {
    executeCalculation
  }, [executeCalculation])

  // Funções de avaliação segura
  const evaluateArithmetic = (expression: string): number => {
    // Validar expressão (apenas números, operadores e parênteses)
    const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '')
    
    try {
      return Function(")`)()
    } catch {
      throw new Error('Expressão aritmética inválida')
    }
  }

  const evaluateConditional = (expression: string, context: any): any => {
    // Implementação simplificada de lógica condicional
    try {
      const func = new Function('context', `
        with(context) {
          return ${expression}
        }
      `)
      return func(context)
    } catch {
      throw new Error('Expressão condicional inválida')
    }
  }

  const evaluateDate = (expression: string, context: any): string => {
    try {
      const func = new Function('context', `
        with(context) {
          return ${expression}
        }
      `)
      const result = func(context)
      return result instanceof Date ? result.toISOString().split('T')[0] : String(result)
    } catch {
      throw new Error('Expressão de data inválida')
    }
  }

  const evaluateText = (expression: string, context: any): string => {
    try {
      const func = new Function('context', `
        with(context) {
          return ${expression}
        }
      `)
      return String(func(context))
    } catch {
      throw new Error('Expressão de texto inválida')
    }
  }

  const evaluateCustom = (expression: string, context: any): any => {
    try {
      const func = new Function('context', `
        with(context) {
          ${expression}
        }
      `)
      return func(context)
    } catch {
      throw new Error('Expressão customizada inválida')
    }
  }

  // Formatação de valores
  const formatValue = (value: any, format: string, precision?: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: precision || 2
        }).format(Number(value) || 0)
        
      case 'percentage':
        return new Intl.NumberFormat('pt-BR', {
          style: 'percent',
          minimumFractionDigits: precision || 1
        }).format(Number(value) || 0)
        
      case 'number':
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: precision || 0
        }).format(Number(value) || 0)
        
      case 'date':
        try {
          return new Date(value).toLocaleDateString('pt-BR')
        } catch {
          return String(value)
        }
        
      default:
        return String(value)
    }
  }

  const getCalculationIcon = () => {
    const formula = field.calculationFormula as CalculationFormula
    switch (formula?.type) {
      case 'arithmetic': return <Calculator className="w-4 h-4" />
      case 'conditional': return <Code className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'custom': return <TrendingUp className="w-4 h-4" />
      default: return <Hash className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-2>
      <div className="flex items-center justify-between>
        <Label className="text-sm font-medium>
          {field.label}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <div className="flex items-center gap-1>
          <Badge variant="secondary" className="text-xs>
            {getCalculationIcon()}
            Calculado
          </Badge>
          
          {isCalculating && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
        </div>
      </div>

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}

      <div className="relative>
        <Input
          value={calculatedValue}
          readOnly
          disabled={disabled}
          className="bg-gray-50 font-mono"
          placeholder="Valor será calculado automaticamente"
        />
        
        {field.calculationFormula?.format === 'currency' && (
          <DollarSign className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        )}
      </div>

      {calculationError && (
        <Alert className="border-red-200 bg-red-50>
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700 text-xs>
            {calculationError}
          </AlertDescription>
        </Alert>
      )}

      {field.calculationFormula?.expression && (
        <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded>
          <strong>Fórmula:</strong> {field.calculationFormula.expression}
        </div>
      )}

      {field.calculationFormula?.dependencies?.length > 0 && (
        <div className="flex flex-wrap gap-1>
          <span className="text-xs text-gray-500">Depende de:</span>
          {field.calculationFormula.dependencies.map((depId: string) => {
            const depField = allFields.find(f => f.id === depId)
            return (
              <Badge key={depId} variant="outline" className="text-xs>
                {depField?.label || depId}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Hook para gerenciar campos calculados
export const useCalculatedFields = (fields: any[], formData: Record<string, any>) => {
  const [calculatedValues, setCalculatedValues] = useState<Record<string, any>>({})

  useEffect(() => {
    const newValues: Record<string, any> = {}
    
    fields
      .filter(field => field.type === 'calculated' && field.calculationFormula)
      .forEach(field => {
        try {
          // Lógica de cálculo aqui
          // Por simplicidade, apenas copiando o valor
          newValues[field.id] = calculatedValues[field.id] || ''
        } catch (error) {
          console.error('[TRANSLATION_NEEDED]', error)
        }
      })

    setCalculatedValues(prev => ({ ...prev, ...newValues }))
  }, [fields, formData])

  return calculatedValues
}

export default CalculatedField
