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
    const activeIntegrations = Array.from(this.activeConnections.keys());
    const connectionCount = this.activeConnections.size;
    
    // Check if connections are actually authenticated
    let authenticatedConnections = 0;
    for (const [integrationId, imap] of this.activeConnections) {
      if (imap && imap.state === 'authenticated') {
        authenticatedConnections++;
      }
    }

    const isActive = this.isMonitoring && this.checkInterval !== null && authenticatedConnections > 0;

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

    // Use require for IMAP as it's a CommonJS module
    const Imap = require('imap');
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
    for (const [integrationId, imap] of this.activeConnections) {
      try {
        if (imap && imap.state === 'authenticated') {
          promises.push(this.readEmailsFromConnection(tenantId, integrationId, imap));
        } else {
          console.log(`⚠️ IMAP connection not authenticated for integration ${integrationId}, state: ${imap?.state}`);
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
      this.importLatestEmails(tenantId, integrationId, imap, resolve);
    });
  }

  private importLatestEmails(tenantId: string, integrationId: string, imap: any, resolve: () => void): void {
    // Get the last 20 emails from the inbox
    const totalMessages = imap.seq.total;
    if (totalMessages === 0) {
      console.log(`📭 No emails in inbox for integration ${integrationId}`);
      resolve();
      return;
    }

    const startSeq = Math.max(1, totalMessages - 19); // Get last 20 emails
    const endSeq = totalMessages;

    console.log(`📧 Fetching emails ${startSeq} to ${endSeq} (last 20) for integration ${integrationId}`);

    const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
      bodies: '',
      markSeen: false,
      struct: true
    });

    let emailsProcessed = 0;
    const emailsToSave: any[] = [];

    fetch.on('message', (msg: any, seqno: number) => {
      let emailData = '';

      msg.on('body', (stream: any) => {
        stream.on('data', (chunk: any) => {
          emailData += chunk.toString('utf8');
        });

        stream.once('end', () => {
          try {
            const emailInfo = this.parseEmailData(emailData, integrationId, seqno);
            if (emailInfo) {
              emailsToSave.push(emailInfo);
              console.log(`📨 Parsed email ${emailsProcessed + 1}: ${emailInfo.fromEmail} -> ${emailInfo.subject}`);
            }
          } catch (error) {
            console.error(`❌ Error parsing email ${seqno}:`, error);
          }
        });
      });

      msg.on('end', () => {
        emailsProcessed++;
      });
    });

    fetch.once('error', (fetchError: any) => {
      console.error(`❌ Error fetching emails for integration ${integrationId}:`, fetchError);
      resolve();
    });

    fetch.once('end', async () => {
      console.log(`📧 Finished fetching ${emailsProcessed} emails for integration ${integrationId}`);
      
      if (emailsToSave.length > 0) {
        await this.processAndSaveEmails(tenantId, emailsToSave);
      }
      
      resolve();
    });
  }

  private parseEmailData(emailData: string, integrationId: string, seqno: number): any | null {
    try {
      const headerMatch = emailData.match(/^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/);
      if (!headerMatch) {
        console.error(`❌ Could not parse email headers for seqno ${seqno}`);
        return null;
      }

      const headerSection = headerMatch[1];
      const bodySection = headerMatch[2];
      const headers = this.parseHeaders(headerSection);

      const emailDate = this.parseDate(headers.date);
      
      // Filter emails by year (only 2025 and later)
      if (emailDate && emailDate.getFullYear() < 2025) {
        console.log(`⏭️ Skipping old email from ${emailDate.getFullYear()}: ${headers.subject || 'No Subject'}`);
        return null;
      }

      return {
        messageId: headers['message-id'] || `imap-${integrationId}-${seqno}`,
        fromEmail: this.extractEmail(headers.from || ''),
        fromName: this.cleanQuotedPrintable(this.extractName(headers.from || '')),
        toEmail: this.extractEmail(headers.to || ''),
        subject: this.cleanQuotedPrintable(headers.subject || 'No Subject'),
        bodyText: this.extractTextFromBody(bodySection),
        bodyHtml: this.extractHtmlFromBody(bodySection),
        hasAttachments: false,
        attachmentCount: 0,
        attachmentDetails: [],
        emailHeaders: headers,
        priority: this.determinePriority(headers.subject || '', bodySection),
        emailDate: emailDate || new Date(),
        receivedAt: new Date()
      };
    } catch (error) {
      console.error(`❌ Error parsing email data for seqno ${seqno}:`, error);
      return null;
    }
  }

  private parseHeaders(headerSection: string): any {
    const headers: any = {};
    const lines = headerSection.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([^:]+):\s*(.*)/);
      
      if (match) {
        const key = match[1].toLowerCase();
        let value = match[2];
        
        // Handle multi-line headers
        while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
          i++;
          value += ' ' + lines[i].trim();
        }
        
        headers[key] = value;
      }
    }
    
    return headers;
  }

  private extractEmail(field: string): string {
    const match = field.match(/<([^>]+)>/);
    return match ? match[1] : field.trim();
  }

  private extractName(field: string): string {
    const match = field.match(/^([^<]+)</);
    return match ? match[1].trim().replace(/"/g, '') : '';
  }

  private cleanQuotedPrintable(text: string): string {
    if (!text) return '';
    
    // Handle UTF-8 quoted-printable encoding
    return text
      .replace(/=C3=A1/g, 'á')
      .replace(/=C3=A9/g, 'é')
      .replace(/=C3=AD/g, 'í')
      .replace(/=C3=B3/g, 'ó')
      .replace(/=C3=BA/g, 'ú')
      .replace(/=C3=A7/g, 'ç')
      .replace(/=C3=A3/g, 'ã')
      .replace(/=C3=B5/g, 'õ')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã£/g, 'ã')
      .replace(/Ãµ/g, 'õ');
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    try {
      return new Date(dateStr);
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return null;
    }
  }

  private extractTextFromBody(body: string): string {
    // Simple text extraction - remove HTML tags if present
    return body.replace(/<[^>]*>/g, '').trim();
  }

  private extractHtmlFromBody(body: string): string {
    // Return body as-is for HTML content
    return body.trim();
  }

  private determinePriority(subject: string, body: string): string {
    const text = (subject + ' ' + body).toLowerCase();
    
    if (text.includes('urgente') || text.includes('urgent') || text.includes('crítico') || text.includes('emergency')) {
      return 'high';
    }
    
    if (text.includes('importante') || text.includes('important') || text.includes('prioridade')) {
      return 'medium';
    }
    
    return 'low';
  }

  private async processAndSaveEmails(tenantId: string, emails: any[]): Promise<void> {
    console.log(`💾 Processing and saving ${emails.length} emails...`);
    
    for (const email of emails) {
      try {
        // Save to inbox
        await this.repository.saveInboxMessage(tenantId, email);
        
        // Process with rules (create tickets if applicable)
        await this.processingService.processEmail(tenantId, email);
        
        console.log(`✅ Processed email: ${email.subject}`);
      } catch (error) {
        console.error(`❌ Error processing email ${email.subject}:`, error);
      }
    }
  }

  async refreshConnections(tenantId: string): Promise<void> {
    console.log('🔄 Refreshing email connections...');
    
    // Stop current monitoring
    await this.stopMonitoring();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Restart monitoring
    await this.startMonitoring(tenantId);
    
    console.log('✅ Email connections refreshed');
  }

  async importHistoricalEmails(tenantId: string): Promise<void> {
    console.log('📥 Starting historical email import...');
    
    for (const [integrationId, imap] of this.activeConnections) {
      if (imap && imap.state === 'authenticated') {
        console.log(`📥 Importing historical emails for integration ${integrationId}`);
        await this.readEmailsFromConnection(tenantId, integrationId, imap);
      }
    }
    
    console.log('✅ Historical email import completed');
  }
}