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
  { value: 'customers', label: '[TRANSLATION_NEEDED]' },
  { value: 'tickets', label: '[TRANSLATION_NEEDED]' },
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
      const response = await fetch("
        headers: {
          'Authorization': "
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
          'Authorization': "
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
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: 'destructive'
      });
    }
  });
  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, ...fieldData }: Partial<CustomFieldMetadata> & { fieldId: string }) => {
      const response = await fetch("
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': "
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
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: 'destructive'
      });
    }
  });
  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await fetch("
        method: 'DELETE',
        headers: {
          'Authorization': "
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
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: 'destructive'
      });
    }
  });
  const renderFieldsList = () => {
    if (isLoading) {
      return (
        <div className=""
          {[1, 2, 3].map((i) => (
            <Card key={i} className=""
              <CardContent className=""
                <div className=""
                  <div className=""
                    <div className="text-lg">"</div>
                    <div className="text-lg">"</div>
                  </div>
                  <div className=""
                    <div className="text-lg">"</div>
                    <div className="text-lg">"</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    return (
      <div className=""
        {moduleFields.length === 0 ? (
          <Card className=""
            <CardContent className=""
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className=""
                Nenhum campo customizado encontrado
              </h3>
              <p className=""
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
            <Card key={field.id} className=""
              <CardContent className=""
                <div className=""
                  <div className=""
                    <div className=""
                      <div className=""
                        <GripVertical className="w-4 h-4 cursor-move" />
                        <span className=""
                          #{index + 1}
                        </span>
                      </div>
                      <h3 className="text-lg">"{field.fieldLabel}</h3>
                      <Badge variant="secondary" className=""
                        {FIELD_TYPE_CONFIG[field.fieldType as FieldType]?.label}
                      </Badge>
                      {field.isRequired && (
                        <Badge variant="destructive" className=""
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    
                    <div className=""
                      <p className=""
                        <span className="text-lg">"Campo técnico:</span>
                        <code className=""
                          {field.fieldName}
                        </code>
                      </p>
                      
                      {field.fieldOptions?.helpText && (
                        <p className=""
                          "{field.fieldOptions.helpText}"
                        </p>
                      )}
                      
                      <div className=""
                        <span>Criado: {new Date(field.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span>Ordem: {field.displayOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className=""
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(field)}
                      className="hover:bg-blue-50 hover:text-blue-700"
                      title='[TRANSLATION_NEEDED]'
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFieldToDelete(field)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title='[TRANSLATION_NEEDED]'
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
    <nav className=""
      <Home className="w-4 h-4" />
      <ChevronRight className="w-4 h-4" />
      <span>Administração</span>
      <ChevronRight className="w-4 h-4" />
      <span className="text-lg">"Campos Customizados</span>
    </nav>
  );
  return (
    <div className=""
      <Breadcrumb />
      
      <div className=""
        <div>
          <h1 className="text-lg">"Administrador de Campos Customizados</h1>
          <p className=""
            Configure campos personalizados para diferentes módulos do sistema
          </p>
        </div>
        <div className=""
          <Settings className="w-5 h-5 text-gray-400" />
          <Badge variant="outline" className=""
            Beta
          </Badge>
        </div>
      </div>
      <Card className=""
        <CardContent className=""
          <div className=""
            <div className=""
              <Label htmlFor="module-select" className=""
                Módulo:
              </Label>
              <Select value={selectedModule} onValueChange={(value: ModuleType) => setSelectedModule(value)}>
                <SelectTrigger className=""
                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                <div className=""
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando campos...
                </div>
              )}
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className=""
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Campo
                </Button>
              </DialogTrigger>
              <DialogContent className=""
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
        <TabsContent value="fields" className=""
          {renderFieldsList()}
        </TabsContent>
        <TabsContent value="statistics>
          <div className=""
            <Card>
              <CardHeader>
                <CardTitle className=""
                  <Package className="w-5 h-5" />
                  Estatísticas do Módulo - {MODULE_TYPES.find(m => m.value === selectedModule)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=""
                  <div className=""
                    <div className="text-lg">"{moduleFields.length}</div>
                    <div className="text-lg">"Total de Campos</div>
                  </div>
                  <div className=""
                    <div className=""
                      {moduleFields.filter((f: CustomFieldMetadata) => f.isRequired).length}
                    </div>
                    <div className="text-lg">"Campos Obrigatórios</div>
                  </div>
                  <div className=""
                    <div className=""
                      {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'text').length}
                    </div>
                    <div className="text-lg">"Campos de Texto</div>
                  </div>
                  <div className=""
                    <div className=""
                      {moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === 'select').length}
                    </div>
                    <div className="text-lg">"Campos de Seleção</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo de Campo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=""
                  {Object.entries(FIELD_TYPE_CONFIG).map(([type, config]) => {
                    const count = moduleFields.filter((f: CustomFieldMetadata) => f.fieldType === type).length;
                    const percentage = moduleFields.length > 0 ? (count / moduleFields.length) * 100 : 0;
                    
                    return (
                      <div key={type} className=""
                        <div className=""
                          <div className="text-lg">"</div>
                          <span className="text-lg">"{config.label}</span>
                        </div>
                        <div className=""
                          <div className=""
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: "%` }}
                            ></div>
                          </div>
                          <span className="text-lg">"{count}</span>
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
          <DialogContent className=""
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
          <DialogContent className=""
            <DialogHeader>
              <DialogTitle className=""
                <AlertCircle className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o campo "{fieldToDelete.fieldLabel}"? 
                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </DialogDescription>
            </DialogHeader>
            <div className=""
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
    <form onSubmit={handleSubmit} className=""
      <div className=""
        <div className=""
          <Label htmlFor="fieldName">Nome do Campo (Técnico)</Label>
          <Input
            id="fieldName"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            placeholder="ex: telefone_adicional"
            required
          />
        </div>
        <div className=""
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
      <div className=""
        <Label htmlFor="fieldType">Tipo de Campo</Label>
        <Select value={formData.fieldType} onValueChange={(value: FieldType) => setFormData({ ...formData, fieldType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div>
                  <div className="text-lg">"{config.label}</div>
                  <div className="text-lg">"{config.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className=""
        <Label htmlFor="helpText">Texto de Ajuda (Opcional)</Label>
        <Textarea
          id="helpText"
          value={formData.helpText || ''}
          onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
          placeholder="Descrição ou instruções para o usuário"
          rows={3}
        />
      </div>
      <div className=""
        <Checkbox
          id="isRequired"
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
        />
        <Label htmlFor="isRequired" className=""
          Campo obrigatório
        </Label>
      </div>
      <div className=""
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
    <form onSubmit={handleSubmit} className=""
      <div className=""
        <div className=""
          <Label htmlFor="fieldName">Nome do Campo (Técnico)</Label>
          <Input
            id="fieldName"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            disabled
            className="bg-gray-50"
          />
          <p className="text-lg">"O nome técnico não pode ser alterado</p>
        </div>
        <div className=""
          <Label htmlFor="fieldLabel">Label (Exibição)</Label>
          <Input
            id="fieldLabel"
            value={formData.fieldLabel}
            onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
            required
          />
        </div>
      </div>
      <div className=""
        <Label htmlFor="fieldType">Tipo de Campo</Label>
        <Select value={formData.fieldType} onValueChange={(value: FieldType) => setFormData({ ...formData, fieldType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div>
                  <div className="text-lg">"{config.label}</div>
                  <div className="text-lg">"{config.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className=""
        <Label htmlFor="helpText">Texto de Ajuda (Opcional)</Label>
        <Textarea
          id="helpText"
          value={formData.helpText || ''}
          onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
          rows={3}
        />
      </div>
      <div className=""
        <Checkbox
          id="isRequired"
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
        />
        <Label htmlFor="isRequired" className=""
          Campo obrigatório
        </Label>
      </div>
      <div className=""
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