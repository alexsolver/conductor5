// ✅ 1QA.MD COMPLIANCE: ADVANCED KNOWLEDGE BASE MANAGER - CLEAN ARCHITECTURE
// Presentation layer component integrating all advanced features

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
  GitBranch, 
  Layers, 
  Upload,
  Settings,
  Clock,
  Star,
  Tag,
  FileText,
  Users
} from "lucide-react";
import { TemplateCreateDialog } from "./TemplateCreateDialog";
import { MediaUploadDialog } from "./MediaUploadDialog";

interface AdvancedKnowledgeBaseManagerProps {
  onFeatureSelect?: (feature: string) => void;
}

export function AdvancedKnowledgeBaseManager({ onFeatureSelect }: AdvancedKnowledgeBaseManagerProps) {
  const [activeTab, setActiveTab] = useState("search");

  const handleFeatureClick = (feature: string) => {
    console.log(`✅ [KB-ADVANCED] Feature activated: ${feature}`);
    onFeatureSelect?.(feature);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Gerenciador Avançado da Knowledge Base</h2>
        <p className="text-gray-600">
          Funcionalidades avançadas para gerenciamento inteligente de conteúdo
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Busca Semântica</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Busca Semântica */}
        <TabsContent value="search" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Busca Inteligente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Sistema de busca semântica com IA para encontrar conteúdo relevante
                </p>
                <Button 
                  onClick={() => handleFeatureClick('semantic-search')}
                  className="w-full"
                  data-testid="button-semantic-search"
                >
                  Configurar Busca Semântica
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-600" />
                  Filtros Avançados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Filtros dinâmicos por categoria, tags, autor e data
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => handleFeatureClick('advanced-filters')}
                  className="w-full"
                  data-testid="button-advanced-filters"
                >
                  Gerenciar Filtros
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Sistema de Templates</h3>
              <TemplateCreateDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    FAQ Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Template estruturado para perguntas frequentes
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">FAQ</Badge>
                    <Button size="sm" variant="outline">Usar</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Procedimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Template para documentação de processos
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">Processo</Badge>
                    <Button size="sm" variant="outline">Usar</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Treinamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Template para materiais de treinamento
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">Educação</Badge>
                    <Button size="sm" variant="outline">Usar</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Workflow */}
        <TabsContent value="workflow" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Agendamento de Publicação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Agende publicações automáticas de artigos
                </p>
                <Button 
                  onClick={() => handleFeatureClick('publication-scheduling')}
                  className="w-full"
                  data-testid="button-publication-scheduling"
                >
                  Configurar Agendamento
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-indigo-600" />
                  Controle de Versões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Histórico completo de alterações e versionamento
                </p>
                <Button 
                  variant="outline"
                  onClick={() => handleFeatureClick('version-control')}
                  className="w-full"
                  data-testid="button-version-control"
                >
                  Ver Histórico
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Sistema de Comentários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Comentários e avaliações dos usuários
                </p>
                <Button 
                  variant="outline"
                  onClick={() => handleFeatureClick('comments-ratings')}
                  className="w-full"
                  data-testid="button-comments-ratings"
                >
                  Gerenciar Comentários
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-pink-600" />
                  Upload de Mídia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Gerencie imagens, vídeos e documentos
                </p>
                <MediaUploadDialog />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Artigos Populares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-xs text-muted-foreground">Mais visualizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Artigos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">0</div>
                <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-500" />
                  Tags Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <p className="text-xs text-muted-foreground">Em uso</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Engajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <p>Analytics detalhados serão exibidos aqui</p>
                  <p className="text-sm mt-2">Visualizações, avaliações e estatísticas de uso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}