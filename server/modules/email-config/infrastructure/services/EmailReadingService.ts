import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { logger } from '../../../../utils/logger.js';
import { EmailProcessingService } from '../../application/services/EmailProcessingService.js';
import { DrizzleEmailConfigRepository } from '../repositories/DrizzleEmailConfigRepository.js';

export class EmailReadingService {
  private activeConnections = new Map<string, Imap>();
  private connectionPromises = new Map<string, Promise<void>>();
  private emailProcessingService: EmailProcessingService;
  private emailConfigRepository: DrizzleEmailConfigRepository;

  constructor() {
    this.emailProcessingService = new EmailProcessingService();
    this.emailConfigRepository = new DrizzleEmailConfigRepository();
  }

  async startMonitoring(tenantId: string, integrationId: string, config: any): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        console.log(`🔗 Connecting to IMAP for ${config.name || integrationId}: ${config.imapServer}:${config.imapPort}`);
        console.log(`📧 Email: ${config.emailAddress}`);

        const imap = new Imap({
          user: config.emailAddress,
          password: config.password,
          host: config.imapServer,
          port: config.imapPort,
          tls: config.imapSecurity === 'SSL/TLS',
          authTimeout: 30000,
          connTimeout: 30000,
          debug: false,
          tlsOptions: {
            rejectUnauthorized: false
          }
        });

        this.activeConnections.set(integrationId, imap);

        imap.once('ready', () => {
          console.log(`✅ IMAP connection ready for ${config.name || integrationId} (${config.emailAddress})`);
          this.checkEmails(tenantId, integrationId, imap, resolve);
        });

        imap.once('error', (error) => {
          console.error(`❌ IMAP error for integration ${integrationId}:`, error);
          this.activeConnections.delete(integrationId);
          resolve();
        });

        imap.once('end', () => {
          console.log(`📫 IMAP connection ended for integration ${integrationId}`);
          this.activeConnections.delete(integrationId);
          resolve();
        });

