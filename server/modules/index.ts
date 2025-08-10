/**
 * MÓDULOS DO SISTEMA - CLEAN ARCHITECTURE
 * 
 * Este arquivo centraliza todos os módulos seguindo o padrão Clean Architecture:
 * - Domain: Entidades, regras de negócio, interfaces
 * - Application: Use cases, serviços de aplicação, DTOs
 * - Infrastructure: Repositórios, serviços externos
 * - Presentation: Controllers, rotas
 */

// Clean Architecture Module Exports
export * from './auth';
export * from './beneficiaries';
export * from './customers';
export * from './dashboard';
export * from './knowledge-base';
export * from './materials-services';
export * from './notifications';
export * from './people';
export * from './saas-admin';
export * from './schedule-management';
export * from './shared';
export * from './technical-skills';
export * from './timecard';
export * from './tickets';

// Shared infrastructure
export * from './shared/infrastructure/repositories/indexRepository';

console.log('✅ Todos os módulos Clean Architecture carregados com sucesso');