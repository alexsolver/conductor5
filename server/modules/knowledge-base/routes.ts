// Knowledge Base Microservice Routes
import { Router } from "express";
import { isAuthenticated } from "../../replitAuth";
import { storage } from "../../storage";

const knowledgeBaseRouter = Router();

// Get all knowledge base articles
knowledgeBaseRouter.get('/articles', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const category = req.query.category as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Mock knowledge base articles for now
    let articles = [
      {
        id: '1',
        title: 'How to Create a Support Ticket',
        content: 'Step-by-step guide to creating support tickets...',
        category: 'getting-started',
        tags: ['tickets', 'basics'],
        author: 'Support Team',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        views: 245,
        helpful: 23,
        notHelpful: 2
      },
      {
        id: '2',
        title: 'Account Settings and Profile Management',
        content: 'Learn how to manage your account settings...',
        category: 'account',
        tags: ['account', 'settings'],
        author: 'Support Team',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12'),
        views: 189,
        helpful: 18,
        notHelpful: 1
      },
      {
        id: '3',
        title: 'Troubleshooting Login Issues',
        content: 'Common solutions for login and authentication problems...',
        category: 'troubleshooting',
        tags: ['login', 'authentication', 'troubleshooting'],
        author: 'Technical Team',
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
        views: 156,
        helpful: 14,
        notHelpful: 3
      },
      {
        id: '4',
        title: 'API Documentation and Integration Guide',
        content: 'Complete guide to using our REST API...',
        category: 'developers',
        tags: ['api', 'integration', 'developers'],
        author: 'Developer Team',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-07'),
        views: 98,
        helpful: 12,
        notHelpful: 0
      }
    ];

    // Apply filters
    if (category) {
      articles = articles.filter(article => article.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);

    res.json({
      articles: paginatedArticles,
      pagination: {
        page,
        limit,
        total: articles.length,
        totalPages: Math.ceil(articles.length / limit)
      },
      filters: { category, search }
    });
  } catch (error) {
    console.error("Error fetching knowledge base articles:", error);
    res.status(500).json({ message: "Failed to fetch articles" });
  }
});

// Get article by ID
knowledgeBaseRouter.get('/articles/:id', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Mock article data
    const articles = {
      '1': {
        id: '1',
        title: 'How to Create a Support Ticket',
        content: `# How to Create a Support Ticket

Creating a support ticket is the best way to get help with any issues you're experiencing. Follow these steps:

## Step 1: Navigate to the Support Section
- Click on the "Support" or "Help" button in your dashboard
- Select "Create New Ticket" from the options

## Step 2: Fill in the Details
- **Subject**: Write a clear, descriptive subject line
- **Description**: Provide detailed information about your issue
- **Priority**: Select the appropriate priority level
- **Category**: Choose the most relevant category

## Step 3: Attach Files (Optional)
- Add screenshots or documents that help explain your issue
- Supported formats: PDF, PNG, JPG, DOC, DOCX

## Step 4: Submit Your Ticket
- Review all information for accuracy
- Click "Submit Ticket"
- You'll receive a confirmation email with your ticket number

## What Happens Next?
- Our support team will review your ticket
- You'll receive updates via email
- Average response time: 2-4 hours during business hours

## Tips for Better Support
- Be specific about the problem
- Include error messages if any
- Mention what you were trying to do when the issue occurred`,
        category: 'getting-started',
        tags: ['tickets', 'basics'],
        author: 'Support Team',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        views: 245,
        helpful: 23,
        notHelpful: 2
      }
    };

    const article = articles[req.params.id as keyof typeof articles];
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Increment view count (in real implementation, this would update the database)
    article.views += 1;

    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ message: "Failed to fetch article" });
  }
});

// Get knowledge base categories
knowledgeBaseRouter.get('/categories', isAuthenticated, async (req: any, res) => {
  try {
    const categories = [
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Basic guides and tutorials for new users',
        articleCount: 8,
        icon: 'rocket'
      },
      {
        id: 'account',
        name: 'Account Management',
        description: 'Profile settings, billing, and account security',
        articleCount: 12,
        icon: 'user'
      },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Common issues and their solutions',
        articleCount: 15,
        icon: 'wrench'
      },
      {
        id: 'developers',
        name: 'For Developers',
        description: 'API documentation and integration guides',
        articleCount: 6,
        icon: 'code'
      },
      {
        id: 'billing',
        name: 'Billing & Plans',
        description: 'Subscription management and billing information',
        articleCount: 9,
        icon: 'credit-card'
      }
    ];

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Search knowledge base
knowledgeBaseRouter.get('/search', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Mock search results
    const searchResults = [
      {
        id: '1',
        title: 'How to Create a Support Ticket',
        excerpt: 'Step-by-step guide to creating support tickets...',
        category: 'getting-started',
        relevance: 0.95
      },
      {
        id: '3',
        title: 'Troubleshooting Login Issues',
        excerpt: 'Common solutions for login and authentication problems...',
        category: 'troubleshooting',
        relevance: 0.87
      }
    ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.excerpt.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    res.json({
      query,
      results: searchResults,
      totalResults: searchResults.length
    });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    res.status(500).json({ message: "Failed to search articles" });
  }
});

// Rate article helpfulness
knowledgeBaseRouter.post('/articles/:id/rate', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { helpful } = req.body;
    const articleId = req.params.id;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({ message: "Rating must be a boolean value" });
    }

    // In real implementation, this would update the database
    // For now, just return success
    res.json({ 
      message: "Rating recorded successfully",
      articleId,
      helpful
    });
  } catch (error) {
    console.error("Error rating article:", error);
    res.status(500).json({ message: "Failed to record rating" });
  }
});

export { knowledgeBaseRouter };