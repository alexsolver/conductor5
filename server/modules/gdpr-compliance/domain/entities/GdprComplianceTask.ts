/**
 * GDPR Compliance Task Entity - Domain Layer
 * Clean Architecture - Pure business logic entity
 * Following 1qa.md enterprise patterns
 */

export interface GdprComplianceTaskEntity {
  id: string;
  reportId: string;
  title: string;
  description?: string;
  status: GdprTaskStatus;
  priority: GdprPriority;
  
  // Task specifics
  taskType?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  completedAt?: Date;
  
  // Assignment
  assignedUserId?: string;
  assignedBy?: string;
  
  // Task data
  taskData?: Record<string, any>;
  evidence?: Record<string, any>;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  tenantId: string;
  
  // Soft delete
  deletedAt?: Date;
  deletedBy?: string;
  isActive: boolean;
}

export type GdprTaskStatus = 
  | 'draft'
  | 'in_progress'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'archived';

export type GdprPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'urgent';

/**
 * Task Domain Service Methods
 */
export class GdprComplianceTaskDomainService {
  
  /**
   * Calculate task progress percentage
   */
  static calculateProgress(task: GdprComplianceTaskEntity): number {
    switch (task.status) {
      case 'draft': return 0;
      case 'in_progress': return 50;
      case 'under_review': return 80;
      case 'approved': return 95;
      case 'published': return 100;
      case 'archived': return 100;
      default: return 0;
    }
  }
  
  /**
   * Check if task is overdue
   */
  static isOverdue(task: GdprComplianceTaskEntity): boolean {
    if (!task.dueDate || task.completedAt) return false;
    return task.dueDate < new Date();
  }
  
  /**
   * Get task urgency level
   */
  static getUrgencyLevel(task: GdprComplianceTaskEntity): 'low' | 'medium' | 'high' | 'critical' {
    if (task.priority === 'critical' || task.priority === 'urgent') return 'critical';
    if (this.isOverdue(task)) return 'high';
    if (task.priority === 'high') return 'high';
    if (task.priority === 'medium') return 'medium';
    return 'low';
  }
  
  /**
   * Validate task can be completed
   */
  static canComplete(task: GdprComplianceTaskEntity): { canComplete: boolean; reason?: string } {
    if (task.status === 'published' || task.status === 'archived') {
      return { canComplete: false, reason: 'Task is already completed' };
    }
    
    if (!task.assignedUserId) {
      return { canComplete: false, reason: 'Task must be assigned to a user' };
    }
    
    return { canComplete: true };
  }
}