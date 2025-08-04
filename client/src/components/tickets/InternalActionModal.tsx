import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { FilteredUserSelect } from "@/components/FilteredUserSelect";
import { UserGroupSelect } from "@/components/ui/UserGroupSelect";
import { 
  Clock, 
  Calendar, 
  User, 
  Users, 
  CalendarCheck, 
  CalendarClock, 
  MessageSquare,
  Eye,
  EyeOff,
  Send,
  Paperclip,
  Upload,
  FileText
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
}

interface InternalAction {
  id: string;
  content: string;
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export default function InternalActionModal({ isOpen, onClose, ticketId }: InternalActionModalProps) {
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
    attachments: [] as File[],
    assignedToId: "__none__",
    plannedStartDate: "",
    plannedEndDate: "",
    actualStartDate: "",
    actualEndDate: "",
    assignmentGroupId: "__none__"
  });
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to handle time spent toggle
  const handleTimeSpentToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      alterTimeSpent: checked,
      timeSpentMinutes: checked ? prev.timeSpentMinutes : "0"
    }));
  };

  // Fetch internal actions
  const { data: actionsResponse, isLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "actions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/actions`);
      return response.json();
    },
    enabled: isOpen,
  });

  // Extract data from response
  const actions = actionsResponse?.success ? actionsResponse.data : [];

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
      // Convert __none__ values back to empty strings for the API
      const cleanedData = {
        ...data,
        assignedToId: data.assignedToId === "__none__" ? "" : data.assignedToId,
        assignmentGroupId: data.assignmentGroupId === "__none__" ? "" : data.assignmentGroupId,
        is_public: isPublic,
      };
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/actions`, cleanedData);
      return response.json();
    },
    onSuccess: () => {
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

  const handleSubmit = () => {
    if (!formData.actionType) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de ação interna",
        variant: "destructive",
      });
      return;
    }

    createActionMutation.mutate(formData);
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

    // Reset form function
  const resetForm = () => {
    setFormData({
      startDateTime: "",
      endDateTime: "",
      estimatedMinutes: "0",
      timeSpentMinutes: "0",
      alterTimeSpent: false,
      actionType: "",
      workLog: "",
      description: "",
      status: "pending",
      attachments: [],
      assignedToId: "__none__",
      plannedStartDate: "",
      plannedEndDate: "",
      actualStartDate: "",
      actualEndDate: "",
      assignmentGroupId: "__none__"
    });
    setIsPublic(false);
  };

  // Group agents state
  const [groupAgents, setGroupAgents] = useState<any[]>([]);
  
  // Fetch group members when assignment group changes
  useEffect(() => {
    if (formData.assignmentGroupId && formData.assignmentGroupId !== "__none__") {
      apiRequest("GET", `/api/user-management/groups/${formData.assignmentGroupId}/users`)
        .then((response) => response.json())
        .then((data) => {
          if (data?.users) {
            setGroupAgents(data.users);
          } else {
            setGroupAgents([]);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar agentes do grupo:", error);
          setGroupAgents([]);
        });
    } else {
      setGroupAgents([]);
    }
  }, [formData.assignmentGroupId]);

  // Clear agent when group changes
  useEffect(() => {
    if (formData.assignmentGroupId && formData.assignmentGroupId !== "__none__" && formData.assignedToId && formData.assignedToId !== "__none__") {
      const agentBelongsToGroup = groupAgents.some((agent: any) => agent.id === formData.assignedToId);
      if (!agentBelongsToGroup) {
        setFormData(prev => ({ ...prev, assignedToId: "__none__" }));
      }
    }
  }, [formData.assignmentGroupId, formData.assignedToId, groupAgents]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Nova Ação Interna
          </DialogTitle>
          <DialogDescription>
            Registre uma nova ação interna realizada neste ticket. Defina se a ação será visível ao solicitante ou apenas para agentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* New Action Form */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Datas Previstas - Moved to top */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <CalendarClock className="h-4 w-4" />
                    <span>Datas Previstas</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plannedStartDate">Data Prevista Inicial</Label>
                      <Input
                        id="plannedStartDate"
                        type="datetime-local"
                        value={formData.plannedStartDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, plannedStartDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="plannedEndDate">Data Prevista Final</Label>
                      <Input
                        id="plannedEndDate"
                        type="datetime-local"
                        value={formData.plannedEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, plannedEndDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Datas Realizadas - Moved to top */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <CalendarCheck className="h-4 w-4" />
                    <span>Datas Realizadas</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actualStartDate">Data Realizada Inicial</Label>
                      <Input
                        id="actualStartDate"
                        type="datetime-local"
                        value={formData.actualStartDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, actualStartDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualEndDate">Data Realizada Final</Label>
                      <Input
                        id="actualEndDate"
                        type="datetime-local"
                        value={formData.actualEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, actualEndDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* First Row: Date/Time and Time */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="start-datetime">Data/Hora Início *</Label>
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

                {/* Assignment Group and User - Highlighted */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Assignment Group */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <Label htmlFor="assignment-group" className="text-sm font-bold text-blue-700">Grupo de Atribuição</Label>
                        </div>
                        <Select 
                          value={formData.assignmentGroupId} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, assignmentGroupId: value, assignedToId: "__none__" }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um grupo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">-- Nenhum grupo --</SelectItem>
                            {/* Add your groups here */}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Assigned User */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <Label htmlFor="assigned-to" className="text-sm font-bold text-blue-700">Atribuído a</Label>
                        </div>
                        <Select value={formData.assignedToId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um membro..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">-- Não atribuído --</SelectItem>
                            {(formData.assignmentGroupId ? groupAgents : teamMembers?.users || []).map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
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

                {/* Description - Simple Text Field */}
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da ação interna..."
                    className="mt-1"
                  />
                </div>

                {/* Status Toggle */}
                <div className="grid grid-cols-3 gap-4">
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
                          Ação Pública (Visível ao solicitante)
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
                    <Button
                      onClick={handleSubmit}
                      disabled={createActionMutation.isPending || !formData.actionType}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createActionMutation.isPending ? "Salvando..." : "Salvar e Continuar"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Removed existing actions display as requested */}
        </div>
      </DialogContent>
    </Dialog>
  );
}