
/**
 * Drizzle Message Template Repository
 * Clean Architecture - Infrastructure Layer
 */
import { IMessageTemplateRepository } from '../../domain/repositories/IMessageTemplateRepository';
import { MessageTemplate } from '../../domain/entities/MessageTemplate';

export class DrizzleMessageTemplateRepository implements IMessageTemplateRepository {
  async findAll(tenantId: string): Promise<MessageTemplate[]> {
    // Por enquanto retorna templates de exemplo
    return [
      new MessageTemplate(
        '1',
        tenantId,
        'Resposta Automática - Recebimento',
        'Recebemos seu contato e retornaremos em breve.',
        'email',
        {
          subject: 'Confirmação de Recebimento - {{ticketNumber}}',
          body: 'Olá {{customerName}},\n\nRecebemos seu contato e nossa equipe retornará em breve.\n\nNúmero do chamado: {{ticketNumber}}\n\nAtenciosamente,\nEquipe de Suporte'
        },
        ['customerName', 'ticketNumber'],
        'pt-BR',
        true,
        new Date(),
        new Date()
      )
    ];
  }

  async findById(tenantId: string, id: string): Promise<MessageTemplate | null> {
    const templates = await this.findAll(tenantId);
    return templates.find(template => template.id === id) || null;
  }

  async findByChannel(tenantId: string, channelType: string): Promise<MessageTemplate[]> {
    const templates = await this.findAll(tenantId);
    return templates.filter(template => template.channelType === channelType);
  }

  async save(template: MessageTemplate): Promise<MessageTemplate> {
    return template;
  }

  async update(tenantId: string, id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
    const template = await this.findById(tenantId, id);
    if (!template) return null;
    
    Object.assign(template, updates);
    return template;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    // Implementation would remove from database
  }
}
