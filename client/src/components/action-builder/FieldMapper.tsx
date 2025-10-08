import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Menu, 
  Zap,
  Database,
  Search
} from 'lucide-react';

// ========================================
// TYPES
// ========================================

export interface ModuleField {
  id: string;
  key: string;
  label: string;
  type: string;
  description?: string;
  required?: boolean;
  icon?: string;
}

export interface MappedField extends ModuleField {
  collectionStrategy: 'conversational' | 'interactive' | 'hybrid';
  widgetType?: string;
  isRequired: boolean;
  displayOrder: number;
}

interface FieldMapperProps {
  moduleId: string;
  selectedFields: MappedField[];
  onFieldsChange: (fields: MappedField[]) => void;
}

// ========================================
// MODULE FIELDS DATA
// ========================================

const MODULE_FIELDS: Record<string, ModuleField[]> = {
  tickets: [
    { id: 'title', key: 'title', label: 'Título', type: 'string', icon: '📝', required: true },
    { id: 'description', key: 'description', label: 'Descrição', type: 'text', icon: '📄' },
    { id: 'priority', key: 'priority', label: 'Prioridade', type: 'select', icon: '🔥', required: true },
    { id: 'category', key: 'category', label: 'Categoria', type: 'select', icon: '📁' },
    { id: 'customerId', key: 'customerId', label: 'Cliente', type: 'relation', icon: '👤' },
    { id: 'assignedTo', key: 'assignedTo', label: 'Responsável', type: 'relation', icon: '👥' },
    { id: 'dueDate', key: 'dueDate', label: 'Data de Vencimento', type: 'date', icon: '📅' },
    { id: 'tags', key: 'tags', label: 'Tags', type: 'multiselect', icon: '🏷️' }
  ],
  customers: [
    { id: 'firstName', key: 'firstName', label: 'Nome', type: 'string', icon: '👤', required: true },
    { id: 'lastName', key: 'lastName', label: 'Sobrenome', type: 'string', icon: '👤' },
    { id: 'email', key: 'email', label: 'Email', type: 'email', icon: '📧', required: true },
    { id: 'phone', key: 'phone', label: 'Telefone', type: 'phone', icon: '📱' },
    { id: 'companyId', key: 'companyId', label: 'Empresa', type: 'relation', icon: '🏢' },
    { id: 'address', key: 'address', label: 'Endereço', type: 'text', icon: '📍' }
  ],
  schedules: [
    { id: 'title', key: 'title', label: 'Título', type: 'string', icon: '📝', required: true },
    { id: 'date', key: 'date', label: 'Data', type: 'date', icon: '📅', required: true },
    { id: 'time', key: 'time', label: 'Hora', type: 'time', icon: '⏰', required: true },
    { id: 'technicianId', key: 'technicianId', label: 'Técnico', type: 'relation', icon: '👷' },
    { id: 'customerId', key: 'customerId', label: 'Cliente', type: 'relation', icon: '👤' },
    { id: 'locationId', key: 'locationId', label: 'Local', type: 'relation', icon: '📍' },
    { id: 'notes', key: 'notes', label: 'Observações', type: 'text', icon: '📄' }
  ],
  projects: [
    { id: 'name', key: 'name', label: 'Nome', type: 'string', icon: '📊', required: true },
    { id: 'description', key: 'description', label: 'Descrição', type: 'text', icon: '📄' },
    { id: 'startDate', key: 'startDate', label: 'Data Início', type: 'date', icon: '📅' },
    { id: 'endDate', key: 'endDate', label: 'Data Fim', type: 'date', icon: '📅' },
    { id: 'budget', key: 'budget', label: 'Orçamento', type: 'currency', icon: '💰' },
    { id: 'status', key: 'status', label: 'Status', type: 'select', icon: '✅' }
  ]
};

// ========================================
// SORTABLE FIELD ITEM
// ========================================

