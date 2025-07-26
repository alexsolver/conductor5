import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Plus, 
  Save, 
  Eye, 
  Settings,
  Palette,
  Target,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';

interface FieldLayoutManagerProps {
  moduleType: 'customers' | 'tickets' | 'favorecidos' | 'habilidades' | 'materials' | 'services' | 'locais';
  pageType: 'create' | 'edit' | 'details' | 'list';
  isDesignMode: boolean;
  onDesignModeChange: (enabled: boolean) => void;
  hasDesignPermission: boolean;
  children?: React.ReactNode;
}

// Available field types
const availableFields = [
  { id: 'text-field', type: 'text', label: 'Campo de Texto', icon: Type },
  { id: 'textarea-field', type: 'textarea', label: 'Área de Texto', icon: AlignLeft },
  { id: 'number-field', type: 'number', label: 'Número', icon: Hash },
  { id: 'date-field', type: 'date', label: 'Data', icon: Calendar },
  { id: 'email-field', type: 'email', label: 'E-mail', icon: Mail },
  { id: 'phone-field', type: 'phone', label: 'Telefone', icon: Phone },
];

// Drop zones
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

export function FieldLayoutManager({
  moduleType,
  pageType,
  isDesignMode,
  onDesignModeChange,
  hasDesignPermission,
  children
}: FieldLayoutManagerProps) {
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
          id: `${fieldData.id}-${Date.now()}`,
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
        <div className="flex items-center gap-2">
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
              id: `${fieldData.id}-${Date.now()}`,
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
          <div className="space-y-2">
            {fieldsInZone.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-2 bg-white border rounded">
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

  if (!isDesignMode) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6" />
              <div>
                <h2 className="text-lg font-bold">Sistema Drag & Drop Ativo</h2>
                <p className="text-sm opacity-90">Arraste campos da paleta para as seções do formulário</p>
              </div>
              <Badge className="bg-white text-blue-600">{droppedFields.length} campos</Badge>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => onDesignModeChange(false)}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Eye className="h-4 w-4 mr-2" />
              Sair do Modo Edição
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          {/* Form Area with Drop Zones */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Formulário com Zonas de Drop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {dropZones.map((zone) => (
                  <DropZone key={zone.id} zone={zone} />
                ))}
              </CardContent>
            </Card>
            
            {/* Original Page Content Overlay */}
            <div className="mt-6 opacity-50 pointer-events-none">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo Original da Página</CardTitle>
                </CardHeader>
                <CardContent>
                  {children}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fields Palette */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Paleta de Campos
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Arraste para adicionar ao formulário
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
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
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {availableFields.find(f => f.id === activeId)?.label}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}