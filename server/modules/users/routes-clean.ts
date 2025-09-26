/**
 * PRESENTATION LAYER - USER ROUTES
 * Seguindo Clean Architecture - 1qa.md compliance
 * 
 * Nova implementação Clean Architecture para Users
 * Mantém compatibilidade com APIs existentes
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { UserController } from './application/controllers/UserController';
import { CreateUserUseCase } from './application/use-cases/CreateUserUseCase';
import { UpdateUserUseCase } from './application/use-cases/UpdateUserUseCase';
import { FindUserUseCase } from './application/use-cases/FindUserUseCase';
import { DeleteUserUseCase } from './application/use-cases/DeleteUserUseCase';
import { UserDomainService } from './domain/entities/User';
import { DrizzleUserRepository } from './infrastructure/repositories/DrizzleUserRepository';
import schemaManager from '../../core/schemaManager'; // Assuming schemaManager is available here
import schema from '../../db/schema'; // Assuming schema is imported correctly
import { eq } from 'drizzle-orm'; // Assuming eq is imported correctly

// Factory function to create initialized controller
function createUserController(): UserController {
  // Infrastructure Layer
  const userRepository = new DrizzleUserRepository();

  // Domain Layer
  const userDomainService = new UserDomainService();

  // Application Layer - Use Cases
  const createUserUseCase = new CreateUserUseCase(userRepository, userDomainService);
  const updateUserUseCase = new UpdateUserUseCase(userRepository, userDomainService);
  const findUserUseCase = new FindUserUseCase(userRepository, userDomainService);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  // Controller
  return new UserController(
    createUserUseCase,
    updateUserUseCase,
    findUserUseCase,
    deleteUserUseCase,
    userDomainService
  );
}

// Initialize controller
const userController = createUserController();

// Router setup
const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering, pagination, and search
 * @access  Private (JWT required)
 * @params  query parameters for filtering:
 *          - role: array of role values
 *          - employmentType: array of employment type values
 *          - isActive: boolean (default: true)
 *          - department: department filter
 *          - search: text search in name/email/position
 *          - dateFrom: start date (ISO string)
 *          - dateTo: end date (ISO string)
 *          - page: page number (default: 1)
 *          - limit: items per page (default: 50, max: 1000)
 *          - sortBy: field to sort by (default: firstName)
 *          - sortOrder: asc/desc (default: asc)
 */
router.get('/', userController.findAll.bind(userController));

/**
 * @route   GET /api/users/search
 * @desc    Search users by text
 * @access  Private (JWT required)
 * @params  q (query parameter): search term
 */
router.get('/search', userController.search.bind(userController));

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics for dashboard
 * @access  Private (JWT required)
 */
router.get('/stats', userController.getStatistics.bind(userController));

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Private (JWT required)
 */
router.get('/role/:role', userController.findByRole.bind(userController));

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (JWT required)
 */
router.get('/:id', userController.findById.bind(userController));

/**
 * @route   GET /api/users/:id/profile
 * @desc    Get user profile by ID
 * @access  Private (JWT required)
 */
router.get('/:id/profile', userController.getProfile.bind(userController));

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (JWT required) - Admin roles only
 * @body    CreateUserDTO
 */
router.post('/', userController.create.bind(userController));

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (JWT required)
 * @body    UpdateUserDTO
 */
router.put('/:id', userController.update.bind(userController));

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change user password
 * @access  Private (JWT required)
 * @body    ChangePasswordDTO
 */
router.put('/:id/password', userController.changePassword.bind(userController));

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user by ID
 * @access  Private (JWT required) - Admin roles only
 */
router.delete('/:id', userController.delete.bind(userController));

// Get all users for notifications
router.get('/notifications/users', jwtAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    console.log(`🔍 [USERS-API] Fetching users for notifications, tenant: ${tenantId}`);

    const { db } = await schemaManager.getTenantDb(tenantId);
    const users = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      active: schema.users.active
    }).from(schema.users)
    .where(eq(schema.users.active, true));

    console.log(`✅ [USERS-API] Found ${users.length} active users`);
    res.json(users);
  } catch (error) {
    console.error('❌ [USERS-API] Error fetching users for notifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;