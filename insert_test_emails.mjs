// SCRIPT PARA INSERIR EMAILS DE TESTE DIRETAMENTE NO BANCO
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString);
const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const schemaName = 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e';

const testEmails = [
  {
    id: 'email-1753062100000-test1',
    messageId: 'test-message-001@gmail.com',
    fromEmail: 'cliente@exemplo.com',
    fromName: 'João Cliente',
    toEmail: 'alexsolver@gmail.com',
    subject: 'Urgente: Problema no sistema de vendas',
    bodyText: 'Olá, estamos com um problema crítico no sistema de vendas. Por favor, nos ajudem o mais rápido possível.',
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
    id: 'email-1753062100001-test2',
    messageId: 'test-message-002@gmail.com',
    fromEmail: 'maria@teste.com',
    fromName: 'Maria Silva',
    toEmail: 'alexsolver@gmail.com',
    subject: 'Solicitação de orçamento',
    bodyText: 'Gostaria de solicitar um orçamento para implementação de sistema de gestão.',
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
    id: 'email-1753062100002-test3',
    messageId: 'test-message-003@gmail.com', 
    fromEmail: 'suporte@fornecedor.com',
    fromName: 'Suporte Técnico',
    toEmail: 'alexsolver@gmail.com',
    subject: 'Atualização disponível - não urgente',
    bodyText: 'Informamos que há uma nova atualização disponível. Pode ser aplicada quando conveniente.',
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
      
      // Use template literal with schema name directly
      await sql([`
        INSERT INTO "${schemaName}".emails (`], [
          id, tenant_id, message_id, from_email, from_name, to_email, 
          cc_emails, bcc_emails, subject, body_text, body_html,
          has_attachments, attachment_count, attachment_details, 
          email_headers, priority, is_read, is_processed,
          email_date, received_at
        ) VALUES (
          ${email.id}, ${tenantId}, ${email.messageId}, 
          ${email.fromEmail}, ${email.fromName}, ${email.toEmail},
          ${email.ccEmails}, ${email.bccEmails}, ${email.subject},
          ${email.bodyText}, ${email.bodyHtml || null},
          ${email.hasAttachments}, ${email.attachmentCount}, ${email.attachmentDetails},
          ${email.emailHeaders}, ${email.priority}, ${email.isRead}, ${email.isProcessed},
          ${email.emailDate}, ${email.receivedAt}
        )
        ON CONFLICT (message_id) DO NOTHING
      `;
      
      console.log(`✅ Inserted: ${email.subject}`);
    }
    
    // Verify insertion
    const result = await sql`
      SELECT COUNT(*), priority, 
             string_agg(subject, ', ' ORDER BY received_at DESC) as subjects
      FROM ${sql.identifier(schemaName, 'emails')}
      WHERE tenant_id = ${tenantId}
      GROUP BY priority
      ORDER BY priority
    `;
    
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