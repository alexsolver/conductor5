import Imap from 'imap';
import { simpleParser } from 'mailparser';

async function searchRecentEmails() {
  console.log('🔍 Buscando emails recentes (últimas 24 horas) no alexsolver@gmail.com');
  
  const imap = new Imap({
    user: 'alexsolver@gmail.com',
    password: 'cyyj vare pmjh scur',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 30000,
    connTimeout: 30000,
    debug: false, // Desabilitar debug para output mais limpo
    tlsOptions: {
      rejectUnauthorized: false
    }
  });

  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ Conectado ao Gmail IMAP');
      
      imap.openBox('INBOX', true, (error, box) => {
        if (error) {
          console.error('❌ Erro ao abrir INBOX:', error);
          reject(error);
          return;
        }

        console.log(`📫 INBOX: ${box.messages.total} mensagens totais`);
        console.log(`📫 Mensagens novas: ${box.messages.new}`);
        console.log(`📫 Mensagens não lidas: ${box.messages.unseen}`);

        // Buscar primeiro emails não lidos
        console.log('\n🔍 1. Buscando emails NÃO LIDOS...');
        imap.search(['UNSEEN'], (unseenError, unseenResults) => {
          if (unseenError) {
            console.error('❌ Erro na busca por não lidos:', unseenError);
            reject(unseenError);
            return;
          }

          console.log(`📧 Emails não lidos encontrados: ${unseenResults ? unseenResults.length : 0}`);

          if (unseenResults && unseenResults.length > 0) {
            console.log('\n📧 EMAILS NÃO LIDOS:');
            processEmails(imap, unseenResults, (result) => {
              searchRecent24Hours(imap, resolve, result);
            });
          } else {
            searchRecent24Hours(imap, resolve, { found: 0, emails: [] });
          }
        });
      });
    });

    imap.once('error', (error) => {
      console.error('❌ Erro de conexão IMAP:', error);
      reject(error);
    });

    imap.once('end', () => {
      console.log('📫 Conexão IMAP finalizada');
    });

    imap.connect();
  });
}

function searchRecent24Hours(imap, resolve, unseenResult) {
  // Buscar emails das últimas 24 horas
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  console.log(`\n🔍 2. Buscando emails das últimas 24h (desde ${yesterday.toISOString()})...`);

  imap.search([['SINCE', yesterday]], (searchError, recentResults) => {
    if (searchError) {
      console.error('❌ Erro na busca por emails recentes:', searchError);
      imap.end();
      resolve(unseenResult);
      return;
    }

    console.log(`📧 Emails das últimas 24h: ${recentResults ? recentResults.length : 0}`);

    if (!recentResults || recentResults.length === 0) {
      // Buscar os 10 emails mais recentes como fallback
      console.log('\n🔍 3. Buscando os 10 emails mais recentes...');
      imap.search(['ALL'], (allError, allResults) => {
        if (allError || !allResults || allResults.length === 0) {
          imap.end();
          resolve(unseenResult);
          return;
        }

        const last10 = allResults.slice(-10);
        console.log(`📧 Processando os ${last10.length} emails mais recentes`);
        
        processEmails(imap, last10, (result) => {
          imap.end();
          resolve({
            unseen: unseenResult.emails || [],
            recent24h: [],
            latest: result.emails || []
          });
        });
      });
      return;
    }

    processEmails(imap, recentResults, (result) => {
      imap.end();
      resolve({
        unseen: unseenResult.emails || [],
        recent24h: result.emails || [],
        latest: []
      });
    });
  });
}

