/**
 * Form Template Selector
 * 
 * Componente para selecionar um formulário personalizado para associar a uma ação interna
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { FileText, Eye, X, Info, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InternalForm, FormField } from "@shared/schema-internal-forms";
import { DynamicFormField } from "./FormFieldComponents";

interface FormTemplateSelectorProps {
  value?: string | null;
  onChange: (formId: string | null) => void;
  actionType?: string;
  formData?: Record<string, any>;
  onFormDataChange?: (data: Record<string, any>) => void;
  ticketId?: string;
  userId?: string;
}

export function FormTemplateSelector({ 
  value, 
  onChange, 
  actionType, 
  formData = {}, 
  onFormDataChange,
  ticketId,
  userId 
}: FormTemplateSelectorProps) {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(value || null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      {/* Form Preview/Fill */}
      {showPreview && selectedForm && (
        <Card className="border-blue-500 border-2" data-testid="card-form-preview">
          <CardContent className="p-4">
            <div className="space-y-4">
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

              <div className="space-y-3">
                <h5 className="text-sm font-medium">Preencha os campos do formulário:</h5>
                {Array.isArray(selectedForm.fields) && selectedForm.fields
                  .sort((a: FormField, b: FormField) => (a.order || 0) - (b.order || 0))
                  .map((field: FormField) => (
                    <DynamicFormField
                      key={field.id}
                      field={field}
                      value={formData[field.name]}
                      onChange={(value) => {
                        if (onFormDataChange) {
                          onFormDataChange({
                            ...formData,
                            [field.name]: value
                          });
                        }
                      }}
                    />
                  ))}
              </div>

              {ticketId && userId && (
                <>
                  <Separator className="my-3" />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await apiRequest('POST', '/api/internal-forms/submissions', {
                            form_id: selectedFormId,
                            submitted_by: userId,
                            form_data: formData,
                            ticket_id: ticketId
                          });

                          if (response.ok) {
                            toast({
                              title: "Sucesso",
                              description: "Formulário submetido com sucesso!",
                            });
                            queryClient.invalidateQueries({ queryKey: ['internal-form-submissions'] });
                            if (onFormDataChange) {
                              onFormDataChange({});
                            }
                          } else {
                            throw new Error('Failed to submit form');
                          }
                        } catch (error) {
                          console.error('Error submitting form:', error);
                          toast({
                            title: "Erro",
                            description: "Falha ao submeter o formulário",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submeter Formulário
                    </Button>
                  </div>
                </>
              )}
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
