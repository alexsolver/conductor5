import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableProvider,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Settings, 
  Eye, 
  Save, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut,
  Grid3X3,
  Type,
  Calendar,
  CheckSquare,
  Upload,
  MapPin,
  Calculator,
  Layers
} from 'lucide-react';

// Tipos para os campos
interface FieldDefinition {
  id: string;
  type: string;
  label: string;
  key: string;
  isRequired: boolean;
  isVisible: boolean;
  sortOrder: number;
  validationRules: Record<string, any>;
  fieldOptions: Array<{value: string; label: string}>;
  conditionalLogic: Record<string, any>;
  styling: Record<string, any>;
  gridPosition: {row: number; col: number; span: number};
}

interface TemplateEditorProps {
  templateId?: string;
  onSave: (template: any) => void;
  onPreview: (template: any) => void;
}

// Componente de campo arrastável
const DraggableField: React.FC<{
  field: FieldDefinition;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}> = ({ field, isSelected, onSelect, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFieldIcon = (type: string) => {
    const icons = {
      text: Type,
      date: Calendar,
      checkbox: CheckSquare,
      upload: Upload,
      location: MapPin,
      calculated: Calculator,
    };
    const Icon = icons[type as keyof typeof icons] || Type;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-3 border rounded-lg cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
      "
      onClick={() => onSelect(field.id)}
      onDoubleClick={() => onEdit(field.id)}
    >
      <div className="flex items-center justify-between>
        <div className="flex items-center gap-2>
          {getFieldIcon(field.type)}
          <span className="font-medium">{field.label}</span>
        </div>
        <div className="flex items-center gap-1>
          {field.isRequired && <Badge variant="destructive" className="text-xs">*</Badge>}
          {!field.isVisible && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
          <Settings className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1>
        Tipo: {field.type} • Chave: {field.key}
      </div>
    </div>
  );
};

// Componente principal do editor
export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templateId,
  onSave,
  onPreview
}) => {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('design');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [gridVisible, setGridVisible] = useState(true);
  const [history, setHistory] = useState<FieldDefinition[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Palette de componentes disponíveis
  const fieldTypes = [
    { type: 'text', label: 'Texto', icon: Type },
    { type: 'textarea', label: 'Texto Longo', icon: Type },
    { type: 'email', label: 'Email', icon: Type },
    { type: 'phone', label: 'Telefone', icon: Type },
    { type: 'number', label: 'Número', icon: Type },
    { type: 'date', label: 'Data', icon: Calendar },
    { type: 'datetime', label: 'Data/Hora', icon: Calendar },
    { type: 'select', label: 'Seleção', icon: Layers },
    { type: 'multiselect', label: 'Múltipla Seleção', icon: Layers },
    { type: 'radio', label: 'Radio', icon: CheckSquare },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'upload', label: 'Upload', icon: Upload },
    { type: 'location', label: 'Localização', icon: MapPin },
    { type: 'calculated', label: 'Calculado', icon: Calculator },
  ];

  // Adicionar novo campo
  const addField = useCallback((type: string) => {
    const newField: FieldDefinition = {
      id: "
      type,
      label: "
      key: "
      isRequired: false,
      isVisible: true,
      sortOrder: fields.length,
      validationRules: {},
      fieldOptions: [],
      conditionalLogic: {},
      styling: {},
      gridPosition: { row: 0, col: 0, span: 1 }
    };

    const newFields = [...fields, newField];
    setFields(newFields);
    setSelectedFieldId(newField.id);

    // Adicionar ao histórico
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newFields]);
    setHistoryIndex(prev => prev + 1);
  }, [fields, historyIndex]);

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newFields = arrayMove(items, oldIndex, newIndex);

        // Atualizar sortOrder
        const updatedFields = newFields.map((field, index) => ({
          ...field,
          sortOrder: index
        }));

        // Adicionar ao histórico
        setHistory(prev => [...prev.slice(0, historyIndex + 1), updatedFields]);
        setHistoryIndex(prev => prev + 1);

        return updatedFields;
      });
    }
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFields(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setFields(history[historyIndex + 1]);
    }
  };

  // Controles de zoom
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));

  return (
    <div className="h-full flex flex-col>
      {/* Toolbar */}
      <div className="border-b p-4 bg-white>
        <div className="flex items-center justify-between>
          <div className="flex items-center gap-2>
            <Button onClick={undo} disabled={historyIndex === 0} size="sm" variant="outline>
              <Undo className="w-4 h-4" />
            </Button>
            <Button onClick={redo} disabled={historyIndex >= history.length - 1} size="sm" variant="outline>
              <Redo className="w-4 h-4" />
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <Button onClick={zoomOut} size="sm" variant="outline>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoomLevel}%</span>
            <Button onClick={zoomIn} size="sm" variant="outline>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setGridVisible(!gridVisible)} 
              size="sm" 
              variant={gridVisible ? "default" : "outline"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2>
            <Button onClick={() => onPreview({ fields })} variant="outline>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={() => onSave({ fields })}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex>
        {/* Sidebar - Palette de componentes */}
        <div className="w-80 border-r bg-gray-50 p-4>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2>
              <TabsTrigger value="design">Componentes</TabsTrigger>
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4>
              <div>
                <h3 className="font-medium mb-3">Campos Disponíveis</h3>
                <div className="grid grid-cols-2 gap-2>
                  {fieldTypes.map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <Button
                        key={fieldType.type}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-center gap-1"
                        onClick={() => addField(fieldType.type)}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{fieldType.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4>
              {selectedFieldId ? (
                <div>
                  <h3 className="font-medium mb-3">Propriedades do Campo</h3>
                  {/* Aqui virá o editor de propriedades */}
                  <p className="text-sm text-gray-600>
                    Editor de propriedades será implementado na próxima fase
                  </p>
                </div>
              ) : (
                <div className="text-center py-8>
                  <p className="text-gray-500">Selecione um campo para editar suas propriedades</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto>
          <div 
            className="p-8 min-h-full ""
            style={{ transform: ")`, transformOrigin: 'top left' }}
          >
            <Card className="max-w-4xl mx-auto min-h-[600px]>
              <CardHeader>
                <CardTitle>Preview do Template</CardTitle>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4>
                      {fields.length === 0 ? (
                        <div className="text-center py-12 text-gray-500>
                          <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Arraste componentes da barra lateral para começar</p>
                        </div>
                      ) : (
                        fields.map((field) => (
                          <DraggableField
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onSelect={setSelectedFieldId}
                            onEdit={(id) => {
                              setSelectedFieldId(id);
                              setActiveTab('properties');
                            }}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;