function SortableFieldItem({ 
  field, 
  onRemove, 
  onUpdate 
}: { 
  field: MappedField; 
  onRemove: () => void;
  onUpdate: (updates: Partial<MappedField>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 border rounded-lg p-3 mb-2"
      data-testid={`mapped-field-${field.id}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Field Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{field.icon}</span>
            <span className="font-medium">{field.label}</span>
            {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            <Badge variant="outline" className="text-xs">{field.type}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Collection Strategy */}
            <div>
              <Label className="text-xs">Como coletar?</Label>
              <Select 
                value={field.collectionStrategy} 
                onValueChange={(value) => onUpdate({ collectionStrategy: value as any })}
              >
                <SelectTrigger className="h-8" data-testid={`select-strategy-${field.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversational">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" />
                      Conversacional
                    </div>
                  </SelectItem>
                  <SelectItem value="interactive">
                    <div className="flex items-center gap-2">
                      <Menu className="w-3 h-3" />
                      Interativo
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Híbrido
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Required Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Obrigatório</Label>
              <Switch
                checked={field.isRequired}
                onCheckedChange={(checked) => onUpdate({ isRequired: checked })}
                data-testid={`switch-required-${field.id}`}
              />
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
          data-testid={`button-remove-${field.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ========================================
// DRAGGABLE FIELD
// ========================================

function DraggableField({ field }: { field: ModuleField }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `available-${field.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-accent hover:bg-accent/80 border rounded-lg p-2 cursor-grab active:cursor-grabbing transition-colors"
      data-testid={`available-field-${field.id}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{field.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{field.label}</div>
          <div className="text-xs text-muted-foreground">{field.type}</div>
        </div>
        {field.required && <Badge variant="outline" className="text-xs shrink-0">*</Badge>}
      </div>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function FieldMapper({ moduleId, selectedFields, onFieldsChange }: FieldMapperProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const availableFields = MODULE_FIELDS[moduleId] || [];
  const filteredFields = availableFields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const alreadySelectedIds = new Set(selectedFields.map(f => f.id));
  const fieldsToShow = filteredFields.filter(f => !alreadySelectedIds.has(f.id));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Check if dragging from available to mapped
    if (activeIdStr.startsWith('available-')) {
      const fieldId = activeIdStr.replace('available-', '');
      const field = availableFields.find(f => f.id === fieldId);
      
      if (field && !alreadySelectedIds.has(field.id)) {
        const newField: MappedField = {
          ...field,
          collectionStrategy: 'hybrid',
          isRequired: field.required || false,
          displayOrder: selectedFields.length
        };
        onFieldsChange([...selectedFields, newField]);
      }
    }
    // Check if reordering within mapped fields
    else if (!activeIdStr.startsWith('available-') && !overIdStr.startsWith('available-')) {
      const oldIndex = selectedFields.findIndex(f => f.id === activeIdStr);
      const newIndex = selectedFields.findIndex(f => f.id === overIdStr);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(selectedFields, oldIndex, newIndex).map((f, idx) => ({
          ...f,
          displayOrder: idx
        }));
        onFieldsChange(reordered);
      }
    }

    setActiveId(null);
  };

  const handleRemoveField = (fieldId: string) => {
    onFieldsChange(selectedFields.filter(f => f.id !== fieldId));
  };

  const handleUpdateField = (fieldId: string, updates: Partial<MappedField>) => {
    onFieldsChange(
      selectedFields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    );
  };

  if (!moduleId) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-12">
            <Database className="mx-auto w-12 h-12 mb-3 opacity-50" />
            <p data-testid="text-no-module">Selecione um módulo primeiro</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 gap-4" data-testid="field-mapper">
        {/* Available Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base" data-testid="text-available-fields-title">
              Campos Disponíveis
            </CardTitle>
            <CardDescription className="text-xs" data-testid="text-available-fields-desc">
              Arraste os campos para o mapeamento
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
                data-testid="input-search-fields"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <SortableContext
                items={fieldsToShow.map(f => `available-${f.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {fieldsToShow.map(field => (
                    <DraggableField key={field.id} field={field} />
                  ))}
                  {fieldsToShow.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8" data-testid="text-no-fields">
                      {searchTerm ? 'Nenhum campo encontrado' : 'Todos os campos já foram adicionados'}
                    </div>
                  )}
                </div>
              </SortableContext>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Mapped Fields */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base" data-testid="text-mapped-fields-title">
                  Campos Mapeados ({selectedFields.length})
                </CardTitle>
                <CardDescription className="text-xs" data-testid="text-mapped-fields-desc">
                  Configure como cada campo será coletado
                </CardDescription>
              </div>
              {selectedFields.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFieldsChange([])}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-clear-all"
                >
                  Limpar Tudo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <SortableContext
                items={selectedFields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {selectedFields.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-12" data-testid="text-no-mapped">
                      <Plus className="mx-auto w-12 h-12 mb-3 opacity-50" />
                      <p>Arraste campos aqui para começar</p>
                    </div>
                  ) : (
                    selectedFields.map(field => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        onRemove={() => handleRemoveField(field.id)}
                        onUpdate={(updates) => handleUpdateField(field.id, updates)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && activeId.startsWith('available-') && (
          <div className="bg-accent border rounded-lg p-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-base">
                {availableFields.find(f => f.id === activeId.replace('available-', ''))?.icon}
              </span>
              <span className="font-medium">
                {availableFields.find(f => f.id === activeId.replace('available-', ''))?.label}
              </span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
