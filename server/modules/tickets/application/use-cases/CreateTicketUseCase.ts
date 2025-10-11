/**
 * APPLICATION LAYER - CREATE TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../../domain/entities/Ticket';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { CreateTicketDTO } from '../dto/CreateTicketDTO';
import { ticketNumberGenerator } from '../../../../utils/ticketNumberGenerator';
import { SlaService } from '../../../sla/application/services/SlaService';
import { DrizzleSlaRepository } from '../../../sla/infrastructure/repositories/DrizzleSlaRepository';

export class CreateTicketUseCase {
  private slaService: SlaService;

  constructor(
    private ticketRepository: ITicketRepository,
    private logger?: any
  ) {
    // Initialize SLA service for automatic SLA application
    const slaRepository = new DrizzleSlaRepository();
    this.slaService = new SlaService(slaRepository);
  }

  async execute(dto: CreateTicketDTO, tenantId: string): Promise<Ticket> {
    // Validação de entrada
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!dto.createdById) {
      throw new Error('Created by user ID is required');
    }

    // Gerar número do ticket conforme configuração de numeração
    const companyId = dto.companyId || null;
    console.log('🎫 [CREATE-TICKET] DTO companyId:', dto.companyId, 'Converted companyId:', companyId);
    const ticketNumber = await ticketNumberGenerator.generateTicketNumber(tenantId, companyId);

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

    // Validação básica de regras de negócio
    if (!ticketData.subject || ticketData.subject.trim() === '') {
      throw new Error('Subject is required');
    }

    // Aplicar regras de negócio específicas
    if (ticketData.status === 'new' && ticketData.assignedToId) {
      // Se tem assignee, automaticamente muda para 'open'
      ticketData.status = 'open';
    }

    // Persistir o ticket
    const createdTicket = await this.ticketRepository.create(ticketData, tenantId);

    // ✅ AUTO-START SLA: Iniciar automaticamente SLAs aplicáveis ao ticket
    try {
      console.log(`🎯 [CreateTicketUseCase] Auto-starting SLAs for ticket ${createdTicket.id}`);
      await this.slaService.startSlaForTicket(
        createdTicket.id, 
        tenantId, 
        {
          status: createdTicket.status,
          priority: createdTicket.priority,
          category: createdTicket.category,
          companyId: createdTicket.companyId,
          assignedToId: createdTicket.assignedToId
        }
      );
      console.log(`✅ [CreateTicketUseCase] SLAs started successfully for ticket ${createdTicket.id}`);
    } catch (slaError) {
      console.error(`❌ [CreateTicketUseCase] Error starting SLAs for ticket ${createdTicket.id}:`, slaError);
      // Não bloquear a criação do ticket por erro de SLA
    }

    return createdTicket;
  }
}