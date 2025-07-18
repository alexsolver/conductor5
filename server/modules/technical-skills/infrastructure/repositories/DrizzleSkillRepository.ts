import { sql, eq, ilike, and, count, desc } from 'drizzle-orm';
import { schemaManager } from '../../../../db';
import { Skill } from '../../domain/entities/Skill';
import { ISkillRepository } from '../../domain/repositories/ISkillRepository';

export class DrizzleSkillRepository implements ISkillRepository {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async getDb() {
    return schemaManager.getTenantConnection(this.tenantId);
  }
  async create(skill: Skill): Promise<Skill> {
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      INSERT INTO ${sql.identifier(schemaName)}.skills (
        id, name, category, min_level_required, suggested_certification,
        certification_validity_months, description, observations, is_active,
        created_at, updated_at, created_by, updated_by
      ) VALUES (
        ${skill.id}, ${skill.name}, ${skill.category}, ${skill.minLevelRequired},
        ${skill.suggestedCertification}, ${skill.certificationValidityMonths},
        ${skill.description}, ${skill.observations}, ${skill.isActive},
        ${skill.createdAt}, ${skill.updatedAt}, ${skill.createdBy}, ${skill.updatedBy}
      ) RETURNING *
    `);
    
    return this.mapToEntity(result.rows[0] as any);
  }

  async findById(id: string): Promise<Skill | null> {
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.skills WHERE id = ${id} AND is_active = true
    `);
    
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0] as any) : null;
  }

  async findAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Skill[]> {
    const schemaName = this.getSchemaName();
    
    if (filters?.category) {
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.skills 
        WHERE category = ${filters.category} AND is_active = true
        ORDER BY name
      `);
      return result.rows.map(row => this.mapToEntity(row as any));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.skills 
        WHERE (name ILIKE ${searchPattern} OR description ILIKE ${searchPattern}) AND is_active = true
        ORDER BY name
      `);
      return result.rows.map(row => this.mapToEntity(row as any));
    }
    
    const isActive = filters?.isActive !== undefined ? filters.isActive : true;
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.skills 
      WHERE is_active = ${isActive}
      ORDER BY name
    `);
    
    return result.rows.map(row => this.mapToEntity(row as any));
  }

  async update(skill: Skill): Promise<Skill> {
    const db = await this.getDb();
    const result = await db.execute(sql`
      UPDATE skills SET 
        name = ${skill.name},
        category = ${skill.category},
        min_level_required = ${skill.minLevelRequired},
        suggested_certification = ${skill.suggestedCertification},
        certification_validity_months = ${skill.certificationValidityMonths},
        description = ${skill.description},
        observations = ${skill.observations},
        is_active = ${skill.isActive},
        updated_at = ${skill.updatedAt},
        updated_by = ${skill.updatedBy}
      WHERE id = ${skill.id}
      RETURNING *
    `);
    
    return this.mapToEntity(result.rows[0] as any);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute(sql`DELETE FROM skills WHERE id = ${id}`);
  }

  async findByCategory(category: string): Promise<Skill[]> {
    const db = await this.getDb();
    const result = await db.execute(sql`
      SELECT * FROM skills 
      WHERE category = ${category} AND is_active = true
      ORDER BY name
    `);
    
    return result.rows.map(row => this.mapToEntity(row as any));
  }

  async findByNamePattern(pattern: string): Promise<Skill[]> {
    const db = await this.getDb();
    const result = await db.execute(sql`
      SELECT * FROM skills 
      WHERE name ILIKE ${`%${pattern}%`} AND is_active = true
      ORDER BY name
    `);
    
    return result.rows.map(row => this.mapToEntity(row as any));
  }

  async getCategories(): Promise<string[]> {
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      SELECT DISTINCT category FROM ${sql.identifier(schemaName)}.skills 
      WHERE is_active = true
      ORDER BY category
    `);
    
    return result.rows.map(row => (row as any).category);
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    const results = await db.select({
      category: technicalSkills.category,
      count: count(),
    })
    .from(technicalSkills)
    .where(eq(technicalSkills.isActive, true))
    .groupBy(technicalSkills.category)
    .orderBy(technicalSkills.category);
    
    return results.map(r => ({
      category: r.category,
      count: Number(r.count),
    }));
  }

  async getMostDemandedSkills(limit: number = 10): Promise<{ skill: Skill; demandCount: number }[]> {
    const results = await db.select({
      skill: technicalSkills,
      demandCount: count(userSkills.id),
    })
    .from(technicalSkills)
    .leftJoin(userSkills, eq(technicalSkills.id, userSkills.skillId))
    .where(eq(technicalSkills.isActive, true))
    .groupBy(technicalSkills.id)
    .orderBy(desc(count(userSkills.id)))
    .limit(limit);
    
    return results.map(r => ({
      skill: this.mapToEntity(r.skill),
      demandCount: Number(r.demandCount),
    }));
  }

  private mapToEntity(row: any): Skill {
    return new Skill(
      row.id,
      row.name,
      row.category,
      row.minLevelRequired,
      row.suggestedCertification,
      row.certificationValidityMonths,
      row.description,
      row.observations,
      row.isActive,
      row.createdAt,
      row.updatedAt,
      row.createdBy,
      row.updatedBy
    );
  }
}