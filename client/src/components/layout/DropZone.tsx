import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  Plus,
  Grid3X3,
  ArrowDown
} from 'lucide-react';
import { DraggableFieldItem } from './DraggableFieldItem';

interface DropZoneProps {
  id: string;
  section: string;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    icon: string;
    section: string;
    position: number;
  }>;
  onRemoveField: (fieldId: string) => void;
}

export function DropZone({ id, section, fields, onRemoveField }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const getSectionDescription = (sectionId: string) => {
    const descriptions = {
      main: 'Campos principais visíveis no topo do formulário',
      details: 'Informações detalhadas organizadas em abas ou seções expandidas',
      metadata: 'Dados adicionais, técnicos ou de configuração',
      sidebar: 'Informações de apoio exibidas na lateral da página'
    };
    
    return descriptions[sectionId as keyof typeof descriptions] || 'Seção personalizada';
  };

  const baseClasses = `
    min-h-[200px] p-6 border-2 border-dashed rounded-lg transition-all duration-200
    ${isOver 
      ? 'border-blue-500 bg-blue-50 shadow-inner' 
      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
    }
  `;

  return (
    <div ref={setNodeRef} className={baseClasses}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className={`h-5 w-5 ${isOver ? 'text-blue-600' : 'text-gray-400'}`} />
          <h4 className={`font-medium ${isOver ? 'text-blue-900' : 'text-gray-700'}`}>
            Zona de {section === 'main' ? 'Campos Principais' : 
                     section === 'details' ? 'Detalhes' :
                     section === 'metadata' ? 'Metadados' : 'Barra Lateral'}
          </h4>
        </div>
        <Badge variant={isOver ? "default" : "secondary"}>
          {fields.length} {fields.length === 1 ? 'campo' : 'campos'}
        </Badge>
      </div>

      {/* Section Description */}
      <p className={`text-sm mb-4 ${isOver ? 'text-blue-700' : 'text-gray-500'}`}>
        {getSectionDescription(section)}
      </p>

      {/* Drop Area Content */}
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          {isOver ? (
            <div className="text-center">
              <ArrowDown className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-bounce" />
              <p className="text-blue-700 font-medium">Solte o campo aqui</p>
            </div>
          ) : (
            <div className="text-center">
              <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Arraste campos da paleta para cá</p>
              <p className="text-xs text-gray-400 mt-1">
                Esta seção está vazia
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields
              .sort((a, b) => a.position - b.position)
              .map((field) => (
                <DraggableFieldItem
                  key={field.id}
                  field={field}
                  isDragging={false}
                  isDropped={true}
                  onRemove={() => onRemoveField(field.id)}
                />
              ))}
          </div>

          {/* Add More Indicator */}
          {isOver && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2">
                <ArrowDown className="h-4 w-4 text-blue-600 animate-bounce" />
                <span className="text-sm text-blue-700 font-medium">
                  Solte para adicionar mais um campo
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Seção: {section}</span>
          <span>Posição: {fields.length + 1}</span>
        </div>
      </div>
    </div>
  );
}

export default DropZone;