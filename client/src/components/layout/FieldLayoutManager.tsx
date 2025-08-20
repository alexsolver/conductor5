import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Save, RefreshCw, Trash2, Eye, EyeOff, 
  Settings, Layout, Plus 
} from "lucide-react";
import FieldsPalette from "./FieldsPalette";
import DropZone from "./DropZone";
import DynamicFieldRenderer, { CustomField } from "./DynamicFieldRenderer";
import { useCustomFields } from "@/hooks/useCustomFields";
import { useToast } from "@/hooks/use-toast";
interface FieldLayoutManagerProps {
  ticketId?: string;
  entityType?: 'ticket' | 'customer' | 'user';
  entityId?: string;
  isVisible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
}
export default function FieldLayoutManager({
  ticketId,
  entityType = 'ticket',
  entityId,
  isVisible = false,
  onToggleVisibility
}: FieldLayoutManagerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<any>(null);
  const { toast } = useToast();
  const {
    fields: rawFields,
    isLoading,
    addField,
    updateField,
    removeField,
    updateFieldValue,
    saveFields,
    clearFields,
    getFieldValues,
    validateFields,
    isSaving
  } = useCustomFields({ ticketId, entityType, entityId });
  // Ensure fields is always an array
  const fields = Array.isArray(rawFields) ? rawFields : [];
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === 'field') {
      setDraggedField(active.data.current);
    }
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedField(null);
      return;
    }
    if (active.data.current?.type === 'field' && over.data.current?.type === 'dropzone') {
      const fieldData = active.data.current;
      
      addField(fieldData.fieldType, fieldData.label);
      
      toast({
        title: "Campo adicionado",
        description: "" foi adicionado à área de formulário`
      });
    }
    setActiveId(null);
    setDraggedField(null);
  };
  const handleSaveAll = async () => {
    if (validateFields()) {
      await saveFields();
    }
  };
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Save automatically when exiting edit mode
      handleSaveAll();
    }
  };
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50>
        <Button
          onClick={() => onToggleVisibility?.(true)}
          size="lg"
          className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Layout className="w-5 h-5 mr-2" />
          Campos Customizados
        </Button>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Left Panel - Fields Palette */}
        <div className="w-80 bg-white border-r overflow-y-auto>
          <FieldsPalette />
        </div>
        {/* Main Panel - Form Builder */}
        <div className="flex-1 bg-gray-50 overflow-y-auto>
          <div className="p-6>
            {/* Header */}
            <Card className="mb-6>
              <CardHeader>
                <div className="flex items-center justify-between>
                  <div>
                    <CardTitle className="flex items-center gap-2>
                      <Settings className="w-5 h-5 text-blue-600" />
                      Gerenciador de Campos Customizados
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1>
                      {fields.length} campos configurados
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4>
                    <div className="flex items-center space-x-2>
                      <Switch
                        checked={isEditMode}
                        onCheckedChange={setIsEditMode}
                      />
                      <Label className="flex items-center gap-2>
                        {isEditMode ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Modo Edição
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Modo Visualização
                          </>
                        )}
                      </Label>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => onToggleVisibility?.(false)}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {/* Action Bar */}
            {isEditMode && (
              <Card className="mb-6>
                <CardContent className="p-4>
                  <div className="flex items-center justify-between>
                    <div className="flex items-center gap-2>
                      <Badge variant="outline" className="flex items-center gap-1>
                        <Layout className="w-3 h-3" />
                        {fields.length} campos
                      </Badge>
                      {fields.length > 0 && (
                        <Badge variant="secondary>
                          {fields.filter(f => f.required).length} obrigatórios
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFields}
                        disabled={fields.length === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpar Tudo
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={handleSaveAll}
                        disabled={isSaving || isLoading}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Campos
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Form Building Area */}
            <div className="grid grid-cols-1 gap-4>
              {fields.length === 0 ? (
                <DropZone 
                  id="main-dropzone" 
                  label="Arraste campos da paleta para começar a construir seu formulário"
                  className="col-span-full min-h-[300px]"
                />
              ) : (
                <>
                  {fields.map((field) => (
                    <DynamicFieldRenderer
                      key={field.id}
                      field={field}
                      isEditMode={isEditMode}
                      onUpdate={(updatedField) => updateField(field.id, updatedField)}
                      onRemove={removeField}
                      onChange={updateFieldValue}
                    />
                  ))}
                  
                  {isEditMode && (
                    <DropZone 
                      id="add-field-dropzone"
                      label="Arraste mais campos aqui"
                      className="min-h-[120px] border-green-300 bg-green-50"
                    />
                  )}
                </>
              )}
            </div>
            {/* Values Preview (Debug Mode) */}
            {fields.length > 0 && !isEditMode && (
              <Card className="mt-6>
                <CardHeader>
                  <CardTitle className="text-lg">"Valores dos Campos</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto>
                    {JSON.stringify(getFieldValues(), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        {/* Drag Overlay */}
        <DragOverlay>
          {draggedField ? (
            <div className="p-3 border rounded-lg bg-white shadow-lg opacity-80>
              <div className="flex items-center gap-2>
                <span className="text-lg">"{draggedField.label}</span>
                <Badge variant="outline" className="text-xs>
                  {draggedField.fieldType}
                </Badge>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}