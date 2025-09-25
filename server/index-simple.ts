import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { db } from "./db";
import { users, customers, tickets, tenants } from "@shared/schema";

const app = express();

// Basic middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple API routes
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.select().from(tenants).limit(1);
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const result = await db.select().from(customers).limit(10);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const result = await db.select().from(tickets).limit(10);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Serve static files in production
if (process.env.NODE_ENV !== 'development') {
  app.use(express.static('dist/client'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/client/index.html'));
  });
}

const port = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);

  // Start Gmail sync scheduler for active tenants
  try {
    const scheduler = GmailSyncScheduler.getInstance();

    // Wait a bit for server to be fully ready, then start syncing
    setTimeout(async () => {
      console.log('🚀 Starting Gmail sync scheduler...');
      await scheduler.startForAllActiveTenants();
    }, 5000);
  } catch (error) {
    console.error('Failed to start Gmail sync scheduler:', error);
  }
});

// Enhanced server stability
server.keepAliveTimeout = 60000;
server.headersTimeout = 60000;
server.timeout = 60000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

export default app;