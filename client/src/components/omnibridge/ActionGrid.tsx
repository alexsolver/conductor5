import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ActionCard } from './ActionCard';
import {
  Mail,
  Reply,
  Forward,
  Send,
  FileText,
  Edit,
  XCircle,
  ArrowRight,
  MessageCircle,
  Bell,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  BookOpen,
  Database,
  Link,
  Zap,
  Bot,
  Users,
  Tag,
  Archive,
  Star
} from 'lucide-react';

export interface ActionDefinition {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  category: 'communication' | 'tickets' | 'notifications' | 'scheduling' | 'data' | 'integrations' | 'ai';
  enabled?: boolean;
  config?: Record<string, any>;
  status?: 'configured' | 'partial' | 'unconfigured';
}

// Definição completa de todas as ações disponíveis
export const ACTION_DEFINITIONS: ActionDefinition[] = [
  // COMUNICAÇÃO
  {
    id: 'send_email',
    type: 'send_email',
    name: 'Enviar Email',
    description: 'Envia email com templates, anexos e CC/BCC',
    icon: Mail,
    color: 'bg-blue-500',
    category: 'communication'
  },
  {
    id: 'reply_email',
    type: 'reply_email',
    name: 'Responder Email',
    description: 'Responde email automaticamente',
    icon: Reply,
    color: 'bg-blue-600',
    category: 'communication'
  },
  {
    id: 'forward_email',
    type: 'forward_email',
    name: 'Encaminhar Email',
    description: 'Encaminha email para destinatários',
    icon: Forward,
    color: 'bg-blue-700',
    category: 'communication'
  },
  {
    id: 'auto_reply',
    type: 'auto_reply',
    name: 'Resposta Automática',
    description: 'Envia resposta pré-definida',
    icon: Reply,
    color: 'bg-cyan-500',
    category: 'communication'
  },

  // TICKETS
  {
    id: 'create_ticket',
    type: 'create_ticket',
    name: 'Criar Ticket',
    description: 'Cria ticket com campos dinâmicos',
    icon: FileText,
    color: 'bg-green-500',
    category: 'tickets'
  },
  {
    id: 'update_ticket',
    type: 'update_ticket',
    name: 'Atualizar Ticket',
    description: 'Atualiza status, prioridade, categoria',
    icon: Edit,
    color: 'bg-green-600',
    category: 'tickets'
  },
  {
    id: 'close_ticket',
    type: 'close_ticket',
    name: 'Fechar Ticket',
    description: 'Fecha ticket com motivo e feedback',
    icon: XCircle,
    color: 'bg-red-500',
    category: 'tickets'
  },
  {
    id: 'transfer_ticket',
    type: 'transfer_ticket',
    name: 'Transferir Ticket',
    description: 'Transfere para outro agente/equipe',
    icon: ArrowRight,
    color: 'bg-orange-500',
    category: 'tickets'
  },
  {
    id: 'add_comment',
    type: 'add_comment',
    name: 'Adicionar Comentário',
    description: 'Adiciona comentário em ticket',
    icon: MessageCircle,
    color: 'bg-green-700',
    category: 'tickets'
  },

  // NOTIFICAÇÕES
  {
    id: 'notify_in_app',
    type: 'notify_in_app',
    name: 'Notificação In-App',
    description: 'Notifica usuários/grupos no sistema',
    icon: Bell,
    color: 'bg-yellow-500',
    category: 'notifications'
  },
  {
    id: 'send_sms',
    type: 'send_sms',
    name: 'Enviar SMS',
    description: 'Envia SMS via Twilio',
    icon: Phone,
    color: 'bg-yellow-600',
    category: 'notifications'
  },
  {
    id: 'send_whatsapp',
    type: 'send_whatsapp',
    name: 'Enviar WhatsApp',
    description: 'Envia mensagem WhatsApp',
    icon: MessageSquare,
    color: 'bg-green-400',
    category: 'notifications'
  },
  {
    id: 'send_slack',
    type: 'send_slack',
    name: 'Enviar Slack',
    description: 'Envia mensagem no Slack',
    icon: MessageSquare,
    color: 'bg-purple-500',
    category: 'notifications'
  },
  {
    id: 'webhook',
    type: 'webhook',
    name: 'Webhook Customizado',
    description: 'POST para URL externa',
    icon: Link,
    color: 'bg-gray-600',
    category: 'notifications'
  },

  // AGENDAMENTO
  {
    id: 'schedule_appointment',
    type: 'schedule_appointment',
    name: 'Agendar Compromisso',
    description: 'Agenda data/hora com participantes',
    icon: Calendar,
    color: 'bg-indigo-500',
    category: 'scheduling'
  },
  {
    id: 'reschedule_appointment',
    type: 'reschedule_appointment',
    name: 'Remarcar Compromisso',
    description: 'Remarca compromisso existente',
    icon: Calendar,
    color: 'bg-indigo-600',
    category: 'scheduling'
  },
  {
    id: 'cancel_appointment',
    type: 'cancel_appointment',
    name: 'Cancelar Compromisso',
    description: 'Cancela compromisso agendado',
    icon: XCircle,
    color: 'bg-red-600',
    category: 'scheduling'
  },
  {
    id: 'send_reminder',
    type: 'send_reminder',
    name: 'Enviar Lembrete',
    description: 'Envia lembrete de compromisso',
    icon: Clock,
    color: 'bg-indigo-700',
    category: 'scheduling'
  },

  // DADOS
  {
    id: 'search_knowledge_base',
    type: 'search_knowledge_base',
    name: 'Buscar Base de Conhecimento',
    description: 'Busca artigos e FAQs',
    icon: BookOpen,
    color: 'bg-teal-500',
    category: 'data'
  },
  {
    id: 'query_customer_history',
    type: 'query_customer_history',
    name: 'Consultar Histórico',
    description: 'Consulta histórico do cliente',
    icon: Database,
    color: 'bg-teal-600',
    category: 'data'
  },
  {
    id: 'generate_report',
    type: 'generate_report',
    name: 'Gerar Relatório',
    description: 'Gera relatório customizável',
    icon: FileText,
    color: 'bg-teal-700',
    category: 'data'
  },

  // INTEGRAÇÕES
  {
    id: 'api_request',
    type: 'api_request',
    name: 'Chamada API',
    description: 'GET/POST customizável',
    icon: Link,
    color: 'bg-purple-600',
    category: 'integrations'
  },
  {
    id: 'sync_crm',
    type: 'sync_crm',
    name: 'Sincronizar CRM',
    description: 'Sincroniza com CRM externo',
    icon: Database,
    color: 'bg-purple-700',
    category: 'integrations'
  },

  // IA
  {
    id: 'ai_agent',
    type: 'ai_agent',
    name: 'Agente de IA Conversacional',
    description: 'IA que conversa e executa ações',
    icon: Bot,
    color: 'bg-pink-500',
    category: 'ai'
  },

  // EXTRAS
  {
    id: 'add_tags',
    type: 'add_tags',
    name: 'Adicionar Tags',
    description: 'Categoriza com tags',
    icon: Tag,
    color: 'bg-indigo-500',
    category: 'tickets'
  },
  {
    id: 'assign_agent',
    type: 'assign_agent',
    name: 'Atribuir Agente',
    description: 'Designa agente específico',
    icon: Users,
    color: 'bg-teal-500',
    category: 'tickets'
  },
  {
    id: 'archive',
    type: 'archive',
    name: 'Arquivar',
    description: 'Move para arquivo',
    icon: Archive,
    color: 'bg-gray-500',
    category: 'tickets'
  },
  {
    id: 'mark_priority',
    type: 'mark_priority',
    name: 'Marcar Prioridade',
    description: 'Define nível de prioridade',
    icon: Star,
    color: 'bg-red-500',
    category: 'tickets'
  },
  {
    id: 'escalate',
    type: 'escalate',
    name: 'Escalar',
    description: 'Escala para supervisor',
    icon: ArrowRight,
    color: 'bg-orange-600',
    category: 'tickets'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: Zap },
  { id: 'communication', label: 'Comunicação', icon: Mail },
  { id: 'tickets', label: 'Tickets', icon: FileText },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'scheduling', label: 'Agendamento', icon: Calendar },
  { id: 'data', label: 'Dados', icon: Database },
  { id: 'integrations', label: 'Integrações', icon: Link },
  { id: 'ai', label: 'IA', icon: Bot }
];

