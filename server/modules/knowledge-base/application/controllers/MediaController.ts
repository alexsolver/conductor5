import { Request, Response } from 'express';
import { MediaService } from '../services/MediaService';
import { IMediaRepository } from '../../domain/ports/IMediaRepository';
import { MediaRepository } from '../../infrastructure/repositories/MediaRepository';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';

export class MediaController {
  private mediaService: MediaService;

  constructor() {
    this.mediaService = new MediaService(new MediaRepository());
  }

  // Get media statistics
  async getMediaStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      const stats = await this.mediaService.getMediaStats(tenantId);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching media stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch media stats' });
    }
  }

  // Get media files with filters
  async getMediaFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      const { folder, search, type, page = 1, limit = 50 } = req.query;
      
      const filters = {
        folderId: folder as string || undefined,
        searchQuery: search as string || undefined,
        type: type as string || undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const files = await this.mediaService.getMediaFiles(tenantId, filters);
      res.json({ success: true, data: files });
    } catch (error) {
      console.error('Error fetching media files:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch media files' });
    }
  }

  // Get media folders
  async getMediaFolders(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      const folders = await this.mediaService.getMediaFolders(tenantId);
      res.json({ success: true, data: folders });
    } catch (error) {
      console.error('Error fetching media folders:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch media folders' });
    }
  }

  // Upload media files
  async uploadMediaFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files provided' });
      }

      const { folderId, tags, description } = req.body;
      
      const uploadData = {
        files: req.files,
        folderId: folderId || null,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        description: description || null,
        uploadedBy: userId
      };

      const uploadedFiles = await this.mediaService.uploadFiles(tenantId, uploadData);
      res.status(201).json({ success: true, data: uploadedFiles });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ success: false, message: 'Failed to upload files' });
    }
  }

  // Create media folder
  async createMediaFolder(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { name, description, color, parentId } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, message: 'Folder name is required' });
      }

      const folderData = {
        name,
        description: description || null,
        color: color || '#3B82F6',
        parentId: parentId || null,
        createdBy: userId
      };

      const folder = await this.mediaService.createFolder(tenantId, folderData);
      res.status(201).json({ success: true, data: folder });
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ success: false, message: 'Failed to create folder' });
    }
  }

  // Delete media file
  async deleteMediaFile(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({ success: false, message: 'File ID is required' });
      }

      await this.mediaService.deleteFile(tenantId, fileId);
      res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ success: false, message: 'Failed to delete file' });
    }
  }

  // Update media file
  async updateMediaFile(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      const { fileId } = req.params;
      const { name, description, tags, folderId } = req.body;
      
      if (!fileId) {
        return res.status(400).json({ success: false, message: 'File ID is required' });
      }

      const updateData = {
        name,
        description,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : undefined,
        folderId
      };

      const updatedFile = await this.mediaService.updateFile(tenantId, fileId, updateData);
      res.json({ success: true, data: updatedFile });
    } catch (error) {
      console.error('Error updating file:', error);
      res.status(500).json({ success: false, message: 'Failed to update file' });
    }
  }

  // Generate thumbnail
  async generateThumbnail(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({ success: false, message: 'File ID is required' });
      }

      const thumbnail = await this.mediaService.generateThumbnail(tenantId, fileId);
      res.json({ success: true, data: thumbnail });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      res.status(500).json({ success: false, message: 'Failed to generate thumbnail' });
    }
  }

  // Get 3D models
  async get3DModels(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      // Mock 3D models data
      const models = [
        {
          id: '3d_model_1',
          name: 'Equipamento Industrial',
          description: 'Modelo 3D de equipamento para treinamento técnico',
          fileUrl: '/api/media/3d/equipment_industrial.obj',
          thumbnailUrl: '/api/media/thumbnails/equipment_thumb.jpg',
          type: 'obj',
          size: 2480000,
          vertexCount: 12540,
          faceCount: 8320,
          animations: ['idle', 'operation', 'maintenance'],
          materials: ['metal_base', 'plastic_cover', 'rubber_seal'],
          tags: ['equipamento', 'industrial', 'treinamento'],
          createdAt: new Date().toISOString()
        },
        {
          id: '3d_model_2',
          name: 'Componente Eletrônico',
          description: 'Modelo detalhado de componente eletrônico',
          fileUrl: '/api/media/3d/electronic_component.fbx',
          thumbnailUrl: '/api/media/thumbnails/electronic_thumb.jpg',
          type: 'fbx',
          size: 1850000,
          vertexCount: 8940,
          faceCount: 6120,
          animations: ['assembly', 'disassembly'],
          materials: ['pcb_green', 'metal_contact', 'ceramic'],
          tags: ['eletrônico', 'componente', 'técnico'],
          createdAt: new Date().toISOString()
        }
      ];

      res.json({ success: true, data: models });
    } catch (error) {
      console.error('Error fetching 3D models:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch 3D models' });
    }
  }

  // Get interactive diagrams
  async getInteractiveDiagrams(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      // Mock interactive diagrams data
      const diagrams = [
        {
          id: 'diagram_1',
          name: 'Fluxograma de Processo',
          description: 'Diagrama interativo do processo de atendimento',
          type: 'flowchart',
          elements: [
            {
              id: 'start',
              type: 'rectangle',
              x: 50,
              y: 50,
              width: 120,
              height: 60,
              color: '#E3F2FD',
              borderColor: '#1976D2',
              borderWidth: 2,
              text: 'Início do Atendimento',
              interactive: true,
              tooltip: 'Clique para ver detalhes do processo inicial'
            }
          ],
          interactions: [
            {
              elementId: 'start',
              action: 'click',
              content: 'Processo inicial de recepção do cliente'
            }
          ],
          createdAt: new Date().toISOString()
        }
      ];

      res.json({ success: true, data: diagrams });
    } catch (error) {
      console.error('Error fetching diagrams:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch diagrams' });
    }
  }

  // Get video streaming data
  async getVideoStreaming(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant ID required' });
      }

      const { videoId } = req.params;

      // Mock video streaming data
      const videoData = {
        id: videoId || 'video_1',
        title: 'Treinamento Técnico Avançado',
        description: 'Vídeo educacional sobre procedimentos técnicos',
        src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
        poster: '/api/media/thumbnails/video_poster.jpg',
        duration: 480,
        chapters: [
          {
            id: 'ch1',
            title: 'Introdução',
            startTime: 0,
            endTime: 60,
            thumbnail: '/api/media/thumbnails/ch1.jpg'
          },
          {
            id: 'ch2',
            title: 'Procedimentos Básicos',
            startTime: 60,
            endTime: 180,
            thumbnail: '/api/media/thumbnails/ch2.jpg'
          },
          {
            id: 'ch3',
            title: 'Procedimentos Avançados',
            startTime: 180,
            endTime: 360,
            thumbnail: '/api/media/thumbnails/ch3.jpg'
          },
          {
            id: 'ch4',
            title: 'Conclusão',
            startTime: 360,
            endTime: 480,
            thumbnail: '/api/media/thumbnails/ch4.jpg'
          }
        ],
        subtitles: [
          {
            id: 'pt-br',
            label: 'Português (Brasil)',
            language: 'pt-BR',
            src: '/api/media/subtitles/video_ptbr.vtt'
          },
          {
            id: 'en',
            label: 'English',
            language: 'en',
            src: '/api/media/subtitles/video_en.vtt'
          }
        ],
        videoTracks: [
          {
            id: 'track_auto',
            label: 'Auto',
            quality: 'Auto',
            resolution: 'Adaptável',
            bitrate: 0
          },
          {
            id: 'track_1080p',
            label: '1080p HD',
            quality: '1080p',
            resolution: '1920x1080',
            bitrate: 5000000
          },
          {
            id: 'track_720p',
            label: '720p HD',
            quality: '720p',
            resolution: '1280x720',
            bitrate: 2500000
          },
          {
            id: 'track_480p',
            label: '480p',
            quality: '480p',
            resolution: '854x480',
            bitrate: 1000000
          }
        ],
        interactiveElements: [
          {
            id: 'element_1',
            title: 'Dica Importante',
            x: 25,
            y: 15,
            startTime: 30,
            endTime: 45,
            content: 'Lembre-se sempre de verificar os equipamentos de segurança'
          },
          {
            id: 'element_2',
            title: 'Procedimento Crítico',
            x: 75,
            y: 80,
            startTime: 120,
            endTime: 140,
            content: 'Este é um ponto crítico do processo - atenção especial necessária'
          }
        ],
        tags: ['treinamento', 'técnico', 'procedimentos'],
        createdAt: new Date().toISOString()
      };

      res.json({ success: true, data: videoData });
    } catch (error) {
      console.error('Error fetching video data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch video data' });
    }
  }
}