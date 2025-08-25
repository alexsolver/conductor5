// Tenant Repository Implementation - Infrastructure Layer
import { eq, desc, sql } from "drizzle-orm";
import { logError } from "../../utils/logger";
import { db } from "../../db";
import { tenants } from '@shared/schema';
import { ITenantRepository } from "../../domain/repositories/ITenantRepository";
import { Tenant } from "../../domain/entities/Tenant";

export class TenantRepository implements ITenantRepository {

  async findById(id: string): Promise<Tenant | null> {
    try {
      const [tenantData] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, id));

      if (!tenantData) return null;

      return new Tenant(
        tenantData.id,
        tenantData.name,
        tenantData.subdomain,
        tenantData.settings || {},
        tenantData.isActive ?? true,
        tenantData.createdAt || new Date(),
        tenantData.updatedAt || new Date()
      );
    } catch (error) {
      logError('Error finding tenant by ID', error, { tenantId: id });
      return null;
    }
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    try {
      const [tenantData] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, subdomain.toLowerCase()));

      if (!tenantData) return null;

      return new Tenant(
        tenantData.id,
        tenantData.name,
        tenantData.subdomain,
        tenantData.settings || {},
        tenantData.isActive ?? true,
        tenantData.createdAt || new Date(),
        tenantData.updatedAt || new Date()
      );
    } catch (error) {
      logError('Error finding tenant by subdomain', error, { subdomain });
      return null;
    }
  }

  async findAll(limit = 50, offset = 0): Promise<Tenant[]> {
    try {
      const tenantData = await db
        .select()
        .from(tenants)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(tenants.createdAt));

      return tenantData.map(data => new Tenant(
        data.id,
        data.name,
        data.subdomain,
        data.settings || {},
        data.isActive ?? true,
        data.createdAt || new Date(),
        data.updatedAt || new Date()
      ));
    } catch (error) {
      logError('Error finding all tenants', error, { limit, offset });
      return [];
    }
  }

  async save(tenant: Tenant): Promise<Tenant> {
    try {
      const [savedData] = await db
        .insert(tenants)
        .values({
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          settings: tenant.settings,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt
        })
        .returning();

      return new Tenant(
        savedData.id,
        savedData.name,
        savedData.subdomain,
        savedData.settings || {},
        savedData.isActive ?? true,
        savedData.createdAt || new Date(),
        savedData.updatedAt || new Date()
      );
    } catch (error) {
      logError('Error saving tenant', error, { tenantId: tenant.id, name: tenant.name });
      throw new Error('Failed to save tenant');
    }
  }

  async update(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      const [updatedData] = await db
        .update(tenants)
        .set(updateData)
        .where(eq(tenants.id, id))
        .returning();

      if (!updatedData) return null;

      return new Tenant(
        updatedData.id,
        updatedData.name,
        updatedData.subdomain,
        updatedData.settings || {},
        updatedData.isActive ?? true,
        updatedData.createdAt || new Date(),
        updatedData.updatedAt || new Date()
      );
    } catch (error) {
      logError('Error updating tenant', error, { tenantId: tenant.id });
      return null;
    }
  }

  async deactivate(id: string): Promise<boolean> {
    try {
      const [updatedData] = await db
        .update(tenants)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(tenants.id, id))
        .returning();

      return !!updatedData;
    } catch (error) {
      logError('Error deactivating tenant', error, { tenantId: id });
      return false;
    }
  }

  async count(): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(tenants);

      return result[0]?.count || 0;
    } catch (error) {
      logError('Error counting tenants', error);
      return 0;
    }
  }
}