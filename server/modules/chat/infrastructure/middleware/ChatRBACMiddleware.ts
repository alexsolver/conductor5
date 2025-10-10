import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { getTenantDb } from '@/db';
import { chatAgentStatus, chats } from '@shared/schema-chat';

interface ChatUser {
  id: string;
  role: string;
  tenantId: string;
}

// Chat-specific permissions
export const ChatPermissions = {
  // Agent permissions
  AGENT_VIEW_ASSIGNED_CHATS: 'chat:agent:view_assigned',
  AGENT_SEND_MESSAGES: 'chat:agent:send_messages',
  AGENT_TRANSFER_CHAT: 'chat:agent:transfer',
  AGENT_CLOSE_CHAT: 'chat:agent:close',
  AGENT_CREATE_TICKET: 'chat:agent:create_ticket',
  AGENT_UPDATE_STATUS: 'chat:agent:update_status',

  // Supervisor permissions
  SUPERVISOR_VIEW_ALL_CHATS: 'chat:supervisor:view_all',
  SUPERVISOR_JOIN_ANY_CHAT: 'chat:supervisor:join_any',
  SUPERVISOR_MONITOR_AGENTS: 'chat:supervisor:monitor_agents',
  SUPERVISOR_MANAGE_QUEUES: 'chat:supervisor:manage_queues',
  SUPERVISOR_VIEW_ANALYTICS: 'chat:supervisor:view_analytics',
  SUPERVISOR_FORCE_TRANSFER: 'chat:supervisor:force_transfer',

  // Admin permissions  
  ADMIN_MANAGE_SETTINGS: 'chat:admin:manage_settings',
  ADMIN_MANAGE_INTEGRATIONS: 'chat:admin:manage_integrations',
  ADMIN_VIEW_AUDIT_LOGS: 'chat:admin:view_audit',
  ADMIN_MANAGE_PERMISSIONS: 'chat:admin:manage_permissions',
} as const;

// Role to permissions mapping
const rolePermissions: Record<string, string[]> = {
  agent: [
    ChatPermissions.AGENT_VIEW_ASSIGNED_CHATS,
    ChatPermissions.AGENT_SEND_MESSAGES,
    ChatPermissions.AGENT_TRANSFER_CHAT,
    ChatPermissions.AGENT_CLOSE_CHAT,
    ChatPermissions.AGENT_CREATE_TICKET,
    ChatPermissions.AGENT_UPDATE_STATUS,
  ],
  supervisor: [
    // Supervisors have all agent permissions
    ...rolePermissions.agent || [],
    ChatPermissions.SUPERVISOR_VIEW_ALL_CHATS,
    ChatPermissions.SUPERVISOR_JOIN_ANY_CHAT,
    ChatPermissions.SUPERVISOR_MONITOR_AGENTS,
    ChatPermissions.SUPERVISOR_MANAGE_QUEUES,
    ChatPermissions.SUPERVISOR_VIEW_ANALYTICS,
    ChatPermissions.SUPERVISOR_FORCE_TRANSFER,
  ],
  admin: [
    // Admins have all supervisor permissions
    ...rolePermissions.supervisor || [],
    ChatPermissions.ADMIN_MANAGE_SETTINGS,
    ChatPermissions.ADMIN_MANAGE_INTEGRATIONS,
    ChatPermissions.ADMIN_VIEW_AUDIT_LOGS,
    ChatPermissions.ADMIN_MANAGE_PERMISSIONS,
  ],
  saas_admin: [
    // SaaS admins have all permissions
    ...Object.values(ChatPermissions),
  ],
};

// Middleware to check chat permissions
export const requireChatPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as ChatUser;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userPermissions = rolePermissions[user.role] || [];

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have permission: ${permission}`,
        });
      }

      next();
    } catch (error) {
      console.error('[CHAT-RBAC] Error checking permission:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to check if user can access a specific chat
export const requireChatAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user as ChatUser;
    const chatId = req.params.chatId || req.body.chatId;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    const db = await getTenantDb(user.tenantId);

    // Supervisors and admins can access all chats
    if (['supervisor', 'admin', 'saas_admin'].includes(user.role)) {
      return next();
    }

    // Agents can only access chats assigned to them
    if (user.role === 'agent') {
      const [chat] = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.assignedAgentId, user.id)))
        .limit(1);

      if (!chat) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access chats assigned to you',
        });
      }

      return next();
    }

    // Default: deny access
    return res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    console.error('[CHAT-RBAC] Error checking chat access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper to check if user has permission (for use in code)
export const hasPermission = (userRole: string, permission: string): boolean => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

// Helper to get all permissions for a role
export const getPermissionsForRole = (role: string): string[] => {
  return rolePermissions[role] || [];
};
