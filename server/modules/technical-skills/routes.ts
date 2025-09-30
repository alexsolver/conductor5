/**
 * Technical Skills Routes - Multi-Schema Clean Architecture
 *
 * ✅ CLEAN ARCHITECTURE
 * ✅ MULTITENANT: Schema isolation (tenant_{tenantId})
 * ✅ PRESERVAÇÃO: Não quebrar código existente
 *
 * @module TechnicalSkillsRoutes
 * @version 2.0.0
 */

import { Router } from 'express';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';
import { jwtAuth } from '../../middleware/jwtAuth.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// ✅ Middleware de autenticação
router.use(jwtAuth);

// ✅ Schema validation
const createSkillSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().optional(),
});

/**
 * Helper para montar schema do tenant
 */
function getTenantSchema(tenantId: string) {
  return `tenant_${tenantId}`;
}

/**
 * GET /api/technical-skills/skills
 */
router.get('/skills', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);

    const skillsData = await db.execute(sql`
      SELECT *
      FROM ${sql.identifier([schema, 'skills'])}
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    console.log(`[TECHNICAL-SKILLS] Found ${skillsData.length} skills for tenant ${tenantId}`);

    res.json({ success: true, data: skillsData, count: skillsData.length });
  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error fetching skills:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar habilidades' });
  }
});

/**
 * GET /api/technical-skills/skills/categories
 */
router.get('/skills/categories', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);

    const categoriesResult = await db.execute(sql`
      SELECT DISTINCT category
      FROM ${sql.identifier([schema, 'skills'])}
      WHERE is_active = true
    `);

    const categories = categoriesResult
      .map((r: any) => r.category)
      .filter((c: string) => c !== null && c !== '');

    res.json({ success: true, data: categories, count: categories.length });
  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar categorias' });
  }
});

/**
 * POST /api/technical-skills/skills
 */
router.post('/skills', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const validatedData = createSkillSchema.parse(req.body);
    const schema = getTenantSchema(tenantId);

    const [newSkill] = await db.execute(sql`
      INSERT INTO ${sql.identifier([schema, 'skills'])}
      (id, name, category, description, is_active, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()}, ${validatedData.name}, ${validatedData.category},
        ${validatedData.description || ''}, true, ${new Date()}, ${new Date()}
      )
      RETURNING *
    `);

    res.status(201).json({ success: true, message: 'Habilidade criada com sucesso', data: newSkill });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });

    console.error('[TECHNICAL-SKILLS] Error creating skill:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar habilidade' });
  }
});

/**
 * PUT /api/technical-skills/skills/:id
 */
router.put('/skills/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const validatedData = createSkillSchema.partial().parse(req.body);
    const schema = getTenantSchema(tenantId);

    const [updatedSkill] = await db.execute(sql`
      UPDATE ${sql.identifier([schema, 'skills'])}
      SET name = COALESCE(${validatedData.name}, name),
          category = COALESCE(${validatedData.category}, category),
          description = COALESCE(${validatedData.description}, description),
          updated_at = ${new Date()}
      WHERE id = ${id}
      RETURNING *
    `);

    if (!updatedSkill) return res.status(404).json({ success: false, message: 'Habilidade não encontrada' });

    res.json({ success: true, message: 'Habilidade atualizada com sucesso', data: updatedSkill });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });

    console.error('[TECHNICAL-SKILLS] Error updating skill:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar habilidade' });
  }
});

/**
 * DELETE /api/technical-skills/skills/:id
 */
router.delete('/skills/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);

    const [deletedSkill] = await db.execute(sql`
      UPDATE ${sql.identifier([schema, 'skills'])}
      SET is_active = false, updated_at = ${new Date()}
      WHERE id = ${id}
      RETURNING *
    `);

    if (!deletedSkill) return res.status(404).json({ success: false, message: 'Habilidade não encontrada' });

    res.json({ success: true, message: 'Habilidade desativada com sucesso' });
  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error deleting skill:', error);
    res.status(500).json({ success: false, message: 'Erro ao desativar habilidade' });
  }
});

/**
 * GET /api/technical-skills/user-skills/user/:userId
 */
router.get('/user-skills/user/:userId', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { userId } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);

    const userSkillsData = await db.execute(sql`
      SELECT us.*, s.name as skill_name, s.category as skill_category, s.level as skill_level, s.description as skill_description
      FROM ${sql.identifier([schema, 'user_skills'])} us
      INNER JOIN ${sql.identifier([schema, 'skills'])} s ON us.skill_id = s.id
      WHERE us.user_id = ${userId}
        AND us.is_active = true
        AND s.is_active = true
      ORDER BY s.category ASC, s.name ASC
    `);

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
    console.error('[TECHNICAL-SKILLS] Error fetching user skills:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar habilidades do usuário' });
  }
});

/**
 * POST /api/technical-skills/skills/:skillId/assign-members
 */
router.post('/skills/:skillId/assign-members', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { skillId } = req.params;
    const { memberIds, defaultProficiencyLevel = 'beginner' } = req.body;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);

    // validate skill
    const skillExists = await db.execute(sql`
      SELECT 1 FROM ${sql.identifier([schema, 'skills'])}
      WHERE id = ${skillId} AND is_active = true
      LIMIT 1
    `);
    if (skillExists.length === 0) return res.status(404).json({ success: false, message: 'Habilidade não encontrada' });

    let successCount = 0, errorCount = 0;
    const results: any[] = [];

    for (const memberId of memberIds) {
      try {
        if (!memberId || typeof memberId !== 'string') throw new Error('ID de membro inválido');

        const existing = await db.execute(sql`
          SELECT 1 FROM ${sql.identifier([schema, 'user_skills'])}
          WHERE user_id = ${memberId} AND skill_id = ${skillId}
          LIMIT 1
        `);
        if (existing.length > 0) {
          results.push({ memberId, status: 'skipped', message: 'Já atribuído' });
          continue;
        }

        const assignmentId = crypto.randomUUID();
        await db.execute(sql`
          INSERT INTO ${sql.identifier([schema, 'user_skills'])}
          (id, user_id, skill_id, proficiency_level, years_of_experience, certifications, notes, is_active, created_at, updated_at)
          VALUES (
            ${assignmentId}, ${memberId}, ${skillId}, ${defaultProficiencyLevel},
            0, ${JSON.stringify([])}, null, true, ${new Date()}, ${new Date()}
          )
        `);

        results.push({ memberId, status: 'success', assignmentId });
        successCount++;
      } catch (err) {
        results.push({ memberId, status: 'error', message: (err as Error).message });
        errorCount++;
      }
    }

    const statusCode = errorCount === 0 ? 200 : (successCount === 0 ? 400 : 207);
    res.status(statusCode).json({ success: successCount > 0, data: { successCount, errorCount, results } });
  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error in assign-members:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/technical-skills/user-skills
 */
router.get('/user-skills', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Tenant ID é obrigatório' });

    const schema = getTenantSchema(tenantId);

    const userSkillsData = await db.execute(sql`
      SELECT us.*, s.name as skill_name, s.category as skill_category, s.description as skill_description
      FROM ${sql.identifier([schema, 'user_skills'])} us
      LEFT JOIN ${sql.identifier([schema, 'skills'])} s ON us.skill_id = s.id
      WHERE us.is_active = true
      ORDER BY us.created_at DESC
    `);

    res.json({ success: true, data: userSkillsData, count: userSkillsData.length });
  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error fetching user skills:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar habilidades dos usuários' });
  }
});

/**
 * GET /api/technical-skills/certifications/expired
 */
router.get('/certifications/expired', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [], count: 0 });
});

/**
 * GET /api/technical-skills/certifications/expiring
 */
router.get('/certifications/expiring', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [], count: 0 });
});

export default router;