interface ActionGridProps {
  selectedActions: ActionDefinition[];
  onToggleAction: (action: ActionDefinition, enabled: boolean) => void;
  onConfigureAction: (action: ActionDefinition) => void;
}

export function ActionGrid({
  selectedActions,
  onToggleAction,
  onConfigureAction
}: ActionGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filtrar ações
  const filteredActions = ACTION_DEFINITIONS.filter(action => {
    const matchesSearch = action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || action.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Verificar se ação está selecionada
  const isActionEnabled = (actionId: string) => {
    return selectedActions.some(a => a.id === actionId);
  };

  // Pegar configuração da ação
  const getActionConfig = (actionId: string) => {
    return selectedActions.find(a => a.id === actionId)?.config || {};
  };

  // Determinar status da ação
  const getActionStatus = (action: ActionDefinition): 'configured' | 'partial' | 'unconfigured' => {
    const config = getActionConfig(action.id);
    const configKeys = Object.keys(config);
    
    if (configKeys.length === 0) return 'unconfigured';
    
    // Verificar se há configurações obrigatórias não preenchidas
    const hasAllRequired = configKeys.some(key => config[key]);
    return hasAllRequired ? 'configured' : 'partial';
  };

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar ações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="search-actions"
        />
      </div>

      {/* Tabs de categorias */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2" data-testid={`category-${cat.id}`}>
                <Icon className="h-4 w-4" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActions.map(action => (
              <ActionCard
                key={action.id}
                {...action}
                enabled={isActionEnabled(action.id)}
                config={getActionConfig(action.id)}
                status={isActionEnabled(action.id) ? getActionStatus(action) : 'unconfigured'}
                onToggle={(enabled) => onToggleAction(action, enabled)}
                onConfigure={() => onConfigureAction(action)}
              />
            ))}
          </div>

          {filteredActions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma ação encontrada
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
