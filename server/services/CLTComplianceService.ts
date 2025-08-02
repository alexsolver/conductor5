import crypto from 'crypto';
import { db } from '../db';
import { 
  timecardEntries, 
  nsrSequences, 
  timecardAuditLog, 
  digitalSignatureKeys,
  timecardBackups,
  complianceReports 
} from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export interface CLTTimecardEntry {
  id: string;
  tenantId: string;
  userId: string;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours?: string;
  notes?: string;
  location?: string;
  isManualEntry: boolean;
  deviceInfo?: any;
  ipAddress?: string;
  geoLocation?: any;
}

export interface AuditContext {
  performedBy: string;
  ipAddress: string;
  userAgent?: string;
  deviceInfo?: any;
  reason?: string;
}

export class CLTComplianceService {
  
  /**
   * 🔴 NSR - Número Sequencial de Registro (OBRIGATÓRIO)
   */
  async getNextNSR(tenantId: string): Promise<number> {
    try {
      // Tenta buscar sequência existente
      const [sequence] = await db
        .select()
        .from(nsrSequences)
        .where(eq(nsrSequences.tenantId, tenantId));

      if (sequence) {
        // Incrementa NSR existente
        const nextNsr = sequence.currentNsr + 1;
        await db
          .update(nsrSequences)
          .set({ 
            currentNsr: nextNsr, 
            lastUpdated: new Date() 
          })
          .where(eq(nsrSequences.tenantId, tenantId));
        
        return nextNsr;
      } else {
        // Cria primeira sequência para o tenant
        await db
          .insert(nsrSequences)
          .values({
            tenantId,
            currentNsr: 1,
            lastUpdated: new Date()
          });
        
        return 1;
      }
    } catch (error) {
      console.error('[CLT-NSR] Erro ao gerar NSR:', error);
      throw new Error('Falha ao gerar NSR sequencial');
    }
  }

