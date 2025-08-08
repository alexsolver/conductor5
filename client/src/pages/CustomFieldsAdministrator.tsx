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

  const renderFieldsList = () => (
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
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFieldMutation.mutate(field.id)}
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administrador de Campos Customizados</h1>
          <p className="text-gray-600">
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
          <DialogContent className="max-w-2xl">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{moduleFields.length}</div>
                  <div className="text-sm text-gray-600">Total de Campos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {moduleFields.filter((f: CustomFieldMetadata) => f.isRequired).length}
                  </div>
                  <div className="text-sm text-gray-600">Campos Obrigatórios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'text').length}
                  </div>
                  <div className="text-sm text-gray-600">Campos de Texto</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'select').length}
                  </div>
                  <div className="text-sm text-gray-600">Campos de Seleção</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Field Dialog */}
      {editingField && (
        <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
          <DialogContent className="max-w-2xl">
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
    </div>
  );
}

// Form components would be implemented here as well...
function CreateFieldForm({ moduleType, onSubmit, isLoading }: any) {
  return <div>Create Field Form - To be implemented</div>;
}

function EditFieldForm({ field, onSubmit, isLoading }: any) {
  return <div>Edit Field Form - To be implemented</div>;
}