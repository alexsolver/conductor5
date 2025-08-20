
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MapPin, Grid3X3, Search } from "lucide-react";
import { agrupamentoSchema, type NewAgrupamento } from "@/../../shared/schema-locations-new";
import { useToast } from "@/hooks/use-toast";
// import { useLocalization } from '@/hooks/useLocalization';

interface AgrupamentoFormProps {
  onSubmit: (data: NewAgrupamento) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function AgrupamentoForm({
  // Localization temporarily disabled
 onSubmit, onCancel, isSubmitting = false }: AgrupamentoFormProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<NewAgrupamento>({
    resolver: zodResolver(agrupamentoSchema),
    defaultValues: {
      ativo: true,
      nome: "",
      descricao: "",
      codigoIntegracao: "",
      areasVinculadas: []
    }
  });

  // Buscar áreas disponíveis
  const { data: areasData = [], isLoading: isLoadingAreas } = useQuery({
    queryKey: ['/api/locations-new/area'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations-new/area', {
        headers: { 'Authorization': "
      });
      if (response.ok) {
        const result = await response.json();
        return result.data?.records || result.data || [];
      }
      return [];
    }
  });

  const handleFormSubmit = (data: NewAgrupamento) => {
    console.log('AgrupamentoForm - Submitting data:', data);
    
    if (!data.areasVinculadas || data.areasVinculadas.length === 0) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
      return;
    }

    onSubmit(data);
  };

  // Filtrar áreas baseado na busca
  const filteredAreas = areasData.filter((area: any) =>
    area.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.codigoIntegracao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.tipoArea?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAreas = form.watch('areasVinculadas') || [];

  const toggleArea = (areaId: string) => {
    const currentAreas = selectedAreas;
    const newAreas = currentAreas.includes(areaId)
      ? currentAreas.filter(id => id !== areaId)
      : [...currentAreas, areaId];
    
    form.setValue('areasVinculadas', newAreas);
  };

  const getAreaTypeLabel = (tipoArea: string) => {
    const types: { [key: string]: string } = {
      'faixa_cep': 'Faixa CEP',
      'shape': 'Shape',
      'coordenadas': 'Coordenadas',
      'raio': 'Raio',
      'linha': 'Linha',
      'importar_area': 'Importar Área'
    };
    return types[tipoArea] || tipoArea;
  };

  const getAreaTypeColor = (tipoArea: string) => {
    const colors: { [key: string]: string } = {
      'faixa_cep': 'bg-blue-100 text-blue-800',
      'shape': 'bg-green-100 text-green-800',
      'coordenadas': 'bg-purple-100 text-purple-800',
      'raio': 'bg-orange-100 text-orange-800',
      'linha': 'bg-red-100 text-red-800',
      'importar_area': 'bg-gray-100 text-gray-800'
    };
    return colors[tipoArea] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6>
      <div className="mb-6>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Novo Agrupamento</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure um novo agrupamento de áreas geográficas</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6>
          {/* Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2>
                <Users className="h-5 w-5" />
                Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4>
              <div className="flex items-center justify-between>
                <div className="space-y-0.5>
                  <label htmlFor="ativo" className="text-sm font-medium">Status</label>
                  <div className="text-sm text-muted-foreground>
                    Agrupamento ativo no sistema
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Agrupamento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Região Metropolitana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigoIntegracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Integração</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: AGRUP_METRO_001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o agrupamento de áreas..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Seleção de Áreas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2>
                <Grid3X3 className="h-5 w-5" />
                Seleção de Áreas
                {selectedAreas.length > 0 && (
                  <Badge variant="secondary" className="ml-2>
                    {selectedAreas.length} selecionada{selectedAreas.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4>
              {/* Busca */}
              <div className="relative>
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder='[TRANSLATION_NEEDED]'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Lista de áreas disponíveis */}
              <ScrollArea className="h-64 border rounded-md p-4>
                {isLoadingAreas ? (
                  <div className="flex items-center justify-center h-32>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredAreas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center>
                    <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground>
                      {areasData.length === 0 ? '[TRANSLATION_NEEDED]' : '[TRANSLATION_NEEDED]'}
                    </p>
                    {areasData.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-1>
                        Cadastre áreas primeiro para poder agrupá-las
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2>
                    {filteredAreas.map((area: any) => (
                      <div
                        key={area.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAreas.includes(area.id)
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        "
                        onClick={() => toggleArea(area.id)}
                      >
                        <Checkbox
                          checked={selectedAreas.includes(area.id)}
                          onChange={() => toggleArea(area.id)}
                        />
                        <div className="flex-1 min-w-0>
                          <div className="flex items-center gap-2>
                            <h4 className="text-sm font-medium truncate>
                              {area.nome}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className="text-xs ""
                            >
                              {getAreaTypeLabel(area.tipoArea)}
                            </Badge>
                          </div>
                          {area.descricao && (
                            <p className="text-xs text-muted-foreground truncate mt-1>
                              {area.descricao}
                            </p>
                          )}
                          {area.codigoIntegracao && (
                            <p className="text-xs text-muted-foreground mt-1>
                              Código: {area.codigoIntegracao}
                            </p>
                          )}
                        </div>
                        {area.corMapa && (
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: area.corMapa }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Resumo das áreas selecionadas */}
              {selectedAreas.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg>
                  <h4 className="text-sm font-medium mb-2">Áreas Selecionadas:</h4>
                  <div className="flex flex-wrap gap-2>
                    {selectedAreas.map((areaId) => {
                      const area = areasData.find((a: any) => a.id === areaId);
                      return area ? (
                        <Badge key={areaId} variant="secondary" className="text-xs>
                          {area.nome}
                          <button
                            type="button"
                            onClick={() => toggleArea(areaId)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-4>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Criando..." : '[TRANSLATION_NEEDED]'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
