import { Pool } from '@neondatabase/serverless';
import { Part, InsertPart, UpdatePart } from '@shared/schema-parts-module1-complete';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export class Module1PartsRepository {
  private getTenantSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // CREATE - Criar nova peça com TODAS as especificações
  async createPart(tenantId: string, data: InsertPart): Promise<Part | null> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(`
        INSERT INTO ${schema}.parts (
          tenant_id, internal_code, manufacturer_code, barcode, title, description, 
          category_id, subcategory, technical_specs, dimensions, weight_kg, material,
          voltage, power_watts, images, manuals, cost_price, margin_percentage, sale_price,
          abc_classification, obsolescence_status, interchangeable_parts, is_active,
          created_by_id, updated_by_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25
        ) RETURNING *
      `, [
        tenantId,
        data.internalCode,
        data.manufacturerCode || null,
        data.barcode || null,
        data.title,
        data.description || null,
        data.categoryId || null,
        data.subcategory || null,
        JSON.stringify(data.technicalSpecs || {}),
        data.dimensions || null,
        data.weightKg || null,
        data.material || null,
        data.voltage || null,
        data.powerWatts || null,
        data.images || [],
        data.manuals || [],
        data.costPrice || null,
        data.marginPercentage || null,
        data.salePrice || null,
        data.abcClassification || 'C',
        data.obsolescenceStatus || 'active',
        data.interchangeableParts || [],
        data.isActive !== false,
        data.createdById || null,
        data.updatedById || null
      ]);

      return result.rows[0] as Part;
    } catch (error) {
      console.error('❌ Error creating part:', error);
      return null;
    }
  }

  // READ - Buscar todas as peças com filtros
  async findAllParts(tenantId: string, filters: {
    category?: string;
    subcategory?: string;
    status?: string;
    abcClassification?: string;
    obsolescenceStatus?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Part[]> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      let query = `SELECT * FROM ${schema}.parts WHERE tenant_id = $1`;
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (filters.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters.subcategory) {
        query += ` AND subcategory = $${paramIndex}`;
        params.push(filters.subcategory);
        paramIndex++;
      }

      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.abcClassification) {
        query += ` AND abc_classification = $${paramIndex}`;
        params.push(filters.abcClassification);
        paramIndex++;
      }

      if (filters.obsolescenceStatus) {
        query += ` AND obsolescence_status = $${paramIndex}`;
        params.push(filters.obsolescenceStatus);
        paramIndex++;
      }

      if (filters.search) {
        query += ` AND (name ILIKE $${paramIndex} OR internal_code ILIKE $${paramIndex} OR manufacturer_code ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await pool.query(query, params);
      return result.rows as Part[];
    } catch (error) {
      console.error('❌ Error finding parts:', error);
      return [];
    }
  }

  // READ - Buscar peça por ID
  async findPartById(tenantId: string, partId: string): Promise<Part | null> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `SELECT * FROM ${schema}.parts WHERE tenant_id = $1 AND id = $2`,
        [tenantId, partId]
      );

      return result.rows[0] as Part || null;
    } catch (error) {
      console.error('❌ Error finding part by ID:', error);
      return null;
    }
  }

  // UPDATE - Atualizar peça completa
  async updatePart(tenantId: string, partId: string, data: UpdatePart): Promise<Part | null> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const setClause: string[] = [];
      const params: any[] = [tenantId, partId];
      let paramIndex = 3;

      // Construir dinamicamente a query de update apenas com campos presentes
      if (data.internalCode !== undefined) {
        setClause.push(`internal_code = $${paramIndex++}`);
        params.push(data.internalCode);
      }
      if (data.manufacturerCode !== undefined) {
        setClause.push(`manufacturer_code = $${paramIndex++}`);
        params.push(data.manufacturerCode);
      }
      if (data.barcode !== undefined) {
        setClause.push(`barcode = $${paramIndex++}`);
        params.push(data.barcode);
      }
      if (data.name !== undefined) {
        setClause.push(`name = $${paramIndex++}`);
        params.push(data.name);
      }
      if (data.description !== undefined) {
        setClause.push(`description = $${paramIndex++}`);
        params.push(data.description);
      }
      if (data.category !== undefined) {
        setClause.push(`category = $${paramIndex++}`);
        params.push(data.category);
      }
      if (data.subcategory !== undefined) {
        setClause.push(`subcategory = $${paramIndex++}`);
        params.push(data.subcategory);
      }
      if (data.technicalSpecs !== undefined) {
        setClause.push(`technical_specs = $${paramIndex++}`);
        params.push(JSON.stringify(data.technicalSpecs));
      }
      if (data.costPrice !== undefined) {
        setClause.push(`cost_price = $${paramIndex++}`);
        params.push(data.costPrice);
      }
      if (data.sellingPrice !== undefined) {
        setClause.push(`selling_price = $${paramIndex++}`);
        params.push(data.sellingPrice);
      }
      if (data.abcClassification !== undefined) {
        setClause.push(`abc_classification = $${paramIndex++}`);
        params.push(data.abcClassification);
      }
      if (data.obsolescenceStatus !== undefined) {
        setClause.push(`obsolescence_status = $${paramIndex++}`);
        params.push(data.obsolescenceStatus);
      }

      // Sempre atualizar updated_at e updated_by
      setClause.push(`updated_at = NOW()`);
      if (data.updatedBy) {
        setClause.push(`updated_by = $${paramIndex++}`);
        params.push(data.updatedBy);
      }

      if (setClause.length === 0) {
        return null;
      }

      const query = `
        UPDATE ${schema}.parts 
        SET ${setClause.join(', ')}
        WHERE tenant_id = $1 AND id = $2
        RETURNING *
      `;

      const result = await pool.query(query, params);
      return result.rows[0] as Part || null;
    } catch (error) {
      console.error('❌ Error updating part:', error);
      return null;
    }
  }

  // DELETE - Remover peça (soft delete)
  async deletePart(tenantId: string, partId: string): Promise<boolean> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const result = await pool.query(
        `UPDATE ${schema}.parts SET is_active = false, updated_at = NOW() WHERE tenant_id = $1 AND id = $2`,
        [tenantId, partId]
      );

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('❌ Error deleting part:', error);
      return false;
    }
  }

  // STATS - Estatísticas do módulo
  async getPartsStats(tenantId: string): Promise<{
    totalParts: number;
    partsByCategory: Record<string, number>;
    partsByABC: Record<string, number>;
    obsoleteParts: number;
  }> {
    const schema = this.getTenantSchema(tenantId);
    
    try {
      const [totalResult, categoryResult, abcResult, obsoleteResult] = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1 AND is_active = true`, [tenantId]),
        pool.query(`SELECT category, COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1 AND is_active = true GROUP BY category`, [tenantId]),
        pool.query(`SELECT abc_classification, COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1 AND is_active = true GROUP BY abc_classification`, [tenantId]),
        pool.query(`SELECT COUNT(*) as count FROM ${schema}.parts WHERE tenant_id = $1 AND obsolescence_status = 'obsolete'`, [tenantId])
      ]);

      const partsByCategory: Record<string, number> = {};
      categoryResult.rows.forEach(row => {
        partsByCategory[row.category] = parseInt(row.count);
      });

      const partsByABC: Record<string, number> = {};
      abcResult.rows.forEach(row => {
        partsByABC[row.abc_classification] = parseInt(row.count);
      });

      return {
        totalParts: parseInt(totalResult.rows[0].count),
        partsByCategory,
        partsByABC,
        obsoleteParts: parseInt(obsoleteResult.rows[0].count)
      };
    } catch (error) {
      console.error('❌ Error getting parts stats:', error);
      return {
        totalParts: 0,
        partsByCategory: {},
        partsByABC: {},
        obsoleteParts: 0
      };
    }
  }
}