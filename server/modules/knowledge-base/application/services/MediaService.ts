import { MediaRepository } from '../../infrastructure/repositories/MediaRepository';

export interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  type: 'image' | 'video' | 'audio' | 'document' | '3d_model' | 'diagram';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  tags: string[];
  description?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  folderId?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  createdAt: string;
  fileCount: number;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  imageCount: number;
  videoCount: number;
  audioCount: number;
  documentCount: number;
  model3DCount: number;
  diagramCount: number;
}

export interface MediaFilters {
  folderId?: string;
  searchQuery?: string;
  type?: string;
  page: number;
  limit: number;
}

export interface UploadData {
  files: Express.Multer.File[];
  folderId?: string;
  tags: string[];
  description?: string;
  uploadedBy: string;
}

export interface FolderData {
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  createdBy: string;
}

export class MediaService {
  constructor(private mediaRepository: MediaRepository) {}

  async getMediaStats(tenantId: string): Promise<MediaStats> {
    return this.mediaRepository.getMediaStats(tenantId);
  }

  async getMediaFiles(tenantId: string, filters: MediaFilters): Promise<MediaFile[]> {
    return this.mediaRepository.getMediaFiles(tenantId, filters);
  }

  async getMediaFolders(tenantId: string): Promise<MediaFolder[]> {
    return this.mediaRepository.getMediaFolders(tenantId);
  }

  async uploadFiles(tenantId: string, uploadData: UploadData): Promise<MediaFile[]> {
    // Process and validate files
    const processedFiles = uploadData.files.map(file => ({
      ...file,
      type: this.getFileType(file.mimetype),
      tags: uploadData.tags,
      description: uploadData.description,
      folderId: uploadData.folderId
    }));

    return this.mediaRepository.uploadFiles(tenantId, processedFiles, uploadData.uploadedBy);
  }

  async createFolder(tenantId: string, folderData: FolderData): Promise<MediaFolder> {
    return this.mediaRepository.createFolder(tenantId, folderData);
  }

  async deleteFile(tenantId: string, fileId: string): Promise<void> {
    return this.mediaRepository.deleteFile(tenantId, fileId);
  }

  async updateFile(tenantId: string, fileId: string, updateData: Partial<MediaFile>): Promise<MediaFile> {
    return this.mediaRepository.updateFile(tenantId, fileId, updateData);
  }

  async generateThumbnail(tenantId: string, fileId: string): Promise<string> {
    return this.mediaRepository.generateThumbnail(tenantId, fileId);
  }

  private getFileType(mimeType: string): MediaFile['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('model') || mimeType.includes('3d')) return '3d_model';
    return 'document';
  }
}