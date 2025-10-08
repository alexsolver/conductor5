/**
 * Form Template Selector
 * 
 * Componente para selecionar um formulário personalizado para associar a uma ação interna
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Eye, X, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { InternalForm } from "@shared/schema-internal-forms";

interface FormTemplateSelectorProps {
  value?: string | null;
  onChange: (formId: string | null) => void;
  actionType?: string;
}

export function FormTemplateSelector({ value, onChange, actionType }: FormTemplateSelectorProps) {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(value || null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all forms
  const { data: forms = [], isLoading } = useQuery<InternalForm[]>({
    queryKey: ['internal-forms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/internal-forms/forms');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch selected form details
  const { data: selectedForm } = useQuery<InternalForm>({
    queryKey: ['internal-form', selectedFormId],
    queryFn: async () => {
      if (!selectedFormId) return null;
      const response = await apiRequest('GET', `/api/internal-forms/forms/${selectedFormId}`);
      return response.json();
    },
    enabled: !!selectedFormId && showPreview,
  });

  useEffect(() => {
    if (value !== selectedFormId) {
      setSelectedFormId(value || null);
    }
  }, [value]);

  const handleSelectForm = (formId: string) => {
    const newValue = formId === 'none' ? null : formId;
    setSelectedFormId(newValue);
    onChange(newValue);
  };

  const handleClearForm = () => {
    setSelectedFormId(null);
    onChange(null);
    setShowPreview(false);
  };

  // Filter active forms
  const activeForms = forms.filter((form: InternalForm) => form.isActive);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-template">
          <FileText className="inline h-4 w-4 mr-2" />
          Formulário Personalizado (Opcional)
        </Label>
        <div className="flex gap-2">
          <Select
            value={selectedFormId || 'none'}
            onValueChange={handleSelectForm}
            disabled={isLoading}
          >
            <SelectTrigger id="form-template" className="flex-1" data-testid="select-form-template">
              <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione um formulário"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-gray-500">Nenhum formulário</span>
              </SelectItem>
              {activeForms.length === 0 && !isLoading && (
                <SelectItem value="_empty" disabled>
                  <span className="text-gray-400">Nenhum formulário disponível</span>
                </SelectItem>
              )}
              {activeForms.map((form: InternalForm) => (
                <SelectItem key={form.id} value={form.id}>
                  <div className="flex items-center gap-2">
                    <span>{form.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {form.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedFormId && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPreview(!showPreview)}
                title="Visualizar formulário"
                data-testid="button-preview-form"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleClearForm}
                title="Remover formulário"
                data-testid="button-clear-form"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Ao selecionar um formulário, o agente deverá preenchê-lo ao executar esta ação interna.
            Isso permite criar processos operacionais estruturados.
          </span>
        </p>
      </div>

      {/* Form Preview */}
      {showPreview && selectedForm && (
        <Card className="border-blue-500 border-2" data-testid="card-form-preview">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedForm.color || '#3B82F6' }}
                  />
                  <h4 className="font-semibold">{selectedForm.name}</h4>
                  <Badge variant="secondary">{selectedForm.category}</Badge>
                </div>
                <Badge variant="outline">
                  {Array.isArray(selectedForm.fields) ? selectedForm.fields.length : 0} campos
                </Badge>
              </div>
              
              {selectedForm.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedForm.description}
                </p>
              )}

              <Separator className="my-3" />

              <div className="space-y-2">
                <h5 className="text-sm font-medium">Campos do formulário:</h5>
                <div className="grid gap-2">
                  {Array.isArray(selectedForm.fields) && selectedForm.fields.map((field: any, index: number) => (
                    <div
                      key={field.id || index}
                      className="flex items-center justify-between p-2 bg-accent rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Separator component for preview
function Separator({ className }: { className?: string }) {
  return <div className={`border-b ${className}`} />;
}
