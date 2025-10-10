export class GetAvailableActionsUseCase {
  async execute() {
    try {
      console.log('📋 [GetAvailableActionsUseCase] Fetching available actions');

      const availableActions = [
        {
          type: 'auto_reply',
          name: 'Resposta Automática',
          description: 'Envia uma resposta automática pré-definida',
          category: 'messaging',
          parameters: {
            message: { type: 'string', required: true, description: 'Mensagem a ser enviada' }
          }
        },
        {
          type: 'forward_message',
          name: 'Encaminhar Mensagem',
          description: 'Encaminha a mensagem para outro destinatário',
          category: 'messaging',
          parameters: {
            recipient: { type: 'string', required: true, description: 'Destinatário' }
          }
        },
        {
          type: 'create_ticket',
          name: 'Criar Ticket',
          description: 'Cria um ticket automaticamente',
          category: 'ticketing',
          parameters: {
            title: { type: 'string', required: true, description: 'Título do ticket' },
            description: { type: 'string', required: false, description: 'Descrição do ticket' },
            priority: { type: 'number', required: false, description: 'Prioridade (1-5)' }
          }
        },
        {
          type: 'send_notification',
          name: 'Enviar Notificação',
          description: 'Envia uma notificação para usuários',
          category: 'notifications',
          parameters: {
            message: { type: 'string', required: true, description: 'Mensagem da notificação' },
            channel: { type: 'string', required: false, description: 'Canal de notificação' }
          }
        },
        {
          type: 'add_tags',
          name: 'Adicionar Tags',
          description: 'Adiciona tags à conversa',
          category: 'organization',
          parameters: {
            tags: { type: 'array', required: true, description: 'Lista de tags' }
          }
        },
        {
          type: 'assign_agent',
          name: 'Atribuir Agente',
          description: 'Atribui um agente à conversa',
          category: 'assignment',
          parameters: {
            agentId: { type: 'string', required: true, description: 'ID do agente' }
          }
        },
        {
          type: 'transfer_to_human',
          name: 'Transferir para Fila de Atendimento',
          description: 'Transfere a conversa para uma fila de atendimento humano com prioridade e confirmação',
          category: 'escalation',
          parameters: {
            queueId: { 
              type: 'string', 
              required: true, 
              description: 'ID da fila de atendimento' 
            },
            priority: { 
              type: 'number', 
              required: false, 
              default: 1,
              min: 1,
              max: 5,
              description: 'Prioridade na fila (1-5)' 
            },
            confirmationMessage: { 
              type: 'string', 
              required: false, 
              default: 'Um momento, você será atendido por um de nossos agentes em breve.',
              description: 'Mensagem de confirmação enviada ao cliente' 
            }
          },
          examples: [
            {
              queueId: '123',
              priority: 3,
              confirmationMessage: 'Aguarde, você será atendido em breve.'
            }
          ]
        },
        {
          type: 'escalate_to_agent',
          name: 'Escalar para Agente Humano',
          description: 'Escalação imediata para atendimento humano com alta prioridade',
          category: 'escalation',
          parameters: {
            queueId: { 
              type: 'string', 
              required: true, 
              description: 'ID da fila de atendimento' 
            },
            priority: { 
              type: 'number', 
              required: false, 
              default: 5,
              min: 1,
              max: 5,
              description: 'Prioridade na fila (1-5)' 
            },
            confirmationMessage: { 
              type: 'string', 
              required: false, 
              default: 'Entendido. Vou transferir você para um especialista agora.',
              description: 'Mensagem de confirmação enviada ao cliente' 
            }
          },
          examples: [
            {
              queueId: '123',
              priority: 5,
              confirmationMessage: 'Transferindo para nosso especialista...'
            }
          ]
        }
      ];

      console.log(`✅ [GetAvailableActionsUseCase] Found ${availableActions.length} available actions`);

      return {
        success: true,
        data: availableActions
      };
    } catch (error) {
      console.error('❌ [GetAvailableActionsUseCase] Error fetching available actions:', error);
      throw error;
    }
  }
}
