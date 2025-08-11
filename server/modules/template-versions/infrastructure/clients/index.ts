/**
 * Template Versions Infrastructure Clients
 * Clean Architecture - Infrastructure Layer
 */

export interface ITemplateVersionClient {
  validateTemplate(template: any): Promise<{ valid: boolean; errors: string[] }>;
  compileTemplate(template: any): Promise<string>;
  previewTemplate(template: any, data: Record<string, any>): Promise<string>;
}