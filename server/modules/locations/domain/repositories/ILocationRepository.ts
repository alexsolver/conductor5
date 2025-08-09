
export interface ILocationRepository {
  findById(id: string): Promise<Location | null>;
  findAll(): Promise<Location[]>;
  create(location: Location): Promise<Location>;
  update(id: string, location: Partial<Location>): Promise<Location | null>;
  delete(id: string): Promise<boolean>;
  findByCompanyId(companyId: string): Promise<Location[]>;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}
