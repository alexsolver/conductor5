// ========================================
// SEED AI ACTIONS
// ========================================
// Populates the ai_actions table with all available actions

import { unifiedStorage } from '../storage-master';

const AI_ACTIONS = [
  // ========================================
  // CUSTOMER ACTIONS
  // ========================================
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e', // Default tenant
    actionType: 'create_customer',
    name: 'Criar Cliente',
    description: 'Cria um novo cliente no sistema',
    category: 'customers',
    requiredParams: {
      name: 'Nome completo do cliente',
      email: 'Email do cliente',
      phone: 'Telefone para contato'
    },
    optionalParams: {
      document: 'CPF ou CNPJ',
      address: 'Endereço completo',
      notes: 'Observações adicionais'
    },
    prerequisites: {
      validEmail: true
    },
    riskLevel: 'medium'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'update_customer',
    name: 'Atualizar Cliente',
    description: 'Atualiza informações de um cliente existente',
    category: 'customers',
    requiredParams: {
      customerId: 'ID do cliente a ser atualizado'
    },
    optionalParams: {
      name: 'Novo nome',
      email: 'Novo email',
      phone: 'Novo telefone',
      address: 'Novo endereço'
    },
    prerequisites: {
      customerExists: true
    },
    riskLevel: 'medium'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'search_customer',
    name: 'Buscar Cliente',
    description: 'Busca clientes por nome, email ou telefone',
    category: 'customers',
    requiredParams: {
      query: 'Termo de busca'
    },
    riskLevel: 'low'
  },

  // ========================================
  // TICKET ACTIONS
  // ========================================
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'create_ticket',
    name: 'Criar Ticket',
    description: 'Cria um novo ticket de atendimento',
    category: 'tickets',
    requiredParams: {
      customerId: 'ID do cliente',
      title: 'Título do ticket',
      description: 'Descrição detalhada'
    },
    optionalParams: {
      priority: 'Prioridade (low, medium, high)',
      categoryId: 'ID da categoria',
      subcategoryId: 'ID da subcategoria',
      assignedTo: 'ID do responsável',
      dueDate: 'Data de vencimento'
    },
    prerequisites: {
      customerExists: true
    },
    riskLevel: 'medium'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'update_ticket',
    name: 'Atualizar Ticket',
    description: 'Atualiza informações de um ticket',
    category: 'tickets',
    requiredParams: {
      ticketId: 'ID do ticket'
    },
    optionalParams: {
      title: 'Novo título',
      description: 'Nova descrição',
      priority: 'Nova prioridade',
      status: 'Novo status',
      assignedTo: 'Novo responsável'
    },
    prerequisites: {
      ticketExists: true
    },
    riskLevel: 'medium'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'add_ticket_comment',
    name: 'Adicionar Comentário',
    description: 'Adiciona um comentário ao ticket',
    category: 'tickets',
    requiredParams: {
      ticketId: 'ID do ticket',
      comment: 'Texto do comentário'
    },
    optionalParams: {
      isInternal: 'Se é um comentário interno',
      senderId: 'ID do autor'
    },
    prerequisites: {
      ticketExists: true
    },
    riskLevel: 'low'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'assign_ticket',
    name: 'Atribuir Ticket',
    description: 'Atribui um ticket a um usuário',
    category: 'tickets',
    requiredParams: {
      ticketId: 'ID do ticket',
      userId: 'ID do usuário responsável'
    },
    prerequisites: {
      ticketExists: true
    },
    riskLevel: 'medium'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'change_ticket_status',
    name: 'Alterar Status do Ticket',
    description: 'Altera o status de um ticket',
    category: 'tickets',
    requiredParams: {
      ticketId: 'ID do ticket',
      status: 'Novo status (open, in_progress, resolved, closed)'
    },
    prerequisites: {
      ticketExists: true
    },
    riskLevel: 'medium'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'search_tickets',
    name: 'Buscar Tickets',
    description: 'Busca tickets por diversos critérios',
    category: 'tickets',
    optionalParams: {
      customerId: 'ID do cliente',
      status: 'Status do ticket',
      priority: 'Prioridade',
      query: 'Busca por texto'
    },
    riskLevel: 'low'
  },

  // ========================================
  // KNOWLEDGE BASE ACTIONS
  // ========================================
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'search_knowledge_base',
    name: 'Consultar Base de Conhecimento',
    description: 'Busca artigos na base de conhecimento',
    category: 'knowledge_base',
    requiredParams: {
      query: 'Termo de busca'
    },
    riskLevel: 'low'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'get_article',
    name: 'Obter Artigo',
    description: 'Obtém um artigo específico da base de conhecimento',
    category: 'knowledge_base',
    requiredParams: {
      articleId: 'ID do artigo'
    },
    riskLevel: 'low'
  },

  // ========================================
  // NOTIFICATION ACTIONS
  // ========================================
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'send_notification',
    name: 'Enviar Notificação',
    description: 'Envia uma notificação para um usuário',
    category: 'notifications',
    requiredParams: {
      userId: 'ID do usuário',
      message: 'Mensagem da notificação'
    },
    optionalParams: {
      title: 'Título da notificação',
      priority: 'Prioridade da notificação'
    },
    riskLevel: 'low'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'notify_group',
    name: 'Notificar Grupo',
    description: 'Envia uma notificação para um grupo de usuários',
    category: 'notifications',
    requiredParams: {
      groupId: 'ID do grupo',
      message: 'Mensagem da notificação'
    },
    optionalParams: {
      title: 'Título da notificação',
      priority: 'Prioridade da notificação'
    },
    riskLevel: 'medium'
  },

  // ========================================
  // EMAIL ACTIONS
  // ========================================
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'send_email',
    name: 'Enviar Email',
    description: 'Envia um email para um destinatário',
    category: 'email',
    requiredParams: {
      to: 'Email do destinatário',
      subject: 'Assunto do email',
      body: 'Corpo do email'
    },
    optionalParams: {
      cc: 'Emails em cópia',
      bcc: 'Emails em cópia oculta',
      attachments: 'Anexos'
    },
    prerequisites: {
      validEmail: true
    },
    riskLevel: 'medium'
  },

  // ========================================
  // INFORMATION ACTIONS
  // ========================================
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'get_business_hours',
    name: 'Consultar Horário de Funcionamento',
    description: 'Obtém o horário de funcionamento da empresa',
    category: 'information',
    riskLevel: 'low'
  },
  {
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
    actionType: 'get_location_info',
    name: 'Consultar Informações de Local',
    description: 'Obtém informações sobre um local específico',
    category: 'information',
    requiredParams: {
      locationId: 'ID do local'
    },
    riskLevel: 'low'
  }
];

export async function seedAiActions() {
  console.log('🌱 Seeding AI Actions...');

  try {
    const { db } = await import('../db');
    const { aiActions } = await import('@shared/schema');
    
    const existing = await unifiedStorage.getAiActions();
    
    for (const action of AI_ACTIONS) {
      const found = existing.find(a => a.actionType === action.actionType);
      
      if (found) {
        console.log(`⏭️  Skipping ${action.name} (already exists)`);
        continue;
      }

      // Insert directly using drizzle
      await db.insert(aiActions).values({
        tenantId: action.tenantId,
        actionType: action.actionType,
        name: action.name,
        description: action.description,
        category: action.category,
        requiredParams: action.requiredParams,
        optionalParams: action.optionalParams,
        prerequisites: action.prerequisites,
        riskLevel: action.riskLevel
      });
      
      console.log(`✅ Created action: ${action.name}`);
    }

    console.log('✅ AI Actions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding AI Actions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAiActions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
