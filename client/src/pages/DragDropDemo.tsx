import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Type, 
  AlignLeft, 
  Hash, 
  Calendar, 
  Mail,
  ArrowLeft
} from 'lucide-react';
import { useLocation } from 'wouter';

// Available field types for demonstration
const availableFields = [
  { id: 'text-field', type: 'text', label: 'Campo de Texto', icon: Type },
  { id: 'textarea-field', type: 'textarea', label: 'Área de Texto', icon: AlignLeft },
  { id: 'number-field', type: 'number', label: 'Número', icon: Hash },
  { id: 'date-field', type: 'date', label: 'Data', icon: Calendar },
  { id: 'email-field', type: 'email', label: 'E-mail', icon: Mail },
];

// Drop zones for the form
const dropZones = [
  { id: 'main-section', title: 'Seção Principal', description: 'Campos principais do formulário' },
  { id: 'details-section', title: 'Detalhes', description: 'Informações detalhadas' },
  { id: 'metadata-section', title: 'Metadados', description: 'Informações adicionais' },
];

interface DroppedField {
  id: string;
  type: string;
  label: string;
  sectionId: string;
  position: number;
}

export default function DragDropDemo() {
  const [, setLocation] = useLocation();
  const [droppedFields, setDroppedFields] = useState<DroppedField[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && over.id.toString().includes('-section')) {
      const fieldData = availableFields.find(f => f.id === active.id);
      if (fieldData) {
        const newField: DroppedField = {
          id: "
          type: fieldData.type,
          label: fieldData.label,
          sectionId: over.id.toString(),
          position: droppedFields.filter(f => f.sectionId === over.id).length
        };
        
        setDroppedFields(prev => [...prev, newField]);
      }
    }
    
    setActiveId(null);
  }

  function handleRemoveField(fieldId: string) {
    setDroppedFields(prev => prev.filter(f => f.id !== fieldId));
  }

  function DraggableField({ field }: { field: typeof availableFields[0] }) {
    const IconComponent = field.icon;
    
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', field.id);
          setActiveId(field.id);
        }}
        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      >
        <div className=""
          <IconComponent className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{field.label}</span>
        </div>
      </div>
    );
  }

  function DropZone({ zone }: { zone: typeof dropZones[0] }) {
    const fieldsInZone = droppedFields.filter(f => f.sectionId === zone.id);
    
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const fieldId = e.dataTransfer.getData('text/plain');
          const fieldData = availableFields.find(f => f.id === fieldId);
          
          if (fieldData) {
            const newField: DroppedField = {
              id: "
              type: fieldData.type,
              label: fieldData.label,
              sectionId: zone.id,
              position: fieldsInZone.length
            };
            
            setDroppedFields(prev => [...prev, newField]);
          }
          setActiveId(null);
        }}
        className="min-h-32 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <h3 className="font-medium text-gray-900 mb-1">{zone.title}</h3>
        <p className="text-sm text-gray-500 mb-3">{zone.description}</p>
        
        {fieldsInZone.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Arraste campos aqui</p>
        ) : (
          <div className=""
            {fieldsInZone.map((field) => (
              <div key={field.id} className=""
                <span className="text-sm">{field.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveField(field.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className=""
      {/* Header */}
      <div className=""
        <div className=""
          <Button variant="outline" onClick={() => setLocation('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demo: Sistema Drag & Drop</h1>
            <p className="text-gray-600">Demonstração do sistema de campos customizáveis</p>
          </div>
        </div>
        
        <div className=""
          <div className=""
            <Layout className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Sistema Ativo</span>
            <Badge variant="secondary">{droppedFields.length} campos adicionados</Badge>
          </div>
          <p className=""
            Arraste campos da paleta (direita) para as seções do formulário (esquerda)
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className=""
          {/* Main Content Area - Form with Drop Zones */}
          <div className=""
            <Card>
              <CardHeader>
                <CardTitle>Formulário de Demonstração</CardTitle>
                <p className=""
                  Arraste campos da paleta para as seções abaixo
                </p>
              </CardHeader>
              <CardContent className=""
                {dropZones.map((zone) => (
                  <DropZone key={zone.id} zone={zone} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Fields Palette */}
          <div className=""
            <Card className=""
              <CardHeader>
                <CardTitle className=""
                  <Layout className="h-5 w-5" />
                  Paleta de Campos
                </CardTitle>
                <p className=""
                  Arraste para adicionar ao formulário
                </p>
              </CardHeader>
              <CardContent className=""
                {availableFields.map((field) => (
                  <DraggableField key={field.id} field={field} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className=""
              <div className=""
                <Layout className="h-4 w-4 text-blue-600" />
                <span className=""
                  {availableFields.find(f => f.id === activeId)?.label}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}