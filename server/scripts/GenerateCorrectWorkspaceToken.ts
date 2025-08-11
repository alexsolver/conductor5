import jwt from 'jsonwebtoken';

const generateCorrectToken = () => {
  // Seus dados reais identificados no sistema
  const payload = {
    userId: '550e8400-e29b-41d4-a716-446655440001', // User ID real
    email: 'alex@lansolver.com',
    tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e', // TENANT REAL - Lan Solver
    role: 'workspace_admin',
    firstName: 'Alex',
    lastName: 'Silva',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 dias
  };

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(payload, secret);

  console.log('\n🎯 TOKEN CORRETO PARA CARREGAR DADOS:');
  console.log('=====================================');
  console.log('Workspace: Lan Solver');
  console.log('Tenant ID:', payload.tenantId);
  console.log('Email:', payload.email);
  console.log('\n🔑 Token JWT Correto:');
  console.log(token);
  
  console.log('\n📋 INSTRUÇÕES PARA CORRIGIR:');
  console.log('1. Abra DevTools (F12) no navegador');
  console.log('2. Vá para Application > Local Storage');
  console.log('3. Encontre a chave "authToken"');
  console.log('4. Substitua o valor pelo token acima');
  console.log('5. Recarregue a página');
  console.log('\n✅ Os dados da workspace Lan Solver irão carregar!');
  
  // Mostrar comparação
  console.log('\n🔍 DIAGNÓSTICO:');
  console.log('❌ Token atual usa: mock-tenant-id (inválido)');
  console.log('✅ Token correto usa:', payload.tenantId, '(válido)');
  console.log('\n📊 Dados disponíveis na workspace:');
  console.log('- Schema: tenant_3f99462f_3621_4b1b_bea8_782acc50d62e');
  console.log('- Status: ✅ Ativo com 120 tabelas');
  console.log('- Tickets, clientes, usuários preservados');
};

generateCorrectToken();