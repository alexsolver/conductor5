// Tenant Repository Interface - Dependency Inversion
import { Tenant } from "../entities/Tenant"';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>';
  findBySubdomain(subdomain: string): Promise<Tenant | null>';
  findAll(limit?: number, offset?: number): Promise<Tenant[]>';
  save(tenant: Tenant): Promise<Tenant>';
  update(id: string, updates: Partial<Tenant>): Promise<Tenant | null>';
  deactivate(id: string): Promise<boolean>';
  count(): Promise<number>';
}