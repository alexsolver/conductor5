import { useState } from "react";
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

export default function InternalActionModal({ isOpen, onClose, ticketId }: InternalActionModalProps) {
  const [formData, setFormData] = useState({
    // Campos obrigatórios da tabela
    action_type: "",
    agent_id: "__none__",
    
    // Campos opcionais da tabela
    title: "",
    description: "",
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
      // Map form data to database structure
      const cleanedData = {
        action_type: data.action_type,
        agent_id: data.agent_id === "__none__" ? null : data.agent_id,
        title: data.title || null,
        description: data.description || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        estimated_hours: parseFloat(data.estimated_hours) || 0,
        status: data.status || 'pending',
        priority: data.priority || 'medium',
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
    if (!formData.action_type) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de ação interna",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agent_id || formData.agent_id === "__none__") {
      toast({
        title: "Erro",
        description: "Por favor, selecione um agente responsável",
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
      action_type: "",
      agent_id: "__none__",
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      estimated_hours: "0",
      status: "pending",
      priority: "medium",
      attachments: []
    });
    setIsPublic(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Nova Ação Interna
          </DialogTitle>
          <DialogDescription>
            Registre uma nova ação interna realizada neste ticket. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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

                  {/* Agente Responsável */}
                  <div>
                    <Label htmlFor="agent">Agente Responsável *</Label>
                    <Select value={formData.agent_id} onValueChange={(value) => setFormData(prev => ({ ...prev, agent_id: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um agente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Selecione um agente --</SelectItem>
                        {teamMembers?.users?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Título */}
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título resumido da ação..."
                    className="mt-1"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada da ação realizada..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                {/* Datas e Tempo */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start-time">Data/Hora Início</Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Data/Hora Fim</Label>
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated-hours">Horas Estimadas</Label>
                    <Input
                      id="estimated-hours"
                      type="number"
                      min="0"
                      step="0.25"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Status e Prioridade */}
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
                    <Label htmlFor="priority">Prioridade</Label>
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
                      disabled={createActionMutation.isPending || !formData.action_type || !formData.agent_id || formData.agent_id === "__none__"}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createActionMutation.isPending ? "Salvando..." : "Salvar Ação"}
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