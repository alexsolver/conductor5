
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db } from '../../db';
import { templateAuditLog, ticketTemplates, users } from '../../../shared/schema-master';

interface AuditLogEntry {
  templateId: string;
  action: string;
  userId: string;
  tenantId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditQuery {
  templateId?: string;
  action?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export class TemplateAuditService {
  async logAction(entry: AuditLogEntry) {
    return await db.insert(templateAuditLog).values({
      templateId: entry.templateId,
      action: entry.action,
      userId: entry.userId,
      tenantId: entry.tenantId,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: new Date()
    });
  }

  async getAuditTrail(tenantId: string, query: AuditQuery) {
    let dbQuery = db
      .select({
        audit: templateAuditLog,
        template: ticketTemplates,
        user: users
      })
      .from(templateAuditLog)
      .leftJoin(ticketTemplates, eq(templateAuditLog.templateId, ticketTemplates.id))
      .leftJoin(users, eq(templateAuditLog.userId, users.id))
      .where(eq(templateAuditLog.tenantId, tenantId));

    // Aplicar filtros
    if (query.templateId) {
      dbQuery = dbQuery.where(eq(templateAuditLog.templateId, query.templateId));
    }

    if (query.action) {
      dbQuery = dbQuery.where(eq(templateAuditLog.action, query.action));
    }

    if (query.userId) {
      dbQuery = dbQuery.where(eq(templateAuditLog.userId, query.userId));
    }

    if (query.dateFrom) {
      dbQuery = dbQuery.where(gte(templateAuditLog.timestamp, query.dateFrom));
    }

    if (query.dateTo) {
      dbQuery = dbQuery.where(lte(templateAuditLog.timestamp, query.dateTo));
    }

    const results = await dbQuery
      .orderBy(desc(templateAuditLog.timestamp))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    return results.map(row => ({
      id: row.audit.id,
      templateId: row.audit.templateId,
      templateName: row.template?.name || 'Template Deletado',
      action: row.audit.action,
      userId: row.audit.userId,
      userName: row.user?.fullName || 'Usuário Desconhecido',
      timestamp: row.audit.timestamp,
      details: row.audit.details,
      ipAddress: row.audit.ipAddress,
      userAgent: row.audit.userAgent
    }));
  }

  async getTemplateHistory(tenantId: string, templateId: string) {
    return await this.getAuditTrail(tenantId, { templateId, limit: 100 });
  }

  async logTemplateCreation(templateId: string, userId: string, tenantId: string, templateData: any) {
    await this.logAction({
      templateId,
      action: 'created',
      userId,
      tenantId,
      details: {
        templateData: {
          name: templateData.name,
          categoryId: templateData.categoryId,
          fieldsCount: templateData.fields?.length || 0
        }
      }
    });
  }

  async logTemplateUpdate(templateId: string, userId: string, tenantId: string, changes: any[]) {
    await this.logAction({
      templateId,
      action: 'updated',
      userId,
      tenantId,
      details: {
        changes,
        changesCount: changes.length
      }
    });
  }

  async logTemplatePublish(templateId: string, userId: string, tenantId: string, version: string) {
    await this.logAction({
      templateId,
      action: 'published',
      userId,
      tenantId,
      details: {
        version,
        publishedAt: new Date().toISOString()
      }
    });
  }

  async logTemplateApproval(templateId: string, userId: string, tenantId: string, approved: boolean, notes?: string) {
    await this.logAction({
      templateId,
      action: approved ? 'approved' : 'rejected',
      userId,
      tenantId,
      details: {
        approved,
        approvalNotes: notes,
        approvedAt: new Date().toISOString()
      }
    });
  }

  async logTemplateRollback(templateId: string, userId: string, tenantId: string, fromVersion: string, toVersion: string) {
    await this.logAction({
      templateId,
      action: 'rolled_back',
      userId,
      tenantId,
      details: {
        fromVersion,
        toVersion,
        rolledBackAt: new Date().toISOString()
      }
    });
  }
}
