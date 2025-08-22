
export class SMSProcessor {
  private smsQueue: any[] = [];
  private processing = false;

  constructor() {
    this.startSMSQueue();
  }

  async sendUrgent(notification: any): Promise<void> {
    try {
      // Para notificações urgentes, enviar imediatamente
      await this.sendSMSDirect(notification);
      console.log(`📱 [SMS] Urgent notification sent: ${notification.id}`);
    } catch (error) {
      console.error('📱 [SMS] Urgent send error:', error);
    }
  }

  async queueSMS(notification: any): Promise<void> {
    this.smsQueue.push(notification);
    console.log(`📱 [SMS] SMS queued: ${notification.id}`);
  }

  private async sendSMSDirect(notification: any): Promise<void> {
    // TODO: Integrar com serviço de SMS real (Twilio, AWS SNS, etc.)
    
    const smsData = {
      to: notification.recipientPhone,
      message: this.generateSMSMessage(notification),
      from: process.env.SMS_FROM || '+1234567890'
    };

    // Simulação de envio - substituir por integração real
    console.log(`📱 [SMS] Sending SMS to ${smsData.to}: ${smsData.message.substring(0, 50)}...`);
    
    // Exemplo de integração com Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    
    await client.messages.create({
      body: smsData.message,
      from: smsData.from,
      to: smsData.to
    });
    */
  }

  private generateSMSMessage(notification: any): string {
    const urgentPrefix = notification.priority >= 8 ? '🚨 URGENTE: ' : '';
    const maxLength = 160 - urgentPrefix.length - 20; // Reservar espaço para link
    
    let message = `${urgentPrefix}${notification.title}`;
    
    if (notification.message && message.length < maxLength) {
      const remainingSpace = maxLength - message.length - 3; // 3 para " - "
      if (remainingSpace > 10) {
        const truncatedMessage = notification.message.length > remainingSpace 
          ? notification.message.substring(0, remainingSpace - 3) + '...'
          : notification.message;
        message += ` - ${truncatedMessage}`;
      }
    }
    
    if (notification.actionUrl) {
      message += ` ${notification.actionUrl}`;
    }
    
    return message;
  }

  private startSMSQueue(): void {
    setInterval(async () => {
      if (this.smsQueue.length > 0 && !this.processing) {
        this.processing = true;
        
        try {
          const batch = this.smsQueue.splice(0, 5); // Processar até 5 SMS por vez
          
          for (const notification of batch) {
            await this.sendSMSDirect(notification);
            await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
          }
        } catch (error) {
          console.error('📱 [SMS] Queue processing error:', error);
        } finally {
          this.processing = false;
        }
      }
    }, 10000); // Processar fila a cada 10 segundos
  }
}
