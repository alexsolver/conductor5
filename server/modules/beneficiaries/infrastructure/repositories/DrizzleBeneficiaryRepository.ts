
import { eq, and, like, count, sql } from 'drizzle-orm';
import { schemaManager } from '../../../../db';
import { beneficiaries } from '../../../../shared/schema';
import { IBeneficiaryRepository, FindOptions } from '../../domain/repositories/IBeneficiaryRepository';
import { Beneficiary } from '../../domain/entities/Beneficiary';

export class DrizzleBeneficiaryRepository implements IBeneficiaryRepository {
  async findById(id: string, tenantId: string): Promise<Beneficiary | null> {
    const result = await db
      .select()
      .from(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) return null;

    const beneficiary = result[0];
    return new Beneficiary(
      beneficiary.id,
      `${beneficiary.first_name} ${beneficiary.last_name}`,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    );
  }

  async findAll(tenantId: string): Promise<Beneficiary[]> {
    const results = await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.tenantId, tenantId));

    return results.map(beneficiary => new Beneficiary(
      beneficiary.id,
      `${beneficiary.first_name} ${beneficiary.last_name}`,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    ));
  }

  async findByCustomerId(customerId: string, tenantId: string): Promise<Beneficiary[]> {
    const results = await db
      .select()
      .from(beneficiaries)
      .where(and(eq(beneficiaries.customerId, customerId), eq(beneficiaries.tenantId, tenantId)));

    return results.map(beneficiary => new Beneficiary(
      beneficiary.id,
      `${beneficiary.first_name} ${beneficiary.last_name}`,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    ));
  }

  async save(beneficiary: Beneficiary): Promise<void> {
    const [firstName, ...lastNameParts] = beneficiary.name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    await db.insert(beneficiaries).values({
      id: beneficiary.id,
      first_name: firstName,
      last_name: lastName,
      email: beneficiary.email,
      tenantId: beneficiary.tenantId,
      customerId: beneficiary.customerId,
      isActive: beneficiary.isActive,
      createdAt: beneficiary.createdAt,
      updatedAt: beneficiary.updatedAt
    });
  }

  async update(beneficiary: Beneficiary): Promise<Beneficiary> {
    const [firstName, ...lastNameParts] = beneficiary.name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    await db
      .update(beneficiaries)
      .set({
        first_name: firstName,
        last_name: lastName,
        email: beneficiary.email,
        isActive: beneficiary.isActive,
        updatedAt: beneficiary.updatedAt
      })
      .where(and(eq(beneficiaries.id, beneficiary.id), eq(beneficiaries.tenantId, beneficiary.tenantId)));
    
    return beneficiary;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.tenantId, tenantId)));
    return true;
  }

  async create(beneficiary: Beneficiary): Promise<Beneficiary> {
    await this.save(beneficiary);
    return beneficiary;
  }

  async findByTenant(tenantId: string, options?: FindOptions): Promise<Beneficiary[]> {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    let whereClause = 'WHERE tenant_id = $1';
    let params: any[] = [tenantId];
    
    if (options?.search) {
      whereClause += ' AND (first_name || \' \' || last_name) ILIKE $2';
      params.push(`%${options.search}%`);
    }
    
    let limitClause = '';
    if (options?.limit) {
      limitClause += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }
    
    if (options?.page && options?.limit) {
      const offset = (options.page - 1) * options.limit;
      limitClause += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }
    
    const query = `
      SELECT id, first_name, last_name, email, tenant_id as "tenantId", 
             customer_id as "customerId", is_active as "isActive", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM "${schemaName}"."beneficiaries" 
      ${whereClause}
      ORDER BY first_name ASC, last_name ASC
      ${limitClause}
    `;
    
    const result = await pool.query(query, params);
    
    return result.rows.map((row: any) => new Beneficiary(
      row.id,
      `${row.first_name} ${row.last_name}`,
      row.email,
      row.tenantId,
      row.customerId || undefined,
      row.isActive,
      row.createdAt,
      row.updatedAt
    ));
  }

  async countByTenant(tenantId: string, search?: string): Promise<number> {
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);
    
    let whereClause = 'WHERE tenant_id = $1';
    let params: any[] = [tenantId];
    
    if (search) {
      whereClause += ' AND (first_name || \' \' || last_name) ILIKE $2';
      params.push(`%${search}%`);
    }
    
    const query = `
      SELECT COUNT(*) as count
      FROM "${schemaName}"."beneficiaries" 
      ${whereClause}
    `;
    
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}
