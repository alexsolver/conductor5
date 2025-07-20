import Imap from 'imap';
import { simpleParser } from 'mailparser';

async function testImapCapture() {
  console.log('🔍 Iniciando teste direto de captura IMAP para alexsolver@gmail.com');
  
  const imap = new Imap({
    user: 'alexsolver@gmail.com',
    password: 'kyzv ggbz tqdx wgfz',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 30000,
    connTimeout: 30000,
    debug: console.log,
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

        console.log(`📫 INBOX aberta: ${box.messages.total} mensagens totais`);

        // Buscar emails das últimas 6 horas
        const sixHoursAgo = new Date();
        sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
        
        console.log(`🔍 Buscando emails desde: ${sixHoursAgo.toISOString()}`);

        // Usar uma busca mais ampla para pegar todos os emails recentes
        imap.search([['SINCE', sixHoursAgo]], (searchError, results) => {
          if (searchError) {
            console.error('❌ Erro na busca:', searchError);
            reject(searchError);
            return;
          }

          console.log(`📬 Encontrados ${results ? results.length : 0} emails recentes`);

          if (!results || results.length === 0) {
            console.log('📭 Nenhum email encontrado no período');
            
            // Tentar busca por emails não lidos como fallback
            imap.search(['UNSEEN'], (unseenError, unseenResults) => {
              if (unseenError) {
                console.error('❌ Erro na busca por não lidos:', unseenError);
                reject(unseenError);
                return;
              }

              console.log(`📧 Emails não lidos: ${unseenResults ? unseenResults.length : 0}`);
              
              if (!unseenResults || unseenResults.length === 0) {
                console.log('📭 Nenhum email não lido encontrado');
                imap.end();
                resolve({ found: 0, emails: [] });
                return;
              }

              processEmails(imap, unseenResults, resolve);
            });
            return;
          }

          processEmails(imap, results, resolve);
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

function processEmails(imap, results, resolve) {
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
            text: parsedEmail.text ? parsedEmail.text.substring(0, 100) + '...' : 'Sem texto'
          };
          
          console.log(`📧 Email ${seqno}: ${emailInfo.from} - ${emailInfo.subject}`);
          
          // Verificar se é do nicbenedito
          if (emailInfo.from.includes('nicbenedito')) {
            console.log('🎯 ENCONTRADO! Email do nicbenedito@gmail.com:');
            console.log(`   From: ${emailInfo.from}`);
            console.log(`   Subject: ${emailInfo.subject}`);
            console.log(`   Date: ${emailInfo.date}`);
            console.log(`   Preview: ${emailInfo.text}`);
          }
          
          emails.push(emailInfo);
          processed++;
          
          if (processed === results.length) {
            imap.end();
            resolve({ 
              found: emails.length, 
              emails: emails.sort((a, b) => new Date(b.date) - new Date(a.date)) 
            });
          }
        } catch (parseError) {
          console.error(`❌ Erro ao processar email ${seqno}:`, parseError);
          processed++;
          if (processed === results.length) {
            imap.end();
            resolve({ found: emails.length, emails });
          }
        }
      });
    });

    msg.once('attributes', (attrs) => {
      console.log(`📧 Processando email ${seqno} com UID ${attrs.uid}`);
    });
  });

  fetch.once('error', (fetchError) => {
    console.error('❌ Erro ao buscar emails:', fetchError);
    imap.end();
    resolve({ found: 0, emails: [], error: fetchError.message });
  });

  fetch.once('end', () => {
    if (processed === 0) {
      console.log('✅ Finalizada busca de emails');
      imap.end();
      resolve({ found: 0, emails: [] });
    }
  });
}

// Executar o teste
testImapCapture()
  .then(result => {
    console.log('\n🎯 RESULTADO DO TESTE:');
    console.log(`📊 Total de emails encontrados: ${result.found}`);
    
    if (result.found > 0) {
      console.log('\n📧 EMAILS RECENTES:');
      result.emails.slice(0, 10).forEach((email, index) => {
        console.log(`${index + 1}. ${email.from} - ${email.subject} (${email.date})`);
      });
      
      const nicbeneditEmails = result.emails.filter(e => e.from.includes('nicbenedito'));
      if (nicbeneditEmails.length > 0) {
        console.log('\n🎯 EMAILS DO NICBENEDITO ENCONTRADOS:');
        nicbeneditEmails.forEach(email => {
          console.log(`   ✅ ${email.subject} - ${email.date}`);
        });
      } else {
        console.log('\n❌ Nenhum email do nicbenedito@gmail.com encontrado');
      }
    }
    
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERRO NO TESTE:', error);
    process.exit(1);
  });