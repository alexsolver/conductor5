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
    { fieldName: 'category', value: 'infraestrutura_equipamentos', label: 'Infraestrutura & Equipamentos', color: '#6366f1', sortOrder: 1, isActive: true, isDefault: true },
    { fieldName: 'category', value: 'software_aplicacoes', label: 'Software & Aplicações', color: '#10b981', sortOrder: 2, isActive: true, isDefault: false },
    { fieldName: 'category', value: 'conectividade_redes', label: 'Conectividade & Redes', color: '#8b5cf6', sortOrder: 3, isActive: true, isDefault: false },
    { fieldName: 'category', value: 'seguranca_acesso', label: 'Segurança & Acesso', color: '#dc2626', sortOrder: 4, isActive: true, isDefault: false },
    { fieldName: 'category', value: 'usuarios_suporte', label: 'Usuários & Suporte', color: '#f59e0b', sortOrder: 5, isActive: true, isDefault: false },
    
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
      name: 'Infraestrutura & Equipamentos',
      description: 'Problemas relacionados a hardware, equipamentos e infraestrutura física',
      color: '#6366f1',
      icon: 'monitor',
      active: true,
      sortOrder: 1
    },
    {
      name: 'Software & Aplicações',
      description: 'Questões relacionadas a softwares, aplicativos e sistemas',
      color: '#10b981',
      icon: 'code',
      active: true,
      sortOrder: 2
    },
    {
      name: 'Conectividade & Redes',
      description: 'Problemas de rede, conectividade e comunicação',
      color: '#8b5cf6',
      icon: 'wifi',
      active: true,
      sortOrder: 3
    },
    {
      name: 'Segurança & Acesso',
      description: 'Questões de segurança, acessos e permissões',
      color: '#dc2626',
      icon: 'shield',
      active: true,
      sortOrder: 4
    },
    {
      name: 'Usuários & Suporte',
      description: 'Solicitações de usuários, treinamentos e suporte geral',
      color: '#f59e0b',
      icon: 'user-check',
      active: true,
      sortOrder: 5
    }
  ],
  
  subcategories: [
    // Infraestrutura & Equipamentos
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Computadores Desktop', description: 'Problemas com PCs fixos', color: '#6366f1', icon: 'monitor', active: true, sortOrder: 1 },
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Notebooks e Móveis', description: 'Laptops, tablets, dispositivos móveis', color: '#6366f1', icon: 'laptop', active: true, sortOrder: 2 },
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Servidores', description: 'Infraestrutura de servidores', color: '#6366f1', icon: 'server', active: true, sortOrder: 3 },
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Periféricos', description: 'Impressoras, monitores, teclados, mouse', color: '#6366f1', icon: 'printer', active: true, sortOrder: 4 },
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Telefonia', description: 'Telefones IP, centrais telefônicas', color: '#6366f1', icon: 'phone', active: true, sortOrder: 5 },
    
    // Software & Aplicações
    { categoryName: 'Software & Aplicações', name: 'Sistema Operacional', description: 'Windows, Linux, macOS', color: '#10b981', icon: 'monitor', active: true, sortOrder: 1 },
    { categoryName: 'Software & Aplicações', name: 'Aplicações Corporativas', description: 'ERP, CRM, sistemas internos', color: '#10b981', icon: 'briefcase', active: true, sortOrder: 2 },
    { categoryName: 'Software & Aplicações', name: 'Software de Produtividade', description: 'Office, navegadores, ferramentas', color: '#10b981', icon: 'edit', active: true, sortOrder: 3 },
    { categoryName: 'Software & Aplicações', name: 'Licenciamento', description: 'Renovações, ativações, compliance', color: '#10b981', icon: 'key', active: true, sortOrder: 4 },
    { categoryName: 'Software & Aplicações', name: 'Atualizações', description: 'Patches, versões, upgrades', color: '#10b981', icon: 'refresh-cw', active: true, sortOrder: 5 },
    
    // Conectividade & Redes
    { categoryName: 'Conectividade & Redes', name: 'Rede Local (LAN)', description: 'Switches, cabos, conectividade interna', color: '#8b5cf6', icon: 'network', active: true, sortOrder: 1 },
    { categoryName: 'Conectividade & Redes', name: 'Internet e WAN', description: 'Conexões externas, provedores', color: '#8b5cf6', icon: 'globe', active: true, sortOrder: 2 },
    { categoryName: 'Conectividade & Redes', name: 'Wi-Fi e Wireless', description: 'Redes sem fio, access points', color: '#8b5cf6', icon: 'wifi', active: true, sortOrder: 3 },
    { categoryName: 'Conectividade & Redes', name: 'VPN e Acesso Remoto', description: 'Conexões seguras, trabalho remoto', color: '#8b5cf6', icon: 'shield', active: true, sortOrder: 4 },
    { categoryName: 'Conectividade & Redes', name: 'Telefonia e VoIP', description: 'Comunicação por voz sobre IP', color: '#8b5cf6', icon: 'phone-call', active: true, sortOrder: 5 },
    
    // Segurança & Acesso
    { categoryName: 'Segurança & Acesso', name: 'Controle de Acesso', description: 'Permissões, usuários, grupos', color: '#dc2626', icon: 'lock', active: true, sortOrder: 1 },
    { categoryName: 'Segurança & Acesso', name: 'Antivírus e Proteção', description: 'Malware, ameaças, quarentena', color: '#dc2626', icon: 'shield-check', active: true, sortOrder: 2 },
    { categoryName: 'Segurança & Acesso', name: 'Firewall e Políticas', description: 'Bloqueios, regras de segurança', color: '#dc2626', icon: 'shield', active: true, sortOrder: 3 },
    { categoryName: 'Segurança & Acesso', name: 'Backup e Recovery', description: 'Backups, restaurações, disaster recovery', color: '#dc2626', icon: 'hard-drive', active: true, sortOrder: 4 },
    { categoryName: 'Segurança & Acesso', name: 'Compliance', description: 'Auditoria, conformidade, políticas', color: '#dc2626', icon: 'file-check', active: true, sortOrder: 5 },
    
    // Usuários & Suporte
    { categoryName: 'Usuários & Suporte', name: 'Contas e Perfis', description: 'Criação, alteração, desativação de usuários', color: '#f59e0b', icon: 'user', active: true, sortOrder: 1 },
    { categoryName: 'Usuários & Suporte', name: 'Treinamento', description: 'Capacitação, manuais, orientações', color: '#f59e0b', icon: 'graduation-cap', active: true, sortOrder: 2 },
    { categoryName: 'Usuários & Suporte', name: 'Solicitações Gerais', description: 'Pedidos diversos, informações', color: '#f59e0b', icon: 'help-circle', active: true, sortOrder: 3 },
    { categoryName: 'Usuários & Suporte', name: 'Procedimentos', description: 'Processos, fluxos, documentação', color: '#f59e0b', icon: 'file-text', active: true, sortOrder: 4 },
    { categoryName: 'Usuários & Suporte', name: 'Consultoria', description: 'Orientações técnicas, recomendações', color: '#f59e0b', icon: 'lightbulb', active: true, sortOrder: 5 }
  ],
  actions: [
    // Infraestrutura & Equipamentos
    { name: 'Substituição de Componente', subcategoryName: 'Computadores Desktop', description: 'Trocar peça defeituosa', estimatedTimeMinutes: 90, color: '#6366f1', icon: 'tool', active: true, sortOrder: 1, actionType: 'repair' },
    { name: 'Manutenção Preventiva', subcategoryName: 'Computadores Desktop', description: 'Limpeza e verificação geral', estimatedTimeMinutes: 60, color: '#6366f1', icon: 'shield', active: true, sortOrder: 2, actionType: 'maintenance' },
    { name: 'Configuração de Hardware', subcategoryName: 'Notebooks e Móveis', description: 'Configurar dispositivo móvel', estimatedTimeMinutes: 45, color: '#6366f1', icon: 'settings', active: true, sortOrder: 1, actionType: 'configuration' },
    { name: 'Instalação de Equipamento', subcategoryName: 'Servidores', description: 'Instalar novo servidor', estimatedTimeMinutes: 150, color: '#6366f1', icon: 'plus-circle', active: true, sortOrder: 1, actionType: 'installation' },
    { name: 'Diagnóstico Técnico', subcategoryName: 'Periféricos', description: 'Diagnosticar problema em periférico', estimatedTimeMinutes: 45, color: '#6366f1', icon: 'search', active: true, sortOrder: 1, actionType: 'diagnostic' },

    // Software & Aplicações
    { name: 'Instalação de Software', subcategoryName: 'Sistema Operacional', description: 'Instalar aplicação no sistema', estimatedTimeMinutes: 120, color: '#10b981', icon: 'download', active: true, sortOrder: 1, actionType: 'installation' },
    { name: 'Atualização de Sistema', subcategoryName: 'Sistema Operacional', description: 'Atualizar SO para nova versão', estimatedTimeMinutes: 60, color: '#10b981', icon: 'refresh-cw', active: true, sortOrder: 2, actionType: 'update' },
    { name: 'Correção de Bug', subcategoryName: 'Aplicações Corporativas', description: 'Corrigir erro em aplicação', estimatedTimeMinutes: 90, color: '#10b981', icon: 'bug', active: true, sortOrder: 1, actionType: 'bugfix' },
    { name: 'Configuração de Aplicação', subcategoryName: 'Software de Produtividade', description: 'Configurar software para usuário', estimatedTimeMinutes: 45, color: '#10b981', icon: 'settings', active: true, sortOrder: 1, actionType: 'configuration' },
    { name: 'Licenciamento', subcategoryName: 'Licenciamento', description: 'Renovar ou ativar licença', estimatedTimeMinutes: 30, color: '#10b981', icon: 'key', active: true, sortOrder: 1, actionType: 'licensing' },

    // Conectividade & Redes
    { name: 'Diagnóstico de Rede', subcategoryName: 'Rede Local (LAN)', description: 'Diagnosticar problema de conexão', estimatedTimeMinutes: 45, color: '#8b5cf6', icon: 'activity', active: true, sortOrder: 1, actionType: 'diagnostic' },
    { name: 'Configuração de Acesso', subcategoryName: 'Internet e WAN', description: 'Configurar acesso à internet', estimatedTimeMinutes: 60, color: '#8b5cf6', icon: 'settings', active: true, sortOrder: 1, actionType: 'configuration' },
    { name: 'Reset de Conexão', subcategoryName: 'Wi-Fi e Wireless', description: 'Resetar configurações Wi-Fi', estimatedTimeMinutes: 20, color: '#8b5cf6', icon: 'rotate-ccw', active: true, sortOrder: 1, actionType: 'reset' },
    { name: 'Configuração VPN', subcategoryName: 'VPN e Acesso Remoto', description: 'Configurar conexão VPN', estimatedTimeMinutes: 45, color: '#8b5cf6', icon: 'lock', active: true, sortOrder: 1, actionType: 'configuration' },

    // Segurança & Acesso
    { name: 'Liberação de Acesso', subcategoryName: 'Controle de Acesso', description: 'Liberar acesso para usuário', estimatedTimeMinutes: 20, color: '#dc2626', icon: 'unlock', active: true, sortOrder: 1, actionType: 'access_grant' },
    { name: 'Bloqueio de Ameaça', subcategoryName: 'Antivírus e Proteção', description: 'Bloquear ameaça detectada', estimatedTimeMinutes: 30, color: '#dc2626', icon: 'shield-x', active: true, sortOrder: 1, actionType: 'security' },
    { name: 'Restauração de Backup', subcategoryName: 'Backup e Recovery', description: 'Restaurar dados de backup', estimatedTimeMinutes: 90, color: '#dc2626', icon: 'rotate-ccw', active: true, sortOrder: 1, actionType: 'restore' },

    // Usuários & Suporte
    { name: 'Criação de Usuário', subcategoryName: 'Contas e Perfis', description: 'Criar nova conta de usuário', estimatedTimeMinutes: 30, color: '#f59e0b', icon: 'user-plus', active: true, sortOrder: 1, actionType: 'user_management' },
    { name: 'Treinamento Técnico', subcategoryName: 'Treinamento', description: 'Treinar usuário em sistema', estimatedTimeMinutes: 120, color: '#f59e0b', icon: 'graduation-cap', active: true, sortOrder: 1, actionType: 'training' },
    { name: 'Orientação Técnica', subcategoryName: 'Solicitações Gerais', description: 'Orientar usuário sobre procedimento', estimatedTimeMinutes: 45, color: '#f59e0b', icon: 'lightbulb', active: true, sortOrder: 1, actionType: 'guidance' }
  ]

};