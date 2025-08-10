
export interface KnowledgeBaseEntryCreatedEvent {
  id: string;
  title: string;
  createdAt: Date;
  tenantId: string;
}

export interface KnowledgeBaseEntryUpdatedEvent {
  id: string;
  title: string;
  updatedAt: Date;
  tenantId: string;
}
