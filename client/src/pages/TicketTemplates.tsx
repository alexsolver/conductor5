/**
 * ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATES FRONTEND
 * Clean Architecture - Presentation Layer
 * Interface para gerenciamento de templates de tickets
 * 
 * @module TicketTemplates
 * @compliance 1qa.md - Frontend Implementation
 * @updated 2025-09-09 - Refatorado para novos requisitos
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Settings,
  Building2,
  Globe,
  Users,
  ShieldCheck,
  AlertCircle,
  Search,
  Filter,
  Eye,
  CheckSquare,
} from 'lucide-react';
import DynamicCustomFields from '@/components/DynamicCustomFields';
import CustomFieldsEditor from '@/components/templates/CustomFieldsEditor';
import { DynamicSelect } from '@/components/DynamicSelect';


// ✅ 1QA.MD: Campos disponíveis do ticket para seleção em templates
const AVAILABLE_TICKET_FIELDS = [
  { name: 'description', label: 'Descrição' },
  { name: 'location', label: 'Localização' },
  { name: 'urgency', label: 'Urgência' },
  { name: 'tags', label: 'Tags' },
  { name: 'attachment', label: 'Anexos' },
  { name: 'comments', label: 'Comentários' },
  { name: 'due_date', label: 'Data de Vencimento' },
  { name: 'estimated_hours', label: 'Horas Estimadas' },
  { name: 'materials_services', label: 'Materiais e Serviços' },
];

// ✅ 1QA.MD: Schema de validação - tipo único de template
const templateFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  companyId: z.string().uuid().optional().nullable(),
  category: z.string().min(1, 'Categoria é obrigatória').max(100, 'Categoria muito longa'),
  subcategory: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['active', 'inactive']).default('inactive'),
  // ✅ Campos de detalhes do ticket para pré-preenchimento
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  impact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  ticketStatus: z.enum(['new', 'open', 'in_progress', 'pending', 'resolved', 'closed']).optional(),
  action: z.string().optional(),
  subject: z.string().optional(),
  ticketDescription: z.string().optional(),
  // ✅ Campos obrigatórios
  requiredFields: z.array(z.object({
    fieldName: z.string(),
    fieldType: z.string(),
    label: z.string(),
    required: z.boolean().default(true),
    order: z.number(),
  })).default([]),
  // ✅ Campos customizáveis opcionais
  customFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'url']),
    required: z.boolean().default(false),
    order: z.number(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
  })).default([]),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  isSystem: z.boolean().default(false),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// ✅ 1QA.MD: Interface atualizada para novos campos
interface TicketTemplate {
  id: string;
  tenantId: string;
  companyId: string | null;
  name: string;
  description: string | null;
  template_type: 'creation' | 'edit';
  category: string | null;
  subcategory: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'inactive';
  requiredFields: any[];
  customFields: any[];
  automation: any;
  workflow: any;
  tags: string[] | null;
  permissions: any[];
  isDefault: boolean;
  isSystem: boolean;
  usageCount: number;
  lastUsed: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface Company {
  id: string;
  name: string;
  displayName: string;
}

// ✅ 1QA.MD: Valores padrão para novos tipos
const getDefaultRequiredFields = () => [
  { fieldName: 'company', fieldType: 'select', label: 'Empresa', required: true, order: 1 },
  { fieldName: 'client', fieldType: 'select', label: 'Cliente', required: true, order: 2 },
  { fieldName: 'beneficiary', fieldType: 'select', label: 'Beneficiário', required: true, order: 3 },
  { fieldName: 'status', fieldType: 'select', label: 'Status', required: true, order: 4 },
  { fieldName: 'summary', fieldType: 'text', label: 'Resumo', required: true, order: 5 },
];

const apiRequest = async (method: string, url: string, data?: any) => {
  console.log(`🌐 [API-REQUEST] ${method} ${url}`, data ? { payload: data } : {});

  const config: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    console.log(`📋 [API-RESPONSE] ${method} ${url} - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API-ERROR] ${method} ${url} - Status: ${response.status}, Text: ${errorText}`);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `Erro HTTP ${response.status}` };
      }

      throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ [API-SUCCESS] ${method} ${url}`, { success: true });
    return result;
  } catch (error) {
    console.error(`💥 [API-CATCH] ${method} ${url}`, error);
    throw error;
  }
};

export default function TicketTemplates() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const [templateCustomFields, setTemplateCustomFields] = useState<any[]>([]);
  const [availableCustomFields, setAvailableCustomFields] = useState<any[]>([]);
  const [selectedCustomFieldIds, setSelectedCustomFieldIds] = useState<string[]>([]);
  const [enableTicketConfig, setEnableTicketConfig] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      companyId: null,
      category: 'Geral',
      subcategory: '',
      priority: 'medium',
      status: 'inactive',
      requiredFields: getDefaultRequiredFields(),
      customFields: [],
      tags: [],
      isDefault: false,
      isSystem: false,
    },
  });

  // ✅ 1QA.MD: Query para buscar empresas
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/companies');
        return Array.isArray(response) ? response : response.data || [];
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        return [];
      }
    },
  });

  // ✅ 1QA.MD: Query para buscar templates
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['ticket-templates', selectedCompany],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCompany !== 'all') params.append('companyId', selectedCompany);

      const url = `/api/ticket-templates${params.toString() ? '?' + params.toString() : ''}`;
      return await apiRequest('GET', url);
    },
  });

  // ✅ 1QA.MD: Query para buscar categorias
  const { data: categoriesResponse } = useQuery({
    queryKey: ['ticket-templates-categories'],
    queryFn: () => apiRequest('GET', '/api/ticket-templates/categories'),
  });

  // ✅ 1QA.MD: Mutation para criar template
  // ✅ Mutation para criar template — payload alinhado ao controller
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      // requiredFields: sempre inclui os campos padrão
      const requiredFieldsPayload = Array.isArray(data.requiredFields) && data.requiredFields.length > 0
        ? data.requiredFields
        : getDefaultRequiredFields();

      // customFields: usa os selecionados da listagem
      const customFieldsPayload = mapSelectedCustomFields();

      const payload = {
        // ⬇️ o controller espera camelCase no body (ele converte para colunas internamente)
        name: data.name,
        description: data.description || null,
        category: data.category,
        subcategory: data.subcategory || null,
        companyId: data.companyId || null,
        priority: data.priority,
        templateType: 'creation', // ✅ Sempre 'creation' - tipo único
        status: data.status || 'inactive',
        isDefault: !!data.isDefault,
        isSystem: !!data.isSystem,
        tags: Array.isArray(data.tags) ? data.tags : [],
        // ✅ Campos de detalhes do ticket para pré-preenchimento
        urgency: data.urgency || null,
        impact: data.impact || null,
        ticketStatus: data.ticketStatus || null,
        action: data.action || null,
        subject: data.subject || null,
        ticketDescription: data.ticketDescription || null,
        // ✅ enviado separado (sem "fields")
        requiredFields: requiredFieldsPayload,
        customFields: customFieldsPayload,
        // opcionais — backend trata defaults
        automation: (data as any)?.automation ?? {},
        workflow: (data as any)?.workflow ?? {},
        permissions: (data as any)?.permissions ?? [],
      };

      console.log('📤 [CREATE-TEMPLATE] Payload:', payload);
      return await apiRequest('POST', '/api/ticket-templates', payload);
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Template criado com sucesso!' });
      setIsCreateOpen(false);
      form.reset();
      setSelectedCustomFieldIds([]);
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao criar template',
        variant: 'destructive',
      });
    },
  });

  // ✅ 1QA.MD: Mutation para deletar template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest('DELETE', `/api/ticket-templates/${templateId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Template excluído com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir template',
        variant: 'destructive',
      });
    },
  });

  // ✅ 1QA.MD: Mutation para atualizar template
  // ✅ Mutation para atualizar template — mesmo formato do create
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ templateId, data }: { templateId: string; data: TemplateFormData }) => {
      const requiredFieldsPayload = Array.isArray(data.requiredFields) && data.requiredFields.length > 0
        ? data.requiredFields
        : getDefaultRequiredFields();

      // Usa os campos customizados selecionados
      const customFieldsPayload = mapSelectedCustomFields();

      const payload = {
        name: data.name,
        description: data.description || null,
        category: data.category,
        subcategory: data.subcategory || null,
        companyId: data.companyId || null,
        priority: data.priority,
        templateType: 'creation', // ✅ Sempre 'creation' - tipo único
        status: data.status || 'inactive',
        isDefault: !!data.isDefault,
        isSystem: !!data.isSystem,
        tags: Array.isArray(data.tags) ? data.tags : [],
        // ✅ Campos de detalhes do ticket para pré-preenchimento
        urgency: data.urgency || null,
        impact: data.impact || null,
        ticketStatus: data.ticketStatus || null,
        action: data.action || null,
        subject: data.subject || null,
        ticketDescription: data.ticketDescription || null,
        requiredFields: requiredFieldsPayload,
        customFields: customFieldsPayload,
        automation: (data as any)?.automation ?? {},
        workflow: (data as any)?.workflow ?? {},
        permissions: (data as any)?.permissions ?? [],
      };

      console.log('📤 [UPDATE-TEMPLATE] Payload:', payload);
      return await apiRequest('PUT', `/api/ticket-templates/${templateId}`, payload);
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Template atualizado com sucesso!' });
      setIsEditOpen(false);
      setSelectedCustomFieldIds([]);
      setEnableTicketConfig(false);
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao atualizar template',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTemplate = async (data: TemplateFormData) => {
    console.log('🎯 [HANDLE-CREATE] Button clicked, form data:', {
      name: data.name,
      templateType: data.templateType,
      category: data.category,
      companyId: data.companyId,
      requiredFieldsCount: data.requiredFields?.length || 0,
      customFieldsCount: data.customFields?.length || 0,
      fullData: data
    });

    // ✅ 1QA.MD: Validação adicional antes de enviar
    if (!data.name || data.name.trim().length < 3) {
      toast({
        title: 'Erro de Validação',
        description: 'Nome do template deve ter pelo menos 3 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (!data.category || data.category.trim().length === 0) {
      toast({
        title: 'Erro de Validação',
        description: 'Categoria é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    // Adiciona os campos customizados selecionados ao form data
    // const finalCustomFields = availableCustomFields.filter(field => selectedCustomFieldIds.includes(field.id));
    // data.customFields = finalCustomFields;

    // console.log('🎯 [HANDLE-CREATE] Validations passed, calling mutation...');
    createTemplateMutation.mutate(data);
  };

  const handleEditTemplate = (template: TicketTemplate) => {
    setEditingTemplate(template);

    // Converte tags para array se vier como string
    const tagsValue = (template as any).tags || template.tags;
    const tagsArray = Array.isArray(tagsValue) ? tagsValue : (tagsValue ? [tagsValue] : []);

    form.reset({
      name: template.name,
      description: template.description || '',
      companyId: (template as any).company_id ?? template.companyId ?? null,
      category: template.category || '',
      subcategory: template.subcategory || '',
      priority: template.priority,
      status: template.status,
      // ✅ Campos de configuração do ticket
      urgency: (template as any).urgency || '',
      impact: (template as any).impact || '',
      ticketStatus: (template as any).ticket_status || (template as any).ticketStatus || '',
      action: (template as any).action || '',
      subject: (template as any).subject || '',
      ticketDescription: (template as any).ticket_description || (template as any).ticketDescription || '',
      requiredFields: (template as any).required_fields || template.requiredFields || [],
      customFields: (template as any).custom_fields || template.customFields || [],
      tags: tagsArray,
      isDefault: (template as any).is_default ?? template.isDefault ?? false,
      isSystem: (template as any).is_system ?? template.isSystem ?? false,
    });

    const cf = ((template as any).custom_fields || template.customFields || []);
    setTemplateCustomFields(cf);
    setSelectedCustomFieldIds(cf.map((c: any) => c.id).filter(Boolean));

    // 👇 hidrata showOnOpen no form para cada campo
    cf.forEach((c: any) => {
      const flag = Boolean(c.showOnOpen ?? c.show_on_open);
      form.setValue(`customFieldsConfig.${c.id}.showOnOpen`, flag, { shouldDirty: false });
    });

    // ✅ Ativar toggle de configuração se houver qualquer valor configurado
    const hasTicketConfig = 
      (template as any).urgency || 
      (template as any).impact || 
      (template as any).ticket_status || 
      (template as any).ticketStatus || 
      (template as any).action || 
      (template as any).subject || 
      (template as any).ticket_description || 
      (template as any).ticketDescription;
    
    setEnableTicketConfig(!!hasTicketConfig);

    setIsEditOpen(true);
  };


  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleUpdateTemplate = async (data: TemplateFormData) => {
    console.log('🎯 [HANDLE-UPDATE] Button clicked, form data:', {
      name: data.name,
      category: data.category,
      formErrors: form.formState.errors,
      isValid: form.formState.isValid,
      isDirty: form.formState.isDirty
    });

    if (!editingTemplate) {
      console.error('❌ [HANDLE-UPDATE] No template being edited');
      return;
    }

    const updateData = {
      ...data,
      requiredFields: data.requiredFields.length > 0 ? data.requiredFields : getDefaultRequiredFields(),
      customFields: mapSelectedCustomFields(),
    };

    console.log('🔄 [UPDATE-TEMPLATE] Including custom fields:', {
      originalCustomFields: data.customFields?.length || 0,
      templateCustomFields: templateCustomFields.length,
      totalCustomFields: updateData.customFields.length
    });

    updateTemplateMutation.mutate({
      templateId: editingTemplate.id,
      data: updateData
    });
  };

  // ✅ 1QA.MD: Filtrar templates com estrutura de resposta correta
  const templates = templatesResponse?.data?.templates || [];
  const filteredTemplates = templates.filter((template: TicketTemplate) => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // ✅ 1QA.MD: Categorias podem vir aninhadas ou diretas
  const categories = categoriesResponse?.data?.categories || categoriesResponse?.data || [];

  // ✅ 1QA.MD: Buscar campos customizados do módulo /custom-fields-admin
  const { data: availableCustomFieldsResponse } = useQuery({
    queryKey: ['/api/custom-fields/fields/tickets'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/custom-fields/fields/tickets');
        return { success: true, data: response.data }; // 👈 pega só o array
      } catch (error) {
        return { success: false, data: [] };
      }
    }
  });

  // ✅ Converte os campos da API para o formato do template
  const mapSelectedCustomFields = React.useCallback(() => {
    return availableCustomFields
      .filter((f: any) => selectedCustomFieldIds.includes(f.id))
      .map((f: any) => {
        const config = form.getValues(`customFieldsConfig.${f.id}`) || {};
        return {
          id: f.id,
          name: f.fieldName,
          label: f.fieldLabel,
          type: f.fieldType,
          required: !!f.isRequired,
          order: typeof f.displayOrder === 'number' ? f.displayOrder : 0,
          placeholder: f.placeholder || undefined,
          helpText: f.helpText || undefined,
          showOnOpen: !!config.showOnOpen, // 👈 aqui entra a flag
        };
      });
  }, [availableCustomFields, selectedCustomFieldIds, form]);


  // Garante boolean (shadcn Checkbox pode mandar true/false)
  const toBool = (v: unknown) => v === true;

  const remapSelectedToCustomFields = React.useCallback(
    (ids: string[]) => {
      return availableCustomFields
        .filter((f: any) => ids.includes(f.id))
        .map((f: any) => ({
          id: f.id,
          name: f.fieldName,
          label: f.fieldLabel,
          type: f.fieldType,
          required: !!f.isRequired,
          order: typeof f.displayOrder === 'number' ? f.displayOrder : 0,
          placeholder: f.placeholder || undefined,
          helpText: f.helpText || undefined,
        }));
    },
    [availableCustomFields]
  );

  const handleToggleCustomField = React.useCallback(
    (field: any, checkedLike: boolean | string) => {
      const checked = toBool(checkedLike);
      setSelectedCustomFieldIds(prev => {
        const nextIds = checked ? [...prev, field.id] : prev.filter(id => id !== field.id);

        // 1) re-mapeia para objetos completos
        const mapped = remapSelectedToCustomFields(nextIds);

        // 2) atualiza estado usado no Edit
        setTemplateCustomFields(mapped);

        // 3) atualiza o form (RHF) com shouldDirty
        form.setValue('customFields', mapped, { shouldDirty: true });

        return nextIds;
      });
    },
    [form, remapSelectedToCustomFields, setTemplateCustomFields]
  );


  
  // Set available custom fields for the component
  React.useEffect(() => {
    if (availableCustomFieldsResponse?.success && availableCustomFieldsResponse.data) {
      setAvailableCustomFields(availableCustomFieldsResponse.data);
    }
  }, [availableCustomFieldsResponse]);

  React.useEffect(() => {
    // sempre que ids/available mudarem, remapeia e injeta no form
    const mapped = remapSelectedToCustomFields(selectedCustomFieldIds);
    setTemplateCustomFields(mapped);
    form.setValue('customFields', mapped, { shouldDirty: true });
  }, [selectedCustomFieldIds, availableCustomFields, remapSelectedToCustomFields]);


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Tickets</h1>
          <p className="text-gray-600 mt-1">
            Gerencie templates para criação e edição de tickets
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          data-testid="button-create-template"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Company Filter */}
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger data-testid="select-company">
                <SelectValue placeholder="Selecionar empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Todas as empresas
                  </div>
                </SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      {company.displayName || company.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Template Type Filter */}
            {/* <Select value={selectedTemplateType} onValueChange={setSelectedTemplateType}>
              <SelectTrigger data-testid="select-template-type">
                <SelectValue placeholder="Tipo de template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="creation">Templates de Criação</SelectItem>
                <SelectItem value="edit">Templates de Edição</SelectItem>
              </SelectContent>
            </Select>
 */}
            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <FileText className="w-4 h-4 mr-2" />
              {filteredTemplates.length} template(s) encontrado(s)
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {templatesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando templates...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template: TicketTemplate) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!template.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Template Type & Status */}
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={template.template_type === 'creation' ? 'default' : 'secondary'}
                          data-testid={`badge-type-${template.id}`}
                        >
                          {template.template_type === 'creation' ? 'Criação' : 'Edição'}
                        </Badge>
                        <Badge 
                          variant={template.status === 'active' ? 'default' : 'secondary'}
                          className={template.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {template.status === 'active' ? 'Ativo' : 
                           'Inativo'}
                        </Badge>
                      </div>

                      {/* Company */}
                      <div className="flex items-center text-sm text-gray-600">
                        {template.companyId ? (
                          <>
                            <Building2 className="w-4 h-4 mr-2" />
                            {companies.find(c => c.id === template.company_id)?.displayName ||
                             companies.find(c => c.id === template.company_id)?.name ||
                             'Empresa específica'}
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4 mr-2" />
                            Template global
                          </>
                        )}
                      </div>


                      {/* Category & Priority */}
                      {template.category && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">Categoria:</span>
                          <span className="ml-1">{template.category}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Prioridade: {template.priority}</span>
                      </div>

                      {/* Required Fields (for creation templates) */}
                      {template.templateType === 'creation' && template.requiredFields?.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Campos obrigatórios:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {template.requiredFields.slice(0, 3).map((field: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {field.label || field.fieldName}
                              </Badge>
                            ))}
                            {template.requiredFields.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.requiredFields.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* System & Default badges */}
                      <div className="flex space-x-2">
                        {template.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Sistema
                          </Badge>
                        )}
                        {template.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!templatesLoading && filteredTemplates.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum template encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCompany !== 'all' || selectedTemplateType !== 'all'
                    ? 'Nenhum template corresponde aos filtros aplicados.'
                    : 'Comece criando seu primeiro template de ticket.'}
                </p>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics dos Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {templates.length}
                  </div>
                  <div className="text-sm text-gray-600">Total de Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Array.isArray(templates) ? templates.filter((t: TicketTemplate) => t.templateType === 'creation').length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Templates de Criação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Array.isArray(templates) ? templates.filter((t: TicketTemplate) => t.templateType === 'edit').length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Templates de Edição</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Array.isArray(templates) ? templates.filter((t: TicketTemplate) => t.status === 'active').length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Templates Ativos</div>
                </div>
              </div>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-3" />
                  <p>Gráficos e relatórios detalhados serão exibidos aqui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Template</DialogTitle>
            <DialogDescription>
              Configure um novo template de ticket seguindo os padrões definidos.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTemplate)} className="space-y-6">
              {/* Basic Information */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Template *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Template Suporte Técnico" 
                          {...field}
                          data-testid="input-template-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

             

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o propósito e uso deste template..."
                        className="resize-none"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Selection */}
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'global' ? null : value)}
                      value={field.value || 'global'}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-company-form">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            Template Global (todas as empresas)
                          </div>
                        </SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center">
                              <Building2 className="w-4 h-4 mr-2" />
                              {company.displayName || company.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ 1QA.MD: Configurações básicas do template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Template</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Suporte, Infraestrutura" 
                          {...field}
                          data-testid="input-category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status do Template</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {field.value === 'active' ? 'Template ativo e disponível para uso' : 'Template inativo'}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 'active'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                          data-testid="switch-status"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* ✅ 1QA.MD: Campos Obrigatórios e Customizáveis */}
              <div className="space-y-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-900">Campos Obrigatórios (Fixos)</h4>
                          <p className="text-sm text-green-700 mt-1">
                            Todo template de criação deve incluir estes campos obrigatórios:
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getDefaultRequiredFields().map((field, index) => (
                              <Badge key={index} variant="outline" className="bg-white text-green-700 border-green-300">
                                {field.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <Settings className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-purple-900">Configurações de Campos do Ticket</h4>
                              <p className="text-sm text-purple-700 mt-1">
                                {!enableTicketConfig 
                                  ? 'Ative para configurar valores padrão dos campos do ticket'
                                  : !form.watch('companyId') 
                                    ? 'Templates globais não podem ter valores pré-configurados. Selecione uma empresa para habilitar.'
                                    : 'Configure valores padrão que serão aplicados ao criar tickets com este template:'}
                              </p>
                            </div>
                            <Switch
                              checked={enableTicketConfig}
                              onCheckedChange={(checked) => {
                                setEnableTicketConfig(checked);
                                if (!checked) {
                                  // Limpar todos os campos de configuração quando desabilitado
                                  form.setValue('urgency', '');
                                  form.setValue('impact', '');
                                  form.setValue('ticketStatus', '');
                                  form.setValue('action', '');
                                  form.setValue('subject', '');
                                  form.setValue('ticketDescription', '');
                                }
                              }}
                              data-testid="switch-ticket-config"
                            />
                          </div>

                          {enableTicketConfig && (
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-purple-800">Urgência</label>
                                <FormField
                                  control={form.control}
                                  name="urgency"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Baixa</SelectItem>
                                        <SelectItem value="medium">Média</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="critical">Crítica</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Impacto</label>
                                <FormField
                                  control={form.control}
                                  name="impact"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Baixo</SelectItem>
                                        <SelectItem value="medium">Médio</SelectItem>
                                        <SelectItem value="high">Alto</SelectItem>
                                        <SelectItem value="critical">Crítico</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Prioridade</label>
                                <FormField
                                  control={form.control}
                                  name="priority"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Baixa</SelectItem>
                                        <SelectItem value="medium">Média</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="urgent">Urgente</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-purple-800">Status do Ticket</label>
                                <FormField
                                  control={form.control}
                                  name="ticketStatus"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="new">Novo</SelectItem>
                                        <SelectItem value="open">Aberto</SelectItem>
                                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="resolved">Resolvido</SelectItem>
                                        <SelectItem value="closed">Fechado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Categoria</label>
                                <FormField
                                  control={form.control}
                                  name="category"
                                  render={({ field }) => (
                                    <DynamicSelect
                                      fieldName="category"
                                      value={field.value || ''}
                                      onChange={(value) => {
                                        field.onChange(value);
                                        // Limpar subcategoria e ação quando categoria mudar
                                        form.setValue('subcategory', '');
                                        form.setValue('action', '');
                                      }}
                                      placeholder="Selecione a categoria..."
                                      className="mt-1"
                                      disabled={!enableTicketConfig || !form.watch('companyId')}
                                      data-testid="select-category"
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-purple-800">Subcategoria</label>
                                <FormField
                                  control={form.control}
                                  name="subcategory"
                                  render={({ field }) => (
                                    <DynamicSelect
                                      fieldName="subcategory"
                                      dependsOn={form.watch('category')}
                                      value={field.value || ''}
                                      onChange={(value) => {
                                        field.onChange(value);
                                        // Limpar ação quando subcategoria mudar
                                        form.setValue('action', '');
                                      }}
                                      placeholder="Selecione a subcategoria..."
                                      className="mt-1"
                                      disabled={!enableTicketConfig || !form.watch('companyId') || !form.watch('category')}
                                      data-testid="select-subcategory"
                                    />
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Ação</label>
                                <FormField
                                  control={form.control}
                                  name="action"
                                  render={({ field }) => (
                                    <DynamicSelect
                                      fieldName="action"
                                      dependsOn={form.watch('subcategory')}
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      placeholder="Selecione a ação..."
                                      className="mt-1"
                                      disabled={!enableTicketConfig || !form.watch('companyId') || !form.watch('subcategory')}
                                      data-testid="select-action"
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-800">Assunto Padrão</label>
                              <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                  <Input 
                                    {...field}
                                    placeholder="Ex: Solicitação de Suporte"
                                    className="mt-1"
                                    disabled={!enableTicketConfig || !form.watch('companyId')}
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-800">Descrição Padrão</label>
                              <FormField
                                control={form.control}
                                name="ticketDescription"
                                render={({ field }) => (
                                  <Textarea 
                                    {...field}
                                    placeholder="Digite a descrição padrão do ticket..."
                                    className="mt-1 min-h-[100px]"
                                    disabled={!enableTicketConfig || !form.watch('companyId')}
                                  />
                                )}
                              />
                            </div>
                          </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <CheckSquare className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900">Campos Adicionais do Ticket</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            Selecione quais campos existentes incluir neste template:
                          </p>

                          <div className="mt-4 space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-orange-800 mb-2">Campos Padrão do Sistema</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_TICKET_FIELDS.map((field) => (
                                  <label key={field.name} className="flex items-center space-x-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={form.watch('requiredFields')?.some((rf: any) => rf.fieldName === field.name) || false}
                                      onChange={(e) => {
                                        const currentFields = form.getValues('requiredFields') || [];
                                        if (e.target.checked) {
                                          const newField = {
                                            fieldName: field.name,
                                            fieldType: 'text',
                                            label: field.label,
                                            required: true,
                                            order: currentFields.length + 1
                                          };
                                          form.setValue('requiredFields', [...currentFields, newField]);
                                        } else {
                                          form.setValue('requiredFields', currentFields.filter((f: any) => f.fieldName !== field.name));
                                        }
                                      }}
                                      className="rounded border-orange-300"
                                    />
                                    <span className="text-orange-800">{field.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-orange-800 mb-2">
                                Campos Customizados (gerenciados em /custom-fields-admin)
                              </h5>
                              <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                                {availableCustomFieldsResponse?.success && availableCustomFieldsResponse?.data?.length > 0 ? (
                                  <div className="space-y-2">
                                    {availableCustomFieldsResponse.data.map((field: any) => {
                                      const isSelected = selectedCustomFieldIds.includes(field.id);
                                      const showOnOpen = form.watch(`customFieldsConfig.${field.id}.showOnOpen`) || false;
                                      const requiredOnCreate = form.watch(`customFieldsConfig.${field.id}.requiredOnCreate`) || false;
                                      const requiredOnDetails = form.watch(`customFieldsConfig.${field.id}.requiredOnDetails`) || false;

                                      return (
                                        <div key={field.id} className="flex flex-col space-y-2 border rounded-md p-3 bg-white">
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`custom-field-${field.id}`}
                                              checked={isSelected}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedCustomFieldIds(prev => [...prev, field.id]);
                                                } else {
                                                  setSelectedCustomFieldIds(prev => prev.filter(id => id !== field.id));
                                                  // se desmarcar, reseta todas as configs
                                                  form.setValue(`customFieldsConfig.${field.id}`, { 
                                                    showOnOpen: false,
                                                    requiredOnCreate: false,
                                                    requiredOnDetails: false
                                                  });
                                                }
                                              }}
                                            />
                                            <Label
                                              htmlFor={`custom-field-${field.id}`}
                                              className="text-sm font-medium cursor-pointer flex-1"
                                            >
                                              {field.fieldLabel}
                                            </Label>
                                            <Badge variant="outline" className="text-xs">
                                              {field.fieldType}
                                            </Badge>
                                          </div>

                                          {isSelected && (
                                            <div className="ml-6 space-y-2 text-sm">
                                              {/* Modal de Criação */}
                                              <div className="flex flex-col space-y-1.5 p-2 bg-blue-50 rounded border border-blue-200">
                                                <div className="flex items-center space-x-1 text-blue-700 font-medium text-xs">
                                                  <span>📝</span>
                                                  <span>Modal de Criação</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                  <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                      id={`custom-field-showonopen-${field.id}`}
                                                      checked={showOnOpen}
                                                      onCheckedChange={(checked) => {
                                                        form.setValue(`customFieldsConfig.${field.id}.showOnOpen`, checked === true);
                                                        // Se desmarcar "Mostrar", também desmarca "Obrigatório"
                                                        if (!checked) {
                                                          form.setValue(`customFieldsConfig.${field.id}.requiredOnCreate`, false);
                                                        }
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`custom-field-showonopen-${field.id}`}
                                                      className="cursor-pointer text-gray-700"
                                                    >
                                                      Mostrar ao abrir
                                                    </Label>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                      id={`custom-field-required-create-${field.id}`}
                                                      checked={requiredOnCreate}
                                                      disabled={!showOnOpen}
                                                      onCheckedChange={(checked) =>
                                                        form.setValue(`customFieldsConfig.${field.id}.requiredOnCreate`, checked === true)
                                                      }
                                                    />
                                                    <Label
                                                      htmlFor={`custom-field-required-create-${field.id}`}
                                                      className={`cursor-pointer ${!showOnOpen ? 'text-gray-400' : 'text-gray-700'}`}
                                                    >
                                                      Obrigatório
                                                    </Label>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Aba de Detalhes */}
                                              <div className="flex flex-col space-y-1.5 p-2 bg-purple-50 rounded border border-purple-200">
                                                <div className="flex items-center space-x-1 text-purple-700 font-medium text-xs">
                                                  <span>📋</span>
                                                  <span>Aba de Detalhes</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <Checkbox
                                                    id={`custom-field-required-details-${field.id}`}
                                                    checked={requiredOnDetails}
                                                    onCheckedChange={(checked) =>
                                                      form.setValue(`customFieldsConfig.${field.id}.requiredOnDetails`, checked === true)
                                                    }
                                                  />
                                                  <Label
                                                    htmlFor={`custom-field-required-details-${field.id}`}
                                                    className="cursor-pointer text-gray-700"
                                                  >
                                                    Obrigatório
                                                  </Label>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Nenhum campo customizado disponível
                                  </p>
                                )}
                              </div>
                              {selectedCustomFieldIds.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedCustomFieldIds.length} campo(s) selecionado(s)
                                </p>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setTemplateCustomFields([]);
                  setSelectedCustomFieldIds([]);
                  setEnableTicketConfig(false);
                }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    'Criar Template'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}

      {/* Editar */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Modifique as configurações do template selecionado.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateTemplate)} className="space-y-6">
              {/* Basic Information */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Template *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Template Suporte Técnico" 
                        {...field}
                        data-testid="input-template-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o propósito e uso deste template..."
                        className="resize-none"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Selection */}
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'global' ? null : value)}
                      value={field.value || 'global'}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-company-form">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            Template Global (todas as empresas)
                          </div>
                        </SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center">
                              <Building2 className="w-4 h-4 mr-2" />
                              {company.displayName || company.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ 1QA.MD: Configurações básicas do template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Template</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Suporte, Infraestrutura" 
                          {...field}
                          data-testid="input-category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status do Template</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {field.value === 'active' ? 'Template ativo e disponível para uso' : 'Template inativo'}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 'active'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                          data-testid="switch-status"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* ✅ 1QA.MD: Campos Obrigatórios e Customizáveis */}
              <div className="space-y-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-900">Campos Obrigatórios (Fixos)</h4>
                          <p className="text-sm text-green-700 mt-1">
                            Todo template de criação deve incluir estes campos obrigatórios:
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getDefaultRequiredFields().map((field, index) => (
                              <Badge key={index} variant="outline" className="bg-white text-green-700 border-green-300">
                                {field.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <Settings className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-purple-900">Configurações de Campos do Ticket</h4>
                              <p className="text-sm text-purple-700 mt-1">
                                {!enableTicketConfig 
                                  ? 'Ative para configurar valores padrão dos campos do ticket'
                                  : !form.watch('companyId') 
                                    ? 'Templates globais não podem ter valores pré-configurados. Selecione uma empresa para habilitar.'
                                    : 'Configure valores padrão que serão aplicados ao criar tickets com este template:'}
                              </p>
                            </div>
                            <Switch
                              checked={enableTicketConfig}
                              onCheckedChange={(checked) => {
                                setEnableTicketConfig(checked);
                                if (!checked) {
                                  // Limpar todos os campos de configuração quando desabilitado
                                  form.setValue('urgency', '');
                                  form.setValue('impact', '');
                                  form.setValue('ticketStatus', '');
                                  form.setValue('action', '');
                                  form.setValue('subject', '');
                                  form.setValue('ticketDescription', '');
                                }
                              }}
                              data-testid="switch-ticket-config"
                            />
                          </div>

                          {enableTicketConfig && (
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-purple-800">Urgência</label>
                                <FormField
                                  control={form.control}
                                  name="urgency"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Baixa</SelectItem>
                                        <SelectItem value="medium">Média</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="critical">Crítica</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Impacto</label>
                                <FormField
                                  control={form.control}
                                  name="impact"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Baixo</SelectItem>
                                        <SelectItem value="medium">Médio</SelectItem>
                                        <SelectItem value="high">Alto</SelectItem>
                                        <SelectItem value="critical">Crítico</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Prioridade</label>
                                <FormField
                                  control={form.control}
                                  name="priority"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Baixa</SelectItem>
                                        <SelectItem value="medium">Média</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="urgent">Urgente</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-purple-800">Status do Ticket</label>
                                <FormField
                                  control={form.control}
                                  name="ticketStatus"
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!enableTicketConfig || !form.watch('companyId')}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="new">Novo</SelectItem>
                                        <SelectItem value="open">Aberto</SelectItem>
                                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="resolved">Resolvido</SelectItem>
                                        <SelectItem value="closed">Fechado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Categoria</label>
                                <FormField
                                  control={form.control}
                                  name="category"
                                  render={({ field }) => (
                                    <DynamicSelect
                                      fieldName="category"
                                      value={field.value || ''}
                                      onChange={(value) => {
                                        field.onChange(value);
                                        // Limpar subcategoria e ação quando categoria mudar
                                        form.setValue('subcategory', '');
                                        form.setValue('action', '');
                                      }}
                                      placeholder="Selecione a categoria..."
                                      className="mt-1"
                                      disabled={!enableTicketConfig || !form.watch('companyId')}
                                      data-testid="select-category"
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-purple-800">Subcategoria</label>
                                <FormField
                                  control={form.control}
                                  name="subcategory"
                                  render={({ field }) => (
                                    <DynamicSelect
                                      fieldName="subcategory"
                                      dependsOn={form.watch('category')}
                                      value={field.value || ''}
                                      onChange={(value) => {
                                        field.onChange(value);
                                        // Limpar ação quando subcategoria mudar
                                        form.setValue('action', '');
                                      }}
                                      placeholder="Selecione a subcategoria..."
                                      className="mt-1"
                                      disabled={!enableTicketConfig || !form.watch('companyId') || !form.watch('category')}
                                      data-testid="select-subcategory"
                                    />
                                  )}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-purple-800">Ação</label>
                                <FormField
                                  control={form.control}
                                  name="action"
                                  render={({ field }) => (
                                    <DynamicSelect
                                      fieldName="action"
                                      dependsOn={form.watch('subcategory')}
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      placeholder="Selecione a ação..."
                                      className="mt-1"
                                      disabled={!enableTicketConfig || !form.watch('companyId') || !form.watch('subcategory')}
                                      data-testid="select-action"
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-800">Assunto Padrão</label>
                              <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                  <Input 
                                    {...field}
                                    placeholder="Ex: Solicitação de Suporte"
                                    className="mt-1"
                                    disabled={!enableTicketConfig || !form.watch('companyId')}
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-800">Descrição Padrão</label>
                              <FormField
                                control={form.control}
                                name="ticketDescription"
                                render={({ field }) => (
                                  <Textarea 
                                    {...field}
                                    placeholder="Digite a descrição padrão do ticket..."
                                    className="mt-1 min-h-[100px]"
                                    disabled={!enableTicketConfig || !form.watch('companyId')}
                                  />
                                )}
                              />
                            </div>
                          </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <CheckSquare className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900">Campos Adicionais do Ticket</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            Selecione quais campos existentes incluir neste template:
                          </p>

                          <div className="mt-4 space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-orange-800 mb-2">Campos Padrão do Sistema</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_TICKET_FIELDS.map((field) => (
                                  <label key={field.name} className="flex items-center space-x-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={form.watch('requiredFields')?.some((rf: any) => rf.fieldName === field.name) || false}
                                      onChange={(e) => {
                                        const currentFields = form.getValues('requiredFields') || [];
                                        if (e.target.checked) {
                                          const newField = {
                                            fieldName: field.name,
                                            fieldType: 'text',
                                            label: field.label,
                                            required: true,
                                            order: currentFields.length + 1
                                          };
                                          form.setValue('requiredFields', [...currentFields, newField]);
                                        } else {
                                          form.setValue('requiredFields', currentFields.filter((f: any) => f.fieldName !== field.name));
                                        }
                                      }}
                                      className="rounded border-orange-300"
                                    />
                                    <span className="text-orange-800">{field.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-orange-800 mb-2">
                                Campos Customizados (gerenciados em /custom-fields-admin)
                              </h5>
                              <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                                {availableCustomFieldsResponse?.success && availableCustomFieldsResponse?.data?.length > 0 ? (
                                  <div className="space-y-2">
                                    {availableCustomFieldsResponse.data.map((field: any) => {
                                      const isSelected = selectedCustomFieldIds.includes(field.id);
                                      const showOnOpen = form.watch(`customFieldsConfig.${field.id}.showOnOpen`) || false;
                                      const requiredOnCreate = form.watch(`customFieldsConfig.${field.id}.requiredOnCreate`) || false;
                                      const requiredOnDetails = form.watch(`customFieldsConfig.${field.id}.requiredOnDetails`) || false;

                                      return (
                                        <div key={field.id} className="flex flex-col space-y-2 border rounded-md p-3 bg-white">
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`custom-field-${field.id}`}
                                              checked={isSelected}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedCustomFieldIds(prev => [...prev, field.id]);
                                                } else {
                                                  setSelectedCustomFieldIds(prev => prev.filter(id => id !== field.id));
                                                  // se desmarcar, reseta todas as configs
                                                  form.setValue(`customFieldsConfig.${field.id}`, { 
                                                    showOnOpen: false,
                                                    requiredOnCreate: false,
                                                    requiredOnDetails: false
                                                  });
                                                }
                                              }}
                                            />
                                            <Label
                                              htmlFor={`custom-field-${field.id}`}
                                              className="text-sm font-medium cursor-pointer flex-1"
                                            >
                                              {field.fieldLabel}
                                            </Label>
                                            <Badge variant="outline" className="text-xs">
                                              {field.fieldType}
                                            </Badge>
                                          </div>

                                          {isSelected && (
                                            <div className="ml-6 space-y-2 text-sm">
                                              {/* Modal de Criação */}
                                              <div className="flex flex-col space-y-1.5 p-2 bg-blue-50 rounded border border-blue-200">
                                                <div className="flex items-center space-x-1 text-blue-700 font-medium text-xs">
                                                  <span>📝</span>
                                                  <span>Modal de Criação</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                  <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                      id={`custom-field-showonopen-${field.id}`}
                                                      checked={showOnOpen}
                                                      onCheckedChange={(checked) => {
                                                        form.setValue(`customFieldsConfig.${field.id}.showOnOpen`, checked === true);
                                                        // Se desmarcar "Mostrar", também desmarca "Obrigatório"
                                                        if (!checked) {
                                                          form.setValue(`customFieldsConfig.${field.id}.requiredOnCreate`, false);
                                                        }
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`custom-field-showonopen-${field.id}`}
                                                      className="cursor-pointer text-gray-700"
                                                    >
                                                      Mostrar ao abrir
                                                    </Label>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                      id={`custom-field-required-create-${field.id}`}
                                                      checked={requiredOnCreate}
                                                      disabled={!showOnOpen}
                                                      onCheckedChange={(checked) =>
                                                        form.setValue(`customFieldsConfig.${field.id}.requiredOnCreate`, checked === true)
                                                      }
                                                    />
                                                    <Label
                                                      htmlFor={`custom-field-required-create-${field.id}`}
                                                      className={`cursor-pointer ${!showOnOpen ? 'text-gray-400' : 'text-gray-700'}`}
                                                    >
                                                      Obrigatório
                                                    </Label>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Aba de Detalhes */}
                                              <div className="flex flex-col space-y-1.5 p-2 bg-purple-50 rounded border border-purple-200">
                                                <div className="flex items-center space-x-1 text-purple-700 font-medium text-xs">
                                                  <span>📋</span>
                                                  <span>Aba de Detalhes</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <Checkbox
                                                    id={`custom-field-required-details-${field.id}`}
                                                    checked={requiredOnDetails}
                                                    onCheckedChange={(checked) =>
                                                      form.setValue(`customFieldsConfig.${field.id}.requiredOnDetails`, checked === true)
                                                    }
                                                  />
                                                  <Label
                                                    htmlFor={`custom-field-required-details-${field.id}`}
                                                    className="cursor-pointer text-gray-700"
                                                  >
                                                    Obrigatório
                                                  </Label>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Nenhum campo customizado disponível
                                  </p>
                                )}
                              </div>
                              {selectedCustomFieldIds.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedCustomFieldIds.length} campo(s) selecionado(s)
                                </p>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              {/* Validation Errors Display */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">Erros de Validação</h4>
                      <ul className="mt-2 text-sm text-red-700 space-y-1">
                        {Object.entries(form.formState.errors).map(([field, error]) => (
                          <li key={field}>
                            <strong>{field}:</strong> {error?.message?.toString() || 'Campo inválido'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditOpen(false);
                  setTemplateCustomFields([]);
                  setSelectedCustomFieldIds([]);
                  setEnableTicketConfig(false);
                }}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTemplateMutation.isPending}
                  data-testid="button-save-template"
                >
                  {updateTemplateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      
    </div>
  );
}