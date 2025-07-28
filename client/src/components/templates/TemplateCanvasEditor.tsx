
import React, { useState, useRef, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  Eye, 
  Trash2, 
  GripVertical, 
  Plus,
  Type,
  Calendar,
  Hash,
  Tag,
  User,
  Building2,
  MapPin,
  Star,
  AlertTriangle,
  Clock,
  CheckSquare,
  FileText,
  Link,
  Image,
  List
} from 'lucide-react';

// Tipos de campos disponíveis
const FIELD_TYPES = {
  text: { icon: Type, label: 'Texto' },
  textarea: { icon: FileText, label: 'Área de Texto' },
  select: { icon: List, label: 'Seleção' },
  date: { icon: Calendar, label: 'Data' },
  number: { icon: Hash, label: 'Número' },
  tag: { icon: Tag, label: 'Tag' },
  user: { icon: User, label: 'Usuário' },
  company: { icon: Building2, label: 'Empresa' },
  location: { icon: MapPin, label: 'Localização' },
  priority: { icon: Star, label: 'Prioridade' },
  status: { icon: AlertTriangle, label: 'Status' },
  urgency: { icon: Clock, label: 'Urgência' },
  checkbox: { icon: CheckSquare, label: 'Checkbox' },
  link: { icon: Link, label: 'Link' },
  image: { icon: Image, label: 'Imagem' }
};

// Campos padrão do sistema de tickets
const DEFAULT_FIELDS = [
  { id: 'subject', type: 'text', label: 'Assunto', required: true, section: 'basic' },
  { id: 'description', type: 'textarea', label: 'Descrição', required: false, section: 'basic' },
  { id: 'priority', type: 'select', label: 'Prioridade', required: true, section: 'classification' },
  { id: 'status', type: 'select', label: 'Status', required: true, section: 'classification' },
  { id: 'category', type: 'select', label: 'Categoria', required: false, section: 'classification' },
  { id: 'subcategory', type: 'select', label: 'Subcategoria', required: false, section: 'classification' },
  { id: 'callerId', type: 'user', label: 'Solicitante', required: true, section: 'people' },
  { id: 'beneficiaryId', type: 'user', label: 'Beneficiário', required: false, section: 'people' },
  { id: 'assignedToId', type: 'user', label: 'Atribuído a', required: false, section: 'assignment' },
  { id: 'customerCompanyId', type: 'company', label: 'Empresa Cliente', required: false, section: 'assignment' },
  { id: 'location', type: 'location', label: 'Localização', required: false, section: 'assignment' },
  { id: 'environment', type: 'select', label: 'Ambiente', required: false, section: 'template' },
  { id: 'templateName', type: 'select', label: 'Template', required: false, section: 'template' },
  { id: 'urgency', type: 'select', label: 'Urgência', required: false, section: 'classification' },
  { id: 'impact', type: 'select', label: 'Impacto', required: false, section: 'classification' },
  { id: 'businessImpact', type: 'text', label: 'Impacto no Negócio', required: false, section: 'details' },
  { id: 'symptoms', type: 'textarea', label: 'Sintomas', required: false, section: 'details' },
  { id: 'workaround', type: 'textarea', label: 'Solução Temporária', required: false, section: 'details' },
  { id: 'tags', type: 'tag', label: 'Tags', required: false, section: 'details' }
];

interface TemplateField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  section: string;
  position?: { x: number; y: number };
  width?: string;
  height?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface TemplateCanvasEditorProps {
  onSave: (template: any) => void;
  onPreview: (template: any) => void;
  initialTemplate?: any;
}

// Componente para campo arrastável da paleta
const DraggableField = ({ field }: { field: TemplateField }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'field',
    item: { field },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const FieldIcon = FIELD_TYPES[field.type as keyof typeof FIELD_TYPES]?.icon || Type;

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <FieldIcon className="w-4 h-4 text-gray-500" />
      <div className="flex-1">
        <div className="text-sm font-medium">{field.label}</div>
        <div className="text-xs text-gray-500">{FIELD_TYPES[field.type as keyof typeof FIELD_TYPES]?.label}</div>
      </div>
      {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
    </div>
  );
};

// Componente para campo colocado no canvas
const DroppedField = ({ 
  field, 
  onRemove, 
  onEdit 
}: { 
  field: TemplateField; 
  onRemove: () => void; 
  onEdit: () => void; 
}) => {
  const FieldIcon = FIELD_TYPES[field.type as keyof typeof FIELD_TYPES]?.icon || Type;

  const renderFieldPreview = () => {
    switch (field.type) {
      case 'text':
        return <Input placeholder={field.placeholder || field.label} disabled />;
      case 'textarea':
        return <Textarea placeholder={field.placeholder || field.label} rows={3} disabled />;
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={`Selecionar ${field.label}`} />
            </SelectTrigger>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input type="checkbox" disabled />
            <label className="text-sm">{field.label}</label>
          </div>
        );
      default:
        return <Input placeholder={field.placeholder || field.label} disabled />;
    }
  };

  return (
    <div className="group relative border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      {/* Cabeçalho do campo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          <FieldIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{field.label}</span>
          {field.required && <Badge variant="destructive" className="text-xs">*</Badge>}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Type className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview do campo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderFieldPreview()}
      </div>
    </div>
  );
};

