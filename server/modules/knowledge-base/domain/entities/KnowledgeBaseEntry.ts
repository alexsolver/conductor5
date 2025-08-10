// Domain entities should not depend on ORM libraries

export interface KnowledgeBaseEntryProps {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class KnowledgeBaseEntry {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly category: string,
    public readonly tags: string[],
    public readonly authorId: string,
    public readonly isPublished: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Factory method removed - should be handled by repository or service layer
  static createRemoved(props: Omit<KnowledgeBaseEntryProps, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeBaseEntry {
    return new KnowledgeBaseEntry(
      crypto.randomUUID(),
      props.title,
      props.content,
      props.category,
      props.tags,
      props.authorId,
      props.isPublished ?? false
    );
  }

  static reconstruct(props: KnowledgeBaseEntryProps): KnowledgeBaseEntry {
    return new KnowledgeBaseEntry(
      props.id,
      props.title,
      props.content,
      props.category,
      props.tags,
      props.authorId,
      props.isPublished ?? false,
      props.createdAt,
      props.updatedAt
    );
  }

  publish(): KnowledgeBaseEntry {
    return new KnowledgeBaseEntry(
      this.id,
      this.title,
      this.content,
      this.category,
      this.tags,
      this.authorId,
      true,
      this.createdAt,
      new Date()
    );
  }

  update(props: Partial<Pick<KnowledgeBaseEntryProps, 'title' | 'content' | 'category' | 'tags'>>): KnowledgeBaseEntry {
    return new KnowledgeBaseEntry(
      this.id,
      props.title ?? this.title,
      props.content ?? this.content,
      props.category ?? this.category,
      props.tags ?? this.tags,
      this.authorId,
      this.isPublished,
      this.createdAt,
      new Date()
    );
  }
}