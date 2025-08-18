// ✅ 1QA.MD COMPLIANCE: DOMAIN ENTITY - WYSIWYG PDF DESIGN
// Domain Layer - Zero dependencies on infrastructure or application layers

export interface WYSIWYGDesign {
  id: string;
  tenantId: string;
  reportId: string;
  
  // Design Configuration
  name: string;
  description?: string;
  version: number;
  
  // Layout Structure
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Design Elements
  elements: DesignElement[];
  
  // Styling
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;
  };
  
  // Grid System
  gridConfig: {
    enabled: boolean;
    columns: number;
    rows: number;
    gutter: number;
  };
  
  // Export Settings
  exportConfig: {
    quality: 'low' | 'medium' | 'high';
    compression: boolean;
    watermark?: string;
  };
  
  // Metadata
  tags: string[];
  isTemplate: boolean;
  templateCategory?: string;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface DesignElement {
  id: string;
  type: 'header' | 'text' | 'chart' | 'table' | 'image' | 'line' | 'shape' | 'barcode' | 'qrcode';
  
  // Position & Size
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Content
  content: {
    text?: string;
    dataSource?: string;
    chartType?: 'bar' | 'line' | 'pie' | 'table' | 'gauge';
    imageUrl?: string;
    query?: string;
  };
  
  // Styling
  style: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    color?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    padding?: number;
    margin?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
  };
  
  // Behavior
  behavior: {
    responsive?: boolean;
    conditional?: boolean;
    conditions?: ConditionRule[];
    animation?: string;
  };
  
  // Data Binding
  dataBinding?: {
    source: string;
    field: string;
    format?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  };
}

export interface ConditionRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  action: 'show' | 'hide' | 'highlight' | 'change_color';
  actionValue?: any;
}

export interface WYSIWYGTemplate {
  id: string;
  tenantId: string;
  
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  
  design: Omit<WYSIWYGDesign, 'id' | 'tenantId' | 'reportId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
  
  // Template Metadata
  usageCount: number;
  rating: number;
  tags: string[];
  isPublic: boolean;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Domain business rules
export class WYSIWYGDesignDomain {
  static validateDesign(design: Partial<WYSIWYGDesign>): string[] {
    const errors: string[] = [];
    
    if (!design.name || design.name.trim().length === 0) {
      errors.push('Design name is required');
    }
    
    if (!design.reportId) {
      errors.push('Report ID is required');
    }
    
    if (!design.tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!design.pageSize) {
      errors.push('Page size is required');
    }
    
    if (!design.orientation) {
      errors.push('Page orientation is required');
    }
    
    if (!design.elements || !Array.isArray(design.elements)) {
      errors.push('Design elements must be an array');
    }
    
    if (design.elements) {
      design.elements.forEach((element, index) => {
        const elementErrors = this.validateElement(element);
        elementErrors.forEach(error => {
          errors.push(`Element ${index + 1}: ${error}`);
        });
      });
    }
    
    return errors;
  }
  
  static validateElement(element: Partial<DesignElement>): string[] {
    const errors: string[] = [];
    
    if (!element.type) {
      errors.push('Element type is required');
    }
    
    if (!element.position) {
      errors.push('Element position is required');
    } else {
      if (element.position.x < 0 || element.position.y < 0) {
        errors.push('Element position cannot be negative');
      }
      
      if (element.position.width <= 0 || element.position.height <= 0) {
        errors.push('Element dimensions must be positive');
      }
    }
    
    if (!element.content) {
      errors.push('Element content is required');
    }
    
    return errors;
  }
  
  static calculatePageDimensions(pageSize: string, orientation: string): { width: number; height: number } {
    const dimensions: Record<string, { width: number; height: number }> = {
      'A4': { width: 595, height: 842 },
      'A3': { width: 842, height: 1191 },
      'Letter': { width: 612, height: 792 },
      'Legal': { width: 612, height: 1008 }
    };
    
    let { width, height } = dimensions[pageSize] || dimensions['A4'];
    
    if (orientation === 'landscape') {
      [width, height] = [height, width];
    }
    
    return { width, height };
  }
  
  static generateElementId(): string {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static isElementOverlapping(element1: DesignElement, element2: DesignElement): boolean {
    const e1 = element1.position;
    const e2 = element2.position;
    
    return !(e1.x + e1.width <= e2.x || 
             e2.x + e2.width <= e1.x || 
             e1.y + e1.height <= e2.y || 
             e2.y + e2.height <= e1.y);
  }
  
  static optimizeElementLayout(elements: DesignElement[]): DesignElement[] {
    // Simple optimization: sort by position for better rendering
    return elements.sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });
  }
}