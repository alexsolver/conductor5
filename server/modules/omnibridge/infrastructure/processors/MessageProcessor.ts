
<file_path>server/modules/omnibridge/infrastructure/processors/MessageProcessor.ts</file_path>
<change_summary>Create message processor for real channel communication</change_summary>

export interface ReplyMessage {
  channelType: string;
  recipient: string;
  content: string;
  tenantId: string;
  automationRule?: {
    ruleId: string;
    ruleName: string;
  };
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MessageProcessor {
  /**
   * Send reply message through appropriate channel
   */
  async sendReply(message: ReplyMessage): Promise<SendResult> {
    console.log(`📤 [MessageProcessor] Sending reply via ${message.channelType} to ${message.recipient}`);

    try {
      switch (message.channelType) {
        case 'telegram':
          return await this.sendTelegramReply(message);
        
        case 'discord':
          return await this.sendDiscordReply(message);
        
        case 'whatsapp':
          return await this.sendWhatsAppReply(message);
        
        case 'email':
          return await this.sendEmailReply(message);
        
        case 'sms':
          return await this.sendSMSReply(message);
        
        default:
          console.warn(`⚠️ [MessageProcessor] Unsupported channel type: ${message.channelType}`);
          return {
            success: false,
            error: `Unsupported channel type: ${message.channelType}`
          };
      }
    } catch (error) {
      console.error(`❌ [MessageProcessor] Error sending reply:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send Telegram reply
   */
  private async sendTelegramReply(message: ReplyMessage): Promise<SendResult> {
    try {
      console.log(`🤖 [MessageProcessor] Sending Telegram reply to ${message.recipient}`);

      // Get Telegram bot configuration for tenant
      const botToken = await this.getTelegramBotToken(message.tenantId);
      if (!botToken) {
        return {
          success: false,
          error: 'Telegram bot not configured for tenant'
        };
      }

      const chatId = message.recipient;
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message.content,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        console.log(`✅ [MessageProcessor] Telegram message sent successfully: ${result.result.message_id}`);
        return {
          success: true,
          messageId: String(result.result.message_id)
        };
      } else {
        console.error(`❌ [MessageProcessor] Telegram API error:`, result);
        return {
          success: false,
          error: result.description || 'Telegram API error'
        };
      }
    } catch (error) {
      console.error(`❌ [MessageProcessor] Telegram send error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Telegram send failed'
      };
    }
  }

  /**
   * Send Discord reply
   */
  private async sendDiscordReply(message: ReplyMessage): Promise<SendResult> {
    try {
      console.log(`🎮 [MessageProcessor] Sending Discord reply to ${message.recipient}`);

      // Get Discord bot configuration for tenant
      const botToken = await this.getDiscordBotToken(message.tenantId);
      if (!botToken) {
        return {
          success: false,
          error: 'Discord bot not configured for tenant'
        };
      }

      // Discord channel/user ID format: discord:channel:123456 or discord:123456
      const channelId = message.recipient.replace('discord:channel:', '').replace('discord:', '');
      const discordApiUrl = `https://discord.com/api/v10/channels/${channelId}/messages`;

      const response = await fetch(discordApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message.content
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ [MessageProcessor] Discord message sent successfully: ${result.id}`);
        return {
          success: true,
          messageId: String(result.id)
        };
      } else {
        console.error(`❌ [MessageProcessor] Discord API error:`, result);
        return {
          success: false,
          error: result.message || 'Discord API error'
        };
      }
    } catch (error) {
      console.error(`❌ [MessageProcessor] Discord send error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Discord send failed'
      };
    }
  }

  /**
   * Send WhatsApp reply
   */
  private async sendWhatsAppReply(message: ReplyMessage): Promise<SendResult> {
    try {
      console.log(`📱 [MessageProcessor] Sending WhatsApp reply to ${message.recipient}`);
      
      // TODO: Implement WhatsApp Business API integration
      console.log(`📝 [MessageProcessor] WhatsApp reply content: ${message.content}`);
      
      return {
        success: false,
        error: 'WhatsApp integration not yet implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'WhatsApp send failed'
      };
    }
  }

  /**
   * Send email reply
   */
  private async sendEmailReply(message: ReplyMessage): Promise<SendResult> {
    try {
      console.log(`📧 [MessageProcessor] Sending email reply to ${message.recipient}`);
      
      // TODO: Implement email service integration
      console.log(`📝 [MessageProcessor] Email reply content: ${message.content}`);
      
      return {
        success: false,
        error: 'Email integration not yet implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed'
      };
    }
  }

  /**
   * Send SMS reply
   */
  private async sendSMSReply(message: ReplyMessage): Promise<SendResult> {
    try {
      console.log(`📱 [MessageProcessor] Sending SMS reply to ${message.recipient}`);
      
      // TODO: Implement SMS service integration
      console.log(`📝 [MessageProcessor] SMS reply content: ${message.content}`);
      
      return {
        success: false,
        error: 'SMS integration not yet implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS send failed'
      };
    }
  }

  /**
   * Get Telegram bot token for tenant
   */
  private async getTelegramBotToken(tenantId: string): Promise<string | null> {
    try {
      // TODO: Fetch from tenant configuration database
      // For now, return a placeholder or environment variable
      console.log(`🔑 [MessageProcessor] Getting Telegram bot token for tenant: ${tenantId}`);
      
      // Check environment variable for development
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        console.log(`✅ [MessageProcessor] Using environment bot token`);
        return botToken;
      }

      console.warn(`⚠️ [MessageProcessor] No Telegram bot token configured for tenant: ${tenantId}`);
      return null;
    } catch (error) {
      console.error(`❌ [MessageProcessor] Error getting bot token:`, error);
      return null;
    }
  }

  /**
   * Get Discord bot token for tenant
   */
  private async getDiscordBotToken(tenantId: string): Promise<string | null> {
    try {
      console.log(`🔑 [MessageProcessor] Getting Discord bot token for tenant: ${tenantId}`);
      
      // Import pool for database access
      const { pool } = await import('../../../db');
      const schema = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Get Discord bot token from integrations table
      const result = await pool.query(
        `SELECT config FROM ${schema}.integrations WHERE id = 'discord' LIMIT 1`
      );

      if (result.rows.length > 0 && result.rows[0].config) {
        const config = result.rows[0].config;
        const botToken = config.botToken || config.apiKey;
        
        if (botToken) {
          console.log(`✅ [MessageProcessor] Found Discord bot token in database`);
          return botToken;
        }
      }

      // Fallback to environment variable for development
      const envToken = process.env.DISCORD_BOT_TOKEN;
      if (envToken) {
        console.log(`✅ [MessageProcessor] Using environment Discord bot token`);
        return envToken;
      }

      console.warn(`⚠️ [MessageProcessor] No Discord bot token configured for tenant: ${tenantId}`);
      return null;
    } catch (error) {
      console.error(`❌ [MessageProcessor] Error getting Discord bot token:`, error);
      return null;
    }
  }
}
