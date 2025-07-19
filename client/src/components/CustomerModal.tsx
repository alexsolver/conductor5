import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, User, Globe, Star } from 'lucide-react';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CustomerLocationManager } from './CustomerLocationManager';
import { LocationModal } from './LocationModal';

const customerSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  verified: z.boolean().default(false),
  active: z.boolean().default(true),
  suspended: z.boolean().default(false),
  timezone: z.string().default('America/Sao_Paulo'),
  locale: z.string().default('pt-BR'),
  language: z.string().default('pt'),
  externalId: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
  avatar: z.string().optional(),
  signature: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  onLocationModalOpen: () => void;
}

export function CustomerModal({ isOpen, onClose, customer, onLocationModalOpen }: CustomerModalProps) {
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      company: customer?.company || "",
      verified: customer?.verified || false,
      active: customer?.active ?? true,
      suspended: customer?.suspended || false,
      timezone: customer?.timezone || "America/Sao_Paulo",
      locale: customer?.locale || "pt-BR",
      language: customer?.language || "pt",
      externalId: customer?.externalId || "",
      role: customer?.role || "",
      notes: customer?.notes || "",
      avatar: customer?.avatar || "",
      signature: customer?.signature || "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (customer?.id) {
        return apiRequest(`/api/customers/${customer.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/customers', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Sucesso",
        description: customer?.id ? "Cliente atualizado com sucesso!" : "Cliente criado com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar cliente",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  const handleLocationManagerOpen = () => {
    if (!customer?.id) {
      toast({
        title: "Salve o cliente primeiro",
        description: "É necessário salvar o cliente antes de gerenciar localizações.",
        variant: "destructive"
      });
      return;
    }
    setShowLocationManager(true);
  };

  const handleNewLocationClick = () => {
    setShowLocationManager(false);
    setShowLocationModal(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="customer-modal-description">
          <div id="customer-modal-description" className="sr-only">
            Formulário para criar ou editar informações de cliente
          </div>
          <DialogHeader>
            <DialogTitle>
              {customer?.id ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full h-auto p-1">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full">
                    <TabsTrigger value="basic" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <User className="h-3 w-3 lg:h-4 lg:w-4" />
                      Básico
                    </TabsTrigger>
                    <TabsTrigger value="status" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <Star className="h-3 w-3 lg:h-4 lg:w-4" />
                      Status
                    </TabsTrigger>
                    <TabsTrigger value="localization" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <Globe className="h-3 w-3 lg:h-4 lg:w-4" />
                      Localização
                    </TabsTrigger>
                    <TabsTrigger value="locations" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <MapPin className="h-3 w-3 lg:h-4 lg:w-4" />
                      Locais
                    </TabsTrigger>
                  </div>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input placeholder="Sobrenome do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="status" className="space-y-4">
                  <div className="grid grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="verified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Verificado</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Cliente tem email verificado
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

                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativo</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Cliente está ativo no sistema
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

                    <FormField
                      control={form.control}
                      name="suspended"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Suspenso</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Cliente temporariamente suspenso
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="externalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Externo</FormLabel>
                          <FormControl>
                            <Input placeholder="ID de sistema externo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função</FormLabel>
                          <FormControl>
                            <Input placeholder="Função do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre o cliente..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="localization" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuso Horário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o fuso horário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                              <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                              <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o idioma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pt">Português</SelectItem>
                              <SelectItem value="en">Inglês</SelectItem>
                              <SelectItem value="es">Espanhol</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a localização" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pt-BR">Brasil</SelectItem>
                              <SelectItem value="en-US">Estados Unidos</SelectItem>
                              <SelectItem value="es-ES">Espanha</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="locations" className="space-y-4">
                  <div className="text-center py-8">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Gerenciar Localizações
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Associe este cliente a uma ou mais localizações do sistema.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={handleLocationManagerOpen}
                        disabled={!customer?.id}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Gerenciar Localizações
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNewLocationClick}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Nova Localização
                      </Button>
                    </div>
                    {!customer?.id && (
                      <p className="text-sm text-amber-600 mt-4">
                        💡 Salve o cliente primeiro para gerenciar localizações
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvando...' : customer?.id ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Location Manager Modal */}
      {customer?.id && (
        <CustomerLocationManager
          customerId={customer.id}
          isOpen={showLocationManager}
          onClose={() => setShowLocationManager(false)}
          onAddNewLocation={handleNewLocationClick}
        />
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          // Invalidate locations query to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
        }}
      />
    </>
  );
}