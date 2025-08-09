
import { Location } from '../entities/Location';

export class LocationDomainService {
  validateLocationData(name: string, address: string): boolean {
    return name.trim().length > 0 && address.trim().length > 0;
  }

  isCoordinatesValid(latitude?: number, longitude?: number): boolean {
    if (!latitude || !longitude) return true; // Coordenadas são opcionais
    
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  generateLocationCode(name: string): string {
    return name.trim().toUpperCase().replace(/\s+/g, '_').substring(0, 20);
  }
}
