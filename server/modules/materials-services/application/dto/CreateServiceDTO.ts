/**
 * Create Service DTO
 * Clean Architecture - Application Layer
 */

export interface CreateServiceDTO {
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  cost?: number;
  estimatedDuration?: number; // in minutes
  skillsRequired?: string[];
  specifications?: Record<string, any>;
}