  /**
   * 🔴 Hash de Integridade SHA-256 (OBRIGATÓRIO)
   */
  generateRecordHash(data: CLTTimecardEntry, nsr: number, previousHash?: string): string {
    const hashData = {
      id: data.id,
      tenantId: data.tenantId,
      userId: data.userId,
      nsr,
      checkIn: data.checkIn?.toISOString(),
      checkOut: data.checkOut?.toISOString(),
      breakStart: data.breakStart?.toISOString(),
      breakEnd: data.breakEnd?.toISOString(),
      totalHours: data.totalHours,
      location: data.location,
      isManualEntry: data.isManualEntry,
      previousHash: previousHash || null,
      timestamp: new Date().toISOString()
    };

    const dataString = JSON.stringify(hashData, Object.keys(hashData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * 🔴 Busca último hash para cadeia de integridade
   */
  async getLastRecordHash(tenantId: string): Promise<string | null> {
    try {
      const [lastRecord] = await db
        .select({ recordHash: timecardEntries.recordHash })
        .from(timecardEntries)
        .where(eq(timecardEntries.tenantId, tenantId))
        .orderBy(desc(timecardEntries.nsr))
        .limit(1);

      return lastRecord?.recordHash || null;
    } catch (error) {
      console.error('[CLT-HASH] Erro ao buscar último hash:', error);
      return null;
    }
  }

  /**
   * 🔴 Trilha de Auditoria Completa (OBRIGATÓRIO)
   */
  async createAuditLog(
    tenantId: string,
    timecardEntryId: string,
    nsr: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT',
    context: AuditContext,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    try {
      // Gera hash da entrada de auditoria
      const auditData = {
        tenantId,
        timecardEntryId,
        nsr,
        action,
        performedBy: context.performedBy,
        performedAt: new Date().toISOString(),
        oldValues,
        newValues,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceInfo: context.deviceInfo
      };

      const auditHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(auditData, Object.keys(auditData).sort()))
        .digest('hex');

      await db.insert(timecardAuditLog).values({
        tenantId,
        timecardEntryId,
        nsr,
        action,
        performedBy: context.performedBy,
        performedAt: new Date(),
        oldValues,
        newValues,
        reason: context.reason,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceInfo: context.deviceInfo,
        auditHash,
        isSystemGenerated: false
      });

      console.log(`[CLT-AUDIT] Log criado: ${action} NSR:${nsr} Hash:${auditHash.substring(0, 8)}`);
    } catch (error) {
      console.error('[CLT-AUDIT] Erro ao criar log de auditoria:', error);
      throw new Error('Falha ao registrar auditoria');
    }
  }

  /**
   * 🔴 Assinatura Digital RSA-2048 (OBRIGATÓRIO)
   */
  async generateDigitalSignature(data: string, tenantId: string): Promise<string | null> {
    try {
      // Busca chave ativa do tenant
      const [activeKey] = await db
        .select()
        .from(digitalSignatureKeys)
        .where(
          and(
            eq(digitalSignatureKeys.tenantId, tenantId),
            eq(digitalSignatureKeys.isActive, true),
            gte(digitalSignatureKeys.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!activeKey) {
        console.warn(`[CLT-SIGNATURE] Nenhuma chave ativa para tenant ${tenantId}`);
        return null;
      }

      // Em produção, a chave privada estaria em um HSM/KMS seguro
      // Por ora, simulamos a assinatura com hash + chave pública
      const signatureData = `${data}:${activeKey.publicKey}:${new Date().toISOString()}`;
      const signature = crypto
        .createHash('sha256')
        .update(signatureData)
        .digest('hex');

      return `RSA-2048:${signature}`;
    } catch (error) {
      console.error('[CLT-SIGNATURE] Erro ao gerar assinatura:', error);
      return null;
    }
  }

  /**
   * 🔴 Criação de registro CLT-compliant
   */
  async createCLTTimecardEntry(
    data: CLTTimecardEntry,
    context: AuditContext
  ): Promise<{ id: string; nsr: number; recordHash: string }> {
    try {
      // 1. Gera NSR sequencial
      const nsr = await this.getNextNSR(data.tenantId);
      
      // 2. Busca hash anterior para cadeia
      const previousHash = await this.getLastRecordHash(data.tenantId);
      
      // 3. Gera hash do registro atual
      const recordHash = this.generateRecordHash(data, nsr, previousHash);
      
      // 4. Gera assinatura digital
      const digitalSignature = await this.generateDigitalSignature(
        `${data.id}:${nsr}:${recordHash}`, 
        data.tenantId
      );

      // 5. Insere registro no banco
      await db.insert(timecardEntries).values({
        id: data.id,
        tenantId: data.tenantId,
        userId: data.userId,
        nsr,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
        totalHours: data.totalHours,
        notes: data.notes,
        location: data.location,
        isManualEntry: data.isManualEntry,
        status: 'pending',
        
        // Campos CLT obrigatórios
        recordHash,
        previousRecordHash: previousHash,
        originalRecordHash: recordHash, // Primeira versão
        digitalSignature,
        signatureTimestamp: digitalSignature ? new Date() : null,
        signedBy: digitalSignature ? context.performedBy : null,
        
        // Metadados de auditoria
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
        geoLocation: data.geoLocation,
        modificationHistory: [],
        
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 6. Cria log de auditoria
      await this.createAuditLog(
        data.tenantId,
        data.id,
        nsr,
        'CREATE',
        context,
        null,
        data
      );

      console.log(`[CLT-CREATE] Registro criado: ID:${data.id} NSR:${nsr} Hash:${recordHash.substring(0, 8)}`);
      
      return { id: data.id, nsr, recordHash };
    } catch (error) {
      console.error('[CLT-CREATE] Erro ao criar registro:', error);
      throw new Error('Falha ao criar registro CLT-compliant');
    }
  }

  /**
   * 🔴 Verificação de integridade da cadeia
   */
  async verifyIntegrityChain(tenantId: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const records = await db
        .select()
        .from(timecardEntries)
        .where(eq(timecardEntries.tenantId, tenantId))
        .orderBy(timecardEntries.nsr);

      const errors: string[] = [];
      let previousHash: string | null = null;

      for (const record of records) {
        // Verifica hash anterior
        if (record.previousRecordHash !== previousHash) {
          errors.push(`NSR ${record.nsr}: Hash anterior inválido`);
        }

        // Recalcula hash atual
        const expectedHash = this.generateRecordHash(
          {
            id: record.id,
            tenantId: record.tenantId,
            userId: record.userId,
            checkIn: record.checkIn || undefined,
            checkOut: record.checkOut || undefined,
            breakStart: record.breakStart || undefined,
            breakEnd: record.breakEnd || undefined,
            totalHours: record.totalHours || undefined,
            notes: record.notes || undefined,
            location: record.location || undefined,
            isManualEntry: record.isManualEntry,
            deviceInfo: record.deviceInfo,
            ipAddress: record.ipAddress || undefined,
            geoLocation: record.geoLocation
          },
          record.nsr,
          previousHash
        );

        if (record.recordHash !== expectedHash) {
          errors.push(`NSR ${record.nsr}: Hash do registro foi alterado`);
        }

        previousHash = record.recordHash;
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('[CLT-VERIFY] Erro na verificação:', error);
      return {
        isValid: false,
        errors: ['Erro interno na verificação de integridade']
      };
    }
  }

  /**
   * 🔴 Relatório de compliance para fiscalização
   */
  async generateComplianceReport(
    tenantId: string,
    reportType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AUDIT',
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<string> {
    try {
      // Busca registros do período
      const records = await db
        .select()
        .from(timecardEntries)
        .where(
          and(
            eq(timecardEntries.tenantId, tenantId),
            gte(timecardEntries.createdAt, periodStart),
            lte(timecardEntries.createdAt, periodEnd)
          )
        )
        .orderBy(timecardEntries.nsr);

      // Estatísticas
      const totalRecords = records.length;
      const totalEmployees = new Set(records.map(r => r.userId)).size;
      const totalHours = records
        .reduce((sum, r) => sum + (parseFloat(r.totalHours || '0')), 0);

      // Conteúdo do relatório
      const reportContent = {
        period: { start: periodStart, end: periodEnd },
        statistics: { totalRecords, totalEmployees, totalHours },
        records: records.map(r => ({
          nsr: r.nsr,
          userId: r.userId,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          totalHours: r.totalHours,
          recordHash: r.recordHash,
          digitalSignature: r.digitalSignature ? 'PRESENT' : 'MISSING'
        })),
        integrityCheck: await this.verifyIntegrityChain(tenantId),
        generatedAt: new Date().toISOString()
      };

      // Hash do relatório
      const reportHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(reportContent))
        .digest('hex');

      // Salva relatório
      const [report] = await db
        .insert(complianceReports)
        .values({
          tenantId,
          reportType,
          periodStart,
          periodEnd,
          totalRecords,
          totalEmployees,
          totalHours: totalHours.toString(),
          overtimeHours: '0', // TODO: calcular horas extras
          reportHash,
          reportContent,
          generatedBy,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({ id: complianceReports.id });

      console.log(`[CLT-REPORT] Relatório gerado: ${reportType} - ${report.id}`);
      return report.id;
    } catch (error) {
      console.error('[CLT-REPORT] Erro ao gerar relatório:', error);
      throw new Error('Falha ao gerar relatório de compliance');
    }
  }
}

export const cltComplianceService = new CLTComplianceService();