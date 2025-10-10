# 🎮 Guia de Configuração do Discord Bot - Conductor

Este guia mostra como configurar seu chatbot Discord para enviar e receber mensagens no OmniBridge.

## 📋 Pré-requisitos

- Acesso ao Discord Developer Portal
- Permissões de administrador no servidor Discord

## 🚀 Passo 1: Criar o Bot no Discord

1. **Acesse o Discord Developer Portal:**
   - Vá para: https://discord.com/developers/applications
   - Faça login com sua conta Discord

2. **Crie uma Nova Aplicação:**
   - Clique em "New Application"
   - Dê um nome ao seu bot (ex: "Conductor Support Bot")
   - Aceite os termos e clique em "Create"

3. **Configure o Bot:**
   - No menu lateral, clique em "Bot"
   - Clique em "Add Bot"
   - Confirme clicando em "Yes, do it!"

4. **Copie o Token do Bot:**
   - Na seção "TOKEN", clique em "Reset Token"
   - Copie o token exibido (você só verá isso uma vez!)
   - ⚠️ **IMPORTANTE:** Guarde este token em um lugar seguro

5. **Ative as Intents Necessárias:**
   - Role até "Privileged Gateway Intents"
   - Ative as seguintes opções:
     - ✅ MESSAGE CONTENT INTENT
     - ✅ SERVER MEMBERS INTENT (opcional)
   - Clique em "Save Changes"

## 🔗 Passo 2: Adicionar o Bot ao Servidor

1. **Gerar Link de Convite:**
   - No menu lateral, clique em "OAuth2" → "URL Generator"
   
2. **Selecione os Scopes:**
   - ✅ bot
   - ✅ applications.commands (opcional, para comandos slash)

3. **Selecione as Permissões do Bot:**
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Add Reactions (opcional)
   - ✅ Manage Messages (opcional)

4. **Copie e Use o Link:**
   - Copie o link gerado na parte inferior
   - Cole em uma nova aba do navegador
   - Selecione o servidor e clique em "Authorize"

## ⚙️ Passo 3: Configurar no Conductor

### 3.1 Adicionar o Bot Token

1. **Acesse o Tenant Admin:**
   - Vá para: `Configurações` → `Integrações`
   - Encontre "Discord" na lista

2. **Configure o Bot Token:**
   - Clique em "Editar" na integração Discord
   - Cole o Bot Token copiado anteriormente
   - Clique em "Salvar"

### 3.2 Configurar o Webhook (Para Receber Mensagens)

**Opção A: Webhook URL (Mais Simples)**

Se seu bot vai usar um webhook específico:

1. Crie um webhook no canal Discord desejado
2. Copie a URL do webhook
3. Cole no campo "Webhook URL" da configuração Discord no Conductor

**Opção B: Bot Listener (Recomendado para Chatbot)**

Para receber TODAS as mensagens que mencionam o bot:

1. Configure o endpoint do Conductor:
   ```
   https://[SEU_DOMINIO]/api/discord/webhook/[SEU_TENANT_ID]
   ```

2. **IMPORTANTE:** O Discord requer um bot com Gateway ou Interactions URL
   - Para Gateway: Use a biblioteca discord.js (mais complexo)
   - Para Interactions: Configure no Discord Developer Portal

## 🔧 Passo 4: Configurar Interactions URL (Recomendado)

1. **No Discord Developer Portal:**
   - Vá para sua aplicação
   - Clique em "General Information"
   
2. **Configure o Interactions Endpoint URL:**
   ```
   https://[SEU_DOMINIO]/api/discord/interactions
   ```

3. **Salve e Teste:**
   - O Discord enviará um PING para verificar
   - Se funcionar, verá uma mensagem de sucesso ✅

## 📨 Passo 5: Obter IDs dos Canais

Para enviar mensagens, você precisa dos Channel IDs:

1. **Ativar Modo Desenvolvedor no Discord:**
   - Configurações do Usuário → Avançado
   - Ative "Modo Desenvolvedor"

2. **Copiar Channel ID:**
   - Clique com botão direito em qualquer canal
   - Selecione "Copiar ID"
   - Este é o Channel ID para enviar mensagens

## 🎯 Como Usar

### Receber Mensagens

Quando alguém enviar uma mensagem mencionando o bot ou em um canal monitorado:
1. A mensagem aparecerá automaticamente no OmniBridge
2. Você pode criar regras de automação para responder
3. O AI Agent pode processar e responder automaticamente

### Enviar Mensagens

**Via Interface do Conductor:**
1. Vá para OmniBridge → Enviar Mensagem
2. Selecione "Discord" como canal
3. Cole o Channel ID no campo "Destinatário"
4. Escreva a mensagem e envie

**Via Automação:**
- Crie uma regra de automação
- Adicione ação "Enviar Mensagem Discord"
- Configure o Channel ID e a mensagem

## 🔍 Testando a Integração

### Teste 1: Enviar Mensagem
```bash
POST https://[SEU_DOMINIO]/api/discord/send
{
  "tenantId": "SEU_TENANT_ID",
  "channelId": "ID_DO_CANAL",
  "content": "Olá do Conductor!",
  "botToken": "SEU_BOT_TOKEN"
}
```

### Teste 2: Verificar Webhook
1. Envie uma mensagem no canal Discord
2. Verifique se aparece no OmniBridge
3. Confira os logs do servidor

## 📊 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/discord/interactions` | POST | Recebe interactions do Discord (PING/PONG) |
| `/api/discord/webhook/:tenantId` | POST | Recebe mensagens do Discord |
| `/api/discord/send` | POST | Envia mensagem para o Discord |
| `/api/discord/channels/:botToken` | GET | Lista servidores do bot |

## 🐛 Troubleshooting

### Bot não recebe mensagens
- ✅ Verifique se MESSAGE CONTENT INTENT está ativo
- ✅ Confirme que o bot tem permissão de ler mensagens
- ✅ Verifique se o webhook está configurado corretamente

### Bot não envia mensagens
- ✅ Verifique se o Bot Token está correto
- ✅ Confirme que o bot tem permissão de enviar mensagens
- ✅ Verifique se o Channel ID está correto

### Interactions não funcionam
- ✅ Verifique se a URL pública está acessível
- ✅ Confirme que retorna status 200 para PING
- ✅ Verifique os logs do servidor

## 🔐 Segurança

- ⚠️ **NUNCA** compartilhe seu Bot Token
- ⚠️ Mantenha o token nas configurações seguras
- ⚠️ Use HTTPS para todos os endpoints
- ⚠️ Valide assinaturas do Discord (implementado)

## 📚 Recursos Adicionais

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Bot API Documentation](https://discord.com/developers/docs/intro)
- [Discord.js Guide](https://discordjs.guide/)

## ✨ Próximos Passos

Agora você pode:
1. ✅ Criar regras de automação para o Discord
2. ✅ Configurar AI Agents para responder no Discord
3. ✅ Integrar com o sistema de tickets
4. ✅ Criar comandos personalizados

---

**Precisa de ajuda?** Verifique os logs do servidor em `/tmp/logs/` para diagnósticos detalhados.
