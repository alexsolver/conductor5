import express from 'express';
import { MediaController } from './application/controllers/MediaController';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import multer from 'multer';
import path from 'path';
import { Router, Response } from 'express';
import { z } from 'zod';
// Removed direct database imports - routes should only handle HTTP concerns
import { KnowledgeBaseController } from './application/controllers/KnowledgeBaseController';

const router = express.Router();
const mediaController = new MediaController();
const knowledgeBaseController = new KnowledgeBaseController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/media/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Accept all common media and document types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'model/obj', 'model/fbx', 'model/dae', 'model/gltf+json', 'model/stl'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'));
    }
  }
});

// Media Library Routes
router.get('/media/stats', jwtAuth, mediaController.getMediaStats.bind(mediaController));
router.get('/media/files', jwtAuth, mediaController.getMediaFiles.bind(mediaController));
router.get('/media/folders', jwtAuth, mediaController.getMediaFolders.bind(mediaController));
router.post('/media/upload', jwtAuth, upload.array('files', 10), mediaController.uploadMediaFiles.bind(mediaController));
router.post('/media/folders', jwtAuth, mediaController.createMediaFolder.bind(mediaController));
router.delete('/media/files/:fileId', jwtAuth, mediaController.deleteMediaFile.bind(mediaController));
router.put('/media/files/:fileId', jwtAuth, mediaController.updateMediaFile.bind(mediaController));
router.post('/media/files/:fileId/thumbnail', jwtAuth, mediaController.generateThumbnail.bind(mediaController));

// Visual Resources Routes
router.get('/3d-models', jwtAuth, mediaController.get3DModels.bind(mediaController));
router.get('/diagrams', jwtAuth, mediaController.getInteractiveDiagrams.bind(mediaController));
router.get('/videos/:videoId?', jwtAuth, mediaController.getVideoStreaming.bind(mediaController));

// ---- Knowledge Base Routes ----

// Validação para artigos
const createArticleSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  richContent: z.any().optional(),
  searchKeywords: z.string().optional()
});

// Validação para categorias
const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  displayOrder: z.number().default(0),
  icon: z.string().max(50).optional(),
  color: z.string().max(7).default('#3b82f6')
});

// GET /api/knowledge-base/articles - Buscar artigos
router.get('/knowledge-base/articles', jwtAuth, knowledgeBaseController.getArticles.bind(knowledgeBaseController));

// POST /api/knowledge-base/articles - Criar novo artigo
router.post('/knowledge-base/articles', jwtAuth, knowledgeBaseController.createArticle.bind(knowledgeBaseController));

// GET /api/knowledge-base/categories - Buscar categorias
router.get('/knowledge-base/categories', jwtAuth, knowledgeBaseController.getCategories.bind(knowledgeBaseController));

// POST /api/knowledge-base/categories - Criar nova categoria
router.post('/knowledge-base/categories', jwtAuth, knowledgeBaseController.createCategory.bind(knowledgeBaseController));

// GET /api/knowledge-base/articles/:id - Buscar artigo específico
router.get('/knowledge-base/articles/:id', jwtAuth, knowledgeBaseController.getArticleById.bind(knowledgeBaseController));

// Routes limpas - usando controllers já instanciado acima

router.get('/entries', jwtAuth, knowledgeBaseController.getEntries.bind(knowledgeBaseController));
router.get('/entries/:id', jwtAuth, knowledgeBaseController.getEntry.bind(knowledgeBaseController));
router.post('/entries', jwtAuth, knowledgeBaseController.createEntry.bind(knowledgeBaseController));
router.put('/entries/:id', jwtAuth, knowledgeBaseController.updateEntry.bind(knowledgeBaseController));
router.delete('/entries/:id', jwtAuth, knowledgeBaseController.deleteEntry.bind(knowledgeBaseController));

export default router;