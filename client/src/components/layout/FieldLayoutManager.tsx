import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Layout, 
  Plus, 
  Save, 
  Eye, 
  Settings,
  Palette,
  Target
} from 'lucide-react';
import { FieldsPalette } from './FieldsPalette';
import { DropZone } from './DropZone';
import { DraggableFieldItem } from './DraggableFieldItem';

interface FieldLayoutManagerProps {
  moduleType: 'customers' | 'tickets' | 'favorecidos' | 'habilidades' | 'materials' | 'services' | 'locais';
  pageType: 'create' | 'edit' | 'details' | 'list';
  isDesignMode: boolean;
  onDesignModeChange: (enabled: boolean) => void;
  hasDesignPermission: boolean;
  children?: React.ReactNode;
}

// Available field types based on module
const getAvailableFields = (moduleType: string) => {
  const commonFields = [
    { id: 'text-field', type: 'text', label: 'Campo de Texto', icon: 'Type' },
    { id: 'textarea-field', type: 'textarea', label: 'Área de Texto', icon: 'AlignLeft' },
    { id: 'select-field', type: 'select', label: 'Lista Suspensa', icon: 'ChevronDown' },
    { id: 'number-field', type: 'number', label: 'Número', icon: 'Hash' },
    { id: 'date-field', type: 'date', label: 'Data', icon: 'Calendar' },
    { id: 'checkbox-field', type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
    { id: 'email-field', type: 'email', label: 'E-mail', icon: 'Mail' },
    { id: 'phone-field', type: 'phone', label: 'Telefone', icon: 'Phone' },
  ];

  const moduleSpecific = {
    tickets: [
      { id: 'priority-field', type: 'priority', label: 'Prioridade', icon: 'AlertTriangle' },
      { id: 'status-field', type: 'status', label: 'Status', icon: 'Circle' },
      { id: 'category-field', type: 'category', label: 'Categoria', icon: 'Tag' },
      { id: 'assignee-field', type: 'assignee', label: 'Responsável', icon: 'User' },
    ],
    customers: [
      { id: 'company-field', type: 'company', label: 'Empresa', icon: 'Building' },
      { id: 'address-field', type: 'address', label: 'Endereço', icon: 'MapPin' },
      { id: 'contact-field', type: 'contact', label: 'Contato', icon: 'Users' },
    ],
    materials: [
      { id: 'inventory-field', type: 'inventory', label: 'Estoque', icon: 'Package' },
      { id: 'supplier-field', type: 'supplier', label: 'Fornecedor', icon: 'Truck' },
      { id: 'price-field', type: 'price', label: 'Preço', icon: 'DollarSign' },
    ]
  };

  return [...commonFields, ...(moduleSpecific[moduleType] || [])];
};

export function FieldLayoutManager({
  moduleType,
  pageType,
  isDesignMode,
  onDesignModeChange,
  hasDesignPermission,
  children
}: FieldLayoutManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [droppedFields, setDroppedFields] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('main');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const availableFields = useMemo(() => getAvailableFields(moduleType), [moduleType]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.id.toString().startsWith('drop-zone-')) {
      const section = over.id.toString().replace('drop-zone-', '');
      const field = availableFields.find(f => f.id === active.id);
      
      if (field) {
        const newField = {
          ...field,
          id: `${field.id}-${Date.now()}`,
          section,
          position: droppedFields.filter(f => f.section === section).length
        };
        
        setDroppedFields(prev => [...prev, newField]);
      }
    }
  };

  const removeField = (fieldId: string) => {
    setDroppedFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const sections = [
    { id: 'main', name: 'Seção Principal', description: 'Campos principais do formulário' },
    { id: 'details', name: 'Detalhes', description: 'Informações detalhadas' },
    { id: 'metadata', name: 'Metadados', description: 'Informações adicionais' },
    { id: 'sidebar', name: 'Barra Lateral', description: 'Informações de apoio' }
  ];

  if (!isDesignMode) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Design Mode Header */}
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Modo de Edição de Layout</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {moduleType} - {pageType}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Salvar Layout
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDesignModeChange(false)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Fields Palette - Left Sidebar */}
            <div className="col-span-3">
              <FieldsPalette 
                moduleType={moduleType}
                availableFields={availableFields}
              />
            </div>

            {/* Main Design Area */}
            <div className="col-span-9">
              <div className="space-y-6">
                {/* Section Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Seções do Formulário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setSelectedSection(section.id)}
                          className={`p-3 text-left rounded-lg border transition-all ${
                            selectedSection === section.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{section.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Drop Zones for each section */}
                {sections.map((section) => (
                  <Card key={section.id} className={selectedSection === section.id ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{section.name}</span>
                        <Badge variant="secondary">
                          {droppedFields.filter(f => f.section === section.id).length} campos
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DropZone
                        id={`drop-zone-${section.id}`}
                        section={section.id}
                        fields={droppedFields.filter(f => f.section === section.id)}
                        onRemoveField={removeField}
                      />
                    </CardContent>
                  </Card>
                ))}

                {/* Preview Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Preview do Formulário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 text-center">
                        Preview será gerado após adicionar campos nas seções
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <DraggableFieldItem
              field={availableFields.find(f => f.id === activeId)!}
              isDragging={true}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default FieldLayoutManager;