import { sql, eq, or, ilike, isNotNull } from 'drizzle-orm';
import { NeonDatabase } from '@neondatabase/serverless';
import { Skill } from '../../domain/entities/Skill';
import { ISkillRepository } from '../../domain/repositories/ISkillRepository';
const { db, schemaManager } = require("../../../../db");
import { skills } from '../../../../../shared/schema.js';
import winston from 'winston';

export class DrizzleSkillRepository implements ISkillRepository {
  private db: NeonDatabase;

  constructor() {
    this.db = db;
  }

  async create(skill: Skill): Promise<Skill> {
    try {
      const skillData = this.fromDomainEntity(skill);
      const result = await this.db
        .insert(skills)
        .values(skillData)
        .returning();

      return this.toDomainEntity(result[0]);
    } catch (error) {
      winston.error('Error creating skill', { error, skillData: skill });
      throw error;
    }
  }

  async findById(id: string): Promise<Skill | null> {
    try {
      const result = await this.db
        .select()
        .from(skills)
        .where(eq(skills.id, id))
        .limit(1);

      if (result.length === 0) return null;

      return this.toDomainEntity(result[0]);
    } catch (error) {
      winston.error('Error finding skill by ID', { error, skillId: id });
      return null;
    }
  }

  async findAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Skill[]> {
    try {
      let query = this.db.select().from(skills);

      if (filters?.category) {
        query = query.where(eq(skills.category, filters.category));
      }

      if (filters?.search) {
        query = query.where(
          or(
            ilike(skills.name, `%${filters.search}%`),
            ilike(skills.description, `%${filters.search}%`)
          )
        );
      }

      const results = await query.orderBy(skills.name);

      return results.map(skill => this.toDomainEntity(skill));
    } catch (error) {
      winston.error('Error finding skills', { error, filters });
      return [];
    }
  }

  async update(skill: Skill): Promise<Skill> {
    try {
      const updateData = this.fromDomainEntity(skill);
      const result = await this.db
        .update(skills)
        .set({ 
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(skills.id, skill.id))
        .returning();

      if (result.length === 0) {
        throw new Error(`Skill with ID ${skill.id} not found`);
      }

      return this.toDomainEntity(result[0]);
    } catch (error) {
      winston.error('Error updating skill', { error, skillId: skill.id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db
        .delete(skills)
        .where(eq(skills.id, id));
    } catch (error) {
      winston.error('Error deleting skill', { error, skillId: id });
      throw error;
    }
  }

  async getDistinctCategories(): Promise<string[]> {
    try {
      const results = await this.db
        .selectDistinct({ category: skills.category })
        .from(skills)
        .where(isNotNull(skills.category))
        .orderBy(skills.category);

      return results.map(result => result.category);
    } catch (error) {
      winston.error('Error getting distinct skill categories', { error });
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    return this.getDistinctCategories();
  }

  async findByCategory(category: string): Promise<Skill[]> {
    try {
      const results = await this.db
        .select()
        .from(skills)
        .where(eq(skills.category, category))
        .orderBy(skills.name);

      return results.map(skill => this.toDomainEntity(skill));
    } catch (error) {
      winston.error('Error finding skills by category', { error, category });
      return [];
    }
  }

  async findByNamePattern(pattern: string): Promise<Skill[]> {
    try {
      const results = await this.db
        .select()
        .from(skills)
        .where(ilike(skills.name, `%${pattern}%`))
        .orderBy(skills.name);

      return results.map(skill => this.toDomainEntity(skill));
    } catch (error) {
      winston.error('Error finding skills by name pattern', { error, pattern });
      return [];
    }
  }

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    try {
      const results = await this.db
        .select({
          category: skills.category,
          count: sql`count(*)`.mapWith(Number)
        })
        .from(skills)
        .groupBy(skills.category);

      return results;
    } catch (error) {
      winston.error('Error counting skills by category', { error });
      return [];
    }
  }

  async getMostDemandedSkills(limit: number = 10): Promise<{ skill: Skill; demandCount: number }[]> {
    try {
      const results = await this.db
        .select({
          skill: skills,
          demandCount: sql`count(${userSkills.skillId})`.mapWith(Number)
        })
        .from(skills)
        .leftJoin(userSkills, eq(skills.id, userSkills.skillId))
        .groupBy(skills.id, skills.name, skills.description, skills.category, skills.level, skills.minLevelRequired, skills.suggestedCertification, skills.validityMonths, skills.observations, skills.createdAt, skills.updatedAt)
        .orderBy(sql`count(${userSkills.skillId}) desc`)
        .limit(limit);

      return results.map(result => ({
        skill: this.toDomainEntity(result.skill),
        demandCount: result.demandCount
      }));
    } catch (error) {
      winston.error('Error getting most demanded skills', { error });
      return [];
    }
  }

  private toDomainEntity(skillData: any): Skill {
    return {
      id: skillData.id,
      name: skillData.name,
      description: skillData.description,
      category: skillData.category,
      level: skillData.level,
      minLevelRequired: skillData.minLevelRequired,
      suggestedCertification: skillData.suggestedCertification,
      validityMonths: skillData.validityMonths,
      observations: skillData.observations,
      createdAt: skillData.createdAt,
      updatedAt: skillData.updatedAt
    };
  }

  private fromDomainEntity(skill: Skill): any {
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      level: skill.level,
      minLevelRequired: skill.minLevelRequired,
      suggestedCertification: skill.suggestedCertification,
      validityMonths: skill.validityMonths,
      observations: skill.observations,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt
    };
  }
}