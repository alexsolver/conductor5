import { Location } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';
import { DomainEventPublisher } from '../../../shared/infrastructure/DomainEventPublisher';

export interface UpdateLocationRequest {
  name?: string;
  type?: 'cliente' | 'ativo' | 'filial' | 'tecnico' | 'parceiro';
  status?: 'ativo' | 'inativo' | 'manutencao' | 'suspenso';
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  businessHours?: Record<string, any>;
  specialHours?: Record<string, any>;
  timezone?: string;
  slaId?: string;
  accessInstructions?: string;
  requiresAuthorization?: boolean;
  securityEquipment?: string[];
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    email?: string;
    role: string;
    isPrimary?: boolean;
  }>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateLocationResponse {
  location: Location;
  success: boolean;
  message: string;
}

export class UpdateLocationUseCase {
  constructor(
    private locationRepository: ILocationRepository,
    private eventPublisher: DomainEventPublisher
  ) {}

  async execute(locationId: string, request: UpdateLocationRequest, tenantId: string): Promise<UpdateLocationResponse> {
    try {
      // Validate input
      this.validateRequest(request);

      // Check if location exists
      const existingLocation = await this.locationRepository.findById(locationId, tenantId);
      if (!existingLocation) {
        throw new Error('Local não encontrado');
      }

      // Update location
      const updatedLocation = await this.locationRepository.update(locationId, request, tenantId);
      if (!updatedLocation) {
        throw new Error('Erro ao atualizar local');
      }

      // Publish domain event
      await this.eventPublisher.publish({
        type: 'LocationUpdated',
        aggregateId: locationId,
        tenantId,
        data: {
          locationId,
          changes: request,
          tenantId
        },
        timestamp: new Date(),
        version: 1
      });

      return {
        location: updatedLocation,
        success: true,
        message: 'Local atualizado com sucesso'
      };

    } catch (error) {
      return {
        location: null as any,
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar local'
      };
    }
  }

  private validateRequest(request: UpdateLocationRequest): void {
    // Validate name if provided
    if (request.name !== undefined && !request.name?.trim()) {
      throw new Error('Nome do local não pode estar vazio');
    }

    // Validate type if provided
    if (request.type && !['cliente', 'ativo', 'filial', 'tecnico', 'parceiro'].includes(request.type)) {
      throw new Error('Tipo de local inválido');
    }

    // Validate status if provided
    if (request.status && !['ativo', 'inativo', 'manutencao', 'suspenso'].includes(request.status)) {
      throw new Error('Status de local inválido');
    }

    // Validate ZIP code if provided
    if (request.zipCode !== undefined) {
      const zipCodeRegex = /^\d{5}-?\d{3}$/;
      const cleanZipCode = request.zipCode.replace(/\D/g, '');
      if (!zipCodeRegex.test(cleanZipCode)) {
        throw new Error('CEP deve ter formato válido (00000-000)');
      }
    }

    // Validate coordinates if provided
    if (request.latitude !== undefined) {
      if (request.latitude < -90 || request.latitude > 90) {
        throw new Error('Latitude deve estar entre -90 e 90 graus');
      }
    }

    if (request.longitude !== undefined) {
      if (request.longitude < -180 || request.longitude > 180) {
        throw new Error('Longitude deve estar entre -180 e 180 graus');
      }
    }

    // Validate business hours if provided
    if (request.businessHours) {
      this.validateBusinessHours(request.businessHours);
    }

    // Validate emergency contacts if provided
    if (request.emergencyContacts) {
      for (const contact of request.emergencyContacts) {
        if (!contact.name?.trim()) {
          throw new Error('Nome é obrigatório para contatos de emergência');
        }
        if (!contact.phone?.trim()) {
          throw new Error('Telefone é obrigatório para contatos de emergência');
        }
        if (!contact.role?.trim()) {
          throw new Error('Função é obrigatória para contatos de emergência');
        }
      }
    }
  }

  private validateBusinessHours(businessHours: Record<string, any>): void {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const [day, hours] of Object.entries(businessHours)) {
      if (!validDays.includes(day.toLowerCase())) {
        throw new Error(`Dia inválido: ${day}. Use: ${validDays.join(', ')}`);
      }

      if (typeof hours !== 'object' || hours === null) {
        throw new Error(`Configuração inválida para ${day}`);
      }

      if (hours.isOpen && (!hours.openTime || !hours.closeTime)) {
        throw new Error(`Horários de abertura e fechamento são obrigatórios para ${day}`);
      }

      if (hours.openTime && hours.closeTime && hours.openTime >= hours.closeTime) {
        throw new Error(`Horário de abertura deve ser anterior ao fechamento para ${day}`);
      }
    }
  }
}