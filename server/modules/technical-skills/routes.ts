/**
 * Technical Skills Routes - Clean Architecture Implementation
 * 
 * ✅ 1QA.MD COMPLIANCE: Following Clean Architecture patterns
 * ✅ MULTITENANT: Proper tenant isolation with tenant_id
 * ✅ PRESERVAÇÃO: Não quebrar código existente
 * 
 * @module TechnicalSkillsRoutes
 * @version 1.0.0
 * @created 2025-09-10 - Clean Architecture Implementation
 */

import { Router } from 'express';
import { db } from '../../db.js';
import { skills, userSkills, insertSkillSchema } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { jwtAuth } from '../../middleware/jwtAuth.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import crypto from 'crypto'; // Import crypto for UUID generation

const router = Router();

// ✅ 1QA.MD: Apply authentication
router.use(jwtAuth);

// ✅ 1QA.MD: Schema validation following existing patterns
const createSkillSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().optional(),
});

/**
 * ✅ 1QA.MD: Get all skills with proper tenant isolation
 * GET /api/technical-skills/skills
 */
router.get('/skills', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID é obrigatório'
      });
    }

    console.log(`[TECHNICAL-SKILLS] Getting skills for tenant: ${tenantId}`);

    // ✅ 1QA.MD: Query with tenant isolation
    const skillsData = await db
      .select()
      .from(skills)
      .where(and(
        eq(skills.tenantId, tenantId),
        eq(skills.isActive, true)
      ))
      .orderBy(desc(skills.createdAt));

    console.log(`[TECHNICAL-SKILLS] Found ${skillsData.length} skills`);

    res.json({
      success: true,
      data: skillsData,
      count: skillsData.length
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error fetching skills:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar habilidades',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ✅ 1QA.MD: Get skill categories with proper tenant isolation
 * GET /api/technical-skills/skills/categories
 */
router.get('/skills/categories', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID é obrigatório'
      });
    }

    console.log(`[TECHNICAL-SKILLS] Getting categories for tenant: ${tenantId}`);

    // ✅ 1QA.MD: Get distinct categories with tenant isolation
    const categoriesResult = await db
      .selectDistinct({
        category: skills.category
      })
      .from(skills)
      .where(and(
        eq(skills.tenantId, tenantId),
        eq(skills.isActive, true)
      ));

    const categories = categoriesResult
      .map(row => row.category)
      .filter(category => category !== null && category !== '');

    console.log(`[TECHNICAL-SKILLS] Found ${categories.length} categories`);

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categorias',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ✅ 1QA.MD: Create new skill with proper validation and tenant isolation
 * POST /api/technical-skills/skills
 */
router.post('/skills', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID é obrigatório'
      });
    }

    // ✅ 1QA.MD: Validate input data
    const validatedData = createSkillSchema.parse(req.body);

    console.log(`[TECHNICAL-SKILLS] Creating skill for tenant: ${tenantId}`, validatedData);

    // ✅ 1QA.MD: Create skill with proper tenant isolation
    const newSkillData = {
      tenantId,
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newSkill] = await db
      .insert(skills)
      .values(newSkillData)
      .returning();

    console.log(`[TECHNICAL-SKILLS] Created skill: ${newSkill.id}`);

    res.status(201).json({
      success: true,
      message: 'Habilidade criada com sucesso',
      data: newSkill
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }

    console.error('[TECHNICAL-SKILLS] Error creating skill:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar habilidade',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ✅ 1QA.MD: Update skill with proper validation and tenant isolation
 * PUT /api/technical-skills/skills/:id
 */
router.put('/skills/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID é obrigatório'
      });
    }

    // ✅ 1QA.MD: Validate input data (partial update)
    const validatedData = createSkillSchema.partial().parse(req.body);

    console.log(`[TECHNICAL-SKILLS] Updating skill ${id} for tenant: ${tenantId}`);

    // ✅ 1QA.MD: Update with tenant isolation
    const [updatedSkill] = await db
      .update(skills)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(and(
        eq(skills.id, id),
        eq(skills.tenantId, tenantId)
      ))
      .returning();

    if (!updatedSkill) {
      return res.status(404).json({
        success: false,
        message: 'Habilidade não encontrada'
      });
    }

    console.log(`[TECHNICAL-SKILLS] Updated skill: ${id}`);

    res.json({
      success: true,
      message: 'Habilidade atualizada com sucesso',
      data: updatedSkill
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }

    console.error('[TECHNICAL-SKILLS] Error updating skill:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar habilidade',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ✅ 1QA.MD: Soft delete skill (set isActive = false)
 * DELETE /api/technical-skills/skills/:id
 */
router.delete('/skills/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID é obrigatório'
      });
    }

    console.log(`[TECHNICAL-SKILLS] Soft deleting skill ${id} for tenant: ${tenantId}`);

    // ✅ 1QA.MD: Soft delete with tenant isolation
    const [deletedSkill] = await db
      .update(skills)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(skills.id, id),
        eq(skills.tenantId, tenantId)
      ))
      .returning();

    if (!deletedSkill) {
      return res.status(404).json({
        success: false,
        message: 'Habilidade não encontrada'
      });
    }

    console.log(`[TECHNICAL-SKILLS] Soft deleted skill: ${id}`);

    res.json({
      success: true,
      message: 'Habilidade desativada com sucesso'
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error deleting skill:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar habilidade',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ✅ 1QA.MD: Get expired certifications (empty for now)
 * GET /api/technical-skills/certifications/expired
 */
router.get('/certifications/expired', async (req: Request, res: Response) => {
  try {
    // Return empty array for now - certification tracking not fully implemented
    res.json({
      success: true,
      data: [],
      count: 0
    });
  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error fetching expired certifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar certificações expiradas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ✅ 1QA.MD: Get expiring certifications (empty for now)
 * GET /api/technical-skills/certifications/expiring
 */
router.get('/certifications/expiring', async (req: Request, res: Response) => {
  try {
    // Return empty array for now - certification tracking not fully implemented
    res.json({
      success: true,
      data: [],
      count: 0
    });
  } catch (error) {
    console.error('[TECHNICAL-SKILLS] Error fetching expiring certifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar certificações expirando',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Assign members to skill
router.post('/skills/:skillId/assign-members', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId;
    const { skillId } = req.params;
    const { memberIds, defaultProficiencyLevel = 'intermediate' } = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    if (!skillId || !memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Skill ID and member IDs array are required'
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Process each member
    for (const memberId of memberIds) {
      try {
        // Check if assignment already exists
        const existingAssignment = await db.select()
          .from(userSkills)
          .where(
            and(
              eq(userSkills.tenantId, tenantId),
              eq(userSkills.userId, memberId),
              eq(userSkills.skillId, skillId)
            )
          )
          .limit(1);

        if (existingAssignment.length > 0) {
          results.push({
            memberId,
            status: 'skipped',
            message: 'Already assigned'
          });
          continue;
        }

        // Create new assignment
        const newAssignment = {
          id: crypto.randomUUID(),
          tenantId,
          userId: memberId,
          skillId,
          proficiencyLevel: defaultProficiencyLevel,
          yearsOfExperience: 0,
          certifications: [],
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.insert(userSkills).values(newAssignment);
        successCount++;
        results.push({
          memberId,
          status: 'success',
          message: 'Successfully assigned'
        });

      } catch (memberError) {
        console.error('Error assigning skill to member:', memberId, memberError);
        errorCount++;
        results.push({
          memberId,
          status: 'error',
          message: 'Assignment failed'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Assignment completed: ${successCount} successful, ${errorCount} failed`,
      data: {
        skillId,
        successCount,
        errorCount,
        results
      }
    });

  } catch (error) {
    console.error('Error in assign members endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to assign members to skill'
    });
  }
});

export default router;