        imap.connect();
      } catch (error) {
        console.error(`❌ Error starting IMAP monitoring for integration ${integrationId}:`, error);
        resolve();
      }
    });
  }

  private checkEmails(tenantId: string, integrationId: string, imap: Imap, resolve: () => void): void {
    imap.openBox('INBOX', true, (error, box) => {
      if (error) {
        console.error(`❌ Error opening INBOX for integration ${integrationId}:`, error);
        resolve();
        return;
      }

      console.log(`📫 Opened INBOX for integration ${integrationId}, ${box.messages.total} total messages`);

      // Search for recent emails (last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      console.log(`🔍 Searching for emails since: ${oneHourAgo.toISOString()}`);

      imap.search([['SINCE', oneHourAgo]], (searchError, results) => {
        if (searchError) {
          console.error(`❌ Error searching emails for integration ${integrationId}:`, searchError);
          resolve();
          return;
        }

        if (!results || results.length === 0) {
          console.log(`📭 No recent emails found for integration ${integrationId}`);
          resolve();
          return;
        }

        console.log(`📬 Found ${results.length} recent emails for integration ${integrationId}`);

        const fetch = imap.fetch(results, { 
          bodies: '',
          markSeen: false,
          struct: true 
        });

        let emailsProcessed = 0;

        fetch.on('message', (msg, seqno) => {
          let emailData = '';

          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              emailData += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsedEmail = await simpleParser(emailData);
                console.log(`📧 Processing email from: ${parsedEmail.from?.text} | Subject: ${parsedEmail.subject}`);
                await this.processEmail(tenantId, integrationId, parsedEmail);
                emailsProcessed++;
                
                if (emailsProcessed === results.length) {
                  console.log(`✅ Processed ${emailsProcessed}/${results.length} emails for integration ${integrationId}`);
                  resolve();
                }
              } catch (parseError) {
                console.error(`❌ Error processing email ${seqno}:`, parseError);
                emailsProcessed++;
                if (emailsProcessed === results.length) {
                  resolve();
                }
              }
            });
          });

          msg.once('attributes', (attrs) => {
            console.log(`📧 Processing email ${seqno} with UID ${attrs.uid}`);
          });
        });

        fetch.once('error', (fetchError) => {
          console.error(`❌ Error fetching emails for integration ${integrationId}:`, fetchError);
          resolve();
        });

        fetch.once('end', () => {
          if (emailsProcessed === 0) {
            console.log(`✅ Finished processing emails for integration ${integrationId}`);
            resolve();
          }
        });
      });
    });
  }

  private async processEmail(tenantId: string, integrationId: string, parsedEmail: ParsedMail): Promise<void> {
    try {
      const emailData = {
        messageId: parsedEmail.messageId || `imap-${Date.now()}`,
        threadId: parsedEmail.inReplyTo || null,
        fromEmail: parsedEmail.from?.value?.[0]?.address || '',
        fromName: parsedEmail.from?.value?.[0]?.name || parsedEmail.from?.text || '',
        toEmail: parsedEmail.to?.value?.[0]?.address || '',
        ccEmails: JSON.stringify(parsedEmail.cc?.value?.map(addr => addr.address) || []),
        bccEmails: JSON.stringify(parsedEmail.bcc?.value?.map(addr => addr.address) || []),
        subject: parsedEmail.subject || 'No Subject',
        bodyText: parsedEmail.text || '',
        bodyHtml: parsedEmail.html || '',
        hasAttachments: (parsedEmail.attachments?.length || 0) > 0,
        attachmentCount: parsedEmail.attachments?.length || 0,
        attachmentDetails: JSON.stringify(parsedEmail.attachments?.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size
        })) || []),
        emailHeaders: JSON.stringify(parsedEmail.headers || {}),
        emailDate: parsedEmail.date?.toISOString() || new Date().toISOString(),
        priority: this.determinePriority(parsedEmail.subject || '', parsedEmail.text || '')
      };

      console.log(`💾 Saving email to inbox: ${emailData.subject} from ${emailData.fromEmail}`);
      await this.emailProcessingService.processAndSaveInbox(tenantId, emailData);
      
    } catch (error) {
      console.error('❌ Error processing email:', error);
      throw error;
    }
  }

  private determinePriority(subject: string, body: string): string {
    const urgentKeywords = ['urgente', 'urgent', 'emergency', 'emergência', 'crítico', 'critical'];
    const text = (subject + ' ' + body).toLowerCase();
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      return 'high';
    }
    
    const importantKeywords = ['importante', 'important', 'prioritário', 'priority'];
    if (importantKeywords.some(keyword => text.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  stopMonitoring(integrationId: string): void {
    const connection = this.activeConnections.get(integrationId);
    if (connection) {
      try {
        connection.end();
        this.activeConnections.delete(integrationId);
        console.log(`🔌 Stopped monitoring for integration ${integrationId}`);
      } catch (error) {
        console.error(`❌ Error stopping monitoring for integration ${integrationId}:`, error);
      }
    }
  }

  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const [integrationId, connection] of this.activeConnections) {
      status[integrationId] = connection.state === 'authenticated';
    }
    
    return status;
  }

  stopAllMonitoring(): void {
    console.log(`🔌 Stopping ${this.activeConnections.size} active connections`);
    
    for (const [integrationId, connection] of this.activeConnections) {
      try {
        connection.end();
      } catch (error) {
        console.error(`❌ Error stopping connection ${integrationId}:`, error);
      }
    }
    
    this.activeConnections.clear();
  }

  isCurrentlyMonitoring(): boolean {
    return this.activeConnections.size > 0;
  }

  getActiveConnectionsCount(): number {
    return this.activeConnections.size;
  }

  async startMultipleMonitoring(tenantId: string, integrations: any[]): Promise<void> {
    console.log(`🚀 Starting email monitoring for tenant: ${tenantId}`);
    
    if (!integrations || integrations.length === 0) {
      console.log('⚠️ No integrations provided for monitoring');
      return;
    }

    for (const integration of integrations) {
      try {
        if (integration.isConfigured && integration.config) {
          await this.startMonitoring(tenantId, integration.id, integration.config);
          console.log(`✅ Started monitoring for integration: ${integration.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to start monitoring for integration ${integration.name}:`, error);
      }
    }
  }
}