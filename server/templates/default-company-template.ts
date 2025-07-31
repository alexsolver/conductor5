/**
 * Default Company Template
 * Template baseado nos dados reais da empresa Default do tenant atual
 * Para ser usado na criação de novos tenants
 */

export interface DefaultCompanyTemplate {
  company: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    industry: string;
    size: string;
    email: string;
    phone: string;
    website: string;
    subscriptionTier: string;
    status: string;
  };
  ticketFieldOptions: Array<{
    fieldName: string;
    value: string;
    label: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    isDefault: boolean;
    statusType?: string;
  }>;
  categories: Array<{
    name: string;
    description: string;
    color: string;
    icon: string;
    active: boolean;
    sortOrder: number;
  }>;
  subcategories: Array<{
    categoryName: string; // Nome da categoria pai
    name: string;
    description: string;
    color: string;
    icon: string;
    active: boolean;
    sortOrder: number;
  }>;
  actions: Array<{
    subcategoryName: string; // Nome da subcategoria pai
    name: string;
    description: string;
    estimatedTimeMinutes: number;
    color: string;
    icon: string;
    active: boolean;
    sortOrder: number;
    actionType: string;
  }>;
}

/**
 * Template baseado nos dados reais da empresa Default
 * Coletados em 31/07/2025 do tenant 3f99462f-3621-4b1b-bea8-782acc50d62e
 */
