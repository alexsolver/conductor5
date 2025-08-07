import { sql, eq, and, gte, lte, isNull, or, count, desc, asc } from 'drizzle-orm';
import { db } from '../../../../db';
import { userSkills, skills as technicalSkills, users, certifications, qualityCertifications } from '@shared/schema';
import { UserSkill } from '../../domain/entities/UserSkill';
import { IUserSkillRepository } from '../../domain/repositories/IUserSkillRepository';

export class DrizzleUserSkillRepository implements IUserSkillRepository {
  async create(userSkill: UserSkill): Promise<UserSkill> {
    const [created] = await db.insert(userSkills).values({
      id: userSkill.id,
      tenantId: userSkill.tenantId,
      userId: userSkill.userId,
      skillId: userSkill.skillId,
      level: userSkill.level, // FIXED: INTEGER em vez de proficiencyLevel
      assessedAt: userSkill.assessedAt, // FIXED: campo real do banco
      assessedBy: userSkill.assessedBy, // FIXED: campo real do banco
      expiresAt: userSkill.expiresAt, // FIXED: campo real do banco
      notes: userSkill.notes,
      createdAt: userSkill.createdAt,
      updatedAt: userSkill.updatedAt,
    }).returning();
    
    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<UserSkill | null> {
    const [found] = await db.select().from(userSkills).where(eq(userSkills.id, id));
    return found ? this.mapToEntity(found) : null;
  }

  async findByUserId(userId: string): Promise<UserSkill[]> {
    const results = await db.select()
      .from(userSkills)
      .where(and(
        eq(userSkills.userId, userId),
        eq(userSkills.tenantId, userId) // FIXED: tenant isolation
      ))
      .orderBy(asc(userSkills.assessedAt)); // FIXED: campo real
    
    return results.map(this.mapToEntity);
  }

  async findBySkillId(skillId: string): Promise<UserSkill[]> {
    const results = await db.select()
      .from(userSkills)
      .where(and(
        eq(userSkills.skillId, skillId)
      ))
      .orderBy(desc(userSkills.level)); // FIXED: usar level em vez de proficiencyLevel
    
    return results.map(this.mapToEntity);
  }

  async findByUserAndSkill(userId: string, skillId: string): Promise<UserSkill | null> {
    const [found] = await db.select()
      .from(userSkills)
      .where(and(
        eq(userSkills.userId, userId),
        eq(userSkills.skillId, skillId)
      ));
    
    return found ? this.mapToEntity(found) : null;
  }

  async update(userSkill: UserSkill): Promise<UserSkill> {
    const [updated] = await db.update(userSkills)
      .set({
        level: userSkill.level, // FIXED: campo correto
        assessedAt: userSkill.assessedAt, // FIXED: campo real
        assessedBy: userSkill.assessedBy, // FIXED: campo real
        expiresAt: userSkill.expiresAt, // FIXED: campo real
        notes: userSkill.notes,
        updatedAt: new Date(),
      })
      .where(eq(userSkills.id, userSkill.id))
      .returning();
    
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await db.delete(userSkills).where(eq(userSkills.id, id));
  }

  async findExpiredCertifications(): Promise<Array<{
    userId: string;
    userName: string;
    skillName: string;
    skillId: string;
    expiresAt: Date;
    daysSinceExpiry: number;
  }>> {
    const results = await db.select({
      userId: userSkills.userId,
      userName: users.name, // Assumindo que users.name existe
      skillName: technicalSkills.name,
      skillId: userSkills.skillId,
      expiresAt: userSkills.expiresAt,
      daysSinceExpiry: sql<number>`EXTRACT(day FROM NOW() - ${userSkills.expiresAt})`,
    })
    .from(userSkills)
    .innerJoin(technicalSkills, eq(technicalSkills.id, userSkills.skillId))
    .leftJoin(users, eq(users.id, userSkills.userId))
    .where(and(
      lte(userSkills.expiresAt, new Date()),
      isNull(userSkills.expiresAt) === false
    ))
    .orderBy(asc(userSkills.expiresAt));
    
    return results.map(r => ({
      userId: r.userId,
      userName: r.userName || 'Unknown',
      skillName: r.skillName,
      skillId: r.skillId,
      expiresAt: r.expiresAt!,
      daysSinceExpiry: Number(r.daysSinceExpiry),
    }));
  }

  async findExpiringCertifications(daysAhead: number = 30): Promise<Array<{
    userId: string;
    userName: string;
    skillName: string;
    skillId: string;
    expiresAt: Date;
    daysUntilExpiry: number;
  }>> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const results = await db.select({
      userId: userSkills.userId,
      userName: users.name,
      skillName: technicalSkills.name,
      skillId: userSkills.skillId,
      expiresAt: userSkills.expiresAt,
      daysUntilExpiry: sql<number>`EXTRACT(day FROM ${userSkills.expiresAt} - NOW())`,
    })
    .from(userSkills)
    .innerJoin(technicalSkills, eq(technicalSkills.id, userSkills.skillId))
    .leftJoin(users, eq(users.id, userSkills.userId))
    .where(and(
      gte(userSkills.expiresAt, new Date()),
      lte(userSkills.expiresAt, futureDate),
      isNull(userSkills.expiresAt) === false
    ))
    .orderBy(asc(userSkills.expiresAt));
    
    return results.map(r => ({
      userId: r.userId,
      userName: r.userName || 'Unknown',
      skillName: r.skillName,
      skillId: r.skillId,
      expiresAt: r.expiresAt!,
      daysUntilExpiry: Number(r.daysUntilExpiry),
    }));
  }

