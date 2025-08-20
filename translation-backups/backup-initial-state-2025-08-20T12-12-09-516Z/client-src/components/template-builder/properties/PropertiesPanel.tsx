
/**
 * Painel de propriedades para editar configurações dos campos
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { Label } from '../../ui/label'
import { Switch } from '../../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Badge } from '../../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { FieldComponent } from '../DragDropCanvas'
import { 
  X, 
  Plus, 
  Trash2, 
  Settings, 
  Eye, 
  Code,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

interface PropertiesPanelProps {
  field: FieldComponent
  onUpdate: (updates: Partial<FieldComponent>) => void
  onClose: () => void
}

interface FieldOption {
  value: string
  label: string
  color?: string
  isDefault?: boolean
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  field,
  onUpdate,
  onClose
}) => {
  const [localField, setLocalField] = useState<FieldComponent>(field)
  const [options, setOptions] = useState<FieldOption[]>(field.properties?.options || [])
  const [newOptionValue, setNewOptionValue] = useState('')
  const [newOptionLabel, setNewOptionLabel] = useState('')

  useEffect(() => {
    setLocalField(field)
    setOptions(field.properties?.options || [])
  }, [field])

  const handlePropertyChange = (key: string, value: any) => {
    const updatedField = {
      ...localField,
      properties: {
        ...localField.properties,
        [key]: value
      }
    }
    setLocalField(updatedField)
  }

  const handleValidationChange = (key: string, value: any) => {
    const updatedField = {
      ...localField,
      validation: {
        ...localField.validation,
        [key]: value
      }
    }
    setLocalField(updatedField)
  }

  const handleSave = () => {
    const updates = {
      ...localField,
      properties: {
        ...localField.properties,
        options: options.length > 0 ? options : undefined
      }
    }
    onUpdate(updates)
  }

  const addOption = () => {
    if (newOptionValue && newOptionLabel) {
      const newOption: FieldOption = {
        value: newOptionValue,
        label: newOptionLabel,
        isDefault: options.length === 0
      }
      setOptions([...options, newOption])
      setNewOptionValue('')
      setNewOptionLabel('')
    }
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    setOptions(options.map((option, i) => 
      i === index ? { ...option, ...updates } : option
    ))
  }

  const setDefaultOption = (index: number) => {
    setOptions(options.map((option, i) => ({
      ...option,
      isDefault: i === index
    })))
  }

  const needsOptions = ['select', 'multiselect', 'radio'].includes(field.type)

  return (
    <div className="h-full flex flex-col bg-white border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Propriedades do Campo</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="validation">Validação</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          {/* Aba Geral */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="label">Rótulo do Campo</Label>
                  <Input
                    id="label"
                    value={localField.label}
                    onChange={(e) => setLocalField({
                      ...localField,
                      label: e.target.value
                    })}
                    placeholder="Digite o rótulo..."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    value={localField.properties?.description || ''}
                    onChange={(e) => handlePropertyChange('description', e.target.value)}
                    placeholder="Descreva o propósito deste campo..."
                    rows={2}
                  />
                </div>

                {['text', 'textarea', 'email', 'url'].includes(field.type) && (
                  <div>
                    <Label htmlFor="placeholder">Texto de Exemplo</Label>
                    <Input
                      id="placeholder"
                      value={localField.properties?.placeholder || ''}
                      onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
                      placeholder="Ex: Digite seu nome..."
                    />
                  </div>
                )}

                {field.type === 'textarea' && (
                  <div>
                    <Label htmlFor="rows">Número de Linhas</Label>
                    <Input
                      id="rows"
                      type="number"
                      min="2"
                      max="10"
                      value={localField.properties?.rows || 4}
                      onChange={(e) => handlePropertyChange('rows', parseInt(e.target.value))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Campo Obrigatório</Label>
                    <p className="text-xs text-gray-500">
                      Usuário deve preencher este campo
                    </p>
                  </div>
                  <Switch
                    checked={localField.properties?.required || false}
                    onCheckedChange={(checked) => handlePropertyChange('required', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Campo Oculto</Label>
                    <p className="text-xs text-gray-500">
                      Campo não será visível no formulário
                    </p>
                  </div>
                  <Switch
                    checked={localField.properties?.hidden || false}
                    onCheckedChange={(checked) => handlePropertyChange('hidden', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Opções para campos de seleção */}
            {needsOptions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    Opções de Seleção
                    <Badge variant="secondary">{options.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Lista de opções */}
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            value={option.value}
                            onChange={(e) => updateOption(index, { value: e.target.value })}
                            placeholder="Valor"
                            className="text-sm"
                          />
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption(index, { label: e.target.value })}
                            placeholder="Rótulo"
                            className="text-sm"
                          />
                        </div>
                        
                        <Button
                          variant={option.isDefault ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDefaultOption(index)}
                          title="Definir como padrão"
                          className="h-8 w-16 text-xs"
                        >
                          {option.isDefault ? 'Padrão' : 'Definir'}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          title="Remover opção"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Adicionar nova opção */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                        placeholder="Valor da opção"
                        className="text-sm"
                      />
                      <Input
                        value={newOptionLabel}
                        onChange={(e) => setNewOptionLabel(e.target.value)}
                        placeholder="Rótulo da opção"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={addOption}
                      disabled={!newOptionValue || !newOptionLabel}
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Opção
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Validação */}
          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Regras de Validação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['text', 'textarea', 'email', 'url'].includes(field.type)) && (
                  <>
                    <div>
                      <Label htmlFor="minLength">Tamanho Mínimo</Label>
                      <Input
                        id="minLength"
                        type="number"
                        min="0"
                        value={localField.properties?.minLength || ''}
                        onChange={(e) => handlePropertyChange('minLength', parseInt(e.target.value) || undefined)}
                        placeholder="Ex: 3"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxLength">Tamanho Máximo</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        min="1"
                        value={localField.properties?.maxLength || ''}
                        onChange={(e) => handlePropertyChange('maxLength', parseInt(e.target.value) || undefined)}
                        placeholder="Ex: 100"
                      />
                    </div>
                  </>
                )}

                {field.type === 'number' && (
                  <>
                    <div>
                      <Label htmlFor="min">Valor Mínimo</Label>
                      <Input
                        id="min"
                        type="number"
                        value={localField.properties?.min || ''}
                        onChange={(e) => handlePropertyChange('min', parseFloat(e.target.value) || undefined)}
                        placeholder="Ex: 0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="max">Valor Máximo</Label>
                      <Input
                        id="max"
                        type="number"
                        value={localField.properties?.max || ''}
                        onChange={(e) => handlePropertyChange('max', parseFloat(e.target.value) || undefined)}
                        placeholder="Ex: 100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="step">Incremento</Label>
                      <Input
                        id="step"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={localField.properties?.step || 1}
                        onChange={(e) => handlePropertyChange('step', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="customValidation">Mensagem de Erro Personalizada</Label>
                  <Input
                    id="customValidation"
                    value={localField.properties?.customErrorMessage || ''}
                    onChange={(e) => handlePropertyChange('customErrorMessage', e.target.value)}
                    placeholder="Ex: Este campo é obrigatório"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Avançado */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="fieldKey">Chave do Campo</Label>
                  <Input
                    id="fieldKey"
                    value={localField.id}
                    disabled
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identificador único usado no banco de dados
                  </p>
                </div>

                <div>
                  <Label htmlFor="cssClass">Classes CSS Customizadas</Label>
                  <Input
                    id="cssClass"
                    value={localField.properties?.cssClass || ''}
                    onChange={(e) => handlePropertyChange('cssClass', e.target.value)}
                    placeholder="Ex: custom-field highlight"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Campo Somente Leitura</Label>
                    <p className="text-xs text-gray-500">
                      Campo será exibido mas não editável
                    </p>
                  </div>
                  <Switch
                    checked={localField.properties?.readonly || false}
                    onCheckedChange={(checked) => handlePropertyChange('readonly', checked)}
                  />
                </div>

                {field.type === 'calculated' && (
                  <div>
                    <Label htmlFor="formula">Fórmula de Cálculo</Label>
                    <Textarea
                      id="formula"
                      value={localField.properties?.formula || ''}
                      onChange={(e) => handlePropertyChange('formula', e.target.value)}
                      placeholder="Ex: field1 + field2 * 0.1"
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use nomes de campos para referenciar outros valores
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            Aplicar Alterações
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
