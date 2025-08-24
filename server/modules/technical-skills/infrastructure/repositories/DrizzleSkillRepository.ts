import { eq, and, like, desc } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { skills } from '@shared/schema';
import type { ISkillRepository } from '../../domain/repositories/ISkillRepository';
import { Skill, SkillEntity } from '../../domain/entities/Skill';

export class DrizzleSkillRepository implements ISkillRepository {
  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }
  
  async create(skill: Skill): Promise<Skill> {
    // Usar apenas campos básicos que existem no banco
    const tenantDb = await this.getTenantDb(skill.tenantId || '');
    const [result] = await tenantDb.insert(skills).values({
      name: skill.name,
      category: skill.category,
      description: skill.description || '',
      tenantId: skill.tenantId || '',
      isActive: true,
    }).returning();

    return this.mapToSkill(result);
  }

  async findById(id: string, tenantId?: string): Promise<Skill | null> {
    const tenantDb = await this.getTenantDb(tenantId || '');
    const result = await tenantDb.select({
      id: skills.id,
      name: skills.name,
      category: skills.category,
      description: skills.description,
      tenantId: skills.tenantId,
      isActive: skills.isActive,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
    }).from(skills).where(eq(skills.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToSkill(result[0]);
  }

  async findAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    tenantId?: string;
  }): Promise<Skill[]> {
    const tenantDb = await this.getTenantDb(filters?.tenantId || '');
    let query = tenantDb.select({
      id: skills.id,
      name: skills.name,
      category: skills.category,
      description: skills.description,
      tenantId: skills.tenantId,
      isActive: skills.isActive,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
    }).from(skills);
    const conditions = [];

    if (filters?.tenantId) {
      conditions.push(eq(skills.tenantId, filters.tenantId));
    }

    if (filters?.category) {
      conditions.push(eq(skills.category, filters.category));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(skills.isActive, filters.isActive));
    }

    if (filters?.search) {
      conditions.push(like(skills.name, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(skills.createdAt));
    return results.map(this.mapToSkill);
  }

  async update(skill: Skill): Promise<Skill> {
    const tenantDb = await this.getTenantDb(skill.tenantId || '');
    const [result] = await tenantDb.update(skills)
      .set({
        name: skill.name,
        category: skill.category,
        description: skill.description,
        isActive: skill.isActive,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skill.id))
      .returning();

    return this.mapToSkill(result);
  }

  async updateDirect(data: {
    id: string;
    name?: string;
    category?: string;
    description?: string;
    tenantId?: string;
    updatedBy?: string;
  }): Promise<Skill> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;

    const tenantDb = await this.getTenantDb(data.tenantId || '');
    const [result] = await tenantDb.update(skills)
      .set(updateData)
      .where(eq(skills.id, data.id))
      .returning();

    return this.mapToSkill(result);
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const tenantDb = await this.getTenantDb(tenantId || '');
    await tenantDb.update(skills)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(skills.id, id));
  }

  async findByCategory(category: string, tenantId?: string): Promise<Skill[]> {
    const tenantDb = await this.getTenantDb(tenantId || '');
    const results = await tenantDb.select({
      id: skills.id,
      name: skills.name,
      category: skills.category,
      description: skills.description,
      tenantId: skills.tenantId,
      isActive: skills.isActive,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
    }).from(skills)
      .where(and(eq(skills.category, category), eq(skills.isActive, true)))
      .orderBy(desc(skills.createdAt));

    return results.map(this.mapToSkill);
  }

  async findByNamePattern(pattern: string, tenantId?: string): Promise<Skill[]> {
    const tenantDb = await this.getTenantDb(tenantId || '');
    const results = await tenantDb.select({
      id: skills.id,
      name: skills.name,
      category: skills.category,
      description: skills.description,
      tenantId: skills.tenantId,
      isActive: skills.isActive,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
    }).from(skills)
      .where(and(like(skills.name, `%${pattern}%`), eq(skills.isActive, true)))
      .orderBy(desc(skills.createdAt));

    return results.map(this.mapToSkill);
  }

  async getCategories(tenantId?: string): Promise<string[]> {
    const tenantDb = await this.getTenantDb(tenantId || '');
    const results = await tenantDb.selectDistinct({ category: skills.category }).from(skills)
      .where(eq(skills.isActive, true));

    return results.map(r => r.category).filter(Boolean);
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    return [];
  }

  async getMostDemandedSkills(limit?: number): Promise<{ skill: Skill; demandCount: number }[]> {
    return [];
  }

  private mapToSkill(row: any): Skill {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      minLevelRequired: 1, // valor padrão
      maxLevelRequired: 5, // valor padrão  
      tenantId: row.tenantId,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}