import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, User, Bot, Edit, Mail, Paperclip, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
// import { useLocalization } from '@/hooks/useLocalization';
interface TicketHistoryModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}
interface HistoryEntry {
  id: string;
  type: 'status_change' | 'assignment' | 'comment' | 'email' | 'attachment' | 'field_update' | 'system' | 'material_planned_added' | 'material_planned_removed' | 'material_consumed_added' | 'material_consumed_removed' | 'lpu_applied' | 'lpu_changed';
  action: string;
  description: string;
  actor: string;
  actorName: string;
  actorType: 'user' | 'system' | 'email';
  oldValue?: string;
  newValue?: string;
  fieldName?: string;
  isPublic: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}
const getActionIcon = (type: string) => {
  // Localization temporarily disabled
  switch (type) {
    case 'created':
    case 'ticket_created': return { icon: User, color: 'bg-green-100 text-green-600' };
    case 'status_change':
    case 'status_changed': return { icon: CheckCircle, color: 'bg-blue-100 text-blue-600' };
    case 'assignment':
    case 'assigned': return { icon: User, color: 'bg-purple-100 text-purple-600' };
    case 'comment':
    case 'note_added': return { icon: Edit, color: 'bg-yellow-100 text-yellow-600' };
    case 'email': return { icon: Mail, color: 'bg-indigo-100 text-indigo-600' };
    case 'attachment': return { icon: Paperclip, color: 'bg-orange-100 text-orange-600' };
    case 'field_update': return { icon: Edit, color: 'bg-gray-100 text-gray-600' };
    case 'system': return { icon: Bot, color: 'bg-gray-100 text-gray-600' };
    // Material and Services actions
    case 'material_planned_added': return { icon: AlertTriangle, color: 'bg-green-100 text-green-600' };
    case 'material_planned_removed': return { icon: AlertTriangle, color: 'bg-red-100 text-red-600' };
    case 'material_consumed_added': return { icon: CheckCircle, color: 'bg-blue-100 text-blue-600' };
    case 'material_consumed_removed': return { icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' };
    case 'lpu_applied':
    case 'lpu_changed': return { icon: ArrowRight, color: 'bg-indigo-100 text-indigo-600' };
    default: return { icon: Clock, color: 'bg-gray-100 text-gray-600' };
  }
};
const getActionColor = (type: string) => {
  switch (type) {
    case 'status_change':
      return 'text-green-600 bg-green-100';
    case 'assignment':
      return 'text-blue-600 bg-blue-100';
    case 'comment':
      return 'text-purple-600 bg-purple-100';
    case 'email':
      return 'text-indigo-600 bg-indigo-100';
    case 'attachment':
      return 'text-orange-600 bg-orange-100';
    case 'field_update':
      return 'text-yellow-600 bg-yellow-100';
    case 'system':
      return 'text-gray-600 bg-gray-100';
    // Material and Services actions
    case 'material_planned_added':
    case 'material_planned_removed':
    case 'material_consumed_added':
    case 'material_consumed_removed':
    case 'lpu_applied':
    case 'lpu_changed':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};
export default function TicketHistoryModal({ ticketId, isOpen, onClose }: TicketHistoryModalProps) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  // Fetch ticket history
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "history"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/history`);
      return response.json();
    },
    enabled: isOpen,
  });
  // Filter history based on selected filters
  const filteredHistory = history.filter((entry: HistoryEntry) => {
    const matchesFilter = filter === "all" || entry.type === filter;
    const matchesSearch = !searchTerm || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.actorName.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesTime = true;
    if (timeFilter !== "all") {
      const entryDate = new Date(entry.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));
      switch (timeFilter) {
        case "today":
          matchesTime = diffDays === 0;
          break;
        case "week":
          matchesTime = diffDays <= 7;
          break;
        case "month":
          matchesTime = diffDays <= 30;
          break;
      }
    }
    return matchesFilter && matchesSearch && matchesTime;
  });
  const renderFieldChange = (entry: HistoryEntry) => {
    if (!entry.oldValue && !entry.newValue) return null;
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs>
        <div className="flex items-center gap-2>
          <span className="text-lg">"{entry.fieldName}:</span>
          {entry.oldValue && (
            <>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded>
                {entry.oldValue}
              </span>
              <ArrowRight className="w-3 h-3 text-gray-500" />
            </>
          )}
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded>
            {entry.newValue || 'Removido'}
          </span>
        </div>
      </div>
    );
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2>
            <History className="w-5 h-5" />
            Linha do Tempo Detalhada
          </DialogTitle>
          <DialogDescription>
            Histórico completo de todas as ações, interações, modificações e mudanças de status do ticket.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg>
            <div className="flex-1 min-w-64>
              <Input
                placeholder='[TRANSLATION_NEEDED]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="status_change">Mudanças de status</SelectItem>
                <SelectItem value="assignment">Atribuições</SelectItem>
                <SelectItem value="comment">Comentários</SelectItem>
                <SelectItem value="email">E-mails</SelectItem>
                <SelectItem value="attachment">Anexos</SelectItem>
                <SelectItem value="field_update">Atualizações</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="material_planned_added">Material Planejado Adicionado</SelectItem>
                <SelectItem value="material_planned_removed">Material Planejado Removido</SelectItem>
                <SelectItem value="material_consumed_added">Material Consumido Adicionado</SelectItem>
                <SelectItem value="material_consumed_removed">Material Consumido Removido</SelectItem>
                <SelectItem value="lpu_applied">LPU Aplicada</SelectItem>
                <SelectItem value="lpu_changed">LPU Alterada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* History Timeline */}
          <div className="space-y-4>
            {isLoading ? (
              <div className="text-center py-12>
                <div className="text-lg">"</div>
                <p className="text-lg">"Carregando histórico...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12>
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500>
                  {searchTerm || filter !== "all" || timeFilter !== "all" 
                    ? '[TRANSLATION_NEEDED]'
                    : '[TRANSLATION_NEEDED]'
                  }
                </p>
              </div>
            ) : (
              <div className="relative>
                {/* Timeline line */}
                <div className="text-lg">"</div>
                <div className="space-y-6>
                  {filteredHistory.map((entry: HistoryEntry, index: number) => (
                    <div key={entry.id} className="relative flex items-start>
                      {/* Timeline dot */}
                      <div className="text-lg">"
                        {getActionIcon(entry.type).icon({ className: "w-4 h-4" })}
                      </div>
                      {/* Content */}
                      <div className="ml-12 flex-1>
                        <Card className={`border-l-4 ${
                          entry.isPublic 
                            ? 'border-l-green-500 bg-green-50' 
                            : 'border-l-gray-400 bg-gray-50'
                        >
                          <CardContent className="p-4>
                            <div className="flex items-start justify-between mb-2>
                              <div>
                                <div className="flex items-center gap-2 mb-1>
                                  <Badge variant="outline" className="text-xs>
                                    {entry.type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  <Badge variant={entry.actorType === 'system' ? 'secondary' : 'default'} className="text-xs>
                                    {entry.actorType === 'system' ? (
                                      <>
                                        <Bot className="w-3 h-3 mr-1" />
                                        Sistema
                                      </>
                                    ) : (
                                      <>
                                        <User className="w-3 h-3 mr-1" />
                                        {entry.actorName}
                                      </>
                                    )}
                                  </Badge>
                                  <Badge variant={entry.isPublic ? 'default' : 'secondary'} className="text-xs>
                                    {entry.isPublic ? 'Público' : 'Privado'}
                                  </Badge>
                                </div>
                                <p className="text-lg">"{entry.action}</p>
                              </div>
                              <span className="text-xs text-gray-500>
                                {new Date(entry.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-lg">"{entry.description}</p>
                            {/* Field changes */}
                            {entry.type === 'field_update' && renderFieldChange(entry)}
                            {/* Metadata */}
                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                              <div className="mt-3 pt-2 border-t border-gray-200>
                                <details className="text-xs>
                                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700>
                                    Detalhes adicionais
                                  </summary>
                                  <div className="mt-2 p-2 bg-gray-100 rounded>
                                    <pre className="text-xs overflow-x-auto>
                                      {JSON.stringify(entry.metadata, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Summary */}
          {!isLoading && filteredHistory.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg>
              <div className="flex items-center justify-between text-sm>
                <span className="font-medium text-blue-900>
                  Total de ações: {filteredHistory.length}
                </span>
                <div className="flex gap-4 text-blue-700>
                  <span>Públicas: {filteredHistory.filter(e => e.isPublic).length}</span>
                  <span>Privadas: {filteredHistory.filter(e => !e.isPublic).length}</span>
                  <span>Sistema: {filteredHistory.filter(e => e.actorType === 'system').length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}