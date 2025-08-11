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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
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

interface CreateFieldFormData {
  moduleType: ModuleType;
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  isRequired: boolean;
  validationRules?: Record<string, any>;
  fieldOptions?: Record<string, any>;
  helpText?: string;
}

interface EditFieldFormData extends CreateFieldFormData {
  fieldId: string;
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
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldMetadata | null>(null);
  const [activeTab, setActiveTab] = useState('fields');

  // Fetch fields for selected module
  const { data: moduleFields = [], isLoading } = useQuery({
    queryKey: ['custom-fields', selectedModule],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/custom-fields/fields/${selectedModule}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
          }
        });
        if (!response.ok) {
          console.warn(`[CUSTOM-FIELDS] API returned ${response.status} for module ${selectedModule}`);
          return [];
        }
        const data = await response.json();
        console.log(`[CUSTOM-FIELDS] API Response for ${selectedModule}:`, data);
        
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        } else if (Array.isArray(data.fields)) {
          return data.fields;
        } else if (Array.isArray(data)) {
          return data;
        }
        
        return [];
      } catch (error) {
        console.error(`[CUSTOM-FIELDS] Error fetching fields for ${selectedModule}:`, error);
        return [];
      }
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
        throw new Error('Failed to create field');
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
      const response = await fetch(`/api/custom-fields/fields/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(fieldData)
      });
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
      const response = await fetch(`/api/custom-fields/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                      
                      {field.fieldOptions?.helpText && (
                        <p className="text-sm text-gray-500 italic">
                          "{field.fieldOptions.helpText}"
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
              <Select value={selectedModule} onValueChange={(value: ModuleType) => setSelectedModule(value)}>
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
              <DialogContent className="max-w-2xl">
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Campo: {editingField.fieldLabel}</DialogTitle>
              <DialogDescription>
                Modifique as configurações do campo customizado "{editingField.fieldName}"
              </DialogDescription>
            </DialogHeader>
            <EditFieldForm
              field={editingField}
              onSubmit={(data: EditFieldFormData) => updateFieldMutation.mutate({ ...data, fieldId: editingField.id })}
              isLoading={updateFieldMutation.isPending}
              onCancel={() => setEditingField(null)}
            />
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

// Create Field Form Component
interface CreateFieldFormProps {
  moduleType: ModuleType;
  onSubmit: (data: CreateFieldFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function CreateFieldForm({ moduleType, onSubmit, isLoading, onCancel }: CreateFieldFormProps) {
  const [formData, setFormData] = useState<CreateFieldFormData>({
    moduleType,
    fieldName: '',
    fieldType: 'text',
    fieldLabel: '',
    isRequired: false,
    helpText: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fieldName">Nome do Campo (Técnico)</Label>
          <Input
            id="fieldName"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            placeholder="ex: telefone_adicional"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fieldLabel">Label (Exibição)</Label>
          <Input
            id="fieldLabel"
            value={formData.fieldLabel}
            onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
            placeholder="ex: Telefone Adicional"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fieldType">Tipo de Campo</Label>
        <Select value={formData.fieldType} onValueChange={(value: FieldType) => setFormData({ ...formData, fieldType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-gray-500">{config.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="helpText">Texto de Ajuda (Opcional)</Label>
        <Textarea
          id="helpText"
          value={formData.helpText || ''}
          onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
          placeholder="Descrição ou instruções para o usuário"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRequired"
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
        />
        <Label htmlFor="isRequired" className="text-sm">
          Campo obrigatório
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Criar Campo
        </Button>
      </div>
    </form>
  );
}

// Edit Field Form Component
interface EditFieldFormProps {
  field: CustomFieldMetadata;
  onSubmit: (data: EditFieldFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function EditFieldForm({ field, onSubmit, isLoading, onCancel }: EditFieldFormProps) {
  const [formData, setFormData] = useState<EditFieldFormData>({
    fieldId: field.id,
    moduleType: field.moduleType,
    fieldName: field.fieldName,
    fieldType: field.fieldType,
    fieldLabel: field.fieldLabel,
    isRequired: field.isRequired,
    helpText: field.fieldOptions?.helpText || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fieldName">Nome do Campo (Técnico)</Label>
          <Input
            id="fieldName"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">O nome técnico não pode ser alterado</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fieldLabel">Label (Exibição)</Label>
          <Input
            id="fieldLabel"
            value={formData.fieldLabel}
            onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fieldType">Tipo de Campo</Label>
        <Select value={formData.fieldType} onValueChange={(value: FieldType) => setFormData({ ...formData, fieldType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-gray-500">{config.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="helpText">Texto de Ajuda (Opcional)</Label>
        <Textarea
          id="helpText"
          value={formData.helpText || ''}
          onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRequired"
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
        />
        <Label htmlFor="isRequired" className="text-sm">
          Campo obrigatório
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}