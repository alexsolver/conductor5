import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  Calendar, 
  User, 
  MessageSquare,
  Eye,
  EyeOff,
  Send,
  Paperclip,
  Upload,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth";
import { FormTemplateSelector } from "@/components/internal-forms/FormTemplateSelector";
import { DynamicFormField } from "@/components/internal-forms/FormFieldComponents";
import type { InternalForm, FormField } from "@shared/schema-internal-forms";


interface InternalActionModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  editAction?: any; // Para modo de edição
  onStartTimer?: (ticketId: string) => Promise<void>;
}

// Dummy user object for demonstration purposes. In a real app, this would come from auth context or a global state.
// const user = {
//   id: "current-user-id", // Replace with actual logged-in user ID
//   name: "Nome do Usuário Logado", // Replace with actual logged-in user name
//   email: "usuario@example.com", // Replace with actual logged-in user email
// };


export default function InternalActionModal({ isOpen, onClose, ticketId, editAction, onStartTimer }: InternalActionModalProps) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth(); // Get current user from useAuth hook

  const [formData, setFormData] = useState({
    // Campos obrigatórios da tabela
    action_type: "",
    agent_id: currentUser?.id || "", // Default to logged-in user's ID

    // Campos opcionais da tabela
    title: "",
    description: "",
    planned_start_time: "",
    planned_end_time: "",
    start_time: "",
    end_time: "",
    estimated_hours: "0",
    actual_minutes: "0",
    status: "pending",
    priority: "medium",
    form_id: null as string | null,

    // Campos auxiliares
    attachments: [] as File[]
  });

  const [isPublic, setIsPublic] = useState(false);
  const [formTemplateData, setFormTemplateData] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch selected form template
  const { data: selectedFormTemplate } = useQuery<InternalForm>({
    queryKey: ['internal-form', formData.form_id],
    queryFn: async () => {
      if (!formData.form_id) return null;
      const response = await apiRequest('GET', `/api/internal-forms/forms/${formData.form_id}`);
      return response.json();
    },
    enabled: !!formData.form_id && isOpen,
  });

  // Reset form function
  const resetForm = () => {
    setFormData({
      action_type: "",
      agent_id: currentUser?.id || "", // Reset to logged-in user's ID
      title: "",
      description: "",
      planned_start_time: "",
      planned_end_time: "",
      start_time: "",
      end_time: "",
      estimated_hours: "0",
      actual_minutes: "0",
      status: "pending",
      priority: "medium",
      form_id: null,
      attachments: []
    });
    setIsPublic(false);
    setFormTemplateData({});
  };



  // Reset form when modal opens or load edit data
  useEffect(() => {
    if (isOpen) {
      if (editAction) {
        // Modo de edição - carregar dados da ação
        console.log('🔧 [EDIT-MODE] Loading action data:', editAction);
        setFormData({
          action_type: editAction.type || editAction.action_type || "",
          agent_id: editAction.assigned_to_id || currentUser?.id || "", // Fallback to logged-in user if editAction has no assigned_to_id
          title: editAction.title || "",
          description: editAction.description || editAction.content || editAction.work_log || "",
          planned_start_time: editAction.planned_start_time || "",
          planned_end_time: editAction.planned_end_time || "",
          start_time: editAction.start_time ? editAction.start_time.slice(0, 16) : "",
          end_time: editAction.end_time ? editAction.end_time.slice(0, 16) : "",
          estimated_hours: editAction.estimated_minutes ? (parseFloat(editAction.estimated_minutes) / 60).toString() : "0",
          actual_minutes: editAction.actual_minutes || editAction.actualMinutes || "0",
          status: editAction.status || "pending",
          priority: editAction.priority || "medium",
          form_id: editAction.form_id || null,
          attachments: []
        });
        setIsPublic(editAction.is_public || false);
        // Load form data if exists
        if (editAction.form_data && typeof editAction.form_data === 'object') {
          setFormTemplateData(editAction.form_data);
        } else {
          setFormTemplateData({});
        }
      } else {
        // Modo de criação - resetar form
        resetForm();
      }
    }
  }, [isOpen, editAction, currentUser?.id]); // Depend on currentUser?.id

  // Auto-save form data when it changes
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Skip auto-save on first render and when modal is closed
    if (isFirstRenderRef.current || !isOpen || !editAction) {
      isFirstRenderRef.current = false;
      return;
    }

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if there's a form selected and data to save
    if (formData.form_id && Object.keys(formTemplateData).length > 0) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('💾 [AUTO-SAVE] Saving form data...', formTemplateData);
          await apiRequest('PATCH', `/api/tickets/${ticketId}/actions/${editAction.id}`, {
            form_data: formTemplateData
          });
          console.log('✅ [AUTO-SAVE] Form data saved successfully');
        } catch (error) {
          console.error('❌ [AUTO-SAVE] Error saving form data:', error);
        }
      }, 1000); // Debounce: wait 1 second after last change
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formTemplateData, formData.form_id, editAction, ticketId, isOpen]);

  // Fetch team members for assignment dropdown
  // This query is no longer strictly necessary for the agent assignment but can be kept for other potential uses or removed if unused.
  const { data: teamMembersData } = useQuery({
    queryKey: ["/api/user-management/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user-management/users");
      const data = await response.json();
      // Filter out the current user if they appear in the list, as they are handled separately
      return { users: data.users?.filter((u: any) => u.id !== currentUser?.id) || [] }; // Use currentUser?.id
    },
    enabled: isOpen,
  });

  // Create internal action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: any) => {
      // Map form data to database structure with comprehensive field mapping
      const cleanedData = {
        // Required fields
        action_type: data.action_type,
        agent_id: currentUser?.id || "", // Always assign to the logged-in user

        // Optional text fields
        title: data.title?.trim() || null,
        description: data.description?.trim() || null,

        // NEW: Planned date fields - enviar como string sem conversão UTC
        planned_start_time: data.planned_start_time || null,
        planned_end_time: data.planned_end_time || null,

        // Actual execution date fields - enviar como string sem conversão UTC
        start_time: data.start_time || null,
        end_time: data.end_time || null,

        // Numeric fields with proper validation
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : 0,
        actual_minutes: data.actual_minutes ? parseInt(data.actual_minutes) : 0,

        // Status and priority with defaults
        status: data.status || 'pending',
        priority: data.priority || 'medium',

        // Visibility flag
        is_public: isPublic,

        // Form template fields
        form_id: data.form_id || null,
        form_data: data.form_id ? formTemplateData : null,
      };

      // Debug log to verify all fields are properly mapped
      console.log('🔍 Internal Action Form Data Being Sent:', {
        originalData: data,
        cleanedData,
        hasPlannedStartTime: !!cleanedData.planned_start_time,
        hasPlannedEndTime: !!cleanedData.planned_end_time,
        hasFormTemplate: !!cleanedData.form_id,
        formTemplateData: formTemplateData,
        allFields: Object.keys(cleanedData)
      });

      const response = await apiRequest("POST", `/api/tickets/${ticketId}/actions`, cleanedData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Internal Action Created Successfully:', data);

      toast({
        title: "Sucesso",
        description: "Ação interna adicionada com sucesso",
      });

      // Reset form data
      resetForm();

      // Invalidate queries to refresh the actions list and history
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "history"] });

      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar ação interna",
        variant: "destructive",
      });
    },
  });

  // Update internal action mutation (for edit mode)
  const updateActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanedData = {
        action_type: data.action_type,
        agent_id: currentUser?.id || "", // Keep assigning to the logged-in user
        title: data.title?.trim() || null,
        description: data.description?.trim() || null,
        planned_start_time: data.planned_start_time,
        planned_end_time: data.planned_end_time,
        start_time: data.start_time,
        end_time: data.end_time,
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : 0,
        actual_minutes: data.actual_minutes ? parseInt(data.actual_minutes) : 0,
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        is_public: isPublic,
        form_id: data.form_id || null,
        form_data: data.form_id ? formTemplateData : null,
      };

      console.log('🔧 [UPDATE] Updating action:', editAction.id, cleanedData, 'formTemplateData:', formTemplateData);

      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/actions/${editAction.id}`, cleanedData);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update action: ${response.status} ${errorData}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Internal Action Updated Successfully:', data);

      toast({
        title: "Sucesso",
        description: "Ação interna atualizada com sucesso",
      });

      // Reset form data
      resetForm();

      // Invalidate queries to refresh the actions list and history
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "history"] });

      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar ação interna",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.action_type) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de ação interna",
        variant: "destructive",
      });
      return;
    }

    // Agent ID is now automatically set to the logged-in user, so no need to validate if it's "__none__"

    // Validate date logic
    if (formData.planned_start_time && formData.planned_end_time) {
      const startDate = new Date(formData.planned_start_time);
      const endDate = new Date(formData.planned_end_time);

      if (endDate <= startDate) {
        toast({
          title: "Erro",
          description: "A data de fim previsto deve ser posterior à data de início previsto",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.start_time && formData.end_time) {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);

      if (endDate <= startDate) {
        toast({
          title: "Erro",
          description: "A data de fim realizado deve ser posterior à data de início realizado",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate numeric fields
    if (formData.estimated_hours && parseFloat(formData.estimated_hours) < 0) {
      toast({
        title: "Erro",
        description: "As horas estimadas não podem ser negativas",
        variant: "destructive",
      });
      return;
    }

    // Validate text field lengths (based on typical database constraints)
    if (formData.title && formData.title.length > 255) {
      toast({
        title: "Erro",
        description: "O título não pode exceder 255 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (formData.description && formData.description.length > 65535) {
      toast({
        title: "Erro",
        description: "A descrição é muito longa",
        variant: "destructive",
      });
      return;
    }

    // Submit the form - use appropriate mutation based on mode
    if (editAction) {
      updateActionMutation.mutate(formData);
    } else {
      createActionMutation.mutate(formData);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Função auxiliar para obter horário local no formato correto para datetime-local
  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Timer control functions
  const handleStartTimer = () => {
    const now = getLocalDateTimeString();
    const updatedFormData = {
      ...formData,
      start_time: now
    };

    setFormData(updatedFormData);

    // Salvar automaticamente se estiver em modo de edição
    if (editAction) {
      updateActionMutation.mutate(updatedFormData);
    }
  };

  // Função para criar a ação e iniciar o timer em uma única operação
  const handleCreateAndStart = () => {
    const now = getLocalDateTimeString();
    const formDataWithTimer = {
      ...formData,
      start_time: now,
      status: 'in_progress' // Sempre define status como "Em Andamento" ao criar e iniciar
    };

    setFormData(formDataWithTimer);

    // Validação básica
    if (!formDataWithTimer.action_type) {
      toast({
        title: "Erro de Validação",
        description: "Tipo de Ação é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Criar a ação com timer iniciado
    createActionMutation.mutate(formDataWithTimer);
  };

  const handleFinishTimer = async () => {
    const now = getLocalDateTimeString();

    // Calcular minutos decorridos
    if (formData.start_time) {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(now);
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));

      const updatedFormData = {
        ...formData,
        end_time: now,
        actual_minutes: diffMinutes.toString(),
        status: 'completed', // Define status como "Concluída" ao finalizar
        form_data: formTemplateData // Salvar dados do formulário
      };

      setFormData(updatedFormData);

      // Submeter formulário automaticamente se houver um form_id e dados
      if (formData.form_id && Object.keys(formTemplateData).length > 0) {
        try {
          const submissionResponse = await apiRequest('POST', '/api/internal-forms/submissions', {
            form_id: formData.form_id,
            submitted_by: currentUser?.id,
            form_data: formTemplateData,
            ticket_id: ticketId
          });

          if (!submissionResponse.ok) {
            toast({
              title: "Aviso",
              description: "Ação finalizada, mas houve erro ao submeter o formulário",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error submitting form on finish:', error);
          toast({
            title: "Aviso",
            description: "Ação finalizada, mas houve erro ao submeter o formulário",
            variant: "destructive",
          });
        }
      }

      // Salvar automaticamente se estiver em modo de edição
      if (editAction) {
        updateActionMutation.mutate(updatedFormData);
        // Não fechar o modal, apenas salvar
        return;
      }
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {editAction ? 'Editar Ação Interna' : 'Nova Ação Interna'}
          </DialogTitle>
          <DialogDescription>
            {editAction 
              ? 'Edite os dados da ação interna selecionada.'
              : 'Registre uma nova ação interna realizada neste ticket. Todos os campos marcados com * são obrigatórios.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer Control Buttons - Different buttons for create vs edit modes */}
          <div className="flex gap-2 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 mb-6">
            {!editAction ? (
              // Modo Criação: Apenas botão "Criar e Iniciar"
              <Button
                type="button"
                onClick={handleCreateAndStart}
                disabled={createActionMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                data-testid="button-create-and-start"
              >
                <Clock className="w-4 h-4 mr-2" />
                Criar e Iniciar
              </Button>
            ) : editAction.status === 'in_progress' ? (
              // Modo Edição com status "Em Andamento": Apenas botão "Finalizar"
              <Button
                type="button"
                onClick={handleFinishTimer}
                disabled={updateActionMutation.isPending}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
                data-testid="button-finish"
              >
                <Clock className="w-4 h-4 mr-2" />
                Finalizar
              </Button>
            ) : null}
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">

                {/* Campos Obrigatórios */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo de Ação */}
                  <div>
                    <Label htmlFor="action-type">Tipo de Ação *</Label>
                    <Select value={formData.action_type} onValueChange={(value) => setFormData(prev => ({ ...prev, action_type: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo de ação..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis">Análise</SelectItem>
                        <SelectItem value="investigation">Investigação</SelectItem>
                        <SelectItem value="resolution">Resolução</SelectItem>
                        <SelectItem value="escalation">Escalação</SelectItem>
                        <SelectItem value="communication">Comunicação</SelectItem>
                        <SelectItem value="testing">Teste</SelectItem>
                        <SelectItem value="documentation">Documentação</SelectItem>
                        <SelectItem value="follow_up">Acompanhamento</SelectItem>
                        <SelectItem value="work_log">Registro de Trabalho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Agente Responsável - Read Only */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Agente Responsável *
                    </Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {currentUser?.firstName && currentUser?.lastName 
                          ? `${currentUser.firstName} ${currentUser.lastName}`
                          : currentUser?.email || 'Usuário Logado'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">(Você)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      As ações internas são sempre atribuídas ao usuário logado
                    </p>
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">{t('tickets.priority')}</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Título */}
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="title">Título</Label>
                    <span className={`text-xs ${formData.title.length > 255 ? 'text-red-600' : 'text-gray-500'}`}>
                      {formData.title.length}/255
                    </span>
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título resumido da ação..."
                    className={`mt-1 ${formData.title.length > 255 ? 'border-red-500' : ''}`}
                    maxLength={255}
                  />
                  {formData.title.length > 255 && (
                    <p className="text-sm text-red-600 mt-1">Título muito longo</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <span className={`text-xs ${formData.description.length > 1000 ? 'text-red-600' : 'text-gray-500'}`}>
                      {formData.description.length}/1000
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('tickets.internal_actions.detailed_description_placeholder')}
                    rows={4}
                    className={`mt-1 ${formData.description.length > 1000 ? 'border-red-500' : ''}`}
                    maxLength={1000}
                  />
                  {formData.description.length > 1000 && (
                    <p className="text-sm text-red-600 mt-1">{t('tickets.internal_actions.description_too_long')}</p>
                  )}
                </div>

                {/* Form Template Selector */}
                <FormTemplateSelector
                  value={formData.form_id}
                  onChange={(formId) => {
                    setFormData(prev => ({ ...prev, form_id: formId }));
                    if (!formId) {
                      setFormTemplateData({});
                    }
                  }}
                  actionType={formData.action_type}
                  formData={formTemplateData}
                  onFormDataChange={setFormTemplateData}
                  ticketId={ticketId}
                  userId={currentUser?.id}
                />

                {/* Custom Form Fields */}
                {formData.form_id && selectedFormTemplate && selectedFormTemplate.fields && (
                  <Card className="border-2 border-blue-500">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">
                          Formulário: {selectedFormTemplate.name}
                        </h4>
                      </div>
                      {Array.isArray(selectedFormTemplate.fields) && selectedFormTemplate.fields
                        .sort((a: FormField, b: FormField) => (a.order || 0) - (b.order || 0))
                        .map((field: FormField) => (
                          <DynamicFormField
                            key={field.id}
                            field={field}
                            value={formTemplateData[field.name]}
                            onChange={(value) => {
                              setFormTemplateData(prev => ({
                                ...prev,
                                [field.name]: value
                              }));
                            }}
                          />
                        ))}
                    </CardContent>
                  </Card>
                )}

                {/* Tempo Estimado e Tempo Realizado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimated-hours">Tempo Estimado (minutos)</Label>
                    <Input
                      id="estimated-hours"
                      type="number"
                      min="0"
                      step="1"
                      max="9999"
                      value={formData.estimated_hours}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData(prev => {
                          const newData = { ...prev, estimated_hours: newValue };

                          // Auto-calculate planned end time if both estimated time and planned start time are filled
                          if (newValue && prev.planned_start_time) {
                            const estimatedMinutes = parseInt(newValue);
                            if (!isNaN(estimatedMinutes) && estimatedMinutes > 0) {
                              // Parse the datetime-local value directly without timezone conversion
                              const [datePart, timePart] = prev.planned_start_time.split('T');
                              const [year, month, day] = datePart.split('-').map(Number);
                              const [hour, minute] = timePart.split(':').map(Number);

                              // Create date in local timezone
                              const startTime = new Date(year, month - 1, day, hour, minute);
                              const endTime = new Date(startTime.getTime() + estimatedMinutes * 60000);

                              // Format back to datetime-local format
                              const endYear = endTime.getFullYear();
                              const endMonth = String(endTime.getMonth() + 1).padStart(2, '0');
                              const endDay = String(endTime.getDate()).padStart(2, '0');
                              const endHour = String(endTime.getHours()).padStart(2, '0');
                              const endMinute = String(endTime.getMinutes()).padStart(2, '0');

                              newData.planned_end_time = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}`;
                            }
                          }

                          return newData;
                        });
                      }}
                      placeholder="0"
                      className="mt-1"
                      data-testid="input-estimated-minutes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="actual-minutes">Tempo Realizado (minutos)</Label>
                    <Input
                      id="actual-minutes"
                      type="number"
                      min="0"
                      value={formData.actual_minutes || "0"}
                      onChange={(e) => setFormData(prev => ({ ...prev, actual_minutes: e.target.value }))}
                      placeholder="0"
                      className="mt-1"
                      readOnly
                      data-testid="input-actual-minutes"
                    />
                  </div>
                </div>

                {/* Datas Previstas */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Datas Previstas
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="planned-start-time">Data/Hora Início Previsto</Label>
                      <Input
                        id="planned-start-time"
                        type="datetime-local"
                        value={formData.planned_start_time}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormData(prev => {
                            const newData = { ...prev, planned_start_time: newValue };

                            // Set initial planned end time to same as planned start time
                            if (newValue) {
                              newData.planned_end_time = newValue;

                              // If estimated time is also filled, calculate the proper end time
                              if (prev.estimated_hours) {
                                const estimatedMinutes = parseInt(prev.estimated_hours);
                                if (!isNaN(estimatedMinutes) && estimatedMinutes > 0) {
                                  // Parse the datetime-local value directly without timezone conversion
                                  const [datePart, timePart] = newValue.split('T');
                                  const [year, month, day] = datePart.split('-').map(Number);
                                  const [hour, minute] = timePart.split(':').map(Number);

                                  // Create date in local timezone
                                  const startTime = new Date(year, month - 1, day, hour, minute);
                                  const endTime = new Date(startTime.getTime() + estimatedMinutes * 60000);

                                  // Format back to datetime-local format
                                  const endYear = endTime.getFullYear();
                                  const endMonth = String(endTime.getMonth() + 1).padStart(2, '0');
                                  const endDay = String(endTime.getDate()).padStart(2, '0');
                                  const endHour = String(endTime.getHours()).padStart(2, '0');
                                  const endMinute = String(endTime.getMinutes()).padStart(2, '0');

                                  newData.planned_end_time = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}`;
                                }
                              }
                            }

                            return newData;
                          });
                        }}
                        className="mt-1"
                        placeholder="Quando a ação deve começar"
                      />
                    </div>
                    <div>
                      <Label htmlFor="planned-end-time">Data/Hora Fim Previsto</Label>
                      <Input
                        id="planned-end-time"
                        type="datetime-local"
                        value={formData.planned_end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, planned_end_time: e.target.value }))}
                        className="mt-1"
                        placeholder="Quando a ação deve terminar"
                        min={formData.planned_start_time || undefined}
                      />
                    </div>
                  </div>
                  {formData.planned_start_time && formData.planned_end_time && 
                   new Date(formData.planned_end_time) <= new Date(formData.planned_start_time) && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      A data de fim deve ser posterior à data de início
                    </p>
                  )}
                </div>

                {/* Datas Realizadas e Tempo */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Execução e Tempo
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Data/Hora Início Realizado</Label>
                      <Input
                        id="start-time"
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        className="mt-1"
                        placeholder="Quando a ação realmente começou"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">Data/Hora Fim Realizado</Label>
                      <Input
                        id="end-time"
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        className="mt-1"
                        placeholder="Quando a ação realmente terminou"
                        min={formData.start_time || undefined}
                      />
                    </div>
                  </div>
                  {formData.start_time && formData.end_time && 
                   new Date(formData.end_time) <= new Date(formData.start_time) && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      A data de fim realizado deve ser posterior à data de início realizado
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Adicionar Arquivos
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Escolher Arquivos
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="space-y-1">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Section */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public-action"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="public-action" className="flex items-center gap-2 text-sm">
                      {isPublic ? (
                        <>
                          <Eye className="w-4 h-4 text-green-600" />
                          Ação Pública (Visível ao cliente)
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-gray-600" />
                          Ação Privada (Apenas agentes)
                        </>
                      )}
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancelar
                    </Button>

                    {!editAction && (
                      <Button
                        onClick={handleCreateAndStart}
                        disabled={
                          createActionMutation.isPending || 
                          !formData.action_type || 
                          formData.title.length > 255 ||
                          formData.description.length > 1000
                        }
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:opacity-50"
                        data-testid="button-create-and-start"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {createActionMutation.isPending ? "Criando..." : "Criar e Iniciar"}
                      </Button>
                    )}

                    <Button
                      onClick={handleSubmit}
                      disabled={
                        (editAction ? updateActionMutation.isPending : createActionMutation.isPending) || 
                        !formData.action_type || 
                        formData.title.length > 255 ||
                        formData.description.length > 1000 ||
                        (formData.planned_start_time && formData.planned_end_time && 
                         new Date(formData.planned_end_time) <= new Date(formData.planned_start_time)) ||
                        (formData.start_time && formData.end_time && 
                         new Date(formData.end_time) <= new Date(formData.start_time)) ||
                        (formData.estimated_hours !== "" && parseFloat(formData.estimated_hours) < 0)
                      }
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {(editAction ? updateActionMutation.isPending : createActionMutation.isPending) 
                        ? "Salvando..." 
                        : (editAction ? "Atualizar Ação" : "Criar Ação")
                      }
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}