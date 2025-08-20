
/**
 * Advanced Ticket Configuration System
 * Hierarchical page for detailed ticket metadata customization
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocalization } from '@/hooks/useLocalization';
import { 
  ArrowLeft,
  Settings2, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  CheckCircle2,
  Palette,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Database,
  Layers3
} from "lucide-react";
import { useLocation } from "wouter";
import { useLocalization } from '@/hooks/useLocalization';

// Schema para configurações avançadas
const advancedFieldSchema = z.object({
  fieldName: z.string().min(1, "Nome do campo é obrigatório"),
  displayLabel: z.string().min(1, "Rótulo é obrigatório"),
  fieldType: z.enum(['text', 'textarea', 'select', 'multiselect', 'date', 'datetime', 'number', 'boolean', 'email', 'phone']),
  isRequired: z.boolean().default(false),
  isSystem: z.boolean().default(false),
  displayOrder: z.number().min(1),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.string().optional(),
  validationRules: z.string().optional()
});

const fieldOptionSchema = z.object({
  optionValue: z.string().min(1, "Valor é obrigatório"),
  displayLabel: z.string().min(1, "Rótulo é obrigatório"),
  colorHex: z.string().default("#3b82f6"),
  sortOrder: z.number().default(1),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  slaHours: z.number().optional()
});

const slaConfigurationSchema = z.object({
  priority: z.string().min(1, "Prioridade é obrigatória"),
  responseTimeHours: z.number().min(1, "Tempo de resposta é obrigatório"),
  resolutionTimeHours: z.number().min(1, "Tempo de resolução é obrigatório"),
  escalationTimeHours: z.number().min(1, "Tempo de escalação é obrigatório"),
  businessHoursOnly: z.boolean().default(true),
  notificationEnabled: z.boolean().default(true)
});

interface FieldConfiguration {
  id: string;
  fieldName: string;
  displayLabel: string;
  fieldType: string;
  isRequired: boolean;
  isSystem: boolean;
  displayOrder: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  validationRules?: string;
  options?: FieldOption[];
}

interface FieldOption {
  id: string;
  optionValue: string;
  displayLabel: string;
  colorHex: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  slaHours?: number;
}

interface SLAConfiguration {
  id: string;
  priority: string;
  responseTimeHours: number;
  resolutionTimeHours: number;
  escalationTimeHours: number;
  businessHoursOnly: boolean;
  notificationEnabled: boolean;
}

function TicketAdvancedConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("field-management");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form setups
  const fieldForm = useForm({
    resolver: zodResolver(advancedFieldSchema),
    defaultValues: {
      fieldName: "",
      displayLabel: "",
      fieldType: "text" as const,
      isRequired: false,
      isSystem: false,
      displayOrder: 1,
      placeholder: "",
      helpText: "",
      defaultValue: "",
      validationRules: ""
    }
  });

  const optionForm = useForm({
    resolver: zodResolver(fieldOptionSchema),
    defaultValues: {
      optionValue: "",
      displayLabel: "",
      colorHex: "#3b82f6",
      sortOrder: 1,
      isDefault: false,
      isActive: true,
      slaHours: undefined
    }
  });

  const slaForm = useForm({
    resolver: zodResolver(slaConfigurationSchema),
    defaultValues: {
      priority: "",
      responseTimeHours: 2,
      resolutionTimeHours: 24,
      escalationTimeHours: 48,
      businessHoursOnly: true,
      notificationEnabled: true
    }
  });

  // Data queries
  const { data: fieldConfigurations = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/ticket-metadata/field-configurations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-metadata/field-configurations');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  const { data: fieldOptions = [], isLoading: optionsLoading } = useQuery({
    queryKey: ['/api/ticket-metadata/field-options'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-metadata/field-options');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  const { data: slaConfigurations = [], isLoading: slaLoading } = useQuery({
    queryKey: ['/api/ticket-config/sla-configurations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-config/sla-configurations');
      return response.json();
    }
  });

  // Mutations
  const createFieldMutation = useMutation({
    mutationFn: async (data: z.infer<typeof advancedFieldSchema>) => {
      const response = await apiRequest('POST', '/api/ticket-metadata/field-configurations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-metadata/field-configurations'] });
      setIsDialogOpen(false);
      fieldForm.reset();
      toast({ title: "Campo criado com sucesso" });
    }
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof advancedFieldSchema> }) => {
      const response = await apiRequest('PUT', `/api/ticket-metadata/field-configurations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-metadata/field-configurations'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Campo atualizado com sucesso" });
    }
  });

  const createOptionMutation = useMutation({
    mutationFn: async ({ fieldId, data }: { fieldId: string; data: z.infer<typeof fieldOptionSchema> }) => {
      const response = await apiRequest('POST', `/api/ticket-metadata/field-options/${fieldId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-metadata/field-options'] });
      setIsDialogOpen(false);
      optionForm.reset();
      toast({ title: "Opção criada com sucesso" });
    }
  });

  const createSLAMutation = useMutation({
    mutationFn: async (data: z.infer<typeof slaConfigurationSchema>) => {
      const response = await apiRequest('POST', '/api/ticket-config/sla-configurations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/sla-configurations'] });
      setIsDialogOpen(false);
      slaForm.reset();
      toast({ title: "Configuração SLA criada com sucesso" });
    }
  });

  // Form handlers
  const onFieldSubmit = (data: z.infer<typeof advancedFieldSchema>) => {
    if (editingItem) {
      updateFieldMutation.mutate({ id: editingItem.id, data });
    } else {
      createFieldMutation.mutate(data);
    }
  };

  const onOptionSubmit = (data: z.infer<typeof fieldOptionSchema>) => {
    if (editingItem?.fieldId) {
      createOptionMutation.mutate({ fieldId: editingItem.fieldId, data });
    }
  };

  const onSLASubmit = (data: z.infer<typeof slaConfigurationSchema>) => {
    createSLAMutation.mutate(data);
  };

  const openEditDialog = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    if (type === 'field') {
      fieldForm.reset(item);
    } else if (type === 'option') {
      optionForm.reset(item);
    } else if (type === 'sla') {
      slaForm.reset(item);
    }
    setIsDialogOpen(true);
  };

  const openCreateDialog = (type: string, fieldId?: string) => {
    setEditingItem({ type, fieldId });
    if (type === 'field') {
      fieldForm.reset();
    } else if (type === 'option') {
      optionForm.reset();
    } else if (type === 'sla') {
      slaForm.reset();
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/ticket-configuration')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Configurações</span>
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Configurações Avançadas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customização detalhada de campos, opções e regras de negócio
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="field-management" className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4" />
            <span>Gerenciar Campos</span>
          </TabsTrigger>
          <TabsTrigger value="field-options" className="flex items-center space-x-2">
            <Layers3 className="w-4 h-4" />
            <span>Opções de Campos</span>
          </TabsTrigger>
          <TabsTrigger value="sla-management" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Configuração SLA</span>
          </TabsTrigger>
          <TabsTrigger value="validation-rules" className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Regras de Validação</span>
          </TabsTrigger>
        </TabsList>

        {/* Field Management Tab */}
        <TabsContent value="field-management" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings2 className="w-5 h-5" />
                    <span>Gerenciamento de Campos</span>
                  </CardTitle>
                  <CardDescription>
                    Configure campos personalizados e suas propriedades
                  </CardDescription>
                </div>
                <Button onClick={() => openCreateDialog('field')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Campo</TableHead>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Obrigatório</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldConfigurations.map((field: FieldConfiguration) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.fieldName}</TableCell>
                      <TableCell>{field.displayLabel}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{field.fieldType}</Badge>
                      </TableCell>
                      <TableCell>
                        {field.isRequired ? (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Obrigatório
                          </Badge>
                        ) : (
                          <Badge variant="outline">Opcional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isSystem ? (
                          <Badge className="bg-blue-100 text-blue-800">Sistema</Badge>
                        ) : (
                          <Badge variant="outline">Personalizado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{field.displayOrder}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(field, 'field')}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {field.fieldType === 'select' || field.fieldType === 'multiselect' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCreateDialog('option', field.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Options Tab */}
        <TabsContent value="field-options" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Layers3 className="w-5 h-5" />
                    <span>Opções de Campos</span>
                  </CardTitle>
                  <CardDescription>
                    Configure as opções disponíveis para campos do tipo select
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fieldConfigurations
                  .filter(field => field.fieldType === 'select' || field.fieldType === 'multiselect')
                  .map((field: FieldConfiguration) => (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{field.displayLabel} ({field.fieldName})</h4>
                          <p className="text-sm text-gray-600">Tipo: {field.fieldType}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCreateDialog('option', field.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Nova Opção
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fieldOptions
                          .filter(option => option.fieldConfigId === field.id)
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((option: FieldOption) => (
                            <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: option.colorHex }}
                                />
                                <span className="font-medium">{option.displayLabel}</span>
                                {option.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Padrão</Badge>
                                )}
                                {option.slaHours && (
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {option.slaHours}h
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog({...option, fieldId: field.id}, 'option')}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Management Tab */}
        <TabsContent value="sla-management" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Configuração de SLA</span>
                  </CardTitle>
                  <CardDescription>
                    Configure tempos de resposta e resolução por prioridade
                  </CardDescription>
                </div>
                <Button onClick={() => openCreateDialog('sla')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Configuração SLA
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Tempo Resposta</TableHead>
                    <TableHead>Tempo Resolução</TableHead>
                    <TableHead>Tempo Escalação</TableHead>
                    <TableHead>Horário Comercial</TableHead>
                    <TableHead>Notificações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaConfigurations.map((sla: SLAConfiguration) => (
                    <TableRow key={sla.id}>
                      <TableCell className="font-medium">{sla.priority}</TableCell>
                      <TableCell>{sla.responseTimeHours}h</TableCell>
                      <TableCell>{sla.resolutionTimeHours}h</TableCell>
                      <TableCell>{sla.escalationTimeHours}h</TableCell>
                      <TableCell>
                        {sla.businessHoursOnly ? (
                          <Badge className="bg-blue-100 text-blue-800">Sim</Badge>
                        ) : (
                          <Badge variant="outline">24/7</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {sla.notificationEnabled ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(sla, 'sla')}
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

        {/* Validation Rules Tab */}
        <TabsContent value="validation-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Regras de Validação</span>
              </CardTitle>
              <CardDescription>
                Configure regras de validação personalizadas para campos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Validações Disponíveis:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Validação de formato de email</li>
                    <li>• Validação de números de telefone</li>
                    <li>• Validação de CPF/CNPJ</li>
                    <li>• Validação de formato de data</li>
                    <li>• Validação de tamanho mínimo/máximo</li>
                    <li>• Validação de padrões regex personalizados</li>
                  </ul>
                </div>
                
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>As regras de validação são configuradas individualmente em cada campo.</p>
                  <p className="text-sm mt-2">Vá para a aba "Gerenciar Campos" para configurar validações específicas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Creating/Editing */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.type === 'field' && (editingItem.id ? t('TicketAdvancedConfiguration.editarCampo') : 'Novo Campo')}
              {editingItem?.type === 'option' && 'Nova Opção'}
              {editingItem?.type === 'sla' && 'Configurar SLA'}
            </DialogTitle>
          </DialogHeader>

          {/* Field Form */}
          {editingItem?.type === 'field' && (
            <Form {...fieldForm}>
              <form onSubmit={fieldForm.handleSubmit(onFieldSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={fieldForm.control}
                    name="fieldName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Campo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ex: custom_priority" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fieldForm.control}
                    name="displayLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rótulo de Exibição</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ex: Prioridade Personalizada" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={fieldForm.control}
                    name="fieldType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Campo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="texto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="textarea">Área de Texto</SelectItem>
                            <SelectItem value="select">Seleção Única</SelectItem>
                            <SelectItem value="multiselect">Seleção Múltipla</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="datetime">Data e Hora</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fieldForm.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem de Exibição</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={fieldForm.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Texto de exemplo no campo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={fieldForm.control}
                  name="helpText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto de Ajuda</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Instruções para o usuário" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={fieldForm.control}
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
                  <FormField
                    control={fieldForm.control}
                    name="isSystem"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Campo do Sistema</FormLabel>
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createFieldMutation.isPending || updateFieldMutation.isPending}>
                    {editingItem.id ? 'Atualizar' : "texto"} Campo
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Option Form */}
          {editingItem?.type === 'option' && (
            <Form {...optionForm}>
              <form onSubmit={optionForm.handleSubmit(onOptionSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={optionForm.control}
                    name="optionValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Opção</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ex: high" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={optionForm.control}
                    name="displayLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rótulo de Exibição</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ex: Alta" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={optionForm.control}
                    name="colorHex"
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
                    control={optionForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem de Classificação</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={optionForm.control}
                  name="slaHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA em Horas (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={optionForm.control}
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
                  <FormField
                    control={optionForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Opção Ativa</FormLabel>
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createOptionMutation.isPending}>
                    Criar Opção
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* SLA Form */}
          {editingItem?.type === 'sla' && (
            <Form {...slaForm}>
              <form onSubmit={slaForm.handleSubmit(onSLASubmit)} className="space-y-4">
                <FormField
                  control={slaForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="texto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={slaForm.control}
                    name="responseTimeHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo de Resposta (horas)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={slaForm.control}
                    name="resolutionTimeHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo de Resolução (horas)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={slaForm.control}
                    name="escalationTimeHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo de Escalação (horas)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={slaForm.control}
                    name="businessHoursOnly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Apenas Horário Comercial</FormLabel>
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
                  <FormField
                    control={slaForm.control}
                    name="notificationEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Notificações Ativas</FormLabel>
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSLAMutation.isPending}>
                    Criar Configuração SLA
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TicketAdvancedConfiguration;
