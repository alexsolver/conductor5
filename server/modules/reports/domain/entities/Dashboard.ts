// ✅ 1QA.MD COMPLIANCE: DOMAIN ENTITY - PURE BUSINESS LOGIC
// Domain Layer - Zero dependencies on infrastructure or application layers

export interface Dashboard {
  id: string;
  tenantId: string;
  
  // Basic Dashboard Information
  name: string;
  description?: string;
  layoutType: 'grid' | 'flex' | 'custom' | 'responsive' | 'mobile_first';
  status: 'draft' | 'active' | 'archived' | 'error' | 'processing' | 'completed';
  
  // Layout & Design Configuration
  layoutConfig: Record<string, any>; // Grid layout, responsive breakpoints
  themeConfig: Record<string, any>; // Colors, fonts, styling
  styleConfig: Record<string, any>; // Custom CSS/styling
  
  // Access & Sharing
  ownerId: string; // references users.id
  isPublic: boolean;
  shareToken?: string; // For public sharing
  shareExpiresAt?: Date;
  accessLevel: 'view_only' | 'edit' | 'admin' | 'public' | 'restricted';
  allowedRoles: string[];
  allowedUsers: string[];
  
  // Real-time & Refresh Settings
  isRealTime: boolean;
  refreshInterval: number; // seconds
  autoRefresh: boolean;
  
  // Mobile & Responsive
  mobileConfig: Record<string, any>;
  tabletConfig: Record<string, any>;
  desktopConfig: Record<string, any>;
  
  // Favorites & Usage
  isFavorite: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  
  // Audit & Metadata
  tags: string[];
  metadata: Record<string, any>;
  version: number;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // references users.id
  updatedBy?: string; // references users.id
}

export interface DashboardWidget {
  id: string;
  tenantId: string;
  dashboardId: string;
  
  // Widget Information
  name: string;
  type: 'chart' | 'table' | 'metric' | 'gauge' | 'text' | 'image' | 'map' | 'custom';
  reportId?: string; // Optional: link to report
  
  // Position & Layout
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  gridPosition: Record<string, any>; // Grid-specific positioning
  zIndex: number;
  
  // Widget Configuration
  config: Record<string, any>; // Widget-specific configuration
  dataConfig: Record<string, any>; // Data source and query configuration
  styleConfig: Record<string, any>; // Styling and appearance
  interactionConfig: Record<string, any>; // User interaction settings
  
  // Data & Performance
  query?: string; // Custom query for widget
  cacheConfig: Record<string, any>;
  refreshInterval: number;
  isRealTime: boolean;
  
  // Responsive Settings
  mobileConfig: Record<string, any>;
  tabletConfig: Record<string, any>;
  
