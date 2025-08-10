
export class KnowledgeBaseSearchService {
  static searchByKeywords(entries: any[], keywords: string[]): any[] {
    if (!keywords || keywords.length === 0) return entries;

    return entries.filter(entry => {
      const searchText = `${entry.title} ${entry.content}`.toLowerCase();
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });
  }

  static searchByCategory(entries: any[], category: string): any[] {
    if (!category) return entries;
    
    return entries.filter(entry => 
      entry.category && entry.category.toLowerCase() === category.toLowerCase()
    );
  }

  static searchByAuthor(entries: any[], authorId: string): any[] {
    if (!authorId) return entries;
    
    return entries.filter(entry => entry.authorId === authorId);
  }
}
