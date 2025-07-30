// Generate a valid JWT token using the system's secret
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate secure random bytes similar to TokenService.ts
const generateSecureDefaultSecret = (type) => {
  const randomBytes = Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  return `dev-${type}-${randomBytes}-${Date.now()}`;
};

// Use same logic as TokenService
const accessTokenSecret = process.env.JWT_ACCESS_SECRET || generateSecureDefaultSecret('access');

const payload = {
  userId: "3f99462f-3621-4b1b-bea8-782acc50d62e", // Valid user from DB
  email: "alex@lansolver.com",
  role: "tenant_admin", 
  tenantId: "3f99462f-3621-4b1b-bea8-782acc50d62e",
  type: "access"
};

const token = jwt.sign(payload, accessTokenSecret, { 
  expiresIn: '24h',
  issuer: 'conductor-platform',
  audience: 'conductor-users'
});

console.log('Generated token:', token);
console.log('Token payload:', payload);
console.log('Secret used:', accessTokenSecret.substring(0, 20) + '...');