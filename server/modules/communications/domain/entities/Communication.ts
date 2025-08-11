/**
 * Communication Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for omnichannel communication management
 */

interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'customer' | 'agent' | 'system';
  status: 'active' | 'inactive' | 'blocked';
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export class Communication {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private channel: 'email' | 'whatsapp' | 'slack' | 'sms' | 'voice' | 'chat',
    private subject: string,
    private content: string,
    private direction: 'inbound' | 'outbound',
    private participants: Participant[] = [],
    private attachments: Attachment[] = [],
    private status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed' | 'archived' = 'draft',
    private priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    private tags: string[] = [],
    private metadata: Record<string, any> = {},
    private threadId: string | null = null,
    private replyToId: string | null = null,
    private readonly sentAt: Date | null = null,
    private readonly deliveredAt: Date | null = null,
    private readonly readAt: Date | null = null,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getChannel(): 'email' | 'whatsapp' | 'slack' | 'sms' | 'voice' | 'chat' { return this.channel; }
  getSubject(): string { return this.subject; }
  getContent(): string { return this.content; }
  getDirection(): 'inbound' | 'outbound' { return this.direction; }
  getParticipants(): Participant[] { return [...this.participants]; }
  getAttachments(): Attachment[] { return [...this.attachments]; }
  getStatus(): 'draft' | 'sent' | 'delivered' | 'read' | 'failed' | 'archived' { return this.status; }
  getPriority(): 'low' | 'normal' | 'high' | 'urgent' { return this.priority; }
  getTags(): string[] { return [...this.tags]; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getThreadId(): string | null { return this.threadId; }
  getReplyToId(): string | null { return this.replyToId; }
  getSentAt(): Date | null { return this.sentAt; }
  getDeliveredAt(): Date | null { return this.deliveredAt; }
  getReadAt(): Date | null { return this.readAt; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateContent(subject: string, content: string): void {
    if (this.status !== 'draft') {
      throw new Error('Cannot update content of non-draft communication');
    }
    if (!subject.trim() || !content.trim()) {
      throw new Error('Subject and content cannot be empty');
    }
    
    this.subject = subject.trim();
    this.content = content.trim();
    this.updatedAt = new Date();
  }

  addParticipant(participant: Participant): void {
    if (this.status === 'sent' || this.status === 'delivered') {
      throw new Error('Cannot add participants to sent communication');
    }
    
    // Check for duplicate
    const exists = this.participants.some(p => p.id === participant.id);
    if (!exists) {
      this.participants.push(participant);
      this.updatedAt = new Date();
    }
  }

  removeParticipant(participantId: string): void {
    if (this.status === 'sent' || this.status === 'delivered') {
      throw new Error('Cannot remove participants from sent communication');
    }
    
    this.participants = this.participants.filter(p => p.id !== participantId);
    this.updatedAt = new Date();
  }

  addAttachment(attachment: Attachment): void {
    if (this.status !== 'draft') {
      throw new Error('Cannot add attachments to non-draft communication');
    }
    
    // Check file size limits based on channel
    const maxSize = this.getMaxAttachmentSize();
    if (attachment.size > maxSize) {
      throw new Error(`Attachment size exceeds ${maxSize} bytes limit for ${this.channel}`);
    }
    
    this.attachments.push(attachment);
    this.updatedAt = new Date();
  }

  removeAttachment(attachmentId: string): void {
    if (this.status !== 'draft') {
      throw new Error('Cannot remove attachments from non-draft communication');
    }
    
    this.attachments = this.attachments.filter(a => a.id !== attachmentId);
    this.updatedAt = new Date();
  }

  changePriority(priority: 'low' | 'normal' | 'high' | 'urgent'): void {
    if (this.status === 'archived') {
      throw new Error('Cannot change priority of archived communication');
    }
    
    this.priority = priority;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!tag.trim()) return;
    
    const normalizedTag = tag.trim().toLowerCase();
    if (!this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    this.tags = this.tags.filter(t => t !== normalizedTag);
    this.updatedAt = new Date();
  }

  send(): void {
    if (this.status !== 'draft') {
      throw new Error('Can only send draft communications');
    }
    if (this.participants.length === 0) {
      throw new Error('Cannot send communication without participants');
    }
    if (!this.content.trim()) {
      throw new Error('Cannot send communication without content');
    }
    
    this.status = 'sent';
    // sentAt would be set by infrastructure layer
    this.updatedAt = new Date();
  }

  markAsDelivered(): void {
    if (this.status !== 'sent') {
      throw new Error('Can only mark sent communications as delivered');
    }
    
    this.status = 'delivered';
    // deliveredAt would be set by infrastructure layer
    this.updatedAt = new Date();
  }

  markAsRead(): void {
    if (this.status !== 'delivered' && this.status !== 'sent') {
      throw new Error('Can only mark delivered communications as read');
    }
    
    this.status = 'read';
    // readAt would be set by infrastructure layer
    this.updatedAt = new Date();
  }

  markAsFailed(reason?: string): void {
    if (this.status !== 'sent') {
      throw new Error('Can only mark sent communications as failed');
    }
    
    this.status = 'failed';
    if (reason) {
      this.addMetadata('failure_reason', reason);
    }
    this.updatedAt = new Date();
  }

  archive(): void {
    if (this.status === 'draft') {
      throw new Error('Cannot archive draft communication');
    }
    
    this.status = 'archived';
    this.updatedAt = new Date();
  }

  setThreadId(threadId: string): void {
    this.threadId = threadId;
    this.updatedAt = new Date();
  }

  setReplyTo(replyToId: string): void {
    this.replyToId = replyToId;
    this.updatedAt = new Date();
  }

  addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  // Business queries
  isOutbound(): boolean {
    return this.direction === 'outbound';
  }

  isInbound(): boolean {
    return this.direction === 'inbound';
  }

  hasAttachments(): boolean {
    return this.attachments.length > 0;
  }

  getAttachmentCount(): number {
    return this.attachments.length;
  }

  getTotalAttachmentSize(): number {
    return this.attachments.reduce((total, att) => total + att.size, 0);
  }

  getMaxAttachmentSize(): number {
    // Different channels have different limits
    switch (this.channel) {
      case 'email': return 25 * 1024 * 1024; // 25MB
      case 'whatsapp': return 16 * 1024 * 1024; // 16MB
      case 'slack': return 1024 * 1024 * 1024; // 1GB
      case 'sms': return 0; // No attachments
      case 'chat': return 10 * 1024 * 1024; // 10MB
      default: return 5 * 1024 * 1024; // 5MB default
    }
  }

  getCustomers(): Participant[] {
    return this.participants.filter(p => p.type === 'customer');
  }

  getAgents(): Participant[] {
    return this.participants.filter(p => p.type === 'agent');
  }

  canHaveAttachments(): boolean {
    return this.channel !== 'sms' && this.channel !== 'voice';
  }

  isUrgent(): boolean {
    return this.priority === 'urgent';
  }

  isHighPriority(): boolean {
    return this.priority === 'high' || this.priority === 'urgent';
  }

  isPartOfThread(): boolean {
    return this.threadId !== null;
  }

  isReply(): boolean {
    return this.replyToId !== null;
  }

  getResponseTime(): number | null {
    if (!this.sentAt || this.direction !== 'outbound' || !this.replyToId) {
      return null;
    }
    
    // Response time calculation would need the original message timestamp
    return null; // Would be calculated by use case with repository
  }

  supportsRichContent(): boolean {
    return ['email', 'slack', 'chat'].includes(this.channel);
  }

  getChannelDisplayName(): string {
    switch (this.channel) {
      case 'email': return 'Email';
      case 'whatsapp': return 'WhatsApp';
      case 'slack': return 'Slack';
      case 'sms': return 'SMS';
      case 'voice': return 'Voice';
      case 'chat': return 'Live Chat';
      default: return 'Unknown';
    }
  }

  getStatusDisplayName(): string {
    switch (this.status) {
      case 'draft': return 'Draft';
      case 'sent': return 'Sent';
      case 'delivered': return 'Delivered';
      case 'read': return 'Read';
      case 'failed': return 'Failed';
      case 'archived': return 'Archived';
      default: return 'Unknown';
    }
  }

  hasParticipant(participantId: string): boolean {
    return this.participants.some(p => p.id === participantId);
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag.toLowerCase());
  }
}