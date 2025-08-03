import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, User, FileText, Calendar, Edit2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InternalActionDetailsModalProps {
  internalAction: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function InternalActionDetailsModal({ 
  internalAction, 
  isOpen, 
  onClose 
}: InternalActionDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    startDateTime: "",
    endDateTime: "",
    actionType: "",
    description: "",
    assignedToId: "",
    estimatedHours: "0.00"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when action changes
  useEffect(() => {
    if (internalAction) {
      setFormData({
        startDateTime: internalAction.startDateTime?.slice(0, 16) || "",
        endDateTime: internalAction.endDateTime?.slice(0, 16) || "",
        actionType: internalAction.actionType || "",
        description: internalAction.description || "",
        assignedToId: internalAction.agentId || "",
        estimatedHours: internalAction.estimatedHours || "0.00"
      });
    }
  }, [internalAction]);

  // Rich text editor for description
  const editor = useEditor({
    extensions: [StarterKit],
    content: formData.description,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, description: editor.getHTML() }));
    },
    editable: isEditing
  });

  // Update editor content when formData changes
  useEffect(() => {
    if (editor && formData.description !== editor.getHTML()) {
      editor.commands.setContent(formData.description);
    }
  }, [formData.description, editor]);

  // Fetch team members for assignment dropdown
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/user-management/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user-management/users");
      return response.json();
    },
    enabled: isOpen && isEditing,
  });

  // Update internal action mutation
  const updateActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/tickets/${internalAction.ticketId}/actions/${internalAction.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ação interna atualizada com sucesso",
      });

      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", internalAction.ticketId, "actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/internal-actions/schedule"] });

      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar ação interna",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.actionType.trim()) {
      toast({
        title: "Erro",
        description: "Tipo de ação é obrigatório",
        variant: "destructive",
      });
      return;
    }

    updateActionMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Reset form to original data
    if (internalAction) {
      setFormData({
        startDateTime: internalAction.startDateTime?.slice(0, 16) || "",
        endDateTime: internalAction.endDateTime?.slice(0, 16) || "",
        actionType: internalAction.actionType || "",
        description: internalAction.description || "",
        assignedToId: internalAction.agentId || "",
        estimatedHours: internalAction.estimatedHours || "0.00"
      });
    }
    setIsEditing(false);
  };

  if (!internalAction) return null;

  const actionTypeOptions = [
    { value: "analysis", label: "Análise" },
    { value: "development", label: "Desenvolvimento" },
    { value: "testing", label: "Teste" },
    { value: "documentation", label: "Documentação" },
    { value: "meeting", label: "Reunião" },
    { value: "research", label: "Pesquisa" },
    { value: "resolution", label: "Resolução" },
    { value: "follow_up", label: "Acompanhamento" },
    { value: "escalation", label: "Escalação" },
    { value: "other", label: "Outro" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                Ação Interna - {internalAction.ticketNumber}
              </DialogTitle>
              <DialogDescription className="space-y-1">
                <div>{internalAction.ticketSubject}</div>
                <div className="text-xs text-gray-500 font-mono">
                  Número: {internalAction.actionNumber || internalAction.id}
                </div>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updateActionMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateActionMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Technical Info Card */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-purple-700">Número da Ação</Label>
                  <div className="text-xs text-purple-600 font-mono bg-white p-2 rounded border select-all">
                    {internalAction.actionNumber || internalAction.id}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Info Card */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Responsável</Label>
                  {isEditing ? (
                    <Select
                      value={formData.assignedToId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers?.users?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {user.name || user.email}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      {internalAction.agentName || internalAction.agentEmail}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge 
                    variant={internalAction.status === 'completed' ? 'default' : 'secondary'}
                    className="w-fit"
                  >
                    {internalAction.status === 'completed' ? 'Concluída' : 
                     internalAction.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time and Type */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Data/Hora Início</Label>
                  {isEditing ? (
                    <Input
                      type="datetime-local"
                      value={formData.startDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDateTime: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {format(parseISO(internalAction.startDateTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Data/Hora Fim</Label>
                  {isEditing ? (
                    <Input
                      type="datetime-local"
                      value={formData.endDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDateTime: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {format(parseISO(internalAction.endDateTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tipo de Ação</Label>
                  {isEditing ? (
                    <Select
                      value={formData.actionType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, actionType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-500" />
                      {actionTypeOptions.find(opt => opt.value === internalAction.actionType)?.label || internalAction.actionType}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Horas Estimadas</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {internalAction.estimatedHours}h
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Descrição</Label>
              {isEditing ? (
                <div className="border rounded-md p-3 min-h-[120px]">
                  <EditorContent 
                    editor={editor} 
                    className="prose prose-sm max-w-none focus:outline-none"
                  />
                </div>
              ) : (
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: internalAction.description || 'Sem descrição' }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}