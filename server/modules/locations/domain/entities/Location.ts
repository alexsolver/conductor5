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
  modifiedAt: Date;
}

export class Location implements Location {
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
    public modifiedAt: Date = new Date()
  ) {}

  changeName(name: string): void {
    this.name = name;
    this.modifiedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.modifiedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.modifiedAt = new Date();
  }
}