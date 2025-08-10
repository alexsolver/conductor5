export interface IMediaRepository {
  getMediaStats(tenantId: string): Promise<any>;
  getMediaFiles(tenantId: string, filters?: any): Promise<any[]>;
  getMediaFolders(tenantId: string): Promise<any[]>;
  uploadMediaFiles(tenantId: string, files: any[]): Promise<any[]>;
  createMediaFolder(tenantId: string, folderData: any): Promise<any>;
  deleteMediaFile(tenantId: string, fileId: string): Promise<boolean>;
  updateMediaFile(tenantId: string, fileId: string, updateData: any): Promise<any>;
  generateThumbnail(tenantId: string, fileId: string): Promise<any>;
  get3DModels(tenantId: string): Promise<any[]>;
  getInteractiveDiagrams(tenantId: string): Promise<any[]>;
  getVideoStreaming(tenantId: string, videoId?: string): Promise<any>;
}
export interface IMediaRepository {
  findById(id: string, tenantId: string): Promise<any | null>;
  findAll(tenantId: string): Promise<any[]>;
  create(media: any): Promise<any>;
  update(id: string, media: any, tenantId: string): Promise<any | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<any[]>;
}
export interface IMediaRepository {
  findById(id: string, tenantId: string): Promise<MediaEntity | null>;
  findAll(tenantId: string): Promise<MediaEntity[]>;
  create(entity: MediaEntity): Promise<MediaEntity>;
  update(id: string, entity: Partial<MediaEntity>, tenantId: string): Promise<MediaEntity | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByType(type: string, tenantId: string): Promise<MediaEntity[]>;
  getStats(tenantId: string): Promise<any>;
}

interface MediaEntity {
  id: string;
  tenantId: string;
  type: string;
  url: string;
  name: string;
  size?: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  tenantId: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface IMediaRepository {
  upload(file: MediaFile): Promise<MediaFile>;
  findById(id: string): Promise<MediaFile | null>;
  findByTenant(tenantId: string): Promise<MediaFile[]>;
  delete(id: string): Promise<void>;
  findByType(mimeType: string): Promise<MediaFile[]>;
}
