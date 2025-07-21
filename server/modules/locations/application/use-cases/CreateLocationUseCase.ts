import { Location } from '../../domain/entities/Location''[,;]
import { ILocationRepository } from '../../domain/repositories/ILocationRepository''[,;]
import { DomainEventPublisher } from '../../../shared/infrastructure/DomainEventPublisher''[,;]

export interface CreateLocationRequest {
  name: string;
  type: 'cliente' | 'ativo' | 'filial' | 'tecnico' | 'parceiro''[,;]
  address: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
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

export interface CreateLocationResponse {
  location: Location;
  success: boolean;
  message: string;
}

export class CreateLocationUseCase {
  constructor(
    private locationRepository: ILocationRepository,
    private eventPublisher: DomainEventPublisher
  ) {}

  async execute(request: CreateLocationRequest, tenantId: string): Promise<CreateLocationResponse> {
    try {
      // Validate input
      this.validateRequest(request);

      // Create location entity with business rules
      const location = Location.create(
        request.name,
        request.type,
        request.address,
        request.city,
        request.state,
        request.zipCode,
        {
          latitude: request.latitude,
          longitude: request.longitude,
          businessHours: request.businessHours,
          specialHours: request.specialHours,
          timezone: request.timezone,
          slaId: request.slaId,
          accessInstructions: request.accessInstructions,
          requiresAuthorization: request.requiresAuthorization,
          securityEquipment: request.securityEquipment,
          emergencyContacts: request.emergencyContacts,
          metadata: request.metadata,
          tags: request.tags
        }
      );

      // Save to repository
      const savedLocation = await this.locationRepository.create(location, tenantId);

      // Publish domain event
      await this.eventPublisher.publish({
        type: 'LocationCreated''[,;]
        aggregateId: savedLocation.id,
        tenantId,
        data: {
          locationId: savedLocation.id,
          name: savedLocation.name,
          type: savedLocation.type,
          address: savedLocation.address,
          tenantId
        },
        timestamp: new Date(),
        version: 1
      });

      return {
        location: savedLocation,
        success: true,
        message: 'Local criado com sucesso'
      };

    } catch (error) {
      return {
        location: null as any,
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar local'
      };
    }
  }

  private validateRequest(request: CreateLocationRequest): void {
    if (!request.name?.trim()) {
      throw new Error('Nome do local é obrigatório');
    }

    if (!request.type) {
      throw new Error('Tipo do local é obrigatório');
    }

    if (!['cliente', 'ativo', 'filial', 'tecnico', 'parceiro'].includes(request.type)) {
      throw new Error('Tipo de local inválido');
    }

    if (!request.address?.trim()) {
      throw new Error('Endereço é obrigatório');
    }

    if (!request.city?.trim()) {
      throw new Error('Cidade é obrigatória');
    }

    if (!request.state?.trim()) {
      throw new Error('Estado é obrigatório');
    }

    if (!request.zipCode?.trim()) {
      throw new Error('CEP é obrigatório');
    }

    // Validate ZIP code format
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    const cleanZipCode = request.zipCode.replace(/\D/g, ');
    if (!zipCodeRegex.test(cleanZipCode)) {
      throw new Error('CEP deve ter formato válido (00000-000)');
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