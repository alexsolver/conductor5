import { useState } from "react";
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Type, Calendar, ToggleLeft, Hash, FileText, ChevronDown, 
  Settings, Palette, X, Edit3, Save, Trash2 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CustomField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  value?: any;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface DynamicFieldRendererProps {
  field: CustomField;
  isEditMode?: boolean;
  onUpdate?: (field: CustomField) => void;
  onRemove?: (fieldId: string) => void;
  onChange?: (fieldId: string, value: any) => void;
}

export default function DynamicFieldRenderer({
  // Localization temporarily disabled

  field,
  isEditMode = false,
  onUpdate,
  onRemove,
  onChange
}: DynamicFieldRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CustomField>(field);

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'textarea': return <FileText className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'switch': return <ToggleLeft className="w-4 h-4" />;
      case 'select': return <ChevronDown className="w-4 h-4" />;
      case 'range': return <Settings className="w-4 h-4" />;
      case 'color': return <Palette className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  const handleSaveEdit = () => {
    onUpdate?.(editData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditData(field);
    setIsEditing(false);
  };

  const addOption = () => {
    setEditData(prev => ({
      ...prev,
      options: [...(prev.options || []), { label: '', value: '' }]
    }));
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    setEditData(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => 
        i === index ? { ...opt, [key]: value } : opt
      ) || []
    }));
  };

  const removeOption = (index: number) => {
    setEditData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const renderFieldInput = (fieldData: CustomField, isEditable: boolean = false) => {
    const inputProps = {
      value: fieldData.value || '',
      onChange: (e: any) => {
        const value = e.target?.value || e;
        if (isEditable) {
          setEditData(prev => ({ ...prev, value }));
        } else {
          onChange?.(fieldData.id, value);
        }
      },
      placeholder: fieldData.placeholder
    };

    switch (fieldData.type) {
      case 'text':
        return <Input {...inputProps} />;
      
      case 'textarea':
        return <Textarea {...inputProps} rows={3} />;
      
      case 'number':
        return (
          <Input 
            {...inputProps}
            type="number"
            min={fieldData.validation?.min}
            max={fieldData.validation?.max}
          />
        );
      
      case 'date':
        return <Input {...inputProps} type="date" />;
      
      case 'switch':
        return (
          <Switch
            checked={fieldData.value || false}
            onCheckedChange={inputProps.onChange}
          />
        );
      
      case 'select':
        return (
          <Select value={fieldData.value} onValueChange={inputProps.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={fieldData.placeholder || '[TRANSLATION_NEEDED]'} />
            </SelectTrigger>
            <SelectContent>
              {fieldData.options?.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'range':
        return (
          <div className="space-y-2">
            <Input
              type="range"
              {...inputProps}
              min={fieldData.validation?.min || 0}
              max={fieldData.validation?.max || 100}
              className="w-full"
            />
            <div className="text-sm text-gray-500 text-center">
              Valor: {fieldData.value || 0}
            </div>
          </div>
        );
      
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <Input {...inputProps} type="color" className="w-16 h-10" />
            <Input {...inputProps} className="flex-1" />
          </div>
        );
      
      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              inputProps.onChange(files);
            }}
            multiple
          />
        );
      
      default:
        return <Input {...inputProps} />;
    }
  };

  if (isEditing) {
    return (
      <Card className="border-blue-300 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFieldIcon(editData.type)}
              <span className="font-medium">Editando Campo</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rótulo do Campo</Label>
              <Input
                value={editData.label}
                onChange={(e) => setEditData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Digite o rótulo"
              />
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input
                value={editData.placeholder || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="Texto de ajuda"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editData.required}
              onCheckedChange={(checked) => setEditData(prev => ({ ...prev, required: checked }))}
            />
            <Label>Campo obrigatório</Label>
          </div>

          {['select', 'multiselect', 'radio', 'checkbox'].includes(editData.type) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Opções</Label>
                <Button size="sm" variant="outline" onClick={addOption}>
                  + Adicionar Opção
                </Button>
              </div>
              <div className="space-y-2">
                {editData.options?.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Rótulo"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                    />
                    <Input
                      placeholder="Valor"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative group">
      <CardContent className="p-4">
        {isEditMode && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove?.(field.id)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getFieldIcon(field.type)}
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
          </div>
          
          {renderFieldInput(field)}
        </div>
      </CardContent>
    </Card>
  );
}