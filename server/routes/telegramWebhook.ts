import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

/**
 * 🤖 Telegram Webhook Endpoint
 * 
 * Recebe updates do Telegram Bot API e captura automaticamente os chat_ids
 * quando usuários iniciam conversa com o bot.
 * 
 * Para configurar o webhook no Telegram:
 * https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<SEU_DOMINIO>/api/telegram/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    
    console.log('📱 [TELEGRAM-WEBHOOK] Received update:', JSON.stringify(update, null, 2));

    // Extrair informações da mensagem
    const message = update.message || update.edited_message;
    
    if (!message) {
      console.log('⚠️ [TELEGRAM-WEBHOOK] No message in update');
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat?.id;
    const username = message.chat?.username;
    const firstName = message.chat?.first_name;
    const lastName = message.chat?.last_name;
    const messageText = message.text;

    console.log('📨 [TELEGRAM-WEBHOOK] Message details:', {
      chatId,
      username: username ? `@${username}` : 'N/A',
      name: `${firstName || ''} ${lastName || ''}`.trim(),
      text: messageText
    });

    if (!chatId) {
      console.log('⚠️ [TELEGRAM-WEBHOOK] No chat ID in message');
      return res.status(200).json({ ok: true });
    }

    // Se o usuário enviou /start ou qualquer mensagem, salvar o chat_id
    // Vamos procurar por um customer/beneficiary com o username do Telegram
    if (username) {
      try {
        // Procurar em todos os tenants (public schema para mapping global)
        // Ou podemos salvar em uma tabela específica de telegram_contacts
        
        // Por enquanto, vamos apenas logar e permitir lookup manual
        // Futuramente, podemos criar uma tabela de mapeamento
        
        console.log(`✅ [TELEGRAM-WEBHOOK] Chat ID capturado: ${chatId} para @${username}`);
        console.log(`💡 [TELEGRAM-WEBHOOK] Use "${chatId}" (sem aspas) no campo de destinatário para enviar DM`);
        
        // TODO: Implementar salvamento em tabela de mapeamento
        // Por enquanto, apenas logar para que admin possa ver nos logs
        
      } catch (error) {
        console.error('❌ [TELEGRAM-WEBHOOK] Error processing contact:', error);
      }
    }

    // Responder ao Telegram que recebemos o update
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('❌ [TELEGRAM-WEBHOOK] Error processing webhook:', error);
    res.status(200).json({ ok: true }); // Sempre responder 200 para Telegram não retentar
  }
});

/**
 * 📋 Endpoint para listar chat_ids capturados (admin only)
 */
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    // TODO: Implementar listagem de contatos do Telegram
    res.json({
      success: true,
      message: 'Feature coming soon - check logs for captured chat_ids',
      instructions: 'When users send /start to your bot, check server logs for their chat_id'
    });
  } catch (error) {
    console.error('❌ [TELEGRAM-CONTACTS] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔧 Endpoint para configurar webhook do Telegram
 */
router.post('/setup-webhook', async (req: Request, res: Response) => {
  try {
    const { botToken, webhookUrl } = req.body;

    if (!botToken || !webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Bot token and webhook URL are required'
      });
    }

    // Configurar webhook no Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ [TELEGRAM-SETUP] Webhook configured successfully');
      res.json({
        success: true,
        message: 'Webhook configured successfully',
        data: result
      });
    } else {
      console.error('❌ [TELEGRAM-SETUP] Failed to configure webhook:', result);
      res.status(400).json({
        success: false,
        message: result.description || 'Failed to configure webhook',
        data: result
      });
    }

  } catch (error) {
    console.error('❌ [TELEGRAM-SETUP] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
