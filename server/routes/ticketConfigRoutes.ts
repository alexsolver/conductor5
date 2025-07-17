/**
 * Ticket Configuration Management API Routes
 * RESTful endpoints for managing ticket metadata and configurations
 */

import { Request, Response, Router } from 'express';
import { eq, and, isNull, asc, desc } from 'drizzle-orm';
import { db } from '../db';
import { 
  ticketCategories, 
  ticketStatuses, 
  ticketPriorities,
  statusTransitions,
  assignmentGroups,
  ticketLocations,
  insertTicketCategorySchema,
  insertTicketStatusSchema,
  insertTicketPrioritySchema,
  insertStatusTransitionSchema,
  insertAssignmentGroupSchema,
  insertTicketLocationSchema,
  type TicketCategory,
  type TicketStatus,
  type TicketPriority,
  type StatusTransition,
  type AssignmentGroup,
  type TicketLocation
} from '../../shared/schema';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requireTenantAdmin } from '../middleware/authorizationMiddleware';

const router = Router();

// Apply authentication and authorization to all routes
router.use(jwtAuth);
router.use(requireTenantAdmin);

// Helper function to build category tree
function buildCategoryTree(categories: TicketCategory[]): TicketCategory[] {
  const categoryMap = new Map<string, TicketCategory>();
  const rootCategories: TicketCategory[] = [];

  // First pass: create map and initialize children arrays
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

// CATEGORIES ROUTES

// GET /api/ticket-config/categories - List all categories for tenant
router.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const categories = await db
      .select()
      .from(ticketCategories)
      .where(eq(ticketCategories.tenantId, tenantId))
      .orderBy(asc(ticketCategories.order), asc(ticketCategories.name));

    const categoryTree = buildCategoryTree(categories);
    res.json(categoryTree);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/ticket-config/categories - Create new category
router.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = insertTicketCategorySchema.parse({
      ...req.body,
      tenantId
    });

    const [newCategory] = await db
      .insert(ticketCategories)
      .values(validatedData)
      .returning();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/ticket-config/categories/:id - Update category
router.put('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    
    const validatedData = insertTicketCategorySchema.partial().parse(req.body);

    const [updatedCategory] = await db
      .update(ticketCategories)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(and(eq(ticketCategories.id, id), eq(ticketCategories.tenantId, tenantId)))
      .returning();

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/ticket-config/categories/:id - Delete category
router.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    // Check if category has children
    const childCategories = await db
      .select()
      .from(ticketCategories)
      .where(and(eq(ticketCategories.parentId, id), eq(ticketCategories.tenantId, tenantId)));

    if (childCategories.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with subcategories. Please delete subcategories first.' 
      });
    }

    const deletedRows = await db
      .delete(ticketCategories)
      .where(and(eq(ticketCategories.id, id), eq(ticketCategories.tenantId, tenantId)));

    if (deletedRows.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// STATUSES ROUTES

// GET /api/ticket-config/statuses - List all statuses for tenant
router.get('/statuses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const statuses = await db
      .select()
      .from(ticketStatuses)
      .where(eq(ticketStatuses.tenantId, tenantId))
      .orderBy(asc(ticketStatuses.order), asc(ticketStatuses.name));

    res.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

// POST /api/ticket-config/statuses - Create new status
router.post('/statuses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = insertTicketStatusSchema.parse({
      ...req.body,
      tenantId
    });

    const [newStatus] = await db
      .insert(ticketStatuses)
      .values(validatedData)
      .returning();

    res.status(201).json(newStatus);
  } catch (error) {
    console.error('Error creating status:', error);
    res.status(500).json({ error: 'Failed to create status' });
  }
});

