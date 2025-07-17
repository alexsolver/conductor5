import { DomainEvent } from '../../../shared/domain/DomainEvent';

export interface LocationCreated extends DomainEvent {
  type: 'LocationCreated';
  data: {
    locationId: string;
    name: string;
    type: string;
    address: string;
    tenantId: string;
  };
}

export interface LocationUpdated extends DomainEvent {
  type: 'LocationUpdated';
  data: {
    locationId: string;
    changes: Record<string, any>;
    tenantId: string;
  };
}

export interface LocationDeleted extends DomainEvent {
  type: 'LocationDeleted';
  data: {
    locationId: string;
    tenantId: string;
  };
}

export interface LocationCoordinatesUpdated extends DomainEvent {
  type: 'LocationCoordinatesUpdated';
  data: {
    locationId: string;
    latitude: number;
    longitude: number;
    tenantId: string;
  };
}

export interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    breaks?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  role: string;
  isPrimary?: boolean;
}

export class Location {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: 'cliente' | 'ativo' | 'filial' | 'tecnico' | 'parceiro',
    public readonly address: string,
    public readonly city: string,
    public readonly state: string,
    public readonly zipCode: string,
    public readonly status: 'ativo' | 'inativo' | 'manutencao' | 'suspenso' = 'ativo',
    public readonly latitude?: number,
    public readonly longitude?: number,
    public readonly businessHours?: BusinessHours,
    public readonly specialHours?: Record<string, any>,
    public readonly timezone: string = 'America/Sao_Paulo',
    public readonly slaId?: string,
    public readonly accessInstructions?: string,
    public readonly requiresAuthorization: boolean = false,
    public readonly securityEquipment: string[] = [],
    public readonly emergencyContacts: EmergencyContact[] = [],
    public readonly metadata: Record<string, any> = {},
    public readonly tags: string[] = [],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  // Business logic methods
  static create(
    name: string,
    type: Location['type'],
    address: string,
    city: string,
    state: string,
    zipCode: string,
    additionalData?: Partial<Location>
  ): Location {
    // Validate required fields
    if (!name || name.trim().length === 0) {
      throw new Error('Nome do local é obrigatório');
    }

    if (!address || address.trim().length === 0) {
      throw new Error('Endereço é obrigatório');
    }

    if (!city || city.trim().length === 0) {
      throw new Error('Cidade é obrigatória');
    }

    if (!state || state.trim().length === 0) {
      throw new Error('Estado é obrigatório');
    }

    if (!zipCode || zipCode.trim().length === 0) {
      throw new Error('CEP é obrigatório');
    }

    // Validate ZIP code format (Brazilian format)
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    if (!zipCodeRegex.test(zipCode.replace(/\D/g, ''))) {
      throw new Error('CEP deve ter formato válido (00000-000)');
    }

    const now = new Date();
    return new Location(
      crypto.randomUUID(),
      name.trim(),
      type,
      address.trim(),
      city.trim(),
      state.trim(),
      zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
      additionalData?.status || 'ativo',
      additionalData?.latitude,
      additionalData?.longitude,
      additionalData?.businessHours,
      additionalData?.specialHours,
      additionalData?.timezone || 'America/Sao_Paulo',
      additionalData?.slaId,
      additionalData?.accessInstructions,
      additionalData?.requiresAuthorization || false,
      additionalData?.securityEquipment || [],
      additionalData?.emergencyContacts || [],
      additionalData?.metadata || {},
      additionalData?.tags || [],
      now,
      now
    );
  }

  // Update coordinates from geocoding
  updateCoordinates(latitude: number, longitude: number): Location {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90 graus');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180 graus');
    }

    return new Location(
      this.id,
      this.name,
      this.type,
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.status,
      latitude,
      longitude,
      this.businessHours,
      this.specialHours,
      this.timezone,
      this.slaId,
      this.accessInstructions,
      this.requiresAuthorization,
      this.securityEquipment,
      this.emergencyContacts,
      this.metadata,
      this.tags,
      this.createdAt,
      new Date()
    );
  }

  // Update business hours
  updateBusinessHours(businessHours: BusinessHours): Location {
    // Validate business hours format
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const [day, hours] of Object.entries(businessHours)) {
      if (!validDays.includes(day.toLowerCase())) {
        throw new Error(`Dia inválido: ${day}. Use: ${validDays.join(', ')}`);
      }

      if (hours.isOpen && (!hours.openTime || !hours.closeTime)) {
        throw new Error(`Horários de abertura e fechamento são obrigatórios para ${day}`);
      }

      if (hours.openTime && hours.closeTime && hours.openTime >= hours.closeTime) {
        throw new Error(`Horário de abertura deve ser anterior ao fechamento para ${day}`);
      }
    }

    return new Location(
      this.id,
      this.name,
      this.type,
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.status,
      this.latitude,
      this.longitude,
      businessHours,
      this.specialHours,
      this.timezone,
      this.slaId,
      this.accessInstructions,
      this.requiresAuthorization,
      this.securityEquipment,
      this.emergencyContacts,
      this.metadata,
      this.tags,
      this.createdAt,
      new Date()
    );
  }

  // Check if location is open at a specific time
  isOpenAt(dateTime: Date): boolean {
    if (this.status !== 'ativo') {
      return false;
    }

    if (!this.businessHours) {
      return true; // No restrictions = always open
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateTime.getDay()];
    const dayHours = this.businessHours[dayName];

    if (!dayHours || !dayHours.isOpen) {
      return false;
    }

    const currentTime = dateTime.toTimeString().slice(0, 5); // HH:MM format
    
    if (currentTime < dayHours.openTime! || currentTime > dayHours.closeTime!) {
      return false;
    }

    // Check for breaks
    if (dayHours.breaks) {
      for (const breakTime of dayHours.breaks) {
        if (currentTime >= breakTime.startTime && currentTime <= breakTime.endTime) {
          return false;
        }
      }
    }

    return true;
  }

  // Calculate distance to another location (Haversine formula)
  calculateDistanceTo(other: Location): number | null {
    if (!this.latitude || !this.longitude || !other.latitude || !other.longitude) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other.latitude - this.latitude);
    const dLon = this.toRadians(other.longitude - this.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(other.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Update status
  updateStatus(status: Location['status']): Location {
    return new Location(
      this.id,
      this.name,
      this.type,
      this.address,
      this.city,
      this.state,
      this.zipCode,
      status,
      this.latitude,
      this.longitude,
      this.businessHours,
      this.specialHours,
      this.timezone,
      this.slaId,
      this.accessInstructions,
      this.requiresAuthorization,
      this.securityEquipment,
      this.emergencyContacts,
      this.metadata,
      this.tags,
      this.createdAt,
      new Date()
    );
  }

  // Add emergency contact
  addEmergencyContact(contact: EmergencyContact): Location {
    if (!contact.name || !contact.phone) {
      throw new Error('Nome e telefone são obrigatórios para contato de emergência');
    }

    const updatedContacts = [...this.emergencyContacts, contact];

    return new Location(
      this.id,
      this.name,
      this.type,
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.status,
      this.latitude,
      this.longitude,
      this.businessHours,
      this.specialHours,
      this.timezone,
      this.slaId,
      this.accessInstructions,
      this.requiresAuthorization,
      this.securityEquipment,
      updatedContacts,
      this.metadata,
      this.tags,
      this.createdAt,
      new Date()
    );
  }
}