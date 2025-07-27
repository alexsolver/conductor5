import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Route } from "lucide-react";
import { rotaTrechoSchema, type NewRotaTrecho } from "@/../../shared/schema-locations-new";

interface RotaTrechoFormProps {
  onSubmit: (data: NewRotaTrecho) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RotaTrechoForm({ onSubmit, onCancel, isLoading = false }: RotaTrechoFormProps) {
  const form = useForm<NewRotaTrecho>({
    resolver: zodResolver(rotaTrechoSchema),
    defaultValues: {
      ativo: true,
      idRota: ""
    }
  });

  const handleSubmit = (data: NewRotaTrecho) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nova Rota de Trecho</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure uma nova rota baseada em trechos</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 1. Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
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
                          Rota de trecho disponível para uso
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

              <FormField
                control={form.control}
                name="idRota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID da Rota *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: RT_TRECHO_001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 2. Definição do Trecho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Definição do Trecho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p>📋 <strong>Configuração de Trechos:</strong></p>
                <p>• Os trechos específicos serão vinculados após a criação da rota</p>
                <p>• Use a interface de edição para adicionar e ordenar os trechos</p>
                <p>• Cada rota pode conter múltiplos trechos em sequência</p>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p>✅ <strong>Funcionalidades Disponíveis:</strong></p>
                <p>• Ordenação de trechos por sequência de execução</p>
                <p>• Cálculo automático de distâncias e tempos</p>
                <p>• Validação de conectividade entre trechos</p>
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
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Criando..." : "Criar Rota de Trecho"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}