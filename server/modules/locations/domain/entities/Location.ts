
export interface Location {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  type: 'local' | 'area' | 'regiao' | 'agrupamento' | 'rota' | 'trecho';
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LocationEntity implements Location {
  constructor(
    public id: string,
    public tenantId: string,
    public name: string,
    public type: 'local' | 'area' | 'regiao' | 'agrupamento' | 'rota' | 'trecho',
    public isActive: boolean = true,
    public description?: string,
    public address?: string,
    public coordinates?: { latitude: number; longitude: number },
    public parentId?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }
}
