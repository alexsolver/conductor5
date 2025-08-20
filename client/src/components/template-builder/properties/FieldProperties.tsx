import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertCircle,
  Settings,
  Palette,
  Code
} from 'lucide-react';
interface FieldOption {
  value: string;
  label: string;
  color?: string;
  isDefault?: boolean;
}
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message?: string;
}
interface FieldProperties {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  disabled: boolean;
  visible: boolean;
  defaultValue?: string;
  options?: FieldOption[];
  validation?: ValidationRule[];
  style?: {
    width?: string;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    fontSize?: string;
  };
  grid?: {
    colspan?: number;
    rowspan?: number;
  };
}
interface FieldPropertiesProps {
  field: FieldProperties | null;
  onChange: (properties: FieldProperties) => void;
}
export const FieldProperties: React.FC<FieldPropertiesProps> = ({
  // Localization temporarily disabled
  field,
  onChange
}) => {
  const [newOption, setNewOption] = useState({ value: '', label: '' });
  const [newValidation, setNewValidation] = useState({ type: 'required', value: '', message: '' });
  if (!field) {
    return (
      <div className="p-4 text-center text-gray-500>
        <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Selecione um campo para editar suas propriedades</p>
      </div>
    );
  }
  const updateField = (updates: Partial<FieldProperties>) => {
    onChange({ ...field, ...updates });
  };
  const addOption = () => {
    if (newOption.value && newOption.label) {
      const options = [...(field.options || []), { ...newOption }];
      updateField({ options });
      setNewOption({ value: '', label: '' });
    }
  };
  const removeOption = (index: number) => {
    const options = field.options?.filter((_, i) => i !== index) || [];
    updateField({ options });
  };
  const addValidation = () => {
    if (newValidation.type) {
      const validation = [...(field.validation || []), { ...newValidation }];
      updateField({ validation });
      setNewValidation({ type: 'required', value: '', message: '' });
    }
  };
  const removeValidation = (index: number) => {
    const validation = field.validation?.filter((_, i) => i !== index) || [];
    updateField({ validation });
  };
  return (
    <div className="h-full overflow-y-auto>
      <div className="p-4 border-b>
        <h3 className="font-semibold flex items-center>
          <Settings className="h-4 w-4 mr-2" />
          Propriedades do Campo
        </h3>
        <p className="text-sm text-gray-500 mt-1>
          Tipo: <Badge variant="outline">{field.type}</Badge>
        </p>
      </div>
      <Tabs defaultValue="basic" className="w-full>
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4>
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="options">Opções</TabsTrigger>
          <TabsTrigger value="validation">Validação</TabsTrigger>
          <TabsTrigger value="style">Estilo</TabsTrigger>
        </TabsList>
        <div className="p-4>
          <TabsContent value="basic" className="space-y-4>
            <div className="space-y-4>
              <div>
                <Label htmlFor="label">Rótulo do Campo *</Label>
                <Input
                  id="label"
                  value={field.label}
                  onChange={(e) => updateField({ label: e.target.value })}
                  placeholder="Digite o rótulo do campo"
                />
              </div>
              <div>
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={field.placeholder || ''}
                  onChange={(e) => updateField({ placeholder: e.target.value })}
                  placeholder="Texto de exemplo no campo"
                />
              </div>
              <div>
                <Label htmlFor="helpText">Texto de Ajuda</Label>
                <Textarea
                  id="helpText"
                  value={field.helpText || ''}
                  onChange={(e) => updateField({ helpText: e.target.value })}
                  placeholder="Instruções ou dicas para o usuário"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="defaultValue">Valor Padrão</Label>
                <Input
                  id="defaultValue"
                  value={field.defaultValue || ''}
                  onChange={(e) => updateField({ defaultValue: e.target.value })}
                  placeholder="Valor inicial do campo"
                />
              </div>
              <Separator />
              <div className="space-y-3>
                <div className="flex items-center justify-between>
                  <div className="flex items-center space-x-2>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <Label>Campo Obrigatório</Label>
                  </div>
                  <Switch
                    checked={field.required}
                    onCheckedChange={(required) => updateField({ required })}
                  />
                </div>
                <div className="flex items-center justify-between>
                  <div className="flex items-center space-x-2>
                    {field.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <Label>Visível</Label>
                  </div>
                  <Switch
                    checked={field.visible}
                    onCheckedChange={(visible) => updateField({ visible })}
                  />
                </div>
                <div className="flex items-center justify-between>
                  <div className="flex items-center space-x-2>
                    {field.disabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    <Label>Desabilitado</Label>
                  </div>
                  <Switch
                    checked={field.disabled}
                    onCheckedChange={(disabled) => updateField({ disabled })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="options" className="space-y-4>
            {(['select', 'radio', 'checkbox', 'multiselect'].includes(field.type)) ? (
              <div className="space-y-4>
                <div>
                  <Label>Opções Disponíveis</Label>
                  <div className="space-y-2 mt-2>
                    {field.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded>
                        <div className="flex-1>
                          <div className="text-lg">"{option.label}</div>
                          <div className="text-lg">"Valor: {option.value}</div>
                        </div>
                        {option.isDefault && (
                          <Badge variant="secondary" className="text-lg">"Padrão</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Card>
                  <CardHeader className="pb-3>
                    <CardTitle className="text-lg">"Adicionar Nova Opção</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3>
                    <div>
                      <Label htmlFor="newOptionLabel">Rótulo</Label>
                      <Input
                        id="newOptionLabel"
                        value={newOption.label}
                        onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                        placeholder="Nome da opção"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newOptionValue">Valor</Label>
                      <Input
                        id="newOptionValue"
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                        placeholder="Valor técnico"
                      />
                    </div>
                    <Button 
                      onClick={addOption} 
                      disabled={!newOption.label || !newOption.value}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8>
                <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Este tipo de campo não possui opções configuráveis</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="validation" className="space-y-4>
            <div className="space-y-4>
              <div>
                <Label>Regras de Validação</Label>
                <div className="space-y-2 mt-2>
                  {field.validation?.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded>
                      <div>
                        <Badge variant="outline">{rule.type}</Badge>
                        {rule.value && (
                          <span className="ml-2 text-sm text-gray-600>
                            Valor: {rule.value}
                          </span>
                        )}
                        {rule.message && (
                          <div className="text-xs text-gray-500 mt-1>
                            Mensagem: {rule.message}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeValidation(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Card>
                <CardHeader className="pb-3>
                  <CardTitle className="text-lg">"Adicionar Validação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3>
                  <div>
                    <Label>Tipo de Validação</Label>
                    <Select
                      value={newValidation.type}
                      onValueChange={(type) => setNewValidation({ ...newValidation, type })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">Obrigatório</SelectItem>
                        <SelectItem value="minLength">Comprimento Mínimo</SelectItem>
                        <SelectItem value="maxLength">Comprimento Máximo</SelectItem>
                        <SelectItem value="pattern">Padrão (Regex)</SelectItem>
                        <SelectItem value="custom">Validação Customizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {['minLength', 'maxLength', 'pattern'].includes(newValidation.type) && (
                    <div>
                      <Label>Valor</Label>
                      <Input
                        value={newValidation.value}
                        onChange={(e) => setNewValidation({ ...newValidation, value: e.target.value })}
                        placeholder={
                          newValidation.type === 'pattern' 
                            ? 'Expressão regular' 
                            : 'Número'
                        }
                      />
                    </div>
                  )}
                  <div>
                    <Label>Mensagem de Erro</Label>
                    <Input
                      value={newValidation.message}
                      onChange={(e) => setNewValidation({ ...newValidation, message: e.target.value })}
                      placeholder='[TRANSLATION_NEEDED]'
                    />
                  </div>
                  <Button onClick={addValidation} className="w-full>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Validação
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="style" className="space-y-4>
            <div className="space-y-4>
              <div className="grid grid-cols-2 gap-4>
                <div>
                  <Label>Largura do Grid</Label>
                  <Select
                    value={field.grid?.colspan?.toString() || '1'}
                    onValueChange={(value) => updateField({ 
                      grid: { ...field.grid, colspan: parseInt(value) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 coluna</SelectItem>
                      <SelectItem value="2">2 colunas</SelectItem>
                      <SelectItem value="3">3 colunas</SelectItem>
                      <SelectItem value="4">4 colunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Altura do Grid</Label>
                  <Select
                    value={field.grid?.rowspan?.toString() || '1'}
                    onValueChange={(value) => updateField({ 
                      grid: { ...field.grid, rowspan: parseInt(value) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 linha</SelectItem>
                      <SelectItem value="2">2 linhas</SelectItem>
                      <SelectItem value="3">3 linhas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-3>
                <div>
                  <Label>Cor de Fundo</Label>
                  <div className="flex space-x-2 mt-1>
                    <Input
                      type="color"
                      value={field.style?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateField({
                        style: { ...field.style, backgroundColor: e.target.value }
                      })}
                      className="w-16 h-8"
                    />
                    <Input
                      value={field.style?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateField({
                        style: { ...field.style, backgroundColor: e.target.value }
                      })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cor do Texto</Label>
                  <div className="flex space-x-2 mt-1>
                    <Input
                      type="color"
                      value={field.style?.textColor || '#000000'}
                      onChange={(e) => updateField({
                        style: { ...field.style, textColor: e.target.value }
                      })}
                      className="w-16 h-8"
                    />
                    <Input
                      value={field.style?.textColor || '#000000'}
                      onChange={(e) => updateField({
                        style: { ...field.style, textColor: e.target.value }
                      })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cor da Borda</Label>
                  <div className="flex space-x-2 mt-1>
                    <Input
                      type="color"
                      value={field.style?.borderColor || '#d1d5db'}
                      onChange={(e) => updateField({
                        style: { ...field.style, borderColor: e.target.value }
                      })}
                      className="w-16 h-8"
                    />
                    <Input
                      value={field.style?.borderColor || '#d1d5db'}
                      onChange={(e) => updateField({
                        style: { ...field.style, borderColor: e.target.value }
                      })}
                      placeholder="#d1d5db"
                    />
                  </div>
                </div>
                <div>
                  <Label>Tamanho da Fonte</Label>
                  <Select
                    value={field.style?.fontSize || 'text-sm'}
                    onValueChange={(fontSize) => updateField({
                      style: { ...field.style, fontSize }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-xs">Extra Pequeno</SelectItem>
                      <SelectItem value="text-sm">Pequeno</SelectItem>
                      <SelectItem value="text-base">Normal</SelectItem>
                      <SelectItem value="text-lg">Grande</SelectItem>
                      <SelectItem value="text-xl">Extra Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
