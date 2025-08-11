
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const autoFixToken = () => {
  // Seus dados reais identificados no sistema
  const payload = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
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

  console.log('\n🎯 CORRIGINDO TOKEN AUTOMATICAMENTE...');
  console.log('=====================================');
  
  // Criar script HTML que atualiza o localStorage
  const htmlScript = `
<!DOCTYPE html>
<html>
<head>
    <title>Correção Automática do Token</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #28a745; font-weight: bold; }
        .token { background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px 5px; }
        button:hover { background: #0056b3; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Correção Automática do Token</h1>
        
        <div class="status info">
            <strong>Problema:</strong> Sistema usando mock-tenant-id<br>
            <strong>Solução:</strong> Atualizar para tenant real da Lan Solver
        </div>

        <h3>📋 Token Correto:</h3>
        <div class="token">${token}</div>
        
        <h3>🎯 Ações Disponíveis:</h3>
        
        <button onclick="updateToken()">
            ✅ Corrigir Token Automaticamente
        </button>
        
        <button onclick="window.location.reload()">
            🔄 Recarregar Página
        </button>
        
        <button onclick="redirectToConductor()">
            🚀 Ir para Conductor
        </button>
        
        <div id="status-message"></div>

        <script>
            const correctToken = '${token}';
            
            function updateToken() {
                try {
                    // Atualizar localStorage
                    localStorage.setItem('authToken', correctToken);
                    
                    // Feedback visual
                    document.getElementById('status-message').innerHTML = 
                        '<div class="status success">✅ Token atualizado com sucesso! O sistema agora usará o tenant correto.</div>';
                    
                    console.log('✅ Token corrigido:', {
                        tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
                        email: 'alex@lansolver.com',
                        workspace: 'Lan Solver'
                    });
                    
                    // Auto-reload após 2 segundos
                    setTimeout(() => {
                        window.location.href = 'http://localhost:5173';
                    }, 2000);
                    
                } catch (error) {
                    document.getElementById('status-message').innerHTML = 
                        '<div style="color: red;">❌ Erro: ' + error.message + '</div>';
                }
            }
            
            function redirectToConductor() {
                updateToken();
                setTimeout(() => {
                    window.location.href = 'http://localhost:5173';
                }, 1000);
            }
            
            // Auto-executar se parâmetro estiver presente
            if (window.location.search.includes('autofix=true')) {
                updateToken();
            }
        </script>
    </div>
</body>
</html>`;

  // Salvar o arquivo HTML
  writeFileSync('token-fix.html', htmlScript);

  console.log('✅ Arquivo HTML criado: token-fix.html');
  console.log('\n📋 INSTRUÇÕES:');
  console.log('1. Abra: http://localhost:5173/token-fix.html');
  console.log('2. Clique em "Corrigir Token Automaticamente"');
  console.log('3. Aguarde o redirecionamento automático');
  console.log('\n🚀 RESULTADO: Dados da workspace Lan Solver irão carregar!');
  
  console.log('\n🔍 DETALHES DO TOKEN:');
  console.log('- Tenant ID:', payload.tenantId);
  console.log('- Email:', payload.email);
  console.log('- Workspace: Lan Solver');
  console.log('- Validade: 30 dias');
  console.log('- Schema: tenant_3f99462f_3621_4b1b_bea8_782acc50d62e');
};

autoFixToken();
