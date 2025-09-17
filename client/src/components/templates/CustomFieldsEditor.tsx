import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'textarea' | 'boolean';
  required: boolean;
  hidden: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
  options?: { value: string; label: string }[];
  order: number;
}

interface CustomFieldsEditorProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  readOnly?: boolean;
}

export default function CustomFieldsEditor({ fields, onChange, readOnly = false }: CustomFieldsEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    hidden: false,
    order: fields.length + 1
  });

  const fieldTypes = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Data' },
    { value: 'datetime', label: 'Data e Hora' },
    { value: 'select', label: 'Lista Suspensa' },
    { value: 'multiselect', label: 'Múltipla Seleção' },
    { value: 'textarea', label: 'Texto Longo' },
    { value: 'boolean', label: 'Verdadeiro/Falso' }
  ];

  const addField = () => {
    if (!newField.name || !newField.label) return;

    const field: CustomField = {
      id: `field_${Date.now()}`,
      name: newField.name!,
      label: newField.label!,
      type: newField.type!,
      required: newField.required!,
      hidden: newField.hidden!,
      placeholder: newField.placeholder,
      helpText: newField.helpText,
      defaultValue: newField.defaultValue,
      validation: newField.validation,
      options: newField.options,
      order: newField.order!
    };

    onChange([...fields, field]);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      hidden: false,
      order: fields.length + 2
    });
    setShowAddField(false);
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    onChange(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    onChange(fields.filter(field => field.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(field => field.id === id);
    if (index === -1) return;

    const newFields = [...fields];
    if (direction === 'up' && index > 0) {
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }

    // Update order values
    newFields.forEach((field, idx) => {
      field.order = idx + 1;
    });

    onChange(newFields);
  };

  const FieldEditor = ({ field, isNew = false }: { field: Partial<CustomField>; isNew?: boolean }) => {
    const [localField, setLocalField] = useState(field);

    const updateLocalField = (updates: Partial<CustomField>) => {
      setLocalField({ ...localField, ...updates });
    };

    const saveField = () => {
      if (isNew && localField.name && localField.label) {
        // Adicionar o campo diretamente
        addField();
      } else if (field.id) {
        updateField(field.id, localField);
        setEditingField(null);
      }
    };

    const addOption = () => {
      const options = localField.options || [];
      updateLocalField({
        options: [...options, { value: `option_${options.length + 1}`, label: 'Nova Opção' }]
      });
    };

    const updateOption = (index: number, key: 'value' | 'label', value: string) => {
      const options = [...(localField.options || [])];
      options[index][key] = value;
      updateLocalField({ options });
    };

    const removeOption = (index: number) => {
      const options = localField.options || [];
      updateLocalField({ options: options.filter((_, i) => i !== index) });
    };

    return (
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">
              {isNew ? 'Novo Campo Customizado' : `Editando: ${field.label}`}
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveField}>
                <Save className="w-3 h-3 mr-1" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                if (isNew) {
                  setNewField({
                    name: '',
                    label: '',
                    type: 'text',
                    required: false,
                    hidden: false,
                    order: fields.length + 1
                  });
                } else {
                  setEditingField(null);
                }
              }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do Campo *</Label>
              <Input
                value={localField.name || ''}
                onChange={(e) => updateLocalField({ name: e.target.value })}
                placeholder="campo_personalizado"
              />
            </div>
            <div>
              <Label>Rótulo *</Label>
              <Input
                value={localField.label || ''}
                onChange={(e) => updateLocalField({ label: e.target.value })}
                placeholder="Campo Personalizado"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Campo</Label>
              <Select
                value={localField.type}
                onValueChange={(value) => updateLocalField({ type: value as CustomField['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input
                value={localField.placeholder || ''}
                onChange={(e) => updateLocalField({ placeholder: e.target.value })}
                placeholder="Texto de exemplo..."
              />
            </div>
          </div>

          <div>
            <Label>Texto de Ajuda</Label>
            <Textarea
              value={localField.helpText || ''}
              onChange={(e) => updateLocalField({ helpText: e.target.value })}
              placeholder="Instruções para preenchimento do campo..."
              rows={2}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={localField.required || false}
                onCheckedChange={(checked) => updateLocalField({ required: checked })}
              />
              <Label>Campo Obrigatório</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={localField.hidden || false}
                onCheckedChange={(checked) => updateLocalField({ hidden: checked })}
              />
              <Label>Campo Oculto</Label>
            </div>
          </div>

          {(localField.type === 'select' || localField.type === 'multiselect') && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Opções</Label>
                <Button size="sm" variant="outline" onClick={addOption}>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Opção
                </Button>
              </div>
              <div className="space-y-2">
                {(localField.options || []).map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Valor"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                    />
                    <Input
                      placeholder="Rótulo"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (readOnly) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Campos Customizados</h3>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setShowAddField(!showAddField)}>
              <Plus className="w-3 h-3 mr-1" />
              {showAddField ? 'Cancelar' : 'Novo Campo'}
            </Button>
          )}
        </div>
        
        {/* Formulário para adicionar novo campo */}
        {showAddField && !readOnly && (
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <FieldEditor field={newField} isNew={true} />
          </div>
        )}
        
        {fields.length === 0 ? (
          <p className="text-muted-foreground">Nenhum campo customizado definido.</p>
        ) : (
          <div className="space-y-3">
            {fields.map(field => (
              <Card key={field.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{field.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {fieldTypes.find(t => t.value === field.type)?.label} • {field.name}
                      </p>
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {field.required && <Badge>Obrigatório</Badge>}
                      {field.hidden && <Badge variant="outline">Oculto</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Campos Customizados</h3>
        <Badge variant="outline">{fields.length} campos</Badge>
      </div>

      {/* Existing Fields */}
      <div className="space-y-3">
        {fields.map(field => (
          <Card key={field.id}>
            <CardContent className="p-4">
              {editingField === field.id ? (
                <FieldEditor field={field} />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{field.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {fieldTypes.find(t => t.value === field.type)?.label} • {field.name}
                    </p>
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {field.required && <Badge>Obrigatório</Badge>}
                    {field.hidden && <Badge variant="outline">Oculto</Badge>}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingField(field.id)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Field */}
      {editingField === null && (
        <FieldEditor field={newField} isNew />
      )}
    </div>
  );
}