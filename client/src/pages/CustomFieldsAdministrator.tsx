
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

interface CustomField {
  id: string;
  name: string;
  fieldType: string;
  moduleType: string;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Área de Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
];

const MODULE_TYPES = [
  { value: 'customers', label: 'Clientes' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'beneficiaries', label: 'Beneficiários' },
  { value: 'materials', label: 'Materiais' },
  { value: 'services', label: 'Serviços' },
  { value: 'locations', label: 'Localizações' },
];

export default function CustomFieldsAdministrator() {
  const { isAuthenticated, user } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('customers');
  const [formData, setFormData] = useState({
    name: '',
    fieldType: 'text',
    moduleType: 'customers',
    isRequired: false,
    displayOrder: 1,
  });

  // ✅ 1QA.MD: Load fields for selected module
  const loadFields = async (moduleType: string) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      console.log(`🔍 [CUSTOM-FIELDS] Loading fields for module: ${moduleType}`);
      
      const response = await axios.get(`/api/custom-fields/fields/${moduleType}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data?.success) {
        setFields(response.data.data || []);
        console.log(`✅ [CUSTOM-FIELDS] Loaded ${response.data.data?.length || 0} fields`);
      } else {
        console.error('❌ [CUSTOM-FIELDS] Invalid response format:', response.data);
        setFields([]);
      }
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error loading fields:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
      }
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 1QA.MD: Create new custom field
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      console.error('❌ [CUSTOM-FIELDS] User not authenticated');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [CUSTOM-FIELDS] Creating field:', formData);
      
      const response = await axios.post('/api/custom-fields/fields', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data?.success) {
        console.log('✅ [CUSTOM-FIELDS] Field created successfully');
        setShowForm(false);
        setFormData({
          name: '',
          fieldType: 'text',
          moduleType: selectedModule,
          isRequired: false,
          displayOrder: 1,
        });
        await loadFields(selectedModule);
      } else {
        console.error('❌ [CUSTOM-FIELDS] Failed to create field:', response.data);
      }
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error creating field:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ 1QA.MD: Delete custom field
  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;
    
    try {
      setLoading(true);
      
      const response = await axios.delete(`/api/custom-fields/fields/${fieldId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data?.success) {
        console.log('✅ [CUSTOM-FIELDS] Field deleted successfully');
        await loadFields(selectedModule);
      } else {
        console.error('❌ [CUSTOM-FIELDS] Failed to delete field:', response.data);
      }
    } catch (error) {
      console.error('❌ [CUSTOM-FIELDS] Error deleting field:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load fields when module changes
  useEffect(() => {
    if (selectedModule) {
      loadFields(selectedModule);
    }
  }, [selectedModule, isAuthenticated]);

  // ✅ Update form module type when selected module changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, moduleType: selectedModule }));
  }, [selectedModule]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração de Campos Personalizados</h1>
          <p className="text-muted-foreground">
            Configure campos personalizados para diferentes módulos do sistema
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Campo
        </Button>
      </div>

      {/* Module Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Módulo</CardTitle>
          <CardDescription>
            Escolha o módulo para visualizar e gerenciar seus campos personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-64">
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
        </CardContent>
      </Card>

      {/* Create Field Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Campo Personalizado</CardTitle>
            <CardDescription>
              Defina as propriedades do novo campo personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateField} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Campo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Telefone Secundário"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="fieldType">Tipo do Campo</Label>
                  <Select value={formData.fieldType} onValueChange={(value) => setFormData(prev => ({ ...prev, fieldType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isRequired">Campo Obrigatório</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Campo'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Fields List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Campos Personalizados - {MODULE_TYPES.find(m => m.value === selectedModule)?.label}
          </CardTitle>
          <CardDescription>
            Lista de campos personalizados configurados para este módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando campos...</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum campo personalizado encontrado para este módulo.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FIELD_TYPES.find(t => t.value === field.fieldType)?.label || field.fieldType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={field.isRequired ? "default" : "secondary"}>
                        {field.isRequired ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>{field.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant={field.isActive ? "default" : "secondary"}>
                        {field.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(field.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
