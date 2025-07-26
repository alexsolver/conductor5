import express from 'express';
import { MediaController } from './application/controllers/MediaController';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import multer from 'multer';
import path from 'path';

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

// Knowledge Base Categories Routes
router.get('/categories', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    // Mock data for Knowledge Base categories with realistic content
    const categories = [
      {
        id: 'cat_001',
        name: 'Procedimentos Operacionais',
        slug: 'procedimentos-operacionais',
        description: 'Guias e procedimentos para operações diárias',
        icon: 'Settings',
        color: '#3B82F6',
        level: 1,
        isActive: true,
        articleCount: 28,
        lastUpdated: '2025-01-25T10:30:00Z'
      },
      {
        id: 'cat_002',
        name: 'Solução de Problemas',
        slug: 'solucao-problemas',
        description: 'Troubleshooting e resolução de issues técnicos',
        icon: 'AlertTriangle',
        color: '#F59E0B',
        level: 1,
        isActive: true,
        articleCount: 45,
        lastUpdated: '2025-01-24T16:15:00Z'
      },
      {
        id: 'cat_003',
        name: 'Políticas e Normas',
        slug: 'politicas-normas',
        description: 'Documentação de políticas internas e normas regulatórias',
        icon: 'Shield',
        color: '#10B981',
        level: 1,
        isActive: true,
        articleCount: 18,
        lastUpdated: '2025-01-23T09:45:00Z'
      },
      {
        id: 'cat_004',
        name: 'Treinamento e Capacitação',
        slug: 'treinamento-capacitacao',
        description: 'Materiais de treinamento e desenvolvimento',
        icon: 'GraduationCap',
        color: '#8B5CF6',
        level: 1,
        isActive: true,
        articleCount: 32,
        lastUpdated: '2025-01-22T14:20:00Z'
      },
      {
        id: 'cat_005',
        name: 'Equipamentos e Ativos',
        slug: 'equipamentos-ativos',
        description: 'Manuais e documentação técnica de equipamentos',
        icon: 'Wrench',
        color: '#EF4444',
        level: 1,
        isActive: true,
        articleCount: 24,
        lastUpdated: '2025-01-21T11:10:00Z'
      }
    ];

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// Knowledge Base Articles Routes
router.get('/articles', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    const { category, search, status = 'published', page = 1, limit = 20 } = req.query;

    // Mock data for Knowledge Base articles with comprehensive content
    const articles = [
      {
        id: 'art_001',
        title: 'Como Criar um Ticket de Suporte',
        slug: 'como-criar-ticket-suporte',
        summary: 'Guia completo para criar tickets de suporte de forma eficiente e organizada',
        content: `# Como Criar um Ticket de Suporte

## Introdução
Este guia explica como criar tickets de suporte no sistema Conductor de forma eficiente.

## Passo a Passo

### 1. Acesso ao Sistema
- Faça login no sistema Conductor
- Navegue até a seção "Tickets"
- Clique em "Novo Ticket"

### 2. Preenchimento dos Dados
- **Título**: Seja específico e claro
- **Descrição**: Detalhe o problema ou solicitação
- **Prioridade**: Selecione conforme a urgência
- **Categoria**: Escolha a categoria apropriada

### 3. Anexos e Evidências
- Adicione screenshots quando necessário
- Inclua logs de erro se aplicável
- Anexe arquivos relevantes

### 4. Finalização
- Revise todas as informações
- Clique em "Criar Ticket"
- Acompanhe o status pelo painel

## Boas Práticas
- Use títulos descritivos
- Forneça contexto suficiente
- Seja objetivo na descrição
- Anexe evidências quando possível`,
        status: 'published',
        type: 'tutorial',
        difficulty: 'beginner',
        estimatedReadTime: 5,
        viewCount: 324,
        likeCount: 28,
        averageRating: 4.5,
        ratingCount: 18,
        tags: ['tickets', 'suporte', 'tutorial', 'iniciante'],
        publishedAt: '2025-01-20T10:00:00Z',
        createdAt: '2025-01-19T15:30:00Z',
        updatedAt: '2025-01-20T10:00:00Z',
        categoryId: 'cat_001',
        authorId: 'user_123',
        category: {
          id: 'cat_001',
          name: 'Procedimentos Operacionais',
          slug: 'procedimentos-operacionais',
          color: '#3B82F6',
          icon: 'Settings'
        },
        author: {
          id: 'user_123',
          name: 'João Silva',
          avatar: '/api/avatars/joao_silva.jpg'
        },
        attachments: [
          {
            id: 'att_001',
            name: 'ticket_creation_screenshot.png',
            type: 'image',
            url: '/api/media/attachments/ticket_creation_screenshot.png',
            size: 245600
          }
        ]
      },
      {
        id: 'art_002',
        title: 'Configurações de Notificação do Sistema',
        slug: 'configuracoes-notificacao-sistema',
        summary: 'Aprenda a personalizar suas preferências de notificação para otimizar sua experiência',
        content: `# Configurações de Notificação do Sistema

## Visão Geral
As notificações do sistema podem ser personalizadas conforme suas necessidades e preferências.

## Tipos de Notificação

### Email
- Tickets atribuídos
- Atualizações de status
- Lembretes de SLA

### Push Notifications
- Mensagens urgentes
- Alterações críticas
- Alertas em tempo real

### SMS
- Emergências
- Falhas críticas do sistema
- Confirmações importantes

## Como Configurar

### 1. Acesso às Configurações
1. Clique no seu avatar no canto superior direito
2. Selecione "Configurações"
3. Vá para a aba "Notificações"

### 2. Configuração por Tipo
- **Email**: Defina frequência e tipos
- **Push**: Ative/desative por categoria
- **SMS**: Configure apenas para urgências

### 3. Horários de Funcionamento
- Defina seu horário de trabalho
- Configure modo "Não Perturbe"
- Estabeleça exceções para emergências

## Recomendações
- Mantenha apenas notificações essenciais ativas
- Use email para atualizações não urgentes
- Reserve SMS apenas para emergências`,
        status: 'published',
        type: 'howto',
        difficulty: 'intermediate',
        estimatedReadTime: 8,
        viewCount: 156,
        likeCount: 19,
        averageRating: 4.2,
        ratingCount: 12,
        tags: ['notificações', 'configuração', 'personalização'],
        publishedAt: '2025-01-18T14:30:00Z',
        createdAt: '2025-01-17T10:15:00Z',
        updatedAt: '2025-01-18T14:30:00Z',
        categoryId: 'cat_001',
        authorId: 'user_456',
        category: {
          id: 'cat_001',
          name: 'Procedimentos Operacionais',
          slug: 'procedimentos-operacionais',
          color: '#3B82F6',
          icon: 'Settings'
        },
        author: {
          id: 'user_456',
          name: 'Maria Santos',
          avatar: '/api/avatars/maria_santos.jpg'
        }
      },
      {
        id: 'art_003',
        title: 'Resolução de Problemas de Conectividade',
        slug: 'resolucao-problemas-conectividade',
        summary: 'Guia prático para diagnosticar e resolver problemas de conectividade no sistema',
        content: `# Resolução de Problemas de Conectividade

## Diagnóstico Inicial

### Verificações Básicas
1. **Status da Conexão**
   - Verifique se há acesso à internet
   - Teste outros sites/serviços
   - Confirme status do servidor

2. **Configurações de Rede**
   - Verifique configurações de proxy
   - Confirme DNS
   - Teste conectividade direta

### Ferramentas de Diagnóstico
- Ping para teste básico
- Traceroute para rastreamento
- Nslookup para DNS
- Telnet para portas específicas

## Problemas Comuns

### Timeout de Conexão
**Sintomas**: Página não carrega, erro de timeout
**Soluções**:
- Verificar firewall
- Testar conectividade de rede
- Confirmar configurações de proxy

### Erro de DNS
**Sintomas**: "Servidor não encontrado"
**Soluções**:
- Limpar cache DNS
- Configurar DNS alternativo
- Verificar configurações de rede

### Problemas de SSL/TLS
**Sintomas**: Erro de certificado
**Soluções**:
- Verificar data/hora do sistema
- Atualizar certificados
- Verificar configurações de segurança

## Escalação
Se os problemas persistem:
1. Documentar todos os testes realizados
2. Coletar logs relevantes
3. Criar ticket para equipe de TI
4. Incluir evidências do diagnóstico`,
        status: 'published',
        type: 'troubleshooting',
        difficulty: 'advanced',
        estimatedReadTime: 12,
        viewCount: 89,
        likeCount: 15,
        averageRating: 4.7,
        ratingCount: 8,
        tags: ['conectividade', 'rede', 'troubleshooting', 'diagnóstico'],
        publishedAt: '2025-01-16T11:45:00Z',
        createdAt: '2025-01-15T16:20:00Z',
        updatedAt: '2025-01-16T11:45:00Z',
        categoryId: 'cat_002',
        authorId: 'user_789',
        category: {
          id: 'cat_002',
          name: 'Solução de Problemas',
          slug: 'solucao-problemas',
          color: '#F59E0B',
          icon: 'AlertTriangle'
        },
        author: {
          id: 'user_789',
          name: 'Carlos Oliveira',
          avatar: '/api/avatars/carlos_oliveira.jpg'
        }
      }
    ];

    // Apply filters
    let filteredArticles = articles;

    if (category) {
      filteredArticles = filteredArticles.filter(article => article.categoryId === category);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (status !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.status === status);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    res.json({ 
      success: true, 
      data: paginatedArticles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredArticles.length,
        pages: Math.ceil(filteredArticles.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch articles' });
  }
});

// Get single article
router.get('/articles/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    const { id } = req.params;

    // Mock single article data (would be fetched from database)
    const article = {
      id: id,
      title: 'Como Criar um Ticket de Suporte',
      slug: 'como-criar-ticket-suporte',
      summary: 'Guia completo para criar tickets de suporte de forma eficiente e organizada',
      content: `# Como Criar um Ticket de Suporte

## Introdução
Este guia explica como criar tickets de suporte no sistema Conductor de forma eficiente.

## Passo a Passo

### 1. Acesso ao Sistema
- Faça login no sistema Conductor
- Navegue até a seção "Tickets"
- Clique em "Novo Ticket"

### 2. Preenchimento dos Dados
- **Título**: Seja específico e claro
- **Descrição**: Detalhe o problema ou solicitação
- **Prioridade**: Selecione conforme a urgência
- **Categoria**: Escolha a categoria apropriada

### 3. Anexos e Evidências
- Adicione screenshots quando necessário
- Inclua logs de erro se aplicável
- Anexe arquivos relevantes

### 4. Finalização
- Revise todas as informações
- Clique em "Criar Ticket"
- Acompanhe o status pelo painel

## Boas Práticas
- Use títulos descritivos
- Forneça contexto suficiente
- Seja objetivo na descrição
- Anexe evidências quando possível`,
      status: 'published',
      type: 'tutorial',
      difficulty: 'beginner',
      estimatedReadTime: 5,
      viewCount: 324,
      likeCount: 28,
      averageRating: 4.5,
      ratingCount: 18,
      tags: ['tickets', 'suporte', 'tutorial', 'iniciante'],
      publishedAt: '2025-01-20T10:00:00Z',
      createdAt: '2025-01-19T15:30:00Z',
      updatedAt: '2025-01-20T10:00:00Z',
      categoryId: 'cat_001',
      authorId: 'user_123',
      category: {
        id: 'cat_001',
        name: 'Procedimentos Operacionais',
        slug: 'procedimentos-operacionais',
        color: '#3B82F6',
        icon: 'Settings'
      },
      author: {
        id: 'user_123',
        name: 'João Silva',
        avatar: '/api/avatars/joao_silva.jpg'
      },
      attachments: [
        {
          id: 'att_001',
          name: 'ticket_creation_screenshot.png',
          type: 'image',
          url: '/api/media/attachments/ticket_creation_screenshot.png',
          size: 245600
        }
      ],
      relatedArticles: [
        {
          id: 'art_002',
          title: 'Configurações de Notificação do Sistema',
          slug: 'configuracoes-notificacao-sistema'
        }
      ]
    };

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch article' });
  }
});

// Create article
router.post('/articles', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { title, summary, content, categoryId, type, difficulty, tags, estimatedReadTime } = req.body;

    if (!title || !content || !categoryId) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    // Generate slug
    const slug = title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const newArticle = {
      id: `art_${Date.now()}`,
      title,
      slug,
      summary: summary || '',
      content,
      status: 'draft',
      type: type || 'article',
      difficulty: difficulty || 'beginner',
      estimatedReadTime: estimatedReadTime || 5,
      viewCount: 0,
      likeCount: 0,
      averageRating: 0,
      ratingCount: 0,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
      categoryId,
      authorId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, data: newArticle });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ success: false, message: 'Failed to create article' });
  }
});

