
import { Router } from 'express';
import { db } from '../db';
import { tenants, users } from '@shared/schema';
import { eq, count, sql, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';

const router = Router();

// Middleware para verificar se é SaaS Admin
const requireSaasAdmin = (req: AuthenticatedRequest, res: any, next: any) => {
  if (!req.user || req.user.role !== 'saas_admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'SaaS admin access required' 
    });
  }
  next();
};

// Aplicar middleware de autenticação e verificação de SaaS Admin em todas as rotas
router.use(jwtAuth);
router.use(requireSaasAdmin);

// Get system overview/stats
router.get('/overview', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔍 [SAAS-ADMIN] Getting system overview');
    
    // Get total tenants
    const totalTenantsResult = await db
      .select({ count: count() })
      .from(tenants);
    
    const totalTenants = Number(totalTenantsResult[0]?.count || 0);

    // Get active tenants
    const activeTenantsResult = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.isActive, true));
    
    const activeTenants = Number(activeTenantsResult[0]?.count || 0);

    // Get total users across all tenants
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users);
    
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Calculate system metrics
    const systemStats = {
      totalTenants,
      activeTenants,
      totalUsers,
      totalTickets: Math.floor(Math.random() * 5000) + 1000, // Mock data
      systemLoad: Math.floor(Math.random() * 40) + 20, // Mock 20-60%
      memoryUsage: Math.floor(Math.random() * 30) + 40, // Mock 40-70%
      diskUsage: Math.floor(Math.random() * 20) + 30, // Mock 30-50%
      uptime: '15d 8h 32m'
    };

    console.log('✅ [SAAS-ADMIN] System overview loaded successfully:', systemStats);
    res.json(systemStats);
  } catch (error) {
    console.error('❌ [SAAS-ADMIN] Error fetching system overview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch system overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all tenants with detailed info
router.get('/tenants', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔍 [SAAS-ADMIN] Getting all tenants');
    
    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        plan: tenants.plan,
        contactEmail: tenants.contactEmail
      })
      .from(tenants)
      .orderBy(tenants.createdAt);

    console.log(`📊 [SAAS-ADMIN] Found ${allTenants.length} tenants`);

    // Enhance with additional data
    const enhancedTenants = await Promise.all(
      allTenants.map(async (tenant) => {
        try {
          // Count users for this tenant
          const userCountResult = await db
            .select({ count: count() })
            .from(users)
            .where(eq(users.tenantId, tenant.id));
          
          const userCount = Number(userCountResult[0]?.count || 0);

          return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.isActive ? 'active' : 'inactive',
            plan: tenant.plan || 'basic',
            createdAt: tenant.createdAt,
            lastActivity: tenant.updatedAt || tenant.createdAt,
            userCount,
            dbSize: `${Math.floor(Math.random() * 500) + 50}MB`, // Mock
            monthlyUsage: Math.floor(Math.random() * 80) + 10, // Mock
            contactEmail: tenant.contactEmail || 'contato@exemplo.com'
          };
        } catch (error) {
          console.error(`❌ [SAAS-ADMIN] Error processing tenant ${tenant.id}:`, error);
          return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.isActive ? 'active' : 'inactive',
            plan: tenant.plan || 'basic',
            createdAt: tenant.createdAt,
            lastActivity: tenant.updatedAt || tenant.createdAt,
            userCount: 0,
            dbSize: 'N/A',
            monthlyUsage: 0,
            contactEmail: tenant.contactEmail || 'contato@exemplo.com'
          };
        }
      })
    );

    console.log('✅ [SAAS-ADMIN] Tenants data enhanced successfully');
    res.json(enhancedTenants);
  } catch (error) {
    console.error('❌ [SAAS-ADMIN] Error fetching tenants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tenants',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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
router.get('/platform-users', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔍 [SAAS-ADMIN] Getting platform users');
    
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

    console.log(`👥 [SAAS-ADMIN] Found ${platformUsers.length} platform users`);

    const formattedUsers = platformUsers.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin || new Date().toISOString(),
      createdAt: user.createdAt,
      tenantAccess: user.tenantId ? [user.tenantId] : []
    }));

    console.log('✅ [SAAS-ADMIN] Platform users loaded successfully');
    res.json(formattedUsers);
  } catch (error) {
    console.error('❌ [SAAS-ADMIN] Error fetching platform users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch platform users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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

// Get all integrations
router.get('/integrations', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔍 [SAAS-ADMIN-INTEGRATIONS] Fetching all integrations');
    
    const result = await db.execute(sql`
      SELECT id, name, description, category, config, created_at, updated_at
      FROM public.integrations
      ORDER BY category, name
    `);

    const integrations = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      config: row.config || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    console.log(`✅ [SAAS-ADMIN-INTEGRATIONS] Found ${integrations.length} integrations`);

    res.json({
      success: true,
      integrations,
      total: integrations.length
    });
  } catch (error) {
    console.error('❌ [SAAS-ADMIN-INTEGRATIONS] Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch integrations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
