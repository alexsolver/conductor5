// SCRIPT PARA FORÇAR SINCRONIZAÇÃO DO GMAIL
// Insere emails diretamente no banco de dados para teste

import Imap from 'imap';
import { simpleParser } from 'mailparser';

const IMAP_CONFIG = {
  user: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur', // App-specific password
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

const TENANT_ID = '3f99462f-3621-4b1b-bea8-782acc50d62e';

async function insertEmailToDatabase(emailData) {
  try {
    // Use direct POST to insert email into database
    const response = await fetch('http://localhost:5000/api/storage/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDIiLCJlbWFpbCI6ImFkbWluQGNvbmR1Y3Rvci5jb20iLCJyb2xlIjoidGVuYW50X2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1MGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzMDYyMDEwLCJleHAiOjE3NTMxNDg0MTAsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyIsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSJ9.fVkvUo7jFmxS7BnqQ1QQv9BX_CYjSb3TRURkMYU_N-I`
      },
      body: JSON.stringify({
        tenantId: TENANT_ID,
        ...emailData
      })
    });

    if (response.ok) {
      console.log(`✅ Email inserted: ${emailData.subject}`);
      return true;
    } else {
      console.log(`❌ Failed to insert email: ${response.status} - ${emailData.subject}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Database insert error:', error.message);
    return false;
  }
}

function connectToIMAP() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(IMAP_CONFIG);
    let processedCount = 0;
    const maxEmails = 5; // Limit for testing

    imap.once('ready', () => {
      console.log('📧 Connected to Gmail IMAP');
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`📧 INBOX opened, ${box.messages.total} total messages`);

        // Search for recent emails
        imap.search(['ALL'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          console.log(`📧 Found ${results.length} emails to check`);
          
          if (results.length === 0) {
            imap.end();
            resolve(0);
            return;
          }

          // Get the first few emails
          const emailsToFetch = results.slice(-maxEmails); // Get last 5 emails
          const fetch = imap.fetch(emailsToFetch, { bodies: '', struct: true });
          
          fetch.on('message', (msg, seqno) => {
            console.log(`📧 Processing email #${seqno}`);
            let headers = {};
            let body = '';

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  headers = parsed.headerLines ? 
                    parsed.headerLines.reduce((acc, line) => {
                      acc[line.key] = [line.line];
                      return acc;
                    }, {}) : {};

                  const from = parsed.from?.text || 'unknown@gmail.com';
                  const to = parsed.to?.text || 'alexsolver@gmail.com';
                  const subject = parsed.subject || '(No Subject)';
                  const date = parsed.date || new Date();

                  // Extract email address from "Name <email>" format
                  const fromMatch = from.match(/<(.+?)>/) || [null, from];
                  const fromEmail = fromMatch[1] || from;
                  const fromName = from.replace(/<.*>/, '').trim().replace(/"/g, '') || null;

                  // Detect priority
                  let priority = 'medium';
                  const subjectLower = subject.toLowerCase();
                  if (subjectLower.includes('urgente') || subjectLower.includes('emergencia') || subjectLower.includes('crítico')) {
                    priority = 'high';
                  } else if (subjectLower.includes('baixa') || subjectLower.includes('info') || subjectLower.includes('fyi')) {
                    priority = 'low';
                  }

                  const emailData = {
                    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    messageId: parsed.messageId || `gmail-${Date.now()}-${Math.random()}`,
                    fromEmail,
                    fromName: fromName || null,
                    toEmail: to,
                    subject,
                    bodyText: `Email captured from Gmail IMAP Integration\n\nFrom: ${from}\nTo: ${to}\nDate: ${date.toISOString()}\n\n${parsed.text || 'No text content'}`,
                    bodyHtml: parsed.html || null,
                    priority,
                    isRead: false,
                    isProcessed: false,
                    emailDate: date,
                    receivedAt: new Date(),
                    hasAttachments: !!parsed.attachments && parsed.attachments.length > 0,
                    attachmentCount: parsed.attachments ? parsed.attachments.length : 0,
                    emailHeaders: JSON.stringify(headers),
                    attachmentDetails: JSON.stringify(parsed.attachments || []),
                    ccEmails: JSON.stringify(parsed.cc || []),
                    bccEmails: JSON.stringify(parsed.bcc || [])
                  };

                  console.log(`📅 Processing email from ${date.getFullYear()}: ${subject}`);
                  
                  const success = await insertEmailToDatabase(emailData);
                  if (success) {
                    processedCount++;
                  }

                } catch (parseError) {
                  console.error('❌ Error parsing email:', parseError.message);
                }
              });
            });
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err.message);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`✅ Finished processing ${processedCount} emails`);
            imap.end();
            resolve(processedCount);
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err.message);
      reject(err);
    });

    imap.once('end', () => {
      console.log('📧 IMAP connection ended');
    });

    imap.connect();
  });
}

async function main() {
  try {
    console.log('🚀 Starting Gmail IMAP sync...');
    const count = await connectToIMAP();
    console.log(`✅ Successfully synced ${count} emails to database`);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();