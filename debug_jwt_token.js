// Debug JWT token validation
import fs from 'fs';

function debugToken(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File ${filePath} not found`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`🔍 File content: ${content.substring(0, 100)}...`);
    
    const data = JSON.parse(content);
    
    if (data.accessToken) {
      const token = data.accessToken;
      console.log(`✅ Token found: ${token.length} chars`);
      
      // Decode JWT payload
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('📊 Token payload:', JSON.stringify(payload, null, 2));
      } else {
        console.log('❌ Invalid JWT format');
      }
    } else {
      console.log('❌ No accessToken found in response');
      console.log('📋 Available keys:', Object.keys(data));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Debug both registration and login results
console.log('=== REGISTRATION RESULT ===');
debugToken('./registration_result.json');

console.log('\n=== LOGIN RESULT ===');
debugToken('./login_result.json');