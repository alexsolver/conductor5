// =====================================================
// GMAIL SERVICE
// Real Gmail integration for fetching emails using IMAP
// =====================================================

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { schemaManager } from '../../../db';
import { sql } from 'drizzle-orm';

interface GmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface ActiveConnection {
  imap: Imap;
  config: GmailConfig;
  lastActivity: Date;
}

export class GmailService {
  private static instance: GmailService;
  private activeConnections: Map<string, ActiveConnection> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  async testConnection(config: GmailConfig): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing Gmail IMAP connection to ${config.host}:${config.port}`);

      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: {
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method'
        },
        authTimeout: 5000,
        connTimeout: 10000,
        keepalive: false
      });

      return new Promise((resolve) => {
        let resolved = false;

        imap.once('ready', () => {
          if (!resolved) {
            resolved = true;
            const latency = Date.now() - startTime;
            console.log(`✅ Gmail IMAP test successful in ${latency}ms`);

            // Close the connection immediately after test
            imap.end();

            resolve({
              success: true,
              latency
            });
          }
        });

        imap.once('error', (err: any) => {
          if (!resolved) {
            resolved = true;
            console.error(`❌ Gmail IMAP test failed:`, err.message);
            resolve({
              success: false,
              error: err.message || 'Connection failed'
            });
          }
        });

        imap.once('end', () => {
          console.log(`📪 Gmail IMAP test connection closed`);
        });

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.error(`⏰ Gmail IMAP test timeout after 10 seconds`);
            imap.end();
            resolve({
              success: false,
              error: 'Connection timeout'
            });
          }
        }, 10000);

        try {
          imap.connect();
        } catch (error) {
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Connection failed'
            });
          }
        }
      });
    } catch (error) {
      console.error('Error in Gmail test connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection setup failed'
      };
    }
  }

  async connectToGmail(tenantId: string, config: GmailConfig): Promise<boolean> {
    try {
      console.log(`🔄 Connecting to Gmail for tenant: ${tenantId}`);

      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: {
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method',
          servername: config.host
        },
        authTimeout: 30000,
        connTimeout: 30000
      });

      return new Promise((resolve, reject) => {
        let resolved = false;

        imap.once('ready', () => {
          if (!resolved) {
            resolved = true;
            this.activeConnections.set(tenantId, { imap, config, lastActivity: new Date() });
            console.log(`✅ Gmail connected successfully for tenant: ${tenantId}`);
            resolve(true);
          }
        });

        imap.once('error', (err: any) => {
          if (!resolved) {
            resolved = true;
            console.error(`❌ Gmail connection failed for tenant ${tenantId}:`, err.message);
            this.activeConnections.delete(tenantId); // Remove from active connections on error
            reject(err);
          }
        });

        imap.once('end', () => {
          this.activeConnections.delete(tenantId);
          console.log(`📪 Gmail connection ended for tenant: ${tenantId}`);
        });

        try {
          imap.connect();
        } catch (error) {
          if (!resolved) {
            resolved = true;
            this.activeConnections.delete(tenantId); // Remove from active connections on error
            reject(error);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up Gmail connection:', error);
      return false;
    }
  }

  async startEmailMonitoring(tenantId: string, channelId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`📧 Starting Gmail monitoring for tenant: ${tenantId}, channel: ${channelId}`);

      const gmailConfig = await this.getGmailConfig(tenantId);

      console.log(`📧 Gmail Connection Config:`, {
        user: gmailConfig.user,
        host: gmailConfig.host,
        port: gmailConfig.port,
        tls: gmailConfig.tls,
        hasPassword: !!gmailConfig.password
      });

      const connected = await this.connectToGmail(tenantId, gmailConfig);

      if (!connected) {
        return {
          success: false,
          message: 'Failed to connect to Gmail IMAP'
        };
      }

      // Start fetching emails
      await this.fetchRecentEmails(tenantId, channelId);

      return {
        success: true,
        message: 'Gmail monitoring started successfully'
      };
    } catch (error) {
      console.error('Error starting Gmail monitoring:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start monitoring'
      };
    }
  }

  async stopEmailMonitoring(tenantId: string): Promise<void> {
    console.log(`🛑 [GMAIL-SERVICE] Stopping email monitoring for tenant: ${tenantId}`);

    const connection = this.activeConnections.get(tenantId);
    if (connection) {
      try {
        connection.imap.end();
        this.activeConnections.delete(tenantId);
        console.log(`✅ [GMAIL-SERVICE] Email monitoring stopped for tenant: ${tenantId}`);
      } catch (error) {
        console.error(`❌ [GMAIL-SERVICE] Error stopping email monitoring:`, error);
      }
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus() {
    return {
      activeConnections: this.activeConnections.size,
      tenants: Array.from(this.activeConnections.keys()),
      connections: Array.from(this.activeConnections.entries()).map(([tenantId, conn]) => ({
        tenantId,
        email: conn.config.user,
        host: conn.config.host,
        connected: conn.imap.state === 'connected',
        lastActivity: conn.lastActivity || new Date()
      }))
    };
  }

  async fetchRecentEmails(tenantId: string, channelId: string): Promise<void> {
    const connection = this.activeConnections.get(tenantId);
    const imap = connection?.imap;

    if (!imap) {
      console.log(`❌ No Gmail connection found for tenant: ${tenantId}`);
      return;
    }

    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err: any, box: any) => {
        if (err) {
          console.error(`❌ Error opening inbox for tenant ${tenantId}:`, err);
          connection.lastActivity = new Date(); // Update last activity even on error
          reject(err);
          return;
        }

        console.log(`📧 Fetching recent emails from inbox (${box.messages.total} total) for tenant ${tenantId}`);

        // Fetch last 50 messages
        const searchCriteria = ['ALL'];
        const fetchOptions = {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)',
          struct: true
        };

        imap.search(searchCriteria, (err: any, results: number[]) => {
          if (err) {
            console.error(`❌ Error searching emails for tenant ${tenantId}:`, err);
            connection.lastActivity = new Date();
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log(`📪 No emails found for tenant ${tenantId}`);
            connection.lastActivity = new Date();
            resolve();
            return;
          }

          // Get the last 20 emails
          const recentResults = results.slice(-20);
          console.log(`📬 Processing ${recentResults.length} recent emails for tenant ${tenantId}`);

          const f = imap.fetch(recentResults, fetchOptions);
          const emails: any[] = [];

          f.on('message', (msg: any, seqno: number) => {
            const email: any = { seqno };

            msg.on('body', (stream: any, info: any) => {
              let buffer = Buffer.alloc(0);
              stream.on('data', (chunk: Buffer) => {
                buffer = Buffer.concat([buffer, chunk]);
              });

              stream.once('end', () => {
                try {
                  const headers = Imap.parseHeader(buffer.toString());
                  email.headers = headers;
                } catch (headerError) {
                  console.error(`❌ Error parsing email headers for seqno ${seqno}:`, headerError);
                }
              });
            });

            msg.once('attributes', (attrs: any) => {
              email.attributes = attrs;
            });

            msg.once('end', () => {
              emails.push(email);
            });
          });

          f.once('error', (err: any) => {
            console.error('Error fetching messages:', err);
            connection.lastActivity = new Date();
            reject(err);
          });

          f.once('end', async () => {
            console.log(`✅ Fetched ${emails.length} emails, processing for tenant ${tenantId}...`);
            await this.processEmails(tenantId, channelId, emails);
            connection.lastActivity = new Date(); // Update last activity after processing
            resolve();
          });
        });
      });
    });
  }

  private async processEmails(tenantId: string, channelId: string, emails: any[]): Promise<void> {
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      let processedEmails = 0;

      for (const email of emails) {
        try {
          const headers = email.headers || {};
          const messageId = headers['message-id'] ? headers['message-id'][0] : `gmail-${Date.now()}-${Math.random()}`;

          const from = headers.from ? headers.from[0] : 'unknown@gmail.com';
          const to = headers.to ? headers.to[0] : 'alexsolver@gmail.com';
          const subject = headers.subject ? headers.subject[0] : '(No Subject)';
          const date = headers.date ? new Date(headers.date[0]) : new Date();

          // Filter old emails (temporarily allowing 2019+ for testing)
          if (date.getFullYear() < 2019) {
            console.log(`⏭️ Skipping very old email from ${date.getFullYear()}: ${subject}`);
            continue;
          }

          // Show which year we're processing
          console.log(`📅 Processing email from ${date.getFullYear()}: ${subject}`);

          // Extract email address from "Name <email>" format
          const fromMatch = from.match(/<(.+?)>/) || [null, from];
          const fromEmail = fromMatch[1] || from;
          const fromName = from.replace(/<.*>/, '').trim().replace(/"/g, '') || null;

          // Detect priority based on keywords
          let priority = 'medium';
          const subjectLower = subject.toLowerCase();
          if (subjectLower.includes('urgente') || subjectLower.includes('emergencia') || subjectLower.includes('crítico')) {
            priority = 'high';
          } else if (subjectLower.includes('baixa') || subjectLower.includes('info') || subjectLower.includes('fyi')) {
            priority = 'low';
          }

          // Extract actual email body content
          const emailBody = email.text || email.html || `Email received via Gmail IMAP Integration\n\nFrom: ${from}\nTo: ${to}\nDate: ${date.toISOString()}\n\nSubject: ${subject}\n\nThis is a real email message captured from Gmail.`;

          // ✅ CRITICAL FIX: Use MessageIngestionService para garantir que chegue no OmniBridge inbox
          try {
            const { MessageIngestionService } = await import('../../../modules/omnibridge/infrastructure/services/MessageIngestionService');
            const { DrizzleMessageRepository } = await import('../../../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository');
            const { ProcessMessageUseCase } = await import('../../../modules/omnibridge/application/use-cases/ProcessMessageUseCase');

            const messageRepository = new DrizzleMessageRepository();
            const processMessageUseCase = new ProcessMessageUseCase(messageRepository);
            const ingestionService = new MessageIngestionService(messageRepository, processMessageUseCase);

            // Preparar dados para ingestão no OmniBridge
            const incomingMessage = {
              channelId: 'imap-email',
              channelType: 'email' as const,
              from: fromEmail,
              to: to,
              subject: subject,
              content: emailBody,
              metadata: {
                messageId: messageId,
                originalMessageId: messageId,
                fromName: fromName,
                date: date.toISOString(),
                headers: headers,
                hasAttachments: Boolean(email.attachments?.length),
                gmailProcessed: true,
                imapProcessed: true,
                rawFrom: from,
                rawTo: to,
                emailProcessedAt: new Date().toISOString(),
                imapServer: this.activeConnections.get(tenantId)?.config?.host || 'unknown',
                ingestionSource: 'gmail-imap-service'
              },
              priority: priority as any,
              tenantId
            };

            console.log(`🎯 [GMAIL-SERVICE] Ingesting email for ${fromEmail} into OmniBridge:`);
            console.log(`📧 [GMAIL-SERVICE] Subject: ${subject}`);
            console.log(`📧 [GMAIL-SERVICE] From: ${fromEmail} -> To: ${to}`);
            console.log(`📧 [GMAIL-SERVICE] Date: ${date.toISOString()}`);
            console.log(`📧 [GMAIL-SERVICE] Content preview: ${emailBody.substring(0, 200)}...`);

            const savedMessage = await ingestionService.ingestMessage(incomingMessage);
            console.log(`✅ [GMAIL-SERVICE] Email ingested successfully with ID: ${savedMessage.id}`);
            console.log(`💾 [GMAIL-SERVICE] Message saved to tenant: ${tenantId}, table: omnibridge_messages`);

            // 🤖 CRITICAL: Process automation rules after ingestion
            if (processMessageUseCase) {
              try {
                console.log(`🤖 [GMAIL-SERVICE] Triggering automation rules for message ${savedMessage.id}`);
                const automationResult = await processMessageUseCase.processDirectMessage(
                  {
                    id: savedMessage.id,
                    content: emailBody,
                    sender: fromEmail,
                    subject: subject,
                    channel: 'email',
                    timestamp: date.toISOString(),
                    metadata: incomingMessage.metadata
                  }, 
                  tenantId
                );
                console.log(`✅ [GMAIL-SERVICE] Automation result:`, automationResult);
              } catch (automationError) {
                console.error(`❌ [GMAIL-SERVICE] Automation processing failed:`, automationError);
              }
            }

            processedEmails++;

          } catch (ingestionError) {
            console.error(`❌ [GMAIL-SERVICE] Failed to ingest email via OmniBridge service:`, ingestionError);

            // Fallback: Insert directly into inbox table using the omnibridge_messages table
            try {
              const { schemaManager } = await import('../../../db');
              const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);

              await tenantDb.execute(sql`
                INSERT INTO omnibridge_messages (
                  id, channel_id, channel_type, "from", "to", subject, 
                  content, status, priority, metadata, tenant_id, 
                  received_at, created_at, updated_at
                ) VALUES (
                  ${messageId}, 'imap-email', 'email', ${fromEmail}, ${to}, ${subject},
                  ${emailBody}, 'unread', ${priority}, 
                  ${JSON.stringify({
                    messageId,
                    fromName,
                    date: date.toISOString(),
                    headers: headers,
                    hasAttachments: Boolean(email.attachments?.length),
                    fallbackInsert: true,
                    rawFrom: from,
                    rawTo: to
                  })},
                  ${tenantId}, ${date}, NOW(), NOW()
                ) ON CONFLICT (id) DO NOTHING
              `);

              console.log(`✅ [GMAIL-SERVICE] Email saved via fallback method to omnibridge_messages: ${subject}`);
              processedEmails++;
            } catch (fallbackError) {
              console.error(`❌ [GMAIL-SERVICE] Fallback insert also failed:`, fallbackError);
            }
          }
        } catch (error) {
          console.error('Error processing individual email:', error);
        }
      }
    } catch (error) {
      console.error('Error processing emails batch:', error);
    }
  }

  private async getGmailConfig(tenantId: string): Promise<GmailConfig> {
    try {
      const { storage } = await import('../../storage-simple');
      const integration = await storage.getIntegrationByType(tenantId, 'imap');

      if (!integration || !integration.config) {
        console.error(`❌ [GMAIL-CONFIG] No IMAP integration found for tenant: ${tenantId}`);
        throw new Error('Gmail integration not configured');
      }

      // Validate required fields
      if (!integration.config.user || !integration.config.password) {
        console.error(`❌ [GMAIL-CONFIG] Missing credentials for tenant: ${tenantId}`);
        throw new Error('Gmail credentials not configured');
      }

      const config = {
        user: integration.config.user,
        password: integration.config.password,
        host: integration.config.host || 'imap.gmail.com',
        port: integration.config.port || 993,
        tls: integration.config.tls !== false
      };

      console.log(`📧 [GMAIL-CONFIG] Configuration loaded for tenant ${tenantId}:`, {
        user: config.user,
        host: config.host,
        port: config.port,
        tls: config.tls,
        hasPassword: !!config.password
      });

      return config;
    } catch (error) {
      console.error(`❌ [GMAIL-CONFIG] Error getting Gmail config for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  isConnected(tenantId: string): boolean {
    return this.activeConnections.has(tenantId);
  }

