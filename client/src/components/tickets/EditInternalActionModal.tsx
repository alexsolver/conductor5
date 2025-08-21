import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MessageSquare, Save, X, User, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditInternalActionModalProps {
  ticketId: string;
  action: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditInternalActionModal({ ticketId, action, isOpen, onClose }: EditInternalActionModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    startDateTime: "",
    endDateTime: "",
    estimatedMinutes: "0",
    timeSpentMinutes: "0",
    alterTimeSpent: false,
    actionType: "",
    workLog: "",
    description: "",
    status: "pending",
    assignedToId: ""
  });
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch detailed action data for editing
  const { data: actionDetails, isLoading: actionLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "actions", action?.id],
    queryFn: async () => {
      if (!action?.id || !ticketId) return null;
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/actions/${action.id}`);
      return response.json();
    },
    enabled: isOpen && !!action?.id && !!ticketId,
  });

  // Populate form with existing action data
  useEffect(() => {
    if (!isOpen || !action) return;

    // Reset form data whenever modal opens
    let dataToUse = action;
    
    // Use detailed data if available, otherwise use passed action data
    if (actionDetails?.success && actionDetails.data) {
      dataToUse = actionDetails.data;
      console.log('🔍 EditModal: Loading detailed action data:', dataToUse);
    } else {
      console.log('🔍 EditModal: Loading passed action data:', dataToUse);
    }
    
    // Convert datetime fields to proper format for input[type="datetime-local"]
    const formatDateTime = (dateTime) => {
      if (!dateTime) return "";
      try {
        const date = new Date(dateTime);
        return date.toISOString().slice(0, 16);
      } catch (error) {
        console.warn('Error formatting datetime:', dateTime, error);
        return "";
      }
    };

    setFormData({
      startDateTime: formatDateTime(dataToUse.start_time || dataToUse.startDateTime),
      endDateTime: formatDateTime(dataToUse.end_time || dataToUse.endDateTime),
      estimatedMinutes: (dataToUse.estimated_minutes || dataToUse.estimatedMinutes || 0).toString(),
      timeSpentMinutes: (dataToUse.time_spent_minutes || dataToUse.timeSpentMinutes || 0).toString(),
      alterTimeSpent: !!(dataToUse.time_spent_minutes || dataToUse.timeSpentMinutes),
      actionType: dataToUse.type || dataToUse.actionType || dataToUse.actiontype || "",
      workLog: dataToUse.work_log || dataToUse.workLog || "",
      description: dataToUse.description || dataToUse.content || "",
      status: dataToUse.status || "pending",
      assignedToId: dataToUse.assigned_to_id || dataToUse.assignedToId || ""
    });
    
    setIsPublic(dataToUse.is_public !== undefined ? dataToUse.is_public : dataToUse.isPublic || false);
  }, [actionDetails, action, isOpen]);

  // Fetch team members for assignment dropdown
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/user-management/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user-management/users");
      return response.json();
    },
    enabled: isOpen,
  });

  // Update internal action mutation
  const updateActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ticketId,
        actionId: action.id,
        actionType: data.actionType,
        description: data.description,
        workLog: data.workLog,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        estimatedMinutes: parseInt(data.estimatedMinutes) || 0,
        timeSpentMinutes: data.alterTimeSpent ? parseInt(data.timeSpentMinutes) || 0 : 0,
        status: data.status,
        assignedToId: data.assignedToId,
        is_public: isPublic,
      };
      
      console.log('🔧 PUT Update - Sending data:', payload);
      
      const response = await apiRequest("PUT", `/api/tickets/${ticketId}/actions/${action.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ação interna atualizada com sucesso",
      });

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
    if (!formData.actionType) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de ação interna",
        variant: "destructive",
      });
      return;
    }

    updateActionMutation.mutate(formData);
  };

  const handleTimeSpentToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      alterTimeSpent: checked,
      timeSpentMinutes: checked ? prev.timeSpentMinutes : "0"
    }));
  };

  if (!action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Editar Ação Interna
          </DialogTitle>
          <DialogDescription>
            Modifique os detalhes da ação interna registrada neste ticket.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Date/Time and Time Controls */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="start-datetime">Data/Hora Início</Label>
                  <Input
                    id="start-datetime"
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDateTime: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-datetime">Data/Hora Fim</Label>
                  <Input
                    id="end-datetime"
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDateTime: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated-minutes">Tempo previsto (min)</Label>
                  <Input
                    id="estimated-minutes"
                    type="number"
                    min="0"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: e.target.value }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Switch
                      id="alter-time"
                      checked={formData.alterTimeSpent}
                      onCheckedChange={handleTimeSpentToggle}
                    />
                    <Label htmlFor="alter-time" className="text-sm">Alterar tempo gasto</Label>
                  </div>
                  <Input
                    id="time-spent"
                    type="number"
                    min="0"
                    value={formData.timeSpentMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeSpentMinutes: e.target.value }))}
                    placeholder="0"
                    disabled={!formData.alterTimeSpent}
                    className="mt-1"
                  />
                  <Label htmlFor="time-spent" className="text-xs text-gray-500">minutos</Label>
                </div>
              </div>

              {/* Assigned To - Highlighted */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <Label htmlFor="assigned-to" className="text-sm font-bold text-blue-700">Atribuído a</Label>
                  </div>
                  <Select value={formData.assignedToId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um membro..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">-- Não atribuído --</SelectItem>
                      {(teamMembers?.users || []).map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Action Type */}
              <div>
                <Label htmlFor="action-type">Ação Interna *</Label>
                <Select value={formData.actionType} onValueChange={(value) => setFormData(prev => ({ ...prev, actionType: value }))}>
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

              {/* Description */}
              <div>
                <Label htmlFor="description">{t('common.description')}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('tickets.internal_actions.description_placeholder')}
                  className="mt-1"
                />
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Switch
                      id="status-toggle"
                      checked={formData.status === "completed"}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? "completed" : "pending" }))}
                    />
                    <Label htmlFor="status-toggle" className="text-sm">
                      {formData.status === "completed" ? "Concluída" : "Pendente"}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Work Log */}
              <div>
                <Label htmlFor="work-log">Registro de Trabalho</Label>
                <Textarea
                  id="work-log"
                  placeholder="Descreva detalhadamente o trabalho realizado..."
                  value={formData.workLog}
                  onChange={(e) => setFormData(prev => ({ ...prev, workLog: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="public-action"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public-action" className="text-sm">
                  {isPublic ? "Ação Pública (Visível ao cliente)" : "Ação Privada (Apenas agentes)"}
                </Label>
              </div>

              {/* Submit Section */}
              <div className="flex gap-2 justify-end border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateActionMutation.isPending || !formData.actionType}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateActionMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}