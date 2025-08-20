
/**
 * Editor de regras de validação para campos
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Switch } from '../../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Badge } from '../../ui/badge'
import { Textarea } from '../../ui/textarea'
import { 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Code,
  Info
} from 'lucide-react'

interface ValidationRule {
  id: string
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'range'
  value?: string | number
  message: string
  isActive: boolean
}

interface PropertyValidationRulesProps {
  fieldType: string
  validationRules: ValidationRule[]
  onUpdate: (rules: ValidationRule[]) => void
}

export const PropertyValidationRules: React.FC<PropertyValidationRulesProps> = ({
  fieldType,
  validationRules,
  onUpdate
}) => {
  const [rules, setRules] = useState<ValidationRule[]>(validationRules || [])

  const addRule = (type: ValidationRule['type']) => {
    const newRule: ValidationRule = {
      id: `rule_${Date.now()}`,
      type,
      message: getDefaultMessage(type),
      isActive: true
    }
    
    const updatedRules = [...rules, newRule]
    setRules(updatedRules)
    onUpdate(updatedRules)
  }

  const updateRule = (index: number, updates: Partial<ValidationRule>) => {
    const updatedRules = rules.map((rule, i) =>
      i === index ? { ...rule, ...updates } : rule
    )
    setRules(updatedRules)
    onUpdate(updatedRules)
  }

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index)
    setRules(updatedRules)
    onUpdate(updatedRules)
  }

  const getDefaultMessage = (type: ValidationRule['type']): string => {
    const messages = {
      required: 'Este campo é obrigatório',
      minLength: 'Deve ter no mínimo {value} caracteres',
      maxLength: 'Deve ter no máximo {value} caracteres',
      pattern: 'Formato inválido',
      custom: 'Valor inválido',
      range: 'Valor deve estar entre {min} e {max}'
    }
    return messages[type]
  }

  const getAvailableRuleTypes = () => {
    const baseRules = [
      { value: 'required', label: 'Campo Obrigatório' },
      { value: 'custom', label: 'Validação Customizada' }
    ]

    const textRules = [
      { value: 'minLength', label: 'Comprimento Mínimo' },
      { value: 'maxLength', label: 'Comprimento Máximo' },
      { value: 'pattern', label: 'Expressão Regular' }
    ]

    const numberRules = [
      { value: 'range', label: 'Faixa de Valores' }
    ]

    if (['text', 'textarea', 'email', 'phone'].includes(fieldType)) {
      return [...baseRules, ...textRules]
    }

    if (['number'].includes(fieldType)) {
      return [...baseRules, ...numberRules]
    }

    return baseRules
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Regras de Validação</h4>
          <p className="text-xs text-gray-500">
            Configure validações personalizadas para este campo
          </p>
        </div>
        
        <Select onValueChange={(value) => addRule(value as ValidationRule['type'])}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Adicionar regra" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableRuleTypes().map(rule => (
              <SelectItem key={rule.value} value={rule.value}>
                {rule.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <Card key={rule.id} className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                  {rule.type === 'required' && 'Obrigatório'}
                  {rule.type === 'minLength' && 'Min. Caracteres'}
                  {rule.type === 'maxLength' && 'Max. Caracteres'}
                  {rule.type === 'pattern' && 'Regex'}
                  {rule.type === 'custom' && 'Customizada'}
                  {rule.type === 'range' && 'Faixa'}
                </Badge>
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={(checked) => updateRule(index, { isActive: checked })}
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRule(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {rule.type === 'minLength' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <Label className="text-xs">Comprimento Mínimo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={rule.value || ''}
                    onChange={(e) => updateRule(index, { value: parseInt(e.target.value) })}
                    className="h-8"
                  />
                </div>
              </div>
            )}

            {rule.type === 'maxLength' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <Label className="text-xs">Comprimento Máximo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rule.value || ''}
                    onChange={(e) => updateRule(index, { value: parseInt(e.target.value) })}
                    className="h-8"
                  />
                </div>
              </div>
            )}

            {rule.type === 'pattern' && (
              <div className="mb-2">
                <Label className="text-xs">Expressão Regular</Label>
                <Input
                  value={rule.value || ''}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder="^[A-Za-z0-9]+$"
                  className="h-8 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use expressões regulares para validar o formato
                </p>
              </div>
            )}

            {rule.type === 'range' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <Label className="text-xs">Valor Mínimo</Label>
                  <Input
                    type="number"
                    value={rule.value ? String(rule.value).split(',')[0] : ''}
                    onChange={(e) => {
                      const max = rule.value ? String(rule.value).split(',')[1] : ''
                      updateRule(index, { value: `${e.target.value},${max}` })
                    }}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor Máximo</Label>
                  <Input
                    type="number"
                    value={rule.value ? String(rule.value).split(',')[1] : ''}
                    onChange={(e) => {
                      const min = rule.value ? String(rule.value).split(',')[0] : ''
                      updateRule(index, { value: `${min},${e.target.value}` })
                    }}
                    className="h-8"
                  />
                </div>
              </div>
            )}

            {rule.type === 'custom' && (
              <div className="mb-2">
                <Label className="text-xs">Função de Validação</Label>
                <Textarea
                  value={rule.value || ''}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder="function validate(value) {
  return value.includes('@');
}"
                  className="h-20 font-mono text-xs"
                />
              </div>
            )}

            <div>
              <Label className="text-xs">Mensagem de Erro</Label>
              <Input
                value={rule.message}
                onChange={(e) => updateRule(index, { message: e.target.value })}
                className="h-8"
                placeholder="Digite a mensagem de erro"
              />
            </div>
          </Card>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma regra de validação configurada</p>
            <p className="text-xs">Use o menu acima para adicionar validações</p>
          </div>
        )}
      </div>

      {rules.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700">
                {rules.filter(r => r.isActive).length} validação(ões) ativa(s)
              </p>
              <p className="text-xs text-blue-600">
                As validações serão aplicadas em tempo real durante o preenchimento
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