  async startPeriodicSync(tenantId: string, channelId: string, intervalMinutes: number = 5): Promise<void> {
    console.log(`🔄 Starting periodic Gmail sync every ${intervalMinutes} minutes for tenant: ${tenantId}`);

    // Initial sync
    await this.startEmailMonitoring(tenantId, channelId);

    // Set up periodic sync
    const intervalId = setInterval(async () => {
      try {
        console.log(`📧 Running periodic Gmail sync for tenant: ${tenantId}`);
        const result = await this.startEmailMonitoring(tenantId, channelId);
        if (!result.success) {
          console.error(`❌ Periodic sync failed for tenant ${tenantId}: ${result.message}`);
        }
      } catch (error) {
        console.error('Error in periodic Gmail sync:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Store interval ID for cleanup
    if (!this.syncIntervals) {
      this.syncIntervals = new Map();
    }
    this.syncIntervals.set(tenantId, intervalId);
  }

  async stopPeriodicSync(tenantId: string): Promise<void> {
    if (this.syncIntervals && this.syncIntervals.has(tenantId)) {
      clearInterval(this.syncIntervals.get(tenantId));
      this.syncIntervals.delete(tenantId);
      console.log(`⏹️ Stopped periodic sync for tenant: ${tenantId}`);
    }
  }
}