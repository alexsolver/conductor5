import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Building2,
  FolderTree,
  Settings,
  Palette,
  Hash,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// Schemas de validação
const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean().default(true)
});

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().default("#3b82f6"),
  icon: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().default(1)
});

const subcategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  color: z.string().default("#3b82f6"),
  icon: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().default(1)
});

const actionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  subcategoryId: z.string().min(1, "Subcategoria é obrigatória"),
  estimatedTimeMinutes: z.number().optional(),
  color: z.string().default("#3b82f6"),
  icon: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().default(1)
});

const fieldOptionSchema = z.object({
  fieldName: z.string().min(1, "Nome do campo é obrigatório"),
  value: z.string().min(1, "Valor é obrigatório"),
  displayLabel: z.string().min(1, "Rótulo é obrigatório"),
  color: z.string().default("#3b82f6"),
  icon: z.string().optional(),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().default(1)
});

const numberingConfigSchema = z.object({
  prefix: z.string().min(1, "Prefixo é obrigatório"),
  yearFormat: z.enum(['2', '4']).default('4'),
  sequentialDigits: z.number().min(4).max(10).default(6),
  separator: z.string().default('-'),
  resetYearly: z.boolean().default(true)
});

const validationRuleSchema = z.object({
  fieldName: z.string().min(1, "Nome do campo é obrigatório"),
  isRequired: z.boolean().default(false),
  validationPattern: z.string().optional(),
  errorMessage: z.string().optional(),
  defaultValue: z.string().optional()
});

interface Company {
  id: string;
  name: string;
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  companyId: string;
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  color: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
}

interface Action {
  id: string;
  name: string;
  description?: string;
  subcategoryId: string;
  estimatedTimeMinutes?: number;
  color: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
}

interface FieldOption {
  id: string;
  fieldName: string;
  value: string;
  displayLabel: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
}

interface NumberingConfig {
  id: string;
  prefix: string;
  yearFormat: '2' | '4';
  sequentialDigits: number;
  separator: string;
  resetYearly: boolean;
  companyId: string;
}

interface ValidationRule {
  id: string;
  fieldName: string;
  isRequired: boolean;
  validationPattern?: string;
  errorMessage?: string;
  defaultValue?: string;
  companyId: string;
}