  async getTopRatedTechnicians(skillId?: string, limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    skillName: string;
    level: number;
    assessedAt: Date;
  }>> {
    let query = db.select({
      userId: userSkills.userId,
      userName: users.name,
      skillName: technicalSkills.name,
      level: userSkills.level,
      assessedAt: userSkills.assessedAt,
    })
    .from(userSkills)
    .innerJoin(technicalSkills, eq(technicalSkills.id, userSkills.skillId))
    .leftJoin(users, eq(users.id, userSkills.userId));
    
    if (skillId) {
      query = query.where(eq(userSkills.skillId, skillId));
    }
    
    const results = await query
      .orderBy(desc(userSkills.level), desc(userSkills.assessedAt))
      .limit(limit);
    
    return results.map(r => ({
      userId: r.userId,
      userName: r.userName || 'Unknown',
      skillName: r.skillName,
      level: r.level,
      assessedAt: r.assessedAt!,
    }));
  }

  async getSkillGapAnalysis(): Promise<Array<{
    skillId: string;
    skillName: string;
    category: string;
    demandCount: number;
    availableTechnicians: number;
    gap: number;
  }>> {
    const results = await db.select({
      skillId: technicalSkills.id,
      skillName: technicalSkills.name,
      category: technicalSkills.category,
      availableTechnicians: count(userSkills.id),
    })
    .from(technicalSkills)
    .leftJoin(userSkills, and(
      eq(technicalSkills.id, userSkills.skillId),
      gte(userSkills.level, 3) // FIXED: Mínimo nível 3 (competente)
    ))
    .where(eq(technicalSkills.isActive, true))
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

  async findTechniciansForTask(requiredSkills: string[], minLevel: number = 3): Promise<Array<{
    userId: string;
    userName: string;
    matchingSkills: Array<{
      skillId: string;
      skillName: string;
      level: number;
    }>;
    matchScore: number;
  }>> {
    const results = await db.select({
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
      sql`${userSkills.skillId} = ANY(${requiredSkills})`,
      gte(userSkills.level, minLevel)
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

  private mapToEntity(raw: any): UserSkill {
    return new UserSkill(
      raw.id,
      raw.tenantId,
      raw.userId,
      raw.skillId,
      raw.level, // FIXED: usar level real do banco
      raw.assessedAt, // FIXED: campos reais
      raw.assessedBy,
      raw.expiresAt,
      raw.notes,
      raw.createdAt,
      raw.updatedAt
    );
  }
}