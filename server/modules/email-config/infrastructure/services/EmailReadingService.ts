import { schemaManager } from '../../../../db';
import { DrizzleEmailConfigRepository } from '../repositories/DrizzleEmailConfigRepository';
import { EmailProcessingService } from '../../application/services/EmailProcessingService';

const Imap = require('imap');

export class EmailReadingService {
  private activeConnections = new Map<string, any>();
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;

  async startMonitoring(tenantId: string): Promise<void> {
    if (this.isMonitoring) {
      console.log('📧 Email monitoring is already running');
      return;
    }

    console.log('📧 Starting email monitoring service...');

    try {
      const repository = new DrizzleEmailConfigRepository();
      const integrations = await repository.getEmailIntegrations(tenantId);

      const emailIntegrations = integrations.filter(i => 
        i.category === 'Comunicação' && 
        i.isConfigured && 
        (i.name === 'IMAP Email' || i.name === 'Gmail OAuth2' || i.name === 'Outlook OAuth2')
      );

      if (emailIntegrations.length === 0) {
        console.log('⚠️ No configured email integrations found');
        return;
      }

      console.log(`📧 Found ${emailIntegrations.length} configured email integrations`);

      // Connect to each email integration
      for (const integration of emailIntegrations) {
        try {
          await this.connectToEmailIntegration(tenantId, integration);
        } catch (error) {
          console.error(`❌ Failed to connect to integration ${integration.name}:`, error);
        }
      }

      this.isMonitoring = true;

      // Start periodic email checking
      this.checkInterval = setInterval(async () => {
        if (this.isMonitoring) {
          await this.checkForNewEmails(tenantId);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      // Do an immediate check
      setTimeout(() => {
        if (this.isMonitoring) {
          this.checkForNewEmails(tenantId);
        }
      }, 2000);

      console.log('✅ Email monitoring started successfully');
    } catch (error) {
      console.error('❌ Error starting email monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring(): Promise<void> {
    console.log('📧 Stopping email monitoring...');

    this.isMonitoring = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Close all IMAP connections
    for (const [integrationId, imap] of this.activeConnections) {
      try {
        if (imap && typeof imap.end === 'function') {
          imap.end();
        }
      } catch (error) {
        console.error(`Error closing connection for ${integrationId}:`, error);
      }
    }

    this.activeConnections.clear();
    console.log('✅ Email monitoring stopped');
  }

  getMonitoringStatus(): any {
    return {
      isActive: this.isMonitoring,
      activeConnections: this.activeConnections.size,
      integrations: Array.from(this.activeConnections.keys())
    };
  }

  private async connectToEmailIntegration(tenantId: string, integration: any): Promise<void> {
    console.log(`🔌 Connecting to integration: ${integration.name} (${integration.emailAddress})`);

    const repository = new DrizzleEmailConfigRepository();
    const config = await repository.getIntegrationConfig(tenantId, integration.id);

    if (!config || !config.emailAddress || !config.password) {
      console.error(`❌ Invalid config for integration ${integration.name}`);
      return;
    }

    const imapConfig = this.getImapConfig(config.emailAddress, config);
    console.log(`🔧 IMAP config for ${config.emailAddress}:`, {
      host: imapConfig.host,
      port: imapConfig.port,
      user: imapConfig.user,
      tls: imapConfig.tls
    });

    const imap = new Imap(imapConfig);

    return new Promise((resolve, reject) => {
      imap.once('ready', () => {
        console.log(`✅ Connected to ${integration.name} (${config.emailAddress})`);
        this.activeConnections.set(integration.id, imap);
        resolve();
      });

      imap.once('error', (error: Error) => {
        console.error(`❌ IMAP connection error for ${integration.name}:`, error.message);
        reject(error);
      });

      imap.once('end', () => {
        console.log(`📡 IMAP connection ended for ${integration.name}`);
        this.activeConnections.delete(integration.id);
      });

      try {
        imap.connect();
      } catch (error) {
        console.error(`❌ Error connecting to ${integration.name}:`, error);
        reject(error);
      }
    });
  }

  private async checkForNewEmails(tenantId: string): Promise<void> {
    console.log(`📬 Checking for new emails for tenant: ${tenantId} (${this.activeConnections.size} connections)`);

    const promises = [];
    for (const [integrationId, imap] of this.activeConnections) {
      try {
        if (imap.state === 'authenticated') {
          promises.push(this.readEmailsFromConnection(tenantId, integrationId, imap));
        } else {
          console.log(`⚠️ IMAP connection not authenticated for integration ${integrationId}, state: ${imap.state}`);
        }
      } catch (error) {
        console.error(`❌ Error reading emails from integration ${integrationId}:`, error);
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  private async readEmailsFromConnection(tenantId: string, integrationId: string, imap: any): Promise<void> {
    return new Promise((resolve) => {
      this.checkEmails(tenantId, integrationId, imap, resolve);
    });
  }

  private checkEmails(tenantId: string, integrationId: string, imap: any, resolve: () => void): void {
    imap.openBox('INBOX', true, (error: any, box: any) => {
      if (error) {
        console.error(`❌ Error opening INBOX for integration ${integrationId}:`, error);
        resolve();
        return;
      }

      console.log(`📫 Opened INBOX for integration ${integrationId}, ${box.messages.total} total messages`);

      // Search for emails from the last 24 hours to catch more emails
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      console.log(`🔍 Searching for emails since: ${yesterday.toISOString()}`);

      imap.search([['SINCE', yesterday]], (searchError: any, results: any) => {
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

        // Take last 10 emails to avoid overwhelming the system
        const emailsToProcess = results.slice(-10);
        console.log(`📧 Processing ${emailsToProcess.length} most recent emails`);

        const fetch = imap.fetch(emailsToProcess, { 
          bodies: '',
          markSeen: false,
          struct: true 
        });

        let emailsProcessed = 0;
        const emailsToSave = [];

        fetch.on('message', (msg: any, seqno: number) => {
          let emailData = '';
          let emailHeaders: any = {};

          msg.on('body', (stream: any, info: any) => {
            stream.on('data', (chunk: any) => {
              emailData += chunk.toString('utf8');
            });

            stream.once('end', () => {
              // Parse email headers
              const headerMatch = emailData.match(/^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/);
              if (headerMatch) {
                const headerSection = headerMatch[1];
                const bodySection = headerMatch[2];

                // Parse headers
                const headers = this.parseHeaders(headerSection);
                emailHeaders = headers;

                const emailInfo = {
                  messageId: headers['message-id'] || `imap-${integrationId}-${seqno}`,
                  fromEmail: this.extractEmail(headers.from || ''),
                  fromName: this.extractName(headers.from || ''),
                  toEmail: this.extractEmail(headers.to || ''),
                  subject: headers.subject || 'No Subject',
                  bodyText: this.extractTextFromBody(bodySection),
                  bodyHtml: this.extractHtmlFromBody(bodySection),
                  hasAttachments: false,
                  attachmentCount: 0,
                  attachmentDetails: [],
                  emailHeaders: headers,
                  priority: this.determinePriority(headers.subject || '', bodySection),
                  emailDate: this.parseDate(headers.date) || new Date(),
                  receivedAt: new Date()
                };

                emailsToSave.push(emailInfo);
                console.log(`📨 Parsed email: ${emailInfo.fromEmail} -> ${emailInfo.subject}`);
              }
            });
          });

          msg.once('attributes', (attrs: any) => {
            console.log(`📧 Email ${seqno} attributes:`, {
              uid: attrs.uid,
              flags: attrs.flags,
              date: attrs.date
            });
          });
        });

        fetch.once('error', (err: Error) => {
          console.error(`❌ Fetch error for integration ${integrationId}:`, err);
          resolve();
        });

        fetch.once('end', async () => {
          emailsProcessed = emailsToSave.length;
          console.log(`📧 Finished fetching ${emailsProcessed} emails for integration ${integrationId}`);

          // Save and process emails
          if (emailsToSave.length > 0) {
            try {
              const repository = new DrizzleEmailConfigRepository();
              const emailProcessingService = new EmailProcessingService();

              for (const emailInfo of emailsToSave) {
                try {
                  // Check if email already exists to avoid duplicates
                  const existingEmail = await this.checkEmailExists(tenantId, emailInfo.messageId);
                  if (existingEmail) {
                    console.log(`📧 Email already exists: ${emailInfo.messageId}`);
                    continue;
                  }

                  // Save to inbox first
                  const savedId = await repository.saveInboxMessage(tenantId, emailInfo);
                  console.log(`💾 Saved email to inbox: ${savedId}`);

                  // Process with rules
                  await emailProcessingService.processIncomingEmail(tenantId, emailInfo);
                  console.log(`⚡ Processed email with rules: ${emailInfo.subject}`);

                } catch (error) {
                  console.error(`❌ Error saving/processing email:`, error);
                  // Continue with next email
                }
              }
            } catch (error) {
              console.error(`❌ Error in email processing batch:`, error);
            }
          }

          resolve();
        });
      });
    });
  }

  private parseHeaders(headerSection: string): any {
    const headers: any = {};
    const lines = headerSection.split(/\r?\n/);
    let currentHeader = '';
    let currentValue = '';

    for (const line of lines) {
      if (line.match(/^\s/) && currentHeader) {
        // Continuation of previous header
        currentValue += ' ' + line.trim();
      } else {
        // Save previous header
        if (currentHeader) {
          headers[currentHeader.toLowerCase()] = currentValue.trim();
        }
        
        // Parse new header
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
          currentHeader = match[1];
          currentValue = match[2];
        }
      }
    }

    // Don't forget the last header
    if (currentHeader) {
      headers[currentHeader.toLowerCase()] = currentValue.trim();
    }

    return headers;
  }

  private extractEmail(fromField: string): string {
    const emailMatch = fromField.match(/<([^>]+)>/);
    if (emailMatch) {
      return emailMatch[1];
    }
    // If no angle brackets, assume the whole thing is an email
    const directMatch = fromField.match(/\S+@\S+\.\S+/);
    return directMatch ? directMatch[0] : fromField.trim();
  }

  private extractName(fromField: string): string | undefined {
    const nameMatch = fromField.match(/^([^<]+)<[^>]+>$/);
    if (nameMatch) {
      return nameMatch[1].replace(/["']/g, '').trim();
    }
    return undefined;
  }

  private extractTextFromBody(body: string): string {
    // Simple text extraction - remove HTML tags and clean up
    return body
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000); // Limit length
  }

  private extractHtmlFromBody(body: string): string | undefined {
    if (body.includes('<html') || body.includes('<HTML')) {
      return body.substring(0, 5000); // Limit length
    }
    return undefined;
  }

  private determinePriority(subject: string, body: string): string {
    const text = (subject + ' ' + body).toLowerCase();
    
    if (text.match(/urgente|urgent|critical|crítico|emergency|emergência|immediate/i)) {
      return 'high';
    } else if (text.match(/importante|important|priority|prioridade|asap/i)) {
      return 'medium';
    }
    
    return 'low';
  }

  private parseDate(dateString: string | undefined): Date | null {
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }

  private async checkEmailExists(tenantId: string, messageId: string): Promise<boolean> {
    try {
      const repository = new DrizzleEmailConfigRepository();
      const messages = await repository.getInboxMessages(tenantId, { limit: 1 });
      return messages.some(m => m.messageId === messageId);
    } catch (error) {
      console.error('Error checking if email exists:', error);
      return false;
    }
  }

        fetch.on('message', (msg: any, seqno: any) => {
          let emailData = '';

          msg.on('body', (stream: any, info: any) => {
            stream.on('data', (chunk: any) => {
              emailData += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsedEmail = await simpleParser(emailData);
                console.log(`📧 Processing email from: ${parsedEmail.from?.text} | Subject: ${parsedEmail.subject}`);
                await this.processEmail(tenantId, integrationId, parsedEmail);
                emailsProcessed++;

                if (emailsProcessed === emailsToProcess.length) {
                  console.log(`✅ Processed ${emailsProcessed}/${emailsToProcess.length} emails for integration ${integrationId}`);
                  resolve();
                }
              } catch (parseError) {
                console.error(`❌ Error processing email ${seqno}:`, parseError);
                emailsProcessed++;
                if (emailsProcessed === emailsToProcess.length) {
                  resolve();
                }
              }
            });
          });

          msg.once('attributes', (attrs: any) => {
            console.log(`📧 Processing email ${seqno} with UID ${attrs.uid}`);
          });
        });

        fetch.once('error', (fetchError: any) => {
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
      const emailProcessingService = new EmailProcessingService();
      await emailProcessingService.processAndSaveInbox(tenantId, emailData);

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

  private getImapConfig(emailAddress: string, config: any): any {
    const parts = emailAddress.split('@');
    const domain = parts[1];

    let imapServer = config.imapServer;
    let imapPort = config.imapPort;
    let imapSecurity = config.imapSecurity;

    if (!imapServer || !imapPort) {
      if (domain === 'gmail.com') {
        imapServer = 'imap.gmail.com';
        imapPort = 993;
        imapSecurity = 'SSL/TLS';
      } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
        imapServer = 'outlook.office365.com';
        imapPort = 993;
        imapSecurity = 'SSL/TLS';
      }
    }

    const imapConfig: any = {
      user: config.emailAddress,
      password: config.password,
      host: imapServer,
      port: imapPort,
      tls: imapSecurity === 'SSL/TLS',
      authTimeout: 30000,
      connTimeout: 30000,
      debug: false,
      tlsOptions: {
        rejectUnauthorized: false,
        secureProtocol: 'TLSv1_2_method',
        checkServerIdentity: () => undefined,
        requestCert: false,
        agent: false
      }
    };

    return imapConfig;
  }

  private getImapConfig(emailAddress: string, config: any) {
    const domain = emailAddress.split('@')[1]?.toLowerCase() || '';

    // Auto-detect IMAP settings based on email provider
    let host = config.serverHost || config.imapServer || 'imap.gmail.com';
    let port = config.serverPort || config.imapPort || 993;

    if (domain.includes('gmail.com')) {
      host = 'imap.gmail.com';
      port = 993;
    } else if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      host = 'outlook.office365.com';
      port = 993;
    } else if (domain.includes('yahoo.com')) {
      host = 'imap.mail.yahoo.com';
      port = 993;
    } else if (domain.includes('icloud.com')) {
      host = 'imap.mail.me.com';
      port = 993;
    }

    return {
      user: emailAddress,
      password: config.password || config.pass,
      host: host,
      port: port,
      tls: config.useSSL !== false,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: host
      },
      authTimeout: 30000,
      connTimeout: 30000,
      keepalive: true
    };
  }
}
```

```json
{
  "isActive": false,
  "activeConnections": 0,
  "integrations": []
}
```

```typescript
import { ParsedMail, simpleParser } from 'mailparser';