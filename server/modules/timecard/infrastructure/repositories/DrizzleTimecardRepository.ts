
/**
 * DrizzleTimecardRepository - Clean Architecture Infrastructure Layer
 * Resolves violations: Repository implementation following AGENT_CODING_STANDARDS.md
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, between, desc } from 'drizzle-orm';
import { Timecard } from '../../domain/entities/Timecard';
import { ITimecardRepository } from '../../domain/ports/ITimecardRepository';
import { timecardEntries } from '../../../../../shared/schema';

export class DrizzleTimecardRepository implements ITimecardRepository {
  constructor(
    private readonly db: ReturnType<typeof drizzle>
  ) {}

  async save(timecard: Timecard): Promise<Timecard> {
    try {
      const timecardData = {
        id: timecard.getId(),
        tenant_id: timecard.getTenantId(),
        user_id: timecard.getUserId(),
        date: timecard.getDate(),
        entries: JSON.stringify(timecard.getEntries()),
        status: timecard.getStatus(),
        total_hours: timecard.getTotalHours(),
        total_break_time: timecard.getTotalBreakTime(),
        overtime_hours: timecard.getOvertimeHours(),
        regular_hours: timecard.getRegularHours(),
        approved_by_id: timecard.getApprovedById(),
        approved_at: timecard.getApprovedAt(),
        submitted_at: timecard.getSubmittedAt(),
        notes: timecard.getNotes(),
        created_at: timecard.getCreatedAt(),
        updated_at: timecard.getUpdatedAt()
      };

      await this.db.insert(timecardEntries).values(timecardData);
      return timecard;

    } catch (error) {
      console.error('Error saving timecard:', error);
      throw new Error('Falha ao salvar timecard');
    }
  }

  async findById(id: string): Promise<Timecard | null> {
    try {
      const result = await this.db
        .select()
        .from(timecardEntries)
        .where(eq(timecardEntries.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapToEntity(result[0]);

    } catch (error) {
      console.error('Error finding timecard by id:', error);
      throw new Error('Falha ao buscar timecard');
    }
  }

  async update(timecard: Timecard): Promise<Timecard> {
    try {
      const updateData = {
        entries: JSON.stringify(timecard.getEntries()),
        status: timecard.getStatus(),
        total_hours: timecard.getTotalHours(),
        total_break_time: timecard.getTotalBreakTime(),
        overtime_hours: timecard.getOvertimeHours(),
        regular_hours: timecard.getRegularHours(),
        approved_by_id: timecard.getApprovedById(),
        approved_at: timecard.getApprovedAt(),
        submitted_at: timecard.getSubmittedAt(),
        notes: timecard.getNotes(),
        updated_at: new Date()
      };

      await this.db
        .update(timecardEntries)
        .set(updateData)
        .where(eq(timecardEntries.id, timecard.getId()));

      return timecard;

    } catch (error) {
      console.error('Error updating timecard:', error);
      throw new Error('Falha ao atualizar timecard');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db
        .delete(timecardEntries)
        .where(eq(timecardEntries.id, id));

    } catch (error) {
      console.error('Error deleting timecard:', error);
      throw new Error('Falha ao deletar timecard');
    }
  }

  async findByUserAndDate(userId: string, tenantId: string, date: Date): Promise<Timecard | null> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.db
        .select()
        .from(timecardEntries)
        .where(
          and(
            eq(timecardEntries.user_id, userId),
            eq(timecardEntries.tenant_id, tenantId),
            between(timecardEntries.date, startOfDay, endOfDay)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapToEntity(result[0]);

    } catch (error) {
      console.error('Error finding timecard by user and date:', error);
      throw new Error('Falha ao buscar timecard por usuário e data');
    }
  }

  async findByUserAndDateRange(
    userId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Timecard[]> {
    try {
      const results = await this.db
        .select()
        .from(timecardEntries)
        .where(
          and(
            eq(timecardEntries.user_id, userId),
            eq(timecardEntries.tenant_id, tenantId),
            between(timecardEntries.date, startDate, endDate)
          )
        )
        .orderBy(desc(timecardEntries.date));

      return results.map(result => this.mapToEntity(result));

    } catch (error) {
      console.error('Error finding timecards by user and date range:', error);
      throw new Error('Falha ao buscar timecards por período');
    }
  }

  async findByTenantAndDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Timecard[]> {
    try {
      const results = await this.db
        .select()
        .from(timecardEntries)
        .where(
          and(
            eq(timecardEntries.tenant_id, tenantId),
            between(timecardEntries.date, startDate, endDate)
          )
        )
        .orderBy(desc(timecardEntries.date));

      return results.map(result => this.mapToEntity(result));

    } catch (error) {
      console.error('Error finding timecards by tenant and date range:', error);
      throw new Error('Falha ao buscar timecards do tenant');
    }
  }

  async findOpenTimecardsByUser(userId: string, tenantId: string): Promise<Timecard[]> {
    try {
      const results = await this.db
        .select()
        .from(timecardEntries)
        .where(
          and(
            eq(timecardEntries.user_id, userId),
            eq(timecardEntries.tenant_id, tenantId),
            eq(timecardEntries.status, 'open')
          )
        )
        .orderBy(desc(timecardEntries.date));

      return results.map(result => this.mapToEntity(result));

    } catch (error) {
      console.error('Error finding open timecards:', error);
      throw new Error('Falha ao buscar timecards abertos');
    }
  }

  async findPendingApprovalsByTenant(tenantId: string): Promise<Timecard[]> {
    try {
      const results = await this.db
        .select()
        .from(timecardEntries)
        .where(
          and(
            eq(timecardEntries.tenant_id, tenantId),
            eq(timecardEntries.status, 'submitted')
          )
        )
        .orderBy(desc(timecardEntries.date));

      return results.map(result => this.mapToEntity(result));

    } catch (error) {
      console.error('Error finding pending approvals:', error);
      throw new Error('Falha ao buscar timecards pendentes');
    }
  }

  async getTotalHoursByUserAndPeriod(
    userId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const timecards = await this.findByUserAndDateRange(userId, tenantId, startDate, endDate);
      return timecards.reduce((total, timecard) => total + timecard.getTotalHours(), 0);

    } catch (error) {
      console.error('Error getting total hours:', error);
      throw new Error('Falha ao calcular horas totais');
    }
  }

  async getTimecardStatsByUser(
    userId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    totalDays: number;
    averageHoursPerDay: number;
  }> {
    try {
      const timecards = await this.findByUserAndDateRange(userId, tenantId, startDate, endDate);
      
      const totalHours = timecards.reduce((sum, tc) => sum + tc.getTotalHours(), 0);
      const regularHours = timecards.reduce((sum, tc) => sum + tc.getRegularHours(), 0);
      const overtimeHours = timecards.reduce((sum, tc) => sum + tc.getOvertimeHours(), 0);
      const totalDays = timecards.length;
      const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

      return {
        totalHours,
        regularHours,
        overtimeHours,
        totalDays,
        averageHoursPerDay
      };

    } catch (error) {
      console.error('Error getting timecard stats:', error);
      throw new Error('Falha ao obter estatísticas');
    }
  }

  async bulkSave(timecards: Timecard[]): Promise<Timecard[]> {
    try {
      const timecardData = timecards.map(timecard => ({
        id: timecard.getId(),
        tenant_id: timecard.getTenantId(),
        user_id: timecard.getUserId(),
        date: timecard.getDate(),
        entries: JSON.stringify(timecard.getEntries()),
        status: timecard.getStatus(),
        total_hours: timecard.getTotalHours(),
        total_break_time: timecard.getTotalBreakTime(),
        overtime_hours: timecard.getOvertimeHours(),
        regular_hours: timecard.getRegularHours(),
        approved_by_id: timecard.getApprovedById(),
        approved_at: timecard.getApprovedAt(),
        submitted_at: timecard.getSubmittedAt(),
        notes: timecard.getNotes(),
        created_at: timecard.getCreatedAt(),
        updated_at: timecard.getUpdatedAt()
      }));

      await this.db.insert(timecardEntries).values(timecardData);
      return timecards;

    } catch (error) {
      console.error('Error bulk saving timecards:', error);
      throw new Error('Falha ao salvar timecards em lote');
    }
  }

  async bulkUpdateStatus(
    ids: string[],
    status: 'open' | 'submitted' | 'approved' | 'rejected',
    approvedById?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date()
      };

      if (status === 'approved' && approvedById) {
        updateData.approved_by_id = approvedById;
        updateData.approved_at = new Date();
      }

      for (const id of ids) {
        await this.db
          .update(timecardEntries)
          .set(updateData)
          .where(eq(timecardEntries.id, id));
      }

    } catch (error) {
      console.error('Error bulk updating status:', error);
      throw new Error('Falha ao atualizar status em lote');
    }
  }

  private mapToEntity(data: any): Timecard {
    const entries = typeof data.entries === 'string' 
      ? JSON.parse(data.entries) 
      : data.entries || [];

    return new Timecard(
      data.id,
      data.tenant_id,
      data.user_id,
      data.date,
      entries,
      data.status || 'open',
      data.total_hours || 0,
      data.total_break_time || 0,
      data.overtime_hours || 0,
      data.regular_hours || 0,
      data.approved_by_id,
      data.approved_at,
      data.submitted_at,
      data.notes || '',
      data.created_at,
      data.updated_at
    );
  }
}
