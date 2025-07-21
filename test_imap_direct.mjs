import Imap from 'imap';

console.log('🔍 Testing direct IMAP connection...');

const config = {
  user: 'alexsolver@gmail.com',
  password: 'cyyj vare pmjh scur',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method',
    servername: 'imap.gmail.com'
  },
  authTimeout: 30000,
  connTimeout: 30000,
  debug: console.log
};

console.log('📋 Config:', {
  user: config.user,
  host: config.host,
  port: config.port,
  tls: config.tls,
  hasPassword: !!config.password
});

const imap = new Imap(config);

imap.once('ready', () => {
  console.log('✅ IMAP connection successful!');
  imap.end();
});

imap.once('error', (err) => {
  console.error('❌ IMAP connection failed:', err.message);
  console.error('Error details:', err);
  process.exit(1);
});

imap.once('end', () => {
  console.log('📪 IMAP connection ended');
  process.exit(0);
});

console.log('🔄 Connecting...');
imap.connect();