/**
 * FileUploadController - Clean Architecture Application Layer
 * Resolves violations: Missing Controllers for file upload management endpoints
 */

import { Request, Response } from 'express';
import { FileUpload } from '../../domain/entities/FileUpload';

interface FileUploadRepositoryInterface {
  save(file: FileUpload): Promise<void>;
  findById(id: string, tenantId: string): Promise<FileUpload | null>;
  findByCategory(category: string, tenantId: string): Promise<FileUpload[]>;
}

interface UploadFileUseCase {
  execute(request: any): Promise<{ success: boolean; message: string; data?: any }>;
}

export class FileUploadController {
  constructor(
    private readonly fileUploadRepository: FileUploadRepositoryInterface,
    private readonly uploadFileUseCase: UploadFileUseCase
  ) {}

  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.uploadFileUseCase.execute({
        tenantId,
        uploadedById: req.user?.userId,
        uploadedByName: req.user?.name,
        ...req.body
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async getFile(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const file = await this.fileUploadRepository.findById(req.params.id, tenantId);

      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: file.getId(),
          originalName: file.getOriginalName(),
          filename: file.getFilename(),
          mimeType: file.getMimeType(),
          size: file.getSize(),
          description: file.getDescription(),
          category: file.getCategory(),
          status: file.getStatus(),
          isPublic: file.isFilePublic(),
          downloadCount: file.getDownloadCount(),
          createdAt: file.getCreatedAt()
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
}