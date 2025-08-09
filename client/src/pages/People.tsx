
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Users, Search, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Person {
  id: string;
  type: 'user' | 'customer';
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
}

export default function People() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<('user' | 'customer')[]>(['user', 'customer']);

  // Fetch all people
  const { data: people = [], isLoading, error } = useQuery({
    queryKey: ["/api/people"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/people");
      return response.json();
    },
  });

  // Search people when query changes
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/people/search", searchQuery, selectedTypes],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const typesParam = selectedTypes.join(',');
      const response = await apiRequest("GET", `/api/people/search?q=${searchQuery}&types=${typesParam}&limit=20`);
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const displayPeople = searchQuery.length >= 2 ? searchResults : people;

  const getPersonIcon = (type: 'user' | 'customer') => {
    return type === 'user' ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  const getPersonBadge = (type: 'user' | 'customer') => {
    return type === 'user' 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Usuário</Badge>
      : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cliente</Badge>;
  };

  const toggleType = (type: 'user' | 'customer') => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando pessoas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-600">
              Erro ao carregar pessoas: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
          <p className="text-muted-foreground">
            Gestão unificada de usuários e clientes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Pessoa
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pessoas por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedTypes.includes('user') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleType('user')}
              >
                <User className="h-4 w-4 mr-2" />
                Usuários
              </Button>
              <Button
                variant={selectedTypes.includes('customer') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleType('customer')}
              >
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayPeople.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                {searchQuery ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa cadastrada"}
              </div>
            </CardContent>
          </Card>
        ) : (
          displayPeople.map((person: Person) => (
            <Card key={`${person.type}-${person.id}`} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPersonIcon(person.type)}
                    <CardTitle className="text-base">{person.fullName}</CardTitle>
                  </div>
                  {getPersonBadge(person.type)}
                </div>
                <CardDescription className="flex items-center gap-2">
                  {person.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>ID: {person.id.slice(0, 8)}...</span>
                  <Button variant="ghost" size="sm">
                    Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total de pessoas:</span>{' '}
              {displayPeople.length}
            </div>
            <div>
              <span className="font-medium">Filtros ativos:</span>{' '}
              {selectedTypes.join(', ')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