export const DEFAULT_COMPANY_TEMPLATE: DefaultCompanyTemplate = {
  company: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Default',
    displayName: '',
    description: '',
    industry: 'Teste Manual',
    size: 'medium',
    email: 'default@system.internal',
    phone: '+00 0000-0000',
    website: 'https://sistema.default',
    subscriptionTier: 'basic',
    status: 'active'
  },
  
  ticketFieldOptions: [
    // Categories
    { fieldName: 'category', value: 'suporte_tecnico', label: 'Suporte Técnico', color: '#3b82f6', sortOrder: 1, isActive: true, isDefault: true },
    { fieldName: 'category', value: 'atendimento_cliente', label: 'Atendimento ao Cliente', color: '#10b981', sortOrder: 2, isActive: true, isDefault: false },
    { fieldName: 'category', value: 'financeiro', label: 'Financeiro', color: '#f59e0b', sortOrder: 3, isActive: true, isDefault: false },
    { fieldName: 'category', value: 'infraestrutura', label: 'Infraestrutura', color: '#ef4444', sortOrder: 4, isActive: true, isDefault: false },
    
    // Impact
    { fieldName: 'impact', value: 'baixo', label: 'Baixo', color: '#10b981', sortOrder: 1, isActive: true, isDefault: true },
    { fieldName: 'impact', value: 'medio', label: 'Médio', color: '#f59e0b', sortOrder: 2, isActive: true, isDefault: false },
    { fieldName: 'impact', value: 'alto', label: 'Alto', color: '#ef4444', sortOrder: 3, isActive: true, isDefault: false },
    
    // Priority
    { fieldName: 'priority', value: 'low', label: 'Baixa', color: '#10b981', sortOrder: 1, isActive: true, isDefault: false },
    { fieldName: 'priority', value: 'medium', label: 'Média', color: '#f59e0b', sortOrder: 2, isActive: true, isDefault: true },
    { fieldName: 'priority', value: 'high', label: 'Alta', color: '#ef4444', sortOrder: 3, isActive: true, isDefault: false },
    { fieldName: 'priority', value: 'critical', label: 'Crítica', color: '#dc2626', sortOrder: 4, isActive: true, isDefault: false },
    
    // Status
    { fieldName: 'status', value: 'novo', label: 'Novo', color: '#6b7280', sortOrder: 1, isActive: true, isDefault: true, statusType: 'open' },
    { fieldName: 'status', value: 'aberto', label: 'Aberto', color: '#3b82f6', sortOrder: 2, isActive: true, isDefault: false, statusType: 'open' },
    { fieldName: 'status', value: 'em_andamento', label: 'Em Andamento', color: '#f59e0b', sortOrder: 3, isActive: true, isDefault: false, statusType: 'open' },
    { fieldName: 'status', value: 'resolvido', label: 'Resolvido', color: '#10b981', sortOrder: 4, isActive: true, isDefault: false, statusType: 'paused' },
    { fieldName: 'status', value: 'fechado', label: 'Fechado', color: '#6b7280', sortOrder: 5, isActive: true, isDefault: false, statusType: 'closed' },
    
    // Urgency
    { fieldName: 'urgency', value: 'low', label: 'Baixa', color: '#10b981', sortOrder: 1, isActive: true, isDefault: true },
    { fieldName: 'urgency', value: 'medium', label: 'Média', color: '#f59e0b', sortOrder: 2, isActive: true, isDefault: false },
    { fieldName: 'urgency', value: 'high', label: 'Alta', color: '#ef4444', sortOrder: 3, isActive: true, isDefault: false }
  ],
  
  categories: [
    {
      name: 'Suporte Técnico',
      description: 'Problemas relacionados a infraestrutura, hardware e software',
      color: '#3b82f6',
      icon: 'wrench',
      active: true,
      sortOrder: 1
    },
    {
      name: 'Atendimento ao Cliente',
      description: 'Dúvidas, reclamações e suporte geral ao cliente',
      color: '#10b981',
      icon: 'user-check',
      active: true,
      sortOrder: 2
    },
    {
      name: 'Financeiro',
      description: 'Questões relacionadas a faturamento, pagamentos e contratos',
      color: '#f59e0b',
      icon: 'dollar-sign',
      active: true,
      sortOrder: 3
    },
    {
      name: 'Administrativo',
      description: 'Processos internos, documentação e gestão',
      color: '#8b5cf6',
      icon: 'file-text',
      active: true,
      sortOrder: 4
    }
  ],
  
  subcategories: [
    // Suporte Técnico
    { categoryName: 'Suporte Técnico', name: 'Hardware', description: 'Problemas com equipamentos físicos', color: '#ef4444', icon: 'monitor', active: true, sortOrder: 1 },
    { categoryName: 'Suporte Técnico', name: 'Software', description: 'Problemas com aplicações e licenças', color: '#8b5cf6', icon: 'code', active: true, sortOrder: 2 },
    { categoryName: 'Suporte Técnico', name: 'Rede', description: 'Problemas de conectividade e infraestrutura', color: '#06b6d4', icon: 'wifi', active: true, sortOrder: 3 },
    
    // Atendimento ao Cliente
    { categoryName: 'Atendimento ao Cliente', name: 'Dúvidas Gerais', description: 'Questões sobre produtos e serviços', color: '#10b981', icon: 'help-circle', active: true, sortOrder: 1 },
    { categoryName: 'Atendimento ao Cliente', name: 'Reclamações', description: 'Insatisfação com produtos ou serviços', color: '#f59e0b', icon: 'alert-triangle', active: true, sortOrder: 2 },
    { categoryName: 'Atendimento ao Cliente', name: 'Sugestões', description: 'Ideias de melhoria e feedback', color: '#3b82f6', icon: 'lightbulb', active: true, sortOrder: 3 },
    
    // Financeiro
    { categoryName: 'Financeiro', name: 'Faturamento', description: 'Dúvidas sobre cobranças e faturas', color: '#f59e0b', icon: 'receipt', active: true, sortOrder: 1 },
    { categoryName: 'Financeiro', name: 'Pagamentos', description: 'Questões sobre forma de pagamento', color: '#10b981', icon: 'credit-card', active: true, sortOrder: 2 },
    { categoryName: 'Financeiro', name: 'Contratos', description: 'Alterações e renovações contratuais', color: '#8b5cf6', icon: 'file-signature', active: true, sortOrder: 3 },
    
    // Administrativo
    { categoryName: 'Administrativo', name: 'Documentação', description: 'Solicitação e emissão de documentos', color: '#6b7280', icon: 'file-text', active: true, sortOrder: 1 },
    { categoryName: 'Administrativo', name: 'Processos', description: 'Fluxos de trabalho e procedimentos', color: '#ef4444', icon: 'workflow', active: true, sortOrder: 2 },
    { categoryName: 'Administrativo', name: 'Treinamento', description: 'Capacitação e orientações', color: '#10b981', icon: 'graduation-cap', active: true, sortOrder: 3 }
  ],
  
  actions: [
    // Hardware
    { subcategoryName: 'Hardware', name: 'Diagnóstico de Hardware', description: 'Verificar funcionamento de componentes físicos', estimatedTimeMinutes: 60, color: '#ef4444', icon: 'search', active: true, sortOrder: 1, actionType: 'diagnostic' },
    { subcategoryName: 'Hardware', name: 'Substituição de Peças', description: 'Trocar componentes defeituosos', estimatedTimeMinutes: 120, color: '#ef4444', icon: 'tool', active: true, sortOrder: 2, actionType: 'repair' },
    { subcategoryName: 'Hardware', name: 'Manutenção Preventiva', description: 'Limpeza e verificação geral do equipamento', estimatedTimeMinutes: 90, color: '#ef4444', icon: 'shield', active: true, sortOrder: 3, actionType: 'maintenance' },
    
    // Software
    { subcategoryName: 'Software', name: 'Reinstalação de Software', description: 'Remover e instalar novamente aplicações', estimatedTimeMinutes: 45, color: '#8b5cf6', icon: 'download', active: true, sortOrder: 1, actionType: 'installation' },
    { subcategoryName: 'Software', name: 'Atualização de Sistema', description: 'Aplicar patches e atualizações', estimatedTimeMinutes: 30, color: '#8b5cf6', icon: 'refresh-cw', active: true, sortOrder: 2, actionType: 'update' },
    { subcategoryName: 'Software', name: 'Configuração de Aplicação', description: 'Ajustar parâmetros e preferências', estimatedTimeMinutes: 30, color: '#8b5cf6', icon: 'settings', active: true, sortOrder: 3, actionType: 'configuration' },
    
    // Rede
    { subcategoryName: 'Rede', name: 'Teste de Conectividade', description: 'Verificar comunicação de rede', estimatedTimeMinutes: 20, color: '#06b6d4', icon: 'activity', active: true, sortOrder: 1, actionType: 'testing' },
    { subcategoryName: 'Rede', name: 'Configuração de Firewall', description: 'Ajustar regras de segurança', estimatedTimeMinutes: 40, color: '#06b6d4', icon: 'shield', active: true, sortOrder: 2, actionType: 'configuration' },
    { subcategoryName: 'Rede', name: 'Reset de Equipamentos', description: 'Reinicializar dispositivos de rede', estimatedTimeMinutes: 15, color: '#06b6d4', icon: 'rotate-ccw', active: true, sortOrder: 3, actionType: 'reset' },
    
    // Dúvidas Gerais
    { subcategoryName: 'Dúvidas Gerais', name: 'Resposta por E-mail', description: 'Esclarecer dúvidas via comunicação escrita', estimatedTimeMinutes: 15, color: '#10b981', icon: 'mail', active: true, sortOrder: 1, actionType: 'communication' },
    { subcategoryName: 'Dúvidas Gerais', name: 'Atendimento Telefônico', description: 'Esclarecimento por telefone', estimatedTimeMinutes: 20, color: '#10b981', icon: 'phone', active: true, sortOrder: 2, actionType: 'communication' },
    { subcategoryName: 'Dúvidas Gerais', name: 'Consulta FAQ', description: 'Direcionamento para base de conhecimento', estimatedTimeMinutes: 5, color: '#10b981', icon: 'book-open', active: true, sortOrder: 3, actionType: 'reference' },
    
    // Reclamações
    { subcategoryName: 'Reclamações', name: 'Investigar Reclamação', description: 'Analisar e apurar os fatos relatados', estimatedTimeMinutes: 45, color: '#f59e0b', icon: 'search', active: true, sortOrder: 1, actionType: 'investigation' },
    { subcategoryName: 'Reclamações', name: 'Oferecer Compensação', description: 'Propor solução ou ressarcimento', estimatedTimeMinutes: 30, color: '#f59e0b', icon: 'gift', active: true, sortOrder: 2, actionType: 'compensation' },
    { subcategoryName: 'Reclamações', name: 'Escalar para Supervisor', description: 'Encaminhar para nível superior', estimatedTimeMinutes: 10, color: '#f59e0b', icon: 'arrow-up', active: true, sortOrder: 3, actionType: 'escalation' },
    
    // Sugestões
    { subcategoryName: 'Sugestões', name: 'Avaliar Sugestão', description: 'Analisar viabilidade da proposta', estimatedTimeMinutes: 25, color: '#3b82f6', icon: 'star', active: true, sortOrder: 1, actionType: 'evaluation' },
    { subcategoryName: 'Sugestões', name: 'Encaminhar para Produto', description: 'Direcionar para equipe de desenvolvimento', estimatedTimeMinutes: 15, color: '#3b82f6', icon: 'send', active: true, sortOrder: 2, actionType: 'routing' },
    { subcategoryName: 'Sugestões', name: 'Agradecer Cliente', description: 'Reconhecer contribuição do cliente', estimatedTimeMinutes: 10, color: '#3b82f6', icon: 'heart', active: true, sortOrder: 3, actionType: 'communication' },
    
    // Faturamento
    { subcategoryName: 'Faturamento', name: 'Verificar Cobrança', description: 'Analisar itens da fatura', estimatedTimeMinutes: 20, color: '#f59e0b', icon: 'calculator', active: true, sortOrder: 1, actionType: 'verification' },
    { subcategoryName: 'Faturamento', name: 'Reemitir Fatura', description: 'Gerar nova via do documento', estimatedTimeMinutes: 10, color: '#f59e0b', icon: 'file-text', active: true, sortOrder: 2, actionType: 'documentation' },
    { subcategoryName: 'Faturamento', name: 'Ajustar Valores', description: 'Corrigir divergências de valores', estimatedTimeMinutes: 30, color: '#f59e0b', icon: 'edit', active: true, sortOrder: 3, actionType: 'adjustment' },
    
    // Pagamentos
    { subcategoryName: 'Pagamentos', name: 'Confirmar Pagamento', description: 'Verificar recebimento de valores', estimatedTimeMinutes: 15, color: '#10b981', icon: 'check-circle', active: true, sortOrder: 1, actionType: 'verification' },
    { subcategoryName: 'Pagamentos', name: 'Renegociar Condições', description: 'Alterar forma ou prazo de pagamento', estimatedTimeMinutes: 45, color: '#f59e0b', icon: 'calendar', active: true, sortOrder: 2, actionType: 'negotiation' },
    { subcategoryName: 'Pagamentos', name: 'Processar Estorno', description: 'Reverter cobrança indevida', estimatedTimeMinutes: 60, color: '#ef4444', icon: 'rotate-ccw', active: true, sortOrder: 3, actionType: 'refund' },
    
    // Contratos
    { subcategoryName: 'Contratos', name: 'Revisar Cláusulas', description: 'Analisar termos contratuais', estimatedTimeMinutes: 30, color: '#8b5cf6', icon: 'file-search', active: true, sortOrder: 1, actionType: 'review' },
    { subcategoryName: 'Contratos', name: 'Preparar Aditivo', description: 'Elaborar alteração contratual', estimatedTimeMinutes: 90, color: '#8b5cf6', icon: 'file-plus', active: true, sortOrder: 2, actionType: 'documentation' },
    { subcategoryName: 'Contratos', name: 'Renovar Contrato', description: 'Processar renovação automática', estimatedTimeMinutes: 60, color: '#8b5cf6', icon: 'refresh-cw', active: true, sortOrder: 3, actionType: 'renewal' },
    
    // Documentação
    { subcategoryName: 'Documentação', name: 'Emitir Certidão', description: 'Gerar documento oficial', estimatedTimeMinutes: 20, color: '#6b7280', icon: 'award', active: true, sortOrder: 1, actionType: 'documentation' },
    { subcategoryName: 'Documentação', name: 'Autenticar Documento', description: 'Validar autenticidade', estimatedTimeMinutes: 15, color: '#6b7280', icon: 'shield-check', active: true, sortOrder: 2, actionType: 'verification' },
    { subcategoryName: 'Documentação', name: 'Arquivo Digital', description: 'Digitalizar e arquivar documento', estimatedTimeMinutes: 10, color: '#6b7280', icon: 'archive', active: true, sortOrder: 3, actionType: 'archiving' },
    
    // Processos
    { subcategoryName: 'Processos', name: 'Mapear Fluxo', description: 'Documentar processo atual', estimatedTimeMinutes: 60, color: '#ef4444', icon: 'git-branch', active: true, sortOrder: 1, actionType: 'analysis' },
    { subcategoryName: 'Processos', name: 'Otimizar Etapas', description: 'Melhorar eficiência do processo', estimatedTimeMinutes: 120, color: '#ef4444', icon: 'trending-up', active: true, sortOrder: 2, actionType: 'optimization' },
    { subcategoryName: 'Processos', name: 'Implementar Mudanças', description: 'Aplicar melhorias identificadas', estimatedTimeMinutes: 180, color: '#ef4444', icon: 'play-circle', active: true, sortOrder: 3, actionType: 'implementation' },
    
    // Treinamento
    { subcategoryName: 'Treinamento', name: 'Capacitar Usuário', description: 'Treinar no uso do sistema', estimatedTimeMinutes: 60, color: '#10b981', icon: 'user-plus', active: true, sortOrder: 1, actionType: 'training' },
    { subcategoryName: 'Treinamento', name: 'Criar Material', description: 'Elaborar guias e manuais', estimatedTimeMinutes: 90, color: '#10b981', icon: 'book', active: true, sortOrder: 2, actionType: 'documentation' },
    { subcategoryName: 'Treinamento', name: 'Orientar Processo', description: 'Explicar procedimentos específicos', estimatedTimeMinutes: 30, color: '#10b981', icon: 'compass', active: true, sortOrder: 3, actionType: 'guidance' }
  ]
};