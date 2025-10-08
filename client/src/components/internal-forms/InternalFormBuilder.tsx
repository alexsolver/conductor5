/**
 * Internal Form Builder - v2.0
 * 
 * Constructor de formulários com drag & drop, preview e validações condicionais
 * @version 2.0.0
 */

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  X,
  Save,
  GripVertical,
  Eye,
  Settings2,
  FileText,
  Hash,
  Mail,
  Phone,
  Link as LinkIcon,
  Calendar,
  Clock,
  Check,
  List,
  Circle,
  Upload,
  DollarSign,
  Palette,
  Star,
  PenTool,
  Users,
  Layers,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DynamicFormField } from "./FormFieldComponents";
import type { FormField, FormFieldType } from "@shared/schema-internal-forms";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InternalFormBuilderProps {
  formId?: string;
  onClose: () => void;
}

// ========================================
// FIELD TYPE DEFINITIONS
// ========================================
const FIELD_TYPES: Array<{ value: FormFieldType; label: string; icon: any }> = [
  { value: 'text', label: 'Texto', icon: FileText },
  { value: 'textarea', label: 'Área de Texto', icon: FileText },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'url', label: 'URL', icon: LinkIcon },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'datetime', label: 'Data e Hora', icon: Clock },
  { value: 'select', label: 'Seleção', icon: List },
  { value: 'multiselect', label: 'Seleção Múltipla', icon: Layers },
  { value: 'radio', label: 'Radio', icon: Circle },
  { value: 'checkbox', label: 'Checkbox', icon: Check },
  { value: 'file', label: 'Arquivo', icon: Upload },
  { value: 'currency', label: 'Moeda', icon: DollarSign },
  { value: 'color', label: 'Cor', icon: Palette },
  { value: 'rating', label: 'Avaliação', icon: Star },
  { value: 'signature', label: 'Assinatura', icon: PenTool },
  { value: 'user_select', label: 'Seleção de Usuário', icon: Users },
];