function processEmails(imap, results, callback) {
  if (!results || results.length === 0) {
    callback({ found: 0, emails: [] });
    return;
  }

  const fetch = imap.fetch(results, { 
    bodies: '',
    markSeen: false,
    struct: true 
  });

  const emails = [];
  let processed = 0;

  fetch.on('message', (msg, seqno) => {
    let emailData = '';

    msg.on('body', (stream, info) => {
      stream.on('data', (chunk) => {
        emailData += chunk.toString('utf8');
      });

      stream.once('end', async () => {
        try {
          const parsedEmail = await simpleParser(emailData);
          
          const emailInfo = {
            seqno,
            from: parsedEmail.from?.text || 'Desconhecido',
            subject: parsedEmail.subject || 'Sem assunto',
            date: parsedEmail.date || new Date(),
            text: parsedEmail.text ? parsedEmail.text.substring(0, 200) + '...' : 'Sem texto'
          };
          
          console.log(`   📧 ${seqno}: ${emailInfo.from} - ${emailInfo.subject}`);
          
          // Verificar se é do nicbenedito
          if (emailInfo.from.toLowerCase().includes('nicbenedito') || 
              emailInfo.from.toLowerCase().includes('nicolas') ||
              emailInfo.subject.toLowerCase().includes('nicbenedito')) {
            console.log('\n🎯 ENCONTRADO! Email relacionado ao nicbenedito:');
            console.log(`   ✅ From: ${emailInfo.from}`);
            console.log(`   ✅ Subject: ${emailInfo.subject}`);
            console.log(`   ✅ Date: ${emailInfo.date}`);
            console.log(`   ✅ Preview: ${emailInfo.text}`);
          }
          
          emails.push(emailInfo);
          processed++;
          
          if (processed === results.length) {
            callback({ 
              found: emails.length, 
              emails: emails.sort((a, b) => new Date(b.date) - new Date(a.date)) 
            });
          }
        } catch (parseError) {
          console.error(`❌ Erro ao processar email ${seqno}:`, parseError);
          processed++;
          if (processed === results.length) {
            callback({ found: emails.length, emails });
          }
        }
      });
    });

    msg.once('attributes', (attrs) => {
      // Log silencioso para não poluir output
    });
  });

  fetch.once('error', (fetchError) => {
    console.error('❌ Erro ao buscar emails:', fetchError);
    callback({ found: 0, emails: [], error: fetchError.message });
  });

  fetch.once('end', () => {
    if (processed === 0) {
      callback({ found: 0, emails: [] });
    }
  });
}

// Executar a busca
searchRecentEmails()
  .then(result => {
    console.log('\n🎯 RESULTADO FINAL DA BUSCA:');
    
    if (result.unseen && result.unseen.length > 0) {
      console.log(`\n📧 EMAILS NÃO LIDOS (${result.unseen.length}):`);
      result.unseen.forEach((email, index) => {
        console.log(`${index + 1}. ${email.from} - ${email.subject}`);
      });
    }
    
    if (result.recent24h && result.recent24h.length > 0) {
      console.log(`\n📧 EMAILS DAS ÚLTIMAS 24H (${result.recent24h.length}):`);
      result.recent24h.slice(0, 10).forEach((email, index) => {
        console.log(`${index + 1}. ${email.from} - ${email.subject}`);
      });
    }
    
    if (result.latest && result.latest.length > 0) {
      console.log(`\n📧 EMAILS MAIS RECENTES (${result.latest.length}):`);
      result.latest.forEach((email, index) => {
        console.log(`${index + 1}. ${email.from} - ${email.subject}`);
      });
    }
    
    // Verificar se encontrou emails do nicbenedito
    const allEmails = [
      ...(result.unseen || []),
      ...(result.recent24h || []),
      ...(result.latest || [])
    ];
    
    const nicbeneditEmails = allEmails.filter(e => 
      e.from.toLowerCase().includes('nicbenedito') || 
      e.from.toLowerCase().includes('nicolas') ||
      e.subject.toLowerCase().includes('nicbenedito')
    );
    
    if (nicbeneditEmails.length > 0) {
      console.log('\n🎯 EMAILS DO NICBENEDITO ENCONTRADOS:');
      nicbeneditEmails.forEach(email => {
        console.log(`   ✅ ${email.subject} - ${email.date}`);
      });
    } else {
      console.log('\n❌ Nenhum email do nicbenedito@gmail.com encontrado');
      console.log('💡 Sugestões:');
      console.log('   1. Verificar se o email foi realmente enviado');
      console.log('   2. Confirmar se foi enviado para alexsolver@gmail.com');
      console.log('   3. Verificar pasta de spam/lixo eletrônico');
    }
    
    console.log('\n✅ Busca completa concluída');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERRO NA BUSCA:', error);
    process.exit(1);
  });