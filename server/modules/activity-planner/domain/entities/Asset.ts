/**
 * Asset Entity - Entidade de domínio para ativos
 * Representa equipamentos, máquinas e componentes que requerem manutenção
 * Seguindo padrões Clean Architecture e 1qa.md
 */

export interface Asset {
  id: string;
  tenantId: string;
  locationId: string;
  parentAssetId?: string;
  tag: string;
  name: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  metersJson?: Record<string, any>; // horímetros, odômetros, etc.
  mtbf?: number; // Mean Time Between Failures (hours)
  mttr?: number; // Mean Time To Repair (hours)
  failureCodesJson?: string[]; // códigos de falha comuns
  specifications?: Record<string, any>;
  installationDate?: Date;
  warrantyExpiryDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface InsertAsset {
  tenantId: string;
  locationId: string;
  parentAssetId?: string;
  tag: string;
  name: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  metersJson?: Record<string, any>;
  mtbf?: number;
  mttr?: number;
  failureCodesJson?: string[];
  specifications?: Record<string, any>;
  installationDate?: Date;
  warrantyExpiryDate?: Date;
  createdBy: string;
}

export class AssetEntity {
  constructor(private asset: Asset) {}

  getId(): string {
    return this.asset.id;
  }

  getTenantId(): string {
    return this.asset.tenantId;
  }

  getTag(): string {
    return this.asset.tag;
  }

  getName(): string {
    return this.asset.name;
  }

  getCriticality(): 'low' | 'medium' | 'high' | 'critical' {
    return this.asset.criticality;
  }

  getStatus(): 'active' | 'inactive' | 'maintenance' | 'decommissioned' {
    return this.asset.status;
  }

  isCritical(): boolean {
    return this.asset.criticality === 'critical';
  }

  isOperational(): boolean {
    return this.asset.status === 'active';
  }

  needsMaintenance(): boolean {
    if (!this.asset.nextMaintenanceDate) return false;
    return new Date() >= this.asset.nextMaintenanceDate;
  }

  updateStatus(newStatus: 'active' | 'inactive' | 'maintenance' | 'decommissioned'): void {
    this.asset.status = newStatus;
    this.asset.updatedAt = new Date();
  }

  updateMeter(meterName: string, value: number): void {
    if (!this.asset.metersJson) {
      this.asset.metersJson = {};
    }
    this.asset.metersJson[meterName] = value;
    this.asset.updatedAt = new Date();
  }

  recordMaintenanceCompletion(completionDate: Date, nextMaintenanceDate?: Date): void {
    this.asset.lastMaintenanceDate = completionDate;
    if (nextMaintenanceDate) {
      this.asset.nextMaintenanceDate = nextMaintenanceDate;
    }
    this.asset.updatedAt = new Date();
  }

  toPlainObject(): Asset {
    return { ...this.asset };
  }
}