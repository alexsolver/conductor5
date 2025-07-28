import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Link2, 
  GitBranch,
  ArrowRight,
  Copy,
  AlertTriangle,
  Workflow
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  number?: string;
}

interface TicketRelationship {
  id: string;
  relationshipType: string;
  targetTicket: Ticket;
  description?: string;
  createdAt: string;
}

interface TicketLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTicket: Ticket;
}

const RELATIONSHIP_TYPES = [
  { value: "related", label: "Relacionado", icon: Link2, description: "Tickets relacionados" },
  { value: "duplicate", label: "Duplicado", icon: Copy, description: "Ticket duplicado" },
  { value: "blocks", label: "Bloqueia", icon: AlertTriangle, description: "Bloqueia outro ticket" },
  { value: "caused_by", label: "Causado por", icon: ArrowRight, description: "Causado por outro ticket" },
  { value: "parent_child", label: "Pai/Filho", icon: GitBranch, description: "Relação hierárquica" },
  { value: "follows", label: "Segue", icon: Workflow, description: "Segue outro ticket" },
];

export default function TicketLinkingModal({ isOpen, onClose, currentTicket }: TicketLinkingModalProps) {
  // Early return if currentTicket is not provided
  if (!currentTicket) {
    return null;
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [relationshipType, setRelationshipType] = useState("");
  const [description, setDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all tickets and filter locally for better UX
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      return response.json();
    },
  });

  // Ensure allTickets is always an array
  const allTickets = Array.isArray(ticketsData?.tickets) ? ticketsData.tickets : [];

  // Filter tickets based on search term, status, priority and exclude current ticket
  const filteredTickets = allTickets.filter((ticket: Ticket) => {
    if (currentTicket && ticket.id === currentTicket.id) return false;

    // Status filter
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;

    // Priority filter  
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;

    // Search filter
    if (searchTerm.length > 0) {
      const searchLower = searchTerm.toLowerCase();
      return (ticket.subject && ticket.subject.toLowerCase().includes(searchLower)) ||
             (ticket.number && ticket.number.toLowerCase().includes(searchLower)) ||
             ticket.id.toLowerCase().includes(searchLower);
    }

    return true;
  });

  // Get existing relationships
  const { data: relationships = [] } = useQuery<TicketRelationship[]>({
    queryKey: ["/api/tickets", currentTicket?.id, "relationships"],
    queryFn: async () => {
      if (!currentTicket?.id) return [];
      const response = await apiRequest("GET", `/api/tickets/${currentTicket.id}/relationships`);
      return response.json();
    },
    enabled: !!currentTicket?.id,
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (data: {
      targetTicketId: string;
      relationshipType: string;
      description?: string;
    }) => {
      if (!currentTicket?.id) {
        throw new Error("Ticket atual não encontrado");
      }
      const response = await apiRequest("POST", `/api/tickets/${currentTicket.id}/relationships`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Chamado vinculado com sucesso",
      });
      if (currentTicket?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "relationships"] });
      }
      setSelectedTicket(null);
      setRelationshipType("");
      setDescription("");
      setSearchTerm("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao vincular chamado",
        variant: "destructive",
      });
    },
  });

  // Remove relationship mutation
  const removeRelationshipMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      await apiRequest("DELETE", `/api/tickets/relationships/${relationshipId}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Vínculo removido com sucesso",
      });
      if (currentTicket?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "relationships"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover vínculo",
        variant: "destructive",
      });
    },
  });

  const handleLinkTicket = () => {
    if (!selectedTicket || !relationshipType) {
      toast({
        title: "Erro",
        description: "Selecione um chamado e tipo de relação",
        variant: "destructive",
      });
      return;
    }

    createRelationshipMutation.mutate({
      targetTicketId: selectedTicket.id,
      relationshipType,
      description,
    });
  };

  const getRelationshipIcon = (type: string) => {
    const relationshipType = RELATIONSHIP_TYPES.find(r => r.value === type);
    return relationshipType?.icon || Link2;
  };

  const getRelationshipLabel = (type: string) => {
    const relationshipType = RELATIONSHIP_TYPES.find(r => r.value === type);
    return relationshipType?.label || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Link2 className="h-5 w-5" />
            <span>Tickets Vinculados{currentTicket.number || currentTicket.subject}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Relationships */}
          {relationships.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Vínculos Existentes</h3>
              <div className="space-y-2">
                {relationships.map((rel) => {
                  const Icon = getRelationshipIcon(rel.relationshipType);
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{rel.targetTicket.subject}</span>
                            <Badge variant="outline">
                              {getRelationshipLabel(rel.relationshipType)}
                            </Badge>
                          </div>
                          {rel.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {rel.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRelationshipMutation.mutate(rel.id)}
                        disabled={removeRelationshipMutation.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Link New Ticket */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Vincular Novo Ticket</h3>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Buscar Ticket</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Digite número ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority-filter">Prioridade</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as prioridades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as prioridades</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ticket List */}
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket: Ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedTicket?.id === ticket.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">#{ticket.number || ticket.id.slice(-8)}</span>
                              <Badge variant={
                                ticket.priority === 'critical' ? 'destructive' :
                                ticket.priority === 'high' ? 'default' :
                                'secondary'
                              }>
                                {ticket.priority}
                              </Badge>
                              <Badge variant="outline">
                                {ticket.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                              {ticket.subject || "Sem assunto"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      Nenhum ticket encontrado com os filtros selecionados
                    </div>
                  )}
                </div>
              )}

              {/* Relationship Type */}
              {selectedTicket && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="relationshipType">Tipo de Relação</Label>
                    <Select value={relationshipType} onValueChange={setRelationshipType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de relação" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva a relação entre os chamados..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleLinkTicket}
                      disabled={createRelationshipMutation.isPending}
                    >
                      {createRelationshipMutation.isPending ? "Vinculando..." : "Vincular Chamado"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}