import { eq, and, like, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { skills } from '../../../../../shared/schema-master';
import type { ISkillRepository } from '../../domain/repositories/ISkillRepository';
import { Skill, SkillEntity } from '../../domain/entities/Skill';

export class DrizzleSkillRepository implements ISkillRepository {
  async create(skill: Skill): Promise<Skill> {
    const [result] = await db.insert(skills).values({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description || '',
      tenantId: skill.tenantId,
      isActive: true,
    }).returning();

    return this.mapToSkill(result);
  }

  async findById(id: string): Promise<Skill | null> {
    const result = await db.select({
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
    let query = db.select({
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
    const [result] = await db.update(skills)
      .set({
        name: skill.name,
        category: skill.category,
        isActive: skill.isActive,
        updatedAt: skill.updatedAt,
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
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    const [result] = await db.update(skills)
      .set(updateData)
      .where(eq(skills.id, data.id))
      .returning();

    return this.mapToSkill(result);
  }

  async delete(id: string): Promise<void> {
    await db.update(skills)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(skills.id, id));
  }

  async findByCategory(category: string): Promise<Skill[]> {
    const results = await db.select({
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

  async findByNamePattern(pattern: string): Promise<Skill[]> {
    const results = await db.select({
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

  async getCategories(): Promise<string[]> {
    const results = await db.selectDistinct({ category: skills.category }).from(skills)
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