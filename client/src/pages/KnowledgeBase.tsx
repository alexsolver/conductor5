import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Book, FileText, Users, Code, CreditCard, Rocket, HelpCircle, ThumbsUp, ThumbsDown, Eye } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  helpful: number;
  notHelpful: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  articleCount: number;
  icon: string;
}

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'rocket': return <Rocket className="h-6 w-6" />;
    case 'user': return <Users className="h-6 w-6" />;
    case 'wrench': return <HelpCircle className="h-6 w-6" />;
    case 'code': return <Code className="h-6 w-6" />;
    case 'credit-card': return <CreditCard className="h-6 w-6" />;
    default: return <Book className="h-6 w-6" />;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/knowledge-base/categories'],
  });

  // Fetch articles
  const { data: articlesResponse } = useQuery<{articles: Article[]; pagination: any; filters: any}>({
    queryKey: ['/api/knowledge-base/articles', { category: selectedCategory, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/knowledge-base/articles?${params}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      return response.json();
    }
  });

  // Fetch specific article
  const { data: fullArticle } = useQuery<Article>({
    queryKey: ['/api/knowledge-base/articles', selectedArticle?.id],
    queryFn: async () => {
      if (!selectedArticle?.id) return null;
      const response = await fetch(`/api/knowledge-base/articles/${selectedArticle.id}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      return response.json();
    },
    enabled: !!selectedArticle?.id
  });

  const articles = articlesResponse?.articles || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the query dependency
  };

  const handleRateArticle = async (articleId: string, helpful: boolean) => {
    try {
      await fetch(`/api/knowledge-base/articles/${articleId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful })
      });
      // Optionally refetch the article to update counts
    } catch (error) {
      console.error('Error rating article:', error);
    }
  };

  if (selectedArticle && fullArticle) {
    return (
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedArticle(null)}
                className="mb-4"
              >
                ← Voltar para Base de Conhecimento
              </Button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {fullArticle.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>Por {fullArticle.author}</span>
                <span>•</span>
                <span>{formatDate(fullArticle.createdAt)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{fullArticle.views} visualizações</span>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">{fullArticle.content}</div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Este artigo foi útil?</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateArticle(fullArticle.id, true)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Sim ({fullArticle.helpful})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateArticle(fullArticle.id, false)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Não ({fullArticle.notHelpful})
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Base de Conhecimento
          </h1>
          <p className="text-muted-foreground mt-2">
            Encontre respostas, guias e documentação para usar a plataforma
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar na base de conhecimento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Pesquisar</Button>
            </form>
          </CardContent>
        </Card>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="articles">Artigos</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    // Switch to articles tab
                    document.querySelector('[value="articles"]')?.click();
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        {getCategoryIcon(category.icon)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.articleCount} artigos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            {selectedCategory && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{categories.find(c => c.id === selectedCategory)?.name}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Limpar filtro
                </Button>
              </div>
            )}

            <div className="grid gap-6">
              {articles.map((article) => (
                <Card 
                  key={article.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{article.title}</CardTitle>
                        <CardDescription>
                          {article.excerpt || article.content?.substring(0, 200) + '...'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {categories.find(c => c.id === article.category)?.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Por {article.author}</span>
                        <span>•</span>
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{article.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{article.helpful}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {articles.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum artigo encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `Não encontramos artigos para "${searchQuery}"`
                      : selectedCategory 
                      ? "Esta categoria não possui artigos ainda"
                      : "Carregando artigos..."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}