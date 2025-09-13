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
    // Computadores Desktop
    { subcategoryName: 'Computadores Desktop', name: 'Substituição de Componente', description: 'Trocar peças defeituosas do PC', estimatedTimeMinutes: 90, color: '#6366f1', icon: 'tool', active: true, sortOrder: 1, actionType: 'repair' },
    { subcategoryName: 'Computadores Desktop', name: 'Manutenção Preventiva', description: 'Limpeza e verificação geral do desktop', estimatedTimeMinutes: 60, color: '#6366f1', icon: 'shield', active: true, sortOrder: 2, actionType: 'maintenance' },
    { subcategoryName: 'Computadores Desktop', name: 'Configuração de Hardware', description: 'Configurar BIOS e componentes', estimatedTimeMinutes: 45, color: '#6366f1', icon: 'settings', active: true, sortOrder: 3, actionType: 'configuration' },
    { subcategoryName: 'Computadores Desktop', name: 'Instalação de Equipamento', description: 'Instalar novo desktop', estimatedTimeMinutes: 120, color: '#6366f1', icon: 'plus-circle', active: true, sortOrder: 4, actionType: 'installation' },
    { subcategoryName: 'Computadores Desktop', name: 'Diagnóstico Técnico', description: 'Analisar problemas de hardware', estimatedTimeMinutes: 60, color: '#6366f1', icon: 'search', active: true, sortOrder: 5, actionType: 'diagnostic' },
    
    // Notebooks e Móveis
    { subcategoryName: 'Notebooks e Móveis', name: 'Substituição de Componente', description: 'Trocar peças de notebook', estimatedTimeMinutes: 75, color: '#6366f1', icon: 'tool', active: true, sortOrder: 1, actionType: 'repair' },
    { subcategoryName: 'Notebooks e Móveis', name: 'Manutenção Preventiva', description: 'Limpeza e manutenção de portáteis', estimatedTimeMinutes: 45, color: '#6366f1', icon: 'shield', active: true, sortOrder: 2, actionType: 'maintenance' },
    { subcategoryName: 'Notebooks e Móveis', name: 'Configuração de Hardware', description: 'Configurar dispositivos móveis', estimatedTimeMinutes: 30, color: '#6366f1', icon: 'settings', active: true, sortOrder: 3, actionType: 'configuration' },
    { subcategoryName: 'Notebooks e Móveis', name: 'Instalação de Equipamento', description: 'Setup de notebooks e tablets', estimatedTimeMinutes: 90, color: '#6366f1', icon: 'plus-circle', active: true, sortOrder: 4, actionType: 'installation' },
    { subcategoryName: 'Notebooks e Móveis', name: 'Diagnóstico Técnico', description: 'Diagnóstico de problemas móveis', estimatedTimeMinutes: 45, color: '#6366f1', icon: 'search', active: true, sortOrder: 5, actionType: 'diagnostic' },
    
    // Sistema Operacional
    { subcategoryName: 'Sistema Operacional', name: 'Instalação de Software', description: 'Instalar sistemas operacionais', estimatedTimeMinutes: 180, color: '#10b981', icon: 'download', active: true, sortOrder: 1, actionType: 'installation' },
    { subcategoryName: 'Sistema Operacional', name: 'Atualização de Sistema', description: 'Aplicar updates do SO', estimatedTimeMinutes: 60, color: '#10b981', icon: 'refresh-cw', active: true, sortOrder: 2, actionType: 'update' },
    { subcategoryName: 'Sistema Operacional', name: 'Correção de Bug', description: 'Corrigir problemas do sistema', estimatedTimeMinutes: 90, color: '#10b981', icon: 'bug', active: true, sortOrder: 3, actionType: 'bugfix' },
    { subcategoryName: 'Sistema Operacional', name: 'Configuração de Aplicação', description: 'Configurar parâmetros do SO', estimatedTimeMinutes: 45, color: '#10b981', icon: 'settings', active: true, sortOrder: 4, actionType: 'configuration' },
    { subcategoryName: 'Sistema Operacional', name: 'Licenciamento', description: 'Gerenciar licenças do SO', estimatedTimeMinutes: 30, color: '#10b981', icon: 'key', active: true, sortOrder: 5, actionType: 'licensing' },
    
    // Rede Local (LAN)
    { subcategoryName: 'Rede Local (LAN)', name: 'Diagnóstico de Rede', description: 'Analisar problemas de LAN', estimatedTimeMinutes: 45, color: '#8b5cf6', icon: 'activity', active: true, sortOrder: 1, actionType: 'diagnostic' },
    { subcategoryName: 'Rede Local (LAN)', name: 'Configuração de Acesso', description: 'Configurar switches e equipamentos LAN', estimatedTimeMinutes: 60, color: '#8b5cf6', icon: 'settings', active: true, sortOrder: 2, actionType: 'configuration' },
    { subcategoryName: 'Rede Local (LAN)', name: 'Reset de Conexão', description: 'Reinicializar equipamentos de rede', estimatedTimeMinutes: 15, color: '#8b5cf6', icon: 'rotate-ccw', active: true, sortOrder: 3, actionType: 'reset' },
    { subcategoryName: 'Rede Local (LAN)', name: 'Otimização de Performance', description: 'Melhorar performance da rede', estimatedTimeMinutes: 90, color: '#8b5cf6', icon: 'trending-up', active: true, sortOrder: 4, actionType: 'optimization' },
    { subcategoryName: 'Rede Local (LAN)', name: 'Instalação de Ponto de Rede', description: 'Instalar novos pontos de rede', estimatedTimeMinutes: 120, color: '#8b5cf6', icon: 'plus-circle', active: true, sortOrder: 5, actionType: 'installation' },
    
    // Controle de Acesso
    { subcategoryName: 'Controle de Acesso', name: 'Liberação de Acesso', description: 'Conceder permissões de acesso', estimatedTimeMinutes: 20, color: '#dc2626', icon: 'unlock', active: true, sortOrder: 1, actionType: 'access_grant' },
    { subcategoryName: 'Controle de Acesso', name: 'Bloqueio de Ameaça', description: 'Bloquear acessos suspeitos', estimatedTimeMinutes: 30, color: '#dc2626', icon: 'shield-x', active: true, sortOrder: 2, actionType: 'security' },
    { subcategoryName: 'Controle de Acesso', name: 'Restauração de Backup', description: 'Restaurar dados de backup', estimatedTimeMinutes: 90, color: '#dc2626', icon: 'rotate-ccw', active: true, sortOrder: 3, actionType: 'restore' },
    { subcategoryName: 'Controle de Acesso', name: 'Aplicação de Política', description: 'Aplicar políticas de segurança', estimatedTimeMinutes: 45, color: '#dc2626', icon: 'file-check', active: true, sortOrder: 4, actionType: 'policy' },
    { subcategoryName: 'Controle de Acesso', name: 'Auditoria de Segurança', description: 'Auditar logs de acesso', estimatedTimeMinutes: 60, color: '#dc2626', icon: 'search', active: true, sortOrder: 5, actionType: 'audit' },
    
    // Contas e Perfis
    { subcategoryName: 'Contas e Perfis', name: 'Criação de Usuário', description: 'Criar nova conta de usuário', estimatedTimeMinutes: 30, color: '#f59e0b', icon: 'user-plus', active: true, sortOrder: 1, actionType: 'user_management' },
    { subcategoryName: 'Contas e Perfis', name: 'Treinamento Técnico', description: 'Treinar usuário em tecnologias', estimatedTimeMinutes: 120, color: '#f59e0b', icon: 'graduation-cap', active: true, sortOrder: 2, actionType: 'training' },
    { subcategoryName: 'Contas e Perfis', name: 'Orientação Técnica', description: 'Orientar sobre uso de sistemas', estimatedTimeMinutes: 45, color: '#f59e0b', icon: 'lightbulb', active: true, sortOrder: 3, actionType: 'guidance' },
    { subcategoryName: 'Contas e Perfis', name: 'Atualização de Procedimento', description: 'Atualizar procedimentos de usuário', estimatedTimeMinutes: 60, color: '#f59e0b', icon: 'edit', active: true, sortOrder: 4, actionType: 'update' },
    { subcategoryName: 'Contas e Perfis', name: 'Consultoria Especializada', description: 'Consultoria técnica especializada', estimatedTimeMinutes: 90, color: '#f59e0b', icon: 'briefcase', active: true, sortOrder: 5, actionType: 'consultation' }
  ]
};