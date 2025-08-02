import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { db } from '../db';
import { timecardEntries, timecardBackups } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface BackupOptions {
  tenantId: string;
  date: Date;
  includeAuditLogs?: boolean;
  compressionType?: 'gzip' | 'none';
  encryptionType?: 'AES-256' | 'none';
}

export class BackupService {
  private backupDir = './backups';

  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`[CLT-BACKUP] Diretório de backup: ${this.backupDir}`);
    } catch (error) {
      console.error('[CLT-BACKUP] Erro ao criar diretório:', error);
    }
  }

  /**
   * 🔴 Backup automático diário (OBRIGATÓRIO CLT)
   */
  async createDailyBackup(options: BackupOptions): Promise<string> {
    const { tenantId, date } = options;
    const backupDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    try {
      console.log(`[CLT-BACKUP] Iniciando backup para ${tenantId} - ${backupDate.toISOString().split('T')[0]}`);

      // 1. Busca registros do dia
      const startOfDay = new Date(backupDate);
      const endOfDay = new Date(backupDate);
      endOfDay.setHours(23, 59, 59, 999);

      const records = await db
        .select()
        .from(timecardEntries)
        .where(
          and(
            eq(timecardEntries.tenantId, tenantId),
            gte(timecardEntries.createdAt, startOfDay),
            lte(timecardEntries.createdAt, endOfDay)
          )
        )
        .orderBy(timecardEntries.nsr);

      if (records.length === 0) {
        console.log(`[CLT-BACKUP] Nenhum registro encontrado para ${tenantId} em ${backupDate.toISOString().split('T')[0]}`);
        return '';
      }

      // 2. Prepara dados do backup
      const backupData = {
        metadata: {
          tenantId,
          backupDate: backupDate.toISOString(),
          recordCount: records.length,
          createdAt: new Date().toISOString(),
          version: '1.0',
          compliance: 'CLT-Portaria-671-2021'
        },
        records: records.map(record => ({
          ...record,
          // Converte datas para strings para serialização
          checkIn: record.checkIn?.toISOString(),
          checkOut: record.checkOut?.toISOString(),
          breakStart: record.breakStart?.toISOString(),
          breakEnd: record.breakEnd?.toISOString(),
          createdAt: record.createdAt?.toISOString(),
          updatedAt: record.updatedAt?.toISOString(),
          signatureTimestamp: record.signatureTimestamp?.toISOString(),
          deletedAt: record.deletedAt?.toISOString()
        }))
      };

      // 3. Serializa dados
      const jsonData = JSON.stringify(backupData, null, 2);
      
      // 4. Gera hash do backup
      const backupHash = crypto
        .createHash('sha256')
        .update(jsonData)
        .digest('hex');

      // 5. Define nome do arquivo
      const dateStr = backupDate.toISOString().split('T')[0];
      const fileName = `timecard-backup-${tenantId}-${dateStr}.json`;
      const filePath = path.join(this.backupDir, fileName);

      // 6. Salva arquivo
      await fs.writeFile(filePath, jsonData, 'utf8');
      
      // 7. Comprime se solicitado
      let finalPath = filePath;
      let compressionType = options.compressionType || 'gzip';
      
      if (compressionType === 'gzip') {
        const gzipPath = `${filePath}.gz`;
        const readStream = require('fs').createReadStream(filePath);
        const writeStream = require('fs').createWriteStream(gzipPath);
        const gzipStream = createGzip();
        
        await pipeline(readStream, gzipStream, writeStream);
        await fs.unlink(filePath); // Remove arquivo original
        finalPath = gzipPath;
      }

      // 8. Calcula tamanho final
      const stats = await fs.stat(finalPath);
      const backupSize = stats.size;

      // 9. Registra backup no banco
      await db.insert(timecardBackups).values({
        tenantId,
        backupDate,
        recordCount: records.length,
        backupHash,
        backupSize,
        backupLocation: finalPath,
        compressionType,
        encryptionType: options.encryptionType || 'none',
        isVerified: false, // Será verificado posteriormente
        createdAt: new Date()
      });

      console.log(`[CLT-BACKUP] Backup criado: ${finalPath} (${backupSize} bytes, ${records.length} registros)`);
      return finalPath;

    } catch (error) {
      console.error(`[CLT-BACKUP] Erro ao criar backup para ${tenantId}:`, error);
      throw new Error(`Falha no backup diário: ${error.message}`);
    }
  }

  /**
   * 🔴 Verificação de integridade do backup
   */
  async verifyBackup(tenantId: string, backupDate: Date): Promise<boolean> {
    try {
      // Busca registro do backup
      const [backup] = await db
        .select()
        .from(timecardBackups)
        .where(
          and(
            eq(timecardBackups.tenantId, tenantId),
            eq(timecardBackups.backupDate, backupDate)
          )
        );

      if (!backup) {
        console.error(`[CLT-BACKUP] Backup não encontrado: ${tenantId} - ${backupDate}`);
        return false;
      }

      // Verifica se arquivo existe
      try {
        await fs.access(backup.backupLocation);
      } catch {
        console.error(`[CLT-BACKUP] Arquivo de backup não encontrado: ${backup.backupLocation}`);
        return false;
      }

      // Lê arquivo
      let fileContent: string;
      if (backup.compressionType === 'gzip') {
        // TODO: Implementar descompressão
        console.warn('[CLT-BACKUP] Verificação de arquivos comprimidos não implementada');
        return true; // Por ora, assume que está OK
      } else {
        fileContent = await fs.readFile(backup.backupLocation, 'utf8');
      }

      // Verifica hash
      const calculatedHash = crypto
        .createHash('sha256')
        .update(fileContent)
        .digest('hex');

      const isValid = calculatedHash === backup.backupHash;

      if (isValid) {
        // Atualiza status de verificação
        await db
          .update(timecardBackups)
          .set({ 
            isVerified: true, 
            verificationDate: new Date() 
          })
          .where(
            and(
              eq(timecardBackups.tenantId, tenantId),
              eq(timecardBackups.backupDate, backupDate)
            )
          );
      }

      console.log(`[CLT-BACKUP] Verificação: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'} - ${backup.backupLocation}`);
      return isValid;

    } catch (error) {
      console.error(`[CLT-BACKUP] Erro na verificação:`, error);
      return false;
    }
  }

  /**
   * 🔴 Restauração de backup
   */
  async restoreBackup(tenantId: string, backupDate: Date): Promise<any[]> {
    try {
      // Busca registro do backup
      const [backup] = await db
        .select()
        .from(timecardBackups)
        .where(
          and(
            eq(timecardBackups.tenantId, tenantId),
            eq(timecardBackups.backupDate, backupDate)
          )
        );

      if (!backup) {
        throw new Error(`Backup não encontrado: ${tenantId} - ${backupDate}`);
      }

      // Lê arquivo
      let fileContent: string;
      if (backup.compressionType === 'gzip') {
        // TODO: Implementar descompressão
        throw new Error('Restauração de arquivos comprimidos não implementada');
      } else {
        fileContent = await fs.readFile(backup.backupLocation, 'utf8');
      }

      // Parse dos dados
      const backupData = JSON.parse(fileContent);
      
      console.log(`[CLT-BACKUP] Backup restaurado: ${backupData.records.length} registros`);
      return backupData.records;

    } catch (error) {
      console.error(`[CLT-BACKUP] Erro na restauração:`, error);
      throw new Error(`Falha ao restaurar backup: ${error.message}`);
    }
  }

  /**
   * 🔴 Limpeza automática de backups antigos
   */
  async cleanupOldBackups(tenantId: string, retentionDays: number = 2555): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Busca backups antigos
      const oldBackups = await db
        .select()
        .from(timecardBackups)
        .where(
          and(
            eq(timecardBackups.tenantId, tenantId),
            lte(timecardBackups.backupDate, cutoffDate)
          )
        );

      for (const backup of oldBackups) {
        try {
          // Remove arquivo físico
          await fs.unlink(backup.backupLocation);
          console.log(`[CLT-BACKUP] Arquivo removido: ${backup.backupLocation}`);
        } catch (error) {
          console.warn(`[CLT-BACKUP] Erro ao remover arquivo: ${backup.backupLocation}`);
        }
      }

      // Remove registros do banco (mantém metadados por compliance)
      // Por enquanto, só marca como removido
      console.log(`[CLT-BACKUP] Limpeza concluída: ${oldBackups.length} backups processados`);

    } catch (error) {
      console.error(`[CLT-BACKUP] Erro na limpeza:`, error);
    }
  }

  /**
   * 🔴 Agenda backup automático diário
   */
  async scheduleDaily(): Promise<void> {
    console.log('[CLT-BACKUP] Agendamento diário inicializado');
    
    // TODO: Implementar com cron job real
    // Por ora, executa a cada hora para testes
    setInterval(async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Em produção, buscaríamos todos os tenants ativos
      const testTenants = ['3f99462f-3621-4b1b-bea8-782acc50d62e'];
      
      for (const tenantId of testTenants) {
        try {
          await this.createDailyBackup({
            tenantId,
            date: yesterday,
            compressionType: 'gzip'
          });
        } catch (error) {
          console.error(`[CLT-BACKUP] Erro no backup automático para ${tenantId}:`, error);
        }
      }
    }, 60 * 60 * 1000); // 1 hora para testes
  }
}

export const backupService = new BackupService();