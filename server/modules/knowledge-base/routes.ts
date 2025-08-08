import express from 'express';
import { MediaController } from './application/controllers/MediaController';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import multer from 'multer';
import path from 'path';
import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { knowledgeBaseArticles, knowledgeBaseCategories, knowledgeBaseFiles } from '../../../shared/schema-master';
import { eq, and, like, desc, sql } from 'drizzle-orm';

const router = express.Router();
const mediaController = new MediaController();

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

// GET /api/knowledge-base/articles
router.get('/knowledge-base/articles', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { category, search, status = 'published' } = req.query;

    let query = db
      .select({
        id: knowledgeBaseArticles.id,
        title: knowledgeBaseArticles.title,
        content: knowledgeBaseArticles.content,
        categoryId: knowledgeBaseArticles.categoryId,
        status: knowledgeBaseArticles.status,
        tags: knowledgeBaseArticles.tags,
        viewCount: knowledgeBaseArticles.viewCount,
        isPublic: knowledgeBaseArticles.isPublic,
        createdAt: knowledgeBaseArticles.createdAt,
        updatedAt: knowledgeBaseArticles.updatedAt
      })
      .from(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.tenantId, tenantId),
        eq(knowledgeBaseArticles.isActive, true)
      ))
      .orderBy(desc(knowledgeBaseArticles.updatedAt));

    if (status) {
      query = query.where(and(
        eq(knowledgeBaseArticles.tenantId, tenantId),
        eq(knowledgeBaseArticles.status, status as string),
        eq(knowledgeBaseArticles.isActive, true)
      ));
    }

    if (category) {
      query = query.where(and(
        eq(knowledgeBaseArticles.tenantId, tenantId),
        eq(knowledgeBaseArticles.categoryId, category as string),
        eq(knowledgeBaseArticles.isActive, true)
      ));
    }

    if (search) {
      query = query.where(and(
        eq(knowledgeBaseArticles.tenantId, tenantId),
        like(knowledgeBaseArticles.title, `%${search}%`),
        eq(knowledgeBaseArticles.isActive, true)
      ));
    }

    const articles = await query;
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// POST /api/knowledge-base/articles
router.post('/knowledge-base/articles', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const authorId = req.user!.id;
    const validatedData = createArticleSchema.parse(req.body);

    const newArticle = await db.insert(knowledgeBaseArticles).values({
      tenantId,
      authorId,
      ...validatedData
    }).returning();

    res.status(201).json(newArticle[0]);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// GET /api/knowledge-base/categories
router.get('/knowledge-base/categories', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const categories = await db
      .select()
      .from(knowledgeBaseCategories)
      .where(and(
        eq(knowledgeBaseCategories.tenantId, tenantId),
        eq(knowledgeBaseCategories.isActive, true)
      ))
      .orderBy(knowledgeBaseCategories.displayOrder);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/knowledge-base/categories
router.post('/knowledge-base/categories', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedData = createCategorySchema.parse(req.body);

    const newCategory = await db.insert(knowledgeBaseCategories).values({
      tenantId,
      ...validatedData
    }).returning();

    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// GET /api/knowledge-base/articles/:id
router.get('/knowledge-base/articles/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const article = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.id, id),
        eq(knowledgeBaseArticles.tenantId, tenantId),
        eq(knowledgeBaseArticles.isActive, true)
      ))
      .limit(1);

    if (article.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Incrementar visualizações
    await db
      .update(knowledgeBaseArticles)
      .set({ 
        viewCount: sql`${knowledgeBaseArticles.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(knowledgeBaseArticles.id, id));

    res.json(article[0]);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

export default router;