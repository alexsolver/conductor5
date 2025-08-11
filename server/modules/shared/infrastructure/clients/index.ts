/**
 * Shared Infrastructure Clients
 * Clean Architecture - Infrastructure Layer
 * Common external service clients used across multiple bounded contexts
 */

export interface IEmailClient {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  sendTemplatedEmail(to: string, templateId: string, data: Record<string, any>): Promise<boolean>;
}

export interface INotificationClient {
  sendNotification(userId: string, message: string, type: 'info' | 'warning' | 'error'): Promise<boolean>;
  sendBulkNotification(userIds: string[], message: string, type: 'info' | 'warning' | 'error'): Promise<boolean>;
}

export interface IFileStorageClient {
  uploadFile(filename: string, content: Buffer, tenantId: string): Promise<string>;
  downloadFile(fileId: string, tenantId: string): Promise<Buffer>;
  deleteFile(fileId: string, tenantId: string): Promise<boolean>;
  getFileUrl(fileId: string, tenantId: string): Promise<string>;
}

export interface IExternalAPIClient {
  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T>;
  post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T>;
  put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T>;
  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T>;
}