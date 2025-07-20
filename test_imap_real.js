const Imap = require('imap');

const config = {
  user: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

console.log('🔧 Testando conexão IMAP com:', {
  host: config.host,
  port: config.port,
  user: config.user
});

const imap = new Imap(config);

imap.once('ready', () => {
  console.log('✅ CONECTADO COM SUCESSO AO GMAIL IMAP!');
  
  imap.openBox('INBOX', true, (err, box) => {
    if (err) {
      console.error('❌ Erro ao abrir INBOX:', err);
      process.exit(1);
    }
    
    console.log(`📬 INBOX aberta: ${box.messages.total} mensagens totais`);
    
    if (box.messages.total > 0) {
      // Buscar últimos 5 emails
      const lastFive = Math.max(1, box.messages.total - 4);
      console.log(`📧 Buscando emails ${lastFive} a ${box.messages.total}`);
      
      const fetch = imap.seq.fetch(`${lastFive}:${box.messages.total}`, {
        bodies: 'HEADER',
        markSeen: false
      });
      
      fetch.on('message', (msg, seqno) => {
        console.log(`📨 Processando email #${seqno}`);
        
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', () => {
            const subject = buffer.match(/Subject: (.+)/i);
            const from = buffer.match(/From: (.+)/i);
            const date = buffer.match(/Date: (.+)/i);
            
            console.log(`  ✉️ De: ${from ? from[1] : 'Unknown'}`);
            console.log(`  📋 Assunto: ${subject ? subject[1] : 'No Subject'}`);
            console.log(`  📅 Data: ${date ? date[1] : 'Unknown Date'}`);
            console.log('  ─────────────────────────────────');
          });
        });
      });
      
      fetch.once('end', () => {
        console.log('✅ Busca completada!');
        imap.end();
      });
      
      fetch.once('error', (err) => {
        console.error('❌ Erro na busca:', err);
        imap.end();
      });
    } else {
      console.log('📭 Nenhuma mensagem na INBOX');
      imap.end();
    }
  });
});

imap.once('error', (err) => {
  console.error('❌ ERRO DE CONEXÃO IMAP:', err);
  process.exit(1);
});

imap.once('end', () => {
  console.log('📧 Conexão IMAP encerrada');
  process.exit(0);
});

console.log('🔄 Iniciando conexão...');
imap.connect();

// Timeout de segurança
setTimeout(() => {
  console.log('⏰ Timeout - encerrando teste');
  process.exit(1);
}, 30000);