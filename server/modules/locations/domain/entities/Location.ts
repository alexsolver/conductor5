/**
 * Location Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for location management
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface OperatingHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export class Location {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private address: string,
    private type: string,
    private coordinates: Coordinates | null = null,
    private operatingHours: OperatingHours | null = null,
    private region: string = '',
    private active: boolean = true,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getAddress(): string { return this.address; }
  getType(): string { return this.type; }
  getCoordinates(): Coordinates | null { return this.coordinates; }
  getOperatingHours(): OperatingHours | null { return this.operatingHours; }
  getRegion(): string { return this.region; }
  isActive(): boolean { return this.active; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Location name cannot be empty');
    }
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  updateAddress(address: string): void {
    if (!address.trim()) {
      throw new Error('Location address cannot be empty');
    }
    this.address = address.trim();
    this.updatedAt = new Date();
  }

  updateCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    this.coordinates = { lat, lng };
    this.updatedAt = new Date();
  }

  updateOperatingHours(hours: OperatingHours): void {
    this.operatingHours = hours;
    this.updatedAt = new Date();
  }

  updateType(type: string): void {
    const validTypes = ['office', 'warehouse', 'store', 'facility', 'branch', 'other'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid location type. Must be one of: ${validTypes.join(', ')}`);
    }
    this.type = type;
    this.updatedAt = new Date();
  }

  updateRegion(region: string): void {
    this.region = region;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  isOpenNow(): boolean {
    if (!this.operatingHours) return false;

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' }) as keyof OperatingHours;
    const dayHours = this.operatingHours[dayName];

    if (!dayHours || dayHours.closed) return false;

    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= dayHours.open && currentTime <= dayHours.close;
  }

  getDistanceFrom(otherCoordinates: Coordinates): number | null {
    if (!this.coordinates) return null;

    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(otherCoordinates.lat - this.coordinates.lat);
    const dLng = this.toRadians(otherCoordinates.lng - this.coordinates.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.coordinates.lat)) * 
      Math.cos(this.toRadians(otherCoordinates.lat)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  hasCoordinates(): boolean {
    return this.coordinates !== null;
  }

  getFormattedAddress(): string {
    return this.address;
  }

  isOpenOnDay(day: keyof OperatingHours): boolean {
    if (!this.operatingHours) return false;
    const dayHours = this.operatingHours[day];
    return dayHours ? !dayHours.closed : false;
  }
}