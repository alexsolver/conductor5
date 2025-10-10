import WebSocket from 'ws';
import { pool } from '../db';
import { createId } from '@paralleldrive/cuid2';

interface DiscordMessage {
  id: string;
  channel_id: string;
  guild_id?: string;
  author: {
    id: string;
    username: string;
    bot?: boolean;
    discriminator?: string;
  };
  content: string;
  timestamp: string;
}

interface DiscordGatewayPayload {
  op: number;
  d?: any;
  s?: number;
  t?: string;
}

interface DiscordConnection {
  ws: WebSocket;
  tenantId: string;
  botToken: string;
  heartbeatInterval?: NodeJS.Timeout;
  sessionId?: string;
  sequenceNumber: number | null;
}

class DiscordGatewayService {
  private connections: Map<string, DiscordConnection> = new Map();
  private readonly GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
  
  private readonly OPCODES = {
    DISPATCH: 0,
    HEARTBEAT: 1,
    IDENTIFY: 2,
    PRESENCE_UPDATE: 3,
    VOICE_STATE_UPDATE: 4,
    RESUME: 6,
    RECONNECT: 7,
    REQUEST_GUILD_MEMBERS: 8,
    INVALID_SESSION: 9,
    HELLO: 10,
    HEARTBEAT_ACK: 11
  };

  private readonly INTENTS = {
    GUILDS: 1 << 0,
    GUILD_MESSAGES: 1 << 9,
    GUILD_MESSAGE_CONTENT: 1 << 15,
    DIRECT_MESSAGES: 1 << 12,
    DIRECT_MESSAGE_CONTENT: 1 << 15
  };