// Área de drop das abas
const TabDropZone = ({ 
  tabId, 
  fields, 
  onDrop, 
  onRemoveField, 
  onEditField 
}: { 
  tabId: string; 
  fields: TemplateField[]; 
  onDrop: (field: TemplateField, tabId: string) => void;
  onRemoveField: (fieldId: string) => void;
  onEditField: (field: TemplateField) => void;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'field',
    drop: (item: { field: TemplateField }) => {
      onDrop(item.field, tabId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Plus className="w-8 h-8 mb-2" />
          <p className="text-sm">Arraste campos aqui para adicionar à aba {tabId}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <DroppedField
              key={field.id}
              field={field}
              onRemove={() => onRemoveField(field.id)}
              onEdit={() => onEditField(field)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TemplateCanvasEditor({ 
  onSave, 
  onPreview, 
  initialTemplate 
}: TemplateCanvasEditorProps) {
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [templateDescription, setTemplateDescription] = useState(initialTemplate?.description || '');
  const [templateCategory, setTemplateCategory] = useState(initialTemplate?.category || '');
  
  // Campos organizados por aba
  const [fieldsByTab, setFieldsByTab] = useState<Record<string, TemplateField[]>>({
    basic: [],
    template: [],
    assignment: [],
    classification: [],
    details: [],
    people: []
  });

  const [availableFields, setAvailableFields] = useState<TemplateField[]>(DEFAULT_FIELDS);

  // Adicionar campo à aba
  const handleFieldDrop = useCallback((field: TemplateField, tabId: string) => {
    const newField = {
      ...field,
      id: `${field.id}_${Date.now()}` // ID único para cada instância
    };

    setFieldsByTab(prev => ({
      ...prev,
      [tabId]: [...prev[tabId], newField]
    }));
  }, []);

  // Remover campo da aba
  const handleRemoveField = useCallback((fieldId: string) => {
    setFieldsByTab(prev => {
      const newFieldsByTab = { ...prev };
      Object.keys(newFieldsByTab).forEach(tabId => {
        newFieldsByTab[tabId] = newFieldsByTab[tabId].filter(f => f.id !== fieldId);
      });
      return newFieldsByTab;
    });
  }, []);

  // Editar campo
  const handleEditField = useCallback((field: TemplateField) => {
    // TODO: Implementar modal de edição de campo
    console.log('Editar campo:', field);
  }, []);

  // Salvar template
  const handleSave = () => {
    const template = {
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      fields: fieldsByTab,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    onSave(template);
  };

  // Preview do template
  const handlePreview = () => {
    const template = {
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      fields: fieldsByTab
    };
    onPreview(template);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex bg-gray-100">
        {/* Sidebar com paleta de campos */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Paleta de Campos</h2>
            
            {/* Informações do template */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Template
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nome do template"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <Textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Descrição do template"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <Input
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="Categoria do template"
                />
              </div>
            </div>

            <Separator className="my-4" />
          </div>

          {/* Lista de campos disponíveis */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Campos Disponíveis</h3>
              {availableFields.map((field) => (
                <DraggableField key={field.id} field={field} />
              ))}
            </div>
          </ScrollArea>

          {/* Ações */}
          <div className="p-6 border-t border-gray-200 space-y-2">
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Template
            </Button>
            <Button onClick={handlePreview} variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
          </div>
        </div>

        {/* Canvas principal */}
        <div className="flex-1 flex flex-col">
          {/* Header do canvas */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {templateName || 'Novo Template de Ticket'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {templateDescription || 'Configure os campos do seu template arrastando-os para as abas correspondentes'}
                </p>
              </div>
            </div>
          </div>

          {/* Área das abas */}
          <div className="flex-1 p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Configuração do Template</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <Tabs defaultValue="basic" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="template">Template/Ambiente</TabsTrigger>
                    <TabsTrigger value="assignment">Atribuição</TabsTrigger>
                    <TabsTrigger value="classification">Classificação</TabsTrigger>
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="people">Pessoas</TabsTrigger>
                  </TabsList>

                  {Object.keys(fieldsByTab).map(tabId => (
                    <TabsContent key={tabId} value={tabId} className="flex-1">
                      <TabDropZone
                        tabId={tabId}
                        fields={fieldsByTab[tabId]}
                        onDrop={handleFieldDrop}
                        onRemoveField={handleRemoveField}
                        onEditField={handleEditField}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
