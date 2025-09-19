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