// Create category
router.post('/categories', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { name, description, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Generate slug
    const slug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const newCategory = {
      id: `cat_${Date.now()}`,
      name,
      slug,
      description: description || '',
      icon: icon || 'Folder',
      color: color || '#3B82F6',
      level: 1,
      isActive: true,
      articleCount: 0,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// Search knowledge base
router.get('/search', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { q, category, type } = req.query;
    
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant ID required' });
    }

    // Mock search results based on query
    const searchResults = [
      {
        id: 'art_001',
        title: 'Como Criar um Ticket de Suporte',
        summary: 'Guia completo para criar tickets de suporte de forma eficiente',
        type: 'tutorial',
        category: 'Procedimentos Operacionais',
        categoryColor: '#3B82F6',
        relevanceScore: 95,
        excerpt: 'Este guia explica como criar tickets de suporte no sistema Conductor...',
        url: '/knowledge-base/articles/art_001',
        tags: ['tickets', 'suporte', 'tutorial']
      },
      {
        id: 'art_003',
        title: 'Resolução de Problemas de Conectividade',
        summary: 'Guia prático para diagnosticar e resolver problemas de conectividade',
        type: 'troubleshooting',
        category: 'Solução de Problemas',
        categoryColor: '#F59E0B',
        relevanceScore: 87,
        excerpt: 'Diagnóstico inicial para verificações básicas de conectividade...',
        url: '/knowledge-base/articles/art_003',
        tags: ['conectividade', 'rede', 'troubleshooting']
      }
    ];

    res.json({ success: true, data: searchResults });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({ success: false, message: 'Failed to search knowledge base' });
  }
});

export default router;