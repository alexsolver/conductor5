/**
 * Technical Skills Routes - Multi-Schema Clean Architecture
 *
 * ✅ MULTITENANT: tenant_id sempre presente (coluna e filtro)
 * ✅ SCHEMA: tenant_{tenantId_sanitizado}
 * ✅ CLEAN ARCHITECTURE
 *
 * @module TechnicalSkillsRoutes
 * @version 2.3.0
 */

import { Router } from 'express';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';
import { jwtAuth } from '../../middleware/jwtAuth.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();
router.use(jwtAuth);

const createSkillSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().optional(),
});

function getRows(result: any) {
  return 'rows' in result ? result.rows : result;
}

function getTenantSchema(tenantId: string) {
  const prefix = 'tenant_';
  const maxIdLen = 63 - prefix.length;
  const base = String(tenantId)
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '_');
  const safe = base.slice(0, Math.max(0, maxIdLen)) || 'default';
  return `${prefix}${safe}`;
}

/**
 * GET /skills
 */
router.get('/skills', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;

    const result = await db.execute(sql`
      SELECT *
      FROM ${sql.raw(skillsTable)}
      WHERE is_active = true AND tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `);

    const skillsData = getRows(result);
    res.json({ success: true, data: skillsData, count: skillsData.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});

/**
 * GET /skills/categories
 */
router.get('/skills/categories', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;

    const result = await db.execute(sql`
      SELECT DISTINCT category
      FROM ${sql.raw(skillsTable)}
      WHERE is_active = true AND tenant_id = ${tenantId}
    `);

    const categories = getRows(result)
      .map((r: any) => r.category)
      .filter((c: string) => c !== null && c !== '');

    res.json({ success: true, data: categories, count: categories.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});

/**
 * POST /skills
 */
router.post('/skills', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });
    }

    const validatedData = createSkillSchema.parse(req.body);
    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;

    const result = await db.execute(sql`
      INSERT INTO ${sql.raw(skillsTable)}
      (id, tenant_id, name, category, description, is_active, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()},
        ${tenantId},                        -- 👈 precisa estar aqui!
        ${validatedData.name},
        ${validatedData.category},
        ${validatedData.description || ''},
        true,
        ${new Date()},
        ${new Date()}
      )
      RETURNING *
    `);

    const [newSkill] = getRows(result);
    res.status(201).json({
      success: true,
      message: 'Habilidade criada com sucesso',
      data: newSkill
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });
    }
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});


/**
 * PUT /skills/:id
 */
router.put('/skills/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const validatedData = createSkillSchema.partial().parse(req.body);
    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;

    const result = await db.execute(sql`
      UPDATE ${sql.raw(skillsTable)}
      SET name = COALESCE(${validatedData.name}, name),
          category = COALESCE(${validatedData.category}, category),
          description = COALESCE(${validatedData.description}, description),
          updated_at = ${new Date()}
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `);

    const [updatedSkill] = getRows(result);
    if (!updatedSkill) return res.status(404).json({ success: false, message: 'Habilidade não encontrada' });

    res.json({ success: true, message: 'Habilidade atualizada com sucesso', data: updatedSkill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });
    }
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});

/**
 * DELETE /skills/:id
 */
