const { default: Imap } = await import('imap');

const config = {
  user: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

console.log('🔧 Testing IMAP IDLE for real-time monitoring...');

const imap = new Imap(config);

imap.once('ready', () => {
  console.log('✅ Connected to Gmail!');
  
  imap.openBox('INBOX', false, (err, box) => {
    if (err) throw err;
    
    console.log(`📬 INBOX opened: ${box.messages.total} messages`);
    
    // Setup IDLE for real-time notifications
    console.log('⏳ Setting up IMAP IDLE for real-time monitoring...');
    
    imap.on('mail', (numNewMsgs) => {
      console.log(`🔔 NEW EMAIL ALERT! ${numNewMsgs} new message(s) received!`);
      
      // Fetch the new messages
      const start = Math.max(1, box.messages.total - numNewMsgs + 1);
      const end = box.messages.total + numNewMsgs;
      
      console.log(`📮 Fetching new messages ${start}:${end}`);
      
      const fetch = imap.seq.fetch(`${start}:${end}`, {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        markSeen: false
      });
      
      fetch.on('message', (msg, seqno) => {
        console.log(`\n📨 NEW Email #${seqno}:`);
        
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', () => {
            const from = buffer.match(/From: (.+)/i);
            const subject = buffer.match(/Subject: (.+)/i);
            const date = buffer.match(/Date: (.+)/i);
            
            console.log(`  From: ${from ? from[1].trim() : 'Unknown'}`);
            console.log(`  Subject: ${subject ? subject[1].trim() : 'No Subject'}`);
            console.log(`  Date: ${date ? date[1].trim() : 'Unknown'}`);
            console.log('🎯 This is a REAL NEW EMAIL that just arrived!');
          });
        });
      });
      
      fetch.once('end', () => {
        console.log('✅ New emails processed!');
      });
    });
    
    // Start IDLE mode
    imap.idle((err) => {
      if (err) {
        console.error('❌ IDLE error:', err);
        return;
      }
      console.log('🔄 IDLE mode activated - waiting for new emails...');
      console.log('💡 Send an email to alexsolver@gmail.com to test real-time detection!');
    });
  });
});

imap.once('error', (err) => {
  console.error('❌ IMAP Error:', err);
  process.exit(1);
});

imap.once('end', () => {
  console.log('📧 Connection ended');
  process.exit(0);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down IMAP monitoring...');
  imap.end();
});

console.log('🔄 Connecting to Gmail IMAP...');
imap.connect();

// Keep alive for 2 minutes to test
setTimeout(() => {
  console.log('⏰ Test timeout - ending IDLE monitoring');
  imap.end();
}, 120000);