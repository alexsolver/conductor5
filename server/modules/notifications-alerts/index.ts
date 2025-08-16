// NOTIFICATIONS & ALERTS MODULE - Clean Architecture Entry Point
// Main module export following Clean Architecture patterns

import { NotificationModule } from './infrastructure/NotificationModule';

// Export the module instance
export const notificationsModule = NotificationModule.getInstance();

// Export domain types for external use
export type { NotificationEntity } from './domain/entities/Notification';
export type { INotificationRepository } from './domain/repositories/INotificationRepository';

// Export application interfaces for external integration
export type { CreateNotificationRequest, CreateNotificationResponse } from './application/use-cases/CreateNotificationUseCase';
export type { GetNotificationsRequest, GetNotificationsResponse } from './application/use-cases/GetNotificationsUseCase';
export type { ProcessNotificationResponse } from './application/use-cases/ProcessNotificationUseCase';

// Export controller for manual route registration if needed
export { NotificationsController } from './application/controllers/NotificationsController';

// Initialize and export the module
console.log('🏗️ [NOTIFICATIONS-ALERTS] Initializing Clean Architecture module...');

// Start background processing automatically
notificationsModule.startBackgroundProcessor();

console.log('✅ [NOTIFICATIONS-ALERTS] Module fully initialized with Clean Architecture');

export default notificationsModule;