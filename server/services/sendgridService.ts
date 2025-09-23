import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    content: Buffer;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

export class SendGridService {
  static async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      const emailData: any = {
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text,
        html: params.html || params.text?.replace(/\n/g, '<br>'),
      };

      // Add CC and BCC if provided
      if (params.cc) {
        emailData.cc = params.cc;
      }
      if (params.bcc) {
        emailData.bcc = params.bcc;
      }

      // Add attachments if provided
      if (params.attachments && params.attachments.length > 0) {
        emailData.attachments = params.attachments.map(attachment => ({
          content: attachment.content.toString('base64'),
          filename: attachment.filename,
          type: attachment.type || 'application/octet-stream',
          disposition: attachment.disposition || 'attachment',
        }));
      }

      await sgMail.send(emailData);

      console.log('✅ [SENDGRID] Email sent successfully to:', params.to);
      return true;
    } catch (error: any) {
      console.error('❌ [SENDGRID] Email error:', error);

      // Log detailed SendGrid error information
      if (error.response) {
        console.error('❌ [SENDGRID] Response status:', error.response.status);
        console.error('❌ [SENDGRID] Response headers:', error.response.headers);
        console.error('❌ [SENDGRID] Response body:', error.response.body);

        if (error.response.body && error.response.body.errors) {
          console.error('❌ [SENDGRID] Detailed errors:', JSON.stringify(error.response.body.errors, null, 2));
        }
      }
      return false;
    }
  }
}

// Send invitation email
export const sendInvitationEmail = async ({
  to,
  invitationUrl,
  inviterName,
  role,
  notes,
  expiresAt,
}: {
  to: string;
  invitationUrl: string;
  inviterName: string;
  role: string;
  notes?: string;
  expiresAt: Date;
}) => {
  const roleDisplayNames: Record<string, string> = {
    'saas_admin': 'Administrador SaaS',
    'tenant_admin': 'Administrador do Workspace',
    'agent': 'Agente',
    'customer': 'Cliente'
  };

  const roleDisplay = roleDisplayNames[role] || role;

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Convite para Conductor</h2>

      <p>Olá!</p>

      <p>Você foi convidado por <strong>${inviterName}</strong> para se juntar ao sistema Conductor como <strong>${roleDisplay}</strong>.</p>

      ${notes ? `<p><strong>Mensagem do convite:</strong><br>${notes}</p>` : ''}

      <div style="margin: 30px 0;">
        <a href="${invitationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Aceitar Convite
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Este convite expira em: <strong>${expiresAt.toLocaleDateString('pt-BR')} às ${expiresAt.toLocaleTimeString('pt-BR')}</strong>
      </p>

      <p style="color: #666; font-size: 14px;">
        Se você não conseguir clicar no botão, copie e cole o seguinte link no seu navegador:<br>
        <a href="${invitationUrl}">${invitationUrl}</a>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

      <p style="color: #999; font-size: 12px;">
        Este email foi enviado automaticamente pelo sistema Conductor. Se você não esperava este convite, pode ignorar este email.
      </p>
    </div>
  `;

  return await sendEmail({
    to: to,
    subject: `Convite para Conductor - ${roleDisplay}`,
    html: emailContent,
  });
};

export const sendgridService = {
  sendEmail,
  sendInvitationEmail
};