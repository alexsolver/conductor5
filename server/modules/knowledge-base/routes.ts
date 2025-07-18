// Knowledge Base Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { storage } from "../../storage";

const knowledgeBaseRouter = Router();

// Get all knowledge base articles with pagination and filtering
knowledgeBaseRouter.get('/articles', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Fetch articles from database - NO MORE MOCK DATA!
    const articles = await storage.getKnowledgeBaseArticles(
      req.user.tenantId,
      { category, search, limit, offset }
    );

    // Apply filters if provided
    const category = req.query.category as string;
    const search = req.query.search as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get categories from database
    const categories = await storage.getKnowledgeBaseCategories(req.user.tenantId);

    res.json({
      articles: articles,
      pagination: {
        total: articles.length,
        limit,
        offset,
        hasMore: articles.length >= limit
      },
      categories: categories
    });
  } catch (error) {
    console.error("Error fetching knowledge base articles:", error);
    res.status(500).json({ message: "Failed to fetch articles" });
  }
});

// Get specific article by ID
knowledgeBaseRouter.get('/articles/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const articleId = req.params.id;
    
    // Mock article content (in real implementation, fetch from database)
    const articles = {
      "1": {
        id: "1",
        title: "Getting Started with Conductor",
        content: `# Getting Started with Conductor

Conductor is a comprehensive customer support platform designed to streamline your support operations.

## Key Features

- **Ticket Management**: Create, assign, and track support tickets
- **Customer Database**: Maintain detailed customer profiles
- **Knowledge Base**: Build and manage your support documentation
- **Analytics**: Monitor performance with detailed dashboards

## First Steps

1. Set up your tenant and invite team members
2. Configure ticket workflows and priorities
3. Import your existing customer data
4. Create your first knowledge base articles

## Need Help?

Contact our support team or check out our other guides for more detailed information.`,
        category: "Getting Started",
        tags: ["basics", "introduction"],
        author: "Support Team",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 1250,
        helpful: 42,
        notHelpful: 3
      }
    };

    const article = articles[articleId as keyof typeof articles];
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json(article);
  } catch (error) {
    console.error("Error fetching knowledge base article:", error);
    res.status(500).json({ message: "Failed to fetch article" });
  }
});

// Search articles
knowledgeBaseRouter.get('/search', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // This would be implemented with full-text search in a real database
    const searchResults = [
      {
        id: "1",
        title: "Getting Started with Conductor",
        excerpt: "Learn the basics of using Conductor for customer support.",
        relevance: 0.95
      },
      {
        id: "2", 
        title: "Managing Customer Tickets",
        excerpt: "Complete guide to creating, updating, and resolving tickets.",
        relevance: 0.85
      }
    ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.excerpt.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      query,
      results: searchResults,
      total: searchResults.length
    });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    res.status(500).json({ message: "Failed to search articles" });
  }
});

export { knowledgeBaseRouter };