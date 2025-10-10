import { Router, Request, Response } from 'express';
import { pool } from '../db';
import crypto from 'crypto';

const router = Router();

/**
 * 🤖 Discord Webhook Endpoint
 * 
 * Recebe mensagens do Discord via bot interactions e processa para o OmniBridge
 * 
 * Para configurar:
 * 1. Criar bot no Discord Developer Portal (https://discord.com/developers/applications)
 * 2. Copiar o Bot Token
 * 3. Ativar "MESSAGE CONTENT INTENT" nas configurações do bot
 * 4. Configurar Interactions Endpoint URL: https://<SEU_DOMINIO>/api/discord/interactions
 * 5. Adicionar bot ao servidor com permissões de leitura/envio de mensagens
 */

/**
 * Verificar assinatura do Discord (segurança)
 */
function verifyDiscordSignature(req: Request, publicKey: string): boolean {
  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;
  const body = JSON.stringify(req.body);

  if (!signature || !timestamp) {
    return false;
  }

  try {
    const isVerified = crypto.verify(
      'ed25519',
      Buffer.from(timestamp + body),
      {
        key: Buffer.from(publicKey, 'hex'),
        format: 'der',
        type: 'spki'
      },
      Buffer.from(signature, 'hex')
    );
    return isVerified;
  } catch (error) {
    console.error('❌ [DISCORD-VERIFY] Error verifying signature:', error);
    return false;
  }
}

/**
 * Endpoint para interactions do Discord (ping/pong e comandos)
 */
router.post('/interactions', async (req: Request, res: Response) => {
  try {
    const interaction = req.body;
    
    console.log('🎮 [DISCORD-INTERACTION] Received interaction:', JSON.stringify(interaction, null, 2));

    // Discord envia PING para verificar o endpoint
    if (interaction.type === 1) {
      console.log('🏓 [DISCORD-INTERACTION] Responding to PING');
      return res.json({ type: 1 }); // PONG
    }

    // TODO: Processar comandos slash aqui
    
    res.json({
      type: 4,
      data: {
        content: 'Comando recebido pelo Conductor!'
      }
    });

  } catch (error) {
    console.error('❌ [DISCORD-INTERACTION] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 📨 Endpoint para receber mensagens do Discord
 * Este endpoint processa mensagens recebidas e salva no OmniBridge
 */
router.post('/webhook/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const message = req.body;

    console.log('📱 [DISCORD-WEBHOOK] Received message for tenant:', tenantId);
    console.log('📱 [DISCORD-WEBHOOK] Message:', JSON.stringify(message, null, 2));

    // Extrair informações da mensagem do Discord
    const authorId = message.author?.id;
    const authorUsername = message.author?.username;
    const channelId = message.channel_id;
    const messageContent = message.content;
    const messageId = message.id;

    if (!authorId || !messageContent) {
      console.log('⚠️ [DISCORD-WEBHOOK] Missing required fields');
      return res.status(200).json({ ok: true });
    }

    // Ignorar mensagens de bots
    if (message.author?.bot) {
      console.log('🤖 [DISCORD-WEBHOOK] Ignoring bot message');
      return res.status(200).json({ ok: true });
    }

    console.log('📨 [DISCORD-WEBHOOK] Processing message:', {
      authorId,
      authorUsername,
      channelId,
      messageContent
    });

    // Salvar mensagem no OmniBridge
    const schema = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Buscar ou criar canal do Discord
    const channelResult = await pool.query(
      `SELECT id FROM ${schema}.omnibridge_channels 
       WHERE tenant_id = $1 AND type = 'discord' LIMIT 1`,
      [tenantId]
    );

    let channelDbId: string;
    if (channelResult.rows.length === 0) {
      const insertChannel = await pool.query(
        `INSERT INTO ${schema}.omnibridge_channels (id, tenant_id, name, type, config, is_active)
         VALUES (gen_random_uuid(), $1, 'Discord', 'discord', '{}', true)
         RETURNING id`,
        [tenantId]
      );
      channelDbId = insertChannel.rows[0].id;
      console.log('✅ [DISCORD-WEBHOOK] Created Discord channel:', channelDbId);
    } else {
      channelDbId = channelResult.rows[0].id;
    }

    // Criar ID único para a mensagem
    const uniqueMessageId = `discord:${messageId}`;
    const conversationId = `discord:${authorId}`;

    // Salvar mensagem no banco
    await pool.query(
      `INSERT INTO ${schema}.omnibridge_messages 
       (id, tenant_id, channel_id, conversation_id, external_id, "from", "to", subject, body, 
        direction, status, channel_type, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        uniqueMessageId,
        tenantId,
        channelDbId,
        conversationId,
        messageId,
        `discord:${authorId}`,
        `discord:channel:${channelId}`,
        `Discord - ${authorUsername || 'User'}`,
        messageContent,
        'inbound',
        'received',
        'discord',
        JSON.stringify({
          authorId,
          authorUsername,
          channelId,
          guildId: message.guild_id
        })
      ]
    );

    console.log('✅ [DISCORD-WEBHOOK] Message saved to OmniBridge');

    // Verificar se há regras de automação ativas
    const rulesResult = await pool.query(
      `SELECT * FROM ${schema}.automation_rules 
       WHERE tenant_id = $1 
       AND is_active = true 
       AND (trigger_type = 'message_received' OR trigger_type = 'discord_message')
       ORDER BY priority DESC`,
      [tenantId]
    );

    if (rulesResult.rows.length > 0) {
      console.log(`🤖 [DISCORD-WEBHOOK] Found ${rulesResult.rows.length} automation rules`);
      
      // TODO: Executar regras de automação
      // Isso será implementado quando integrar com o sistema de automação existente
    }

    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('❌ [DISCORD-WEBHOOK] Error processing message:', error);
    res.status(200).json({ ok: true }); // Sempre responder 200
  }
});

/**
 * 📤 Endpoint para enviar mensagens para o Discord
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { tenantId, channelId, content, botToken } = req.body;

    if (!botToken || !channelId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Bot token, channel ID, and content are required'
      });
    }

    // Enviar mensagem via Discord API
    const discordApiUrl = `https://discord.com/api/v10/channels/${channelId}/messages`;
    const response = await fetch(discordApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [DISCORD-SEND] Error from Discord API:', errorData);
      throw new Error(`Discord API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [DISCORD-SEND] Message sent successfully:', result.id);

    res.json({
      success: true,
      messageId: result.id,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('❌ [DISCORD-SEND] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📋 Endpoint para listar canais do Discord (onde o bot está)
 */
router.get('/channels/:botToken', async (req: Request, res: Response) => {
  try {
    const { botToken } = req.params;

    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bot ${botToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const guilds = await response.json();
    
    res.json({
      success: true,
      guilds
    });

  } catch (error) {
    console.error('❌ [DISCORD-CHANNELS] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
