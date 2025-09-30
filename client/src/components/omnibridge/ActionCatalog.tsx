import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Ticket,
  Building2, 
  MapPin, 
  UserCheck, 
  Mail, 
  Globe, 
  Webhook, 
  BookOpen, 
  AlertTriangle,
  Phone,
  Calendar,
  FileText,
  Search,
  Plus
} from 'lucide-react';
import { useState } from 'react';

export interface ActionDefinition {
  id: string;
  name: string;
  label: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<any>;
  category: 'entity' | 'communication' | 'integration' | 'knowledge' | 'workflow';
  color: string;
  enabled: boolean;
  requiresConfig: boolean;
  tags: string[];
  examples: string[];
}

export const ActionCatalogData: ActionDefinition[] = [
  // Entity Creation Actions
  {
    id: 'create_ticket',
    name: 'createTicket',
    label: 'Criar Ticket',
    description: 'Abre um novo chamado de suporte a partir da conversa',
    longDescription: 'Permite que a IA extraia informações da conversa e crie automaticamente um ticket de suporte com todos os campos necessários preenchidos.',
    icon: Ticket,
    category: 'entity',
    color: 'from-purple-500 to-blue-500',
    enabled: false,
    requiresConfig: true,
    tags: ['ticket', 'chamado', 'suporte', 'atendimento'],
    examples: [
      'Usuário: "Minha impressora não está funcionando"',
      'IA extrai: título, descrição, prioridade, categoria',
      'Ticket criado automaticamente com feedback ao usuário'
    ]
  },
  {
    id: 'create_client',
    name: 'createClient',
    label: 'Criar Cliente',
    description: 'Cadastra um novo cliente/empresa no sistema',
    longDescription: 'Coleta informações sobre empresas ou pessoas físicas para criar um novo cadastro de cliente com dados completos como nome, e-mail, telefone, CNPJ/CPF, endereço.',
    icon: Building2,
    category: 'entity',
    color: 'from-blue-500 to-cyan-500',
    enabled: false,
    requiresConfig: true,
    tags: ['cliente', 'empresa', 'cadastro', 'crm'],
    examples: [
      'Usuário: "Quero cadastrar nossa empresa"',
      'IA coleta: nome, CNPJ, email, telefone, endereço',
      'Cliente criado com confirmação'
    ]
  },
  {
    id: 'create_location',
    name: 'createLocation',
    label: 'Criar Local',
    description: 'Registra um novo local ou endereço no sistema',
    longDescription: 'Permite cadastrar locais físicos, endereços, filiais ou pontos de atendimento com informações completas de localização e coordenadas geográficas.',
    icon: MapPin,
    category: 'entity',
    color: 'from-green-500 to-emerald-500',
    enabled: false,
    requiresConfig: true,
    tags: ['local', 'endereço', 'localização', 'filial'],
    examples: [
      'Usuário: "Quero adicionar nossa nova filial"',
      'IA extrai: nome, endereço completo, cidade, CEP',
      'Local cadastrado e vinculado'
    ]
  },
  {
    id: 'create_beneficiary',
    name: 'createBeneficiary',
    label: 'Criar Favorecido',
    description: 'Adiciona um novo contato ou beneficiário',
    longDescription: 'Cadastra pessoas favorecidas ou contatos associados com informações pessoais, profissionais e de contato.',
    icon: UserCheck,
    category: 'entity',
    color: 'from-orange-500 to-red-500',
    enabled: false,
    requiresConfig: true,
    tags: ['favorecido', 'contato', 'pessoa', 'beneficiário'],
    examples: [
      'Usuário: "Quero cadastrar um novo contato"',
      'IA coleta: nome, email, telefone, cargo, departamento',
      'Favorecido criado no sistema'
    ]
  },

  // Communication Actions
  {
    id: 'send_email',
    name: 'sendEmail',
    label: 'Enviar E-mail',
    description: 'Envia e-mail personalizado para destinatários',
    longDescription: 'Compõe e envia e-mails com templates personalizados, anexos e variáveis dinâmicas. Ideal para respostas automáticas, notificações ou follow-ups.',
    icon: Mail,
    category: 'communication',
    color: 'from-blue-600 to-indigo-600',
    enabled: false,
    requiresConfig: true,
    tags: ['email', 'envio', 'comunicação', 'notificação'],
    examples: [
      'Enviar confirmação de agendamento',
      'Notificar equipe sobre novo ticket',
      'Enviar relatório por e-mail'
    ]
  },
  {
    id: 'reply_email',
    name: 'replyEmail',
    label: 'Responder E-mail',
    description: 'Responde automaticamente e-mails recebidos',
    longDescription: 'Analisa e-mails recebidos e gera respostas contextualizadas usando IA, mantendo o histórico da conversa.',
    icon: Mail,
    category: 'communication',
    color: 'from-violet-600 to-purple-600',
    enabled: false,
    requiresConfig: true,
    tags: ['email', 'resposta', 'automação'],
    examples: [
      'Responder solicitações com base na KB',
      'Confirmar recebimento de documentos',
      'Responder dúvidas frequentes'
    ]
  },
  {
    id: 'send_sms',
    name: 'sendSms',
    label: 'Enviar SMS',
    description: 'Envia mensagem SMS para telefone',
    longDescription: 'Integração com serviços de SMS para envio de notificações urgentes, códigos de verificação ou alertas.',
    icon: Phone,
    category: 'communication',
    color: 'from-pink-600 to-rose-600',
    enabled: false,
    requiresConfig: true,
    tags: ['sms', 'telefone', 'notificação', 'urgente'],
    examples: [
      'Código de verificação',
      'Alerta de atendimento urgente',
      'Lembrete de compromisso'
    ]
  },

  // Integration Actions
  {
    id: 'webhook',
    name: 'webhook',
    label: 'Chamar Webhook',
    description: 'Envia dados para URL externa via HTTP',
    longDescription: 'Realiza chamadas HTTP para APIs externas, enviando dados extraídos da conversa. Suporta GET, POST, PUT, DELETE com headers e autenticação personalizados.',
    icon: Webhook,
    category: 'integration',
    color: 'from-amber-600 to-orange-600',
    enabled: false,
    requiresConfig: true,
    tags: ['webhook', 'api', 'integração', 'http'],
    examples: [
      'Notificar sistema externo sobre novo ticket',
      'Sincronizar dados com CRM',
      'Atualizar planilha online'
    ]
  },
  {
    id: 'api_call',
    name: 'apiCall',
    label: 'Chamada de API',
    description: 'Executa requisições para APIs REST',
    longDescription: 'Construtor visual para configurar chamadas HTTP complexas com corpo JSON, query params, headers e tratamento de resposta.',
    icon: Globe,
    category: 'integration',
    color: 'from-teal-600 to-cyan-600',
    enabled: false,
    requiresConfig: true,
    tags: ['api', 'rest', 'integração', 'http'],
    examples: [
      'Consultar API de CEP',
      'Buscar dados em sistema externo',
      'Validar informações em tempo real'
    ]
  },

  // Knowledge Base Actions
  {
    id: 'query_knowledge_base',
    name: 'queryKnowledgeBase',
    label: 'Consultar Base de Conhecimentos',
    description: 'Busca informações na base de conhecimentos',
    longDescription: 'Pesquisa artigos, documentos e soluções na base de conhecimentos usando IA para encontrar respostas relevantes.',
    icon: BookOpen,
    category: 'knowledge',
    color: 'from-emerald-600 to-green-600',
    enabled: false,
    requiresConfig: true,
    tags: ['kb', 'conhecimento', 'pesquisa', 'documentação'],
    examples: [
      'Buscar solução para problema conhecido',
      'Consultar procedimento operacional',
      'Encontrar documentação técnica'
    ]
  },
  {
    id: 'search_tickets',
    name: 'searchTickets',
    label: 'Pesquisar Tickets',
    description: 'Busca tickets existentes no sistema',
    longDescription: 'Procura tickets relacionados usando palavras-chave, categorias ou similaridade semântica para evitar duplicatas ou encontrar histórico.',
    icon: Search,
    category: 'knowledge',
    color: 'from-blue-600 to-purple-600',
    enabled: false,
    requiresConfig: true,
    tags: ['ticket', 'busca', 'pesquisa', 'histórico'],
    examples: [
      'Verificar tickets similares',
      'Buscar histórico do cliente',
      'Encontrar tickets relacionados'
    ]
  },

  // Workflow Actions
  {
    id: 'escalate',
    name: 'escalate',
    label: 'Escalonar',
    description: 'Escalona para usuário ou equipe especializada',
    longDescription: 'Transfere o atendimento ou ticket para um nível superior de suporte, especialista ou gerente com notificação automática.',
    icon: AlertTriangle,
    category: 'workflow',
    color: 'from-red-600 to-pink-600',
    enabled: false,
    requiresConfig: true,
    tags: ['escalação', 'urgente', 'transferência', 'especialista'],
    examples: [
      'Problema complexo → Especialista',
      'Cliente VIP → Gerente',
      'Urgência crítica → Plantão'
    ]
  },
  {
    id: 'schedule_appointment',
    name: 'scheduleAppointment',
    label: 'Agendar Atendimento',
    description: 'Agenda compromisso no calendário',
    longDescription: 'Cria agendamentos no sistema de calendário com data, hora, participantes e notificações automáticas.',
    icon: Calendar,
    category: 'workflow',
    color: 'from-indigo-600 to-blue-600',
    enabled: false,
    requiresConfig: true,
    tags: ['agenda', 'calendário', 'compromisso', 'reunião'],
    examples: [
      'Agendar visita técnica',
      'Marcar reunião com cliente',
      'Programar manutenção'
    ]
  },
  {
    id: 'generate_report',
    name: 'generateReport',
    label: 'Gerar Relatório',
    description: 'Cria relatório com dados coletados',
    longDescription: 'Compila informações da conversa e gera relatórios formatados em PDF ou outros formatos para documentação.',
    icon: FileText,
    category: 'workflow',
    color: 'from-slate-600 to-gray-600',
    enabled: false,
    requiresConfig: true,
    tags: ['relatório', 'documento', 'pdf', 'registro'],
    examples: [
      'Relatório de atendimento',
      'Resumo de incidente',
      'Documentação de chamado'
    ]
  }
];

