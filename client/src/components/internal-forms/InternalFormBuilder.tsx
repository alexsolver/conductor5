import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Field {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface InternalFormBuilderProps {
  onClose: () => void;
}

export function InternalFormBuilder({ onClose }: InternalFormBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Geral");
  const [fields, setFields] = useState<Field[]>([]);
  const [newField, setNewField] = useState<Partial<Field>>({
    type: 'text',
    required: false
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['form-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/internal-forms/categories');
      return response.json();
    }
  });

  const createFormMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('POST', '/api/internal-forms/forms', formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar formulário');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Formulário criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['internal-forms'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar formulário",
        variant: "destructive",
      });
    }
  });

  const addField = () => {
    if (!newField.name || !newField.label) {
      toast({
        title: "Erro",
        description: "Nome e rótulo do campo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const field: Field = {
      id: `field_${Date.now()}`,
      name: newField.name,
      label: newField.label,
      type: newField.type as Field['type'],
      required: newField.required || false,
      placeholder: newField.placeholder,
      options: newField.options
    };

    setFields([...fields, field]);
    setNewField({ type: 'text', required: false });
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

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
      fields: fields,
      actions: [],
      isActive: true
    };

    createFormMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="formName">Nome do Formulário</Label>
            <Input
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Solicitação de Acesso"
            />
          </div>
          <div>
            <Label htmlFor="formDescription">Descrição</Label>
            <Textarea
              id="formDescription"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descreva o propósito do formulário..."
            />
          </div>
          <div>
            <Label htmlFor="formCategory">Categoria</Label>
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campos do Formulário</CardTitle>
            <Button type="button" onClick={addField} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline">{field.type}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Campo</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="campo_nome"
                      />
                    </div>
                    <div>
                      <Label>Rótulo</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="Nome Completo"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Tipo de Campo</Label>
                    <Select
                      value={field.type}
                      onValueChange={(type) => updateField(field.id, { type: type as Field['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="textarea">Área de Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="select">Seleção</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="date">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`required_${field.id}`}
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`required_${field.id}`}>Obrigatório</Label>
                  </div>

                  {(field.type === 'select') && (
                    <div className="mt-4">
                      <Label>Opções (separadas por vírgula)</Label>
                      <Input
                        value={(field.options || []).join(',')}
                        onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt !== '') })}
                        placeholder="Opção 1, Opção 2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações do Formulário</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            As ações serão executadas quando o formulário for submetido.
          </p>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={createFormMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {createFormMutation.isPending ? 'Salvando...' : 'Salvar Formulário'}
        </Button>
      </div>
    </div>
  );
}