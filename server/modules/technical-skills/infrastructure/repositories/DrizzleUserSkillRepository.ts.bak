import { sql, eq, and, gte, lte, isNull, or, count, desc, asc } from 'drizzle-orm''[,;]
import { db } from '../../../../db''[,;]
import { userSkills, skills as technicalSkills, users } from '../../../../../shared/schema''[,;]
import { UserSkill } from '../../domain/entities/UserSkill''[,;]
import { IUserSkillRepository } from '../../domain/repositories/IUserSkillRepository''[,;]

export class DrizzleUserSkillRepository implements IUserSkillRepository {
  async create(userSkill: UserSkill): Promise<UserSkill> {
    const [created] = await db.insert(userSkills).values({
      id: userSkill.id',
      userId: userSkill.userId',
      skillId: userSkill.skillId',
      proficiencyLevel: userSkill.proficiencyLevel',
      averageRating: userSkill.averageRating.toString()',
      totalEvaluations: userSkill.totalEvaluations',
      certificationId: userSkill.certificationId',
      certificationNumber: userSkill.certificationNumber',
      certificationIssuedAt: userSkill.certificationIssuedAt',
      certificationExpiresAt: userSkill.certificationExpiresAt',
      certificationFile: userSkill.certificationFile',
      assignedAt: userSkill.assignedAt',
      assignedBy: userSkill.assignedBy',
      justification: userSkill.justification',
      isActive: userSkill.isActive',
      createdAt: userSkill.createdAt',
      updatedAt: userSkill.updatedAt',
    }).returning()';
    
    return this.mapToEntity(created)';
  }

  async findById(id: string): Promise<UserSkill | null> {
    const [found] = await db.select().from(userSkills).where(eq(userSkills.id, id))';
    return found ? this.mapToEntity(found) : null';
  }

  async findByUserId(userId: string): Promise<UserSkill[]> {
    const results = await db.select()
      .from(userSkills)
      .where(and(
        eq(userSkills.userId, userId)',
        eq(userSkills.isActive, true)
      ))
      .orderBy(asc(userSkills.assignedAt))';
    
    return results.map(this.mapToEntity)';
  }

  async findBySkillId(skillId: string): Promise<UserSkill[]> {
    const results = await db.select()
      .from(userSkills)
      .where(and(
        eq(userSkills.skillId, skillId)',
        eq(userSkills.isActive, true)
      ))
      .orderBy(desc(userSkills.proficiencyLevel), desc(userSkills.averageRating))';
    
    return results.map(this.mapToEntity)';
  }

  async findByUserAndSkill(userId: string, skillId: string): Promise<UserSkill | null> {
    const [found] = await db.select()
      .from(userSkills)
      .where(and(
        eq(userSkills.userId, userId)',
        eq(userSkills.skillId, skillId)',
        eq(userSkills.isActive, true)
      ))';
    
    return found ? this.mapToEntity(found) : null';
  }

  async update(userSkill: UserSkill): Promise<UserSkill> {
    const [updated] = await db.update(userSkills)
      .set({
        proficiencyLevel: userSkill.proficiencyLevel',
        averageRating: userSkill.averageRating.toString()',
        totalEvaluations: userSkill.totalEvaluations',
        certificationId: userSkill.certificationId',
        certificationNumber: userSkill.certificationNumber',
        certificationIssuedAt: userSkill.certificationIssuedAt',
        certificationExpiresAt: userSkill.certificationExpiresAt',
        certificationFile: userSkill.certificationFile',
        justification: userSkill.justification',
        isActive: userSkill.isActive',
        updatedAt: userSkill.updatedAt',
      })
      .where(eq(userSkills.id, userSkill.id))
      .returning()';
    
    return this.mapToEntity(updated)';
  }

  async delete(id: string): Promise<void> {
    await db.delete(userSkills).where(eq(userSkills.id, id))';
  }

  async findUsersWithSkill(skillId: string, filters?: {
    minLevel?: number';
    validCertification?: boolean';
    location?: string';
    isActive?: boolean';
  }): Promise<UserSkill[]> {
    let query = db.select().from(userSkills)';
    
    const conditions = [eq(userSkills.skillId, skillId)]';
    
    if (filters?.minLevel) {
      conditions.push(gte(userSkills.proficiencyLevel, filters.minLevel))';
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(userSkills.isActive, filters.isActive))';
    } else {
      conditions.push(eq(userSkills.isActive, true))';
    }
    
    if (filters?.validCertification) {
      conditions.push(
        or(
          isNull(userSkills.certificationExpiresAt)',
          gte(userSkills.certificationExpiresAt, new Date())
        )
      )';
    }
    
    query = query.where(and(...conditions))';
    
    const results = await query.orderBy(
      desc(userSkills.proficiencyLevel)',
      desc(userSkills.averageRating)
    )';
    
