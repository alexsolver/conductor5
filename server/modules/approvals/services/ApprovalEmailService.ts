// ✅ 1QA.MD COMPLIANCE: APPROVAL EMAIL SERVICE
// Service for sending approval notification emails with unique tokens

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface ApprovalEmailData {
  to: string;
  toName: string;
  ticketNumber: string;
  ticketTitle: string;
  requestReason: string;
  approveToken: string;
  rejectToken: string;
  baseUrl: string;
  slaDeadline?: Date;
}

export class ApprovalEmailService {
  /**
   * Send approval request email with approve/reject links
   */
  static async sendApprovalRequest(data: ApprovalEmailData): Promise<boolean> {
    try {
      const approveUrl = `${data.baseUrl}/api/approvals/public/approve/${data.approveToken}`;
      const rejectUrl = `${data.baseUrl}/api/approvals/public/reject/${data.rejectToken}`;

      const htmlContent = this.generateEmailTemplate(data, approveUrl, rejectUrl);

      const msg = {
        to: data.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@conductor.com',
        subject: `🔔 Aprovação Necessária: ${data.ticketNumber} - ${data.ticketTitle}`,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.log(`✅ [APPROVAL-EMAIL] Email sent to ${data.to} for ticket ${data.ticketNumber}`);
      return true;
    } catch (error) {
      console.error('❌ [APPROVAL-EMAIL] Error sending email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template with approval buttons
   */
  private static generateEmailTemplate(
    data: ApprovalEmailData,
    approveUrl: string,
    rejectUrl: string
  ): string {
    const slaInfo = data.slaDeadline
      ? `<p style="color: #e74c3c; font-weight: bold;">⏰ Prazo limite: ${data.slaDeadline.toLocaleString('pt-BR')}</p>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Aprovação Necessária</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 10px;">Olá <strong>${data.toName}</strong>,</p>
    
    <p style="font-size: 14px; color: #555;">
      Uma nova solicitação de aprovação requer sua atenção.
    </p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Ticket:</strong> ${data.ticketNumber}</p>
      <p style="margin: 5px 0;"><strong>Título:</strong> ${data.ticketTitle}</p>
      <p style="margin: 5px 0;"><strong>Motivo:</strong> ${data.requestReason}</p>
      ${slaInfo}
    </div>
    
    <p style="font-size: 14px; color: #555; margin-top: 20px;">
      Por favor, revise a solicitação e tome uma decisão clicando em um dos botões abaixo:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${approveUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        ✅ Aprovar
      </a>
      
      <a href="${rejectUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        ❌ Rejeitar
      </a>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Atenção:</strong> Estes links são de uso único e válidos por 24 horas. Após processar a aprovação, os links se tornarão inválidos.
      </p>
    </div>
    
    <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
      Este é um email automático do sistema Conductor. Por favor, não responda a este email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}
