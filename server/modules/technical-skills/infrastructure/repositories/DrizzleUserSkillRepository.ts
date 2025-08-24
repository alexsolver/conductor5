import { eq, and, gte, desc, count, asc, sql } from 'drizzle-orm';
import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { userSkills, skills as technicalSkills, users, qualityCertifications } from '@shared/schema';
import type { IUserSkillRepository } from '../../domain/repositories/IUserSkillRepository';

export class DrizzleUserSkillRepository implements IUserSkillRepository {
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

  async create(userSkill: {
    userId: string;
    skillId: string;
    level: number;
    tenantId: string;
    notes?: string;
  }) {
    const tenantDb = await this.getTenantDb(userSkill.tenantId);
    const [result] = await tenantDb.insert(userSkills).values({
      id: crypto.randomUUID(),
      userId: userSkill.userId,
      skillId: userSkill.skillId,
      level: userSkill.level,
      tenantId: userSkill.tenantId,
      notes: userSkill.notes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return result;
  }

  async findByTenant(tenantId: string) {
    const tenantDb = await this.getTenantDb(tenantId);
    return await tenantDb.select({
      id: userSkills.id,
      userId: userSkills.userId,
      skillId: userSkills.skillId,
      level: userSkills.level,
      notes: userSkills.notes,
      isActive: userSkills.isActive,
      createdAt: userSkills.createdAt,
      updatedAt: userSkills.updatedAt,
      skillName: technicalSkills.name,
      skillCategory: technicalSkills.category,
      userName: users.name,
    })
    .from(userSkills)
    .innerJoin(technicalSkills, eq(technicalSkills.id, userSkills.skillId))
    .leftJoin(users, eq(users.id, userSkills.userId))
    .where(and(
      eq(userSkills.tenantId, tenantId),
      eq(userSkills.isActive, true)
    ))
    .orderBy(desc(userSkills.createdAt));
  }

  async findByUserId(userId: string) {
    const tenantDb = await this.getTenantDb(tenantId);
    return await tenantDb.select({
      id: userSkills.id,
      userId: userSkills.userId,
      skillId: userSkills.skillId,
      level: userSkills.level,
      notes: userSkills.notes,
      isActive: userSkills.isActive,
      createdAt: userSkills.createdAt,
      updatedAt: userSkills.updatedAt,
      skillName: technicalSkills.name,
      skillCategory: technicalSkills.category,
      skillDescription: technicalSkills.description,
    })
    .from(userSkills)
    .innerJoin(technicalSkills, eq(technicalSkills.id, userSkills.skillId))
    .where(and(
      eq(userSkills.userId, userId),
      eq(userSkills.isActive, true)
    ))
    .orderBy(asc(technicalSkills.category), asc(technicalSkills.name));
  }

  async update(id: string, data: {
    level?: number;
    notes?: string;
  }) {
    const tenantDb = await this.getTenantDb(data.tenantId || '');
    const [result] = await tenantDb.update(userSkills)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userSkills.id, id))
      .returning();

    return result;
  }

