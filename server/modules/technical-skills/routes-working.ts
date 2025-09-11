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
const { db } = require('../../../db');
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

    // Import database and schema
    const { db } = await import('../../../db');
    const { skills } = await import('../../../shared/schema');

    // Create skill in database
    const newSkillData = {
      tenantId,
      name: skillData.name,
      description: skillData.description || null,
      category: skillData.category,
      level: skillData.level,
      tags: skillData.tags || [],
      isActive: skillData.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newSkill] = await db.insert(skills).values(newSkillData).returning();

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

    // Import database and schema
    const { db } = await import('../../../db');
    const { skills } = await import('../../../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Filter parameters
    const { category, level, isActive } = req.query;

    // Query database for skills
    let whereConditions = [eq(skills.tenantId, tenantId)];

    if (category) {
      whereConditions.push(eq(skills.category, category as string));
    }

    if (level) {
      whereConditions.push(eq(skills.level, level as string));
    }

    if (isActive !== undefined) {
      whereConditions.push(eq(skills.isActive, isActive === 'true'));
    }

    const skillsData = await db.select().from(skills).where(and(...whereConditions));

    // If no skills exist, return empty array (don't create sample data)
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

    // Import database and schema
    const { db } = await import('../../../db');
    const { skills, userSkills } = await import('../../../shared/schema');
    const { eq, and, count } = await import('drizzle-orm');

    // Query database for skill
    const [skill] = await db.select().from(skills).where(
      and(eq(skills.id, id), eq(skills.tenantId, tenantId))
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Technical skill not found'
      });
    }

    // Get user count for this skill
    const [userCountResult] = await db.select({ 
      count: count(userSkills.id) 
    }).from(userSkills).where(
      and(eq(userSkills.skillId, id), eq(userSkills.isActive, true))
    );

    const skillWithStats = {
      ...skill,
      userCount: userCountResult?.count || 0,
      averageProficiency: 'intermediate' // This could be calculated from userSkills
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

    // Import database and schema
    const { db } = await import('../../../db');
    const { skills } = await import('../../../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Get distinct categories from database
    const categoriesResult = await db.selectDistinct({
      category: skills.category
    }).from(skills).where(
      and(eq(skills.tenantId, tenantId), eq(skills.isActive, true))
    );

    const categories = categoriesResult
      .map(row => row.category)
      .filter(category => category !== null && category !== '');

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

    // Validate partial update data
    const updateData = createSkillSchema.partial().parse(req.body);

    // Import database and schema
    const { db } = await import('../../../db');
    const { skills } = await import('../../../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Check if skill exists and belongs to the tenant
    const [existingSkill] = await db.select().from(skills).where(
      and(eq(skills.id, id), eq(skills.tenantId, tenantId))
    );

    if (!existingSkill) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Technical skill not found or does not belong to this tenant'
      });
    }

    // Update skill in database
    const updatedSkillData = {
      ...updateData,
      updatedAt: new Date()
    };

    const [updatedSkill] = await db.update(skills).set(updatedSkillData).where(
      and(eq(skills.id, id), eq(skills.tenantId, tenantId))
    ).returning();

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

    // Import database and schema
    const { db } = await import('../../../db');
    const { skills, userSkills } = await import('../../../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Check if skill exists and belongs to the tenant
    const [existingSkill] = await db.select().from(skills).where(
      and(eq(skills.id, id), eq(skills.tenantId, tenantId))
    );

    if (!existingSkill) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Technical skill not found or does not belong to this tenant'
      });
    }

    // Delete associated user skills first
    await db.delete(userSkills).where(
      and(eq(userSkills.skillId, id), eq(userSkills.tenantId, tenantId))
    );

    // Delete the skill
    await db.delete(skills).where(
      and(eq(skills.id, id), eq(skills.tenantId, tenantId))
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

    // Validate input
    const userSkillData = createUserSkillSchema.parse(req.body);

    // Import database and schema
    const { db } = await import('../../../db');
    const { userSkills, skills } = await import('../../../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Check if skill exists and belongs to the tenant
    const [skill] = await db.select().from(skills).where(
      and(eq(skills.id, userSkillData.skillId), eq(skills.tenantId, tenantId))
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Skill not found or does not belong to this tenant'
      });
    }
    
    // Check if user already has this skill assigned
    const [existingUserSkill] = await db.select().from(userSkills).where(
      and(eq(userSkills.userId, userSkillData.userId), eq(userSkills.skillId, userSkillData.skillId), eq(userSkills.tenantId, tenantId))
    );

    if (existingUserSkill) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'User already has this skill assigned'
      });
    }

    // Create a working user skill response
    const newUserSkill = {
      id: `user_skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      userId: userSkillData.userId,
      skillId: userSkillData.skillId,
      proficiencyLevel: userSkillData.proficiencyLevel,
      yearsOfExperience: userSkillData.yearsOfExperience || 0,
      certifications: userSkillData.certifications || [],
      notes: userSkillData.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert into database
    await db.insert(userSkills).values(newUserSkill);

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

    // Import database and schema
    const { db } = await import('../../../db');
    const { userSkills, skills, users } = await import('../../../shared/schema');
    const { eq, and, asc, ilike, placeholder, sql } = await import('drizzle-orm');

    // Query parameters for filtering and pagination
    const { 
      search, 
      skillId, 
      userId, 
      proficiency, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db.select({
      id: userSkills.id,
      userId: userSkills.userId,
      skillId: userSkills.skillId,
      proficiencyLevel: userSkills.proficiencyLevel,
      yearsOfExperience: userSkills.yearsOfExperience,
      certifications: userSkills.certifications,
      notes: userSkills.notes,
      createdAt: userSkills.createdAt,
      updatedAt: userSkills.updatedAt,
      skillName: skills.name,
      skillCategory: skills.category,
      skillLevel: skills.level,
      userName: users.firstName,
      userLastName: users.lastName
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .innerJoin(users, eq(userSkills.userId, users.id))
    .where(
      and(
        eq(userSkills.tenantId, tenantId),
        eq(userSkills.isActive, true), // Assuming active skills are relevant
        skillId ? eq(userSkills.skillId, skillId as string) : undefined,
        userId ? eq(userSkills.userId, userId as string) : undefined,
        proficiency ? eq(userSkills.proficiencyLevel, proficiency as string) : undefined,
        search ? 
          or(
            ilike(skills.name, `%${search}%`),
            ilike(skills.category, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          ) : undefined
      )
    );

    // Count total matching records
    const countQuery = db.select({ count: fn.count(userSkills.id) })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .innerJoin(users, eq(userSkills.userId, users.id))
      .where(
        and(
          eq(userSkills.tenantId, tenantId),
          eq(userSkills.isActive, true),
          skillId ? eq(userSkills.skillId, skillId as string) : undefined,
          userId ? eq(userSkills.userId, userId as string) : undefined,
          proficiency ? eq(userSkills.proficiencyLevel, proficiency as string) : undefined,
          search ? 
            or(
              ilike(skills.name, `%${search}%`),
              ilike(skills.category, `%${search}%`),
              ilike(users.firstName, `%${search}%`),
              ilike(users.lastName, `%${search}%`)
            ) : undefined
        )
      );

    // Apply sorting
    const orderBy = [];
    if (sortBy === 'createdAt') {
      orderBy.push(sortOrder === 'asc' ? asc(userSkills.createdAt) : desc(userSkills.createdAt));
    } else if (sortBy === 'userName') {
      orderBy.push(sortOrder === 'asc' ? asc(users.firstName) : desc(users.firstName));
    } else if (sortBy === 'skillName') {
      orderBy.push(sortOrder === 'asc' ? asc(skills.name) : desc(skills.name));
    } else if (sortBy === 'proficiency') {
      orderBy.push(sortOrder === 'asc' ? asc(userSkills.proficiencyLevel) : desc(userSkills.proficiencyLevel));
    } else {
      orderBy.push(sortOrder === 'asc' ? asc(userSkills.createdAt) : desc(userSkills.createdAt));
    }
    
    query = query.orderBy(...orderBy);

    // Apply pagination
    query = query.limit(parseInt(limit as string)).offset(offset);

    const [userSkillsData, totalCountResult] = await Promise.all([
      query,
      countQuery
    ]);

    const totalCount = totalCountResult[0]?.count || 0;

    console.log(`[TECHNICAL-SKILLS-WORKING] Listed ${userSkillsData.length} user skills for tenant: ${tenantId}`);

    res.json({
      success: true,
      data: userSkillsData.map(us => ({
        id: us.id,
        userId: us.userId,
        skillId: us.skillId,
        proficiencyLevel: us.proficiencyLevel,
        yearsOfExperience: us.yearsOfExperience,
        certifications: us.certifications,
        notes: us.notes,
        createdAt: us.createdAt,
        updatedAt: us.updatedAt,
        skill: {
          id: us.skillId,
          name: us.skillName,
          category: us.skillCategory,
          level: us.skillLevel
        },
        user: {
          id: us.userId,
          firstName: us.userName,
          lastName: us.userLastName
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

    // Import database and schema
    const { db } = await import('../../../db');
    const { userSkills, skills, users } = await import('../../../shared/schema');
    const { eq, and, asc, desc, fn, or, ilike, placeholder, sql } = await import('drizzle-orm');

    // Query to get user skills along with skill and user details
    const userSkillsData = await db.select({
      id: userSkills.id,
      userId: userSkills.userId,
      skillId: userSkills.skillId,
      proficiencyLevel: userSkills.proficiencyLevel,
      yearsOfExperience: userSkills.yearsOfExperience,
      certifications: userSkills.certifications,
      notes: userSkills.notes,
      createdAt: userSkills.createdAt,
      updatedAt: userSkills.updatedAt,
      skillName: skills.name,
      skillCategory: skills.category,
      skillLevel: skills.level,
      userName: users.firstName,
      userLastName: users.lastName
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .innerJoin(users, eq(userSkills.userId, users.id))
    .where(
      and(
        eq(userSkills.tenantId, tenantId),
        eq(userSkills.userId, userId),
        eq(userSkills.isActive, true) // Assuming we only want active skill assignments
      )
    )
    .orderBy(asc(skills.name)); // Order by skill name alphabetically

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
      if (us.proficiencyLevel in proficiencyDistribution) {
        proficiencyDistribution[us.proficiencyLevel]++;
      }
      categoryCounts[us.skillCategory] = (categoryCounts[us.skillCategory] || 0) + 1;
      totalExperience += us.yearsOfExperience || 0;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    console.log(`[TECHNICAL-SKILLS-WORKING] Retrieved ${totalSkills} skills for user: ${userId} in tenant: ${tenantId}`);

    res.json({
      success: true,
      data: userSkillsData.map(us => ({
        id: us.id,
        userId: us.userId,
        skillId: us.skillId,
        proficiencyLevel: us.proficiencyLevel,
        yearsOfExperience: us.yearsOfExperience,
        certifications: us.certifications,
        notes: us.notes,
        createdAt: us.createdAt,
        updatedAt: us.updatedAt,
        skill: {
          id: us.skillId,
          name: us.skillName,
          category: us.skillCategory,
          level: us.skillLevel
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

    // Import database and schema
    const { db } = await import('../../../db');
    const { userSkills } = await import('../../../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Check if the user skill assignment exists and belongs to the tenant
    const [existingUserSkill] = await db.select().from(userSkills).where(
      and(eq(userSkills.id, id), eq(userSkills.tenantId, tenantId))
    );

    if (!existingUserSkill) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'User skill assignment not found or does not belong to this tenant'
      });
    }

    // Delete the user skill assignment
    await db.delete(userSkills).where(
      and(eq(userSkills.id, id), eq(userSkills.tenantId, tenantId))
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

// Batch assign members to skill
router.post('/skills/:skillId/assign-members', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { skillId } = req.params;
    const { memberIds, defaultProficiencyLevel = 'beginner' } = req.body;

    // ✅ 1QA.MD: Validate required fields following security patterns
    if (!skillId || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: skillId and memberIds array' 
      });
    }

    // ✅ 1QA.MD: Use tenant-specific schema for multi-tenancy compliance
    const tenantId = user.tenantId;
    console.log(`[TECHNICAL-SKILLS-WORKING] Batch assigning members to skill ${skillId} for tenant: ${tenantId}`);

    const assignments = [];
    const errors = [];

    // Import database and schema
    const { db } = await import('../../../db');
    const { userSkills, skills } = await import('../../../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Check if the skill exists and belongs to the tenant
    const [skill] = await db.select().from(skills).where(
      and(eq(skills.id, skillId), eq(skills.tenantId, tenantId))
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Skill not found or does not belong to this tenant'
      });
    }

    for (const userId of memberIds) {
      try {
        // Check if user already has this skill assigned
        const [existingUserSkill] = await db.select().from(userSkills).where(
          and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId), eq(userSkills.tenantId, tenantId))
        );

        if (existingUserSkill) {
          errors.push({ userId, error: 'User already has this skill assigned' });
          continue; // Skip to next user if already assigned
        }

        const userSkillId = `user_skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const assignment = {
          id: userSkillId,
          tenantId,
          userId,
          skillId,
          proficiencyLevel: defaultProficiencyLevel,
          yearsOfExperience: 0,
          certifications: [],
          notes: 'Atribuído automaticamente via atribuição em lote',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        assignments.push(assignment);
        console.log(`[TECHNICAL-SKILLS-WORKING] Created assignment: ${userSkillId} for user: ${userId}`);
      } catch (error) {
        console.error(`[TECHNICAL-SKILLS-WORKING] Error assigning user ${userId}:`, error);
        errors.push({ userId, error: error.message });
      }
    }

    // Bulk insert assignments if there are any to add
    if (assignments.length > 0) {
      await db.insert(userSkills).values(assignments);
    }

    const response = {
      success: true,
      data: {
        assignments: assignments.map(a => ({ // Return only successful assignments
          id: a.id,
          userId: a.userId,
          skillId: a.skillId,
          proficiencyLevel: a.proficiencyLevel,
          notes: a.notes
        })),
        successCount: assignments.length,
        errorCount: errors.length,
        errors
      },
      message: `Successfully assigned ${assignments.length} member(s) to skill. ${errors.length} error(s).`
    };

    console.log(`[TECHNICAL-SKILLS-WORKING] Batch assignment completed: ${assignments.length} success, ${errors.length} errors`);

    res.status(201).json(response);

  } catch (error) {
    console.error('[TECHNICAL-SKILLS-WORKING] Error in batch assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign members to skill'
    });
  }
});


module.exports = { technicalSkillsWorkingRoutes: router };