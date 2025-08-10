export interface IMediaRepository {
  upload(file: any, tenantId: string): Promise<string>;
  delete(fileId: string): Promise<void>;
  findByTenant(tenantId: string): Promise<string[]>;
  getFileInfo(fileId: string): Promise<{ name: string; size: number; type: string } | null>;
}