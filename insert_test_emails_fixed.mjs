// SCRIPT PARA INSERIR EMAILS DE TESTE DIRETAMENTE NO BANCO
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString);
const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const schemaName = 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e';

const testEmails = [
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    messageId: 'test-message-001@gmail.com',
    fromEmail: 'cliente@exemplo.com',
    fromName: 'João Cliente',
    toEmail: 'alexsolver@gmail.com',
    subject: 'Urgente: Problema no sistema de vendas',
    bodyText: 'Olá, estamos com um problema crítico no sistema de vendas. Por favor, nos ajudem o mais rápido possível.',
    bodyHtml: null,
    priority: 'high',
    isRead: false,
    isProcessed: false,
    emailDate: new Date(),
    receivedAt: new Date(),
    hasAttachments: false,
    attachmentCount: 0,
    emailHeaders: '{}',
    attachmentDetails: '[]',
    ccEmails: '[]',
    bccEmails: '[]'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    messageId: 'test-message-002@gmail.com',
    fromEmail: 'maria@teste.com',
    fromName: 'Maria Silva',
    toEmail: 'alexsolver@gmail.com',
    subject: 'Solicitação de orçamento',
    bodyText: 'Gostaria de solicitar um orçamento para implementação de sistema de gestão.',
    bodyHtml: null,
    priority: 'medium',
    isRead: false,
    isProcessed: false,
    emailDate: new Date(),
    receivedAt: new Date(),
    hasAttachments: false,
    attachmentCount: 0,
    emailHeaders: '{}',
    attachmentDetails: '[]',
    ccEmails: '[]',
    bccEmails: '[]'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    messageId: 'test-message-003@gmail.com', 
    fromEmail: 'suporte@fornecedor.com',
    fromName: 'Suporte Técnico',
    toEmail: 'alexsolver@gmail.com',
    subject: 'Atualização disponível - não urgente',
    bodyText: 'Informamos que há uma nova atualização disponível. Pode ser aplicada quando conveniente.',
    bodyHtml: null,
    priority: 'low',
    isRead: false,
    isProcessed: false,
    emailDate: new Date(),
    receivedAt: new Date(),
    hasAttachments: false,
    attachmentCount: 0,
    emailHeaders: '{}',
    attachmentDetails: '[]',
    ccEmails: '[]',
    bccEmails: '[]'
  }
];

async function insertEmails() {
  try {
    console.log('🚀 Starting email insertion...');
    
    for (const email of testEmails) {
      console.log(`📧 Inserting: ${email.subject}`);
      
      const insertQuery = `
        INSERT INTO "${schemaName}".emails (
          id, tenant_id, message_id, from_email, from_name, to_email, 
          cc_emails, bcc_emails, subject, body_text, body_html,
          has_attachments, attachment_count, attachment_details, 
          email_headers, priority, is_read, is_processed,
          email_date, received_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT (message_id) DO NOTHING
      `;
      
      await sql(insertQuery, [
        email.id,
        tenantId,
        email.messageId,
        email.fromEmail,
        email.fromName,
        email.toEmail,
        email.ccEmails,
        email.bccEmails,
        email.subject,
        email.bodyText,
        email.bodyHtml,
        email.hasAttachments,
        email.attachmentCount,
        email.attachmentDetails,
        email.emailHeaders,
        email.priority,
        email.isRead,
        email.isProcessed,
        email.emailDate,
        email.receivedAt
      ]);
      
      console.log(`✅ Inserted: ${email.subject}`);
    }
    
    // Verify insertion
    const verifyQuery = `
      SELECT COUNT(*), priority, 
             string_agg(subject, ', ' ORDER BY received_at DESC) as subjects
      FROM "${schemaName}".emails 
      WHERE tenant_id = $1
      GROUP BY priority
      ORDER BY priority
    `;
    
    const result = await sql(verifyQuery, [tenantId]);
    
    console.log('\n📊 Email Summary:');
    for (const row of result) {
      console.log(`  ${row.priority}: ${row.count} emails`);
      console.log(`    Subjects: ${row.subjects}`);
    }
    
    console.log('\n✅ All emails inserted successfully!');
    
  } catch (error) {
    console.error('❌ Error inserting emails:', error.message);
    throw error;
  }
}

insertEmails().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});