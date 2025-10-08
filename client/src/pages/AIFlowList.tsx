import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit, Trash2, Play, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function AIFlowList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null);

  // Fetch flows
  const { data: flows, isLoading } = useQuery({
    queryKey: ['/api/ai-flows'],
    enabled: !!user,
  });

  // Delete flow mutation
  const deleteMutation = useMutation({
    mutationFn: async (flowId: string) => {
      const response = await apiRequest('DELETE', `/api/ai-flows/${flowId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-flows'] });
      toast({
        title: "Fluxo excluído",
        description: "O fluxo foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setFlowToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o fluxo.",
        variant: "destructive",
      });
    },
  });

  // Duplicate flow mutation
  const duplicateMutation = useMutation({
    mutationFn: async (flowId: string) => {
      const response = await apiRequest('POST', `/api/ai-flows/${flowId}/duplicate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-flows'] });
      toast({
        title: "Fluxo duplicado",
        description: "O fluxo foi duplicado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar o fluxo.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (flowId: string) => {
    setFlowToDelete(flowId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (flowToDelete) {
      deleteMutation.mutate(flowToDelete);
    }
  };

  const handleDuplicate = (flowId: string) => {
    duplicateMutation.mutate(flowId);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando fluxos...</div>
        </div>
      </div>
    );
  }

  const flowsData = (flows as any)?.data || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Fluxos de IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus fluxos de automação e ações de IA
          </p>
        </div>
        <Button
          onClick={() => setLocation('/ai-agent/flow-builder')}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
          data-testid="button-create-flow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Fluxo
        </Button>
      </div>

      {/* Flows Grid */}
      {flowsData.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum fluxo criado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Crie seu primeiro fluxo de automação para começar a usar o poder da IA em suas operações.
            </p>
            <Button
              onClick={() => setLocation('/ai-agent/flow-builder')}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              data-testid="button-create-first-flow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Fluxo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flowsData.map((flow: any) => (
            <Card key={flow.id} className="p-6 hover:shadow-lg transition-shadow" data-testid={`card-flow-${flow.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1" data-testid={`text-flow-name-${flow.id}`}>
                    {flow.name}
                  </h3>
                  {flow.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {flow.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant={flow.isActive ? "default" : "secondary"}
                  className={flow.isActive ? "bg-green-500" : ""}
                  data-testid={`badge-status-${flow.id}`}
                >
                  {flow.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span data-testid={`text-nodes-count-${flow.id}`}>
                  {flow.nodes?.length || 0} nós
                </span>
                <span>•</span>
                <span>
                  {new Date(flow.updatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setLocation(`/ai-agent/flow-builder?flowId=${flow.id}`)}
                  data-testid={`button-edit-${flow.id}`}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(flow.id)}
                  disabled={duplicateMutation.isPending}
                  data-testid={`button-duplicate-${flow.id}`}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(flow.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${flow.id}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fluxo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
