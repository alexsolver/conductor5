
import { ConversationFlow, ConversationStep } from '../../domain/entities/ConversationalAI';

export class ConversationalAIFlowBuilder {
  
  /**
   * Cria um fluxo para consulta de status de pedido
   */
  public static createOrderStatusFlow(tenantId: string): ConversationFlow {
    return {
      id: 'order-status-flow',
      name: 'Consulta Status do Pedido',
      description: 'Fluxo para consultar status de pedidos',
      tenantId,
      triggerKeywords: ['status pedido', 'meu pedido', 'onde está', 'rastrear', 'consultar pedido'],
      steps: [
        {
          id: 'step-1',
          type: 'text_input',
          prompt: 'Olá! Vou ajudar você a consultar o status do seu pedido. Por favor, digite o número do pedido:',
          inputType: 'text',
          validation: { required: true, minLength: 3 },
          nextStepId: 'step-2'
        },
        {
          id: 'step-2',
          type: 'action_execution',
          prompt: 'Consultando seu pedido...',
          actionConfig: {
            type: 'search_order',
            parameters: {}
          }
        }
      ],
      dataSchema: {
        orderNumber: 'string'
      },
      finalActions: [
        {
          type: 'search_order',
          parameters: {
            orderNumber: '{{step-1}}'
          }
        },
        {
          type: 'send_auto_reply',
          parameters: {
            message: 'Consultei seu pedido {{step-1}}. As informações foram enviadas para você!'
          }
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Cria um fluxo para solicitação de suporte técnico
   */
  public static createTechnicalSupportFlow(tenantId: string): ConversationFlow {
    return {
      id: 'tech-support-flow',
      name: 'Suporte Técnico',
      description: 'Fluxo para suporte técnico especializado',
      tenantId,
      triggerKeywords: ['suporte técnico', 'problema técnico', 'erro sistema', 'bug', 'não funciona'],
      steps: [
        {
          id: 'step-1',
          type: 'menu',
          prompt: 'Entendo que você está com um problema técnico. Qual é o tipo de problema?',
          options: [
            { id: 'login', label: 'Problema de Login/Acesso', value: 'login', nextStepId: 'step-2' },
            { id: 'performance', label: 'Sistema Lento', value: 'performance', nextStepId: 'step-2' },
            { id: 'feature', label: 'Funcionalidade não funciona', value: 'feature', nextStepId: 'step-2' },
            { id: 'error', label: 'Mensagem de erro', value: 'error', nextStepId: 'step-3' }
          ]
        },
        {
          id: 'step-2',
          type: 'text_input',
          prompt: 'Descreva detalhadamente o problema que você está enfrentando:',
          inputType: 'text',
          validation: { required: true, minLength: 20 },
          nextStepId: 'step-4'
        },
        {
          id: 'step-3',
          type: 'text_input',
          prompt: 'Por favor, copie aqui a mensagem de erro completa:',
          inputType: 'text',
          validation: { required: true, minLength: 5 },
          nextStepId: 'step-4'
        },
        {
          id: 'step-4',
          type: 'menu',
          prompt: 'Qual é a urgência deste problema?',
          options: [
            { id: 'low', label: 'Baixa - Posso aguardar', value: 'low', nextStepId: 'step-5' },
            { id: 'medium', label: 'Média - Preciso em algumas horas', value: 'medium', nextStepId: 'step-5' },
            { id: 'high', label: 'Alta - Preciso hoje', value: 'high', nextStepId: 'step-5' },
            { id: 'critical', label: 'Crítica - Sistema parado', value: 'critical', nextStepId: 'step-5' }
          ]
        },
        {
          id: 'step-5',
          type: 'confirmation',
          prompt: 'Confirma a criação do chamado de suporte técnico?',
          nextStepId: 'step-6'
        },
        {
          id: 'step-6',
          type: 'action_execution',
          prompt: 'Criando chamado de suporte...',
          actionConfig: {
            type: 'create_tech_support_ticket',
            parameters: {}
          }
        }
      ],
      dataSchema: {
        problemType: 'string',
        description: 'string',
        urgency: 'string',
        confirmed: 'boolean'
      },
      finalActions: [
        {
          type: 'create_ticket',
          parameters: {
            subject: 'Suporte Técnico - {{problemType}}',
            description: 'Tipo: {{problemType}}\nDescrição: {{description}}\nUrgência: {{urgency}}',
            priority: '{{urgency}}',
            category: 'Suporte Técnico'
          }
        },
        {
          type: 'send_notification',
          parameters: {
            recipients: ['suporte@empresa.com'],
            message: 'Novo chamado de suporte técnico de urgência {{urgency}}'
          }
        },
        {
          type: 'send_auto_reply',
          parameters: {
            message: 'Seu chamado de suporte foi criado! Nossa equipe técnica entrará em contato em breve. Número do chamado: #{{ticketId}}'
          }
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Cria um fluxo para informações comerciais
   */
  public static createSalesInfoFlow(tenantId: string): ConversationFlow {
    return {
      id: 'sales-info-flow',
      name: 'Informações Comerciais',
      description: 'Fluxo para informações sobre produtos e vendas',
      tenantId,
      triggerKeywords: ['preço', 'comprar', 'produto', 'vendas', 'comercial', 'orçamento'],
      steps: [
        {
          id: 'step-1',
          type: 'menu',
          prompt: 'Olá! Posso ajudar com informações comerciais. O que você gostaria de saber?',
          options: [
            { id: 'pricing', label: 'Preços e Planos', value: 'pricing', nextStepId: 'step-2' },
            { id: 'demo', label: 'Solicitar Demonstração', value: 'demo', nextStepId: 'step-3' },
            { id: 'quote', label: 'Solicitar Orçamento', value: 'quote', nextStepId: 'step-4' },
            { id: 'contact', label: 'Falar com Vendedor', value: 'contact', nextStepId: 'step-5' }
          ]
        },
        {
          id: 'step-2',
          type: 'action_execution',
          prompt: 'Enviando informações sobre preços...',
          actionConfig: {
            type: 'send_pricing_info',
            parameters: {}
          }
        },
        {
          id: 'step-3',
          type: 'text_input',
          prompt: 'Ótimo! Para agendar uma demonstração, preciso do seu email:',
          inputType: 'email',
          validation: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          nextStepId: 'step-6'
        },
        {
          id: 'step-4',
          type: 'text_input',
          prompt: 'Para preparar um orçamento personalizado, qual é o nome da sua empresa?',
          inputType: 'text',
          validation: { required: true, minLength: 2 },
          nextStepId: 'step-7'
        },
        {
          id: 'step-5',
          type: 'action_execution',
          prompt: 'Conectando você com nossa equipe comercial...',
          actionConfig: {
            type: 'connect_to_sales',
            parameters: {}
          }
        },
        {
          id: 'step-6',
          type: 'action_execution',
          prompt: 'Agendando demonstração...',
          actionConfig: {
            type: 'schedule_demo',
            parameters: {}
          }
        },
        {
          id: 'step-7',
          type: 'text_input',
          prompt: 'E qual é o seu email para envio do orçamento?',
          inputType: 'email',
          validation: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          nextStepId: 'step-8'
        },
        {
          id: 'step-8',
          type: 'action_execution',
          prompt: 'Preparando orçamento...',
          actionConfig: {
            type: 'create_quote',
            parameters: {}
          }
        }
      ],
      dataSchema: {
        requestType: 'string',
        email: 'string',
        companyName: 'string'
      },
      finalActions: [
        {
          type: 'create_ticket',
          parameters: {
            subject: 'Solicitação Comercial - {{requestType}}',
            description: 'Tipo: {{requestType}}\nEmpresa: {{companyName}}\nEmail: {{email}}',
            priority: 'medium',
            category: 'Comercial'
          }
        },
        {
          type: 'send_notification',
          parameters: {
            recipients: ['vendas@empresa.com'],
            message: 'Nova solicitação comercial: {{requestType}}'
          }
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
