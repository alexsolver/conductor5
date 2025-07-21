// Import with dynamic import to handle ES modules
const { default: Imap } = await import('imap');
const { simpleParser } = await import('mailparser');
import crypto from 'crypto';

console.log('🚀 Starting Gmail monitoring with Workspace Admin credentials...');

// Database connection
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();
console.log('📊 Connected to database');

try {
  // Get the IMAP credentials from integrations table
  const result = await client.query(`
    SELECT config FROM tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.integrations 
    WHERE id = 'imap-email' AND tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e'
  `);

  if (result.rows.length === 0) {
    console.error('❌ IMAP Email integration not found');
    process.exit(1);
  }

  const config = result.rows[0].config;
  console.log('📧 Using IMAP config from Workspace Admin:', {
    emailAddress: config.emailAddress,
    imapServer: config.imapServer,
    imapPort: config.imapPort,
    imapSecurity: config.imapSecurity
  });

  // Create IMAP connection
  const imap = new Imap({
    user: config.emailAddress,
    password: config.password,
    host: config.imapServer,
    port: config.imapPort,
    tls: config.imapSecurity === 'SSL/TLS',
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
    connTimeout: 10000
  });

  imap.once('ready', () => {
    console.log('✅ IMAP connection ready! Opening inbox...');
    
    imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        console.error('❌ Error opening inbox:', err);
        return;
      }

      console.log(`📬 Inbox opened! Total messages: ${box.messages.total}`);
      
      // Search for recent emails (all emails)
      const searchCriteria = ['ALL'];
      
      imap.search(searchCriteria, (err, results) => {
        if (err) {
          console.error('❌ Search error:', err);
          return;
        }

        if (!results || results.length === 0) {
          console.log('📭 No emails found');
          imap.end();
          return;
        }

        console.log(`📧 Found ${results.length} emails. Fetching recent ones...`);

        // Get last 5 emails
        const recentEmails = results.slice(-5);
        const fetch = imap.fetch(recentEmails, { bodies: '', markSeen: false });

        fetch.on('message', (msg, seqno) => {
          console.log(`📨 Processing email #${seqno}...`);
          
          let emailData = {
            id: null,
            subject: '',
            from: '',
            date: new Date(),
            body: ''
          };

          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                
                emailData = {
                  id: `gmail-${seqno}-${Date.now()}`,
                  subject: parsed.subject || 'No subject',
                  from: parsed.from?.text || 'Unknown sender',
                  date: parsed.date || new Date(),
                  body: parsed.text || parsed.html || 'No content'
                };

                console.log(`📧 Email parsed:`, {
                  subject: emailData.subject,
                  from: emailData.from,
                  date: emailData.date.toISOString()
                });

                // Extract email addresses properly
                const fromEmailMatch = emailData.from.match(/<(.+)>/);
                const fromEmail = fromEmailMatch ? fromEmailMatch[1] : emailData.from;
                const fromName = fromEmailMatch ? emailData.from.split('<')[0].trim().replace(/"/g, '') : emailData.from;
                const toEmail = config.emailAddress; // We're the recipient

                // Insert into database with ALL required fields including to_email
                const emailId = crypto.randomUUID();
                const messageId = `<${seqno}.${Date.now()}@gmail.imap>`;
                
                const insertResult = await client.query(`
                  INSERT INTO tenant_3f99462f_3621_4b1b_bea8_782acc50d62e.emails 
                  (id, tenant_id, message_id, from_email, from_name, to_email, subject, body_text, priority, is_read, is_processed, email_date, received_at)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                  ON CONFLICT (id) DO NOTHING
                `, [
                  emailId, // UUID for id
                  '3f99462f-3621-4b1b-bea8-782acc50d62e', // tenant_id
                  messageId, // message_id - required field
                  fromEmail, // from_email - cleaned
                  fromName, // from_name - cleaned
                  toEmail, // to_email - required field (us as recipient)
                  emailData.subject,
                  emailData.body.substring(0, 1000), // Limit body size
                  'medium', // Default priority
                  false, // is_read
                  false, // is_processed
                  emailData.date, // email_date
                  emailData.date // received_at
                ]);

                if (insertResult.rowCount > 0) {
                  console.log(`✅ Email inserted: ${emailData.subject}`);
                } else {
                  console.log(`⚠️  Email already exists: ${emailData.subject}`);
                }

              } catch (parseError) {
                console.error('❌ Error parsing email:', parseError);
              }
            });
          });
        });

        fetch.once('end', () => {
          console.log('✅ Finished fetching emails');
          imap.end();
        });

        fetch.once('error', (err) => {
          console.error('❌ Fetch error:', err);
          imap.end();
        });
      });
    });
  });

  imap.once('error', (err) => {
    console.error('❌ IMAP connection error:', err);
    process.exit(1);
  });

  imap.once('end', () => {
    console.log('📪 IMAP connection ended');
    client.end();
    process.exit(0);
  });

  console.log('🔄 Connecting to IMAP...');
  imap.connect();

} catch (error) {
  console.error('💥 Error:', error);
  await client.end();
  process.exit(1);
}