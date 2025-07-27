import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Map, Palette } from "lucide-react";
import { areaSchema, type NewArea } from "@/../../shared/schema-locations-new";

interface AreaFormProps {
  onSubmit: (data: NewArea) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AreaForm({ onSubmit, onCancel, isLoading = false }: AreaFormProps) {
  const form = useForm<NewArea>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      ativo: true,
      nome: "",
      descricao: "",
      codigoIntegracao: "",
      tipoArea: "administrativa",
      corMapa: "#3B82F6",
      dadosGeograficos: {}
    }
  });

  const handleSubmit = (data: NewArea) => {
    onSubmit(data);
  };

  const tiposArea = [
    { value: "administrativa", label: "Administrativa" },
    { value: "comercial", label: "Comercial" },
    { value: "industrial", label: "Industrial" },
    { value: "residencial", label: "Residencial" },
    { value: "rural", label: "Rural" },
    { value: "especial", label: "Especial" }
  ];

  const coresPredefinidas = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", 
    "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nova Área</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure uma nova área geográfica</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 1. Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status Ativo</FormLabel>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Área disponível para uso
                        </div>
                      </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Área *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Área Central" {...field} />
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
                        <Input placeholder="Ex: AREA001" {...field} />
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
                        placeholder="Descreva as características desta área..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 2. Classificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Classificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Área *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposArea.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="corMapa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor no Mapa</FormLabel>
                      <div className="space-y-2">
                        <FormControl>
                          <Input 
                            type="color"
                            {...field}
                            className="h-10 w-full"
                          />
                        </FormControl>
                        <div className="flex flex-wrap gap-1">
                          {coresPredefinidas.map((cor) => (
                            <button
                              key={cor}
                              type="button"
                              className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                              style={{ backgroundColor: cor }}
                              onClick={() => field.onChange(cor)}
                            />
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p>🗺️ <strong>Dados Geográficos:</strong></p>
                <p>• Os dados geográficos (coordenadas, polígonos) serão configurados após a criação</p>
                <p>• Suporte para importação de arquivos KML e GeoJSON</p>
                <p>• Definição manual de coordenadas e formas geométricas</p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? "Criando..." : "Criar Área"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}