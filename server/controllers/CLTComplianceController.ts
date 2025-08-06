import { Request, Response } from 'express';
import { cltComplianceService as complianceService } from '../services/CLTComplianceService';
import { backupService } from '../services/BackupService';
import { db } from '../db';
import { 
  timecardAuditLog, 
  complianceReports, 
  timecardBackups,
  digitalSignatureKeys 
} from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export class CLTComplianceController {

  /**
   * 🔴 GET /api/timecard/compliance/integrity-check
   * Verificação de integridade da cadeia CLT
   */
  async checkIntegrity(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant não identificado' });
      }

      console.log(`[CLT-INTEGRITY] Verificando integridade para tenant: ${tenantId}`);

      const result = await complianceService.verifyIntegrityChain(tenantId);

      res.json({
        isValid: result.isValid,
        errors: result.errors,
        timestamp: new Date().toISOString(),
        tenantId
      });

    } catch (error) {
      console.error('[CLT-INTEGRITY] Erro na verificação:', error);
      res.status(500).json({ 
        message: 'Erro na verificação de integridade',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 GET /api/timecard/compliance/audit-log
   * Trilha de auditoria completa
   */
  async getAuditLog(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant não identificado' });
      }

      const { 
        startDate, 
        endDate, 
        userId, 
        action, 
        page = 1, 
        limit = 50 
      } = req.query;

      console.log(`[CLT-AUDIT-LOG] Buscando logs: tenant=${tenantId}, page=${page}`);

      let whereConditions = [eq(timecardAuditLog.tenantId, tenantId)];

      // Filtros opcionais
      if (startDate) {
        whereConditions.push(gte(timecardAuditLog.performedAt, new Date(startDate as string)));
      }
      if (endDate) {
        whereConditions.push(lte(timecardAuditLog.performedAt, new Date(endDate as string)));
      }
      if (userId) {
        whereConditions.push(eq(timecardAuditLog.performedBy, userId as string));
      }
      if (action) {
        whereConditions.push(eq(timecardAuditLog.action, action as string));
      }

      const offset = (Number(page) - 1) * Number(limit);

      const logs = await db
        .select()
        .from(timecardAuditLog)
        .where(and(...whereConditions))
        .orderBy(desc(timecardAuditLog.performedAt))
        .limit(Number(limit))
        .offset(offset);

      // Busca total para paginação
      const totalLogs = await db
        .select({ count: timecardAuditLog.id })
        .from(timecardAuditLog)
        .where(and(...whereConditions));

      res.json({
        logs: logs.map(log => ({
          ...log,
          performedAt: log.performedAt?.toISOString(),
          createdAt: log.createdAt?.toISOString()
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalLogs.length,
          totalPages: Math.ceil(totalLogs.length / Number(limit))
        }
      });

    } catch (error) {
      console.error('[CLT-AUDIT-LOG] Erro na busca:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar logs de auditoria',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 POST /api/timecard/compliance/generate-report
   * Gerar relatório de compliance para fiscalização
   */
  async generateComplianceReport(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const { reportType, periodStart, periodEnd } = req.body;

      if (!reportType || !periodStart || !periodEnd) {
        return res.status(400).json({ 
          message: 'Tipo de relatório, data inicial e final são obrigatórios' 
        });
      }

      console.log(`[CLT-REPORT] Gerando relatório: ${reportType} para ${tenantId}`);

      const result = await complianceService.generateComplianceReport(
        tenantId,
        reportType,
        new Date(periodStart),
        new Date(periodEnd),
        userId
      );

      if (result.success) {
        res.json({
          reportId: result.reportId,
          message: 'Relatório de compliance gerado com sucesso',
          downloadUrl: `/api/timecard/compliance/reports/${result.reportId}`
        });
      } else {
        res.status(500).json({
          message: 'Erro ao gerar relatório de compliance',
          error: result.error
        });
      }

    } catch (error) {
      console.error('[CLT-REPORT] Erro na geração:', error);
      res.status(500).json({ 
        message: 'Erro ao gerar relatório de compliance',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 GET /api/timecard/compliance/reports
   * Listar relatórios de compliance
   */
  async listComplianceReports(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant não identificado' });
      }

      const { reportType, year } = req.query;

      console.log(`[CLT-REPORTS] Listando relatórios para tenant: ${tenantId}`);

      let whereConditions = [eq(complianceReports.tenantId, tenantId)];

      if (reportType) {
        whereConditions.push(eq(complianceReports.reportType, reportType as string));
      }

      if (year) {
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${year}-12-31`);
        whereConditions.push(
          gte(complianceReports.periodStart, startOfYear),
          lte(complianceReports.periodEnd, endOfYear)
        );
      }

      const reports = await db
        .select({
          id: complianceReports.id,
          reportType: complianceReports.reportType,
          periodStart: complianceReports.periodStart,
          periodEnd: complianceReports.periodEnd,
          totalRecords: complianceReports.totalRecords,
          totalEmployees: complianceReports.totalEmployees,
          totalHours: complianceReports.totalHours,
          isSubmittedToAuthorities: complianceReports.isSubmittedToAuthorities,
          submissionDate: complianceReports.submissionDate,
          submissionProtocol: complianceReports.submissionProtocol,
          createdAt: complianceReports.createdAt
        })
        .from(complianceReports)
        .where(and(...whereConditions))
        .orderBy(desc(complianceReports.createdAt));

      res.json({
        reports: reports.map(report => ({
          ...report,
          periodStart: report.periodStart ? new Date(report.periodStart).toISOString() : null,
          periodEnd: report.periodEnd ? new Date(report.periodEnd).toISOString() : null,
          submissionDate: report.submissionDate ? report.submissionDate.toISOString() : null,
          createdAt: report.createdAt ? report.createdAt.toISOString() : null
        }))
      });

    } catch (error) {
      console.error('[CLT-REPORTS] Erro na listagem:', error);
      res.status(500).json({ 
        message: 'Erro ao listar relatórios',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 RECONSTITUIÇÃO EMERGENCIAL DA CADEIA
   */
  async rebuildIntegrityChain(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as any).user;

      console.log(`[CLT-CONTROLLER] Iniciando reconstituição para tenant: ${tenantId}`);

      const result = await complianceService.rebuildIntegrityChain(tenantId);

      if (result.errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Reconstituição completada com problemas',
          data: result
        });
        return;
      }

      res.json({
        success: true,
        message: `Cadeia de integridade reconstituída: ${result.fixed} registros corrigidos`,
        data: result
      });

    } catch (error) {
      console.error('[CLT-CONTROLLER] Erro na reconstituição:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao reconstituir cadeia',
        error: error.message
      });
    }
  }

  /**
   * 🔴 GET /api/timecard/compliance/reports/:reportId
   * Download de relatório específico
   */
  async downloadComplianceReport(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { reportId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant não identificado' });
      }

      console.log(`[CLT-DOWNLOAD] Download do relatório: ${reportId}`);

      const [report] = await db
        .select()
        .from(complianceReports)
        .where(
          and(
            eq(complianceReports.id, reportId),
            eq(complianceReports.tenantId, tenantId)
          )
        );

      if (!report) {
        return res.status(404).json({ message: 'Relatório não encontrado' });
      }

      // Define headers para download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${reportId}.json"`);

      res.json({
        metadata: {
          id: report.id,
          reportType: report.reportType,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          totalRecords: report.totalRecords,
          totalEmployees: report.totalEmployees,
          totalHours: report.totalHours,
          reportHash: report.reportHash,
          digitalSignature: report.digitalSignature,
          generatedAt: report.createdAt
        },
        content: report.reportContent
      });

    } catch (error) {
      console.error('[CLT-DOWNLOAD] Erro no download:', error);
      res.status(500).json({ 
        message: 'Erro ao fazer download do relatório',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 GET /api/timecard/compliance/backups
   * Status dos backups
   */
  async getBackupStatus(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant não identificado' });
      }

      console.log(`[CLT-BACKUP-STATUS] Status dos backups para tenant: ${tenantId}`);

      // Últimos 30 dias de backup
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const backups = await db
        .select({
          backupDate: timecardBackups.backupDate,
          recordCount: timecardBackups.recordCount,
          backupSize: timecardBackups.backupSize,
          isVerified: timecardBackups.isVerified,
          verificationDate: timecardBackups.verificationDate,
          compressionType: timecardBackups.compressionType,
          createdAt: timecardBackups.createdAt
        })
        .from(timecardBackups)
        .where(
          and(
            eq(timecardBackups.tenantId, tenantId),
            gte(timecardBackups.backupDate, thirtyDaysAgo)
          )
        )
        .orderBy(desc(timecardBackups.backupDate));

      res.json({
        backups: backups.map(backup => ({
          ...backup,
          backupDate: backup.backupDate?.toISOString(),
          verificationDate: backup.verificationDate?.toISOString(),
          createdAt: backup.createdAt?.toISOString(),
          backupSize: Number(backup.backupSize)
        })),
        summary: {
          totalBackups: backups.length,
          verifiedBackups: backups.filter(b => b.isVerified).length,
          totalSize: backups.reduce((sum, b) => sum + Number(b.backupSize), 0)
        }
      });

    } catch (error) {
      console.error('[CLT-BACKUP-STATUS] Erro na consulta:', error);
      res.status(500).json({ 
        message: 'Erro ao consultar status dos backups',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 POST /api/timecard/compliance/verify-backup
   * Verificar integridade de backup específico
   */
  async verifyBackup(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { backupDate } = req.body;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant não identificado' });
      }

      if (!backupDate) {
        return res.status(400).json({ message: 'Data do backup é obrigatória' });
      }

      console.log(`[CLT-VERIFY-BACKUP] Verificando backup: ${tenantId} - ${backupDate}`);

      const isValid = await backupService.verifyBackup(
        tenantId, 
        new Date(backupDate)
      );

      res.json({
        isValid,
        backupDate,
        verifiedAt: new Date().toISOString(),
        message: isValid ? 'Backup íntegro' : 'Backup comprometido'
      });

    } catch (error) {
      console.error('[CLT-VERIFY-BACKUP] Erro na verificação:', error);
      res.status(500).json({ 
        message: 'Erro ao verificar backup',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 GET /api/timecard/compliance/keys
   * Status das chaves de assinatura digital
   */
  async getDigitalKeys(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant não identificado' });
      }

      console.log(`[CLT-KEYS] Consultando chaves para tenant: ${tenantId}`);

      const keys = await db
        .select({
          id: digitalSignatureKeys.id,
          keyName: digitalSignatureKeys.keyName,
          keyAlgorithm: digitalSignatureKeys.keyAlgorithm,
          isActive: digitalSignatureKeys.isActive,
          expiresAt: digitalSignatureKeys.expiresAt,
          createdAt: digitalSignatureKeys.createdAt,
          revokedAt: digitalSignatureKeys.revocationReason
        })
        .from(digitalSignatureKeys)
        .where(eq(digitalSignatureKeys.tenantId, tenantId))
        .orderBy(desc(digitalSignatureKeys.createdAt));

      res.json({
        keys: keys.map(key => ({
          ...key,
          expiresAt: key.expiresAt?.toISOString(),
          createdAt: key.createdAt?.toISOString(),
          revokedAt: key.revokedAt?.toISOString()
        })),
        summary: {
          totalKeys: keys.length,
          activeKeys: keys.filter(k => k.isActive && (!k.expiresAt || new Date() < k.expiresAt)).length,
          expiredKeys: keys.filter(k => k.expiresAt && new Date() > k.expiresAt).length,
          revokedKeys: keys.filter(k => k.revokedAt).length
        }
      });

    } catch (error) {
      console.error('[CLT-KEYS] Erro na consulta:', error);
      res.status(500).json({ 
        message: 'Erro ao consultar chaves digitais',
        error: error.message 
      });
    }
  }

  /**
   * 🔴 POST /api/timecard/compliance/rebuild-integrity
   * Reconstitui a cadeia de integridade CLT
   */
  async rebuildIntegrityChain(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ error: 'TenantId obrigatório' });
        return;
      }

      console.log(`[CLT-REBUILD] Iniciando reconstituição para tenant: ${tenantId}`);
      
      const result = await complianceService.rebuildIntegrityChain(tenantId);
      
      res.status(200).json({
        success: true,
        message: `Cadeia de integridade reconstituída: ${result.fixed} registros corrigidos`,
        fixed: result.fixed,
        errors: result.errors
      });

    } catch (error) {
      console.error('[CLT-REBUILD] Erro na reconstituição:', error);
      res.status(500).json({ 
        error: 'Erro interno ao reconstituir cadeia de integridade',
        details: (error as Error).message 
      });
    }
  }
}

export const cltComplianceController = new CLTComplianceController();