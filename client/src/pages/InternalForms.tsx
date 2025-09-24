
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Settings, BarChart3, Users, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InternalFormBuilder } from "@/components/internal-forms/InternalFormBuilder";
import { FormSubmissionsList } from "@/components/internal-forms/FormSubmissionsList";

export default function InternalForms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['internal-forms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/internal-forms/forms');
      return response.json();
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['form-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/internal-forms/categories');
      return response.json();
    }
  });

  const filteredForms = (Array.isArray(forms) ? forms : []).filter((form: any) => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const categoryData = (Array.isArray(categories) ? categories : []).find((c: any) => c.name === category);
    return categoryData?.icon || 'FileText';
  };

  const getCategoryColor = (category: string) => {
    const categoryData = (Array.isArray(categories) ? categories : []).find((c: any) => c.name === category);
    return categoryData?.color || '#3B82F6';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Formulários de Ações Internas</h1>
          <p className="text-gray-600 dark:text-gray-400">Crie e gerencie formulários para automação de processos internos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Formulário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Formulário</DialogTitle>
            </DialogHeader>
            <InternalFormBuilder onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Formulários</p>
                <p className="text-2xl font-bold">{Array.isArray(forms) ? forms.length : 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Formulários Ativos</p>
                <p className="text-2xl font-bold">{Array.isArray(forms) ? forms.filter((f: any) => f.isActive).length : 0}</p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categorias</p>
                <p className="text-2xl font-bold">{Array.isArray(categories) ? categories.length : 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submissões Hoje</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar formulários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todas as Categorias</option>
              {(Array.isArray(categories) ? categories : []).map((category: any) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form: any) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{form.name}</CardTitle>
                <Badge
                  variant={form.isActive ? "default" : "secondary"}
                  style={{ backgroundColor: form.isActive ? getCategoryColor(form.category) : undefined }}
                >
                  {form.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{form.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Categoria: {form.category}</span>
                <span>{form.fields.length} campos</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Visualizar
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredForms.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Nenhum formulário encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro formulário de ação interna"
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Formulário
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
