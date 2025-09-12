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
  sortOrder: z.number().default(1),
  statusType: z.enum(['open', 'paused', 'resolved', 'closed']).optional()
}).refine((data) => {
  // Se o campo for 'status', statusType é obrigatório
  if (data.fieldName === 'status') {
    return data.statusType !== undefined;
  }
  return true;
}, {
  message: "Tipo de status é obrigatório para o campo Status",
  path: ["statusType"]
});

const numberingConfigSchema = z.object({
  prefix: z.string().min(1, "Prefixo é obrigatório"),
  firstSeparator: z.string().default(''),
  yearFormat: z.enum(['2', '4']).default('4'),
  sequentialDigits: z.number().min(4).max(10).default(6),
  separator: z.string().default(''),
  resetYearly: z.boolean().default(true)
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
  statusType?: 'open' | 'paused' | 'resolved' | 'closed';
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
      sortOrder: 1,
      statusType: undefined
    }
  });

  const numberingForm = useForm({
    resolver: zodResolver(numberingConfigSchema),
    defaultValues: {
      prefix: 'T',
      firstSeparator: '',
      yearFormat: '4' as const,
      sequentialDigits: 6,
      separator: '',
      resetYearly: true
    }
  });

  // Queries
  const { data: companiesData } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/companies');
      return response.json();
    }
  });

  // Handle different response formats from the API
  const companies = (() => {
    console.log('🔍 [COMPANIES-DEBUG] Raw API response:', companiesData);
    if (!companiesData) {
      console.log('❌ [COMPANIES-DEBUG] No data received');
      return [];
    }
    if (Array.isArray(companiesData)) {
      console.log('✅ [COMPANIES-DEBUG] Array format:', companiesData.length, 'companies');
      return companiesData;
    }
    if ((companiesData as any).success && Array.isArray((companiesData as any).data)) {
      console.log('✅ [COMPANIES-DEBUG] Success wrapper format:', (companiesData as any).data.length, 'companies');
      return (companiesData as any).data;
    }
    if ((companiesData as any).data && Array.isArray((companiesData as any).data)) {
      console.log('✅ [COMPANIES-DEBUG] Data wrapper format:', (companiesData as any).data.length, 'companies');
      return (companiesData as any).data;
    }
    console.log('❌ [COMPANIES-DEBUG] Unknown format, returning empty array');
    return [];
  })();

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

  const { data: fieldOptions = [], refetch: refetchFieldOptions } = useQuery({
    queryKey: ['field-options', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      // Add timestamp to prevent caching issues
      const timestamp = Date.now();
      const response = await apiRequest('GET', `/api/ticket-config/field-options?companyId=${selectedCompany}&_t=${timestamp}`);
      const result = await response.json();
      console.log('🔍 Field options query result for company:', selectedCompany, result);

      // Validate data structure
      if (!result.success || !Array.isArray(result.data)) {
        console.error('❌ Invalid field options response:', result);
        return [];
      }

      return result.data;
    },
    enabled: !!selectedCompany,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false,
    retry: 3,
    // Force network requests, ignore cache
    networkMode: 'always'
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
      const response = await apiRequest('POST', '/api/ticket-config/subcategories', {
        ...data,
        companyId: selectedCompany
      });
      const result = await response.json();
      return result;
    },
    onSuccess: async (result) => {
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

  // UPDATE MUTATIONS - Adicionando funcionalidade de edição
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema> & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/ticket-config/categories/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['field-options'] }); // Invalidar cache das cores
      setDialogOpen(false);
      categoryForm.reset();
      toast({ title: "Categoria atualizada com sucesso" });
    }
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subcategorySchema> & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/ticket-config/subcategories/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['field-options'] }); // Invalidar cache das cores
      setDialogOpen(false);
      subcategoryForm.reset();
      toast({ title: "Subcategoria atualizada com sucesso" });
    }
  });

  const updateActionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof actionSchema> & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/ticket-config/actions/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['field-options'] }); // Invalidar cache das cores
      setDialogOpen(false);
      actionForm.reset();
      toast({ title: "Ação atualizada com sucesso" });
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
    onSuccess: async (result) => {
      console.log('✅ Field option created successfully:', result);

      // Complete cache reset strategy
      const queryKey = ['field-options', selectedCompany];

      // 1. Remove from cache
      queryClient.removeQueries({ queryKey });

      // 2. Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['field-options'] });

      // 3. Force immediate refetch with fresh data
      await queryClient.refetchQueries({ 
        queryKey, 
        type: 'active',
        exact: true 
      });

      // 4. Reset stale time to force immediate refresh
      queryClient.setQueryData(queryKey, undefined);

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
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/numbering', selectedCompany] });
      toast({ title: "Configuração de numeração salva com sucesso" });
    }
  });

  const updateFieldOptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fieldOptionSchema> & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/ticket-config/field-options/${id}`, {
        ...updateData,
        companyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: async (result) => {
      console.log('✅ Field option updated successfully:', result);
      
      // Invalidate cache sem forçar refetch imediato
      queryClient.invalidateQueries({ queryKey: ['field-options', selectedCompany] });
      
      setDialogOpen(false);
      fieldOptionForm.reset();
      toast({ 
        title: "Opção atualizada com sucesso",
        description: "A opção foi atualizada no sistema."
      });
    },
    onError: (error) => {
      console.error('❌ Error updating field option:', error);
      toast({ 
        title: "Erro ao atualizar opção",
        description: "Não foi possível atualizar a opção.",
        variant: "destructive"
      });
    }
  });

  const updateFieldOptionStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await apiRequest('PUT', `/api/ticket-config/field-options/${id}/status`, {
        active,
        companyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: async (result) => {
      console.log('✅ Field option status updated successfully:', result);
      
      // Invalidate cache sem forçar refetch imediato
      queryClient.invalidateQueries({ queryKey: ['field-options', selectedCompany] });
      
      toast({ 
        title: "Status atualizado com sucesso",
        description: "A opção foi ativada/desativada."
      });
    },
    onError: (error) => {
      console.error('❌ Error updating field option status:', error);
      toast({ 
        title: "Erro ao atualizar status",
        description: "Não foi possível alterar o status da opção.",
        variant: "destructive"
      });
    }
  });

  const deleteFieldOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const response = await apiRequest('DELETE', `/api/ticket-config/field-options/${optionId}`);
      return response.json();
    },
    onSuccess: async () => {
      // Complete cache reset strategy
      const queryKey = ['field-options', selectedCompany];

      // 1. Remove from cache
      queryClient.removeQueries({ queryKey });

      // 2. Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['field-options'] });

      // 3. Force immediate refetch with fresh data
      await queryClient.refetchQueries({ 
        queryKey, 
        type: 'active',
        exact: true 
      });

      toast({ title: "Opção de campo excluída com sucesso" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir opção", 
        description: error.message || "Erro desconhecido",
        variant: "destructive" 
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest('DELETE', `/api/ticket-config/categories/${categoryId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedCompany] });
      toast({ title: "Categoria excluída com sucesso" });
    }
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (subcategoryId: string) => {
      const response = await apiRequest('DELETE', `/api/ticket-config/subcategories/${subcategoryId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', selectedCompany] });
      toast({ title: "Subcategoria excluída com sucesso" });
    }
  });

  const deleteActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest('DELETE', `/api/ticket-config/actions/${actionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', selectedCompany] });
      toast({ title: "Ação excluída com sucesso" });
    }
  });

  // Mutation para copiar estrutura hierárquica
  const copyHierarchyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ticket-config/copy-hierarchy', {
        sourceCompanyId: '00000000-0000-0000-0000-000000000001', // Default company
        targetCompanyId: selectedCompany
      });
      return response.json();
    },
    onSuccess: async (result) => {
      console.log('✅ Hierarchy copied successfully:', result);
      
      // Invalidate all related queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories', selectedCompany] }),
        queryClient.invalidateQueries({ queryKey: ['subcategories', selectedCompany] }),
        queryClient.invalidateQueries({ queryKey: ['actions', selectedCompany] }),
        queryClient.invalidateQueries({ queryKey: ['field-options', selectedCompany] }),
        queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/numbering', selectedCompany] })
      ]);
      
      // Force refetch to ensure UI updates
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['categories', selectedCompany] }),
        queryClient.refetchQueries({ queryKey: ['subcategories', selectedCompany] }),
        queryClient.refetchQueries({ queryKey: ['actions', selectedCompany] }),
        queryClient.refetchQueries({ queryKey: ['field-options', selectedCompany] }),
        queryClient.refetchQueries({ queryKey: ['/api/ticket-config/numbering', selectedCompany] })
      ]);
      
      toast({ 
        title: "Estrutura copiada com sucesso",
        description: `${result.summary || 'Toda a estrutura hierárquica foi copiada da empresa Default.'}`
      });
    },
    onError: (error: any) => {
      console.error('❌ Error copying hierarchy:', error);
      toast({ 
        title: "Erro ao copiar estrutura",
        description: error.message || "Não foi possível copiar a estrutura hierárquica.",
        variant: "destructive"
      });
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
        // Fix: handle both camelCase and snake_case from backend
        categoryId: item?.categoryId || item?.category_id || '',
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        active: item?.active !== undefined ? item.active : true,
        sortOrder: item?.sortOrder || item?.sort_order || 1
      };
      console.log('🔧 Opening subcategory dialog with data:', formData);
      subcategoryForm.reset(formData);
    } else if (type === 'category') {
      categoryForm.reset({
        name: item?.name || '',
        description: item?.description || '',
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        active: item?.active !== undefined ? item.active : true,
        sortOrder: item?.sortOrder || item?.sort_order || 1
      });
    } else if (type === 'action') {
      const formData = {
        name: item?.name || '',
        description: item?.description || '',
        // Fix: handle both camelCase and snake_case from backend
        subcategoryId: item?.subcategoryId || item?.subcategory_id || '',
        estimatedTimeMinutes: item?.estimatedTimeMinutes || item?.estimated_time_minutes || undefined,
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        active: item?.active !== undefined ? item.active : true,
        sortOrder: item?.sortOrder || item?.sort_order || 1
      };
      console.log('🔧 Opening action dialog with data:', formData);
      actionForm.reset(formData);
    } else if (type === 'field-option') {
      // Handle both normalized (from frontend mapping) and raw database format
      fieldOptionForm.reset({
        fieldName: item?.fieldName || item?.field_name || '',
        value: item?.value || '',
        displayLabel: item?.displayLabel || item?.label || '',
        color: item?.color || '#3b82f6',
        icon: item?.icon || '',
        isDefault: item?.isDefault || item?.is_default || false,
        active: item?.active !== undefined ? item.active : (item?.is_active !== undefined ? item.is_active : true),
        sortOrder: item?.sortOrder || item?.sort_order || 1,
        statusType: item?.statusType || item?.status_type || undefined
      });
    }

    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleCopyHierarchy = () => {
    if (confirm(`Tem certeza que deseja copiar toda a estrutura hierárquica da empresa Default para esta empresa?\n\nEsta ação irá:\n• Copiar todas as categorias, subcategorias e ações\n• Copiar todas as opções de campos (status, prioridade, impacto, urgência)\n• Copiar configuração de numeração\n\nEsta operação não pode ser desfeita.`)) {
      copyHierarchyMutation.mutate();
    }
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



  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações de Tickets</h1>
        <p className="text-gray-600 mt-2">
          Configure hierarquia, classificação e numeração dos tickets
        </p>
      </div>

      {/* Seletor de Empresa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Empresa</span>
          </CardTitle>
          <CardDescription>
            Selecione a empresa para configurar os metadados dos tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company: Company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Botão para copiar estrutura da empresa Default */}
          {selectedCompany && selectedCompany !== '00000000-0000-0000-0000-000000000001' && (
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Copiar Estrutura Hierárquica</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Copie toda a estrutura hierárquica (categorias, subcategorias, ações e opções de campos) 
                  da empresa Default para esta empresa como ponto de partida.
                </p>
              </div>
              <Button
                onClick={() => handleCopyHierarchy()}
                disabled={copyHierarchyMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {copyHierarchyMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Copiando...
                  </>
                ) : (
                  <>
                    <FolderTree className="w-4 h-4 mr-2" />
                    Copiar Estrutura
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCompany && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hierarchy" className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4" />
              <span>Categorização</span>
            </TabsTrigger>
            <TabsTrigger value="classification" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Classificação</span>
            </TabsTrigger>
            <TabsTrigger value="numbering" className="flex items-center space-x-2">
              <Hash className="w-4 h-4" />
              <span>Numeração</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Hierarquia */}
          <TabsContent value="hierarchy" className="space-y-6">
            {/* Header com estatísticas e ações */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FolderTree className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categorias</p>
                      <p className="text-2xl font-bold">{categories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Subcategorias</p>
                      <p className="text-2xl font-bold">{subcategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Plus className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ações</p>
                      <p className="text-2xl font-bold">{actions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Button 
                    onClick={() => openDialog('category')} 
                    className="w-full h-full flex flex-col items-center justify-center space-y-2"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm">Nova Categoria</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FolderTree className="w-5 h-5" />
                      <span>Estrutura Hierárquica</span>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span>Categoria (Nível 1)</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Subcategoria (Nível 2)</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded"></div>
                          <span>Ação (Nível 3)</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar categorias..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderTree className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'Tente ajustar os termos da busca.' : 'Comece criando sua primeira categoria.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => openDialog('category')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeira Categoria
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCategories.map((category: Category) => (
                      <div key={category.id} className="border rounded-lg overflow-hidden">
                        {/* Header da Categoria */}
                        <div 
                          className="flex items-center justify-between p-4 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => toggleCategoryExpansion(category.id)}
                        >
                          <div className="flex items-center space-x-3">
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="w-5 h-5 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-blue-600" />
                            )}
                            <div 
                              className="w-5 h-5 rounded border-2 border-white shadow-sm"
                              style={{ backgroundColor: category.color }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-semibold text-gray-900">{category.name}</h4>
                                <Badge variant={category.active ? "default" : "secondary"} className="text-xs">
                                  {category.active ? "Ativo" : "Inativo"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {subcategories.filter((sub: Subcategory) => sub.categoryId === category.id).length} subcategorias
                                </Badge>
                              </div>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog('subcategory', { categoryId: category.id });
                              }}
                              className="text-green-600 border-green-200 hover:bg-green-50"
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Tem certeza que deseja excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`)) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Conteúdo Expandido - Subcategorias */}
                        {expandedCategories.has(category.id) && (
                          <div className="bg-white">
                            {subcategories
                              .filter((sub: Subcategory) => sub.categoryId === category.id)
                              .map((subcategory: Subcategory) => (
                                <div key={subcategory.id} className="border-t border-gray-100">
                                  {/* Header da Subcategoria */}
                                  <div className="flex items-center justify-between p-4 pl-12 bg-green-50 hover:bg-green-100 transition-colors">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div 
                                        className="w-4 h-4 rounded border border-white shadow-sm"
                                        style={{ backgroundColor: subcategory.color }}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                          <span className="font-medium text-gray-900">{subcategory.name}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {actions.filter((action: any) => action.subcategoryId === subcategory.id).length} ações
                                          </Badge>
                                        </div>
                                        {subcategory.description && (
                                          <p className="text-sm text-gray-600 mt-1">{subcategory.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openDialog('action', { subcategoryId: subcategory.id })}
                                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
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
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm(`Tem certeza que deseja excluir a subcategoria "${subcategory.name}"? Esta ação não pode ser desfeita.`)) {
                                            deleteSubcategoryMutation.mutate(subcategory.id);
                                          }
                                        }}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Ações da Subcategoria */}
                                  <div className="pl-16 pr-4 pb-4">
                                    {actions
                                      .filter((action: Action) => action.subcategoryId === subcategory.id)
                                      .map((action: Action) => (
                                        <div key={action.id} className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-md mb-2 last:mb-0">
                                          <div className="flex items-center space-x-3">
                                            <div 
                                              className="w-3 h-3 rounded border border-white shadow-sm"
                                              style={{ backgroundColor: action.color }}
                                            />
                                            <span className="text-sm font-medium text-gray-900">{action.name}</span>
                                            {action.estimatedTimeMinutes && (
                                              <Badge variant="outline" className="text-xs">
                                                {action.estimatedTimeMinutes}min
                                              </Badge>
                                            )}
                                            {action.description && (
                                              <span className="text-xs text-gray-500">- {action.description}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => openDialog('action', action)}
                                            >
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                if (confirm(`Tem certeza que deseja excluir a ação "${action.name}"? Esta ação não pode ser desfeita.`)) {
                                                  deleteActionMutation.mutate(action.id);
                                                }
                                              }}
                                              className="text-red-600 hover:bg-red-50"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    {actions.filter((action: any) => action.subcategoryId === subcategory.id).length === 0 && (
                                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                                        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhuma ação cadastrada</p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openDialog('action', { subcategoryId: subcategory.id })}
                                          className="mt-2 text-orange-600"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Adicionar primeira ação
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                            {subcategories.filter((sub: Subcategory) => sub.categoryId === category.id).length === 0 && (
                              <div className="p-8 text-center text-gray-500 border-t">
                                <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm mb-4">Nenhuma subcategoria cadastrada nesta categoria</p>
                                <Button
                                  variant="outline"
                                  onClick={() => openDialog('subcategory', { categoryId: category.id })}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Criar primeira subcategoria
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Classificação */}
          <TabsContent value="classification" className="space-y-6">
            {/* Header com estatísticas gerais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <p className="text-2xl font-bold">
                        {fieldOptions.filter((opt: any) => opt.fieldName === 'status').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prioridades</p>
                      <p className="text-2xl font-bold">
                        {fieldOptions.filter((opt: any) => opt.fieldName === 'priority').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Impactos</p>
                      <p className="text-2xl font-bold">
                        {fieldOptions.filter((opt: any) => opt.fieldName === 'impact').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Urgências</p>
                      <p className="text-2xl font-bold">
                        {fieldOptions.filter((opt: any) => opt.fieldName === 'urgency').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seções de classificação em formato de lista */}
            {[
              { 
                key: 'status', 
                title: 'Status do Ticket', 
                description: 'Configure os diferentes estados que um ticket pode ter durante seu ciclo de vida',
                icon: Settings,
                color: 'blue'
              },
              { 
                key: 'priority', 
                title: 'Prioridade', 
                description: 'Defina os níveis de prioridade para classificar a importância dos tickets',
                icon: AlertTriangle,
                color: 'orange'
              },
              { 
                key: 'impact', 
                title: 'Impacto', 
                description: 'Configure os níveis de impacto que um problema pode causar no negócio',
                icon: Hash,
                color: 'green'
              },
              { 
                key: 'urgency', 
                title: 'Urgência', 
                description: 'Defina quão rapidamente um ticket precisa ser resolvido',
                icon: AlertTriangle,
                color: 'red'
              }
            ].map(({ key, title, description, icon: Icon, color }) => {
              // Ensure we have valid data and map database fields correctly
              const validFieldOptions = Array.isArray(fieldOptions) ? fieldOptions : [];

              const fieldOptionsForType = validFieldOptions
                .filter((option: any) => {
                  // Handle both camelCase and snake_case field names from DB
                  const fieldName = option.fieldName || option.field_name;
                  const matches = fieldName === key;

                  if (key === 'status') {
                    console.log('🔍 Filtering status option:', {
                      displayLabel: option.displayLabel || option.display_label,
                      fieldName: fieldName,
                      expected: key,
                      matches: matches,
                      rawOption: option
                    });
                  }
                  return matches;
                })
                .map((option: any) => ({
                  // Normalize the object structure
                  id: option.id,
                  fieldName: option.fieldName || option.field_name,
                  value: option.value,
                  displayLabel: option.displayLabel || option.display_label || option.label,
                  color: option.color,
                  icon: option.icon,
                  isDefault: option.isDefault || option.is_default,
                  active: option.active !== undefined ? option.active : (option.is_active !== undefined ? option.is_active : true),
                  sortOrder: option.sortOrder || option.sort_order || 1,
                  statusType: option.statusType || option.status_type
                }))
                .sort((a, b) => a.sortOrder - b.sortOrder);

              console.log(`🔍 Field options for ${key}:`, {
                total: validFieldOptions.length,
                filtered: fieldOptionsForType.length,
                options: fieldOptionsForType.map(o => ({ label: o.displayLabel, value: o.value }))
              });

              return (
                <Card key={key} className="overflow-hidden">
                  <CardHeader className={`bg-${color}-50 border-b`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-${color}-100 rounded-lg`}>
                          <Icon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{title}</CardTitle>
                          <CardDescription className="mt-1">
                            {description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-sm">
                          {fieldOptionsForType.length} opções
                        </Badge>
                        <Button 
                          onClick={() => openDialog('field-option', { fieldName: key })}
                          className={`bg-${color}-600 hover:bg-${color}-700`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Opção
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {fieldOptionsForType.length === 0 ? (
                      <div className="text-center py-12">
                        <div className={`w-16 h-16 mx-auto mb-4 bg-${color}-100 rounded-full flex items-center justify-center`}>
                          <Icon className={`w-8 h-8 text-${color}-400`} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma opção configurada
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Comece criando sua primeira opção para o campo {title.toLowerCase()}.
                        </p>
                        <Button 
                          onClick={() => openDialog('field-option', { fieldName: key })}
                          className={`bg-${color}-600 hover:bg-${color}-700`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Primeira Opção
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Opção</TableHead>
                            <TableHead>Valor</TableHead>
                            {key === 'status' && <TableHead>Tipo</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldOptionsForType.map((option: FieldOption, index: number) => (
                            <TableRow key={option.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium text-center">
                                {option.sortOrder}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                    style={{ backgroundColor: option.color }}
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {option.displayLabel}
                                    </div>
                                    {option.isDefault && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        Padrão
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {option.value}
                                </code>
                              </TableCell>
                              {key === 'status' && (
                                <TableCell>
                                  {option.statusType ? (
                                    <Badge variant="outline" className="text-xs">
                                      {
                                        option.statusType === 'open' ? 'Aberto' :
                                        option.statusType === 'paused' ? 'Pausado' :
                                        option.statusType === 'resolved' ? 'Resolvido' :
                                        option.statusType === 'closed' ? 'Fechado' : option.statusType
                                      }
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Switch 
                                    checked={option.active}
                                    onCheckedChange={(checked) => {
                                      updateFieldOptionStatusMutation.mutate({
                                        id: option.id,
                                        active: checked
                                      });
                                    }}
                                    className="data-[state=checked]:bg-green-600"
                                  />
                                  <Badge variant={option.active ? "default" : "secondary"} className="text-xs">
                                    {option.active ? "Ativo" : "Inativo"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDialog('field-option', option)}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Tem certeza que deseja excluir a opção "${option.displayLabel}"? Esta ação não pode ser desfeita.`)) {
                                        deleteFieldOptionMutation.mutate(option.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
              );
            })}

            {/* Card de dicas e boas práticas */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Settings className="w-5 h-5" />
                  <span>Dicas de Configuração</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">✨ Boas Práticas</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Mantenha o número de opções gerenciável (3-6 por campo)</li>
                      <li>• Use cores consistentes para facilitar identificação</li>
                      <li>• Configure sempre uma opção como padrão</li>
                      <li>• Use valores únicos e descritivos</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🎯 Ordem de Importância</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Prioridade: Crítica → Alta → Média → Baixa</li>
                      <li>• Urgência: Imediata → Alta → Normal → Baixa</li>
                      <li>• Impacto: Alto → Médio → Baixo → Mínimo</li>
                      <li>• Status: Aberto → Em Andamento → Resolvido → Fechado</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        name="firstSeparator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>1º Separador (Prefixo-Ano)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="-" maxLength={5} />
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
                            <FormLabel>2º Separador (Ano-Sequência)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="-" maxLength={5} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="flex items-end">
                        <FormField
                          control={numberingForm.control}
                          name="resetYearly"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full">
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
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded border">
                      <Label className="font-medium">Visualização:</Label>
                      <div className="mt-2 font-mono text-lg">
                        {numberingForm.watch('prefix') || 'T'}{numberingForm.watch('firstSeparator') || ''}{numberingForm.watch('yearFormat') === '4' ? '2025' : '25'}{numberingForm.watch('separator') || ''}{Array(numberingForm.watch('sequentialDigits') || 6).fill('0').join('').slice(0, -3)}123
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Exemplo: <span className="font-semibold">{numberingForm.watch('prefix') || 'T'}{numberingForm.watch('firstSeparator') || ''}{numberingForm.watch('yearFormat') === '4' ? '2025' : '25'}{numberingForm.watch('separator') || ''}{Array(numberingForm.watch('sequentialDigits') || 6).fill('0').join('').slice(0, -6)}000123</span>
                      </div>
                    </div>

                    <Button type="submit" disabled={saveNumberingMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {saveNumberingMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                    </Button>
                  </form>
                </Form>
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
                <div className="grid grid-cols-2 gap-4">
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
              <form onSubmit={fieldOptionForm.handleSubmit((data) => {
                if (editingItem.id) {
                  // Modo edição - usar updateFieldOptionMutation
                  updateFieldOptionMutation.mutate({ ...data, id: editingItem.id });
                } else {
                  // Modo criação - usar createFieldOptionMutation
                  createFieldOptionMutation.mutate(data);
                }
              })} className="space-y-4">
                {editingItem.fieldName ? (
                  <div className="space-y-2">
                    <FormLabel>Campo</FormLabel>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <span className="font-medium capitalize">
                        {editingItem.fieldName === 'status' && 'Status'}
                        {editingItem.fieldName === 'priority' && 'Prioridade'}
                        {editingItem.fieldName === 'impact' && 'Impacto'}
                        {editingItem.fieldName === 'urgency' && 'Urgência'}
                      </span>
                    </div>
                    <input type="hidden" {...fieldOptionForm.register('fieldName')} value={editingItem.fieldName} />
                  </div>
                ) : (
                  <FormField
                    control={fieldOptionForm.control}
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
                )}
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

                {/* Campo de Tipo de Status - apenas para status */}
                {fieldOptionForm.watch('fieldName') === 'status' && (
                  <FormField
                    control={fieldOptionForm.control}
                    name="statusType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} required>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">Aberto</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                            <SelectItem value="resolved">Resolvido</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketConfiguration;