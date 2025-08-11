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

  // CLEANED: Factory methods removed - handled by repository layer
  // Domain entities focus purely on business logic

  // CLEANED: Factory method removed - reconstruction moved to repository layer

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