
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../../db';
import { templateVersions, templateApprovals, ticketTemplates } from '../../../shared/schema-master';
import * as semver from 'semver';

interface CreateVersionData {
  templateId: string;
  versionType: 'major' | 'minor' | 'patch';
  changeDescription: string;
  isPublished: boolean;
  approvalRequired: boolean;
  tenantId: string;
  createdBy: string;
}

interface ApproveVersionData {
  versionId: string;
  approved: boolean;
  approvalNotes?: string;
  tenantId: string;
  approvedBy: string;
}

interface VersionHistoryOptions {
  limit: number;
  offset: number;
}

export class VersionControlService {
  async createVersion(data: CreateVersionData) {
    return await db.transaction(async (tx) => {
      // Buscar template atual
      const template = await tx
        .select()
        .from(ticketTemplates)
        .where(
          and(
            eq(ticketTemplates.id, data.templateId),
            eq(ticketTemplates.tenantId, data.tenantId)
          )
        )
        .then(rows => rows[0]);

      if (!template) {
        throw new Error('Template não encontrado');
      }

      // Buscar última versão
      const lastVersion = await tx
        .select()
        .from(templateVersions)
        .where(
          and(
            eq(templateVersions.templateId, data.templateId),
            eq(templateVersions.tenantId, data.tenantId)
          )
        )
        .orderBy(desc(templateVersions.createdAt))
        .then(rows => rows[0]);

      // Calcular próxima versão
      const currentVersion = lastVersion?.version || '0.0.0';
      const nextVersion = this.calculateNextVersion(currentVersion, data.versionType);

      // Criar snapshot do template atual
      const templateSnapshot = {
        fields: template.fields,
        validations: template.validations,
        styling: template.styling,
        metadata: template.metadata
      };

      // Criar nova versão
      const [version] = await tx.insert(templateVersions).values({
        templateId: data.templateId,
        version: nextVersion,
        changeDescription: data.changeDescription,
        templateSnapshot,
        isPublished: data.isPublished && !data.approvalRequired,
        tenantId: data.tenantId,
        createdBy: data.createdBy
      }).returning();

      // Se requer aprovação, criar registro de aprovação
      if (data.approvalRequired && !data.isPublished) {
        await tx.insert(templateApprovals).values({
          versionId: version.id,
          status: 'pending',
          requestedBy: data.createdBy,
          tenantId: data.tenantId
        });
      }

      return version;
    });
  }

  async getVersionHistory(tenantId: string, templateId: string, options: VersionHistoryOptions) {
    const versions = await db
      .select({
        version: templateVersions,
        approval: templateApprovals
      })
      .from(templateVersions)
      .leftJoin(templateApprovals, eq(templateVersions.id, templateApprovals.versionId))
      .where(
        and(
          eq(templateVersions.templateId, templateId),
          eq(templateVersions.tenantId, tenantId)
        )
      )
      .orderBy(desc(templateVersions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return versions.map(row => ({
      ...row.version,
      approval: row.approval
    }));
  }

  async compareVersions(tenantId: string, versionId1: string, versionId2: string) {
    const [version1, version2] = await Promise.all([
      this.getVersionById(tenantId, versionId1),
      this.getVersionById(tenantId, versionId2)
    ]);

    if (!version1 || !version2) {
      throw new Error('Uma ou ambas as versões não foram encontradas');
    }

    return {
      version1: {
        id: version1.id,
        version: version1.version,
        createdAt: version1.createdAt
      },
      version2: {
        id: version2.id,
        version: version2.version,
        createdAt: version2.createdAt
      },
      differences: this.calculateDifferences(
        version1.templateSnapshot,
        version2.templateSnapshot
      )
    };
  }

  async rollbackToVersion(tenantId: string, templateId: string, versionId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // Buscar versão de destino
      const targetVersion = await tx
        .select()
        .from(templateVersions)
        .where(
          and(
            eq(templateVersions.id, versionId),
            eq(templateVersions.tenantId, tenantId)
          )
        )
        .then(rows => rows[0]);

      if (!targetVersion) {
        throw new Error('Versão não encontrada');
      }

      // Aplicar snapshot ao template atual
      await tx
        .update(ticketTemplates)
        .set({
          fields: targetVersion.templateSnapshot.fields,
          validations: targetVersion.templateSnapshot.validations,
          styling: targetVersion.templateSnapshot.styling,
          metadata: {
            ...targetVersion.templateSnapshot.metadata,
            lastRollback: {
              fromVersionId: versionId,
              rolledBackBy: userId,
              rolledBackAt: new Date().toISOString()
            }
          }
        })
        .where(
          and(
            eq(ticketTemplates.id, templateId),
            eq(ticketTemplates.tenantId, tenantId)
          )
        );

      // Criar nova versão para documentar o rollback
      const currentVersion = await this.getLatestVersion(tenantId, templateId);
      const rollbackVersion = this.calculateNextVersion(currentVersion?.version || '0.0.0', 'patch');

      const [newVersion] = await tx.insert(templateVersions).values({
        templateId,
        version: rollbackVersion,
        changeDescription: `Rollback para versão ${targetVersion.version}`,
        templateSnapshot: targetVersion.templateSnapshot,
        isPublished: true,
        tenantId,
        createdBy: userId
      }).returning();

      return newVersion;
    });
  }

