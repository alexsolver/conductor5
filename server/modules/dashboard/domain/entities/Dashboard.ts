/**
 * Dashboard Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module DashboardEntity
 * @created 2025-08-12 - Phase 17 Clean Architecture Implementation
 */

export interface DashboardStats {
  id: string;
  tenantId: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  ticketResolutionRate: number;
  averageResolutionTime: number;
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  activeCustomers: number;
  totalCompanies: number;
  activeCompanies: number;
  totalLocations: number;
  recentActivity: ActivityItem[];
  performanceMetrics: PerformanceMetrics;
  timeRange: string;
  generatedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityItem {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'ticket' | 'customer' | 'user' | 'company' | 'location' | 'timecard' | 'other';
  entityId: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PerformanceMetrics {
  responseTime: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  databaseConnections: number;
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  uptime: number;
  lastUpdated: Date;
}

export interface DashboardWidget {
  id: string;
  tenantId: string;
  userId?: string; // null for global widgets
  widgetType: 'stats' | 'chart' | 'table' | 'activity' | 'performance' | 'custom';
  title: string;
  description?: string;
  configuration: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  refreshInterval?: number; // in seconds
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard Business Rules and Validations
 */
export class DashboardDomainService {
  /**
   * Validate dashboard stats data
   */
  static validateDashboardStats(stats: Partial<DashboardStats>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!stats.tenantId) errors.push('Tenant ID é obrigatório');
    if (stats.totalTickets !== undefined && stats.totalTickets < 0) {
      errors.push('Total de tickets não pode ser negativo');
    }
    if (stats.ticketResolutionRate !== undefined && (stats.ticketResolutionRate < 0 || stats.ticketResolutionRate > 100)) {
      errors.push('Taxa de resolução deve estar entre 0 e 100');
    }
    if (stats.averageResolutionTime !== undefined && stats.averageResolutionTime < 0) {
      errors.push('Tempo médio de resolução não pode ser negativo');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate activity item
   */
  static validateActivityItem(activity: Partial<ActivityItem>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!activity.tenantId) errors.push('Tenant ID é obrigatório');
    if (!activity.userId) errors.push('User ID é obrigatório');
    if (!activity.action) errors.push('Ação é obrigatória');
    if (!activity.entityType) errors.push('Tipo de entidade é obrigatório');
    if (!activity.entityId) errors.push('ID da entidade é obrigatório');
    if (!activity.description) errors.push('Descrição é obrigatória');

    const validEntityTypes = ['ticket', 'customer', 'user', 'company', 'location', 'timecard', 'other'];
    if (activity.entityType && !validEntityTypes.includes(activity.entityType)) {
      errors.push('Tipo de entidade inválido');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate dashboard widget
   */
  static validateDashboardWidget(widget: Partial<DashboardWidget>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!widget.tenantId) errors.push('Tenant ID é obrigatório');
    if (!widget.widgetType) errors.push('Tipo de widget é obrigatório');
    if (!widget.title) errors.push('Título é obrigatório');
    if (!widget.position) errors.push('Posição é obrigatória');

    const validWidgetTypes = ['stats', 'chart', 'table', 'activity', 'performance', 'custom'];
    if (widget.widgetType && !validWidgetTypes.includes(widget.widgetType)) {
      errors.push('Tipo de widget inválido');
    }

    if (widget.position) {
      if (widget.position.x < 0 || widget.position.y < 0) {
        errors.push('Coordenadas de posição devem ser positivas');
      }
      if (widget.position.width <= 0 || widget.position.height <= 0) {
        errors.push('Largura e altura devem ser positivas');
      }
    }

    if (widget.refreshInterval !== undefined && widget.refreshInterval < 5) {
      errors.push('Intervalo de atualização deve ser pelo menos 5 segundos');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate ticket resolution rate
   */
  static calculateTicketResolutionRate(resolvedTickets: number, totalTickets: number): number {
    if (totalTickets === 0) return 0;
    return Math.round((resolvedTickets / totalTickets) * 100 * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate average resolution time
   */
  static calculateAverageResolutionTime(resolutionTimes: number[]): number {
    if (resolutionTimes.length === 0) return 0;
    const sum = resolutionTimes.reduce((acc, time) => acc + time, 0);
    return Math.round((sum / resolutionTimes.length) * 100) / 100; // Round to 2 decimals
  }

  /**
   * Filter activities by time range
   */
  static filterActivitiesByTimeRange(activities: ActivityItem[], timeRange: string): ActivityItem[] {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '1h':
        cutoffDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return activities;
    }

    return activities.filter(activity => activity.timestamp >= cutoffDate);
  }

  /**
   * Check if user has permission for widget
   */
  static hasWidgetPermission(userRole: string, requiredPermissions: string[]): boolean {
    if (requiredPermissions.length === 0) return true;
    
    const rolePermissions: Record<string, string[]> = {
      'saas_admin': ['*'],
      'tenant_admin': ['dashboard.view', 'dashboard.manage', 'stats.view', 'activity.view'],
      'agent': ['dashboard.view', 'stats.view'],
      'customer': ['dashboard.view']
    };

    const userPermissions = rolePermissions[userRole] || [];
    
    if (userPermissions.includes('*')) return true;
    
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }
}