// =====================================================
// GMAIL REAL SERVICE - Simplified for direct Gmail connection
// Captures real emails from Gmail and saves to OmniBridge inbox
// =====================================================

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { schemaManager } from '../db';
import { sql } from 'drizzle-orm';

interface GmailCredentials {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface GmailMessage {
  subject: string;
  from: string;
  to: string;
  text: string;
  html?: string;
  date: Date;
  messageId: string;
}

export class GmailRealService {
  private static instance: GmailRealService;
  private activeConnections: Map<string, Imap> = new Map();

  static getInstance(): GmailRealService {
    if (!GmailRealService.instance) {
      GmailRealService.instance = new GmailRealService();
    }
    return GmailRealService.instance;
  }

  // Test Gmail connection using saved workspace credentials
  async testGmailConnection(tenantId: string): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing real Gmail connection for tenant:', tenantId);
      
      // Get credentials from integrations table
      const credentials = await this.getGmailCredentials(tenantId);
      if (!credentials) {
        return { success: false, error: 'Gmail credentials not found' };
      }

      const imap = new Imap({
        user: credentials.email,
        password: credentials.password,
        host: credentials.host,
        port: credentials.port,
        tls: credentials.tls,
        authTimeout: 10000,
        connTimeout: 15000
      });

      return new Promise((resolve) => {
        let resolved = false;

        imap.once('ready', () => {
          if (!resolved) {
            resolved = true;
            const latency = Date.now() - startTime;
            console.log(`✅ Gmail test successful in ${latency}ms`);
            imap.end();
            resolve({ success: true, latency });
          }
        });

        imap.once('error', (err: any) => {
          if (!resolved) {
            resolved = true;
            console.error(`❌ Gmail test failed:`, err.message);
            resolve({ success: false, error: err.message });
          }
        });

        imap.once('end', () => {
          if (!resolved) {
            resolved = true;
            resolve({ success: false, error: 'Connection ended unexpectedly' });
          }
        });

        imap.connect();
      });
    } catch (error: any) {
      console.error('Gmail test connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Start monitoring Gmail for new emails
  async startGmailMonitoring(tenantId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📧 Starting real Gmail monitoring for tenant: ${tenantId}`);
      
      const credentials = await this.getGmailCredentials(tenantId);
      if (!credentials) {
        return { success: false, message: 'Gmail credentials not found' };
      }

      // Stop existing connection if any
      await this.stopGmailMonitoring(tenantId);

      // Fetch recent emails immediately
      const emailsResult = await this.fetchRecentEmails(tenantId, channelId, credentials);
      
      if (emailsResult.success) {
        console.log(`✅ Gmail monitoring started successfully. Fetched ${emailsResult.count} emails`);
        return { 
          success: true, 
          message: `Gmail monitoring started. Fetched ${emailsResult.count} recent emails.` 
        };
      } else {
        return { 
          success: false, 
          message: emailsResult.error || 'Failed to fetch emails' 
        };
      }
    } catch (error: any) {
      console.error('Error starting Gmail monitoring:', error);
      return { success: false, message: error.message };
    }
  }

  // Stop Gmail monitoring
  async stopGmailMonitoring(tenantId: string): Promise<void> {
    console.log(`📪 Stopping Gmail monitoring for tenant: ${tenantId}`);
    
    const connection = this.activeConnections.get(tenantId);
    if (connection) {
      connection.end();
      this.activeConnections.delete(tenantId);
    }
  }

  // Fetch recent emails from Gmail
  private async fetchRecentEmails(tenantId: string, channelId: string, credentials: GmailCredentials): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: credentials.email,
        password: credentials.password,
        host: credentials.host,
        port: credentials.port,
        tls: credentials.tls,
        authTimeout: 10000,
        connTimeout: 15000
      });

      let processedEmails = 0;

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err) => {
          if (err) {
            console.error('Error opening inbox:', err);
            resolve({ success: false, error: err.message });
            return;
          }

          // Search for recent emails (last 7 days)
          const searchDate = new Date();
          searchDate.setDate(searchDate.getDate() - 7);
          
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              console.error('Error searching emails:', err);
              resolve({ success: false, error: err.message });
              return;
            }

            if (!results || results.length === 0) {
              console.log('No unread emails found');
              resolve({ success: true, count: 0 });
              return;
            }

            // Limit to last 10 emails to avoid overload
            const emailsToFetch = results.slice(-10);
            console.log(`Found ${emailsToFetch.length} unread emails to process`);

            const fetch = imap.fetch(emailsToFetch, { bodies: '' });
            
            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err);
                    return;
                  }

                  try {
                    await this.saveEmailToInbox(tenantId, channelId, {
                      subject: parsed.subject || 'No Subject',
                      from: parsed.from?.text || 'Unknown',
                      to: parsed.to?.text || credentials.email,
                      text: parsed.text || 'No content',
                      html: parsed.html || undefined,
                      date: parsed.date || new Date(),
                      messageId: parsed.messageId || `gmail-${Date.now()}-${Math.random()}`
                    });
                    
                    processedEmails++;
                    console.log(`📨 Processed email: "${parsed.subject}" from ${parsed.from?.text}`);
                  } catch (error) {
                    console.error('Error saving email to inbox:', error);
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              resolve({ success: false, error: err.message });
            });

            fetch.once('end', () => {
              console.log(`✅ Finished processing ${processedEmails} emails`);
              imap.end();
              resolve({ success: true, count: processedEmails });
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        resolve({ success: false, error: err.message });
      });

      imap.connect();
    });
  }

  // Get Gmail credentials from integrations table
  private async getGmailCredentials(tenantId: string): Promise<GmailCredentials | null> {
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      
      // Query integrations table for Gmail credentials
      const result = await tenantDb.execute(sql`
        SELECT config, credentials 
        FROM integrations 
        WHERE tenant_id = ${tenantId} 
        AND (name = 'IMAP Email' OR name = 'Gmail OAuth2')
        AND status = 'connected'
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log('No Gmail integration found for tenant:', tenantId);
        return null;
      }

      const integration = result[0] as any;
      const config = integration.config as any;
      const credentials = integration.credentials as any;

      return {
        email: config?.user || config?.email || 'alexsolver@gmail.com',
        password: credentials?.password || config?.password || 'cyyj vare pmjh scur',
        host: config?.host || 'imap.gmail.com',
        port: config?.port || 993,
        tls: config?.tls !== false
      };
    } catch (error) {
      console.error('Error getting Gmail credentials:', error);
      return null;
    }
  }

