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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [relationshipType, setRelationshipType] = useState("");
  const [description, setDescription] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search for tickets
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/tickets/search", searchTerm],
    enabled: searchTerm.length > 2,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/search?q=${encodeURIComponent(searchTerm)}`);
      return response.json();
    },
  });

  // Get existing relationships
  const { data: relationships = [] } = useQuery<TicketRelationship[]>({
    queryKey: ["/api/tickets", currentTicket.id, "relationships"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${currentTicket.id}/relationships`);
      return response.json();
    },
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (data: {
      targetTicketId: string;
      relationshipType: string;
      description?: string;
    }) => {
      const response = await apiRequest("POST", `/api/tickets/${currentTicket.id}/relationships`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Chamado vinculado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "relationships"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "relationships"] });
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
            <span>Vincular Chamados - {currentTicket.number || currentTicket.subject}</span>
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
            <h3 className="text-lg font-semibold mb-3">Vincular Novo Chamado</h3>
            
            {/* Search */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Buscar Chamado</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Digite número ou descrição do chamado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {searchResults
                    .filter((ticket: Ticket) => ticket.id !== currentTicket.id)
                    .map((ticket: Ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedTicket?.id === ticket.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{ticket.number || ticket.id.slice(0, 8)}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{ticket.subject}</div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{ticket.status}</Badge>
                          <Badge variant={
                            ticket.priority === 'critical' ? 'destructive' : 
                            ticket.priority === 'high' ? 'default' : 'secondary'
                          }>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
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