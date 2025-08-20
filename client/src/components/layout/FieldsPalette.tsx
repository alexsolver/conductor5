import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { 
  Type, Calendar, ToggleLeft, Hash, FileText, 
  ChevronDown, ChevronRight, Palette, Settings 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FieldType {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}

interface DraggableFieldProps {
  field: FieldType;
}

function DraggableField({ field }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.id,
    data: {
      type: 'field',
      fieldType: field.type,
      label: field.label,
      category: field.category
    }
  });

  const style = transform ? {
    transform: "px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 border rounded-lg cursor-grab active:cursor-grabbing
        hover:border-blue-300 hover:bg-blue-50 transition-all
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      "
    >
      <div className="flex items-center gap-2>
        <div className="text-blue-600">{field.icon}</div>
        <div className="flex-1>
          <p className="font-medium text-sm">{field.label}</p>
          <p className="text-xs text-gray-500">{field.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function FieldsPalette() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic']);

  const fieldTypes: FieldType[] = [
    // Campos Básicos
    {
      id: 'text-field',
      type: 'text',
      label: 'Campo de Texto',
      icon: <Type className="w-4 h-4" />,
      description: 'Campo de texto simples',
      category: 'basic'
    },
    {
      id: 'textarea-field',
      type: 'textarea',
      label: 'Área de Texto',
      icon: <FileText className="w-4 h-4" />,
      description: 'Campo de texto multi-linha',
      category: 'basic'
    },
    {
      id: 'number-field',
      type: 'number',
      label: 'Campo Numérico',
      icon: <Hash className="w-4 h-4" />,
      description: 'Campo para valores numéricos',
      category: 'basic'
    },
    {
      id: 'date-field',
      type: 'date',
      label: 'Campo de Data',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Seletor de data',
      category: 'basic'
    },
    {
      id: 'switch-field',
      type: 'switch',
      label: 'Campo Switch',
      icon: <ToggleLeft className="w-4 h-4" />,
      description: 'Alternador verdadeiro/falso',
      category: 'basic'
    },

    // Campos Avançados
    {
      id: 'select-field',
      type: 'select',
      label: 'Campo de Seleção',
      icon: <ChevronDown className="w-4 h-4" />,
      description: 'Lista suspensa de opções',
      category: 'advanced'
    },
    {
      id: 'multiselect-field',
      type: 'multiselect',
      label: 'Seleção Múltipla',
      icon: <ChevronDown className="w-4 h-4" />,
      description: 'Múltiplas opções selecionáveis',
      category: 'advanced'
    },
    {
      id: 'radio-field',
      type: 'radio',
      label: 'Botões de Rádio',
      icon: <ToggleLeft className="w-4 h-4" />,
      description: 'Seleção única entre opções',
      category: 'advanced'
    },
    {
      id: 'checkbox-field',
      type: 'checkbox',
      label: 'Caixas de Seleção',
      icon: <ToggleLeft className="w-4 h-4" />,
      description: 'Múltiplas opções marcáveis',
      category: 'advanced'
    },

    // Campos Especiais
    {
      id: 'file-field',
      type: 'file',
      label: 'Upload de Arquivo',
      icon: <FileText className="w-4 h-4" />,
      description: 'Campo para upload de arquivos',
      category: 'special'
    },
    {
      id: 'color-field',
      type: 'color',
      label: 'Seletor de Cor',
      icon: <Palette className="w-4 h-4" />,
      description: 'Selecionador de cores',
      category: 'special'
    },
    {
      id: 'range-field',
      type: 'range',
      label: 'Campo de Intervalo',
      icon: <Settings className="w-4 h-4" />,
      description: 'Slider para valores numéricos',
      category: 'special'
    }
  ];

  const categories = [
    { id: 'basic', label: 'Campos Básicos', icon: <Type className="w-4 h-4" /> },
    { id: 'advanced', label: 'Campos Avançados', icon: <Settings className="w-4 h-4" /> },
    { id: 'special', label: 'Campos Especiais', icon: <Palette className="w-4 h-4" /> }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Card className="w-80 h-full>
      <CardHeader>
        <CardTitle className="flex items-center gap-2>
          <Palette className="w-5 h-5 text-blue-600" />
          Paleta de Campos
        </CardTitle>
        <p className="text-sm text-gray-600>
          Arraste os campos para adicionar ao formulário
        </p>
      </CardHeader>
      <CardContent className="space-y-4>
        {categories.map(category => (
          <Collapsible
            key={category.id}
            open={expandedCategories.includes(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2>
                  {category.icon}
                  <span className="font-medium">{category.label}</span>
                  <Badge variant="outline" className="text-xs>
                    {fieldTypes.filter(f => f.category === category.id).length}
                  </Badge>
                </div>
                {expandedCategories.includes(category.id) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2>
              {fieldTypes
                .filter(field => field.category === category.id)
                .map(field => (
                  <DraggableField key={field.id} field={field} />
                ))
              }
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}