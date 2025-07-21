/**
 * User Management Routes
 * Handles user CRUD operations and management
 */

import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireTenantAccess, requireAdmin, AuthenticatedRequest } from '../middleware/rbacMiddleware';
import { logInfo, logError } from '../utils/logger';
import { storage } from '../storage-simple';

const router = Router();

/**
 * Get all users for tenant
 */
router.get('/', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { page = 1, limit = 20, search, role, status } = req.query;
    
    logInfo('Getting users', { tenantId, page, limit, search, role, status });
    
    const users = await storage.getTenantUsers(tenantId, {
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    });

    // Apply filters if provided
    let filteredUsers = users;
    
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Remove sensitive information
    const safeUsers = filteredUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive ?? true,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      users: safeUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / Number(limit))
      }
    });
  } catch (error) {
    logError('Error getting users', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

/**
 * Get specific user by ID
 */
router.get('/:userId', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { userId } = req.params;
    
    logInfo('Getting user by ID', { tenantId, userId });
    
    const user = await storage.getUser(Number(userId));
    
    if (!user || user.tenantId !== tenantId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive information
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive ?? true,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(safeUser);
  } catch (error) {
    logError('Error getting user by ID', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

/**
 * Create new user (admin only)
 */
router.post('/', jwtAuth, requireAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const userData = req.body;
    
    logInfo('Creating user', { tenantId, userData: { ...userData, password: '[REDACTED]' } });
    
    // Validate required fields
    if (!userData.username || !userData.password || !userData.email) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = await storage.createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password, // Should be hashed in storage layer
      role: userData.role || 'user',
      tenantId: tenantId,
      isActive: userData.isActive ?? true
    });

    // Remove sensitive information from response
    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      tenantId: newUser.tenantId,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.status(201).json(safeUser);
  } catch (error) {
    logError('Error creating user', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

/**
 * Update user (admin only or self)
 */
router.put('/:userId', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { userId } = req.params;
    const updateData = req.body;
    const currentUserId = req.user!.id;
    
    logInfo('Updating user', { tenantId, userId, updateData: { ...updateData, password: updateData.password ? '[REDACTED]' : undefined } });
    
    // Check if user exists and belongs to tenant
    const user = await storage.getUser(Number(userId));
    if (!user || user.tenantId !== tenantId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions: admin can update anyone, users can only update themselves
    if (req.user!.role !== 'admin' && currentUserId !== userId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Prepare update data
    const allowedFields = ['email', 'role', 'isActive', 'password];
    const filteredUpdateData: any = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Non-admin users cannot change their own role
        if (field === 'role' && req.user!.role !== 'admin') {
          continue;
        }
        filteredUpdateData[field] = updateData[field];
      }
    }

    // Mock update - in real implementation, use storage.updateUser()
    const updatedUser = {
      ...user,
      ...filteredUpdateData,
      updatedAt: new Date().toISOString()
    };

    // Remove sensitive information
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      tenantId: updatedUser.tenantId,
      isActive: updatedUser.isActive,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.json(safeUser);
  } catch (error) {
    logError('Error updating user', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

/**
 * Delete user (admin only)
 */
router.delete('/:userId', jwtAuth, requireAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { userId } = req.params;
    
    logInfo('Deleting user', { tenantId, userId });
    
    // Check if user exists and belongs to tenant
    const user = await storage.getUser(Number(userId));
    if (!user || user.tenantId !== tenantId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (req.user!.id === userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Mock deletion - in real implementation, use storage.deleteUser()
    // For safety, we might want to soft delete (set isActive = false) instead
    logInfo('User deleted successfully', { userId });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logError('Error deleting user', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

/**
 * Get user permissions
 */
router.get('/:userId/permissions', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { userId } = req.params;
    
    logInfo('Getting user permissions', { tenantId, userId });
    
    // Check if user exists and belongs to tenant
    const user = await storage.getUser(Number(userId));
    if (!user || user.tenantId !== tenantId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mock permissions based on role - in real implementation, get from RBAC system
    const permissions = {
      admin: ['*],
      manager: ['read:all', 'write:tickets', 'write:customers', 'read:reports],
      agent: ['read:tickets', 'write:tickets', 'read:customers],
      user: ['read:profile', 'write:profile]
    };

    res.json({
      userId: user.id,
      role: user.role,
      permissions: permissions[user.role as keyof typeof permissions] || []
    });
  } catch (error) {
    logError('Error getting user permissions', error);
    res.status(500).json({ message: 'Failed to get user permissions' });
  }
});

/**
 * Update user permissions (admin only)
 */
router.put('/:userId/permissions', jwtAuth, requireAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { userId } = req.params;
    const { role, customPermissions } = req.body;
    
    logInfo('Updating user permissions', { tenantId, userId, role, customPermissions });
    
    // Check if user exists and belongs to tenant
    const user = await storage.getUser(Number(userId));
    if (!user || user.tenantId !== tenantId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'agent', 'user];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Mock update - in real implementation, update user role and custom permissions
    const updatedPermissions = {
      userId: user.id,
      role: role || user.role,
      customPermissions: customPermissions || [],
      updatedAt: new Date().toISOString()
    };

    res.json(updatedPermissions);
  } catch (error) {
    logError('Error updating user permissions', error);
    res.status(500).json({ message: 'Failed to update user permissions' });
  }
});

/**
 * Get user activity log
 */
router.get('/:userId/activity', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { userId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    logInfo('Getting user activity', { tenantId, userId, page, limit, startDate, endDate });
    
    // Check if user exists and belongs to tenant
    const user = await storage.getUser(Number(userId));
    if (!user || user.tenantId !== tenantId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mock activity log - in real implementation, get from audit log
    const activities = ['
      {
        id: 'activity_1',
        action: 'login',
        timestamp: '2024-01-21T09:00:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        details: { success: true }
      },
      {
        id: 'activity_2',
        action: 'create_ticket',
        timestamp: '2024-01-21T09:15:00Z',
        ipAddress: '192.168.1.100',
        details: { ticketId: 'ticket_123', title: 'Sample Ticket' }
      },
      {
        id: 'activity_3',
        action: 'update_profile',
        timestamp: '2024-01-21T10:30:00Z',
        ipAddress: '192.168.1.100',
        details: { fields: ['email] }
      }
    ];

    // Apply date filters if provided
    let filteredActivities = activities;
    if (startDate) {
      filteredActivities = filteredActivities.filter(activity => 
        new Date(activity.timestamp) >= new Date(startDate.toString())
      );
    }
    if (endDate) {
      filteredActivities = filteredActivities.filter(activity => 
        new Date(activity.timestamp) <= new Date(endDate.toString())
      );
    }

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedActivities = filteredActivities.slice(startIndex, startIndex + Number(limit));

    res.json({
      activities: paginatedActivities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredActivities.length,
        totalPages: Math.ceil(filteredActivities.length / Number(limit))
      }
    });
  } catch (error) {
    logError('Error getting user activity', error);
    res.status(500).json({ message: 'Failed to get user activity' });
  }
});

export default router;