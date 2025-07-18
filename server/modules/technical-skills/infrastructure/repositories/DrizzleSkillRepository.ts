import { sql, eq, ilike, and, count, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { skills, userSkills, users } from '../../../../../shared/schema';
import { Skill } from '../../domain/entities/Skill';
import { ISkillRepository } from '../../domain/repositories/ISkillRepository';

export class DrizzleSkillRepository implements ISkillRepository {
  async create(skill: Skill): Promise<Skill> {
    const [created] = await db.insert(skills).values({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      minLevelRequired: skill.minLevelRequired,
      suggestedCertification: skill.suggestedCertification,
      certificationValidityMonths: skill.certificationValidityMonths,
      description: skill.description,
      observations: skill.observations,
      isActive: skill.isActive,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      createdBy: skill.createdBy,
      updatedBy: skill.updatedBy,
    }).returning();
    
    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Skill | null> {
    const [found] = await db.select().from(skills).where(eq(skills.id, id));
    return found ? this.mapToEntity(found) : null;
  }

  async findAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Skill[]> {
    let query = db.select().from(skills);
    
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(skills.category, filters.category));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(skills.isActive, filters.isActive));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`(${ilike(skills.name, `%${filters.search}%`)} OR ${ilike(skills.description, `%${filters.search}%`)})`
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query.orderBy(skills.name);
    return results.map(this.mapToEntity);
  }

  async update(skill: Skill): Promise<Skill> {
    const [updated] = await db.update(skills)
      .set({
        name: skill.name,
        category: skill.category,
        minLevelRequired: skill.minLevelRequired,
        suggestedCertification: skill.suggestedCertification,
        certificationValidityMonths: skill.certificationValidityMonths,
        description: skill.description,
        observations: skill.observations,
        isActive: skill.isActive,
        updatedAt: skill.updatedAt,
        updatedBy: skill.updatedBy,
      })
      .where(eq(skills.id, skill.id))
      .returning();
    
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  async findByCategory(category: string): Promise<Skill[]> {
    const results = await db.select()
      .from(skills)
      .where(and(
        eq(skills.category, category),
        eq(skills.isActive, true)
      ))
      .orderBy(skills.name);
    
    return results.map(this.mapToEntity);
  }

  async findByNamePattern(pattern: string): Promise<Skill[]> {
    const results = await db.select()
      .from(skills)
      .where(and(
        ilike(skills.name, `%${pattern}%`),
        eq(skills.isActive, true)
      ))
      .orderBy(skills.name);
    
    return results.map(this.mapToEntity);
  }

  async getCategories(): Promise<string[]> {
    const results = await db.selectDistinct({ category: skills.category })
      .from(skills)
      .where(eq(skills.isActive, true))
      .orderBy(skills.category);
    
    return results.map(r => r.category);
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
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