import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Eye, EyeOff, User, Clock, Paperclip, Upload, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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

export default function InternalActionModal({ ticketId, isOpen, onClose }: InternalActionModalProps) {
  const [formData, setFormData] = useState({
    startDateTime: "",
    endDateTime: "",
    timeSpent: "0:00:00:25",
    alterTimeSpent: false,
    actionType: "",
    workLog: "",
    description: "",
    attachments: [] as File[]
  });
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Rich text editor for description
  const editor = useEditor({
    extensions: [StarterKit],
    content: formData.description,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, description: editor.getHTML() }));
    },
  });

  // Fetch internal actions - PROBLEMA 1 RESOLVED: Fix actions.map is not a function
  const { data: actionsResponse, isLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "actions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/actions`);
      return response.json();
    },
    enabled: isOpen,
  });
  
  // Extract data from response to avoid "actions.map is not a function" error
  const actions = actionsResponse?.success ? actionsResponse.data : [];

  // Create internal action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/actions`, {
        ...data,
        is_public: isPublic,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ação interna adicionada com sucesso",
      });
      setFormData({
        startDateTime: "",
        endDateTime: "",
        timeSpent: "0:00:00:25",
        alterTimeSpent: false,
        actionType: "",
        workLog: "",
        description: "",
        attachments: []
      });
      setIsPublic(false);
      if (editor) {
        editor.commands.clearContent();
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
    },
    onError: (error: Error) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Ações Internas do Agente
          </DialogTitle>
          <DialogDescription>
            Registre todas as interações e ações realizadas neste ticket. Escolha se a ação será visível ao solicitante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* New Action Form */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* First Row: Date/Time and Time Spent */}
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
                    <div className="flex items-center space-x-2 mb-1">
                      <Switch
                        id="alter-time"
                        checked={formData.alterTimeSpent}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, alterTimeSpent: checked }))}
                      />
                      <Label htmlFor="alter-time" className="text-sm">Alterar tempo gasto</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="time-spent">Tempo gasto</Label>
                    <Input
                      id="time-spent"
                      value={formData.timeSpent}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeSpent: e.target.value }))}
                      placeholder="0:00:00:25"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Action Type and Work Log */}
                <div className="space-y-4">
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

                {/* Rich Text Description */}
                <div>
                  <Label>Descrição</Label>
                  <div className="mt-1 border rounded-md">
                    {/* Toolbar */}
                    <div className="border-b p-2 bg-gray-50 flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className={editor?.isActive('bold') ? 'bg-gray-200' : ''}
                      >
                        <strong>B</strong>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className={editor?.isActive('italic') ? 'bg-gray-200' : ''}
                      >
                        <em>I</em>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        className={editor?.isActive('strike') ? 'bg-gray-200' : ''}
                      >
                        <s>S</s>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        className={editor?.isActive('bulletList') ? 'bg-gray-200' : ''}
                      >
                        •
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        className={editor?.isActive('orderedList') ? 'bg-gray-200' : ''}
                      >
                        1.
                      </Button>
                    </div>
                    
                    {/* Editor Content */}
                    <div className="p-3 min-h-[120px] prose prose-sm max-w-none">
                      <EditorContent editor={editor} />
                    </div>
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
                      Fechar
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

          {/* Actions History */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Histórico de Ações ({actions.length})</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando ações...</p>
              </div>
            ) : actions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Nenhuma ação registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action: InternalAction) => (
                  <Card key={action.id} className={`border-l-4 ${
                    action.isPublic 
                      ? 'border-l-green-500 bg-green-50' 
                      : 'border-l-gray-500 bg-gray-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-sm">{action.createdByName}</span>
                            <Badge variant={action.isPublic ? 'default' : 'secondary'}>
                              {action.isPublic ? (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Público
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Privado
                                </>
                              )}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(action.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap">{action.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}