  async delete(id: string) {
    const tenantDb = await this.getTenantDb(tenantId || '');
    await tenantDb.update(userSkills)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(userSkills.id, id));
  }

  async findById(id: string) {
    const tenantDb = await this.getTenantDb(tenantId || '');
    const [result] = await tenantDb.select()
      .from(userSkills)
      .where(eq(userSkills.id, id))
      .limit(1);

    return result || null;
  }

  async getExpiredCertifications(tenantId: string) {
    const tenantDb = await this.getTenantDb(tenantId);
    return await tenantDb.select({
      id: qualityCertifications.id,
      itemId: qualityCertifications.itemId,
      certificationName: qualityCertifications.certificationName,
      expirationDate: qualityCertifications.expirationDate,
      status: qualityCertifications.status,
    })
    .from(qualityCertifications)
    .where(and(
      eq(qualityCertifications.tenantId, tenantId),
      sql`${qualityCertifications.expirationDate} < CURRENT_DATE`
    ))
    .orderBy(asc(qualityCertifications.expirationDate));
  }

  async getExpiringCertifications(tenantId: string, days: number = 30) {
    const tenantDb = await this.getTenantDb(tenantId);
    return await tenantDb.select({
      id: qualityCertifications.id,
      itemId: qualityCertifications.itemId,
      certificationName: qualityCertifications.certificationName,
      expirationDate: qualityCertifications.expirationDate,
      status: qualityCertifications.status,
    })
    .from(qualityCertifications)
    .where(and(
      eq(qualityCertifications.tenantId, tenantId),
      sql`${qualityCertifications.expirationDate} BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'`
    ))
    .orderBy(asc(qualityCertifications.expirationDate));
  }

  async getTopRatedTechnicians(tenantId: string, limit: number = 10) {
    const tenantDb = await this.getTenantDb(tenantId);
    return await tenantDb.select({
      userId: userSkills.userId,
      userName: users.name,
      averageLevel: sql<number>`AVG(${userSkills.level})`,
      skillCount: count(userSkills.id),
    })
    .from(userSkills)
    .leftJoin(users, eq(users.id, userSkills.userId))
    .where(and(
      eq(userSkills.tenantId, tenantId),
      eq(userSkills.isActive, true),
      gte(userSkills.level, 3)
    ))
    .groupBy(userSkills.userId, users.name)
    .orderBy(sql`AVG(${userSkills.level}) DESC`)
    .limit(limit);
  }

  async getSkillGapAnalysis(tenantId: string) {
    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select({
      skillId: technicalSkills.id,
      skillName: technicalSkills.name,
      category: technicalSkills.category,
      availableTechnicians: count(userSkills.id),
    })
    .from(technicalSkills)
    .leftJoin(userSkills, and(
      eq(technicalSkills.id, userSkills.skillId),
      eq(userSkills.isActive, true),
      gte(userSkills.level, 3)
    ))
    .where(and(
      eq(technicalSkills.tenantId, tenantId),
      eq(technicalSkills.isActive, true)
    ))
    .groupBy(technicalSkills.id, technicalSkills.name, technicalSkills.category)
    .orderBy(asc(count(userSkills.id)));

    return results.map(r => ({
      skillId: r.skillId,
      skillName: r.skillName,
      category: r.category || 'General',
      demandCount: 0, // Seria calculado baseado em tickets/tarefas
      availableTechnicians: Number(r.availableTechnicians),
      gap: Math.max(0, 0 - Number(r.availableTechnicians)),
    }));
  }

  async findExpiredCertifications(tenantId: string): Promise<Array<{
    userId: string;
    userName: string;
    skillName: string;
    skillId: string;
    expiresAt: Date;
    daysSinceExpiry: number;
  }>> {
    try {
      // Por enquanto retorna array vazio até implementar a lógica completa
      return [];
    } catch (error) {
      console.error('Error in findExpiredCertifications:', error);
      return [];
    }
  }

  async findExpiringCertifications(tenantId: string): Promise<Array<{
    userId: string;
    userName: string;
    skillName: string;
    skillId: string;
    expiresAt: Date;
    daysUntilExpiry: number;
  }>> {
    try {
      // Por enquanto retorna array vazio até implementar a lógica completa
      return [];
    } catch (error) {
      console.error('Error in findExpiringCertifications:', error);
      return [];
    }
  }

  async findTechniciansForTask(requiredSkills: string[], minLevel: number = 3, tenantId: string) {
    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select({
      userId: userSkills.userId,
      userName: users.name,
      skillId: userSkills.skillId,
      skillName: technicalSkills.name,
      level: userSkills.level,
    })
    .from(userSkills)
    .innerJoin(technicalSkills, eq(technicalSkills.id, userSkills.skillId))
    .leftJoin(users, eq(users.id, userSkills.userId))
    .where(and(
      eq(userSkills.tenantId, tenantId),
      sql`${userSkills.skillId} = ANY(${requiredSkills})`,
      gte(userSkills.level, minLevel),
      eq(userSkills.isActive, true)
    ));

    // Agrupar por usuário
    const userSkillsMap = new Map<string, any>();
    results.forEach(r => {
      if (!userSkillsMap.has(r.userId)) {
        userSkillsMap.set(r.userId, {
          userId: r.userId,
          userName: r.userName || 'Unknown',
          matchingSkills: [],
          matchScore: 0,
        });
      }

      const user = userSkillsMap.get(r.userId)!;
      user.matchingSkills.push({
        skillId: r.skillId,
        skillName: r.skillName,
        level: r.level,
      });
      user.matchScore += r.level;
    });

    return Array.from(userSkillsMap.values())
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  async evaluateUserSkill(userSkillId: string, evaluation: {
    evaluatorId: string;
    rating: number;
    feedback?: string;
  }) {
    // Esta funcionalidade requer uma tabela de avaliações separada
    // Por enquanto, apenas atualizamos o nível da habilidade
    return await this.update(userSkillId, {
      level: evaluation.rating,
      notes: evaluation.feedback,
    });
  }
}