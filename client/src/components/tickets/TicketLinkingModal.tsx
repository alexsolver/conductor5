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
import { FilteredCustomerSelect } from "@/components/FilteredCustomerSelect";
import { 
  Search, 
  Link2, 
  GitBranch,
  ArrowRight,
  Copy,
  AlertTriangle,
  Workflow,
  Building2
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
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [relationshipType, setRelationshipType] = useState("");
  const [description, setDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch companies for filtering
  const { data: companiesData } = useQuery({
    queryKey: ["/api/customers/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers/companies");
      return response.json();
    },
  });

  // Fetch all tickets and filter locally for better UX
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      return response.json();
    },
  });

  // Ensure allTickets is always an array - correct data structure parsing
  const allTickets = Array.isArray(ticketsData?.data?.tickets) ? ticketsData.data.tickets : [];

  // Get companies list
  const companies = Array.isArray(companiesData) ? companiesData : [];

  // Filter tickets based on search term, status, priority, company, customer and exclude current ticket
  const filteredTickets = allTickets.filter((ticket: Ticket) => {
    if (currentTicket && ticket.id === currentTicket.id) return false;

    // Status filter
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;

    // Priority filter  
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;

    // Company filter
    if (selectedCompanyId && selectedCompanyId !== "all") {
      const ticketCompanyId = (ticket as any).customer_company_id || (ticket as any).customerCompanyId || (ticket as any).company;
      if (ticketCompanyId !== selectedCompanyId) return false;
    }

    // Customer filter
    if (selectedCustomerId && selectedCustomerId !== "all") {
      const ticketCustomerId = (ticket as any).customer_id || (ticket as any).customerId;
      if (ticketCustomerId !== selectedCustomerId) return false;
    }

    // Search filter
    if (searchTerm.length > 0) {
      const searchLower = searchTerm.toLowerCase();
      return (ticket.subject && ticket.subject.toLowerCase().includes(searchLower)) ||
             (ticket.number && ticket.number.toLowerCase().includes(searchLower)) ||
             ticket.id.toLowerCase().includes(searchLower);
    }

    return true;
  });

  // Helper functions for multi-selection
  const toggleTicketSelection = (ticket: Ticket) => {
    setSelectedTickets(prev => {
      const isSelected = prev.some(t => t.id === ticket.id);
      if (isSelected) {
        return prev.filter(t => t.id !== ticket.id);
      } else {
        return [...prev, ticket];
      }
    });
  };

  const isTicketSelected = (ticket: Ticket) => {
    return selectedTickets.some(t => t.id === ticket.id);
  };

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
        // Invalidate relationships
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "relationships"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ticket-relationships", currentTicket.id, "relationships"] });
        
        // 🚀 CORREÇÃO: Invalidate history immediately to show link events
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "history"] });
        
        // Invalidate general ticket queries for updated counts
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id] });
      }
      setSelectedTickets([]);
      setRelationshipType("");
      setDescription("");
      setSearchTerm("");
      // Fechar o modal após sucesso
      onClose();
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
        // Invalidate relationships
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "relationships"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ticket-relationships", currentTicket.id, "relationships"] });
        
        // 🚀 CORREÇÃO: Invalidate history immediately to show unlink events
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id, "history"] });
        
        // Invalidate general ticket queries for updated counts
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", currentTicket.id] });
      }
      
      // 🚀 CORREÇÃO: Fechar o modal após remoção bem-sucedida
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover vínculo",
        variant: "destructive",
      });
    },
  });

  const handleLinkTickets = () => {
    if (selectedTickets.length === 0 || !relationshipType) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um chamado e tipo de relação",
        variant: "destructive",
      });
      return;
    }

    // Create relationships for all selected tickets
    selectedTickets.forEach(ticket => {
      createRelationshipMutation.mutate({
        targetTicketId: ticket.id,
        relationshipType,
        description,
      });
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
            <span>Tickets Vinculados {currentTicket.number || currentTicket.subject}</span>
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
                            <span className="font-medium">#{rel.targetTicket.number || `T-${rel.targetTicket.id.slice(-8)}`} - {rel.targetTicket.subject}</span>
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
              {/* Company and Customer Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <Label htmlFor="company-filter" className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Filtrar por Empresa</span>
                  </Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as empresas</SelectItem>
                      {companies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.company_name || company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer-filter">Filtrar por Cliente</Label>
                  <FilteredCustomerSelect
                    value={selectedCustomerId}
                    onChange={setSelectedCustomerId}
                    selectedCompanyId={selectedCompanyId}
                    placeholder="Todos os clientes"
                    className="w-full"
                  />
                </div>
              </div>

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
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
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
                          isTicketSelected(ticket) ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200" : ""
                        }`}
                        onClick={() => toggleTicketSelection(ticket)}
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={isTicketSelected(ticket)}
                            onChange={() => toggleTicketSelection(ticket)}
                            className="mr-3 rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="font-medium">#{ticket.number || `T-${ticket.id.slice(-8)}`}</span>

                              {/* Badge de Categoria */}
                              {(ticket as any).category && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {(ticket as any).category}
                                </Badge>
                              )}

                              {/* Badge de Status */}
                              <Badge variant="outline" className={`text-xs ${
                                ticket.status === 'new' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                ticket.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                ticket.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                ticket.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                ticket.status === 'closed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {ticket.status === 'new' ? 'Novo' :
                                 ticket.status === 'open' ? 'Aberto' :
                                 ticket.status === 'in_progress' ? 'Em Andamento' :
                                 ticket.status === 'resolved' ? 'Resolvido' :
                                 ticket.status === 'closed' ? 'Fechado' :
                                 ticket.status}
                              </Badge>

                              {/* Badge de Prioridade */}
                              <Badge variant={
                                ticket.priority === 'critical' ? 'destructive' :
                                ticket.priority === 'high' ? 'default' :
                                'secondary'
                              } className={`text-xs ${
                                ticket.priority === 'critical' ? 'bg-red-600 text-white' :
                                ticket.priority === 'high' ? 'bg-orange-500 text-white' :
                                ticket.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                ticket.priority === 'low' ? 'bg-green-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}>
                                {ticket.priority === 'critical' ? 'Crítica' :
                                 ticket.priority === 'high' ? 'Alta' :
                                 ticket.priority === 'medium' ? 'Média' :
                                 ticket.priority === 'low' ? 'Baixa' :
                                 ticket.priority}
                              </Badge>

                              {/* Badge de Urgência */}
                              {(ticket as any).urgency && (
                                <Badge variant="outline" className={`text-xs ${
                                  (ticket as any).urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                  (ticket as any).urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  (ticket as any).urgency === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                  {(ticket as any).urgency === 'high' ? 'Urgência Alta' :
                                   (ticket as any).urgency === 'medium' ? 'Urgência Média' :
                                   (ticket as any).urgency === 'low' ? 'Urgência Baixa' :
                                   `Urgência: ${(ticket as any).urgency}`}
                                </Badge>
                              )}
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

              {/* Selected Tickets Summary */}
              {selectedTickets.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Tickets Selecionados ({selectedTickets.length})</h4>
                  <div className="space-y-2">
                    {selectedTickets.map(ticket => (
                      <div key={ticket.id} className="p-2 bg-white rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">#{ticket.number || `T-${ticket.id.slice(-8)}`}</span>
                          <button
                            onClick={() => toggleTicketSelection(ticket)}
                            className="text-red-500 hover:text-red-700 ml-2 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center space-x-1 flex-wrap gap-1 mb-1">
                          {/* Badge de Categoria */}
                          {(ticket as any).category && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {(ticket as any).category}
                            </Badge>
                          )}

                          {/* Badge de Status */}
                          <Badge variant="outline" className={`text-xs ${
                            ticket.status === 'new' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                            ticket.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            ticket.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            ticket.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                            ticket.status === 'closed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {ticket.status === 'new' ? 'Novo' :
                             ticket.status === 'open' ? 'Aberto' :
                             ticket.status === 'in_progress' ? 'Em Andamento' :
                             ticket.status === 'resolved' ? 'Resolvido' :
                             ticket.status === 'closed' ? 'Fechado' :
                             ticket.status}
                          </Badge>

                          {/* Badge de Prioridade */}
                          <Badge className={`text-xs ${
                            ticket.priority === 'critical' ? 'bg-red-600 text-white' :
                            ticket.priority === 'high' ? 'bg-orange-500 text-white' :
                            ticket.priority === 'medium' ? 'bg-yellow-500 text-white' :
                            ticket.priority === 'low' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {ticket.priority === 'critical' ? 'Crítica' :
                             ticket.priority === 'high' ? 'Alta' :
                             ticket.priority === 'medium' ? 'Média' :
                             ticket.priority === 'low' ? 'Baixa' :
                             ticket.priority}
                          </Badge>

                          {/* Badge de Urgência */}
                          {(ticket as any).urgency && (
                            <Badge variant="outline" className={`text-xs ${
                              (ticket as any).urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                              (ticket as any).urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              (ticket as any).urgency === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {(ticket as any).urgency === 'high' ? 'Urgência Alta' :
                               (ticket as any).urgency === 'medium' ? 'Urgência Média' :
                               (ticket as any).urgency === 'low' ? 'Urgência Baixa' :
                               `Urgência: ${(ticket as any).urgency}`}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {ticket.subject || "Sem assunto"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationship Type */}
              {selectedTickets.length > 0 && (
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
                      onClick={handleLinkTickets}
                      disabled={createRelationshipMutation.isPending}
                    >
                      {createRelationshipMutation.isPending ? "Vinculando..." : `Vincular ${selectedTickets.length} Ticket${selectedTickets.length !== 1 ? 's' : ''}`}
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