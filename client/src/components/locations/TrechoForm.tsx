import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { trechoSchema, type NewTrecho } from "../../shared/schema-locations-new";

interface TrechoFormProps {
  onSubmit: (data: NewTrecho) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TrechoForm({ onSubmit, onCancel, isLoading = false }: TrechoFormProps) {
  const form = useForm<NewTrecho>({
    resolver: zodResolver(trechoSchema),
    defaultValues: {
      ativo: true,
      codigoIntegracao: "",
      localAId: "",
      localBId: ""
    }
  });

  const handleSubmit = (data: NewTrecho) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Novo Trecho</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure um novo trecho entre dois locais</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 1. Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Identificação do Trecho
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
                          Trecho disponível para uso em rotas
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
                name="codigoIntegracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Integração</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: TR001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="localAId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local A (Origem) *</FormLabel>
                      <FormControl>
                        <Input placeholder="ID do local de origem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="localBId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local B (Destino) *</FormLabel>
                      <FormControl>
                        <Input placeholder="ID do local de destino" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p>⚠️ <strong>Importante:</strong></p>
                <p>• Os locais A e B devem ser diferentes</p>
                <p>• Certifique-se de que ambos os locais existem no sistema</p>
                <p>• O trecho será bidirecional (A ↔ B)</p>
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
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? "Criando..." : "Criar Trecho"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}