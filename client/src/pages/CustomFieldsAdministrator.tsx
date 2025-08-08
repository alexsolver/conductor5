import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Package,
  Save,
  X
} from 'lucide-react';

// Import ConfirmationDialog component
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

type ModuleType = 'customers' | 'tickets' | 'beneficiaries' | 'materials' | 'services' | 'locations';
type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'textarea' | 'file' | 'email' | 'phone';

interface CustomFieldMetadata {
  id: string;
  moduleType: ModuleType;
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  isRequired: boolean;
  validationRules: Record<string, any>;
  fieldOptions: Record<string, any>;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  phone: { label: 'Telefone', description: 'Campo de telefone com validação' }
} as const;

export default function CustomFieldsAdministrator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedModule, setSelectedModule] = useState<ModuleType>('customers');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldMetadata | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldMetadata | null>(null); // State for delete confirmation
  const [activeTab, setActiveTab] = useState('fields');

  // Fetch fields for selected module
  const { data: moduleFields = [], isLoading } = useQuery({
    queryKey: ['custom-fields', selectedModule],
    queryFn: async () => {
      const response = await fetch(`/api/custom-fields/fields/${selectedModule}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        // Handle specific errors more gracefully if possible
        if (response.status === 401) {
          toast({
            title: 'Não Autorizado',
            description: 'Sua sessão expirou. Por favor, faça login novamente.',
            variant: 'destructive',
          });
          // Optionally redirect to login
          // window.location.href = '/login';
        } else {
          toast({
            title: 'Erro ao buscar campos',
            description: 'Não foi possível carregar os campos customizados.',
            variant: 'destructive',
          });
        }
        throw new Error('Failed to fetch fields');
      }
      const data = await response.json();
      return data.data || [];
    }
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (fieldData: Partial<CustomFieldMetadata>) => {
      const response = await fetch('/api/custom-fields/fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(fieldData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create field');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', selectedModule] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Campo criado',
        description: 'Campo customizado criado com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar campo customizado.',
        variant: 'destructive'
      });
    }
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, ...fieldData }: Partial<CustomFieldMetadata> & { fieldId: string }) => {
      const response = await fetch(`/api/custom-fields/fields/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(fieldData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update field');
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
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar campo customizado.',
        variant: 'destructive'
      });
    }
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await fetch(`/api/custom-fields/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete field');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', selectedModule] });
      setFieldToDelete(null); // Close the dialog
      toast({
        title: 'Campo removido',
        description: 'Campo customizado removido com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover campo customizado.',
        variant: 'destructive'
      });
    }
  });

  const confirmDelete = (field: CustomFieldMetadata) => {
    deleteFieldMutation.mutate(field.id);
  };

  const renderFieldsList = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {moduleFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum campo customizado criado para este módulo</p>
            <p className="text-sm">Clique em "Novo Campo" para começar</p>
          </div>
        ) : (
          moduleFields.map((field: CustomFieldMetadata) => (
            <Card key={field.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <h3 className="font-medium">{field.fieldLabel}</h3>
                      <Badge variant="outline">
                        {FIELD_TYPE_CONFIG[field.fieldType as FieldType]?.label}
                      </Badge>
                      {field.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Campo: <code className="bg-gray-100 px-1 rounded">{field.fieldName}</code>
                    </p>
                    {field.fieldOptions?.helpText && (
                      <p className="text-xs text-gray-500 mt-1">
                        {field.fieldOptions.helpText}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(field)}
                      disabled={updateFieldMutation.isPending}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFieldToDelete(field)} // Open confirmation dialog
                      disabled={deleteFieldMutation.isPending}
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <div className="text-gray-400">Administração</div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-gray-900 font-medium">Campos Customizados</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administrador de Campos Customizados</h1>
          <p className="text-gray-600 mt-1">
            Configure campos personalizados para diferentes módulos do sistema
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Label htmlFor="module-select">Módulo:</Label>
        <Select value={selectedModule} onValueChange={(value: ModuleType) => setSelectedModule(value)}>
          <SelectTrigger className="w-48">
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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Campo Customizado</DialogTitle>
            </DialogHeader>
            <CreateFieldForm
              moduleType={selectedModule}
              onSubmit={(data) => createFieldMutation.mutate(data)}
              isLoading={createFieldMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          {renderFieldsList()}
        </TabsContent>

        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-12"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{moduleFields.length}</div>
                    <div className="text-sm text-blue-700">Total de Campos</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {moduleFields.filter((f: CustomFieldMetadata) => f.isRequired).length}
                    </div>
                    <div className="text-sm text-red-700">Campos Obrigatórios</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'text').length}
                    </div>
                    <div className="text-sm text-green-700">Campos de Texto</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'select').length}
                    </div>
                    <div className="text-sm text-purple-700">Campos de Seleção</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Field Dialog */}
      {editingField && (
        <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
          <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Campo: {editingField.fieldLabel}</DialogTitle>
            </DialogHeader>
            <EditFieldForm
              field={editingField}
              onSubmit={(data) => updateFieldMutation.mutate({ ...data, fieldId: editingField.id })}
              isLoading={updateFieldMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!fieldToDelete}
        onOpenChange={(open) => !open && setFieldToDelete(null)}
        title="Excluir Campo Customizado"
        description={`Tem certeza que deseja excluir o campo "${fieldToDelete?.fieldLabel}"? Esta ação não pode ser desfeita e removerá todos os dados associados.`}
        confirmText="Excluir Campo"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => fieldToDelete && confirmDelete(fieldToDelete)}
        loading={deleteFieldMutation.isPending}
      />
    </div>
  );
}

// Form components implementation
function CreateFieldForm({ moduleType, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text' as FieldType,
    isRequired: false,
    displayOrder: 0,
    validationRules: {},
    fieldOptions: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      moduleType,
      validationRules: formData.validationRules || {},
      fieldOptions: formData.fieldOptions || {}
    });
  };

  const handleFieldTypeChange = (value: FieldType) => {
    setFormData(prev => ({
      ...prev,
      fieldType: value,
      fieldOptions: value === 'select' || value === 'multiselect' 
        ? { options: [{ label: '', value: '' }] }
        : {}
    }));
  };

  const addOption = () => {
    if (formData.fieldType === 'select' || formData.fieldType === 'multiselect') {
      setFormData(prev => ({
        ...prev,
        fieldOptions: {
          ...prev.fieldOptions,
          options: [...(prev.fieldOptions.options || []), { label: '', value: '' }]
        }
      }));
    }
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    if (formData.fieldType === 'select' || formData.fieldType === 'multiselect') {
      const options = [...(formData.fieldOptions.options || [])];
      options[index] = { ...options[index], [key]: value };
      setFormData(prev => ({
        ...prev,
        fieldOptions: { ...prev.fieldOptions, options }
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.fieldType === 'select' || formData.fieldType === 'multiselect') {
      const options = (formData.fieldOptions.options || []).filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        fieldOptions: { ...prev.fieldOptions, options }
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fieldName">Nome do Campo</Label>
          <Input
            id="fieldName"
            value={formData.fieldName}
            onChange={(e) => setFormData(prev => ({ ...prev, fieldName: e.target.value }))}
            placeholder="nome_do_campo"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldLabel">Rótulo do Campo</Label>
          <Input
            id="fieldLabel"
            value={formData.fieldLabel}
            onChange={(e) => setFormData(prev => ({ ...prev, fieldLabel: e.target.value }))}
            placeholder="Rótulo visível"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fieldType">Tipo do Campo</Label>
        <Select value={formData.fieldType} onValueChange={handleFieldTypeChange} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label} - {config.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(formData.fieldType === 'select' || formData.fieldType === 'multiselect') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Opções</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(formData.fieldOptions.options || []).map((option: any, index: number) => (
              <div key={`create-option-${index}-${option.value || index}`} className="flex gap-2">
                <Input
                  placeholder="Rótulo"
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Valor"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="helpText">Texto de Ajuda (opcional)</Label>
        <Textarea
          id="helpText"
          value={formData.fieldOptions.helpText || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            fieldOptions: { ...prev.fieldOptions, helpText: e.target.value }
          }))}
          placeholder="Texto explicativo para o campo"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRequired"
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: !!checked }))}
          disabled={isLoading}
        />
        <Label htmlFor="isRequired">Campo obrigatório</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Save className="w-4 h-4 mr-2 animate-spin" />}
          Criar Campo
        </Button>
      </div>
    </form>
  );
}

function EditFieldForm({ field, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    fieldLabel: field?.fieldLabel || '',
    isRequired: field?.isRequired || false,
    displayOrder: field?.displayOrder || 0,
    validationRules: field?.validationRules || {},
    fieldOptions: field?.fieldOptions || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      validationRules: formData.validationRules || {},
      fieldOptions: formData.fieldOptions || {}
    });
  };

  const addOption = () => {
    if (field?.fieldType === 'select' || field?.fieldType === 'multiselect') {
      setFormData(prev => ({
        ...prev,
        fieldOptions: {
          ...prev.fieldOptions,
          options: [...(prev.fieldOptions.options || []), { label: '', value: '' }]
        }
      }));
    }
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    if (field?.fieldType === 'select' || field?.fieldType === 'multiselect') {
      const options = [...(formData.fieldOptions.options || [])];
      options[index] = { ...options[index], [key]: value };
      setFormData(prev => ({
        ...prev,
        fieldOptions: { ...prev.fieldOptions, options }
      }));
    }
  };

  const removeOption = (index: number) => {
    if (field?.fieldType === 'select' || field?.fieldType === 'multiselect') {
      const options = (formData.fieldOptions.options || []).filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        fieldOptions: { ...prev.fieldOptions, options }
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Campo</Label>
        <div className="p-2 bg-gray-50 rounded border text-sm text-gray-700">
          {field?.fieldName} (não editável)
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo do Campo</Label>
        <div className="p-2 bg-gray-50 rounded border text-sm text-gray-700">
          {FIELD_TYPE_CONFIG[field?.fieldType as FieldType]?.label || field?.fieldType} (não editável)
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fieldLabel">Rótulo do Campo</Label>
        <Input
          id="fieldLabel"
          value={formData.fieldLabel}
          onChange={(e) => setFormData(prev => ({ ...prev, fieldLabel: e.target.value }))}
          placeholder="Rótulo visível"
          required
          disabled={isLoading}
        />
      </div>

      {(field?.fieldType === 'select' || field?.fieldType === 'multiselect') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Opções</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(formData.fieldOptions.options || []).map((option: any, index: number) => (
              <div key={`edit-option-${index}-${option.value || index}`} className="flex gap-2">
                <Input
                  placeholder="Rótulo"
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Valor"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="helpText">Texto de Ajuda</Label>
        <Textarea
          id="helpText"
          value={formData.fieldOptions.helpText || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            fieldOptions: { ...prev.fieldOptions, helpText: e.target.value }
          }))}
          placeholder="Texto explicativo para o campo"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayOrder">Ordem de Exibição</Label>
        <Input
          id="displayOrder"
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRequired"
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: !!checked }))}
          disabled={isLoading}
        />
        <Label htmlFor="isRequired">Campo obrigatório</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Save className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}