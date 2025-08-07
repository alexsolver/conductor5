import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Eye, 
  Settings,
  Users,
  Ticket,
  MapPin,
  Briefcase,
  Package,
  Brain,
  BarChart3
} from 'lucide-react';
// import { CustomFieldMetadata, ModuleType, FieldType } from "@shared/schema"; // temporarily disabled

// ===========================
// FORM SCHEMAS
// ===========================

const fieldCreationSchema = z.object({
  fieldName: z.string().min(1, 'Nome do campo é obrigatório').regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Nome deve começar com letra e conter apenas letras, números e underscore'),
  fieldLabel: z.string().min(1, 'Rótulo é obrigatório'),
  fieldType: z.enum(['text', 'number', 'select', 'multiselect', 'date', 'boolean', 'textarea', 'file', 'email', 'phone']),
  moduleType: z.enum(['customers', 'favorecidos', 'tickets', 'skills', 'materials-services', 'locations']),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().min(0).default(0),
  validationRules: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    customMessage: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  fieldOptions: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string().optional(),
    icon: z.string().optional(),
    isDefault: z.boolean().optional()
  })).optional()
});

type FieldCreationForm = z.infer<typeof fieldCreationSchema>;

// ===========================
// MODULE CONFIGURATION
// ===========================

const MODULE_CONFIG = {
  customers: { label: 'Clientes', icon: Users, color: 'blue' },
  favorecidos: { label: 'Favorecidos', icon: Users, color: 'green' },
  tickets: { label: 'Tickets', icon: Ticket, color: 'purple' },
  skills: { label: 'Habilidades', icon: Brain, color: 'orange' },
  'materials-services': { label: 'Materiais/Serviços', icon: Package, color: 'red' },
  locations: { label: 'Locais', icon: MapPin, color: 'cyan' }
} as const;

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

// ===========================
// MAIN COMPONENT
// ===========================