  async connect(tenantId: string, botToken: string): Promise<void> {
    const connectionKey = `${tenantId}:${botToken}`;
    
    if (this.connections.has(connectionKey)) {
      console.log(`🎮 [DISCORD-GATEWAY] Already connected for tenant: ${tenantId}`);
      return;
    }

    console.log(`🎮 [DISCORD-GATEWAY] Connecting to Discord Gateway for tenant: ${tenantId}`);

    const ws = new WebSocket(this.GATEWAY_URL);
    
    const connection: DiscordConnection = {
      ws,
      tenantId,
      botToken,
      sequenceNumber: null
    };

    this.connections.set(connectionKey, connection);

    ws.on('open', () => {
      console.log(`✅ [DISCORD-GATEWAY] WebSocket connected for tenant: ${tenantId}`);
    });

    ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(connection, data);
    });

    ws.on('close', (code, reason) => {
      console.log(`❌ [DISCORD-GATEWAY] WebSocket closed for tenant: ${tenantId}`, {
        code,
        reason: reason.toString()
      });
      this.cleanup(connectionKey);
      
      if (code === 4004) {
        console.error(`❌ [DISCORD-GATEWAY] Authentication failed - Invalid Bot Token`);
        return;
      }
      
      setTimeout(() => {
        console.log(`🔄 [DISCORD-GATEWAY] Reconnecting for tenant: ${tenantId}`);
        this.connect(tenantId, botToken);
      }, 5000);
    });

    ws.on('error', (error) => {
      console.error(`❌ [DISCORD-GATEWAY] WebSocket error for tenant: ${tenantId}:`, error);
    });
  }

  private handleMessage(connection: DiscordConnection, data: WebSocket.Data): void {
    try {
      const payload: DiscordGatewayPayload = JSON.parse(data.toString());
      
      if (payload.s !== null && payload.s !== undefined) {
        connection.sequenceNumber = payload.s;
      }

      switch (payload.op) {
        case this.OPCODES.HELLO:
          this.handleHello(connection, payload.d);
          break;

        case this.OPCODES.DISPATCH:
          this.handleDispatch(connection, payload);
          break;

        case this.OPCODES.HEARTBEAT_ACK:
          console.log(`💓 [DISCORD-GATEWAY] Heartbeat ACK received for tenant: ${connection.tenantId}`);
          break;

        case this.OPCODES.RECONNECT:
          console.log(`🔄 [DISCORD-GATEWAY] Reconnect requested for tenant: ${connection.tenantId}`);
          this.reconnect(connection);
          break;

        case this.OPCODES.INVALID_SESSION:
          console.log(`⚠️ [DISCORD-GATEWAY] Invalid session for tenant: ${connection.tenantId}`);
          this.identify(connection);
          break;

        default:
          console.log(`🎮 [DISCORD-GATEWAY] Opcode ${payload.op} received`);
      }
    } catch (error) {
      console.error(`❌ [DISCORD-GATEWAY] Error parsing message:`, error);
    }
  }

  private handleHello(connection: DiscordConnection, data: any): void {
    const heartbeatInterval = data.heartbeat_interval;
    console.log(`👋 [DISCORD-GATEWAY] HELLO received, heartbeat interval: ${heartbeatInterval}ms`);

    connection.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat(connection);
    }, heartbeatInterval);

    this.identify(connection);
  }

  private identify(connection: DiscordConnection): void {
    const identifyPayload = {
      op: this.OPCODES.IDENTIFY,
      d: {
        token: connection.botToken,
        intents: this.INTENTS.GUILDS | 
                 this.INTENTS.GUILD_MESSAGES | 
                 this.INTENTS.GUILD_MESSAGE_CONTENT |
                 this.INTENTS.DIRECT_MESSAGES |
                 this.INTENTS.DIRECT_MESSAGE_CONTENT,
        properties: {
          os: 'linux',
          browser: 'conductor',
          device: 'conductor'
        }
      }
    };

    console.log(`🔐 [DISCORD-GATEWAY] Sending IDENTIFY for tenant: ${connection.tenantId}`);
    connection.ws.send(JSON.stringify(identifyPayload));
  }

  private sendHeartbeat(connection: DiscordConnection): void {
    const heartbeatPayload = {
      op: this.OPCODES.HEARTBEAT,
      d: connection.sequenceNumber
    };

    connection.ws.send(JSON.stringify(heartbeatPayload));
    console.log(`💓 [DISCORD-GATEWAY] Heartbeat sent for tenant: ${connection.tenantId}`);
  }

  private async handleDispatch(connection: DiscordConnection, payload: DiscordGatewayPayload): Promise<void> {
    const eventType = payload.t;
    const eventData = payload.d;

    console.log(`📨 [DISCORD-GATEWAY] Event received: ${eventType}`);

    switch (eventType) {
      case 'READY':
        connection.sessionId = eventData.session_id;
        console.log(`✅ [DISCORD-GATEWAY] Bot ready! Session ID: ${connection.sessionId}`);
        console.log(`✅ [DISCORD-GATEWAY] Connected as: ${eventData.user.username}#${eventData.user.discriminator}`);
        console.log(`✅ [DISCORD-GATEWAY] Guilds: ${eventData.guilds.length}`);
        break;

      case 'MESSAGE_CREATE':
        await this.handleMessageCreate(connection, eventData);
        break;

      case 'GUILD_CREATE':
        console.log(`🏰 [DISCORD-GATEWAY] Guild joined: ${eventData.name} (ID: ${eventData.id})`);
        break;

      default:
        console.log(`🎮 [DISCORD-GATEWAY] Unhandled event: ${eventType}`);
    }
  }

  private async handleMessageCreate(connection: DiscordConnection, message: DiscordMessage): Promise<void> {
    try {
      if (message.author.bot) {
        console.log(`🤖 [DISCORD-GATEWAY] Ignoring bot message`);
        return;
      }

      console.log(`📨 [DISCORD-GATEWAY] Message received:`, {
        author: message.author.username,
        content: message.content,
        channelId: message.channel_id,
        guildId: message.guild_id
      });

      const schema = `tenant_${connection.tenantId.replace(/-/g, '_')}`;
      
      const channelResult = await pool.query(
        `SELECT id FROM ${schema}.omnibridge_channels 
         WHERE tenant_id = $1 AND id = 'discord' LIMIT 1`,
        [connection.tenantId]
      );

      let channelDbId: string;
      if (channelResult.rows.length === 0) {
        const insertChannel = await pool.query(
          `INSERT INTO ${schema}.omnibridge_channels (id, tenant_id, name, type, status, config, is_enabled)
           VALUES ('discord', $1, 'Discord', 'chat', 'active', '{}', true)
           RETURNING id`,
          [connection.tenantId]
        );
        channelDbId = insertChannel.rows[0].id;
        console.log(`✅ [DISCORD-GATEWAY] Created Discord channel: ${channelDbId}`);
      } else {
        channelDbId = channelResult.rows[0].id;
      }

      const messageId = createId();
      const conversationId = `discord:${message.author.id}`;

      await pool.query(
        `INSERT INTO ${schema}.omnibridge_messages 
         (id, tenant_id, channel_id, conversation_id, external_id, "from", "to", subject, body, 
          channel_type, status, priority, metadata, received_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          messageId,
          connection.tenantId,
          channelDbId,
          conversationId,
          message.id,
          `discord:${message.author.id}`,
          `discord:channel:${message.channel_id}`,
          `Discord - ${message.author.username}`,
          message.content,
          'discord',
          'received',
          'medium',
          JSON.stringify({
            authorId: message.author.id,
            authorUsername: message.author.username,
            channelId: message.channel_id,
            guildId: message.guild_id,
            timestamp: message.timestamp
          })
        ]
      );

      console.log(`✅ [DISCORD-GATEWAY] Message saved to OmniBridge: ${messageId}`);

      await this.processAutomation(connection.tenantId, schema, messageId, message);

    } catch (error) {
      console.error(`❌ [DISCORD-GATEWAY] Error processing message:`, error);
    }
  }

  private async processAutomation(
    tenantId: string,
    schema: string,
    messageId: string,
    message: DiscordMessage
  ): Promise<void> {
    try {
      const rulesResult = await pool.query(
        `SELECT * FROM ${schema}.omnibridge_automation_rules 
         WHERE tenant_id = $1 AND enabled = true
         ORDER BY priority DESC`,
        [tenantId]
      );

      if (rulesResult.rows.length === 0) {
        console.log(`🤖 [DISCORD-GATEWAY] No automation rules found for tenant: ${tenantId}`);
        return;
      }

      console.log(`🤖 [DISCORD-GATEWAY] Found ${rulesResult.rows.length} automation rules`);

      for (const rule of rulesResult.rows) {
        const conditions = rule.conditions;
        
        if (this.evaluateConditions(conditions, message)) {
          console.log(`✅ [DISCORD-GATEWAY] Rule matched: ${rule.name}`);
          
          await pool.query(
            `UPDATE ${schema}.omnibridge_automation_rules 
             SET execution_count = COALESCE(execution_count, 0) + 1,
                 last_executed = NOW()
             WHERE id = $1`,
            [rule.id]
          );

          for (const action of rule.actions) {
            await this.executeAction(tenantId, schema, action, message, messageId);
          }
        }
      }
    } catch (error) {
      console.error(`❌ [DISCORD-GATEWAY] Error processing automation:`, error);
    }
  }

  private evaluateConditions(conditions: any, message: DiscordMessage): boolean {
    if (!conditions || !conditions.rules || conditions.rules.length === 0) {
      return true;
    }

    const results = conditions.rules.map((rule: any) => {
      const value = message.content.toLowerCase();
      const ruleValue = (rule.value || '').toLowerCase();

      switch (rule.operator) {
        case 'contains':
          return value.includes(ruleValue);
        case 'equals':
          return value === ruleValue;
        case 'starts_with':
          return value.startsWith(ruleValue);
        case 'ends_with':
          return value.endsWith(ruleValue);
        default:
          return false;
      }
    });

    return conditions.logicalOperator === 'AND' 
      ? results.every((r: boolean) => r)
      : results.some((r: boolean) => r);
  }

  private async executeAction(
    tenantId: string,
    schema: string,
    action: any,
    message: DiscordMessage,
    messageId: string
  ): Promise<void> {
    console.log(`🎬 [DISCORD-GATEWAY] Executing action: ${action.type}`);

    try {
      switch (action.type) {
        case 'transfer_to_human':
          console.log(`👤 [DISCORD-GATEWAY] Transferring to human agent`);
          break;

        case 'create_ticket':
          console.log(`🎫 [DISCORD-GATEWAY] Creating ticket from Discord message`);
          break;

        case 'send_reply':
          console.log(`💬 [DISCORD-GATEWAY] Sending automated reply`);
          break;

        default:
          console.log(`⚠️ [DISCORD-GATEWAY] Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`❌ [DISCORD-GATEWAY] Error executing action:`, error);
    }
  }

  private reconnect(connection: DiscordConnection): void {
    if (connection.heartbeatInterval) {
      clearInterval(connection.heartbeatInterval);
    }

    const resumePayload = {
      op: this.OPCODES.RESUME,
      d: {
        token: connection.botToken,
        session_id: connection.sessionId,
        seq: connection.sequenceNumber
      }
    };

    connection.ws.send(JSON.stringify(resumePayload));
  }

  private cleanup(connectionKey: string): void {
    const connection = this.connections.get(connectionKey);
    
    if (connection?.heartbeatInterval) {
      clearInterval(connection.heartbeatInterval);
    }

    this.connections.delete(connectionKey);
    console.log(`🧹 [DISCORD-GATEWAY] Cleanup completed for: ${connectionKey}`);
  }

  disconnect(tenantId: string, botToken: string): void {
    const connectionKey = `${tenantId}:${botToken}`;
    const connection = this.connections.get(connectionKey);

    if (connection) {
      connection.ws.close(1000, 'Disconnect requested');
      this.cleanup(connectionKey);
      console.log(`🔌 [DISCORD-GATEWAY] Disconnected for tenant: ${tenantId}`);
    }
  }

  disconnectAll(): void {
    console.log(`🔌 [DISCORD-GATEWAY] Disconnecting all connections...`);
    
    Array.from(this.connections.entries()).forEach(([key, connection]) => {
      connection.ws.close(1000, 'Service shutdown');
      this.cleanup(key);
    });

    console.log(`✅ [DISCORD-GATEWAY] All connections closed`);
  }

  getConnectionStatus(tenantId: string): boolean {
    for (const connection of Array.from(this.connections.values())) {
      if (connection.tenantId === tenantId) {
        return connection.ws.readyState === WebSocket.OPEN;
      }
    }
    return false;
  }
}

export const discordGatewayService = new DiscordGatewayService();

process.on('SIGINT', () => {
  discordGatewayService.disconnectAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  discordGatewayService.disconnectAll();
  process.exit(0);
});