// ========================================
// SORTABLE FIELD ITEM
// ========================================
function SortableFieldItem({ field, onRemove, onEdit }: { field: FormField; onRemove: () => void; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldTypeInfo = FIELD_TYPES.find((t) => t.value === field.type);
  const Icon = fieldTypeInfo?.icon || FileText;

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <Icon className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{field.label}</span>
              {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            </div>
            <span className="text-sm text-gray-500">{field.name} • {fieldTypeInfo?.label}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onEdit} data-testid={`button-edit-field-${field.name}`}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} data-testid={`button-remove-field-${field.name}`}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
      {field.helpText && (
        <p className="text-sm text-gray-500 ml-8">{field.helpText}</p>
      )}
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================
export function InternalFormBuilder({ formId, onClose }: InternalFormBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"build" | "preview">("build");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Geral");
  const [formIcon, setFormIcon] = useState("FileText");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  // New field template
  const [newFieldData, setNewFieldData] = useState<Partial<FormField>>({
    type: 'text',
    required: false,
    order: 0,
  });

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['form-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/internal-forms/categories');
      return response.json();
    }
  });

  // Fetch existing form if editing
  const { data: existingForm } = useQuery({
    queryKey: ['internal-form', formId],
    queryFn: async () => {
      if (!formId) return null;
      const response = await apiRequest('GET', `/api/internal-forms/forms/${formId}`);
      return response.json();
    },
    enabled: !!formId,
  });

  // Load existing form data
  useMemo(() => {
    if (existingForm) {
      setFormName(existingForm.name || "");
      setFormDescription(existingForm.description || "");
      setFormCategory(existingForm.category || "Geral");
      setFormIcon(existingForm.icon || "FileText");
      setFormColor(existingForm.color || "#3B82F6");
      setIsActive(existingForm.isActive ?? true);
      setFields(Array.isArray(existingForm.fields) ? existingForm.fields : []);
    }
  }, [existingForm]);

  // Create/Update form mutation
  const saveFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = formId ? `/api/internal-forms/forms/${formId}` : '/api/internal-forms/forms';
      const method = formId ? 'PUT' : 'POST';
      const response = await apiRequest(method, url, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar formulário');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: formId ? "Formulário atualizado!" : "Formulário criado!",
      });
      queryClient.invalidateQueries({ queryKey: ['internal-forms'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar formulário",
        variant: "destructive",
      });
    }
  });

  // Add field
  const addField = () => {
    if (!newFieldData.name || !newFieldData.label) {
      toast({
        title: "Erro",
        description: "Nome e rótulo do campo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const field: FormField = {
      id: `field_${Date.now()}`,
      name: newFieldData.name!,
      label: newFieldData.label!,
      type: newFieldData.type as FormFieldType,
      required: newFieldData.required || false,
      placeholder: newFieldData.placeholder,
      helpText: newFieldData.helpText,
      defaultValue: newFieldData.defaultValue,
      order: fields.length,
      ...(newFieldData.type === 'select' || newFieldData.type === 'multiselect' || newFieldData.type === 'radio' 
        ? { options: (newFieldData as any).options || [] } 
        : {}),
    } as FormField;

    setFields([...fields, field]);
    setNewFieldData({ type: 'text', required: false, order: 0 });
    setShowFieldEditor(false);
    toast({
      title: "Campo adicionado",
      description: `Campo "${field.label}" adicionado com sucesso`,
    });
  };

  // Update field
  const updateField = (updatedField: FormField) => {
    setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
    setEditingField(null);
    setShowFieldEditor(false);
    toast({
      title: "Campo atualizado",
      description: `Campo "${updatedField.label}" foi atualizado`,
    });
  };

  // Remove field
  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    toast({
      title: "Campo removido",
      description: "Campo foi removido do formulário",
    });
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  // Save form
  const handleSave = () => {
    if (!formName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do formulário é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um campo ao formulário",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      name: formName.trim(),
      description: formDescription.trim(),
      category: formCategory,
      icon: formIcon,
      color: formColor,
      fields: fields,
      conditionalLogic: {},
      isActive,
      actions: [],
    };

    saveFormMutation.mutate(formData);
  };

  // Preview form data for testing
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "build" | "preview")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="build" data-testid="tab-build">
            <Settings2 className="h-4 w-4 mr-2" />
            Construtor
          </TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* BUILD TAB */}
        <TabsContent value="build" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="formName">Nome do Formulário</Label>
                  <Input
                    id="formName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Solicitação de Acesso"
                    data-testid="input-form-name"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="formDescription">Descrição</Label>
                  <Textarea
                    id="formDescription"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descreva o propósito do formulário..."
                    data-testid="textarea-form-description"
                  />
                </div>
                <div>
                  <Label htmlFor="formCategory">Categoria</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger data-testid="select-form-category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(categories) ? categories : []).map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="formColor">Cor</Label>
                  <Input
                    id="formColor"
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-10"
                    data-testid="input-form-color"
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive">Formulário ativo</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campos do Formulário ({fields.length})</CardTitle>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingField(null);
                    setNewFieldData({ type: 'text', required: false, order: 0 });
                    setShowFieldEditor(!showFieldEditor);
                  }}
                  size="sm"
                  data-testid="button-add-field"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showFieldEditor && (
                <Card className="mb-4 border-2 border-blue-500">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Campo</Label>
                        <Input
                          value={newFieldData.name || ""}
                          onChange={(e) => setNewFieldData({ ...newFieldData, name: e.target.value })}
                          placeholder="campo_nome"
                          data-testid="input-field-name"
                        />
                      </div>
                      <div>
                        <Label>Rótulo</Label>
                        <Input
                          value={newFieldData.label || ""}
                          onChange={(e) => setNewFieldData({ ...newFieldData, label: e.target.value })}
                          placeholder="Nome Completo"
                          data-testid="input-field-label"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Tipo de Campo</Label>
                        <Select
                          value={newFieldData.type}
                          onValueChange={(type) => setNewFieldData({ ...newFieldData, type: type as FormFieldType })}
                        >
                          <SelectTrigger data-testid="select-field-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((fieldType) => {
                              const Icon = fieldType.icon;
                              return (
                                <SelectItem key={fieldType.value} value={fieldType.value}>
                                  <div className="flex items-center">
                                    <Icon className="h-4 w-4 mr-2" />
                                    {fieldType.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={newFieldData.placeholder || ""}
                          onChange={(e) => setNewFieldData({ ...newFieldData, placeholder: e.target.value })}
                          placeholder="Texto de exemplo..."
                          data-testid="input-field-placeholder"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Texto de Ajuda</Label>
                        <Input
                          value={newFieldData.helpText || ""}
                          onChange={(e) => setNewFieldData({ ...newFieldData, helpText: e.target.value })}
                          placeholder="Informações adicionais..."
                          data-testid="input-field-help"
                        />
                      </div>
                      <div className="col-span-2 flex items-center space-x-2">
                        <Switch
                          checked={newFieldData.required || false}
                          onCheckedChange={(checked) => setNewFieldData({ ...newFieldData, required: checked })}
                          data-testid="switch-field-required"
                        />
                        <Label>Campo obrigatório</Label>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowFieldEditor(false);
                          setNewFieldData({ type: 'text', required: false, order: 0 });
                        }}
                        data-testid="button-cancel-field"
                      >
                        Cancelar
                      </Button>
                      <Button type="button" onClick={addField} data-testid="button-save-field">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {fields.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          onRemove={() => removeField(field.id)}
                          onEdit={() => {
                            setEditingField(field);
                            setNewFieldData(field);
                            setShowFieldEditor(true);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIEW TAB */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={{ color: formColor }}>{formName || "Formulário sem título"}</CardTitle>
              {formDescription && (
                <p className="text-sm text-muted-foreground">{formDescription}</p>
              )}
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Adicione campos ao formulário para visualizar o preview
                </p>
              ) : (
                <div className="space-y-6">
                  {fields.map((field) => (
                    <DynamicFormField
                      key={field.id}
                      field={field}
                      value={previewData[field.name]}
                      onChange={(value) => setPreviewData({ ...previewData, [field.name]: value })}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={saveFormMutation.isPending}
          data-testid="button-save-form"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveFormMutation.isPending ? 'Salvando...' : formId ? 'Atualizar Formulário' : 'Salvar Formulário'}
        </Button>
      </div>
    </div>
  );
}
