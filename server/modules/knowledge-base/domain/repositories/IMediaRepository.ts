// Domain layer interface - no external dependencies

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
  uploadMedia(tenantId: string, mediaData: any): Promise<any>;
  getMediaLibrary(tenantId: string): Promise<any[]>;
  getMediaById(tenantId: string, mediaId: string): Promise<any>;
  deleteMedia(tenantId: string, mediaId: string): Promise<boolean>;
  updateMedia(tenantId: string, mediaId: string, data: any): Promise<any>;
}
