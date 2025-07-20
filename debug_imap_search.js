// Debug script to check for specific email
const Imap = require('imap');

const imap = new Imap({
  user: 'alexsolver@gmail.com',
  password: process.env.GMAIL_PASSWORD || 'senha_temporaria_aqui',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

function searchForEmail() {
  return new Promise((resolve, reject) => {
    imap.once('ready', function() {
      console.log('IMAP connected successfully');
      
      imap.openBox('INBOX', false, function(err, box) {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`Total messages in INBOX: ${box.messages.total}`);
        
        // Search for emails from the last hour
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
        console.log(`Searching for emails since: ${oneHourAgo.toISOString()}`);
        
        // Search for recent emails
        imap.search([['SINCE', oneHourAgo]], function(err, results) {
          if (err) {
            reject(err);
            return;
          }
          
          console.log(`Found ${results ? results.length : 0} recent emails`);
          
          if (!results || results.length === 0) {
            console.log('No recent emails found');
            imap.end();
            resolve([]);
            return;
          }
          
          // Get recent emails and check for nicbenedito
          const fetch = imap.fetch(results.slice(-10), { bodies: 'HEADER' });
          const emails = [];
          
          fetch.on('message', function(msg, seqno) {
            msg.on('body', function(stream, info) {
              let header = '';
              stream.on('data', function(chunk) {
                header += chunk.toString('utf8');
              });
              stream.once('end', function() {
                if (header.includes('nicbenedito@gmail.com')) {
                  console.log(`\n*** FOUND EMAIL FROM NICBENEDITO! ***`);
                  console.log(`Header: ${header.substring(0, 500)}...`);
                }
                emails.push({ seqno, header: header.substring(0, 200) });
              });
            });
          });
          
          fetch.once('end', function() {
            console.log(`\nChecked ${emails.length} recent emails:`);
            emails.forEach(email => {
              console.log(`Email ${email.seqno}: ${email.header.replace(/\n/g, ' ').substring(0, 100)}...`);
            });
            
            imap.end();
            resolve(emails);
          });
        });
      });
    });
    
    imap.once('error', function(err) {
      console.error('IMAP error:', err);
      reject(err);
    });
    
    imap.connect();
  });
}

console.log('Starting IMAP debug search...');
searchForEmail()
  .then(emails => {
    console.log(`\nSearch completed. Found ${emails.length} emails to check.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Search failed:', err);
    process.exit(1);
  });