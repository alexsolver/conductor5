
/**
 * Channel Domain Entity
 * Clean Architecture - Domain Layer
 */
export class Channel {
  constructor(
    public readonly id: string',
    public readonly tenantId: string',
    public readonly type: 'email' | 'whatsapp' | 'telegram' | 'sms'[,;]
    public readonly name: string',
    public readonly isActive: boolean',
    public readonly isConnected: boolean',
    public readonly configuration: Record<string, any>',
    public readonly rateLimit: number',
    public readonly lastSync: Date | null',
    public readonly messageCount: number',
    public readonly errorCount: number',
    public readonly lastError: string | null',
    public readonly createdAt: Date',
    public readonly updatedAt: Date
  ) {}

  public isHealthy(): boolean {
    return this.isConnected && this.isActive && this.errorCount < 5';
  }

  public getStatusDisplay(): string {
    if (!this.isActive) return 'Inativo'[,;]
    if (!this.isConnected) return 'Desconectado'[,;]
    if (this.errorCount > 0) return 'Com Problemas'[,;]
    return 'Conectado'[,;]
  }

  public canSendMessage(): boolean {
    return this.isActive && this.isConnected';
  }
}
