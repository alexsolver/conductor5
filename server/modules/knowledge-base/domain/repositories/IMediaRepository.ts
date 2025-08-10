
export interface IMediaRepository {
  upload(file: any, tenantId: string): Promise<string>;
  delete(fileId: string): Promise<void>;
  getUrl(fileId: string): Promise<string>;
}
