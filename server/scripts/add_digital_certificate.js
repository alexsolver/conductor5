
const { Pool } = require('pg');

async function addDigitalCertificate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔑 Adicionando novo certificado digital...');

    // Certificado exemplo - substitua pelos dados reais
    const certificateData = {
      tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e', // Seu tenant ID
      keyName: 'Certificado-ICP-Brasil-2025',
      keyAlgorithm: 'RSA-2048',
      publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f6wX7Nt6qQK...
-----END PUBLIC KEY-----`, // Sua chave pública real
      privateKeyHash: 'sha256:' + require('crypto').randomBytes(32).toString('hex'),
      isActive: true,
      expiresAt: new Date('2026-12-31'),
      certificateChain: JSON.stringify([
        {
          subject: 'CN=Seu Nome,O=Sua Empresa,C=BR',
          issuer: 'CN=AC Serasa RFB v5,OU=Secretaria da Receita Federal do Brasil - RFB,O=ICP-Brasil,C=BR',
          serialNumber: '1234567890',
          validFrom: new Date().toISOString(),
          validTo: '2026-12-31T23:59:59.000Z'
        }
      ])
    };

    await pool.query(`
      INSERT INTO "tenant_${certificateData.tenantId.replace(/-/g, '_')}"."digital_signature_keys" 
      (tenant_id, key_name, key_algorithm, public_key, private_key_hash, is_active, expires_at, certificate_chain)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      certificateData.tenantId,
      certificateData.keyName,
      certificateData.keyAlgorithm,
      certificateData.publicKey,
      certificateData.privateKeyHash,
      certificateData.isActive,
      certificateData.expiresAt,
      certificateData.certificateChain
    ]);

    console.log('✅ Certificado digital adicionado com sucesso!');
    console.log('📋 Detalhes:', {
      nome: certificateData.keyName,
      algoritmo: certificateData.keyAlgorithm,
      expira: certificateData.expiresAt.toLocaleDateString('pt-BR')
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar certificado:', error);
  } finally {
    await pool.end();
  }
}

addDigitalCertificate();
