
import jwt from 'jsonwebtoken';

const generateWorkspaceToken = () => {
  // Dados da sua workspace original identificada
  const payload = {
    userId: '550e8400-e29b-41d4-a716-446655440001', // Seu user ID real
    email: 'alex@lansolver.com',
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e', // Workspace original
    role: 'workspace_admin',
    firstName: 'Alex',
    lastName: 'Silva',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 dias
  };

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(payload, secret);

  console.log('\n🎯 TOKEN PARA SUA WORKSPACE ORIGINAL:');
  console.log('=====================================');
  console.log('Workspace: Lan Solver');
  console.log('Tenant ID:', payload.tenantId);
  console.log('Email:', payload.email);
  console.log('\n🔑 Token JWT:');
  console.log(token);
  console.log('\n📋 INSTRUÇÕES:');
  console.log('1. Copie o token acima');
  console.log('2. No navegador, abra DevTools (F12)');
  console.log('3. Vá para Application/Storage > Local Storage');
  console.log('4. Defina: authToken = [COLE_O_TOKEN_AQUI]');
  console.log('5. Recarregue a página');
  console.log('\n✅ Você terá acesso completo à workspace Lan Solver!');
};

generateWorkspaceToken();
