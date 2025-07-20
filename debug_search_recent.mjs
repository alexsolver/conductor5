import Imap from 'imap';

const config = {
  user: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

console.log('🔧 Testing recent emails search...');

const imap = new Imap(config);

imap.once('ready', () => {
  console.log('✅ CONNECTED TO GMAIL!');
  
  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }
    
    console.log(`📬 INBOX: ${box.messages.total} total, ${box.messages.new} new`);
    
    // Search for recent emails using UNSEEN
    console.log('🔍 Searching for UNSEEN emails...');
    
    imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.log('❌ UNSEEN search failed:', err.message);
        
        // Try search for ALL recent
        console.log('🔍 Trying ALL search for last 10 emails...');
        
        const start = Math.max(1, box.messages.total - 9);
        const end = box.messages.total;
        
        const fetch = imap.seq.fetch(`${start}:${end}`, {
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
              const from = buffer.match(/From: (.+)/i);
              const subject = buffer.match(/Subject: (.+)/i);
              const date = buffer.match(/Date: (.+)/i);
              
              console.log(`  From: ${from ? from[1].trim() : 'Unknown'}`);
              console.log(`  Subject: ${subject ? subject[1].trim() : 'No Subject'}`);
              console.log(`  Date: ${date ? date[1].trim() : 'Unknown'}`);
            });
          });
        });
        
        fetch.once('end', () => {
          console.log('\n✅ Fetch completed!');
          imap.end();
        });
        
        return;
      }
      
      console.log(`📧 Found ${results?.length || 0} UNSEEN emails`);
      
      if (results && results.length > 0) {
        console.log(`📮 Fetching ${results.length} unseen emails...`);
        
        const fetch = imap.fetch(results, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          markSeen: false
        });
        
        fetch.on('message', (msg, seqno) => {
          console.log(`\n📨 UNSEEN Email #${seqno}:`);
          
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
          console.log('\n✅ UNSEEN fetch completed!');
          imap.end();
        });
      } else {
        console.log('📭 No unseen emails, checking last 5...');
        
        const start = Math.max(1, box.messages.total - 4);
        const end = box.messages.total;
        
        const fetch = imap.seq.fetch(`${start}:${end}`, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          markSeen: false
        });
        
        fetch.on('message', (msg, seqno) => {
          console.log(`\n📨 Recent Email #${seqno}:`);
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              const from = buffer.match(/From: (.+)/i);
              const subject = buffer.match(/Subject: (.+)/i);
              
              console.log(`  From: ${from ? from[1].trim() : 'Unknown'}`);
              console.log(`  Subject: ${subject ? subject[1].trim() : 'No Subject'}`);
            });
          });
        });
        
        fetch.once('end', () => {
          console.log('\n✅ Recent fetch completed!');
          imap.end();
        });
      }
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

console.log('🔄 Connecting...');
imap.connect();

setTimeout(() => {
  console.log('⏰ Timeout');
  process.exit(1);
}, 20000);