export default function CustomFieldsAdministrator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedModule, setSelectedModule] = useState<ModuleType>('customers');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldMetadata | null>(null);
  const [activeTab, setActiveTab] = useState('fields');

  // ===========================
  // DATA QUERIES
  // ===========================

  const { data: moduleFields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/custom-fields/fields', selectedModule],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/custom-fields/fields/${selectedModule}`);
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  const { data: moduleAccess = {}, isLoading: accessLoading } = useQuery({
    queryKey: ['/api/custom-fields/modules/access'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/custom-fields/modules/access');
      const result = await response.json();
      return result.success ? result.data : {};
    }
  });

  const { data: moduleStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/custom-fields/stats', selectedModule],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/custom-fields/stats/${selectedModule}`);
      const result = await response.json();
      return result.success ? result.data : {};
    }
  });

  // ===========================
  // MUTATIONS
  // ===========================

  const createFieldMutation = useMutation({
    mutationFn: async (data: FieldCreationForm) => {
      const response = await apiRequest('POST', '/api/custom-fields/fields', data);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields/fields', selectedModule] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields/stats', selectedModule] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Campo criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar campo', description: error.message, variant: 'destructive' });
    }
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, data }: { fieldId: string; data: Partial<FieldCreationForm> }) => {
      const response = await apiRequest('PUT', `/api/custom-fields/fields/${fieldId}`, data);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields/fields', selectedModule] });
      setEditingField(null);
      toast({ title: 'Campo atualizado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar campo', description: error.message, variant: 'destructive' });
    }
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await apiRequest('DELETE', `/api/custom-fields/fields/${fieldId}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields/fields', selectedModule] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields/stats', selectedModule] });
      toast({ title: 'Campo removido com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover campo', description: error.message, variant: 'destructive' });
    }
  });

  // ===========================
  // FORM SETUP
  // ===========================

  const form = useForm<FieldCreationForm>({
    resolver: zodResolver(fieldCreationSchema),
    defaultValues: {
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      moduleType: selectedModule,
      isRequired: false,
      displayOrder: moduleFields.length,
      fieldOptions: []
    }
  });

  const { fields: optionFields, append: addOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: 'fieldOptions'
  });

  // Update form module when selectedModule changes
  React.useEffect(() => {
    form.setValue('moduleType', selectedModule);
    form.setValue('displayOrder', moduleFields.length);
  }, [selectedModule, moduleFields.length, form]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleCreateField = async (data: FieldCreationForm) => {
    await createFieldMutation.mutateAsync(data);
    form.reset();
  };

  const handleDeleteField = async (fieldId: string) => {
    if (confirm('Tem certeza que deseja remover este campo? Esta ação não pode ser desfeita.')) {
      await deleteFieldMutation.mutateAsync(fieldId);
    }
  };

  const isSelectType = form.watch('fieldType') === 'select' || form.watch('fieldType') === 'multiselect';

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderModuleSelector = () => (
    <div className="mb-6">
      <Label className="text-sm font-medium text-gray-700 mb-3 block">
        Selecionar Módulo
      </Label>
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(MODULE_CONFIG) as ModuleType[]).map((moduleType) => {
          const config = MODULE_CONFIG[moduleType];
          const Icon = config.icon;
          const isSelected = selectedModule === moduleType;
          const isEnabled = moduleAccess[moduleType] !== false;
          
          return (
            <button
              key={moduleType}
              onClick={() => setSelectedModule(moduleType)}
              disabled={!isEnabled}
              className={`
                p-4 border-2 rounded-lg transition-all duration-200 text-left
                ${isSelected 
                  ? `border-${config.color}-500 bg-${config.color}-50 shadow-md` 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isSelected ? `text-${config.color}-600` : 'text-gray-500'}`} />
                <div>
                  <div className={`font-medium ${isSelected ? `text-${config.color}-900` : 'text-gray-900'}`}>
                    {config.label}
                  </div>
                  {!isEnabled && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Desabilitado
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

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
                  {field.fieldOptions && (
                    <p className="text-sm text-gray-500 mt-1">
                      {Array.isArray(field.fieldOptions) && field.fieldOptions.length} opções configuradas
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
                    onClick={() => handleDeleteField(field.id)}
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

  const renderStatsOverview = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{moduleStats.totalFields || 0}</div>
          <p className="text-sm text-gray-600">Total de Campos</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{moduleStats.activeFields || 0}</div>
          <p className="text-sm text-gray-600">Campos Ativos</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-600">{moduleStats.requiredFields || 0}</div>
          <p className="text-sm text-gray-600">Campos Obrigatórios</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {moduleStats.fieldsByType ? Object.keys(moduleStats.fieldsByType).length : 0}
          </div>
          <p className="text-sm text-gray-600">Tipos Diferentes</p>
        </CardContent>
      </Card>
    </div>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className="container mx-auto py-6 space-y-6 ml-[0px] mr-[0px] pl-[11px] pr-[11px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administrador de Campos Customizados</h1>
          <p className="text-gray-600 mt-1">
            Configure campos dinâmicos para diferentes módulos do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Campo Customizado</DialogTitle>
              <DialogDescription>
                Configure um novo campo dinâmico para o módulo {MODULE_CONFIG[selectedModule]?.label}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateField)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fieldName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Campo *</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: telefone_emergencia" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nome técnico (apenas letras, números e underscore)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fieldLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rótulo *</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: Telefone de Emergência" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nome que aparece no formulário
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fieldType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo do Campo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FIELD_TYPE_CONFIG).map(([type, config]) => (
                            <SelectItem key={type} value={type}>
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-sm text-gray-500">{config.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <FormLabel>Campo obrigatório</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {isSelectType && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Opções do Campo</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption({ value: '', label: '', isDefault: false })}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Opção
                      </Button>
                    </div>
                    
                    {optionFields.map((option, index) => (
                      <div key={option.id} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            placeholder="Valor"
                            {...form.register(`fieldOptions.${index}.value` as const)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Rótulo"
                            {...form.register(`fieldOptions.${index}.label` as const)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createFieldMutation.isPending}
                  >
                    {createFieldMutation.isPending ? 'Criando...' : 'Criar Campo'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {renderModuleSelector()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">Campos Customizados</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          {renderFieldsList()}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {renderStatsOverview()}
          
          {moduleStats.fieldsByType && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo de Campo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(moduleStats.fieldsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span>{FIELD_TYPE_CONFIG[type as FieldType]?.label || type}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}