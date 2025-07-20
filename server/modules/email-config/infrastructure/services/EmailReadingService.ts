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

  async importHistoricalEmails(tenantId: string, integrationId: string, config: any, options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ imported: number; errors: number }> {
    const { limit = 100, startDate, endDate } = options;
    let imported = 0;
    let errors = 0;

    try {
      console.log(`📧 Starting historical email import for tenant: ${tenantId}`);
      console.log(`📊 Import settings: limit=${limit}, startDate=${startDate?.toISOString()}, endDate=${endDate?.toISOString()}`);
      
      const imap = new Imap({
        user: config.emailAddress,
        password: config.password,
        host: config.imapServer,
        port: config.imapPort,
        tls: config.imapSecurity === 'SSL/TLS',
        connTimeout: 60000,
        authTimeout: 30000,
        keepalive: false
      });

      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          console.log(`✅ IMAP connection ready for historical import: ${config.emailAddress}`);
          
          imap.openBox('INBOX', true, (err, box) => {
            if (err) {
              console.error('❌ Error opening INBOX for historical import:', err);
              return reject(err);
            }

            console.log(`📫 Opened INBOX for historical import, ${box.messages.total} total messages`);

            // Build search criteria for historical emails
            let searchCriteria: any[] = ['ALL'];
            
            if (startDate) {
              searchCriteria.push(['SINCE', startDate.toDateString()]);
            }
            if (endDate) {
              searchCriteria.push(['BEFORE', endDate.toDateString()]);
            }

            console.log(`🔍 Searching for historical emails with criteria:`, searchCriteria);

            imap.search(searchCriteria, (err, results) => {
              if (err) {
                console.error('❌ Error searching historical emails:', err);
                return reject(err);
              }

              if (!results || results.length === 0) {
                console.log('📭 No historical emails found matching criteria');
                imap.end();
                return resolve({ imported: 0, errors: 0 });
              }

              // Limit results if specified
              const emailsToFetch = limit ? results.slice(-limit) : results;
              console.log(`📧 Found ${results.length} historical emails, importing ${emailsToFetch.length}`);

              const fetch = imap.fetch(emailsToFetch, { 
                bodies: ['HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE MESSAGE-ID IN-REPLY-TO)', 'TEXT'],
                struct: true,
                markSeen: false
              });

              let processedCount = 0;
              const totalEmails = emailsToFetch.length;

              fetch.on('message', (msg, seqno) => {
                let emailData: any = {};
                
                msg.on('body', (stream, info) => {
                  let buffer = '';
                  stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                  });
                  
                  stream.once('end', () => {
                    if (info.which === 'TEXT') {
                      emailData.bodyText = buffer;
                    } else {
                      // Parse headers
                      const parsed = Imap.parseHeader(buffer);
                      emailData.headers = parsed;
                    }
                  });
                });

                msg.once('attributes', (attrs) => {
                  emailData.date = attrs.date;
                  emailData.uid = attrs.uid;
                });

                msg.once('end', async () => {
                  try {
                    // Process and save this historical email
                    const processedEmail = {
                      messageId: emailData.headers?.['message-id']?.[0] || `historical-${emailData.uid}-${Date.now()}`,
                      threadId: emailData.headers?.['in-reply-to']?.[0] || null,
                      fromEmail: this.parseEmailAddress(emailData.headers?.from?.[0] || ''),
                      fromName: this.parseEmailName(emailData.headers?.from?.[0] || ''),
                      toEmail: this.parseEmailAddress(emailData.headers?.to?.[0] || ''),
                      ccEmails: JSON.stringify(emailData.headers?.cc?.map(this.parseEmailAddress) || []),
                      bccEmails: JSON.stringify(emailData.headers?.bcc?.map(this.parseEmailAddress) || []),
                      subject: emailData.headers?.subject?.[0] || 'No Subject',
                      bodyText: emailData.bodyText || '',
                      bodyHtml: '',
                      hasAttachments: false,
                      attachmentCount: 0,
                      attachmentDetails: JSON.stringify([]),
                      emailHeaders: JSON.stringify(emailData.headers || {}),
                      emailDate: emailData.date?.toISOString() || new Date().toISOString(),
                      priority: this.determinePriority(emailData.headers?.subject?.[0] || '', emailData.bodyText || '')
                    };

                    await this.emailProcessingService.processAndSaveInbox(tenantId, processedEmail);
                    imported++;
                    
                    processedCount++;
                    if (processedCount % 10 === 0) {
                      console.log(`📧 Historical import progress: ${processedCount}/${totalEmails} emails processed`);
                    }
                    
                  } catch (error) {
                    console.error(`❌ Error processing historical email ${emailData.uid}:`, error);
                    errors++;
                  }

                  // Check if all emails processed
                  if (processedCount === totalEmails) {
                    imap.end();
                    console.log(`✅ Historical email import completed: ${imported} imported, ${errors} errors`);
                    resolve({ imported, errors });
                  }
                });
              });

              fetch.once('error', (err) => {
                console.error('❌ Error fetching historical emails:', err);
                reject(err);
              });

              fetch.once('end', () => {
                console.log('📧 Fetch completed for historical emails');
              });
            });
          });
        });

        imap.once('error', (err) => {
          console.error('❌ IMAP error during historical import:', err);
          reject(err);
        });

        imap.once('end', () => {
          console.log('🔌 IMAP connection ended for historical import');
        });

        imap.connect();
      });

    } catch (error) {
      console.error('❌ Error in historical email import:', error);
      throw error;
    }
  }

  private parseEmailAddress(emailString: string): string {
    if (!emailString) return '';
    const match = emailString.match(/<([^>]+)>/);
    return match ? match[1] : emailString.trim();
  }

  private parseEmailName(emailString: string): string {
    if (!emailString) return '';
    const match = emailString.match(/^([^<]+)</);
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : '';
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