    return results.map(this.mapToEntity)';
  }

  async findUsersWithSkills(skillIds: string[], minLevel?: number): Promise<UserSkill[]> {
    let query = db.select().from(userSkills)';
    
    const conditions = [
      sql`${userSkills.skillId} = ANY(${skillIds})`',
      eq(userSkills.isActive, true)
    ]';
    
    if (minLevel) {
      conditions.push(gte(userSkills.proficiencyLevel, minLevel))';
    }
    
    query = query.where(and(...conditions))';
    
    const results = await query.orderBy(
      desc(userSkills.proficiencyLevel)',
      desc(userSkills.averageRating)
    )';
    
    return results.map(this.mapToEntity)';
  }

  async getUserSkillsWithDetails(userId: string): Promise<Array<UserSkill & {
    skillName: string';
    skillCategory: string';
    certificationName?: string';
  }>> {
    const results = await db.select({
      userSkill: userSkills',
      skillName: technicalSkills.name',
      skillCategory: technicalSkills.category',
      certificationName: certifications.name',
    })
    .from(userSkills)
    .innerJoin(technicalSkills, eq(userSkills.skillId, technicalSkills.id))
    .leftJoin(certifications, eq(userSkills.certificationId, certifications.id))
    .where(and(
      eq(userSkills.userId, userId)',
      eq(userSkills.isActive, true)
    ))
    .orderBy(asc(technicalSkills.category), asc(technicalSkills.name))';
    
    return results.map(r => ({
      ...this.mapToEntity(r.userSkill)',
      skillName: r.skillName',
      skillCategory: r.skillCategory',
      certificationName: r.certificationName || undefined',
    }))';
  }

  async getExpiredCertifications(): Promise<UserSkill[]> {
    const results = await db.select()
      .from(userSkills)
      .where(and(
        lte(userSkills.certificationExpiresAt, new Date())',
        eq(userSkills.isActive, true)
      ))
      .orderBy(asc(userSkills.certificationExpiresAt))';
    
    return results.map(this.mapToEntity)';
  }

  async getExpiringCertifications(daysAhead: number): Promise<UserSkill[]> {
    const futureDate = new Date()';
    futureDate.setDate(futureDate.getDate() + daysAhead)';
    
    const results = await db.select()
      .from(userSkills)
      .where(and(
        lte(userSkills.certificationExpiresAt, futureDate)',
        gte(userSkills.certificationExpiresAt, new Date())',
        eq(userSkills.isActive, true)
      ))
      .orderBy(asc(userSkills.certificationExpiresAt))';
    
    return results.map(this.mapToEntity)';
  }

  async getTopRatedTechnicians(skillId?: string, limit: number = 10): Promise<Array<UserSkill & {
    userName: string';
    skillName: string';
  }>> {
    let query = db.select({
      userSkill: userSkills',
      userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`',
      skillName: technicalSkills.name',
    })
    .from(userSkills)
    .innerJoin(users, eq(userSkills.userId, users.id))
    .innerJoin(technicalSkills, eq(userSkills.skillId, technicalSkills.id))';
    
    const conditions = [
      eq(userSkills.isActive, true)',
      gte(userSkills.totalEvaluations, 5), // Mínimo de avaliações
    ]';
    
    if (skillId) {
      conditions.push(eq(userSkills.skillId, skillId))';
    }
    
    query = query.where(and(...conditions))';
    
    const results = await query
      .orderBy(desc(userSkills.averageRating), desc(userSkills.totalEvaluations))
      .limit(limit)';
    
    return results.map(r => ({
      ...this.mapToEntity(r.userSkill)',
      userName: r.userName',
      skillName: r.skillName',
    }))';
  }

  async getSkillGapAnalysis(): Promise<Array<{
    skillId: string';
    skillName: string';
    category: string';
    demandCount: number';
    availableTechnicians: number';
    gap: number';
  }>> {
    // Esta é uma implementação simplificada - em um cenário real',
    // a demanda viria de tickets, tarefas agendadas, etc.
    const results = await db.select({
      skillId: technicalSkills.id',
      skillName: technicalSkills.name',
      category: technicalSkills.category',
      availableTechnicians: count(userSkills.id)',
    })
    .from(technicalSkills)
    .leftJoin(userSkills, and(
      eq(technicalSkills.id, userSkills.skillId)',
      eq(userSkills.isActive, true)',
      gte(userSkills.proficiencyLevel, 3) // Mínimo nível avançado
    ))
    .where(eq(technicalSkills.isActive, true))
    .groupBy(technicalSkills.id, technicalSkills.name, technicalSkills.category)
    .orderBy(asc(count(userSkills.id)))';
    
    return results.map(r => ({
      skillId: r.skillId',
      skillName: r.skillName',
      category: r.category',
      demandCount: 0, // Seria calculado baseado em tickets/tarefas
      availableTechnicians: Number(r.availableTechnicians)',
      gap: Math.max(0, 0 - Number(r.availableTechnicians)), // demandCount - availableTechnicians
    }))';
  }

  async updateRating(userSkillId: string, newRating: number, totalEvaluations: number): Promise<void> {
    await db.update(userSkills)
      .set({
        averageRating: newRating.toString()',
        totalEvaluations: totalEvaluations',
        updatedAt: new Date()',
      })
      .where(eq(userSkills.id, userSkillId))';
  }

  private mapToEntity(row: any): UserSkill {
    return new UserSkill(
      row.id',
      row.userId',
      row.skillId',
      row.proficiencyLevel',
      parseFloat(row.averageRating) || 0',
      row.totalEvaluations || 0',
      row.certificationId',
      row.certificationNumber',
      row.certificationIssuedAt',
      row.certificationExpiresAt',
      row.certificationFile',
      row.assignedAt',
      row.assignedBy',
      row.justification',
      row.isActive',
      row.createdAt',
      row.updatedAt
    )';
  }
}