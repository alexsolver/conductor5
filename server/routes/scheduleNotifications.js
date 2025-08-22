// Endpoint simples para buscar notificações do schedule_notifications
import express from 'express';
import { jwtAuth } from '../middleware/jwtAuth.js';

const router = express.Router();

// GET /api/schedule-notifications/unread - Buscar notificações não lidas do usuário
router.get('/unread', jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user || !user.tenantId || !user.userId) {
      return res.status(400).json({
        success: false,
        error: 'User information required'
      });
    }

    const { tenantId, userId } = user;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Query usando o pool do banco - pegando de um módulo existente
    const db = await import('../database/connection.js').then(m => m.db);
    
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
    
    const result = await db.query(query, [userId]);
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
    const user = req.user;
    
    if (!user || !user.tenantId || !user.userId) {
      return res.status(400).json({
        success: false,
        error: 'User information required'
      });
    }

    const { tenantId, userId } = user;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const db = await import('../database/connection.js').then(m => m.db);
    
    const query = `
      SELECT COUNT(*) as count
      FROM ${schemaName}.schedule_notifications 
      WHERE user_id = $1 
        AND read_at IS NULL
        AND status = 'sent'
    `;
    
    const result = await db.query(query, [userId]);
    const unreadCount = parseInt(result.rows[0].count);
    
    res.json({
      success: true,
      data: {
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;