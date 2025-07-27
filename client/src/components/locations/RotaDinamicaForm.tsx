import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Route, Users, Calendar } from "lucide-react";
import { rotaDinamicaSchema, type NewRotaDinamica } from "../../shared/schema-locations-new";

interface RotaDinamicaFormProps {
  onSubmit: (data: NewRotaDinamica) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RotaDinamicaForm({ onSubmit, onCancel, isLoading = false }: RotaDinamicaFormProps) {
  const form = useForm<NewRotaDinamica>({
    resolver: zodResolver(rotaDinamicaSchema),
    defaultValues: {
      ativo: true,
      nomeRota: "",
      idRota: "",
      clientesVinculados: [],
      regioesAtendidas: [],
      diasSemana: [],
      previsaoDias: undefined
    }
  });

  const handleSubmit = (data: NewRotaDinamica) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nova Rota Dinâmica</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure uma nova rota de atendimento dinâmica</p>
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
                          Rota disponível para planejamento
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
                  name="nomeRota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Rota *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Rota Centro-Norte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idRota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID da Rota *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: RT001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Relacionamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Relacionamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p>📋 <strong>Configurações de Vínculos:</strong></p>
                <p>• Clientes vinculados e regiões atendidas serão configurados após a criação</p>
                <p>• Use a interface de edição para definir relacionamentos específicos</p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Planejamento da Rota */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Planejamento da Rota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="previsaoDias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previsão de Dias</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="Ex: 7 (para rota semanal)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p>📅 <strong>Dias da Semana:</strong></p>
                <p>• A configuração dos dias específicos da semana será definida na edição</p>
                <p>• Configure horários e intervalos para cada dia da rota</p>
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
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Criando..." : "Criar Rota Dinâmica"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}