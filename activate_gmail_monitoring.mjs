import fetch from 'node-fetch';

console.log('🚀 Ativando monitoramento Gmail...');

const TENANT_ID = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const BASE_URL = 'http://localhost:5000';

// Login first to get auth token
async function login() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@conductor.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    if (data.accessToken) {
      console.log('✅ Login successful');
      return data.accessToken;
    } else {
      console.error('❌ Login failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

// Activate Gmail monitoring
async function activateGmailMonitoring(token) {
  try {
    console.log('📧 Ativando monitoramento Gmail...');
    
    const response = await fetch(`${BASE_URL}/api/omni-bridge/monitoring/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        integrationId: 'imap-email',
        channelType: 'email'
      })
    });
    
    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Response text:', responseText.substring(0, 200));
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('📊 Parsed response:', result);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      console.log('📊 Raw response:', responseText);
      return;
    }
    
    if (result.success) {
      console.log('✅ Gmail monitoring activated successfully!');
      
      // Check status
      const statusResponse = await fetch(`${BASE_URL}/api/omni-bridge/monitoring`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const status = await statusResponse.json();
      console.log('📊 Current monitoring status:', status);
    } else {
      console.error('❌ Failed to activate Gmail monitoring:', result.message);
    }
  } catch (error) {
    console.error('❌ Error activating Gmail monitoring:', error);
  }
}

// Main execution
async function main() {
  const token = await login();
  if (!token) {
    process.exit(1);
  }
  
  await activateGmailMonitoring(token);
}

main().catch(console.error);