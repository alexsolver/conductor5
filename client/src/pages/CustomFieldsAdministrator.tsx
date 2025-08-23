import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Package,
  Save,
  X,
  Home,
  ChevronRight,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react';

type ModuleType = 'customers' | 'tickets' | 'beneficiaries' | 'materials' | 'services' | 'locations';
type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'textarea' | 'file' | 'email' | 'phone' | 'url';

interface CustomFieldMetadata {
  id: string;
  moduleType: ModuleType;
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  isRequired: boolean;
  validationRules?: Record<string, any>;
  fieldOptions?: string[];
  placeholder?: string;
  defaultValue?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  helpText?: string;
}

interface CreateFieldFormData {
  moduleType: ModuleType;
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  isRequired: boolean;
  validationRules?: Record<string, any>;
  fieldOptions?: string[];
  placeholder?: string;
  defaultValue?: string;
  displayOrder?: number;
  helpText?: string;
}

interface EditFieldFormData extends CreateFieldFormData {
  fieldId: string;
}

interface CreateFieldFormProps {
  moduleType: ModuleType;
  onSubmit: (data: CreateFieldFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const MODULE_TYPES = [
  { value: 'customers', label: 'Clientes' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'beneficiaries', label: 'Beneficiários' },
  { value: 'materials', label: 'Materiais' },
  { value: 'services', label: 'Serviços' },
  { value: 'locations', label: 'Locais' }
] as const;

const FIELD_TYPE_CONFIG = {
  text: { label: 'Texto', description: 'Campo de texto simples' },
  number: { label: 'Número', description: 'Campo numérico' },
  select: { label: 'Seleção', description: 'Lista de opções (única seleção)' },
  multiselect: { label: 'Múltipla Seleção', description: 'Lista de opções (múltipla seleção)' },
  date: { label: 'Data', description: 'Seletor de data' },
  boolean: { label: 'Verdadeiro/Falso', description: 'Campo checkbox' },
  textarea: { label: 'Texto Longo', description: 'Campo de texto multilinha' },
  file: { label: 'Arquivo', description: 'Upload de arquivo' },
  email: { label: 'Email', description: 'Campo de email com validação' },
  phone: { label: 'Telefone', description: 'Campo de telefone com validação' },
  url: { label: 'URL', description: 'Campo de URL com validação' }
} as const;

const CreateFieldForm: React.FC<CreateFieldFormProps> = ({ moduleType, onSubmit, isLoading, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateFieldFormData>({
    moduleType,
    fieldName: '',
    fieldType: 'text',
    fieldLabel: '',
    isRequired: false,
    validationRules: {},
    fieldOptions: [],
    placeholder: '',
    defaultValue: '',
    displayOrder: 0,
    helpText: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fieldName.trim()) {
      newErrors.fieldName = 'Nome do campo é obrigatório';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.fieldName)) {
      newErrors.fieldName = 'Nome deve ser um identificador válido (letras, números e _)';
    }

    if (!formData.fieldLabel.trim()) {
      newErrors.fieldLabel = 'Rótulo do campo é obrigatório';
    }

    if ((formData.fieldType === 'select' || formData.fieldType === 'multiselect') &&
        (!formData.fieldOptions || formData.fieldOptions.length === 0)) {
      newErrors.fieldOptions = 'Campos de seleção devem ter ao menos uma opção';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      fieldOptions: [...(prev.fieldOptions || []), '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fieldOptions: (prev.fieldOptions || []).filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      fieldOptions: (prev.fieldOptions || []).map((opt, i) => i === index ? value : opt)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fieldName">Nome do Campo *</Label>
          <Input
            id="fieldName"
            value={formData.fieldName}
            onChange={(e) => setFormData(prev => ({ ...prev, fieldName: e.target.value }))}
            placeholder="ex: campo_personalizado"
            className={errors.fieldName ? 'border-red-500' : ''}
          />
          {errors.fieldName && <p className="text-sm text-red-500 mt-1">{errors.fieldName}</p>}
        </div>

        <div>
          <Label htmlFor="fieldLabel">Rótulo do Campo *</Label>
          <Input
            id="fieldLabel"
            value={formData.fieldLabel}
            onChange={(e) => setFormData(prev => ({ ...prev, fieldLabel: e.target.value }))}
            placeholder="ex: Campo Personalizado"
            className={errors.fieldLabel ? 'border-red-500' : ''}
          />
          {errors.fieldLabel && <p className="text-sm text-red-500 mt-1">{errors.fieldLabel}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fieldType">Tipo do Campo</Label>
          <Select
            value={formData.fieldType}
            onValueChange={(value: FieldType) => setFormData(prev => ({
              ...prev,
              fieldType: value,
              fieldOptions: (value === 'select' || value === 'multiselect') ? [''] : []
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FIELD_TYPE_CONFIG).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex flex-col">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-sm text-muted-foreground">{config.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="displayOrder">Ordem de Exibição</Label>
          <Input
            id="displayOrder"
            type="number"
            min="0"
            value={formData.displayOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRequired"
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked as boolean }))}
        />
        <Label htmlFor="isRequired">Campo obrigatório</Label>
      </div>

      {/* Configurações para campos de seleção */}
      {(formData.fieldType === 'select' || formData.fieldType === 'multiselect') && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Opções do Campo</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Configure as opções disponíveis para seleção
            </p>

            <div className="space-y-2">
              {(formData.fieldOptions || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
            {errors.fieldOptions && <p className="text-sm text-red-500 mt-1">{errors.fieldOptions}</p>}
          </div>
        </div>
      )}

      {/* Configurações para campos de texto */}
      {(formData.fieldType === 'text' || formData.fieldType === 'textarea' ||
        formData.fieldType === 'email' || formData.fieldType === 'url') && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Configurações de Texto</Label>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={formData.placeholder}
                  onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Texto de exemplo..."
                />
              </div>

              <div>
                <Label htmlFor="defaultValue">Valor Padrão</Label>
                <Input
                  id="defaultValue"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="Valor inicial"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configurações para campos numéricos */}
      {formData.fieldType === 'number' && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Configurações Numéricas</Label>

            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <Label htmlFor="minValue">Valor Mínimo</Label>
                <Input
                  id="minValue"
                  type="number"
                  value={formData.validationRules?.min || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    validationRules: {
                      ...prev.validationRules,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  placeholder="Mínimo"
                />
              </div>

              <div>
                <Label htmlFor="maxValue">Valor Máximo</Label>
                <Input
                  id="maxValue"
                  type="number"
                  value={formData.validationRules?.max || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    validationRules: {
                      ...prev.validationRules,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  placeholder="Máximo"
                />
              </div>

              <div>
                <Label htmlFor="defaultNumberValue">Valor Padrão</Label>
                <Input
                  id="defaultNumberValue"
                  type="number"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="Padrão"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="helpText">Texto de Ajuda</Label>
        <Textarea
          id="helpText"
          value={formData.helpText}
          onChange={(e) => setFormData(prev => ({ ...prev, helpText: e.target.value }))}
          placeholder="Texto explicativo sobre o campo..."
          className="resize-none"
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Criar Campo
        </Button>
      </DialogFooter>
    </form>
  );
};

export default function CustomFieldsAdministrator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedModule, setSelectedModule] = useState<ModuleType>('customers');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldMetadata | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldMetadata | null>(null);
  const [activeTab, setActiveTab] = useState('fields');

  // Fetch fields for selected module
  const { data: moduleFields = [], isLoading, error } = useQuery({
    queryKey: ['custom-fields', selectedModule],
    queryFn: async () => {
      try {
        console.log(`🔍 [CUSTOM-FIELDS] Fetching fields for module: ${selectedModule}`);
        const response = await apiRequest('GET', `/api/custom-fields/fields/${selectedModule}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("🔥 [CUSTOM-FIELDS] API Error Response:", errorText);
          throw new Error(`Failed to fetch fields: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ [CUSTOM-FIELDS] API Response:`, data);
        
        // ✅ 1QA.MD: Handle different response structures
        if (data.success === false) {
          throw new Error(data.error || 'API returned success: false');
        }
        
        return data.data || data || [];
      } catch (error) {
        console.error("🔥 [CUSTOM-FIELDS] Failed to fetch custom fields:", error);
        throw error; // Re-throw to let React Query handle the error state
      }
    },
    retry: 1, // Reduce retries for faster feedback
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (fieldData: Partial<CustomFieldMetadata>) => {
      try {
        console.log('Creating custom field with data:', fieldData);
        const response = await apiRequest('POST', '/api/custom-fields/fields', fieldData);

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Create field error:', errorData);
          throw new Error(`Failed to create field: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Field created successfully:', result);
        return result;
      } catch (error) {
        console.error('Error in createFieldMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', selectedModule] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Campo criado',
        description: 'Campo customizado criado com sucesso!'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar campo customizado.',
        variant: 'destructive'
      });
    }
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, ...fieldData }: Partial<CustomFieldMetadata> & { fieldId: string }) => {
      const response = await apiRequest('PUT', `/api/custom-fields/fields/${fieldId}`, fieldData);
      if (!response.ok) {
        throw new Error('Failed to update field');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', selectedModule] });
      setEditingField(null);
      toast({
        title: 'Campo atualizado',
        description: 'Campo customizado atualizado com sucesso!'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar campo customizado.',
        variant: 'destructive'
      });
    }
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await apiRequest('DELETE', `/api/custom-fields/fields/${fieldId}`);
      if (!response.ok) {
        throw new Error('Failed to delete field');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', selectedModule] });
      toast({
        title: 'Campo removido',
        description: 'Campo customizado removido com sucesso!'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover campo customizado.',
        variant: 'destructive'
      });
    }
  });

  const renderFieldsList = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                Carregando campos customizados...
              </h3>
              <p className="text-blue-600">
                Aguarde enquanto carregamos os campos para o módulo "{MODULE_TYPES.find(m => m.value === selectedModule)?.label}"
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Erro ao carregar campos customizados
            </h3>
            <p className="text-red-600 mb-4">
              Não foi possível carregar os campos para este módulo.
            </p>
            <p className="text-sm text-red-500 mb-6 font-mono bg-red-100 p-2 rounded">
              Erro: {error?.message || 'Erro desconhecido'}
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['custom-fields', selectedModule] })}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {moduleFields.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum campo customizado encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Este módulo ainda não possui campos personalizados configurados.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Campo
              </Button>
            </CardContent>
          </Card>
        ) : (
          moduleFields.map((field: CustomFieldMetadata, index: number) => (
            <Card key={field.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-4 h-4 cursor-move" />
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">{field.fieldLabel}</h3>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {FIELD_TYPE_CONFIG[field.fieldType as FieldType]?.label}
                      </Badge>
                      {field.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Campo técnico:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {field.fieldName}
                        </code>
                      </p>

                      {field.helpText && (
                        <p className="text-sm text-gray-500 italic">
                          "{field.helpText}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Criado: {new Date(field.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span>Ordem: {field.displayOrder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(field)}
                      className="hover:bg-blue-50 hover:text-blue-700"
                      title="Editar campo"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFieldToDelete(field)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Excluir campo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  // Breadcrumb component
  const Breadcrumb = () => (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Home className="w-4 h-4" />
      <ChevronRight className="w-4 h-4" />
      <span>Administração</span>
      <ChevronRight className="w-4 h-4" />
      <span className="text-gray-900 font-medium">Campos Customizados</span>
    </nav>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrador de Campos Customizados</h1>
          <p className="text-gray-600 mt-2">
            Configure campos personalizados para diferentes módulos do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          <Badge variant="outline" className="text-xs">
            Beta
          </Badge>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label htmlFor="module-select" className="text-sm font-medium text-gray-700">
                Módulo:
              </Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-56 bg-white border-gray-200">
                  <SelectValue placeholder="Selecione um módulo" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_TYPES.map((module) => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando campos...
                </div>
              )}
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Campo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Campo Customizado</DialogTitle>
                  <DialogDescription>
                    Adicione um novo campo personalizado para o módulo "{MODULE_TYPES.find(m => m.value === selectedModule)?.label}"
                  </DialogDescription>
                </DialogHeader>
                <CreateFieldForm
                  moduleType={selectedModule}
                  onSubmit={(data: CreateFieldFormData) => createFieldMutation.mutate(data)}
                  isLoading={createFieldMutation.isPending}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          {renderFieldsList()}
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Estatísticas do Módulo - {MODULE_TYPES.find(m => m.value === selectedModule)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{moduleFields.length}</div>
                    <div className="text-sm text-blue-700 mt-1">Total de Campos</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {moduleFields.filter((f: CustomFieldMetadata) => f.isRequired).length}
                    </div>
                    <div className="text-sm text-red-700 mt-1">Campos Obrigatórios</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'text').length}
                    </div>
                    <div className="text-sm text-green-700 mt-1">Campos de Texto</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'select').length}
                    </div>
                    <div className="text-sm text-purple-700 mt-1">Campos de Seleção</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo de Campo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(FIELD_TYPE_CONFIG).map(([type, config]) => {
                    const count = moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === type).length;
                    const percentage = moduleFields.length > 0 ? (count / moduleFields.length) * 100 : 0;

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Field Dialog */}
      {editingField && (
        <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('customFields.editField')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFieldName">{t('customFields.fieldName')}</Label>
                  <Input
                    id="editFieldName"
                    value={editingField?.fieldName || ''}
                    onChange={(e) => editingField && setEditingField({ ...editingField, fieldName: e.target.value })}
                    placeholder={t('customFields.enterFieldName')}
                  />
                  <p className="text-xs text-gray-500">O nome técnico não pode ser alterado</p>
                </div>

                <div>
                  <Label htmlFor="editFieldLabel">{t('customFields.fieldLabel')}</Label>
                  <Input
                    id="editFieldLabel"
                    value={editingField?.fieldLabel || ''}
                    onChange={(e) => editingField && setEditingField({ ...editingField, fieldLabel: e.target.value })}
                    placeholder={t('customFields.enterFieldLabel')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFieldType">{t('customFields.fieldType')}</Label>
                  <Select
                    value={editingField?.fieldType || ''}
                    onValueChange={(value: FieldType) =>
                      editingField && setEditingField({
                        ...editingField,
                        fieldType: value,
                        // Reset field options when changing type
                        fieldOptions: (value === 'select' || value === 'multiselect') ? editingField.fieldOptions || [] : undefined
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('customFields.selectFieldType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FIELD_TYPE_CONFIG).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex flex-col">
                            <span className="font-medium">{config.label}</span>
                            <span className="text-sm text-muted-foreground">{config.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editDisplayOrder">{t('customFields.displayOrder')}</Label>
                  <Input
                    id="editDisplayOrder"
                    type="number"
                    min="0"
                    value={editingField?.displayOrder || ''}
                    onChange={(e) =>
                      editingField && setEditingField({ ...editingField, displayOrder: parseInt(e.target.value) || 0 })
                    }
                    placeholder={t('customFields.enterDisplayOrder')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editIsRequired"
                  checked={editingField?.isRequired || false}
                  onCheckedChange={(checked) =>
                    editingField && setEditingField({ ...editingField, isRequired: checked as boolean })
                  }
                />
                <Label htmlFor="editIsRequired">{t('customFields.isRequired')}</Label>
              </div>

              {/* Configurações Adicionais baseadas no tipo de campo - EDIÇÃO */}
              {editingField && (editingField.fieldType === 'select' || editingField.fieldType === 'multiselect') && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">{t('customFields.fieldOptions')}</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('customFields.fieldOptionsDescription')}
                    </p>

                    <div className="space-y-2">
                      {(editingField.fieldOptions || []).map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const updatedOptions = [...(editingField.fieldOptions || [])];
                              updatedOptions[index] = e.target.value;
                              setEditingField({ ...editingField, fieldOptions: updatedOptions });
                            }}
                            placeholder={`${t('customFields.option')} ${index + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const updatedOptions = (editingField.fieldOptions || []).filter((_, i) => i !== index);
                              setEditingField({ ...editingField, fieldOptions: updatedOptions });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentOptions = editingField.fieldOptions || [];
                          setEditingField({
                            ...editingField,
                            fieldOptions: [...currentOptions, '']
                          });
                        }}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('customFields.addOption')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Configurações para campos de texto - EDIÇÃO */}
              {editingField && (editingField.fieldType === 'text' || editingField.fieldType === 'textarea' || editingField.fieldType === 'email' || editingField.fieldType === 'url') && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">{t('customFields.textFieldConfig')}</Label>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label htmlFor="editPlaceholder">{t('customFields.placeholder')}</Label>
                        <Input
                          id="editPlaceholder"
                          value={editingField.placeholder || ''}
                          onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                          placeholder={t('customFields.enterPlaceholder')}
                        />
                      </div>

                      <div>
                        <Label htmlFor="editDefaultValue">{t('customFields.defaultValue')}</Label>
                        <Input
                          id="editDefaultValue"
                          value={editingField.defaultValue || ''}
                          onChange={(e) => setEditingField({ ...editingField, defaultValue: e.target.value })}
                          placeholder={t('customFields.enterDefaultValue')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configurações para campos numéricos - EDIÇÃO */}
              {editingField && editingField.fieldType === 'number' && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">{t('customFields.numberFieldConfig')}</Label>

                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <Label htmlFor="editMinValue">{t('customFields.minValue')}</Label>
                        <Input
                          id="editMinValue"
                          type="number"
                          value={editingField.validationRules?.min || ''}
                          onChange={(e) => {
                            const rules = editingField.validationRules || {};
                            setEditingField({
                              ...editingField,
                              validationRules: { ...rules, min: e.target.value ? parseInt(e.target.value) : undefined }
                            });
                          }}
                          placeholder={t('customFields.enterMinValue')}
                        />
                      </div>

                      <div>
                        <Label htmlFor="editMaxValue">{t('customFields.maxValue')}</Label>
                        <Input
                          id="editMaxValue"
                          type="number"
                          value={editingField.validationRules?.max || ''}
                          onChange={(e) => {
                            const rules = editingField.validationRules || {};
                            setEditingField({
                              ...editingField,
                              validationRules: { ...rules, max: e.target.value ? parseInt(e.target.value) : undefined }
                            });
                          }}
                          placeholder={t('customFields.enterMaxValue')}
                        />
                      </div>

                      <div>
                        <Label htmlFor="editDefaultNumberValue">{t('customFields.defaultValue')}</Label>
                        <Input
                          id="editDefaultNumberValue"
                          type="number"
                          value={editingField.defaultValue || ''}
                          onChange={(e) => setEditingField({ ...editingField, defaultValue: e.target.value })}
                          placeholder={t('customFields.enterDefaultValue')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingField(null)}
              >
                {t('customFields.cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (editingField) {
                    updateFieldMutation.mutate({
                      fieldId: editingField.id,
                      moduleType: editingField.moduleType,
                      fieldName: editingField.fieldName,
                      fieldType: editingField.fieldType,
                      fieldLabel: editingField.fieldLabel,
                      isRequired: editingField.isRequired,
                      displayOrder: editingField.displayOrder,
                      fieldOptions: editingField.fieldOptions,
                      placeholder: editingField.placeholder,
                      defaultValue: editingField.defaultValue,
                      helpText: editingField.helpText,
                      validationRules: editingField.validationRules
                    });
                  }
                }}
                disabled={!editingField?.fieldName || !editingField?.fieldLabel}
              >
                {t('customFields.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {fieldToDelete && (
        <Dialog open={!!fieldToDelete} onOpenChange={() => setFieldToDelete(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o campo "{fieldToDelete.fieldLabel}"?
                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setFieldToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteFieldMutation.mutate(fieldToDelete.id);
                  setFieldToDelete(null);
                }}
                disabled={deleteFieldMutation.isPending}
              >
                {deleteFieldMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Excluir Campo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}