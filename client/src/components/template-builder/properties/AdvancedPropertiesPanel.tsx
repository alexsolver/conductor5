
/**
 * Painel de propriedades avançadas com lógica condicional
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Switch } from '../../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { Textarea } from '../../ui/textarea'
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Link, 
  Eye,
  Code2,
  Palette,
  Zap
} from 'lucide-react'

interface FieldDependency {
  sourceFieldId: string
  condition: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less'
  value: string
  action: 'show' | 'hide' | 'require' | 'disable'
}

interface ConditionalLogic {
  conditions: FieldDependency[]
  operator: 'AND' | 'OR'
}

interface AdvancedPropertiesPanelProps {
  field: any
  availableFields: any[]
  onUpdate: (updates: any) => void
  onClose: () => void
}

export const AdvancedPropertiesPanel: React.FC<AdvancedPropertiesPanelProps> = ({
  field,
  availableFields,
  onUpdate,
  onClose
}) => {
  const [conditionalLogic, setConditionalLogic] = useState<ConditionalLogic>(
    field.conditionalLogic || { conditions: [], operator: 'AND' }
  )
  const [customCSS, setCustomCSS] = useState(field.customCSS || '')
  const [dataSource, setDataSource] = useState(field.dataSource || '')

  const addCondition = () => {
    const newCondition: FieldDependency = {
      sourceFieldId: '',
      condition: 'equals',
      value: '',
      action: 'show'
    }
    setConditionalLogic({
      ...conditionalLogic,
      conditions: [...conditionalLogic.conditions, newCondition]
    })
  }

  const updateCondition = (index: number, updates: Partial<FieldDependency>) => {
    const updatedConditions = conditionalLogic.conditions.map((condition, i) =>
      i === index ? { ...condition, ...updates } : condition
    )
    setConditionalLogic({
      ...conditionalLogic,
      conditions: updatedConditions
    })
  }

  const removeCondition = (index: number) => {
    setConditionalLogic({
      ...conditionalLogic,
      conditions: conditionalLogic.conditions.filter((_, i) => i !== index)
    })
  }

  const handleSave = () => {
    onUpdate({
      ...field,
      conditionalLogic,
      customCSS,
      dataSource
    })
  }

  return (
    <div className="h-full flex flex-col bg-white border-l>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between>
        <div className="flex items-center gap-2>
          <Settings2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Propriedades Avançadas</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto>
        <Tabs defaultValue="logic" className="h-full>
          <TabsList className="grid w-full grid-cols-4>
            <TabsTrigger value="logic" className="flex items-center gap-1>
              <Zap className="w-4 h-4" />
              Lógica
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-1>
              <Palette className="w-4 h-4" />
              Estilo
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1>
              <Link className="w-4 h-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1>
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Conditional Logic Tab */}
          <TabsContent value="logic" className="p-4 space-y-4>
            <div>
              <Label className="text-sm font-medium">Lógica Condicional</Label>
              <p className="text-xs text-gray-500 mb-3>
                Configure quando este campo deve aparecer ou ser obrigatório
              </p>

              <div className="space-y-3>
                {conditionalLogic.conditions.map((condition, index) => (
                  <Card key={index} className="p-3>
                    <div className="grid grid-cols-2 gap-2 mb-2>
                      <div>
                        <Label className="text-xs">Campo de Origem</Label>
                        <Select
                          value={condition.sourceFieldId}
                          onValueChange={(value) => updateCondition(index, { sourceFieldId: value })}
                        >
                          <SelectTrigger className="h-8>
                            <SelectValue placeholder="Selecionar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.filter(f => f.id !== field.id).map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Condição</Label>
                        <Select
                          value={condition.condition}
                          onValueChange={(value: any) => updateCondition(index, { condition: value })}
                        >
                          <SelectTrigger className="h-8>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">É igual a</SelectItem>
                            <SelectItem value="not_equals">É diferente de</SelectItem>
                            <SelectItem value="contains">Contém</SelectItem>
                            <SelectItem value="greater">Maior que</SelectItem>
                            <SelectItem value="less">Menor que</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2>
                      <div>
                        <Label className="text-xs">Valor</Label>
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          className="h-8"
                          placeholder="Digite o valor"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Ação</Label>
                        <Select
                          value={condition.action}
                          onValueChange={(value: any) => updateCondition(index, { action: value })}
                        >
                          <SelectTrigger className="h-8>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="show">Mostrar campo</SelectItem>
                            <SelectItem value="hide">Ocultar campo</SelectItem>
                            <SelectItem value="require">Tornar obrigatório</SelectItem>
                            <SelectItem value="disable">Desabilitar campo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover Condição
                    </Button>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addCondition}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Condição
                </Button>

                {conditionalLogic.conditions.length > 1 && (
                  <div>
                    <Label className="text-xs">Operador Lógico</Label>
                    <Select
                      value={conditionalLogic.operator}
                      onValueChange={(value: 'AND' | 'OR') => 
                        setConditionalLogic({ ...conditionalLogic, operator: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">E (todas as condições)</SelectItem>
                        <SelectItem value="OR">OU (qualquer condição)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-4 space-y-4>
            <div>
              <Label className="text-sm font-medium">CSS Customizado</Label>
              <p className="text-xs text-gray-500 mb-3>
                Adicione estilos CSS personalizados para este campo
              </p>
              
              <Textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder=".custom-field {
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 10px;
}"
                className="font-mono text-sm"
                rows={8}
              />

              <div className="mt-3>
                <Label className="text-xs">Classes CSS Disponíveis</Label>
                <div className="flex flex-wrap gap-1 mt-1>
                  <Badge variant="outline">.field-required</Badge>
                  <Badge variant="outline">.field-disabled</Badge>
                  <Badge variant="outline">.field-hidden</Badge>
                  <Badge variant="outline">.field-highlight</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Data Source Tab */}
          <TabsContent value="data" className="p-4 space-y-4>
            <div>
              <Label className="text-sm font-medium">Fonte de Dados</Label>
              <p className="text-xs text-gray-500 mb-3>
                Configure fonte de dados externa para campos de seleção
              </p>

              <div className="space-y-3>
                <div>
                  <Label className="text-xs">Tipo de Fonte</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API Externa</SelectItem>
                      <SelectItem value="database">Consulta no Banco</SelectItem>
                      <SelectItem value="static">Lista Estática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">URL/Endpoint</Label>
                  <Input
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value)}
                    placeholder="https://api.exemplo.com/dados"
                  />
                </div>

                <div className="flex items-center justify-between>
                  <div>
                    <Label className="text-xs">Cache de Dados</Label>
                    <p className="text-xs text-gray-500>
                      Armazenar dados em cache por 1 hora
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="p-4>
            <div>
              <Label className="text-sm font-medium">Preview do Campo</Label>
              <p className="text-xs text-gray-500 mb-3>
                Visualize como o campo aparecerá no formulário
              </p>

              <Card className="p-4>
                <div className="space-y-2>
                  <Label className="text-sm font-medium>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {field.description && (
                    <p className="text-xs text-gray-500">{field.description}</p>
                  )}

                  <div className="p-3 border rounded bg-gray-50>
                    <p className="text-sm text-gray-600>
                      Campo do tipo: <Badge variant="outline">{field.type}</Badge>
                    </p>
                    
                    {conditionalLogic.conditions.length > 0 && (
                      <div className="mt-2>
                        <p className="text-xs text-blue-600>
                          ⚡ {conditionalLogic.conditions.length} condição(ões) configurada(s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex gap-2>
        <Button onClick={handleSave} className="flex-1>
          Salvar Alterações
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
