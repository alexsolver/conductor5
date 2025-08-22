
export class EmailProcessor {
  private emailQueue: any[] = [];
  private processing = false;

  constructor() {
    this.startEmailQueue();
  }

  async sendUrgent(notification: any): Promise<void> {
    try {
      // Para notificações urgentes, enviar imediatamente
      await this.sendEmailDirect(notification);
      console.log(`📧 [EMAIL] Urgent notification sent: ${notification.id}`);
    } catch (error) {
      console.error('📧 [EMAIL] Urgent send error:', error);
    }
  }

  async queueEmail(notification: any): Promise<void> {
    this.emailQueue.push(notification);
    console.log(`📧 [EMAIL] Email queued: ${notification.id}`);
  }

  private async sendEmailDirect(notification: any): Promise<void> {
    // TODO: Integrar com serviço de email real (SendGrid, AWS SES, etc.)
    
    const emailData = {
      to: notification.recipientEmail,
      subject: notification.title,
      html: this.generateEmailTemplate(notification),
      from: process.env.FROM_EMAIL || 'noreply@conductor.com'
    };

    // Simulação de envio - substituir por integração real
    console.log(`📧 [EMAIL] Sending email to ${emailData.to}: ${emailData.subject}`);
    
    // Exemplo de integração com SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(emailData);
    */
  }

  private generateEmailTemplate(notification: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #1976d2; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
            .priority-urgent { border-left: 5px solid #f44336; }
            .priority-high { border-left: 5px solid #ff9800; }
            .priority-normal { border-left: 5px solid #4caf50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 ${notification.title}</h1>
            </div>
            <div class="content priority-${notification.priority >= 8 ? 'urgent' : notification.priority >= 5 ? 'high' : 'normal'}">
              <p><strong>Mensagem:</strong></p>
              <p>${notification.message}</p>
              
              <p><strong>Data:</strong> ${new Date(notification.createdAt).toLocaleString('pt-BR')}</p>
              
              ${notification.actionUrl ? `
                <p>
                  <a href="${notification.actionUrl}" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Ver Detalhes
                  </a>
                </p>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private startEmailQueue(): void {
    setInterval(async () => {
      if (this.emailQueue.length > 0 && !this.processing) {
        this.processing = true;
        
        try {
          const batch = this.emailQueue.splice(0, 10); // Processar até 10 emails por vez
          
          for (const notification of batch) {
            await this.sendEmailDirect(notification);
            await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
          }
        } catch (error) {
          console.error('📧 [EMAIL] Queue processing error:', error);
        } finally {
          this.processing = false;
        }
      }
    }, 5000); // Processar fila a cada 5 segundos
  }
}
