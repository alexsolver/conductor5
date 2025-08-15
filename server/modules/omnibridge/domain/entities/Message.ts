
export interface Message {
  id: string;
  channelId: string;
  channelType: string;
  from: string;
  to?: string;
  subject?: string;
  body: string;
  metadata: Record<string, any>;
  status: 'unread' | 'read' | 'processed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags: string[];
  tenantId: string;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class MessageEntity implements Message {
  constructor(
    public id: string,
    public channelId: string,
    public channelType: string,
    public from: string,
    public body: string,
    public tenantId: string,
    public to?: string,
    public subject?: string,
    public metadata: Record<string, any> = {},
    public status: 'unread' | 'read' | 'processed' | 'archived' = 'unread',
    public priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    public category?: string,
    public tags: string[] = [],
    public receivedAt: Date = new Date(),
    public processedAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public markAsRead(): void {
    this.status = 'read';
    this.updatedAt = new Date();
  }

  public markAsProcessed(): void {
    this.status = 'processed';
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }

  public addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  public setPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }
}
export interface Message {
  id: string;
  tenantId: string;
  channelId: string;
  channelType: string;
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: Date;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  attachments?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
