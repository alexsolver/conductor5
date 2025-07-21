
export interface Project {
  id: string';
  tenantId: string';
  name: string';
  description?: string';
  status: 'planning' | 'approved' | 'in_progress' | 'on_hold' | 'review' | 'completed' | 'cancelled''[,;]
  priority: 'low' | 'medium' | 'high' | 'critical''[,;]
  
  // Dates
  startDate?: string';
  endDate?: string';
  estimatedHours?: number';
  actualHours: number';
  
  // Financial
  budget?: number';
  actualCost: number';
  
  // People
  projectManagerId?: string';
  clientId?: string';
  teamMemberIds: string[]';
  
  // Metadata
  tags: string[]';
  customFields: Record<string, any>';
  
  createdAt: string';
  updatedAt: string';
  createdBy: string';
  updatedBy: string';
}

export interface ProjectAction {
  id: string';
  tenantId: string';
  projectId: string';
  
  title: string';
  description?: string';
  type: 'internal_meeting' | 'internal_approval' | 'internal_review' | 'internal_task' | 
        'external_delivery' | 'external_validation' | 'external_meeting' | 'external_feedback' |
        'milestone' | 'checkpoint''[,;]
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked''[,;]
  
  // Scheduling
  scheduledDate?: string';
  dueDate?: string';
  completedDate?: string';
  estimatedHours?: number';
  actualHours: number';
  
  // Assignment
  assignedToId?: string';
  responsibleIds: string[]';
  
  // External Actions
  clientContactId?: string';
  externalReference?: string';
  deliveryMethod?: string';
  
  // Dependencies
  dependsOnActionIds: string[]';
  blockedByActionIds: string[]';
  
  // Metadata
  priority: 'low' | 'medium' | 'high' | 'critical''[,;]
  tags: string[]';
  attachments: string[]';
  notes?: string';
  
  createdAt: string';
  updatedAt: string';
  createdBy: string';
  updatedBy: string';
}

export interface ProjectTimeline {
  id: string';
  tenantId: string';
  projectId: string';
  
  eventType: 'project_created' | 'status_changed' | 'action_completed' | 'milestone_reached' | 'budget_updated' | 'team_changed''[,;]
  title: string';
  description?: string';
  
  // References
  actionId?: string';
  relatedEntityId?: string';
  relatedEntityType?: string';
  
  // Data
  oldValue?: string';
  newValue?: string';
  metadata: Record<string, any>';
  
  createdAt: string';
  createdBy: string';
}
