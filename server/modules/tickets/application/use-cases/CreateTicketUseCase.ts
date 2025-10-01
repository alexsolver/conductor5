/**
 * APPLICATION LAYER - CREATE TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../../domain/entities/Ticket';
import { TicketDomainService } from '../../domain/entities/Ticket';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { CreateTicketDTO } from '../dto/CreateTicketDTO';
import { ticketNumberGenerator } from '../../../utils/ticketNumberGenerator';

export class CreateTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private ticketDomainService: TicketDomainService
  ) {}

  async execute(dto: CreateTicketDTO, tenantId: string): Promise<Ticket> {
    // Validação de entrada
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!dto.createdById) {
      throw new Error('Created by user ID is required');
    }

    // Generate ticket number using configurable generator
    const ticketNumber = await ticketNumberGenerator.generateTicketNumber(tenantId, dto.companyId || '00000000-0000-0000-0000-000000000001');
    
    // Preparar dados do ticket
    const ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId,
      number: ticketNumber,
      subject: dto.subject?.trim() || '',
      description: dto.description?.trim() || '',
      status: dto.status || 'new',
      priority: dto.priority,
      urgency: dto.urgency || dto.priority, // Default urgency to priority
      impact: dto.impact || dto.priority,   // Default impact to priority
      
      // Relacionamentos
      customerId: dto.customerId,
      beneficiaryId: dto.beneficiaryId,
      assignedToId: dto.assignedToId,
      companyId: dto.companyId,
      
      // Classificação hierárquica
      category: dto.category,
      subcategory: dto.subcategory,
      action: dto.action,
      
      // Metadata
      tags: dto.tags || [],
      customFields: dto.customFields || {},
      
      // Audit
      createdById: dto.createdById,
      updatedById: dto.createdById, // Initially same as created
      isActive: true
    };

    // Validação de regras de negócio
    this.ticketDomainService.validate(ticketData);

    // Verificar se o número do ticket é único (fallback de segurança)
    let attempts = 0;
    while (attempts < 5) {
      const existingTicket = await this.ticketRepository.findByNumber(
        ticketData.number, 
        tenantId
      );
      
      if (!existingTicket) {
        break;
      }
      
      // Regenerar número usando o gerador configurável
      ticketData.number = await ticketNumberGenerator.generateTicketNumber(tenantId, dto.companyId || '00000000-0000-0000-0000-000000000001');
      attempts++;
    }

    if (attempts >= 5) {
      throw new Error('Unable to generate unique ticket number');
    }

    // Aplicar regras de negócio específicas
    if (ticketData.status === 'new' && ticketData.assignedToId) {
      // Se tem assignee, automaticamente muda para 'open'
      ticketData.status = 'open';
    }

    // Persistir o ticket
    const createdTicket = await this.ticketRepository.create(ticketData, tenantId);

    return createdTicket;
  }
}