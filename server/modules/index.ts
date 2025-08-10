
/**
 * MÓDULOS DO SISTEMA - CLEAN ARCHITECTURE
 * 
 * Este arquivo centraliza todos os módulos seguindo o padrão Clean Architecture:
 * - Domain: Entidades, regras de negócio, interfaces
 * - Application: Use cases, serviços de aplicação, DTOs
 * - Infrastructure: Repositórios, serviços externos
 * - Presentation: Controllers, rotas
 */

// Auth Module
export * from './auth/domain/entities/User';
export * from './auth/application/services/AuthApplicationService';
export * from './auth/infrastructure/repositories/DrizzleUserRepository';

// Beneficiaries Module
export * from './beneficiaries/domain/entities/Beneficiary';
export * from './beneficiaries/application/services/BeneficiaryApplicationService';
export * from './beneficiaries/infrastructure/repositories/DrizzleBeneficiaryRepository';

// Customers Module  
export * from './customers/domain/entities/Customer';
export * from './customers/application/services/CustomerApplicationService';
export * from './customers/infrastructure/repositories/CustomerRepository';

// Dashboard Module
export * from './dashboard/domain/entities/DashboardMetric';
export * from './dashboard/application/services/DashboardApplicationService';
export * from './dashboard/infrastructure/repositories/DrizzleDashboardRepository';

// Knowledge Base Module
export * from './knowledge-base/domain/entities/KnowledgeBaseEntry';
export * from './knowledge-base/application/services/KnowledgeBaseApplicationService';
export * from './knowledge-base/infrastructure/repositories/KnowledgeBaseRepository';

// Materials Services Module
export * from './materials-services/domain/entities/Material';
export * from './materials-services/application/services/MaterialApplicationService';
export * from './materials-services/infrastructure/repositories/DrizzleMaterialRepository';

// Notifications Module
export * from './notifications/domain/entities/Notification';
export * from './notifications/application/services/NotificationApplicationService';
export * from './notifications/infrastructure/repositories/DrizzleNotificationRepository';

// People Module
export * from './people/domain/entities/Person';
export * from './people/application/services/PersonApplicationService';
export * from './people/infrastructure/repositories/DrizzlePersonRepository';

// Schedule Management Module
export * from './schedule-management/domain/entities/ScheduleEntity';
export * from './schedule-management/application/services/ScheduleApplicationService';
export * from './schedule-management/infrastructure/repositories/DrizzleScheduleRepository';

// Shared Module
export * from './shared/domain/entities/BaseEntity';
export * from './shared/application/services/BaseApplicationService';
export * from './shared/infrastructure/repositories/BaseRepository';

// Technical Skills Module
export * from './technical-skills/domain/entities/Skill';
export * from './technical-skills/application/services/SkillApplicationService';
export * from './technical-skills/infrastructure/repositories/DrizzleSkillRepository';

// Tickets Module
export * from './tickets/domain/entities/Ticket';
export * from './tickets/application/services/TicketApplicationService';
export * from './tickets/infrastructure/repositories/DrizzleTicketRepository';

// Timecard Module
export * from './timecard/domain/entities/TimecardEntity';
export * from './timecard/application/services/TimecardApplicationService';
export * from './timecard/infrastructure/repositories/DrizzleTimecardRepository';

console.log('✅ Todos os módulos Clean Architecture carregados com sucesso');
