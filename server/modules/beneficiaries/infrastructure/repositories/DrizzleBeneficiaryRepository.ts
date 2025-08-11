
/**
 * INFRASTRUCTURE REPOSITORY - BENEFICIARY
 * Clean Architecture: Infrastructure layer repository implementation
 */

import { eq, and, like, sql, count, or } from 'drizzle-orm';
import { Beneficiary } from '../../domain/entities/Beneficiary';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';

export class DrizzleBeneficiaryRepository implements IBeneficiaryRepository {
  constructor(
    private readonly db: any,
    private readonly schema: any
  ) {}

  async findById(id: string, tenantId: string): Promise<Beneficiary | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await this.db.execute(sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);

      const rows = Array.isArray(result) ? result : (result.rows || []);
      
      if (rows.length === 0) {
        return null;
      }

      return this.mapToDomain(rows[0]);
    } catch (error) {
      console.error('Error finding beneficiary by id:', error);
      throw new Error('Falha ao buscar favorecido');
    }
  }

  async findByEmail(email: string, tenantId: string): Promise<Beneficiary | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await this.db.execute(sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE email = ${email} AND tenant_id = ${tenantId}
      `);

      const rows = Array.isArray(result) ? result : (result.rows || []);
      
      if (rows.length === 0) {
        return null;
      }

      return this.mapToDomain(rows[0]);
    } catch (error) {
      console.error('Error finding beneficiary by email:', error);
      throw new Error('Falha ao buscar favorecido por email');
    }
  }

  async findByTenant(tenantId: string, filters?: {
    search?: string;
    customerId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    beneficiaries: Beneficiary[];
    total: number;
    totalPages: number;
  }> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      // Build WHERE conditions
      let whereConditions = `tenant_id = '${tenantId}'`;
      
      if (filters?.search) {
        const searchTerm = filters.search.replace(/'/g, "''"); // Escape single quotes
        whereConditions += ` AND (
          first_name ILIKE '%${searchTerm}%' OR 
          last_name ILIKE '%${searchTerm}%' OR 
          email ILIKE '%${searchTerm}%'
        )`;
      }

      if (filters?.customerId) {
        whereConditions += ` AND customer_id = '${filters.customerId}'`;
      }

      if (filters?.isActive !== undefined) {
        whereConditions += ` AND is_active = ${filters.isActive}`;
      }

      // Get total count
      const countResult = await this.db.execute(sql`
        SELECT COUNT(*) as total
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE ${sql.raw(whereConditions)}
      `);

      const totalRows = Array.isArray(countResult) ? countResult : (countResult.rows || []);
      const total = parseInt(totalRows[0]?.total || '0', 10);
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const result = await this.db.execute(sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE ${sql.raw(whereConditions)}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const rows = Array.isArray(result) ? result : (result.rows || []);
      const beneficiaries = rows.map(row => this.mapToDomain(row));

      return {
        beneficiaries,
        total,
        totalPages
      };
    } catch (error) {
      console.error('Error finding beneficiaries by tenant:', error);
      throw new Error('Falha ao buscar favorecidos');
    }
  }

  async save(beneficiary: Beneficiary): Promise<void> {
    try {
      const schemaName = `tenant_${beneficiary.tenantId.replace(/-/g, '_')}`;
      
      await this.db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.beneficiaries (
          id,
          tenant_id,
          first_name,
          last_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        ) VALUES (
          ${beneficiary.id},
          ${beneficiary.tenantId},
          ${beneficiary.firstName},
          ${beneficiary.lastName},
          ${beneficiary.email},
          ${beneficiary.birthDate},
          ${beneficiary.rg},
          ${beneficiary.cpfCnpj},
          ${beneficiary.isActive},
          ${beneficiary.customerCode},
          ${beneficiary.customerId},
          ${beneficiary.phone},
          ${beneficiary.cellPhone},
          ${beneficiary.contactPerson},
          ${beneficiary.contactPhone},
          ${beneficiary.createdAt.toISOString()},
          ${beneficiary.updatedAt.toISOString()}
        )
      `);
    } catch (error) {
      console.error('Error saving beneficiary:', error);
      throw new Error('Falha ao salvar favorecido');
    }
  }

  async update(beneficiary: Beneficiary): Promise<void> {
    try {
      const schemaName = `tenant_${beneficiary.tenantId.replace(/-/g, '_')}`;
      
      await this.db.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.beneficiaries
        SET
          first_name = ${beneficiary.firstName},
          last_name = ${beneficiary.lastName},
          email = ${beneficiary.email},
          birth_date = ${beneficiary.birthDate},
          rg = ${beneficiary.rg},
          cpf_cnpj = ${beneficiary.cpfCnpj},
          is_active = ${beneficiary.isActive},
          customer_code = ${beneficiary.customerCode},
          customer_id = ${beneficiary.customerId},
          phone = ${beneficiary.phone},
          cell_phone = ${beneficiary.cellPhone},
          contact_person = ${beneficiary.contactPerson},
          contact_phone = ${beneficiary.contactPhone},
          updated_at = ${beneficiary.updatedAt.toISOString()}
        WHERE id = ${beneficiary.id} AND tenant_id = ${beneficiary.tenantId}
      `);
    } catch (error) {
      console.error('Error updating beneficiary:', error);
      throw new Error('Falha ao atualizar favorecido');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      await this.db.execute(sql`
        DELETE FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      throw new Error('Falha ao excluir favorecido');
    }
  }

  async existsByEmail(email: string, tenantId: string, excludeId?: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      let whereConditions = `email = '${email}' AND tenant_id = '${tenantId}'`;
      
      if (excludeId) {
        whereConditions += ` AND id != '${excludeId}'`;
      }

      const result = await this.db.execute(sql`
        SELECT COUNT(*) as count
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE ${sql.raw(whereConditions)}
      `);

      const rows = Array.isArray(result) ? result : (result.rows || []);
      return parseInt(rows[0]?.count || '0', 10) > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Falha ao verificar email');
    }
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Beneficiary[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const result = await this.db.execute(sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          contact_person,
          contact_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE customer_id = ${customerId} AND tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `);

      const rows = Array.isArray(result) ? result : (result.rows || []);
      return rows.map(row => this.mapToDomain(row));
    } catch (error) {
      console.error('Error finding beneficiaries by customer:', error);
      throw new Error('Falha ao buscar favorecidos por cliente');
    }
  }

  private mapToDomain(row: any): Beneficiary {
    return new Beneficiary(
      row.id,
      row.tenant_id,
      row.first_name,
      row.last_name,
      row.email,
      row.birth_date,
      row.rg,
      row.cpf_cnpj,
      row.is_active,
      row.customer_code,
      row.customer_id,
      row.phone,
      row.cell_phone,
      row.contact_person,
      row.contact_phone,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
