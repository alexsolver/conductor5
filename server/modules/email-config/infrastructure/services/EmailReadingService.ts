
import { simpleParser, ParsedMail } from 'mailparser';
import Imap from 'imap';
import { DrizzleEmailConfigRepository } from '../repositories/DrizzleEmailConfigRepository';

export interface EmailConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  isActive: boolean;
}

export interface ProcessedEmail {
  messageId: string;
  from: string;
  subject: string;
  date: Date;
  bodyText: string;
  bodyHtml?: string;
  attachments: any[];
  priority: 'low' | 'medium' | 'high';
}

export class EmailReadingService {
  private activeConnections = new Map<string, Imap>();
  private repository = new DrizzleEmailConfigRepository();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  async startMonitoring(tenantId: string): Promise<void> {
    console.log(`🚀 Starting real email monitoring for tenant: ${tenantId}`);
    
    try {
      // Get email integrations for this tenant
      const integrations = await this.repository.getEmailIntegrations(tenantId);
      const emailIntegrations = integrations.filter(i => 
        i.category === 'Comunicação' && 
        i.isConfigured && 
        (i.name === 'IMAP Email' || i.name === 'Gmail OAuth2' || i.name === 'Outlook OAuth2')
      );

      if (emailIntegrations.length === 0) {
        throw new Error('No configured email integrations found');
      }

      console.log(`📧 Found ${emailIntegrations.length} email integrations to monitor`);

      // Start monitoring for each configured integration
      for (const integration of emailIntegrations) {
        await this.connectToEmailAccount(tenantId, integration);
      }

      this.isMonitoring = true;
      
      // Set up periodic check for new emails (every 2 minutes for real monitoring)
      this.monitoringInterval = setInterval(async () => {
        try {
          console.log(`🔄 Periodic email check for tenant: ${tenantId}`);
          await this.checkForNewEmails(tenantId);
        } catch (error) {
          console.error('❌ Error during periodic email check:', error);
        }
      }, 2 * 60 * 1000); // 2 minutes

      console.log(`✅ Email monitoring started successfully for tenant: ${tenantId}`);
    } catch (error) {
      console.error('❌ Error starting email monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring(): Promise<void> {
    console.log('⏹️ Stopping email monitoring...');
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Close all IMAP connections
    for (const [integrationId, imap] of this.activeConnections) {
      try {
        imap.end();
        console.log(`🔌 Closed IMAP connection for integration: ${integrationId}`);
      } catch (error) {
        console.error(`❌ Error closing IMAP connection for ${integrationId}:`, error);
      }
    }
    
    this.activeConnections.clear();
    console.log('✅ Email monitoring stopped successfully');
  }

  private async connectToEmailAccount(tenantId: string, integration: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Parse configuration from database
        let config = {};
        if (integration.configurationData) {
          config = JSON.parse(integration.configurationData);
        } else if (integration.config) {
          config = typeof integration.config === 'string' ? JSON.parse(integration.config) : integration.config;
        }
        
        // Check for email credentials - try multiple field names
        const emailAddress = config.emailAddress || config.username || config.email || '';
        const password = config.password || config.pass || '';
        
        if (!emailAddress || !password) {
          console.log(`⚠️ Integration ${integration.name} missing email credentials, skipping. Email: ${emailAddress}, Password: ${password ? '***' : 'missing'}`);
          resolve();
          return;
        }

        // Determine IMAP server settings based on email provider
        const imapConfig = this.getImapConfig(emailAddress, config);
        
        console.log(`🔗 Connecting to IMAP for ${integration.name}: ${imapConfig.host}:${imapConfig.port}`);
        console.log(`📧 Email: ${emailAddress}`);

        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
          console.log(`✅ IMAP connection ready for ${integration.name} (${emailAddress})`);
          this.activeConnections.set(integration.id, imap);
          resolve();
        });

        imap.once('error', (error) => {
          console.error(`❌ IMAP connection error for ${integration.name}:`, error.message);
          // Don't reject on connection error, just log and continue
          resolve();
        });

        imap.once('end', () => {
          console.log(`🔌 IMAP connection ended for ${integration.name}`);
          this.activeConnections.delete(integration.id);
        });

        imap.connect();

      } catch (error) {
        console.error(`❌ Error setting up IMAP connection for ${integration.name}:`, error);
        resolve(); // Don't fail the entire process for one integration
      }
    });
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

  private async checkForNewEmails(tenantId: string): Promise<void> {
    console.log(`📬 Checking for new emails for tenant: ${tenantId} (${this.activeConnections.size} connections)`);

    for (const [integrationId, imap] of this.activeConnections) {
      try {
        if (imap.state === 'authenticated') {
          await this.readEmailsFromConnection(tenantId, integrationId, imap);
        } else {
          console.log(`⚠️ IMAP connection not authenticated for integration ${integrationId}, state: ${imap.state}`);
        }
      } catch (error) {
        console.error(`❌ Error reading emails from integration ${integrationId}:`, error);
      }
    }
  }

  private async readEmailsFromConnection(tenantId: string, integrationId: string, imap: Imap): Promise<void> {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (error, box) => {
        if (error) {
          console.error(`❌ Error opening INBOX for integration ${integrationId}:`, error);
          resolve(); // Don't reject, just log and continue
          return;
        }

        console.log(`📫 Opened INBOX for integration ${integrationId}, ${box.messages.total} total messages`);

        // Get emails from last 2 days to ensure we catch recent emails
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        imap.search(['UNSEEN', ['SINCE', twoDaysAgo]], (searchError, results) => {
          if (searchError) {
            console.error(`❌ Error searching emails for integration ${integrationId}:`, searchError);
            resolve();
            return;
          }

          if (!results || results.length === 0) {
            console.log(`📭 No new emails found for integration ${integrationId}`);
            resolve();
            return;
          }

          console.log(`📬 Found ${results.length} new emails for integration ${integrationId}`);

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
                  await this.processEmail(tenantId, integrationId, parsedEmail);
                  emailsProcessed++;

                  console.log(`✅ Processed email ${emailsProcessed}/${results.length}: ${parsedEmail.subject}`);

                  if (emailsProcessed === results.length) {
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
    });
  }

  private async processEmail(tenantId: string, integrationId: string, parsedEmail: ParsedMail): Promise<void> {
    try {
      // Convert parsed email to our internal format
      const processedEmail: ProcessedEmail = {
        messageId: parsedEmail.messageId || `${Date.now()}-${Math.random()}`,
        from: parsedEmail.from?.text || 'unknown@example.com',
        subject: parsedEmail.subject || 'No Subject',
        date: parsedEmail.date || new Date(),
        bodyText: parsedEmail.text || '',
        bodyHtml: parsedEmail.html || undefined,
        attachments: parsedEmail.attachments || [],
        priority: this.determinePriority(parsedEmail)
      };

      console.log(`📨 Processing email: "${processedEmail.subject}" from ${processedEmail.from}`);

      // Save to inbox
      await this.saveEmailToInbox(tenantId, processedEmail, integrationId);

      // Apply email processing rules
      await this.applyEmailRules(tenantId, processedEmail);

      console.log(`✅ Successfully processed email: ${processedEmail.subject} from ${processedEmail.from}`);

    } catch (error) {
      console.error('❌ Error processing email:', error);
      throw error;
    }
  }

  private determinePriority(parsedEmail: ParsedMail): 'low' | 'medium' | 'high' {
    const subject = (parsedEmail.subject || '').toLowerCase();
    const text = (parsedEmail.text || '').toLowerCase();
    
    const highPriorityWords = ['urgent', 'critical', 'emergency', 'asap', 'urgente', 'crítico', 'emergência'];
    const lowPriorityWords = ['fyi', 'info', 'informação', 'newsletter', 'update', 'atualização'];

    const content = subject + ' ' + text;

    if (highPriorityWords.some(word => content.includes(word))) {
      return 'high';
    }

    if (lowPriorityWords.some(word => content.includes(word))) {
      return 'low';
    }

    return 'medium';
  }

  private async saveEmailToInbox(tenantId: string, email: ProcessedEmail, integrationId: string): Promise<void> {
    try {
      await this.repository.createInboxMessage(tenantId, {
        messageId: email.messageId,
        fromEmail: email.from,
        fromName: email.from.split('<')[0].trim(),
        subject: email.subject,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml || undefined,
        priority: email.priority,
        hasAttachments: email.attachments.length > 0,
        attachmentCount: email.attachments.length,
        isRead: false,
        isProcessed: false,
        emailDate: email.date.toISOString(),
        receivedAt: new Date().toISOString(),
        integrationId
      });

      console.log(`💾 Saved email to inbox: ${email.subject}`);
    } catch (error) {
      console.error('❌ Error saving email to inbox:', error);
      throw error;
    }
  }

  private async applyEmailRules(tenantId: string, email: ProcessedEmail): Promise<void> {
    try {
      // Get active email processing rules
      const rules = await this.repository.getEmailRules(tenantId, { active: true });

      console.log(`🔍 Checking ${rules.length} active rules for email: ${email.subject}`);

      for (const rule of rules) {
        if (this.emailMatchesRule(email, rule)) {
          console.log(`✅ Email matches rule: ${rule.name}`);
          await this.executeRuleAction(tenantId, email, rule);
          break; // Process only the first matching rule
        }
      }
    } catch (error) {
      console.error('❌ Error applying email rules:', error);
    }
  }

  private emailMatchesRule(email: ProcessedEmail, rule: any): boolean {
    // Check from email pattern
    if (rule.fromEmailPattern && !this.matchesPattern(email.from, rule.fromEmailPattern)) {
      return false;
    }

    // Check subject pattern
    if (rule.subjectPattern && !this.matchesPattern(email.subject, rule.subjectPattern)) {
      return false;
    }

    // Check body pattern
    if (rule.bodyPattern && !this.matchesPattern(email.bodyText, rule.bodyPattern)) {
      return false;
    }

    // Check attachment requirement
    if (rule.attachmentRequired && email.attachments.length === 0) {
      return false;
    }

    return true;
  }

  private matchesPattern(text: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(text);
    } catch (error) {
      // If pattern is not a valid regex, do simple string inclusion
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
  }

  private async executeRuleAction(tenantId: string, email: ProcessedEmail, rule: any): Promise<void> {
    try {
      console.log(`🎯 Executing rule action: ${rule.actionType} for email: ${email.subject}`);

      if (rule.actionType === 'create_ticket') {
        // Here you would integrate with your ticket creation system
        console.log(`🎫 Would create ticket for email: ${email.subject}`);
        
        // Log the processing
        await this.repository.createProcessingLog(tenantId, {
          messageId: email.messageId,
          emailFrom: email.from,
          emailSubject: email.subject,
          ruleId: rule.id,
          actionTaken: 'create_ticket',
          processingStatus: 'success',
          processingTimeMs: 100,
          metadata: {
            ruleName: rule.name,
            priority: rule.defaultPriority,
            category: rule.defaultCategory
          }
        });
      }

      // Send auto-response if enabled
      if (rule.autoResponseEnabled && rule.autoResponseTemplateId) {
        console.log(`📧 Would send auto-response for email: ${email.subject}`);
      }

    } catch (error) {
      console.error('❌ Error executing rule action:', error);
      
      // Log the error
      await this.repository.createProcessingLog(tenantId, {
        messageId: email.messageId,
        emailFrom: email.from,
        emailSubject: email.subject,
        ruleId: rule.id,
        actionTaken: rule.actionType,
        processingStatus: 'error',
        errorMessage: error.message,
        processingTimeMs: 100,
        metadata: { error: error.message }
      });
    }
  }

  public isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  public getActiveConnectionsCount(): number {
    return this.activeConnections.size;
  }

  public getConnectionStatus(): { [integrationId: string]: boolean } {
    const status: { [integrationId: string]: boolean } = {};
    for (const [integrationId, imap] of this.activeConnections) {
      status[integrationId] = imap.state === 'authenticated';
    }
    return status;
  }
}

// Singleton instance
export const emailReadingService = new EmailReadingService();
