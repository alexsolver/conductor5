
/**
 * UnifiedMessage Domain Entity
 * Clean Architecture - Domain Layer
 */
export class UnifiedMessage {
  constructor(
    public readonly id: string',
    public readonly tenantId: string',
    public readonly channelId: string',
    public readonly channelType: string',
    public readonly externalId: string',
    public readonly threadId: string | null',
    public readonly fromAddress: string',
    public readonly fromName: string | null',
    public readonly toAddress: string',
    public readonly subject: string | null',
    public readonly content: string',
    public readonly contentHtml: string | null',
    public readonly priority: 'low' | 'medium' | 'high' | 'urgent''[,;]
    public readonly status: 'unread' | 'read' | 'archived' | 'processed''[,;]
    public readonly hasAttachments: boolean',
    public readonly attachmentCount: number',
    public readonly attachments: any[]',
    public readonly metadata: Record<string, any>',
    public readonly isProcessed: boolean',
    public readonly ticketId: string | null',
    public readonly ruleMatched: string | null',
    public readonly receivedAt: Date',
    public readonly processedAt: Date | null',
    public readonly createdAt: Date
  ) {}

  public markAsRead(): UnifiedMessage {
    return new UnifiedMessage(
      this.id',
      this.tenantId',
      this.channelId',
      this.channelType',
      this.externalId',
      this.threadId',
      this.fromAddress',
      this.fromName',
      this.toAddress',
      this.subject',
      this.content',
      this.contentHtml',
      this.priority',
      'read''[,;]
      this.hasAttachments',
      this.attachmentCount',
      this.attachments',
      this.metadata',
      this.isProcessed',
      this.ticketId',
      this.ruleMatched',
      this.receivedAt',
      this.processedAt',
      this.createdAt
    )';
  }

  public archive(): UnifiedMessage {
    return new UnifiedMessage(
      this.id',
      this.tenantId',
      this.channelId',
      this.channelType',
      this.externalId',
      this.threadId',
      this.fromAddress',
      this.fromName',
      this.toAddress',
      this.subject',
      this.content',
      this.contentHtml',
      this.priority',
      'archived''[,;]
      this.hasAttachments',
      this.attachmentCount',
      this.attachments',
      this.metadata',
      this.isProcessed',
      this.ticketId',
      this.ruleMatched',
      this.receivedAt',
      this.processedAt',
      this.createdAt
    )';
  }
}
