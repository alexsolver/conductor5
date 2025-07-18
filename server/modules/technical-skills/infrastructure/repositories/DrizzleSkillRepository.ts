import { sql, eq, ilike, and, count, desc } from 'drizzle-orm';
import { SchemaManager } from '../../../../db';
import { Skill } from '../../domain/entities/Skill';
import { ISkillRepository } from '../../domain/repositories/ISkillRepository';
import { skills, userSkills } from '@shared/schema';

export class DrizzleSkillRepository implements ISkillRepository {
  private tenantId: string;
  private schemaManager: SchemaManager;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.schemaManager = SchemaManager.getInstance();
  }

  private getSchemaName(): string {
    return `tenant_${this.tenantId.replace(/-/g, '_')}`;
  }

  async create(skill: Skill): Promise<Skill> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
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
    
    return this.mapToEntity(result.rows[0] as Record<string, unknown>);
  }

  async findById(id: string): Promise<Skill | null> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.skills WHERE id = ${id} AND is_active = true
    `);
    
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0] as Record<string, unknown>) : null;
  }

  async findAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Skill[]> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const schemaName = this.getSchemaName();
    
    if (filters?.category) {
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.skills 
        WHERE category = ${filters.category} AND is_active = true
        ORDER BY name
      `);
      return result.rows.map(row => this.mapToEntity(row as Record<string, unknown>));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.skills 
        WHERE (name ILIKE ${searchPattern} OR description ILIKE ${searchPattern}) AND is_active = true
        ORDER BY name
      `);
      return result.rows.map(row => this.mapToEntity(row as Record<string, unknown>));
    }
    
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.skills 
      WHERE is_active = true
      ORDER BY name
    `);
    
    return result.rows.map(row => this.mapToEntity(row as Record<string, unknown>));
  }

  async update(skill: Skill): Promise<Skill> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      UPDATE ${sql.identifier(schemaName)}.skills SET 
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
    
    return this.mapToEntity(result.rows[0] as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const schemaName = this.getSchemaName();
    await db.execute(sql`DELETE FROM ${sql.identifier(schemaName)}.skills WHERE id = ${id}`);
  }

  async findByCategory(category: string): Promise<Skill[]> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.skills 
      WHERE category = ${category} AND is_active = true
      ORDER BY name
    `);
    
    return result.rows.map(row => this.mapToEntity(row as Record<string, unknown>));
  }

  async findByNamePattern(pattern: string): Promise<Skill[]> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      SELECT * FROM ${sql.identifier(schemaName)}.skills 
      WHERE name ILIKE ${`%${pattern}%`} AND is_active = true
      ORDER BY name
    `);
    
    return result.rows.map(row => this.mapToEntity(row as Record<string, unknown>));
  }

  async getCategories(): Promise<string[]> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const schemaName = this.getSchemaName();
    const result = await db.execute(sql`
      SELECT DISTINCT category FROM ${sql.identifier(schemaName)}.skills 
      WHERE is_active = true
      ORDER BY category
    `);
    
    return result.rows.map(row => (row as Record<string, unknown>).category as string);
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const results = await db.select({
      category: skills.category,
      count: count(),
    })
    .from(skills)
    .where(eq(skills.isActive, true))
    .groupBy(skills.category)
    .orderBy(skills.category);
    
    return results.map(r => ({
      category: r.category,
      count: Number(r.count),
    }));
  }

  async getMostDemandedSkills(limit: number = 10): Promise<{ skill: Skill; demandCount: number }[]> {
    const db = await this.schemaManager.getTenantDb(this.tenantId);
    const results = await db.select({
      skill: skills,
      demandCount: count(userSkills.id),
    })
    .from(skills)
    .leftJoin(userSkills, eq(skills.id, userSkills.skillId))
    .where(eq(skills.isActive, true))
    .groupBy(skills.id)
    .orderBy(desc(count(userSkills.id)))
    .limit(limit);
    
    return results.map(r => ({
      skill: this.mapToEntity(r.skill),
      demandCount: Number(r.demandCount),
    }));
  }

  private mapToEntity(row: Record<string, unknown>): Skill {
    return new Skill(
      row.id as string,
      row.name as string,
      row.category as string,
      row.min_level_required as number,
      row.suggested_certification as string | null,
      row.certification_validity_months as number | null,
      row.description as string | null,
      row.observations as string | null,
      row.is_active as boolean,
      row.created_at as Date,
      row.updated_at as Date,
      row.created_by as string,
      row.updated_by as string
    );
  }
}