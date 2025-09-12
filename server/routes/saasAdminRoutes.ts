
import { Router } from 'express';
import { db } from '../db';
import { tenants, users } from '@shared/schema';
import { eq, count, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get system overview/stats
router.get('/overview', async (req, res) => {
  try {
    // Get total tenants
    const totalTenantsResult = await db
      .select({ count: count() })
      .from(tenants);
    
    const totalTenants = totalTenantsResult[0]?.count || 0;

    // Get active tenants
    const activeTenantsResult = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.isActive, true));
    
    const activeTenants = activeTenantsResult[0]?.count || 0;

    // Get total users across all tenants
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users);
    
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Mock system metrics (in a real system, these would come from monitoring tools)
    const systemStats = {
      totalTenants,
      activeTenants,
      totalUsers,
      totalTickets: 0, // Would need to count across all tenant schemas
      systemLoad: Math.floor(Math.random() * 40) + 20, // Mock 20-60%
      memoryUsage: Math.floor(Math.random() * 30) + 40, // Mock 40-70%
      diskUsage: Math.floor(Math.random() * 20) + 30, // Mock 30-50%
      uptime: '15d 8h 32m'
    };

    res.json(systemStats);
  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({ error: 'Failed to fetch system overview' });
  }
});

// Get all tenants with detailed info
router.get('/tenants', async (req, res) => {
  try {
    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
        plan: tenants.plan,
        contactEmail: tenants.contactEmail
      })
      .from(tenants)
      .orderBy(tenants.createdAt);

    // Enhance with additional data
    const enhancedTenants = await Promise.all(
      allTenants.map(async (tenant) => {
        // Count users for this tenant
        const userCountResult = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.tenantId, tenant.id));
        
        const userCount = userCountResult[0]?.count || 0;

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.isActive ? 'active' : 'inactive',
          plan: tenant.plan || 'basic',
          createdAt: tenant.createdAt,
          lastActivity: new Date().toISOString(), // Mock data
          userCount,
          dbSize: `${Math.floor(Math.random() * 500) + 50}MB`, // Mock
          monthlyUsage: Math.floor(Math.random() * 80) + 10, // Mock
          contactEmail: tenant.contactEmail || 'contato@exemplo.com'
        };
      })
    );

    res.json(enhancedTenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Update tenant status
router.patch('/tenants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const isActive = status === 'active';

    await db
      .update(tenants)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, id));

    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating tenant status:', error);
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
});

// Get platform users
router.get('/platform-users', async (req, res) => {
  try {
    // Get users with saas_admin, platform_admin, or support roles
    const platformUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        tenantId: users.tenantId
      })
      .from(users)
      .where(sql`${users.role} IN ('saas_admin', 'platform_admin', 'support')`)
      .orderBy(users.createdAt);

    const formattedUsers = platformUsers.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin || new Date().toISOString(),
      createdAt: user.createdAt,
      tenantAccess: user.tenantId ? [user.tenantId] : []
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching platform users:', error);
    res.status(500).json({ error: 'Failed to fetch platform users' });
  }
});

// Create platform user
router.post('/platform-users', async (req, res) => {
  try {
    const { email, role, password, tenantAccess } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const tenantId = tenantAccess.length > 0 ? tenantAccess[0] : null;

    await db
      .insert(users)
      .values({
        id: userId,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    res.json({ 
      success: true, 
      user: {
        id: userId,
        email,
        role,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error creating platform user:', error);
    res.status(500).json({ error: 'Failed to create platform user' });
  }
});

// Get tenant analytics
router.get('/tenants/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock analytics data (in real system, would query tenant-specific data)
    const analytics = {
      userActivity: {
        daily: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          activeUsers: Math.floor(Math.random() * 50) + 10
        }))
      },
      ticketMetrics: {
        total: Math.floor(Math.random() * 1000) + 200,
        open: Math.floor(Math.random() * 50) + 10,
        resolved: Math.floor(Math.random() * 900) + 150,
        avgResolutionTime: Math.floor(Math.random() * 48) + 4 // hours
      },
      performance: {
        avgResponseTime: Math.floor(Math.random() * 500) + 100, // ms
        uptime: 99.8 + Math.random() * 0.2,
        errors: Math.floor(Math.random() * 10)
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching tenant analytics:', error);
    res.status(500).json({ error: 'Failed to fetch tenant analytics' });
  }
});

// Bulk tenant operations
router.post('/tenants/bulk-action', async (req, res) => {
  try {
    const { action, tenantIds } = req.body;

    switch (action) {
      case 'activate':
        await db
          .update(tenants)
          .set({ 
            isActive: true,
            updatedAt: new Date()
          })
          .where(sql`${tenants.id} = ANY(${tenantIds})`);
        break;

      case 'deactivate':
        await db
          .update(tenants)
          .set({ 
            isActive: false,
            updatedAt: new Date()
          })
          .where(sql`${tenants.id} = ANY(${tenantIds})`);
        break;

      case 'delete':
        // In production, this should be more careful and include cleanup
        await db
          .delete(tenants)
          .where(sql`${tenants.id} = ANY(${tenantIds})`);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, action, affectedCount: tenantIds.length });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

// System health check
router.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await db.select().from(tenants).limit(1);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy',
        storage: 'healthy'
      },
      metrics: {
        responseTime: Math.floor(Math.random() * 100) + 50,
        memoryUsage: Math.floor(Math.random() * 30) + 40,
        cpuUsage: Math.floor(Math.random() * 40) + 20
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

export default router;
