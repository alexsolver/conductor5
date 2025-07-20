const Imap = require('imap');

// Configure IMAP connection
const imap = new Imap({
  user: 'alexsolver@gmail.com',
  password: process.env.GMAIL_PASSWORD || 'app-password',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  authTimeout: 30000,
  connTimeout: 30000,
  debug: false,
  tlsOptions: {
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method',
    checkServerIdentity: () => undefined,
    requestCert: false,
    agent: false
  }
});

imap.once('ready', () => {
  console.log('📧 Connected to Gmail IMAP');
  
  imap.openBox('INBOX', true, (err, box) => {
    if (err) {
      console.error('❌ Error opening inbox:', err);
      imap.end();
      return;
    }
    
    console.log(`📫 Inbox opened, ${box.messages.total} total messages`);
    
    // Get the last 50 emails to check for recent ones
    const lastMessages = Math.max(1, box.messages.total - 49);
    const range = `${lastMessages}:${box.messages.total}`;
    
    console.log(`🔍 Checking messages ${range} for recent emails`);
    
    const fetch = imap.fetch(range, { 
      bodies: 'HEADER.FIELDS (DATE SUBJECT FROM)',
      struct: false 
    });
    
    const recentEmails = [];
    
    fetch.on('message', (msg, seqno) => {
      msg.on('body', (stream, info) => {
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
        
        stream.once('end', () => {
          const headers = buffer.split('\r\n').reduce((acc, line) => {
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match) {
              acc[match[1].toLowerCase()] = match[2];
            }
            return acc;
          }, {});
          
          const date = new Date(headers.date || '');
          const year = date.getFullYear();
          
          if (year >= 2020) {
            recentEmails.push({
              seqno,
              date: headers.date,
              year,
              subject: headers.subject || 'No Subject',
              from: headers.from || 'Unknown'
            });
          }
        });
      });
    });
    
    fetch.once('end', () => {
      console.log(`\n📊 Found ${recentEmails.length} emails from 2020 or later:`);
      
      recentEmails
        .sort((a, b) => b.year - a.year)
        .slice(0, 10)
        .forEach(email => {
          console.log(`${email.year}: ${email.subject.substring(0, 60)}... (from: ${email.from.substring(0, 30)})`);
        });
      
      if (recentEmails.length === 0) {
        console.log('❗ No recent emails found in the last 50 messages');
        console.log('   This explains why the inbox shows no results after filtering');
      }
      
      imap.end();
    });
    
    fetch.once('error', (err) => {
      console.error('❌ Fetch error:', err);
      imap.end();
    });
  });
});

imap.once('error', (err) => {
  console.error('❌ IMAP connection error:', err);
});

imap.once('end', () => {
  console.log('🔌 Connection ended');
  process.exit(0);
});

imap.connect();