interface ActionCatalogProps {
  selectedActions: string[];
  onActionToggle: (actionId: string, enabled: boolean) => void;
  onActionConfigure: (actionId: string) => void;
}

export function ActionCatalog({ selectedActions, onActionToggle, onActionConfigure }: ActionCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas', count: ActionCatalogData.length },
    { id: 'entity', label: 'Criar Entidades', count: ActionCatalogData.filter(a => a.category === 'entity').length },
    { id: 'communication', label: 'Comunicação', count: ActionCatalogData.filter(a => a.category === 'communication').length },
    { id: 'integration', label: 'Integrações', count: ActionCatalogData.filter(a => a.category === 'integration').length },
    { id: 'knowledge', label: 'Conhecimento', count: ActionCatalogData.filter(a => a.category === 'knowledge').length },
    { id: 'workflow', label: 'Fluxo de Trabalho', count: ActionCatalogData.filter(a => a.category === 'workflow').length }
  ];

  const filteredActions = ActionCatalogData.filter(action => {
    const matchesSearch = 
      action.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || action.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Catálogo de Ações</h3>
        <p className="text-muted-foreground mt-1">
          Selecione as ações que o AI Agent pode executar durante a conversa
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar ações por nome, descrição ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-actions"
            className="w-full"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={filterCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat.id)}
            data-testid={`button-filter-${cat.id}`}
          >
            {cat.label} ({cat.count})
          </Button>
        ))}
      </div>

      {/* Actions Grid */}
      <ScrollArea className="h-[700px]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
          {filteredActions.map(action => {
            const Icon = action.icon;
            const isSelected = selectedActions.includes(action.id);

            return (
              <Card 
                key={action.id} 
                className={`relative overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-5`} />
                
                <CardHeader className="relative pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {isSelected && (
                      <Badge className="bg-primary">Ativo</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{action.label}</CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {action.longDescription}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {action.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={isSelected ? 'secondary' : 'default'}
                      size="sm"
                      className="flex-1"
                      onClick={() => onActionToggle(action.id, !isSelected)}
                      data-testid={`button-toggle-${action.id}`}
                    >
                      {isSelected ? 'Remover' : 'Adicionar'}
                    </Button>
                    {isSelected && action.requiresConfig && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onActionConfigure(action.id)}
                        data-testid={`button-configure-${action.id}`}
                      >
                        Configurar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredActions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma ação encontrada</p>
            <p className="text-xs mt-1">Tente outros termos de busca</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