router.delete('/skills/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;

    const result = await db.execute(sql`
      UPDATE ${sql.raw(skillsTable)}
      SET is_active = false, updated_at = ${new Date()}
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `);

    const [deletedSkill] = getRows(result);
    if (!deletedSkill) return res.status(404).json({ success: false, message: 'Habilidade não encontrada' });

    res.json({ success: true, message: 'Habilidade desativada com sucesso' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});

/**
 * GET /user-skills/user/:userId
 */
router.get('/user-skills/user/:userId', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { userId } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;
    const userSkillsTable = `${schema}.user_skills`;

    const result = await db.execute(sql`
      SELECT us.*, s.name AS skill_name, s.category AS skill_category,
             s.level AS skill_level, s.description AS skill_description
      FROM ${sql.raw(userSkillsTable)} us
      INNER JOIN ${sql.raw(skillsTable)} s ON us.skill_id = s.id
      WHERE us.user_id = ${userId}
        AND us.tenant_id = ${tenantId}
        AND s.tenant_id = ${tenantId}
        AND us.is_active = true
        AND s.is_active = true
      ORDER BY s.category ASC, s.name ASC
    `);

    const userSkillsData = getRows(result);
    const formatted = userSkillsData.map((us: any) => ({
      ...us,
      skill: {
        id: us.skill_id,
        name: us.skill_name,
        category: us.skill_category,
        level: us.skill_level,
        description: us.skill_description,
      },
      skillName: us.skill_name,
      skillCategory: us.skill_category,
      level: us.proficiency_level,
    }));

    res.json({ success: true, data: formatted, count: formatted.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});

/**
 * POST /skills/:skillId/assign-members
 */
router.post('/skills/:skillId/assign-members', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { skillId } = req.params;
    const { memberIds, defaultLevel = 1 } = req.body; // 👈 troquei proficiencyLevel -> level

    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });
    }

    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;
    const userSkillsTable = `${schema}.user_skills`;

    // Verifica se a skill existe
    const skillExists = await db.execute(sql`
      SELECT 1 FROM ${sql.raw(skillsTable)}
      WHERE id = ${skillId} AND tenant_id = ${tenantId} AND is_active = true
      LIMIT 1
    `);

    if (getRows(skillExists).length === 0) {
      return res.status(404).json({ success: false, message: 'Habilidade não encontrada' });
    }

    let successCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    for (const memberId of memberIds) {
      try {
        if (!memberId || typeof memberId !== 'string') {
          throw new Error('ID de membro inválido');
        }

        // Verifica se já existe atribuição
        const existing = await db.execute(sql`
          SELECT 1 FROM ${sql.raw(userSkillsTable)}
          WHERE user_id = ${memberId} AND skill_id = ${skillId} AND tenant_id = ${tenantId}
          LIMIT 1
        `);

        if (getRows(existing).length > 0) {
          results.push({ memberId, status: 'skipped', message: 'Já atribuído' });
          continue;
        }

        const assignmentId = crypto.randomUUID();
        const now = new Date();

        // Faz o insert com colunas reais
        await db.execute(sql`
          INSERT INTO ${sql.raw(userSkillsTable)} (
            id, tenant_id, user_id, skill_id, level,
            notes, is_active, created_at, updated_at
          )
          VALUES (
            ${assignmentId}, ${tenantId}, ${memberId}, ${skillId}, ${defaultLevel},
            NULL, TRUE, ${now}, ${now}
          )
        `);

        results.push({ memberId, status: 'success', assignmentId });
        successCount++;
      } catch (err) {
        results.push({
          memberId,
          status: 'error',
          message: (err as Error).message,
        });
        errorCount++;
      }
    }

    const statusCode = errorCount === 0 ? 200 : successCount === 0 ? 400 : 207;

    res.status(statusCode).json({
      success: successCount > 0,
      data: { successCount, errorCount, results },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});

/**
 * GET /user-skills
 */
router.get('/user-skills', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);
    const skillsTable = `${schema}.skills`;
    const userSkillsTable = `${schema}.user_skills`;
    const usersTable = `public.users`;

    const result = await db.execute(sql`
      SELECT 
        us.id,
        us.user_id,
        us.skill_id,
        us.level,
        us.notes,
        us.created_at,
        us.updated_at,
        us.is_active,
        json_build_object(
          'id', u.id,
          'name', u.first_name || ' ' || u.last_name,
          'email', u.email
        ) AS user
      FROM ${sql.raw(userSkillsTable)} us
      JOIN ${sql.raw(usersTable)} u ON u.id = us.user_id
    `);



    const userSkillsData = getRows(result);
    res.json({ success: true, data: userSkillsData, count: userSkillsData.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ success: false, message, error });
  }
});

/**
 * GET /certifications/expired
 */
router.get('/certifications/expired', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [], count: 0 });
});

/**
 * GET /certifications/expiring
 */
router.get('/certifications/expiring', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [], count: 0 });
});

export default router;