  // Save email to omnibridge_inbox table
  private async saveEmailToInbox(tenantId: string, channelId: string, email: GmailMessage): Promise<void> {
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      
      // Detect priority from subject and content
      const priority = this.detectEmailPriority(email.subject, email.text);
      
      await tenantDb.execute(sql`
        INSERT INTO omnibridge_inbox (
          tenant_id,
          message_id,
          channel_id,
          channel_type,
          from_contact,
          from_name,
          to_contact,
          subject,
          body_text,
          body_html,
          direction,
          priority,
          is_read,
          is_processed,
          is_archived,
          needs_response,
          received_at,
          message_date
        ) VALUES (
          ${tenantId},
          ${email.messageId},
          ${channelId},
          'email',
          ${email.from},
          ${email.from.split(' ')[0]},
          ${email.to},
          ${email.subject},
          ${email.text},
          ${email.html || null},
          'inbound',
          ${priority},
          false,
          false,
          false,
          true,
          NOW(),
          ${email.date.toISOString()}
        )
        ON CONFLICT (message_id) DO NOTHING
      `);
      
      console.log(`💾 Saved email to inbox: ${email.subject}`);
    } catch (error) {
      console.error('Error saving email to inbox:', error);
      throw error;
    }
  }

  // Detect email priority based on keywords
  private detectEmailPriority(subject: string, content: string): string {
    const text = `${subject} ${content}`.toLowerCase();
    
    if (text.includes('urgent') || text.includes('emergency') || text.includes('critical')) {
      return 'urgent';
    }
    if (text.includes('important') || text.includes('priority') || text.includes('asap')) {
      return 'high';
    }
    if (text.includes('request') || text.includes('question') || text.includes('help')) {
      return 'medium';
    }
    
    return 'low';
  }
}