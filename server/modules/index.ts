/**
 * MÓDULOS DO SISTEMA - CLEAN ARCHITECTURE
 * 
 * Este arquivo centraliza todos os módulos seguindo o padrão Clean Architecture:
 * - Domain: Entidades, regras de negócio, interfaces
 * - Application: Use cases, serviços de aplicação, DTOs
 * - Infrastructure: Repositórios, serviços externos
 * - Presentation: Controllers, rotas
 */

// Clean Architecture compliant module exports
export * from './auth/routes';
export * from './beneficiaries/routes';
export * from './customers/routes';
export * from './dashboard/routes';
export * from './field-layouts/routes';
export * from './knowledge-base/routes';
export * from './locations/routes';
export * from './materials-services/routes';
export * from './notifications/routes';
export * from './people/routes';
export * from './saas-admin/routes';
export * from './schedule-management/routes';
export * from './technical-skills/routes';
export * from './tickets/routes';
export * from './timecard/routes';

// Shared infrastructure
export * from './shared/infrastructure/repositories/indexRepository';

console.log('✅ Todos os módulos Clean Architecture carregados com sucesso');