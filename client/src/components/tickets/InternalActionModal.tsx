import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Eye, EyeOff, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [actionContent, setActionContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch internal actions
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "actions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/actions`);
      return response.json();
    },
    enabled: isOpen,
  });

  // Create internal action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: { content: string; isPublic: boolean }) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/actions`, {
        content: data.content,
        is_public: data.isPublic,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ação interna adicionada com sucesso",
      });
      setActionContent("");
      setIsPublic(false);
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
    if (!actionContent.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite o conteúdo da ação",
        variant: "destructive",
      });
      return;
    }

    createActionMutation.mutate({
      content: actionContent.trim(),
      isPublic,
    });
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="action-content">Nova Ação</Label>
                  <Textarea
                    id="action-content"
                    placeholder="Descreva a ação realizada no ticket..."
                    value={actionContent}
                    onChange={(e) => setActionContent(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public-action"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="public-action" className="flex items-center gap-2">
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

                  <Button
                    onClick={handleSubmit}
                    disabled={createActionMutation.isPending || !actionContent.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createActionMutation.isPending ? "Salvando..." : "Adicionar Ação"}
                  </Button>
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