const TicketConfiguration: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [activeTab, setActiveTab] = useState('hierarchy');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Forms
  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3b82f6',
      icon: '',
      active: true,
      sortOrder: 1
    }
  });

  const subcategoryForm = useForm({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      color: '#3b82f6',
      icon: '',
      active: true,
      sortOrder: 1
    }
  });

  const actionForm = useForm({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      name: '',
      description: '',
      subcategoryId: '',
      estimatedTimeMinutes: undefined,
      color: '#3b82f6',
      icon: '',
      active: true,
      sortOrder: 1
    }
  });

  const fieldOptionForm = useForm({
    resolver: zodResolver(fieldOptionSchema),
    defaultValues: {
      fieldName: '',
      value: '',
      displayLabel: '',
      color: '#3b82f6',
      icon: '',
      isDefault: false,
      active: true,
      sortOrder: 1
    }
  });

  const numberingForm = useForm({
    resolver: zodResolver(numberingConfigSchema),
    defaultValues: {
      prefix: 'T',
      yearFormat: '4' as const,
      sequentialDigits: 6,
      separator: '-',
      resetYearly: true
    }
  });

  const validationForm = useForm({
    resolver: zodResolver(validationRuleSchema),
    defaultValues: {
      fieldName: '',
      isRequired: false,
      validationPattern: '',
      errorMessage: '',
      defaultValue: ''
    }
  });

  // Queries
  const { data: companies = [] } = useQuery({
    queryKey: ['/api/customers/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers/companies');
      return response.json();
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await apiRequest('GET', `/api/ticket-config/categories?companyId=${selectedCompany}`);
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!selectedCompany
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await apiRequest('GET', `/api/ticket-config/subcategories?companyId=${selectedCompany}`);
      const result = await response.json();
      console.log('🔍 Subcategories response:', result);
      console.log('📊 Subcategories data count:', result?.data?.length || 0);
      console.log('📋 Subcategories data:', result?.data);
      return result.success ? result.data : [];
    },
    enabled: !!selectedCompany
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await apiRequest('GET', `/api/ticket-config/actions?companyId=${selectedCompany}`);
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!selectedCompany
  });

  const { data: fieldOptions = [] } = useQuery({
    queryKey: ['/api/ticket-config/field-options', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await apiRequest('GET', `/api/ticket-config/field-options?companyId=${selectedCompany}`);
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!selectedCompany
  });

  const { data: numberingConfig } = useQuery({
    queryKey: ['/api/ticket-config/numbering', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return null;
      const response = await apiRequest('GET', `/api/ticket-config/numbering?companyId=${selectedCompany}`);
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!selectedCompany
  });

  const { data: validationRules = [] } = useQuery({
    queryKey: ['/api/ticket-config/validation-rules', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await apiRequest('GET', `/api/ticket-config/validation-rules?companyId=${selectedCompany}`);
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!selectedCompany
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema>) => {
      const response = await apiRequest('POST', '/api/ticket-config/categories', {
        ...data,
        companyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedCompany] });
      setDialogOpen(false);
      categoryForm.reset();
      toast({ title: "Categoria criada com sucesso" });
    }
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subcategorySchema>) => {
      console.log('🔄 Creating subcategory with data:', data);
      const response = await apiRequest('POST', '/api/ticket-config/subcategories', {
        ...data,
        companyId: selectedCompany
      });
      const result = await response.json();
      console.log('✅ Subcategory creation response:', result);
      return result;
    },
    onSuccess: async (result) => {
      console.log('🔄 Invalidating and refetching subcategories query...');
      // Invalidate with the correct query key
      await queryClient.invalidateQueries({ queryKey: ['subcategories', selectedCompany] });
      // Force refetch to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['subcategories', selectedCompany] });
      setDialogOpen(false);
      subcategoryForm.reset();
      toast({ title: "Subcategoria criada com sucesso" });
    }
  });

  const createActionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof actionSchema>) => {
      const response = await apiRequest('POST', '/api/ticket-config/actions', {
        ...data,
        companyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', selectedCompany] });
      setDialogOpen(false);
      actionForm.reset();
      toast({ title: "Ação criada com sucesso" });
    }
  });

  const createFieldOptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fieldOptionSchema>) => {
      const response = await apiRequest('POST', '/api/ticket-config/field-options', {
        ...data,
        companyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/field-options'] });
      setDialogOpen(false);
      fieldOptionForm.reset();
      toast({ title: "Opção de campo criada com sucesso" });
    }
  });

  const saveNumberingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof numberingConfigSchema>) => {
      const response = await apiRequest('POST', '/api/ticket-config/numbering', {
        ...data,
        companyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/numbering'] });
      toast({ title: "Configuração de numeração salva com sucesso" });
    }
  });

  const createValidationRuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof validationRuleSchema>) => {
      const response = await apiRequest('POST', '/api/ticket-config/validation-rules', {
        ...data,
        companyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/validation-rules'] });
      setDialogOpen(false);
      validationForm.reset();
      toast({ title: "Regra de validação criada com sucesso" });
    }
  });

  // Helper functions
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const openDialog = (type: string, item?: any) => {
    setEditingItem({ type, ...item });
    
    // Initialize form values based on dialog type
    if (type === 'subcategory') {
      const formData = {
        name: item?.name || '',
        description: item?.description || '',
        categoryId: item?.categoryId || '',
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        active: item?.active !== undefined ? item.active : true,
        sortOrder: item?.sortOrder || 1
      };
      console.log('🔄 Initializing subcategory form with data:', formData);
      subcategoryForm.reset(formData);
    } else if (type === 'category') {
      categoryForm.reset({
        name: item?.name || '',
        description: item?.description || '',
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        active: item?.active !== undefined ? item.active : true,
        sortOrder: item?.sortOrder || 1
      });
    } else if (type === 'action') {
      actionForm.reset({
        name: item?.name || '',
        description: item?.description || '',
        subcategoryId: item?.subcategoryId || '',
        estimatedTimeMinutes: item?.estimatedTimeMinutes || undefined,
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        active: item?.active !== undefined ? item.active : true,
        sortOrder: item?.sortOrder || 1
      });
    } else if (type === 'field-option') {
      fieldOptionForm.reset({
        fieldName: item?.fieldName || '',
        value: item?.value || '',
        displayLabel: item?.displayLabel || '',
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        isDefault: item?.isDefault || false,
        active: item?.active !== undefined ? item.active : true,
        sortOrder: item?.sortOrder || 1
      });
    } else if (type === 'validation-rule') {
      validationForm.reset({
        fieldName: item?.fieldName || '',
        isRequired: item?.isRequired || false,
        validationPattern: item?.validationPattern || '',
        errorMessage: item?.errorMessage || '',
        defaultValue: item?.defaultValue || ''
      });
    }
    
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const filteredCategories = categories.filter((cat: Category) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Effect para carregar dados da numeração no form
  useEffect(() => {
    if (numberingConfig) {
      numberingForm.reset(numberingConfig);
    }
  }, [numberingConfig, numberingForm]);

  // Debug effect para monitorar mudanças nas subcategorias
  useEffect(() => {
    console.log('🔄 Subcategories data updated:', subcategories);
    console.log('📊 Total subcategories:', subcategories.length);
    if (categories.length > 0) {
      categories.forEach(cat => {
        const subCount = subcategories.filter(sub => sub.categoryId === cat.id).length;
        console.log(`📂 Category "${cat.name}" (${cat.id}): ${subCount} subcategories`);
      });
    }
  }, [subcategories, categories]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações de Tickets</h1>
        <p className="text-gray-600 mt-2">
          Configure hierarquia, classificação, numeração e validação dos tickets
        </p>
      </div>

      {/* Seletor de Empresa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Empresa Cliente</span>
          </CardTitle>
          <CardDescription>
            Selecione a empresa para configurar os metadados dos tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma empresa cliente" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company: Company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCompany && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hierarchy" className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4" />
              <span>Hierarquia</span>
            </TabsTrigger>
            <TabsTrigger value="classification" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Classificação</span>
            </TabsTrigger>
            <TabsTrigger value="numbering" className="flex items-center space-x-2">
              <Hash className="w-4 h-4" />
              <span>Numeração</span>
            </TabsTrigger>
            <TabsTrigger value="styling" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Cores e Estilos</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Validação</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Hierarquia */}
          <TabsContent value="hierarchy" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hierarquia de Classificação</CardTitle>
                    <CardDescription>
                      Categoria → Subcategoria → Ação
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button onClick={() => openDialog('category')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredCategories.map((category: Category) => (
                    <div key={category.id} className="border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleCategoryExpansion(category.id)}
                      >
                        <div className="flex items-center space-x-3">
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <h4 className="font-medium">{category.name}</h4>
                            {category.description && (
                              <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={category.active ? "default" : "secondary"}>
                            {category.active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔄 Opening subcategory dialog with categoryId:', category.id);
                              openDialog('subcategory', { categoryId: category.id });
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Subcategoria
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDialog('category', category);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {expandedCategories.has(category.id) && (
                        <div className="border-t bg-gray-50 p-4">
                          <div className="space-y-2">
                            {subcategories
                              .filter((sub: Subcategory) => {
                                // Debug log to see filtering
                                console.log('🔍 Filtering subcategory:', sub.name, 'categoryId:', sub.categoryId, 'target:', category.id);
                                return sub.categoryId === category.id;
                              })
                              .map((subcategory: Subcategory) => {
                                console.log('✅ Rendering subcategory:', subcategory);
                                return (
                                  <div key={subcategory.id} className="bg-white border rounded p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        <div 
                                          className="w-3 h-3 rounded"
                                          style={{ backgroundColor: subcategory.color }}
                                        />
                                        <span className="font-medium">{subcategory.name}</span>
                                        {subcategory.description && (
                                          <span className="text-sm text-gray-600">- {subcategory.description}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openDialog('action', { subcategoryId: subcategory.id })}
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Ação
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openDialog('subcategory', subcategory)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            
                            {/* Debug info - show all subcategories for this category */}
                            {process.env.NODE_ENV === 'development' && (
                              <div className="text-xs text-gray-400 mt-2">
                                Debug: {subcategories.filter(sub => sub.categoryId === category.id).length} subcategorias encontradas
                              </div>
                            )}

                            {/* Actions for each subcategory */}
                            {subcategories
                              .filter((sub: Subcategory) => sub.categoryId === category.id)
                              .map((subcategory: Subcategory) => (
                                <div key={subcategory.id} className="ml-6 space-y-1">
                                  {actions
                                    .filter((action: Action) => action.subcategoryId === subcategory.id)
                                    .map((action: Action) => (
                                      <div key={action.id} className="flex items-center justify-between py-1">
                                        <div className="flex items-center space-x-2">
                                          <div 
                                            className="w-2 h-2 rounded"
                                            style={{ backgroundColor: action.color }}
                                          />
                                          <span className="text-sm">{action.name}</span>
                                          {action.estimatedTimeMinutes && (
                                            <Badge variant="outline" className="text-xs">
                                              {action.estimatedTimeMinutes}min
                                            </Badge>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openDialog('action', action)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Classificação */}
          <TabsContent value="classification" className="space-y-6">
            {['status', 'priority', 'impact', 'urgency'].map((fieldName) => (
              <Card key={fieldName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="capitalize">{fieldName}</CardTitle>
                      <CardDescription>
                        Configure as opções para o campo {fieldName}
                      </CardDescription>
                    </div>
                    <Button onClick={() => openDialog('field-option', { fieldName })}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Opção
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fieldOptions
                      .filter((option: FieldOption) => option.fieldName === fieldName)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((option: FieldOption) => (
                        <div key={option.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: option.color }}
                              />
                              <span className="font-medium">{option.displayLabel}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {option.isDefault && (
                                <Badge variant="secondary" className="text-xs">Padrão</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDialog('field-option', option)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Valor: {option.value}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab: Numeração */}
          <TabsContent value="numbering" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Numeração</CardTitle>
                <CardDescription>
                  Configure o formato dos números dos tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...numberingForm}>
                  <form onSubmit={numberingForm.handleSubmit((data) => saveNumberingMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={numberingForm.control}
                        name="prefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prefixo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="T, INC, REQ" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={numberingForm.control}
                        name="separator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Separador</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="-" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={numberingForm.control}
                        name="yearFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Formato do Ano</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="2">2 dígitos (25)</SelectItem>
                                <SelectItem value="4">4 dígitos (2025)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={numberingForm.control}
                        name="sequentialDigits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dígitos Sequenciais</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="4" 
                                max="10"
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={numberingForm.control}
                      name="resetYearly"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Resetar Numeração Anualmente</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="bg-gray-50 p-4 rounded border">
                      <Label className="font-medium">Visualização:</Label>
                      <div className="mt-2 font-mono text-lg">
                        {numberingForm.watch('prefix')}-{numberingForm.watch('yearFormat') === '4' ? '2025' : '25'}{numberingForm.watch('separator')}{Array(numberingForm.watch('sequentialDigits')).fill('0').join('').slice(0, -3)}123
                      </div>
                    </div>

                    <Button type="submit" disabled={saveNumberingMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configuração
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Cores e Estilos */}
          <TabsContent value="styling" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cores e Ícones</CardTitle>
                <CardDescription>
                  Configure a aparência visual dos elementos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>As cores são configuradas individualmente em cada item nas outras abas.</p>
                  <p className="text-sm mt-2">Vá para "Hierarquia" ou "Classificação" para configurar cores específicas.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Validação */}
          <TabsContent value="validation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Regras de Validação</CardTitle>
                    <CardDescription>
                      Configure campos obrigatórios e regras personalizadas
                    </CardDescription>
                  </div>
                  <Button onClick={() => openDialog('validation-rule')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Regra
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Obrigatório</TableHead>
                      <TableHead>Validação</TableHead>
                      <TableHead>Valor Padrão</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationRules.map((rule: ValidationRule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.fieldName}</TableCell>
                        <TableCell>
                          {rule.isRequired ? (
                            <Badge className="bg-red-100 text-red-800">Obrigatório</Badge>
                          ) : (
                            <Badge variant="outline">Opcional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.validationPattern ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {rule.validationPattern}
                            </code>
                          ) : (
                            <span className="text-gray-400">Nenhuma</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.defaultValue || (
                            <span className="text-gray-400">Nenhum</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog('validation-rule', rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog para criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.type === 'category' && (editingItem.id ? 'Editar Categoria' : 'Nova Categoria')}
              {editingItem?.type === 'subcategory' && 'Nova Subcategoria'}
              {editingItem?.type === 'action' && 'Nova Ação'}
              {editingItem?.type === 'field-option' && 'Nova Opção de Campo'}
              {editingItem?.type === 'validation-rule' && 'Nova Regra de Validação'}
            </DialogTitle>
          </DialogHeader>

          {/* Formulário de Categoria */}
          {editingItem?.type === 'category' && (
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da categoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição da categoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={categoryForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={categoryForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending}>
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Formulário de Subcategoria */}
          {editingItem?.type === 'subcategory' && (
            <Form {...subcategoryForm}>
              <form onSubmit={subcategoryForm.handleSubmit((data) => createSubcategoryMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={subcategoryForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={subcategoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da subcategoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={subcategoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição da subcategoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={subcategoryForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subcategoryForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSubcategoryMutation.isPending}>
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Formulário de Ação */}
          {editingItem?.type === 'action' && (
            <Form {...actionForm}>
              <form onSubmit={actionForm.handleSubmit((data) => createActionMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={actionForm.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={editingItem.subcategoryId || field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories.map((subcategory: Subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={actionForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da ação" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={actionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição da ação" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={actionForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={actionForm.control}
                    name="estimatedTimeMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo Estimado (min)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={actionForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createActionMutation.isPending}>
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Formulário de Opção de Campo */}
          {editingItem?.type === 'field-option' && (
            <Form {...fieldOptionForm}>
              <form onSubmit={fieldOptionForm.handleSubmit((data) => createFieldOptionMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={fieldOptionForm.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={editingItem.fieldName || field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o campo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="priority">Prioridade</SelectItem>
                          <SelectItem value="impact">Impacto</SelectItem>
                          <SelectItem value="urgency">Urgência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={fieldOptionForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="valor_interno" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fieldOptionForm.control}
                    name="displayLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rótulo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Rótulo exibido" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={fieldOptionForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fieldOptionForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={fieldOptionForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Opção Padrão</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createFieldOptionMutation.isPending}>
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Formulário de Regra de Validação */}
          {editingItem?.type === 'validation-rule' && (
            <Form {...validationForm}>
              <form onSubmit={validationForm.handleSubmit((data) => createValidationRuleMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={validationForm.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o campo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="subject">Assunto</SelectItem>
                          <SelectItem value="description">Descrição</SelectItem>
                          <SelectItem value="priority">Prioridade</SelectItem>
                          <SelectItem value="impact">Impacto</SelectItem>
                          <SelectItem value="urgency">Urgência</SelectItem>
                          <SelectItem value="category">Categoria</SelectItem>
                          <SelectItem value="subcategory">Subcategoria</SelectItem>
                          <SelectItem value="action">Ação</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={validationForm.control}
                  name="validationPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padrão de Validação (Regex)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="^[A-Za-z0-9]+$" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={validationForm.control}
                  name="errorMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Erro</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mensagem exibida em caso de erro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={validationForm.control}
                  name="defaultValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Padrão</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Valor padrão do campo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={validationForm.control}
                  name="isRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Campo Obrigatório</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createValidationRuleMutation.isPending}>
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketConfiguration;