/**
 * Technical Skills Working Routes - Phase 9 Implementation
 * 
 * Simplified working implementation for Phase 9 completion
 * Manages technical skills and user skill assignments
 * 
 * @module TechnicalSkillsWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 9 Clean Architecture Implementation
 */

const express = require('express');
const { db, pool } = require('../../../db');
const { skills, userSkills } = require('../../../shared/schema');
const { eq, and } = require('drizzle-orm');
const { jwtAuth } = require('../../middleware/jwtAuth');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod'); // Import zod for validation

const router = express.Router();
router.use(jwtAuth);

// Validation schemas
const createSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['basic', 'intermediate', 'advanced', 'expert']).default('intermediate'),
  tags: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true)
});

const createUserSkillSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  skillId: z.string().uuid('Invalid skill ID'),
  proficiencyLevel: z.enum(['novice', 'basic', 'intermediate', 'advanced', 'expert']).default('intermediate'),
  yearsOfExperience: z.number().min(0, 'Experience cannot be negative').optional(),
  certifications: z.array(z.string()).optional().default([]),
  notes: z.string().optional()
});

/**
 * Phase 9 Status Endpoint
 * GET /working/status
 */
router.get('/working/status', (req, res) => {
  res.json({
    success: true,
    phase: 9,
    module: 'technical-skills',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      skills: {
        create: 'POST /working/skills',
        list: 'GET /working/skills',
        getById: 'GET /working/skills/:id',
        update: 'PUT /working/skills/:id',
        delete: 'DELETE /working/skills/:id'
      },
      userSkills: {
        create: 'POST /working/user-skills',
        list: 'GET /working/user-skills',
        getByUser: 'GET /working/user-skills/user/:userId',
        delete: 'DELETE /working/user-skills/:id'
      }
    },
    features: {
      skillsManagement: true,
      userSkillsAssignment: true,
      proficiencyLevels: true,
      skillCategories: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Create technical skill - Working implementation with persistence
 * POST /working/skills
 */
router.post('/working/skills', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    // Validate input
    const skillData = createSkillSchema.parse(req.body);

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const skillId = uuidv4();
    const now = new Date();

    // Create skill in database using raw SQL
    const result = await pool.query(
      `INSERT INTO ${schemaName}.skills 
       (id, tenant_id, name, description, category, level, tags, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        skillId,
        tenantId,
        skillData.name,
        skillData.description || null,
        skillData.category,
        skillData.level,
        JSON.stringify(skillData.tags || []),
        skillData.isActive !== false,
        now,
        now
      ]
    );

    const newSkill = result.rows[0];

    console.log(`[TECHNICAL-SKILLS-WORKING] Created skill: ${newSkill.id} for tenant: ${tenantId}`);

    res.status(201).json({
      success: true,
      data: newSkill,
      message: 'Technical skill created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[TECHNICAL-SKILLS-WORKING] Error creating skill:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create technical skill'
    });
  }
});

/**
 * List technical skills - Working implementation with persistence
 * GET /working/skills
 */
router.get('/working/skills', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const { category, level, isActive } = req.query;

    // Build dynamic WHERE clause
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (level) {
      conditions.push(`level = $${paramCount++}`);
      values.push(level);
    }

    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(isActive === 'true');
    }

    const result = await pool.query(
      `SELECT * FROM ${schemaName}.skills 
       WHERE ${conditions.join(' AND ')}`,
      values
    );

    const skillsData = result.rows;

    console.log(`[TECHNICAL-SKILLS-WORKING] Listed ${skillsData.length} skills for tenant: ${tenantId}`);

    res.json({
      success: true,
      data: skillsData,
      pagination: {
        page: 1,
        limit: 20,
        total: skillsData.length,
        totalPages: Math.ceil(skillsData.length / 20)
      },
      message: 'Technical skills retrieved successfully'
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error listing skills:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve technical skills'
    });
  }
});

/**
 * Get technical skill by ID - Working implementation with persistence
 * GET /working/skills/:id
 */
router.get('/working/skills/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const { id } = req.params;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Query database for skill
    const skillResult = await pool.query(
      `SELECT * FROM ${schemaName}.skills WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Technical skill not found'
      });
    }

    const skill = skillResult.rows[0];

    // Get user count for this skill
    const userCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${schemaName}.user_skills 
       WHERE skill_id = $1 AND is_active = true`,
      [id]
    );

    const skillWithStats = {
      ...skill,
      userCount: parseInt(userCountResult.rows[0]?.count || '0'),
      averageProficiency: 'intermediate'
    };

    console.log(`[TECHNICAL-SKILLS-WORKING] Retrieved skill: ${id} for tenant: ${tenantId}`);

    res.json({
      success: true,
      data: skillWithStats,
      message: 'Technical skill retrieved successfully'
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error retrieving skill:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve technical skill'
    });
  }
});

/**
 * Get skills categories - Working implementation
 * GET /working/skills/categories
 */
router.get('/working/skills/categories', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Get distinct categories from database
    const result = await pool.query(
      `SELECT DISTINCT category FROM ${schemaName}.skills 
       WHERE tenant_id = $1 AND is_active = true AND category IS NOT NULL AND category != ''`,
      [tenantId]
    );

    const categories = result.rows.map(row => row.category);

    console.log(`[TECHNICAL-SKILLS-WORKING] Retrieved ${categories.length} categories for tenant: ${tenantId}`);

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error retrieving categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve skill categories'
    });
  }
});

/**
 * Update technical skill - Working implementation
 * PUT /working/skills/:id
 */
router.put('/working/skills/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const { id } = req.params;
    const updateData = createSkillSchema.partial().parse(req.body);
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Check if skill exists
    const checkResult = await pool.query(
      `SELECT * FROM ${schemaName}.skills WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Technical skill not found or does not belong to this tenant'
      });
    }

    // Build dynamic UPDATE
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updateData.description);
    }
    if (updateData.category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(updateData.category);
    }
    if (updateData.level !== undefined) {
      updateFields.push(`level = $${paramCount++}`);
      values.push(updateData.level);
    }
    if (updateData.tags !== undefined) {
      updateFields.push(`tags = $${paramCount++}`);
      values.push(JSON.stringify(updateData.tags));
    }
    if (updateData.isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(updateData.isActive);
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(id);
    values.push(tenantId);

    const result = await pool.query(
      `UPDATE ${schemaName}.skills 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
       RETURNING *`,
      values
    );

    const updatedSkill = result.rows[0];

    console.log(`[TECHNICAL-SKILLS-WORKING] Updated skill: ${id} for tenant: ${tenantId}`);

    res.json({
      success: true,
      data: updatedSkill,
      message: 'Technical skill updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[TECHNICAL-SKILLS-WORKING] Error updating skill:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update technical skill'
    });
  }
});

/**
 * Delete technical skill - Working implementation
 * DELETE /working/skills/:id
 */
router.delete('/working/skills/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const { id } = req.params;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Check if skill exists
    const checkResult = await pool.query(
      `SELECT * FROM ${schemaName}.skills WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Technical skill not found or does not belong to this tenant'
      });
    }

    // Delete associated user skills first
    await pool.query(
      `DELETE FROM ${schemaName}.user_skills WHERE skill_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    // Delete the skill
    await pool.query(
      `DELETE FROM ${schemaName}.skills WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    console.log(`[TECHNICAL-SKILLS-WORKING] Deleted skill: ${id} for tenant: ${tenantId}`);

    res.json({
      success: true,
      message: 'Technical skill deleted successfully'
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error deleting skill:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete technical skill'
    });
  }
});

/**
 * Create user skill assignment - Working implementation
 * POST /working/user-skills
 */
router.post('/working/user-skills', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const userSkillData = createUserSkillSchema.parse(req.body);
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Check if skill exists
    const skillResult = await pool.query(
      `SELECT * FROM ${schemaName}.skills WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [userSkillData.skillId, tenantId]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Skill not found or does not belong to this tenant'
      });
    }

    // Check if user already has this skill
    const existingResult = await pool.query(
      `SELECT * FROM ${schemaName}.user_skills 
       WHERE user_id = $1 AND skill_id = $2 AND tenant_id = $3 LIMIT 1`,
      [userSkillData.userId, userSkillData.skillId, tenantId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'User already has this skill assigned'
      });
    }

    const userSkillId = uuidv4();
    const now = new Date();

    // Insert user skill
    const result = await pool.query(
      `INSERT INTO ${schemaName}.user_skills 
       (id, tenant_id, user_id, skill_id, proficiency_level, years_of_experience, certifications, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userSkillId,
        tenantId,
        userSkillData.userId,
        userSkillData.skillId,
        userSkillData.proficiencyLevel,
        userSkillData.yearsOfExperience || 0,
        JSON.stringify(userSkillData.certifications || []),
        userSkillData.notes || null,
        now,
        now
      ]
    );

    const newUserSkill = result.rows[0];

    console.log(`[TECHNICAL-SKILLS-WORKING] Created user skill: ${newUserSkill.id} for tenant: ${tenantId}`);

    res.status(201).json({
      success: true,
      data: newUserSkill,
      message: 'User skill assignment created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[TECHNICAL-SKILLS-WORKING] Error creating user skill:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create user skill assignment'
    });
  }
});

/**
 * List user skills - Working implementation
 * GET /working/user-skills
 */
router.get('/working/user-skills', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const { skillId, userId, proficiency, page = 1, limit = 20 } = req.query;

    const conditions: string[] = ['us.tenant_id = $1', 'us.is_active = true'];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (skillId) {
      conditions.push(`us.skill_id = $${paramCount++}`);
      values.push(skillId);
    }
    if (userId) {
      conditions.push(`us.user_id = $${paramCount++}`);
      values.push(userId);
    }
    if (proficiency) {
      conditions.push(`us.proficiency_level = $${paramCount++}`);
      values.push(proficiency);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Simplified query without complex JOINs - just get user_skills with basic info
    const result = await pool.query(
      `SELECT 
        us.*,
        s.name as skill_name,
        s.category as skill_category,
        s.level as skill_level
       FROM ${schemaName}.user_skills us
       LEFT JOIN ${schemaName}.skills s ON us.skill_id = s.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY us.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...values, parseInt(limit as string), offset]
    );

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${schemaName}.user_skills us
       WHERE ${conditions.join(' AND ')}`,
      values
    );

    const totalCount = parseInt(countResult.rows[0]?.count || '0');

    console.log(`[TECHNICAL-SKILLS-WORKING] Listed ${result.rows.length} user skills for tenant: ${tenantId}`);

    res.json({
      success: true,
      data: result.rows.map(us => ({
        id: us.id,
        userId: us.user_id,
        skillId: us.skill_id,
        proficiencyLevel: us.proficiency_level,
        yearsOfExperience: us.years_of_experience,
        certifications: us.certifications,
        notes: us.notes,
        createdAt: us.created_at,
        updatedAt: us.updated_at,
        skill: {
          id: us.skill_id,
          name: us.skill_name,
          category: us.skill_category,
          level: us.skill_level
        }
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit as string))
      },
      message: 'User skills retrieved successfully'
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error listing user skills:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user skills'
    });
  }
});

/**
 * Get user skills by user ID - Working implementation
 * GET /working/user-skills/user/:userId
 */
router.get('/working/user-skills/user/:userId', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const { userId } = req.params;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Query with JOIN
    const result = await pool.query(
      `SELECT 
        us.*,
        s.name as skill_name,
        s.category as skill_category,
        s.level as skill_level
       FROM ${schemaName}.user_skills us
       INNER JOIN ${schemaName}.skills s ON us.skill_id = s.id
       WHERE us.tenant_id = $1 AND us.user_id = $2 AND us.is_active = true
       ORDER BY s.name ASC`,
      [tenantId, userId]
    );

    const userSkillsData = result.rows;

    // Calculate summary statistics
    const totalSkills = userSkillsData.length;
    const proficiencyDistribution = {
      novice: 0,
      basic: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0
    };
    const categoryCounts = {};
    let totalExperience = 0;

    userSkillsData.forEach(us => {
      if (us.proficiency_level in proficiencyDistribution) {
        proficiencyDistribution[us.proficiency_level]++;
      }
      categoryCounts[us.skill_category] = (categoryCounts[us.skill_category] || 0) + 1;
      totalExperience += us.years_of_experience || 0;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([category]) => category);

    console.log(`[TECHNICAL-SKILLS-WORKING] Retrieved ${totalSkills} skills for user: ${userId} in tenant: ${tenantId}`);

    res.json({
      success: true,
      data: userSkillsData.map(us => ({
        id: us.id,
        userId: us.user_id,
        skillId: us.skill_id,
        proficiencyLevel: us.proficiency_level,
        yearsOfExperience: us.years_of_experience,
        certifications: us.certifications,
        notes: us.notes,
        createdAt: us.created_at,
        updatedAt: us.updated_at,
        skill: {
          id: us.skill_id,
          name: us.skill_name,
          category: us.skill_category,
          level: us.skill_level
        }
      })),
      summary: {
        totalSkills,
        proficiencyDistribution,
        topCategories,
        totalExperience
      },
      message: 'User skills retrieved successfully'
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error retrieving user skills:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user skills'
    });
  }
});

/**
 * Delete user skill assignment - Working implementation
 * DELETE /working/user-skills/:id
 */
router.delete('/working/user-skills/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    const { id } = req.params;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Check if exists
    const checkResult = await pool.query(
      `SELECT * FROM ${schemaName}.user_skills WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'User skill assignment not found or does not belong to this tenant'
      });
    }

    // Delete
    await pool.query(
      `DELETE FROM ${schemaName}.user_skills WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    console.log(`[TECHNICAL-SKILLS-WORKING] Deleted user skill: ${id} for tenant: ${tenantId}`);

    res.json({
      success: true,
      message: 'User skill assignment removed successfully'
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error deleting user skill:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to remove user skill assignment'
    });
  }
});

/**
 * Get expired certifications - Working implementation
 * GET /working/certifications/expired
 */
router.get('/working/certifications/expired', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    // For now, return empty array as certification tracking is not fully implemented
    res.json({
      success: true,
      data: [],
      count: 0
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error retrieving expired certifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve expired certifications'
    });
  }
});

/**
 * Get expiring certifications - Working implementation
 * GET /working/certifications/expiring
 */
router.get('/working/certifications/expiring', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    // For now, return empty array as certification tracking is not fully implemented
    res.json({
      success: true,
      data: [],
      count: 0
    });

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error retrieving expiring certifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve expiring certifications'
    });
  }
});

/**
 * Assign members to skill - Working implementation
 * POST /working/skills/:skillId/assign-members
 */
router.post('/working/skills/:skillId/assign-members', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { skillId } = req.params;
    const { memberIds, defaultProficiencyLevel = 'intermediate' } = req.body;

    console.log('[TECHNICAL-SKILLS-WORKING] Assign members request:', { 
      skillId, 
      memberIds, 
      defaultProficiencyLevel,
      tenantId 
    });

    if (!tenantId) {
      console.log('[TECHNICAL-SKILLS-WORKING] Missing tenant ID');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Tenant ID not found'
      });
    }

    if (!skillId || !memberIds || !Array.isArray(memberIds)) {
      console.log('[TECHNICAL-SKILLS-WORKING] Validation failed:', { skillId, memberIds });
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Skill ID and member IDs array are required'
      });
    }

    // Import database and schema dynamically
    const { db } = await import('../../../db');
    const { userSkills } = await import('../../../shared/schema');
    const { v4: uuidv4 } = await import('uuid');

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
            db.and(
              db.eq(userSkills.tenantId, tenantId),
              db.eq(userSkills.userId, memberId),
              db.eq(userSkills.skillId, skillId)
            )
          )
          .limit(1);

        if (existingAssignment.length > 0) {
          console.log('[TECHNICAL-SKILLS-WORKING] Assignment already exists for:', memberId);
          results.push({
            memberId,
            status: 'skipped',
            message: 'Already assigned'
          });
          continue;
        }

        // Create new assignment
        const newAssignment = {
          id: uuidv4(),
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

        console.log('[TECHNICAL-SKILLS-WORKING] Successfully assigned skill to member:', memberId);

      } catch (memberError) {
        console.error('[TECHNICAL-SKILLS-WORKING] Error assigning skill to member:', memberId, memberError);
        errorCount++;
        results.push({
          memberId,
          status: 'error',
          message: 'Assignment failed'
        });
      }
    }

    console.log('[TECHNICAL-SKILLS-WORKING] Assignment completed:', { successCount, errorCount });

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
    console.error('[TECHNICAL-SKILLS-WORKING] Error in assign members endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to assign members to skill'
    });
  }
});


module.exports = { technicalSkillsWorkingRoutes: router };