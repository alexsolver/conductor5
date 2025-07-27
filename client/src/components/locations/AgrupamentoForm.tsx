import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Layers } from "lucide-react";
import { agrupamentoSchema, type NewAgrupamento } from "../../shared/schema-locations-new";

interface AgrupamentoFormProps {
  onSubmit: (data: NewAgrupamento) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AgrupamentoForm({ onSubmit, onCancel, isLoading = false }: AgrupamentoFormProps) {
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

  const handleSubmit = (data: NewAgrupamento) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Novo Agrupamento</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure um novo agrupamento de áreas</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 1. Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
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
                          Agrupamento disponível para uso
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
                        <Input placeholder="Ex: AGR001" {...field} />
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
                        placeholder="Descreva o propósito deste agrupamento..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p>📋 <strong>Áreas Vinculadas:</strong></p>
                <p>• As áreas específicas serão vinculadas após a criação do agrupamento</p>
                <p>• Use a interface de edição para adicionar e remover áreas</p>
                <p>• Cada agrupamento pode conter múltiplas áreas relacionadas</p>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p>✅ <strong>Funcionalidades:</strong></p>
                <p>• Organização hierárquica de áreas geográficas</p>
                <p>• Visualização unificada no mapa</p>
                <p>• Relatórios consolidados por agrupamento</p>
                <p>• Gestão centralizada de múltiplas áreas</p>
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
              className="bg-slate-600 hover:bg-slate-700"
            >
              {isLoading ? "Criando..." : "Criar Agrupamento"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}