  // State & Visibility
  isVisible: boolean;
  isInteractive: boolean;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardFilters {
  tenantId: string;
  status?: 'draft' | 'active' | 'archived' | 'error' | 'processing' | 'completed';
  layoutType?: 'grid' | 'flex' | 'custom' | 'responsive' | 'mobile_first';
  ownerId?: string;
  isPublic?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;
}

export interface DashboardWidgetFilters {
  tenantId: string;
  dashboardId?: string;
  type?: 'chart' | 'table' | 'metric' | 'gauge' | 'text' | 'image' | 'map' | 'custom';
  reportId?: string;
  isVisible?: boolean;
  isInteractive?: boolean;
}

// Domain business rules
export class DashboardDomain {
  static validateDashboardCreation(dashboard: Partial<Dashboard>): string[] {
    const errors: string[] = [];
    
    if (!dashboard.name || dashboard.name.trim().length === 0) {
      errors.push('Dashboard name is required');
    }
    
    if (dashboard.name && dashboard.name.length > 255) {
      errors.push('Dashboard name cannot exceed 255 characters');
    }
    
    if (!dashboard.ownerId) {
      errors.push('Owner ID is required');
    }
    
    if (!dashboard.tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (dashboard.layoutType && !['grid', 'flex', 'custom', 'responsive', 'mobile_first'].includes(dashboard.layoutType)) {
      errors.push('Invalid layout type');
    }
    
    if (dashboard.accessLevel && !['view_only', 'edit', 'admin', 'public', 'restricted'].includes(dashboard.accessLevel)) {
      errors.push('Invalid access level');
    }
    
    if (dashboard.refreshInterval && dashboard.refreshInterval < 10) {
      errors.push('Refresh interval must be at least 10 seconds');
    }
    
    return errors;
  }
  
  static validateWidgetCreation(widget: Partial<DashboardWidget>): string[] {
    const errors: string[] = [];
    
    if (!widget.name || widget.name.trim().length === 0) {
      errors.push('Widget name is required');
    }
    
    if (!widget.type) {
      errors.push('Widget type is required');
    }
    
    if (widget.type && !['chart', 'table', 'metric', 'gauge', 'text', 'image', 'map', 'custom'].includes(widget.type)) {
      errors.push('Invalid widget type');
    }
    
    if (!widget.dashboardId) {
      errors.push('Dashboard ID is required');
    }
    
    if (!widget.tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!widget.position || typeof widget.position !== 'object') {
      errors.push('Widget position is required');
    } else {
      const { x, y, width, height } = widget.position;
      if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
        errors.push('Widget position must contain numeric x, y, width, and height values');
      }
      
      if (x < 0 || y < 0 || width <= 0 || height <= 0) {
        errors.push('Widget position values must be positive numbers');
      }
    }
    
    return errors;
  }
  
  static canUserAccessDashboard(dashboard: Dashboard, userId: string, userRoles: string[]): boolean {
    // Public dashboards are accessible to all
    if (dashboard.isPublic) {
      return true;
    }
    
    // Owner always has access
    if (dashboard.ownerId === userId) {
      return true;
    }
    
    // Check if user is explicitly allowed
    if (dashboard.allowedUsers.includes(userId)) {
      return true;
    }
    
    // Check if user's role is allowed
    const hasAllowedRole = userRoles.some(role => dashboard.allowedRoles.includes(role));
    if (hasAllowedRole) {
      return true;
    }
    
    return false;
  }
  
  static canUserModifyDashboard(dashboard: Dashboard, userId: string, userRoles: string[]): boolean {
    // Owner can always modify
    if (dashboard.ownerId === userId) {
      return true;
    }
    
    // Check if user has edit or admin access level and is allowed
    if (['edit', 'admin'].includes(dashboard.accessLevel)) {
      return this.canUserAccessDashboard(dashboard, userId, userRoles);
    }
    
    return false;
  }
  
  static validateWidgetPosition(widgets: DashboardWidget[], newWidget: Partial<DashboardWidget>): boolean {
    if (!newWidget.position) {
      return false;
    }
    
    const { x, y, width, height } = newWidget.position;
    const newWidgetRight = x + width;
    const newWidgetBottom = y + height;
    
    // Check for overlaps with existing widgets
    for (const widget of widgets) {
      if (widget.id === newWidget.id) continue; // Skip self when updating
      
      const existingRight = widget.position.x + widget.position.width;
      const existingBottom = widget.position.y + widget.position.height;
      
      // Check if widgets overlap
      const overlapsHorizontally = x < existingRight && newWidgetRight > widget.position.x;
      const overlapsVertically = y < existingBottom && newWidgetBottom > widget.position.y;
      
      if (overlapsHorizontally && overlapsVertically) {
        return false; // Overlap detected
      }
    }
    
    return true; // No overlap
  }
  
  static isShareTokenValid(dashboard: Dashboard): boolean {
    if (!dashboard.shareToken) {
      return false;
    }
    
    if (dashboard.shareExpiresAt && new Date() > dashboard.shareExpiresAt) {
      return false;
    }
    
    return true;
  }
  
  static generateShareToken(): string {
    // Generate a secure random token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}