
import { schemaManager } from '../db';
import * as Imap from 'imap';
import { sql } from 'drizzle-orm';

interface GmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface EmailMessage {
  messageId: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  receivedDate: Date;
  headers: any;
}

export class GmailRealService {
  private static instance: GmailRealService;
  private imapConnections: Map<string, Imap> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): GmailRealService {
    if (!GmailRealService.instance) {
      GmailRealService.instance = new GmailRealService();
    }
    return GmailRealService.instance;
  }

  async testGmailConnection(tenantId: string): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testing Gmail IMAP connection for tenant: ${tenantId}`);
      
      // Get real Gmail credentials from integrations
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      const integrationResult = await tenantDb.execute(sql`
        SELECT config FROM integrations 
        WHERE (id = 'imap-email' OR name = 'IMAP Email') 
        AND status = 'connected' 
        LIMIT 1
      `);
      
      if (integrationResult.rows.length === 0) {
        return {
          success: false,
          error: 'IMAP Email integration not found or not configured'
        };
      }

      const config = JSON.parse(integrationResult.rows[0].config as string);
      
      const gmailConfig: GmailConfig = {
        user: config.emailAddress || config.username || 'alexsolver@gmail.com',
        password: config.password || process.env.GMAIL_APP_PASSWORD,
        host: config.imapServer || config.serverHost || 'imap.gmail.com',
        port: parseInt(config.imapPort || config.serverPort || '993'),
        tls: config.imapSecurity === 'SSL/TLS' || config.useSSL !== false
      };

      console.log(`📧 Testing connection to ${gmailConfig.host}:${gmailConfig.port} for ${gmailConfig.user}`);

      const testResult = await this.testImapConnection(gmailConfig);
      
      if (testResult.success) {
        const latency = Date.now() - startTime;
        console.log(`✅ Gmail IMAP test successful in ${latency}ms`);
        return {
          success: true,
          latency
        };
      } else {
        console.error(`❌ Gmail IMAP test failed: ${testResult.error}`);
        return testResult;
      }
    } catch (error) {
      console.error('Error testing Gmail connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  private async testImapConnection(config: GmailConfig): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        authTimeout: 10000,
        connTimeout: 15000,
        keepalive: false
      });

      let resolved = false;

      imap.once('ready', () => {
        if (!resolved) {
          resolved = true;
          imap.end();
          resolve({ success: true });
        }
      });

      imap.once('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: err.message || 'IMAP connection failed'
          });
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          imap.end();
          resolve({
            success: false,
            error: 'Connection timeout'
          });
        }
      }, 15000);

      try {
        imap.connect();
      } catch (error) {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Connection setup failed'
          });
        }
      }
    });
  }

  async startGmailMonitoring(tenantId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📧 Starting Gmail monitoring for tenant: ${tenantId}, channel: ${channelId}`);
      
      // Stop existing monitoring if running
      this.stopGmailMonitoring(tenantId);

      // Get Gmail configuration
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      const integrationResult = await tenantDb.execute(sql`
        SELECT config FROM integrations 
        WHERE (id = 'imap-email' OR name = 'IMAP Email') 
        AND status = 'connected' 
        LIMIT 1
      `);
      
      if (integrationResult.rows.length === 0) {
        return {
          success: false,
          message: 'IMAP Email integration not found'
        };
      }

      const config = JSON.parse(integrationResult.rows[0].config as string);
      
      const gmailConfig: GmailConfig = {
        user: config.emailAddress || config.username || 'alexsolver@gmail.com',
        password: config.password || process.env.GMAIL_APP_PASSWORD,
        host: config.imapServer || config.serverHost || 'imap.gmail.com',
        port: parseInt(config.imapPort || config.serverPort || '993'),
        tls: config.imapSecurity === 'SSL/TLS' || config.useSSL !== false
      };

      // Test connection first
      const testResult = await this.testImapConnection(gmailConfig);
      if (!testResult.success) {
        return {
          success: false,
          message: `Connection failed: ${testResult.error}`
        };
      }

      // Fetch initial emails immediately
      await this.fetchAndSyncEmails(tenantId, channelId, gmailConfig);

      // Set up periodic monitoring every 30 seconds
      const interval = setInterval(async () => {
        try {
          await this.fetchAndSyncEmails(tenantId, channelId, gmailConfig);
        } catch (error) {
          console.error(`Error in periodic email sync for tenant ${tenantId}:`, error);
        }
      }, 30000);

      this.monitoringIntervals.set(tenantId, interval);

      console.log(`✅ Gmail monitoring started successfully for tenant: ${tenantId}`);
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

  async stopGmailMonitoring(tenantId: string): Promise<void> {
    try {
      console.log(`📪 Stopping Gmail monitoring for tenant: ${tenantId}`);
      
      // Clear monitoring interval
      const interval = this.monitoringIntervals.get(tenantId);
      if (interval) {
        clearInterval(interval);
        this.monitoringIntervals.delete(tenantId);
      }

      // Close IMAP connection
      const connection = this.imapConnections.get(tenantId);
      if (connection) {
        connection.end();
        this.imapConnections.delete(tenantId);
      }

      console.log(`✅ Gmail monitoring stopped for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Error stopping Gmail monitoring:', error);
    }
  }

  private async fetchAndSyncEmails(tenantId: string, channelId: string, config: GmailConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        authTimeout: 10000,
        connTimeout: 15000,
        keepalive: true
      });

      let resolved = false;

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err: any, box: any) => {
          if (err) {
            if (!resolved) {
              resolved = true;
              reject(err);
            }
            return;
          }

          console.log(`📧 Fetching emails from ${config.user} (${box.messages.total} total)`);

          // Search for emails from the last 24 hours
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          const searchCriteria = ['SINCE', yesterday.toISOString().split('T')[0]];
          
          imap.search(searchCriteria, (err: any, results: number[]) => {
            if (err) {
              if (!resolved) {
                resolved = true;
                reject(err);
              }
              return;
            }

            if (!results || results.length === 0) {
              console.log('📪 No recent emails found');
              imap.end();
              if (!resolved) {
                resolved = true;
                resolve();
              }
              return;
            }

            // Get the most recent 50 emails
            const recentResults = results.slice(-50);
            console.log(`📬 Processing ${recentResults.length} recent emails`);

            const fetchOptions = {
              bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID) TEXT',
              struct: true
            };

            const emails: any[] = [];
            const f = imap.fetch(recentResults, fetchOptions);

            f.on('message', (msg: any, seqno: number) => {
              const email: any = { seqno };
              
              msg.on('body', (stream: any, info: any) => {
                let buffer = Buffer.alloc(0);
                stream.on('data', (chunk: Buffer) => {
                  buffer = Buffer.concat([buffer, chunk]);
                });
                
                stream.once('end', () => {
                  if (info.which === 'TEXT') {
                    email.bodyText = buffer.toString();
                  } else {
                    const headers = Imap.parseHeader(buffer.toString());
                    email.headers = headers;
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
              if (!resolved) {
                resolved = true;
                reject(err);
              }
            });

            f.once('end', async () => {
              imap.end();
              if (!resolved) {
                resolved = true;
                try {
                  await this.persistEmailsToDatabase(tenantId, channelId, emails);
                  console.log(`✅ Synced ${emails.length} emails to database`);
                  resolve();
                } catch (error) {
                  reject(error);
                }
              }
            });
          });
        });
      });

      imap.once('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          imap.end();
          reject(new Error('Email fetch timeout'));
        }
      }, 30000);

      imap.connect();
    });
  }

  private async persistEmailsToDatabase(tenantId: string, channelId: string, emails: any[]): Promise<void> {
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      
      for (const email of emails) {
        try {
          const headers = email.headers || {};
          const messageId = headers['message-id'] ? headers['message-id'][0] : `gmail-${Date.now()}-${Math.random()}`;
          
          // Check if email already exists
          const existingResult = await tenantDb.execute(sql`
            SELECT id FROM omnibridge_inbox 
            WHERE message_id = ${messageId} AND tenant_id = ${tenantId}
            LIMIT 1
          `);
          
          if (existingResult.rows.length > 0) {
            continue; // Skip duplicate
          }

          const from = headers.from ? headers.from[0] : 'unknown@gmail.com';
          const to = headers.to ? headers.to[0] : 'alexsolver@gmail.com';
          const subject = headers.subject ? headers.subject[0] : '(No Subject)';
          const date = headers.date ? new Date(headers.date[0]) : new Date();
          const bodyText = email.bodyText || 'Email body content';

          // Extract email address from "Name <email>" format
          const fromMatch = from.match(/<(.+?)>/) || [null, from];
          const fromEmail = fromMatch[1] || from;
          const fromName = from.replace(/<.*>/, '').trim().replace(/"/g, '') || null;

          // Insert into omnibridge_inbox table
          await tenantDb.execute(sql`
            INSERT INTO omnibridge_inbox (
              tenant_id, message_id, channel_id, channel_type,
              from_contact, from_name, to_contact, subject, body_text,
              direction, priority, is_read, is_processed, is_archived,
              needs_response, received_at, has_attachments, attachment_count,
              original_headers
            ) VALUES (
              ${tenantId}, ${messageId}, ${channelId}, 'email',
              ${fromEmail}, ${fromName}, ${to}, ${subject}, ${bodyText},
              'inbound', 'medium', false, false, false,
              true, ${date.toISOString()}, false, 0,
              ${JSON.stringify(headers)}
            )
          `);

          console.log(`✅ Persisted email: ${subject} from ${fromEmail}`);
        } catch (error) {
          console.error('Error persisting individual email:', error);
        }
      }
    } catch (error) {
      console.error('Error persisting emails to database:', error);
      throw error;
    }
  }

  isMonitoring(tenantId: string): boolean {
    return this.monitoringIntervals.has(tenantId);
  }

  getActiveConnections(): number {
    return this.monitoringIntervals.size;
  }

  getActiveIntegrations(): string[] {
    return Array.from(this.monitoringIntervals.keys()).map(() => 'imap-email');
  }
}