// PUT /api/ticket-config/statuses/:id - Update status
router.put('/statuses/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    
    const validatedData = insertTicketStatusSchema.partial().parse(req.body);

    const [updatedStatus] = await db
      .update(ticketStatuses)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(and(eq(ticketStatuses.id, id), eq(ticketStatuses.tenantId, tenantId)))
      .returning();

    if (!updatedStatus) {
      return res.status(404).json({ error: 'Status not found' });
    }

    res.json(updatedStatus);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PRIORITIES ROUTES

// GET /api/ticket-config/priorities - List all priorities for tenant
router.get('/priorities', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const priorities = await db
      .select()
      .from(ticketPriorities)
      .where(eq(ticketPriorities.tenantId, tenantId))
      .orderBy(asc(ticketPriorities.level));

    res.json(priorities);
  } catch (error) {
    console.error('Error fetching priorities:', error);
    res.status(500).json({ error: 'Failed to fetch priorities' });
  }
});

// POST /api/ticket-config/priorities - Create new priority
router.post('/priorities', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = insertTicketPrioritySchema.parse({
      ...req.body,
      tenantId
    });

    const [newPriority] = await db
      .insert(ticketPriorities)
      .values(validatedData)
      .returning();

    res.status(201).json(newPriority);
  } catch (error) {
    console.error('Error creating priority:', error);
    res.status(500).json({ error: 'Failed to create priority' });
  }
});

// PUT /api/ticket-config/priorities/:id - Update priority
router.put('/priorities/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    
    const validatedData = insertTicketPrioritySchema.partial().parse(req.body);

    const [updatedPriority] = await db
      .update(ticketPriorities)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(and(eq(ticketPriorities.id, id), eq(ticketPriorities.tenantId, tenantId)))
      .returning();

    if (!updatedPriority) {
      return res.status(404).json({ error: 'Priority not found' });
    }

    res.json(updatedPriority);
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

// STATUS TRANSITIONS ROUTES

// GET /api/ticket-config/transitions - List all status transitions for tenant
router.get('/transitions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const transitions = await db
      .select({
        id: statusTransitions.id,
        fromStatusId: statusTransitions.fromStatusId,
        toStatusId: statusTransitions.toStatusId,
        requiredRole: statusTransitions.requiredRole,
        createdAt: statusTransitions.createdAt,
        fromStatus: {
          id: ticketStatuses.id,
          name: ticketStatuses.name,
          type: ticketStatuses.type,
          color: ticketStatuses.color
        }
      })
      .from(statusTransitions)
      .leftJoin(ticketStatuses, eq(statusTransitions.fromStatusId, ticketStatuses.id))
      .where(eq(statusTransitions.tenantId, tenantId));

    res.json(transitions);
  } catch (error) {
    console.error('Error fetching transitions:', error);
    res.status(500).json({ error: 'Failed to fetch transitions' });
  }
});

// POST /api/ticket-config/transitions - Create new status transition
router.post('/transitions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = insertStatusTransitionSchema.parse({
      ...req.body,
      tenantId
    });

    const [newTransition] = await db
      .insert(statusTransitions)
      .values(validatedData)
      .returning();

    res.status(201).json(newTransition);
  } catch (error) {
    console.error('Error creating transition:', error);
    res.status(500).json({ error: 'Failed to create transition' });
  }
});

// ASSIGNMENT GROUPS ROUTES

// GET /api/ticket-config/groups - List all assignment groups for tenant
router.get('/groups', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const groups = await db
      .select()
      .from(assignmentGroups)
      .where(eq(assignmentGroups.tenantId, tenantId))
      .orderBy(asc(assignmentGroups.name));

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// POST /api/ticket-config/groups - Create new assignment group
router.post('/groups', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = insertAssignmentGroupSchema.parse({
      ...req.body,
      tenantId
    });

    const [newGroup] = await db
      .insert(assignmentGroups)
      .values(validatedData)
      .returning();

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// LOCATIONS ROUTES

// GET /api/ticket-config/locations - List all locations for tenant
router.get('/locations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const locations = await db
      .select()
      .from(ticketLocations)
      .where(eq(ticketLocations.tenantId, tenantId))
      .orderBy(asc(ticketLocations.name));

    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// POST /api/ticket-config/locations - Create new location
router.post('/locations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = insertTicketLocationSchema.parse({
      ...req.body,
      tenantId
    });

    const [newLocation] = await db
      .insert(ticketLocations)
      .values(validatedData)
      .returning();

    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

export default router;