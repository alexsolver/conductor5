import { eq, and, ilike, count, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { skills } from '../../../../../shared/schema-master';
import type { ISkillRepository } from '../../domain/repositories/ISkillRepository';
import type { Skill } from '../../domain/entities/Skill';

export class DrizzleSkillRepository implements ISkillRepository {
  async create(skill: Skill): Promise<Skill> {
    const [result] = await db.insert(skills).values({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      levelMin: skill.minLevelRequired || 1,
      levelMax: skill.maxLevelRequired || 5,
      certificationSuggested: skill.certificationSuggested,
      validityMonths: skill.validityMonths,
      description: skill.description,
      observations: skill.observations,
      tenantId: skill.tenantId,
      isActive: true,
    }).returning();

    return this.mapToSkill(result);
  }

  async findById(id: string): Promise<Skill | null> {
    const [result] = await db.select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);

    return result ? this.mapToSkill(result) : null;
  }

  async findAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    tenantId?: string;
  }): Promise<Skill[]> {
    let query = db.select().from(skills);

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
      conditions.push(
        ilike(skills.name, `%${filters.search}%`)
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(skills.createdAt));
    return results.map(r => this.mapToSkill(r));
  }

  async update(skill: Skill): Promise<Skill> {
    const [result] = await db.update(skills)
      .set({
        name: skill.name,
        category: skill.category,
        levelMin: skill.minLevelRequired || 1,
        levelMax: skill.maxLevelRequired || 5,
        certificationSuggested: skill.certificationSuggested,
        validityMonths: skill.validityMonths,
        description: skill.description,
        observations: skill.observations,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skill.id))
      .returning();

    return this.mapToSkill(result);
  }

  async delete(id: string): Promise<void> {
    await db.update(skills)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id));
  }

  async findByCategory(category: string): Promise<Skill[]> {
    const results = await db.select()
      .from(skills)
      .where(and(
        eq(skills.category, category),
        eq(skills.isActive, true)
      ))
      .orderBy(skills.name);

    return results.map(r => this.mapToSkill(r));
  }

  async findByNamePattern(pattern: string): Promise<Skill[]> {
    const results = await db.select()
      .from(skills)
      .where(and(
        ilike(skills.name, `%${pattern}%`),
        eq(skills.isActive, true)
      ))
      .orderBy(skills.name);

    return results.map(r => this.mapToSkill(r));
  }

  async getCategories(): Promise<string[]> {
    const results = await db.selectDistinct({ category: skills.category })
      .from(skills)
      .where(eq(skills.isActive, true))
      .orderBy(skills.category);

    const existingCategories = results.map(r => r.category).filter(Boolean);

    // Garantir que as categorias padrão estejam sempre disponíveis
    const defaultCategories = ['Técnica', 'Operacional', 'Administrativa'];
    const allCategories = [...new Set([...defaultCategories, ...existingCategories])];

    return allCategories.sort();
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    const results = await db.select({
      category: skills.category,
      count: count(skills.id),
    })
    .from(skills)
    .where(eq(skills.isActive, true))
    .groupBy(skills.category)
    .orderBy(skills.category);

    return results.map(r => ({
      category: r.category || 'General',
      count: Number(r.count),
    }));
  }

  async getMostDemandedSkills(limit?: number): Promise<{ skill: Skill; demandCount: number }[]> {
    // Esta implementação seria baseada em estatísticas de uso real
    // Por enquanto, retorna skills ordenadas por data de criação
    const results = await db.select()
      .from(skills)
      .where(eq(skills.isActive, true))
      .orderBy(desc(skills.createdAt))
      .limit(limit || 10);

    return results.map(r => ({
      skill: this.mapToSkill(r),
      demandCount: 0, // Seria calculado baseado em tickets/tarefas
    }));
  }

  private mapToSkill(data: any): Skill {
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      minLevelRequired: data.levelMin || 1,
      maxLevelRequired: data.levelMax || 5,
      certificationSuggested: data.certificationSuggested,
      validityMonths: data.validityMonths,
      description: data.description,
      observations: data.observations,
      tenantId: data.tenantId,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}