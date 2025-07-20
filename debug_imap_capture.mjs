import Imap from 'imap';

const config = {
  user: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

console.log('🔧 Testing real Gmail IMAP connection...');

const imap = new Imap(config);

imap.once('ready', () => {
  console.log('✅ CONNECTED TO GMAIL SUCCESSFULLY!');
  
  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      console.error('❌ Error opening INBOX:', err);
      process.exit(1);
    }
    
    console.log(`📬 INBOX opened: ${box.messages.total} total messages`);
    console.log(`📧 Recent: ${box.messages.new} new messages`);
    
    // Search for emails from today
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Searching for emails from ${today}...`);
    
    imap.search(['SINCE', today], (err, results) => {
      if (err) {
        console.error('❌ Search error:', err);
        imap.end();
        return;
      }
      
      console.log(`📧 Found ${results?.length || 0} emails from today`);
      
      if (results && results.length > 0) {
        // Get the last 3 emails
        const lastEmails = results.slice(-3);
        console.log(`📮 Fetching last ${lastEmails.length} emails...`);
        
        const fetch = imap.fetch(lastEmails, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          markSeen: false
        });
        
        fetch.on('message', (msg, seqno) => {
          console.log(`\n📨 Email #${seqno}:`);
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              console.log('Headers:', buffer);
            });
          });
        });
        
        fetch.once('end', () => {
          console.log('\n✅ Fetch completed!');
          imap.end();
        });
        
        fetch.once('error', (err) => {
          console.error('❌ Fetch error:', err);
          imap.end();
        });
      } else {
        console.log('📭 No emails found from today');
        imap.end();
      }
    });
  });
});

imap.once('error', (err) => {
  console.error('❌ IMAP Connection error:', err);
  process.exit(1);
});

imap.once('end', () => {
  console.log('📧 Connection ended');
  process.exit(0);
});

console.log('🔄 Connecting...');
imap.connect();

// Safety timeout
setTimeout(() => {
  console.log('⏰ Timeout - ending test');
  process.exit(1);
}, 30000);