// Endpoint simples para buscar notificações do schedule_notifications
import express from 'express';
import { jwtAuth } from '../middleware/jwtAuth.js';

const router = express.Router();

// GET /api/schedule-notifications/list - Listar todas as notificações do usuário
router.get('/list', jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log('🔔 [SCHEDULE-NOTIFICATIONS] List endpoint called for user:', user.id);

    if (!user || !user.tenantId || (!user.id && !user.userId)) {
      console.error('🔔 [SCHEDULE-NOTIFICATIONS] Missing user information:', { user });
      return res.status(400).json({
        success: false,
        error: 'User information required',
        details: 'Missing user, tenantId, or userId'
      });
    }

    const { tenantId } = user;
    const userId = user.id || user.userId;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const { pool } = await import('../db.ts');

    // Ensure table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_name = 'schedule_notifications'
      );
    `;

    const tableExists = await pool.query(checkTableQuery);

    if (!tableExists.rows[0].exists) {
      console.log('🔔 [SCHEDULE-NOTIFICATIONS] Table does not exist, returning empty list');
      return res.json({
        success: true,
        data: {
          notifications: [],
          totalCount: 0
        }
      });
    }

    const query = `
      SELECT 
        id,
        title,
        message,
        notification_type as type,
        priority as severity,
        status,
        scheduled_for as "scheduledAt",
        sent_at as "sentAt",
        read_at as "readAt",
        created_at as "createdAt",
        delivery_method as channels,
        related_entity_type as "relatedEntityType",
        related_entity_id as "relatedEntityId"
      FROM ${schemaName}.schedule_notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
      LIMIT 50
    `;

    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Executing query for notifications list');
    const result = await pool.query(query, [userId]);

    // Mapear os dados para o formato esperado pela página
    const notifications = result.rows.map(row => ({
      ...row,
      channels: row.channels ? [row.channels] : ['in_app'],
      userId: userId,
      isExpired: false,
      canBeSent: row.status === 'pending',
      requiresEscalation: false
    }));

    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Found', notifications.length, 'notifications');

    res.json({
      success: true,
      data: {
        notifications: notifications,
        totalCount: notifications.length
      }
    });

  } catch (error) {
    console.error('🔔 [SCHEDULE-NOTIFICATIONS] Error fetching notifications list:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/schedule-notifications/unread - Buscar notificações não lidas do usuário
router.get('/unread', jwtAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.tenantId || (!user.id && !user.userId)) {
      console.error('🔔 [SCHEDULE-NOTIFICATIONS] Missing user information:', { user });
      return res.status(400).json({
        success: false,
        error: 'User information required',
        details: 'Missing user, tenantId, or userId'
      });
    }

    const { tenantId } = user;
    const userId = user.id || user.userId;  // Usar 'id' como principal, 'userId' como fallback
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Query usando o pool do banco - usando o módulo db correto
    const { pool } = await import('../db.ts');

    // Check if table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_name = 'schedule_notifications'
      );
    `;

    const tableExists = await pool.query(checkTableQuery);

    if (!tableExists.rows[0].exists) {
      return res.json({
        success: true,
        data: {
          notifications: [],
          unreadCount: 0
        }
      });
    }

    const query = `
      SELECT 
        id,
        title,
        message,
        notification_type as type,
        priority,
        created_at,
        read_at
      FROM ${schemaName}.schedule_notifications 
      WHERE user_id = $1 
        AND read_at IS NULL
        AND status = 'sent'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [userId]);
    const unreadCount = result.rows.length;

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/schedule-notifications/count - Buscar apenas contador
router.get('/count', jwtAuth, async (req, res) => {
  try {
    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Count endpoint called');
    const user = req.user;
    console.log('🔔 [SCHEDULE-NOTIFICATIONS] User object:', user ? {id: user.id, tenantId: user.tenantId} : 'null');

    if (!user || !user.tenantId || (!user.id && !user.userId)) {
      console.error('🔔 [SCHEDULE-NOTIFICATIONS] Missing user information:', {user});
      return res.status(400).json({
        success: false,
        error: 'User information required',
        details: 'Missing user, tenantId, or userId'
      });
    }

    const { tenantId } = user;
    const userId = user.id || user.userId;  // Usar 'id' como principal, 'userId' como fallback
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Schema:', schemaName, 'User:', userId);

    const { pool } = await import('../db.ts');

    // First, check if table exists and create if needed
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_name = 'schedule_notifications'
      );
    `;

    const tableExists = await pool.query(checkTableQuery);

    if (!tableExists.rows[0].exists) {
      console.log('🔔 [SCHEDULE-NOTIFICATIONS] Creating schedule_notifications table');
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${schemaName}.schedule_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          user_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          notification_type VARCHAR(50) DEFAULT 'info',
          priority VARCHAR(20) DEFAULT 'normal',
          status VARCHAR(20) DEFAULT 'pending',
          scheduled_for TIMESTAMP,
          sent_at TIMESTAMP,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          delivery_method VARCHAR(50) DEFAULT 'in_app',
          related_entity_type VARCHAR(50),
          related_entity_id UUID
        );
      `;

      await pool.query(createTableQuery);
      console.log('🔔 [SCHEDULE-NOTIFICATIONS] Table created successfully');
    }

    const query = `
      SELECT COUNT(*) as count
      FROM ${schemaName}.schedule_notifications 
      WHERE user_id = $1 
        AND read_at IS NULL
        AND status = 'sent'
    `;

    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Executing query:', query);
    const result = await pool.query(query, [userId]);
    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Query result:', result.rows);
    const unreadCount = parseInt(result.rows[0].count);

    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Final count:', unreadCount);
    res.json({
      success: true,
      data: {
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('🔔 [SCHEDULE-NOTIFICATIONS] Error counting unread notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PATCH /api/schedule-notifications/bulk-read - Mark multiple notifications as read
router.patch('/bulk-read', jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    const { notificationIds } = req.body;

    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Bulk mark as read request:', {
      userId: user?.id,
      tenantId: user?.tenantId,
      notificationIds: notificationIds?.length || 0
    });

    if (!user || !user.tenantId || (!user.id && !user.userId)) {
      console.error('🔔 [SCHEDULE-NOTIFICATIONS] Missing user information:', { user });
      return res.status(400).json({
        success: false,
        error: 'User information required',
        details: 'Missing user, tenantId, or userId'
      });
    }

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Notification IDs array is required'
      });
    }

    const { tenantId } = user;
    const userId = user.id || user.userId;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const { pool } = await import('../db.ts');

    // Update notifications to mark as read for the specific user
    const query = `
      UPDATE ${schemaName}.schedule_notifications 
      SET read_at = NOW(), updated_at = NOW()
      WHERE user_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL
    `;

    const result = await pool.query(query, [userId, notificationIds]);

    console.log('🔔 [SCHEDULE-NOTIFICATIONS] Bulk mark as read result:', {
      rowCount: result.rowCount
    });

    res.json({
      success: true,
      message: `Marked ${result.rowCount} notifications as read`,
      data: {
        updatedCount: result.rowCount
      }
    });

  } catch (error) {
    console.error('🔔 [SCHEDULE-NOTIFICATIONS] Bulk mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

// DELETE /api/schedule-notifications/:id - Delete specific notification
router.delete('/:id', jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    console.log('🗑️ [SCHEDULE-NOTIFICATIONS] Delete endpoint called for notification:', id, 'by user:', user.id);

    if (!user || !user.tenantId || (!user.id && !user.userId)) {
      console.error('🗑️ [SCHEDULE-NOTIFICATIONS] Missing user information:', { user });
      return res.status(400).json({
        success: false,
        error: 'User information required'
      });
    }

    const { tenantId } = user;
    const userId = user.id || user.userId;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const { pool } = await import('../db.ts');

    // Check if table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_name = 'schedule_notifications'
      );
    `;

    const tableExists = await pool.query(checkTableQuery);

    if (!tableExists.rows[0].exists) {
      console.log('🗑️ [SCHEDULE-NOTIFICATIONS] Table does not exist');
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // First check if the notification exists and belongs to the user
    const checkQuery = `
      SELECT id FROM ${schemaName}.schedule_notifications 
      WHERE id = $1 AND user_id = $2 AND read_at IS NULL
    `;

    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or already processed'
      });
    }

    // Soft delete by marking as read with a deletion timestamp
    const deleteQuery = `
      UPDATE ${schemaName}.schedule_notifications 
      SET read_at = NOW(), 
          status = 'deleted',
          updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const deleteResult = await pool.query(deleteQuery, [id, userId]);

    if (deleteResult.rows.length > 0) {
      console.log('✅ [SCHEDULE-NOTIFICATIONS] Successfully deleted notification:', id);
      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

  } catch (error) {
    console.error('🗑️ [SCHEDULE-NOTIFICATIONS] Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;