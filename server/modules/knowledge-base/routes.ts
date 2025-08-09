import express from 'express';
import { MediaController } from './application/controllers/MediaController';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import multer from 'multer';
import path from 'path';
import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db';
// Tabelas do Knowledge Base agora ativas
import { knowledgeBaseArticles, knowledgeBaseCategories, knowledgeBaseFiles } from '../../../shared/schema-master';
import { eq, and, like, desc, sql } from 'drizzle-orm';
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
router.get('/knowledge-base/articles', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    const { search, categoryId, status } = req.query;

    let conditions = [eq(knowledgeBaseArticles.tenantId, tenantId)];

    if (search) {
      conditions.push(like(knowledgeBaseArticles.title, `%${search}%`));
    }

    if (categoryId) {
      conditions.push(eq(knowledgeBaseArticles.categoryId, categoryId as string));
    }

    if (status) {
      conditions.push(eq(knowledgeBaseArticles.status, status as string));
    }

    const articles = await db.select().from(knowledgeBaseArticles)
      .where(and(...conditions))
      .orderBy(desc(knowledgeBaseArticles.createdAt));

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// POST /api/knowledge-base/articles - Criar novo artigo
router.post('/knowledge-base/articles', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = createArticleSchema.parse(req.body);

    const [article] = await db.insert(knowledgeBaseArticles).values({
      title: validatedData.title,
      content: validatedData.content || '',
      categoryId: validatedData.categoryId || null,
      status: validatedData.status || 'draft',
      tags: validatedData.tags || [],
      isPublic: validatedData.isPublic || false,
      richContent: validatedData.richContent || null,
      searchKeywords: validatedData.searchKeywords || null,
      tenantId,
      authorId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// GET /api/knowledge-base/categories - Buscar categorias
router.get('/knowledge-base/categories', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    const categories = await db.select().from(knowledgeBaseCategories)
      .where(and(
        eq(knowledgeBaseCategories.tenantId, tenantId),
        eq(knowledgeBaseCategories.isActive, true)
      ))
      .orderBy(knowledgeBaseCategories.name);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/knowledge-base/categories - Criar nova categoria
router.post('/knowledge-base/categories', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    const validatedData = createCategorySchema.parse(req.body);

    const [category] = await db.insert(knowledgeBaseCategories).values({
      name: validatedData.name,
      description: validatedData.description || null,
      parentId: validatedData.parentId || null,
      icon: validatedData.icon || null,
      color: validatedData.color || '#3b82f6',
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// GET /api/knowledge-base/articles/:id - Buscar artigo específico
router.get('/knowledge-base/articles/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    const { id } = req.params;

    const [article] = await db.select().from(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.id, id),
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Incrementar contador de visualizações
    await db.update(knowledgeBaseArticles)
      .set({
        viewCount: sql`${knowledgeBaseArticles.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(knowledgeBaseArticles.id, id));

    res.json({
      ...article,
      viewCount: (article.viewCount || 0) + 1
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Example route that was previously in the router but should now be handled by a controller
// router.get('/entries', async (req, res) => {
//   const db = drizzle(process.env.DATABASE_URL);
//   const entries = await db.select().from(knowledgeBaseEntries);
//   res.json(entries);
// });

// Using controllers following Clean Architecture
router.get('/entries', jwtAuth, knowledgeBaseController.getEntries.bind(knowledgeBaseController));


export default router;