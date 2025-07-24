
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Zap, Settings, Play, Pause, Trash2 } from 'lucide-react';

export const ServiceIntegrationsManager: React.FC = () => {
  const [isCreateIntegrationOpen, setIsCreateIntegrationOpen] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    serviceName: '',
    serviceType: 'API',
    endpointUrl: '',
    authType: 'API_KEY',
    status: 'active'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/parts-services/service-integrations']
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/service-integrations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/service-integrations'] });
      setIsCreateIntegrationOpen(false);
      setNewIntegration({ serviceName: '', serviceType: 'API', endpointUrl: '', authType: 'API_KEY', status: 'active' });
      toast({ title: "Integração criada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar integração", variant: "destructive" })
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integração de Serviços</h2>
          <p className="text-muted-foreground">Conecte com sistemas externos e work orders</p>
        </div>
        <Dialog open={isCreateIntegrationOpen} onOpenChange={setIsCreateIntegrationOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Integração de Serviço</DialogTitle>
              <DialogDescription>Configure uma nova integração externa</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service-name" className="text-right">Nome do Serviço</Label>
                <Input 
                  id="service-name" 
                  value={newIntegration.serviceName} 
                  onChange={(e) => setNewIntegration({...newIntegration, serviceName: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Ex: Sistema ERP"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service-type" className="text-right">Tipo</Label>
                <Select value={newIntegration.serviceType} onValueChange={(value) => setNewIntegration({...newIntegration, serviceType: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="API">API REST</SelectItem>
                    <SelectItem value="WEBHOOK">Webhook</SelectItem>
                    <SelectItem value="DATABASE">Database</SelectItem>
                    <SelectItem value="FILE">Arquivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endpoint-url" className="text-right">URL Endpoint</Label>
                <Input 
                  id="endpoint-url" 
                  value={newIntegration.endpointUrl} 
                  onChange={(e) => setNewIntegration({...newIntegration, endpointUrl: e.target.value})} 
                  className="col-span-3"
                  placeholder="https://api.exemplo.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="auth-type" className="text-right">Autenticação</Label>
                <Select value={newIntegration.authType} onValueChange={(value) => setNewIntegration({...newIntegration, authType: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="API_KEY">API Key</SelectItem>
                    <SelectItem value="OAUTH">OAuth 2.0</SelectItem>
                    <SelectItem value="BASIC">Basic Auth</SelectItem>
                    <SelectItem value="BEARER">Bearer Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createIntegrationMutation.mutate(newIntegration)} 
                disabled={createIntegrationMutation.isPending || !newIntegration.serviceName}
              >
                {createIntegrationMutation.isPending ? 'Criando...' : 'Criar Integração'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando integrações...</div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
            <p className="text-muted-foreground mb-4">
              Configure integrações para conectar com sistemas externos
            </p>
            <Button onClick={() => setIsCreateIntegrationOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Integração
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration: any) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{integration.service_name || integration.serviceName}</CardTitle>
                    <CardDescription>{integration.service_type || integration.serviceType}</CardDescription>
                  </div>
                  <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                    {integration.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Endpoint:</span>
                    <span className="font-medium text-xs truncate max-w-32">
                      {integration.endpoint_url || integration.endpointUrl || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Autenticação:</span>
                    <Badge variant="outline" className="text-xs">
                      {integration.authentication_type || integration.authType}
                    </Badge>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button size="sm" variant="outline" title="Configurar">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" title="Ativar/Pausar">
                      {integration.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" title="Excluir">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
