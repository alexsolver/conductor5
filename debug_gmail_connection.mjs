import Imap from 'imap';

console.log('🔧 Testing IMAP connection with various configurations...');

const credentials = {
  emailAddress: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur',
  imapServer: 'imap.gmail.com'
};

// Test 1: Standard SSL/TLS with aggressive rejection disable
console.log('\n🧪 Test 1: Standard SSL/TLS with rejection disabled');
const imap1 = new Imap({
  user: credentials.emailAddress,
  password: credentials.password,
  host: credentials.imapServer,
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method',
    checkServerIdentity: () => undefined,
    requestCert: false,
    agent: false,
    ciphers: 'ALL'
  },
  connTimeout: 60000,
  authTimeout: 30000,
  keepalive: false,
  debug: console.log
});

imap1.once('ready', () => {
  console.log('✅ Test 1 SUCCESS: SSL/TLS connection working');
  imap1.end();
});

imap1.once('error', (error) => {
  console.log('❌ Test 1 FAILED:', error.message);
  
  // Test 2: STARTTLS approach
  console.log('\n🧪 Test 2: STARTTLS approach');
  const imap2 = new Imap({
    user: credentials.emailAddress,
    password: credentials.password,
    host: credentials.imapServer,
    port: 143,
    tls: false,
    tlsOptions: {
      rejectUnauthorized: false,
      secureProtocol: 'TLSv1_2_method'
    },
    connTimeout: 60000,
    authTimeout: 30000,
    keepalive: false
  });

  imap2.once('ready', () => {
    console.log('✅ Test 2 SUCCESS: STARTTLS connection working');
    imap2.end();
  });

  imap2.once('error', (error2) => {
    console.log('❌ Test 2 FAILED:', error2.message);
    
    // Test 3: No encryption at all
    console.log('\n🧪 Test 3: No encryption (port 143, no TLS)');
    const imap3 = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapServer,
      port: 143,
      tls: false,
      connTimeout: 60000,
      authTimeout: 30000,
      keepalive: false
    });

    imap3.once('ready', () => {
      console.log('✅ Test 3 SUCCESS: Non-encrypted connection working');
      imap3.end();
    });

    imap3.once('error', (error3) => {
      console.log('❌ Test 3 FAILED:', error3.message);
      console.log('\n🔍 All connection methods failed. This may be a Node.js/IMAP library issue.');
    });

    imap3.connect();
  });

  imap2.connect();
});

imap1.connect();