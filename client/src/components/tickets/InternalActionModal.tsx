import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
// import { useLocalization } from '@/hooks/useLocalization';
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


interface InternalActionModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  editAction?: any; // Para modo de edição
  onStartTimer?: (ticketId: string) => Promise<void>;
}

export default function InternalActionModal({
  // Localization temporarily disabled
 isOpen, onClose, ticketId, editAction, onStartTimer }: InternalActionModalProps) {
  const [formData, setFormData] = useState({
    // Campos obrigatórios da tabela
    action_type: "",
    agent_id: "__none__",

    // Campos opcionais da tabela
    title: "",
    description: "",
    planned_start_time: "",
    planned_end_time: "",
    start_time: "",
    end_time: "",
    estimated_hours: "0",
    status: "pending",
    priority: "medium",

    // Campos auxiliares
    attachments: [] as File[]
  });

  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form function
  const resetForm = () => {
    setFormData({
      action_type: "",
      agent_id: "__none__",
      title: "",
      description: "",
      planned_start_time: "",
      planned_end_time: "",
      start_time: "",
      end_time: "",
      estimated_hours: "0",
      status: "pending",
      priority: "medium",
      attachments: []
    });
    setIsPublic(false);
  };



  // Reset form when modal opens or load edit data
  useEffect(() => {
    if (isOpen) {
      if (editAction) {
        // Modo de edição - carregar dados da ação
        console.log('🔧 [EDIT-MODE] Loading action data:', editAction);
        setFormData({
          action_type: editAction.type || editAction.action_type || "",
          agent_id: editAction.assigned_to_id || "__none__",
          title: editAction.title || "",
          description: editAction.description || editAction.content || editAction.work_log || "",
          planned_start_time: editAction.planned_start_time || "",
          planned_end_time: editAction.planned_end_time || "",
          start_time: editAction.start_time ? editAction.start_time.slice(0, 16) : "",
          end_time: editAction.end_time ? editAction.end_time.slice(0, 16) : "",
          estimated_hours: editAction.estimated_minutes ? (parseFloat(editAction.estimated_minutes) / 60).toString() : "0",
          status: editAction.status || "pending",
          priority: editAction.priority || "medium",
          attachments: []
        });
        setIsPublic(editAction.is_public || false);
      } else {
        // Modo de criação - resetar form
        resetForm();
      }
    }
  }, [isOpen, editAction]);

  // Fetch team members for assignment dropdown
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/user-management/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user-management/users");
      return response.json();
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
        agent_id: data.agent_id === "__none__" ? null : data.agent_id,

        // Optional text fields
        title: data.title?.trim() || null,
        description: data.description?.trim() || null,

        // NEW: Planned date fields (testing the new database columns)
        planned_start_time: data.planned_start_time ? new Date(data.planned_start_time).toISOString() : null,
        planned_end_time: data.planned_end_time ? new Date(data.planned_end_time).toISOString() : null,

        // Actual execution date fields
        start_time: data.start_time ? new Date(data.start_time).toISOString() : null,
        end_time: data.end_time ? new Date(data.end_time).toISOString() : null,

        // Numeric fields with proper validation
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : 0,

        // Status and priority with defaults
        status: data.status || 'pending',
        priority: data.priority || 'medium',

        // Visibility flag
        is_public: isPublic,
      };

      // Debug log to verify all fields are properly mapped
      console.log('🔍 Internal Action Form Data Being Sent:', {
        originalData: data,
        cleanedData,
        hasPlannedStartTime: !!cleanedData.planned_start_time,
        hasPlannedEndTime: !!cleanedData.planned_end_time,
        allFields: Object.keys(cleanedData)
      });

      const response = await apiRequest("POST", "/actions`, cleanedData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Internal Action Created Successfully:', data);

      toast({
        title: '[TRANSLATION_NEEDED]',
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
        title: '[TRANSLATION_NEEDED]',
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
        agent_id: data.agent_id === "__none__" ? null : data.agent_id,
        title: data.title?.trim() || null,
        description: data.description?.trim() || null,
        planned_start_time: data.planned_start_time ? new Date(data.planned_start_time).toISOString() : null,
        planned_end_time: data.planned_end_time ? new Date(data.planned_end_time).toISOString() : null,
        start_time: data.start_time ? new Date(data.start_time).toISOString() : null,
        end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : 0,
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        is_public: isPublic,
      };

      console.log('🔧 [UPDATE] Updating action:', editAction.id, cleanedData);

      const response = await fetch("
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error("
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Internal Action Updated Successfully:', data);

      toast({
        title: '[TRANSLATION_NEEDED]',
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
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Falha ao atualizar ação interna",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.action_type) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Por favor, selecione o tipo de ação interna",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agent_id || formData.agent_id === "__none__") {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Por favor, selecione um agente responsável",
        variant: "destructive",
      });
      return;
    }

    // Validate date logic
    if (formData.planned_start_time && formData.planned_end_time) {
      const startDate = new Date(formData.planned_start_time);
      const endDate = new Date(formData.planned_end_time);

      if (endDate <= startDate) {
        toast({
          title: '[TRANSLATION_NEEDED]',
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
          title: '[TRANSLATION_NEEDED]',
          description: "A data de fim realizado deve ser posterior à data de início realizado",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate numeric fields
    if (formData.estimated_hours && parseFloat(formData.estimated_hours) < 0) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "As horas estimadas não podem ser negativas",
        variant: "destructive",
      });
      return;
    }

    // Validate text field lengths (based on typical database constraints)
    if (formData.title && formData.title.length > 255) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "O título não pode exceder 255 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (formData.description && formData.description.length > 65535) {
      toast({
        title: '[TRANSLATION_NEEDED]',
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



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2>
            <MessageSquare className="w-5 h-5" />
            {editAction ? '[TRANSLATION_NEEDED]' : 'Nova Ação Interna'}
          </DialogTitle>
          <DialogDescription>
            {editAction 
              ? '[TRANSLATION_NEEDED]'
              : 'Registre uma nova ação interna realizada neste ticket. Todos os campos marcados com * são obrigatórios.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6>

          <Card>
            <CardContent className="p-6>
              <div className="space-y-6>

                {/* Campos Obrigatórios */}
                <div className="grid grid-cols-2 gap-4>
                  {/* Tipo de Ação */}
                  <div>
                    <Label htmlFor="action-type">Tipo de Ação *</Label>
                    <Select value={formData.action_type} onValueChange={(value) => setFormData(prev => ({ ...prev, action_type: value }))}>
                      <SelectTrigger className="mt-1>
                        <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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

                  {/* Agente Responsável */}
                  <div>
                    <Label htmlFor="agent">Agente Responsável *</Label>
                    <Select value={formData.agent_id} onValueChange={(value) => setFormData(prev => ({ ...prev, agent_id: value }))}>
                      <SelectTrigger className="mt-1>
                        <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Selecione um agente --</SelectItem>
                        {teamMembers?.users?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || "
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status e Prioridade */}
                <div className="grid grid-cols-2 gap-4>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="mt-1>
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
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="mt-1>
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
                  <div className="flex justify-between>
                    <Label htmlFor="title">Título</Label>
                    <span className="text-xs ">
                      {formData.title.length}/255
                    </span>
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título resumido da ação..."
                    className="mt-1 ""
                    maxLength={255}
                  />
                  {formData.title.length > 255 && (
                    <p className="text-sm text-red-600 mt-1">Título muito longo</p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <div className="flex justify-between>
                    <Label htmlFor="description">Descrição</Label>
                    <span className="text-xs ">
                      {formData.description.length}/1000
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada da ação realizada..."
                    rows={4}
                    className="mt-1 ""
                    maxLength={1000}
                  />
                  {formData.description.length > 1000 && (
                    <p className="text-sm text-red-600 mt-1">Descrição muito longa</p>
                  )}
                </div>

                {/* Tempo Estimado */}
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

                            newData.planned_end_time = "
                          }
                        }

                        return newData;
                      });
                    }}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                {/* Datas Previstas */}
                <div className="space-y-2>
                  <Label className="flex items-center gap-2>
                    <Calendar className="w-4 h-4" />
                    Datas Previstas
                  </Label>
                  <div className="grid grid-cols-2 gap-4>
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

                                  newData.planned_end_time = "
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
                    <p className="text-sm text-red-600 flex items-center gap-1>
                      <AlertCircle className="w-4 h-4" />
                      A data de fim deve ser posterior à data de início
                    </p>
                  )}
                </div>

                {/* Datas Realizadas e Tempo */}
                <div className="space-y-4>
                  <Label className="flex items-center gap-2>
                    <Clock className="w-4 h-4" />
                    Execução e Tempo
                  </Label>
                  <div className="grid grid-cols-2 gap-4>
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
                    <p className="text-sm text-red-600 flex items-center gap-1>
                      <AlertCircle className="w-4 h-4" />
                      A data de fim realizado deve ser posterior à data de início realizado
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <Label className="flex items-center gap-2>
                    <Paperclip className="w-4 h-4" />
                    Adicionar Arquivos
                  </Label>
                  <div className="mt-2 space-y-2>
                    <div className="flex items-center gap-2>
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
                      <div className="space-y-1>
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border>
                            <div className="flex items-center gap-2>
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
                <div className="flex items-center justify-between border-t pt-4>
                  <div className="flex items-center space-x-2>
                    <Switch
                      id="public-action"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="public-action" className="flex items-center gap-2 text-sm>
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

                  <div className="flex gap-2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancelar
                    </Button>

                    <Button
                      onClick={handleSubmit}
                      disabled={
                        (editAction ? updateActionMutation.isPending : createActionMutation.isPending) || 
                        !formData.action_type || 
                        !formData.agent_id || 
                        formData.agent_id === "__none__" ||
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
                        : (editAction ? "Atualizar Ação" : "Salvar Ação")
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