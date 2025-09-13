
/**
 * Default Company Template
 * Template com nova estrutura hierárquica de 5 categorias modernas
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
  categories: Array<{
    name: string;
    description: string;
    color: string;
    icon: string;
    active: boolean;
    sortOrder: number;
  }>;
  subcategories: Array<{
    categoryName: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    active: boolean;
    sortOrder: number;
  }>;
  actions: Array<{
    subcategoryName: string;
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
 * Template com nova estrutura hierárquica de 5 categorias modernas
 * Completamente atualizado em setembro 2025
 */
export const DEFAULT_COMPANY_TEMPLATE: DefaultCompanyTemplate = {
  company: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Default',
    displayName: '',
    description: '',
    industry: 'Geral',
    size: 'medium',
    email: 'default@system.internal',
    phone: '+00 0000-0000',
    website: 'https://sistema.default',
    subscriptionTier: 'basic',
    status: 'active'
  },

  categories: [
    {
      name: 'Infraestrutura & Equipamentos',
      description: 'Hardware, equipamentos físicos e infraestrutura tecnológica',
      color: '#ef4444',
      icon: 'server',
      active: true,
      sortOrder: 1
    },
    {
      name: 'Software & Aplicações',
      description: 'Softwares, sistemas e aplicações corporativas',
      color: '#8b5cf6',
      icon: 'code',
      active: true,
      sortOrder: 2
    },
    {
      name: 'Conectividade & Redes',
      description: 'Rede, internet, comunicação e conectividade',
      color: '#06b6d4',
      icon: 'wifi',
      active: true,
      sortOrder: 3
    },
    {
      name: 'Segurança & Acesso',
      description: 'Segurança da informação, controle de acesso e permissões',
      color: '#f59e0b',
      icon: 'shield',
      active: true,
      sortOrder: 4
    },
    {
      name: 'Usuários & Suporte',
      description: 'Suporte aos usuários, treinamentos e atendimento geral',
      color: '#10b981',
      icon: 'users',
      active: true,
      sortOrder: 5
    }
  ],

  subcategories: [
    // Infraestrutura & Equipamentos (4 subcategorias)
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Desktop', description: 'Computadores desktop e workstations', color: '#ef4444', icon: 'monitor', active: true, sortOrder: 1 },
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Notebook', description: 'Laptops e notebooks corporativos', color: '#ef4444', icon: 'laptop', active: true, sortOrder: 2 },
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Servidor', description: 'Servidores físicos e virtuais', color: '#ef4444', icon: 'server', active: true, sortOrder: 3 },
    { categoryName: 'Infraestrutura & Equipamentos', name: 'Impressora', description: 'Impressoras e equipamentos de impressão', color: '#ef4444', icon: 'printer', active: true, sortOrder: 4 },

    // Software & Aplicações (4 subcategorias)
    { categoryName: 'Software & Aplicações', name: 'Sistema Operacional', description: 'Windows, Linux, macOS e sistemas operacionais', color: '#8b5cf6', icon: 'code', active: true, sortOrder: 1 },
    { categoryName: 'Software & Aplicações', name: 'Aplicações Corporativas', description: 'ERP, CRM e sistemas empresariais', color: '#8b5cf6', icon: 'briefcase', active: true, sortOrder: 2 },
    { categoryName: 'Software & Aplicações', name: 'Office & Produtividade', description: 'Pacotes office e ferramentas de produtividade', color: '#8b5cf6', icon: 'file-text', active: true, sortOrder: 3 },
    { categoryName: 'Software & Aplicações', name: 'Licenças', description: 'Gestão e renovação de licenças de software', color: '#8b5cf6', icon: 'key', active: true, sortOrder: 4 },

    // Conectividade & Redes (4 subcategorias)
    { categoryName: 'Conectividade & Redes', name: 'Internet', description: 'Conexão com internet e provedores', color: '#06b6d4', icon: 'globe', active: true, sortOrder: 1 },
    { categoryName: 'Conectividade & Redes', name: 'Rede Local', description: 'LAN, switches e infraestrutura de rede interna', color: '#06b6d4', icon: 'network', active: true, sortOrder: 2 },
    { categoryName: 'Conectividade & Redes', name: 'Wi-Fi', description: 'Redes sem fio e access points', color: '#06b6d4', icon: 'wifi', active: true, sortOrder: 3 },
    { categoryName: 'Conectividade & Redes', name: 'VPN', description: 'Conexões VPN e acesso remoto', color: '#06b6d4', icon: 'lock', active: true, sortOrder: 4 },

    // Segurança & Acesso (4 subcategorias)
    { categoryName: 'Segurança & Acesso', name: 'Antivírus', description: 'Proteção antivírus e anti-malware', color: '#f59e0b', icon: 'shield', active: true, sortOrder: 1 },
    { categoryName: 'Segurança & Acesso', name: 'Firewall', description: 'Configuração e manutenção de firewalls', color: '#f59e0b', icon: 'shield-check', active: true, sortOrder: 2 },
    { categoryName: 'Segurança & Acesso', name: 'Controle de Acesso', description: 'Permissões, usuários e grupos de acesso', color: '#f59e0b', icon: 'user-check', active: true, sortOrder: 3 },
    { categoryName: 'Segurança & Acesso', name: 'Backup', description: 'Backup e recuperação de dados', color: '#f59e0b', icon: 'hard-drive', active: true, sortOrder: 4 },

    // Usuários & Suporte (4 subcategorias)
    { categoryName: 'Usuários & Suporte', name: 'Treinamento', description: 'Capacitação e treinamento de usuários', color: '#10b981', icon: 'graduation-cap', active: true, sortOrder: 1 },
    { categoryName: 'Usuários & Suporte', name: 'Suporte Geral', description: 'Dúvidas e suporte geral aos usuários', color: '#10b981', icon: 'help-circle', active: true, sortOrder: 2 },
    { categoryName: 'Usuários & Suporte', name: 'Consultoria', description: 'Consultoria técnica especializada', color: '#10b981', icon: 'user', active: true, sortOrder: 3 },
    { categoryName: 'Usuários & Suporte', name: 'Manutenção Preventiva', description: 'Manutenções programadas e preventivas', color: '#10b981', icon: 'tool', active: true, sortOrder: 4 }
  ],

  actions: [
    // Desktop (5 ações)
    { subcategoryName: 'Desktop', name: 'Diagnóstico Completo', description: 'Análise completa do hardware e software do desktop', estimatedTimeMinutes: 60, color: '#ef4444', icon: 'search', active: true, sortOrder: 1, actionType: 'diagnostic' },
    { subcategoryName: 'Desktop', name: 'Troca de Componente', description: 'Substituição de peças defeituosas do desktop', estimatedTimeMinutes: 120, color: '#ef4444', icon: 'tool', active: true, sortOrder: 2, actionType: 'repair' },
    { subcategoryName: 'Desktop', name: 'Limpeza e Manutenção', description: 'Limpeza física e manutenção preventiva', estimatedTimeMinutes: 45, color: '#ef4444', icon: 'wind', active: true, sortOrder: 3, actionType: 'maintenance' },
    { subcategoryName: 'Desktop', name: 'Upgrade de Hardware', description: 'Atualização de componentes do desktop', estimatedTimeMinutes: 90, color: '#ef4444', icon: 'arrow-up', active: true, sortOrder: 4, actionType: 'upgrade' },
    { subcategoryName: 'Desktop', name: 'Configuração Inicial', description: 'Configuração inicial após instalação', estimatedTimeMinutes: 30, color: '#ef4444', icon: 'settings', active: true, sortOrder: 5, actionType: 'configuration' },

    // Notebook (5 ações)
    { subcategoryName: 'Notebook', name: 'Verificação de Bateria', description: 'Teste e diagnóstico da bateria do notebook', estimatedTimeMinutes: 30, color: '#ef4444', icon: 'battery', active: true, sortOrder: 1, actionType: 'diagnostic' },
    { subcategoryName: 'Notebook', name: 'Reparo de Tela', description: 'Substituição ou reparo da tela do notebook', estimatedTimeMinutes: 180, color: '#ef4444', icon: 'monitor', active: true, sortOrder: 2, actionType: 'repair' },
    { subcategoryName: 'Notebook', name: 'Upgrade de Memória', description: 'Atualização da memória RAM do notebook', estimatedTimeMinutes: 60, color: '#ef4444', icon: 'cpu', active: true, sortOrder: 3, actionType: 'upgrade' },
    { subcategoryName: 'Notebook', name: 'Limpeza Térmica', description: 'Limpeza do sistema de refrigeração', estimatedTimeMinutes: 90, color: '#ef4444', icon: 'wind', active: true, sortOrder: 4, actionType: 'maintenance' },
    { subcategoryName: 'Notebook', name: 'Verificação de Conectividade', description: 'Teste de portas e conectores', estimatedTimeMinutes: 25, color: '#ef4444', icon: 'wifi', active: true, sortOrder: 5, actionType: 'testing' },

    // Sistema Operacional (5 ações)
    { subcategoryName: 'Sistema Operacional', name: 'Reinstalação do SO', description: 'Reinstalação completa do sistema operacional', estimatedTimeMinutes: 240, color: '#8b5cf6', icon: 'refresh-cw', active: true, sortOrder: 1, actionType: 'installation' },
    { subcategoryName: 'Sistema Operacional', name: 'Atualização do Sistema', description: 'Aplicação de atualizações e patches de segurança', estimatedTimeMinutes: 90, color: '#8b5cf6', icon: 'download', active: true, sortOrder: 2, actionType: 'update' },
    { subcategoryName: 'Sistema Operacional', name: 'Configuração Inicial', description: 'Configuração básica após instalação do SO', estimatedTimeMinutes: 120, color: '#8b5cf6', icon: 'settings', active: true, sortOrder: 3, actionType: 'configuration' },
    { subcategoryName: 'Sistema Operacional', name: 'Otimização de Performance', description: 'Ajustes para melhorar a performance do sistema', estimatedTimeMinutes: 60, color: '#8b5cf6', icon: 'zap', active: true, sortOrder: 4, actionType: 'optimization' },
    { subcategoryName: 'Sistema Operacional', name: 'Recuperação de Sistema', description: 'Recuperação de sistema corrompido', estimatedTimeMinutes: 180, color: '#8b5cf6', icon: 'life-buoy', active: true, sortOrder: 5, actionType: 'recovery' },

    // Internet (5 ações)
    { subcategoryName: 'Internet', name: 'Teste de Velocidade', description: 'Verificação da velocidade de conexão com internet', estimatedTimeMinutes: 15, color: '#06b6d4', icon: 'activity', active: true, sortOrder: 1, actionType: 'testing' },
    { subcategoryName: 'Internet', name: 'Configuração de Proxy', description: 'Configuração de servidor proxy para acesso à internet', estimatedTimeMinutes: 30, color: '#06b6d4', icon: 'settings', active: true, sortOrder: 2, actionType: 'configuration' },
    { subcategoryName: 'Internet', name: 'Resolução DNS', description: 'Configuração e resolução de problemas de DNS', estimatedTimeMinutes: 45, color: '#06b6d4', icon: 'globe', active: true, sortOrder: 3, actionType: 'configuration' },
    { subcategoryName: 'Internet', name: 'Diagnóstico de Conectividade', description: 'Análise de problemas de conexão com internet', estimatedTimeMinutes: 40, color: '#06b6d4', icon: 'search', active: true, sortOrder: 4, actionType: 'diagnostic' },
    { subcategoryName: 'Internet', name: 'Configuração de Firewall', description: 'Ajustes de firewall para acesso à internet', estimatedTimeMinutes: 35, color: '#06b6d4', icon: 'shield', active: true, sortOrder: 5, actionType: 'configuration' },

    // Antivírus (5 ações)
    { subcategoryName: 'Antivírus', name: 'Instalação de Antivírus', description: 'Instalação e configuração de software antivírus', estimatedTimeMinutes: 45, color: '#f59e0b', icon: 'shield', active: true, sortOrder: 1, actionType: 'installation' },
    { subcategoryName: 'Antivírus', name: 'Scan Completo', description: 'Execução de varredura completa do sistema', estimatedTimeMinutes: 120, color: '#f59e0b', icon: 'search', active: true, sortOrder: 2, actionType: 'scanning' },
    { subcategoryName: 'Antivírus', name: 'Atualização de Definições', description: 'Atualização das definições de vírus', estimatedTimeMinutes: 20, color: '#f59e0b', icon: 'download', active: true, sortOrder: 3, actionType: 'update' },
    { subcategoryName: 'Antivírus', name: 'Remoção de Malware', description: 'Limpeza e remoção de malware detectado', estimatedTimeMinutes: 90, color: '#f59e0b', icon: 'trash', active: true, sortOrder: 4, actionType: 'cleanup' },
    { subcategoryName: 'Antivírus', name: 'Configuração de Políticas', description: 'Configuração de políticas de segurança', estimatedTimeMinutes: 30, color: '#f59e0b', icon: 'settings', active: true, sortOrder: 5, actionType: 'configuration' },

    // Treinamento (5 ações)
    { subcategoryName: 'Treinamento', name: 'Treinamento Básico', description: 'Treinamento básico para novos usuários', estimatedTimeMinutes: 120, color: '#10b981', icon: 'graduation-cap', active: true, sortOrder: 1, actionType: 'training' },
    { subcategoryName: 'Treinamento', name: 'Capacitação Técnica', description: 'Treinamento técnico especializado', estimatedTimeMinutes: 240, color: '#10b981', icon: 'book', active: true, sortOrder: 2, actionType: 'training' },
    { subcategoryName: 'Treinamento', name: 'Workshop Prático', description: 'Workshop prático com exercícios', estimatedTimeMinutes: 180, color: '#10b981', icon: 'users', active: true, sortOrder: 3, actionType: 'workshop' },
    { subcategoryName: 'Treinamento', name: 'Documentação e Manuais', description: 'Criação de documentação e manuais', estimatedTimeMinutes: 90, color: '#10b981', icon: 'file-text', active: true, sortOrder: 4, actionType: 'documentation' },
    { subcategoryName: 'Treinamento', name: 'Avaliação de Conhecimento', description: 'Avaliação do conhecimento adquirido', estimatedTimeMinutes: 60, color: '#10b981', icon: 'check-circle', active: true, sortOrder: 5, actionType: 'evaluation' }
  ]
};
