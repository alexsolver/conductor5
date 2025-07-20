import { DrizzleEmailConfigRepository } from '../repositories/DrizzleEmailConfigRepository.js';
import { EmailProcessingService } from '../../application/services/EmailProcessingService.js';

export class EmailReadingService {
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private activeConnections = new Map<string, any>();
  private repository = new DrizzleEmailConfigRepository();
  private processingService = new EmailProcessingService();

  async startMonitoring(tenantId: string): Promise<void> {
    if (this.isMonitoring) {
      console.log('📧 Email monitoring is already running');
      return;
    }

    console.log('📧 Starting email monitoring...');
    
    try {
      // Get connected integrations
      const integrations = await this.repository.getConnectedIntegrations(tenantId);
      console.log(`🔍 Found ${integrations.length} connected integrations`);

      if (integrations.length === 0) {
        console.log('⚠️ No connected integrations found');
        return;
      }

      // Connect to each integration
      for (const integration of integrations) {
        try {
          await this.connectToEmailIntegration(tenantId, integration);
        } catch (error) {
          console.error(`❌ Failed to connect to ${integration.name}:`, error);
        }
      }

      this.isMonitoring = true;

      // Start checking for emails every 2 minutes
      this.checkInterval = setInterval(() => {
        this.checkAllEmails(tenantId);
      }, 2 * 60 * 1000);

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
    for (const [integrationId, connection] of this.activeConnections) {
      try {
        if (connection && connection.imap && typeof connection.imap.end === 'function') {
          connection.imap.end();
        }
      } catch (error) {
        console.error(`Error closing connection for ${integrationId}:`, error);
      }
    }

    this.activeConnections.clear();
    console.log('✅ Email monitoring stopped');
  }

  getMonitoringStatus(): any {
    const activeIntegrations = Array.from(this.activeConnections.keys());
    const connectionCount = this.activeConnections.size;
    
    // Check if connections are actually authenticated
    let authenticatedConnections = 0;
    for (const [integrationId, connection] of this.activeConnections) {
      if (connection && connection.imap && connection.imap.state === 'authenticated') {
        authenticatedConnections++;
      }
    }

    const isActive = this.isMonitoring && this.checkInterval !== null && connectionCount > 0;

    return {
      isActive,
      connectionCount,
      authenticatedConnections,
      activeIntegrations,
      monitoringInterval: this.checkInterval !== null,
      lastCheck: new Date().toISOString(),
      status: isActive ? 'Monitoramento ativo' : 'Monitoramento pausado'
    };
  }

  private async connectToEmailIntegration(tenantId: string, integration: any): Promise<void> {
    console.log(`🔌 Connecting to integration: ${integration.name} (${integration.emailAddress})`);

    const config = await this.repository.getIntegrationConfig(tenantId, integration.id);

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

    // Create real IMAP connection using dynamic import
    const { default: Imap } = await import('imap');
    const imap = new Imap(imapConfig);

    return new Promise((resolve, reject) => {
      imap.once('ready', () => {
        console.log(`✅ Connected to ${integration.name} (${config.emailAddress}) - REAL CONNECTION`);
        
        // Store real connection
        this.activeConnections.set(integration.id, { 
          imap,
          state: 'authenticated', 
          emailAddress: config.emailAddress,
          integrationName: integration.name,
          config: imapConfig 
        });

        // Immediately check for new emails
        this.checkEmailsForConnection(tenantId, integration.id);
        resolve(undefined);
      });

      imap.once('error', (err: any) => {
        console.error(`❌ IMAP Error for ${config.emailAddress}:`, err);
        reject(err);
      });

      imap.once('end', () => {
        console.log(`📧 IMAP connection ended for ${config.emailAddress}`);
        this.activeConnections.delete(integration.id);
      });

      console.log(`🔄 Connecting to real IMAP server...`);
      imap.connect();
    });
  }

  private getImapConfig(emailAddress: string, config: any) {
    // Gmail configuration
    if (emailAddress.includes('@gmail.com')) {
      return {
        user: config.emailAddress,
        password: config.password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      };
    }

    // Default configuration
    return {
      user: config.emailAddress,
      password: config.password,
      host: config.imapHost || 'imap.gmail.com',
      port: parseInt(config.imapPort) || 993,
      tls: config.imapSecurity === 'SSL/TLS'
    };
  }

  private async checkAllEmails(tenantId: string): Promise<void> {
    console.log(`📧 Checking emails for ${this.activeConnections.size} connections...`);

    const promises = [];
    for (const [integrationId, connection] of this.activeConnections) {
      try {
        if (connection && connection.state === 'authenticated') {
          promises.push(this.checkEmailsForConnection(tenantId, integrationId));
        } else {
          console.log(`⚠️ IMAP connection not authenticated for integration ${integrationId}, state: ${connection?.state}`);
        }
      } catch (error) {
        console.error(`❌ Error reading emails from integration ${integrationId}:`, error);
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  private async checkEmailsForConnection(tenantId: string, integrationId: string): Promise<void> {
    const connection = this.activeConnections.get(integrationId);
    if (!connection || !connection.imap) {
      console.log(`⚠️ No IMAP connection found for integration ${integrationId}`);
      return;
    }

    const imap = connection.imap;
    
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err: any, box: any) => {
        if (err) {
          console.error(`❌ Error opening INBOX for ${connection.emailAddress}:`, err);
          reject(err);
          return;
        }

        console.log(`📬 Opened INBOX for ${connection.emailAddress}: ${box.messages.total} messages`);

        if (box.messages.total === 0) {
          console.log(`📭 No messages found in ${connection.emailAddress}`);
          resolve();
          return;
        }

        // Search for recent emails (last 20 to avoid overwhelming)
        const searchCriteria = ['ALL'];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          markSeen: false,
          struct: true
        };

        imap.search(searchCriteria, (err: any, results: any[]) => {
          if (err) {
            console.error(`❌ Search error for ${connection.emailAddress}:`, err);
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log(`📭 No matching emails found in ${connection.emailAddress}`);
            resolve();
            return;
          }

          console.log(`📧 Found ${results.length} emails in ${connection.emailAddress}`);

          // Fetch only the last 20 emails to avoid overwhelming
          const emailsToFetch = results.slice(-20);
          
          const fetch = imap.fetch(emailsToFetch, fetchOptions);
          const processedEmails: any[] = [];

          fetch.on('message', (msg: any, seqno: number) => {
            const emailData: any = { seqno };
            
            msg.on('body', (stream: any, info: any) => {
              let buffer = '';
              stream.on('data', (chunk: any) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                if (info.which === 'HEADER') {
                  emailData.header = this.parseEmailHeaders(buffer);
                } else if (info.which === 'TEXT') {
                  emailData.body = buffer;
                } else {
                  emailData.full = buffer;
                }
              });
            });

            msg.once('attributes', (attrs: any) => {
              emailData.attributes = attrs;
            });

            msg.once('end', () => {
              processedEmails.push(emailData);
            });
          });

          fetch.once('error', (err: any) => {
            console.error(`❌ Fetch error for ${connection.emailAddress}:`, err);
            reject(err);
          });

          fetch.once('end', async () => {
            console.log(`📧 Finished fetching ${processedEmails.length} emails from ${connection.emailAddress}`);
            
            // Process each email
            for (const email of processedEmails) {
              try {
                await this.processNewEmail(tenantId, integrationId, email, connection);
              } catch (error) {
                console.error(`❌ Error processing email ${email.seqno}:`, error);
              }
            }
            
            resolve();
          });
        });
      });
    });
  }

  private parseEmailHeaders(headerText: string): any {
    const headers: any = {};
    const lines = headerText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        headers[key.toLowerCase()] = value;
      }
    }
    
    return headers;
  }

  private async processNewEmail(tenantId: string, integrationId: string, emailData: any, connection: any): Promise<void> {
    try {
      const headers = emailData.header || {};
      const subject = headers.subject || 'No Subject';
      const fromHeader = headers.from || 'Unknown Sender';
      const date = headers.date || new Date().toISOString();

      // Parse from email
      const fromMatch = fromHeader.match(/<([^>]+)>/);
      const fromEmail = fromMatch ? fromMatch[1] : fromHeader;
      const fromName = fromHeader.replace(/<[^>]+>/, '').trim();

      // Generate unique message ID
      const messageId = `imap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Parse and clean email date
      const emailDate = new Date(date);
      
      // Filter out old emails (only 2025+ emails)
      if (emailDate && emailDate.getFullYear() < 2025) {
        console.log(`⏭️ Skipping old email from ${emailDate.getFullYear()}: ${subject}`);
        return;
      }

      console.log(`📧 Processing new email: ${subject} from ${fromEmail}`);

      // Detect priority based on subject and content
      const priority = this.detectEmailPriority(subject, emailData.body || '');

      // Save to inbox
      await this.repository.saveInboxMessage({
        tenantId,
        messageId,
        threadId: null,
        fromEmail: fromEmail,
        fromName: fromName || fromEmail,
        toEmail: connection.emailAddress,
        ccEmails: JSON.stringify([]),
        bccEmails: JSON.stringify([]),
        subject,
        bodyText: emailData.body || '',
        bodyHtml: emailData.full || '',
        hasAttachments: false,
        attachmentCount: 0,
        attachmentDetails: JSON.stringify([]),
        emailHeaders: JSON.stringify(headers),
        priority,
        isRead: false,
        isProcessed: false,
        emailDate: emailDate.toISOString(),
        receivedAt: new Date()
      });

      console.log(`✅ Saved email to inbox: ${subject} (Priority: ${priority})`);

    } catch (error) {
      console.error(`❌ Error processing new email:`, error);
    }
  }

  private detectEmailPriority(subject: string, body: string): 'low' | 'medium' | 'high' {
    const text = (subject + ' ' + body).toLowerCase();
    
    if (text.includes('urgente') || text.includes('crítico') || text.includes('emergência') || 
        text.includes('urgent') || text.includes('critical') || text.includes('emergency')) {
      return 'high';
    }
    
    if (text.includes('importante') || text.includes('prioritário') || 
        text.includes('important') || text.includes('priority')) {
      return 'medium';
    }
    
    return 'low';
  }

  private async getIntegrationConfig(tenantId: string, integrationId: string): Promise<any> {
    return this.repository.getIntegrationConfig(tenantId, integrationId);
  }
}