  async approveVersion(data: ApproveVersionData) {
    return await db.transaction(async (tx) => {
      // Atualizar status da aprovação
      const [approval] = await tx
        .update(templateApprovals)
        .set({
          status: data.approved ? 'approved' : 'rejected',
          approvedBy: data.approvedBy,
          approvedAt: new Date(),
          approvalNotes: data.approvalNotes
        })
        .where(
          and(
            eq(templateApprovals.versionId, data.versionId),
            eq(templateApprovals.tenantId, data.tenantId)
          )
        )
        .returning();

      if (!approval) {
        throw new Error('Aprovação não encontrada');
      }

      // Se aprovado, publicar a versão
      if (data.approved) {
        await tx
          .update(templateVersions)
          .set({ isPublished: true })
          .where(eq(templateVersions.id, data.versionId));
      }

      return approval;
    });
  }

  async getPendingApprovals(tenantId: string, userId: string) {
    return await db
      .select({
        approval: templateApprovals,
        version: templateVersions,
        template: ticketTemplates
      })
      .from(templateApprovals)
      .innerJoin(templateVersions, eq(templateApprovals.versionId, templateVersions.id))
      .innerJoin(ticketTemplates, eq(templateVersions.templateId, ticketTemplates.id))
      .where(
        and(
          eq(templateApprovals.tenantId, tenantId),
          eq(templateApprovals.status, 'pending')
        )
      )
      .orderBy(asc(templateApprovals.createdAt));
  }

  async publishVersion(tenantId: string, versionId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // Verificar se versão existe e não está publicada
      const version = await tx
        .select()
        .from(templateVersions)
        .where(
          and(
            eq(templateVersions.id, versionId),
            eq(templateVersions.tenantId, tenantId)
          )
        )
        .then(rows => rows[0]);

      if (!version) {
        throw new Error('Versão não encontrada');
      }

      if (version.isPublished) {
        throw new Error('Versão já está publicada');
      }

      // Verificar aprovação se necessário
      const approval = await tx
        .select()
        .from(templateApprovals)
        .where(eq(templateApprovals.versionId, versionId))
        .then(rows => rows[0]);

      if (approval && approval.status !== 'approved') {
        throw new Error('Versão não foi aprovada');
      }

      // Publicar versão
      const [publishedVersion] = await tx
        .update(templateVersions)
        .set({
          isPublished: true,
          publishedAt: new Date(),
          publishedBy: userId
        })
        .where(eq(templateVersions.id, versionId))
        .returning();

      // Aplicar ao template principal
      await tx
        .update(ticketTemplates)
        .set({
          fields: version.templateSnapshot.fields,
          validations: version.templateSnapshot.validations,
          styling: version.templateSnapshot.styling,
          metadata: {
            ...version.templateSnapshot.metadata,
            currentVersion: version.version,
            lastPublished: new Date().toISOString()
          }
        })
        .where(eq(ticketTemplates.id, version.templateId));

      return publishedVersion;
    });
  }

  private calculateNextVersion(currentVersion: string, versionType: 'major' | 'minor' | 'patch'): string {
    const current = semver.valid(currentVersion) || '0.0.0';
    
    switch (versionType) {
      case 'major':
        return semver.inc(current, 'major')!;
      case 'minor':
        return semver.inc(current, 'minor')!;
      case 'patch':
        return semver.inc(current, 'patch')!;
      default:
        return semver.inc(current, 'patch')!;
    }
  }

  private calculateDifferences(snapshot1: any, snapshot2: any) {
    const differences: any[] = [];

    // Comparar campos
    const fields1 = snapshot1.fields || [];
    const fields2 = snapshot2.fields || [];

    // Campos removidos
    fields1.forEach((field1: any) => {
      const exists = fields2.find((f: any) => f.name === field1.name);
      if (!exists) {
        differences.push({
          type: 'field_removed',
          field: field1.name,
          oldValue: field1,
          newValue: null
        });
      }
    });

    // Campos adicionados ou modificados
    fields2.forEach((field2: any) => {
      const existing = fields1.find((f: any) => f.name === field2.name);
      if (!existing) {
        differences.push({
          type: 'field_added',
          field: field2.name,
          oldValue: null,
          newValue: field2
        });
      } else if (JSON.stringify(existing) !== JSON.stringify(field2)) {
        differences.push({
          type: 'field_modified',
          field: field2.name,
          oldValue: existing,
          newValue: field2
        });
      }
    });

    return differences;
  }

  private async getVersionById(tenantId: string, versionId: string) {
    return await db
      .select()
      .from(templateVersions)
      .where(
        and(
          eq(templateVersions.id, versionId),
          eq(templateVersions.tenantId, tenantId)
        )
      )
      .then(rows => rows[0]);
  }

  private async getLatestVersion(tenantId: string, templateId: string) {
    return await db
      .select()
      .from(templateVersions)
      .where(
        and(
          eq(templateVersions.templateId, templateId),
          eq(templateVersions.tenantId, tenantId)
        )
      )
      .orderBy(desc(templateVersions.createdAt))
      .then(rows => rows[0]);
  }
}
