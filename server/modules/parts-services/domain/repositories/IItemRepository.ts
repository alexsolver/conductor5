import { Item, CreateItemEntity, UpdateItemEntity } from '../entities/Item';

export interface IItemRepository {
  // CRUD básico
  create(tenantId: string, data: CreateItemEntity): Promise<Item>;
  findById(tenantId: string, id: string): Promise<Item | null>;
  findAll(tenantId: string, filters?: ItemFilters): Promise<Item[]>;
  update(tenantId: string, id: string, data: UpdateItemEntity): Promise<Item>;
  delete(tenantId: string, id: string): Promise<void>;

  // Consultas específicas
  findByType(tenantId: string, type: 'Material' | 'Serviço'): Promise<Item[]>;
  findByGroup(tenantId: string, group: string): Promise<Item[]>;
  findByIntegrationCode(tenantId: string, integrationCode: string): Promise<Item | null>;
  search(tenantId: string, query: string): Promise<Item[]>;
  findActiveItems(tenantId: string): Promise<Item[]>;

  // Estatísticas
  countByType(tenantId: string): Promise<{ materials: number; services: number }>;
  getTotalCount(tenantId: string): Promise<number>;
}

export interface ItemFilters {
  active?: boolean;
  type?: 'Material' | 'Serviço';
  group?: string;
  search?: string;
  limit?: number;
  offset?: number;
}