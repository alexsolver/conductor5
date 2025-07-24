
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { 
  Package, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight, 
  Settings, 
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface Movement {
  id: string;
  movement_number: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  movement_subtype?: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  status: string;
  approval_status: string;
  part_title: string;
  part_code: string;
  location_name: string;
  source_location_name?: string;
  destination_location_name?: string;
  created_at: string;
  notes?: string;
}

interface Part {
  id: string;
  title: string;
  internal_code: string;
}

interface Location {
  id: string;
  location_name: string;
  location_code: string;
}

export const StockMovementsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('movements');
  const [filters, setFilters] = useState({
    movementType: '',
    partId: '',
    locationId: '',
    status: ''
  });
  
  // Estados para formulários
  const [entryForm, setEntryForm] = useState({
    part_id: '',
    location_id: '',
    quantity: '',
    unit_cost: '',
    supplier_id: '',
    lot_number: '',
    expiration_date: '',
    notes: ''
  });

  const [exitForm, setExitForm] = useState({
    part_id: '',
    location_id: '',
    quantity: '',
    customer_id: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    part_id: '',
    source_location_id: '',
    destination_location_id: '',
    quantity: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // QUERIES
  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['/api/parts-services/etapa2/movements', filters]
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['/api/parts-services/parts']
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['/api/parts-services/etapa1/stock-locations']
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/parts-services/suppliers']
  });

  // MUTATIONS
  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/etapa2/stock/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao registrar entrada');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa2/movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa1/inventory'] });
      toast({ title: 'Entrada registrada com sucesso!' });
      setEntryForm({
        part_id: '', location_id: '', quantity: '', unit_cost: '',
        supplier_id: '', lot_number: '', expiration_date: '', notes: ''
      });
    }
  });

  const createExitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/etapa2/stock/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao registrar saída');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa2/movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa1/inventory'] });
      toast({ title: 'Saída registrada com sucesso!' });
      setExitForm({
        part_id: '', location_id: '', quantity: '', customer_id: '', notes: ''
      });
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/etapa2/stock/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao registrar transferência');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa2/movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/etapa1/inventory'] });
      toast({ title: 'Transferência registrada com sucesso!' });
      setTransferForm({
        part_id: '', source_location_id: '', destination_location_id: '', quantity: '', notes: ''
      });
    }
  });

  // HANDLERS
  const handleStockEntry = () => {
    if (!entryForm.part_id || !entryForm.location_id || !entryForm.quantity) {
      toast({ 
        title: 'Erro de validação', 
        description: 'Peça, localização e quantidade são obrigatórios',
        variant: 'destructive' 
      });
      return;
    }

    createEntryMutation.mutate({
      ...entryForm,
      quantity: parseInt(entryForm.quantity),
      unit_cost: entryForm.unit_cost ? parseFloat(entryForm.unit_cost) : undefined,
      expiration_date: entryForm.expiration_date || undefined,
      original_quantity: parseInt(entryForm.quantity) // Para criação de lote
    });
  };

  const handleStockExit = () => {
    if (!exitForm.part_id || !exitForm.location_id || !exitForm.quantity) {
      toast({ 
        title: 'Erro de validação', 
        description: 'Peça, localização e quantidade são obrigatórios',
        variant: 'destructive' 
      });
      return;
    }

    createExitMutation.mutate({
      ...exitForm,
      quantity: parseInt(exitForm.quantity)
    });
  };

  const handleStockTransfer = () => {
    if (!transferForm.part_id || !transferForm.source_location_id || !transferForm.destination_location_id || !transferForm.quantity) {
      toast({ 
        title: 'Erro de validação', 
        description: 'Todos os campos são obrigatórios para transferência',
        variant: 'destructive' 
      });
      return;
    }

    if (transferForm.source_location_id === transferForm.destination_location_id) {
      toast({ 
        title: 'Erro de validação', 
        description: 'Local de origem deve ser diferente do destino',
        variant: 'destructive' 
      });
      return;
    }

    createTransferMutation.mutate({
      ...transferForm,
      quantity: parseInt(transferForm.quantity)
    });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'OUT': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'TRANSFER': return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
      default: return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, approvalStatus: string) => {
    if (approvalStatus === 'PENDING') {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
    if (approvalStatus === 'REJECTED') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
    }
    if (status === 'COMPLETED') {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Movimentações de Estoque</h2>
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">Etapa 2 - Sistema Real</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="movements">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="entry">
            <ArrowUp className="h-4 w-4 mr-2" />
            Entrada
          </TabsTrigger>
          <TabsTrigger value="exit">
            <ArrowDown className="h-4 w-4 mr-2" />
            Saída
          </TabsTrigger>
          <TabsTrigger value="transfer">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transferência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.movementType} onValueChange={(value) => setFilters(f => ({ ...f, movementType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de movimentação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="IN">Entrada</SelectItem>
                  <SelectItem value="OUT">Saída</SelectItem>
                  <SelectItem value="TRANSFER">Transferência</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.partId} onValueChange={(value) => setFilters(f => ({ ...f, partId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Peça" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {parts.map((part: Part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.internal_code} - {part.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.locationId} onValueChange={(value) => setFilters(f => ({ ...f, locationId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Localização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {locations.map((location: Location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.location_code} - {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Número</th>
                      <th className="text-left p-4">Tipo</th>
                      <th className="text-left p-4">Peça</th>
                      <th className="text-left p-4">Localização</th>
                      <th className="text-right p-4">Quantidade</th>
                      <th className="text-right p-4">Valor</th>
                      <th className="text-center p-4">Status</th>
                      <th className="text-left p-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingMovements ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8">
                          Carregando movimentações...
                        </td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-muted-foreground">
                          Nenhuma movimentação encontrada
                        </td>
                      </tr>
                    ) : (
                      movements.map((movement: Movement) => (
                        <tr key={movement.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-mono text-xs">{movement.movement_number}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getMovementIcon(movement.movement_type)}
                              <span className="capitalize">{movement.movement_type.toLowerCase()}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{movement.part_code}</div>
                              <div className="text-xs text-muted-foreground">{movement.part_title}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-xs">
                              {movement.movement_type === 'TRANSFER' ? (
                                <>
                                  <div>{movement.source_location_name} →</div>
                                  <div>{movement.destination_location_name}</div>
                                </>
                              ) : (
                                movement.location_name
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono">{movement.quantity}</td>
                          <td className="p-4 text-right font-mono">
                            {movement.total_cost ? formatCurrency(movement.total_cost) : '-'}
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(movement.status, movement.approval_status)}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(movement.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUp className="h-5 w-5 text-green-600" />
                Registrar Entrada de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Peça *</label>
                  <Select value={entryForm.part_id} onValueChange={(value) => setEntryForm(f => ({ ...f, part_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a peça" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part: Part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.internal_code} - {part.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Localização *</label>
                  <Select value={entryForm.location_id} onValueChange={(value) => setEntryForm(f => ({ ...f, location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location: Location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantidade *</label>
                  <Input
                    type="number"
                    value={entryForm.quantity}
                    onChange={(e) => setEntryForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="Ex: 10"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Custo Unitário</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entryForm.unit_cost}
                    onChange={(e) => setEntryForm(f => ({ ...f, unit_cost: e.target.value }))}
                    placeholder="Ex: 25.50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Fornecedor</label>
                  <Select value={entryForm.supplier_id} onValueChange={(value) => setEntryForm(f => ({ ...f, supplier_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_code} - {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Número do Lote</label>
                  <Input
                    value={entryForm.lot_number}
                    onChange={(e) => setEntryForm(f => ({ ...f, lot_number: e.target.value }))}
                    placeholder="Ex: LT2024001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Data de Validade</label>
                  <Input
                    type="date"
                    value={entryForm.expiration_date}
                    onChange={(e) => setEntryForm(f => ({ ...f, expiration_date: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Observações sobre a entrada..."
                  />
                </div>
              </div>

              <Button 
                onClick={handleStockEntry}
                disabled={createEntryMutation.isPending}
                className="w-full"
              >
                {createEntryMutation.isPending ? 'Registrando...' : 'Registrar Entrada'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDown className="h-5 w-5 text-red-600" />
                Registrar Saída de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Peça *</label>
                  <Select value={exitForm.part_id} onValueChange={(value) => setExitForm(f => ({ ...f, part_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a peça" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part: Part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.internal_code} - {part.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Localização *</label>
                  <Select value={exitForm.location_id} onValueChange={(value) => setExitForm(f => ({ ...f, location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location: Location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantidade *</label>
                  <Input
                    type="number"
                    value={exitForm.quantity}
                    onChange={(e) => setExitForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="Ex: 5"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <Input
                    value={exitForm.customer_id}
                    onChange={(e) => setExitForm(f => ({ ...f, customer_id: e.target.value }))}
                    placeholder="ID do cliente"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    value={exitForm.notes}
                    onChange={(e) => setExitForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Observações sobre a saída..."
                  />
                </div>
              </div>

              <Button 
                onClick={handleStockExit}
                disabled={createExitMutation.isPending}
                className="w-full"
              >
                {createExitMutation.isPending ? 'Registrando...' : 'Registrar Saída'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                Registrar Transferência entre Locais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Peça *</label>
                  <Select value={transferForm.part_id} onValueChange={(value) => setTransferForm(f => ({ ...f, part_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a peça" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part: Part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.internal_code} - {part.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantidade *</label>
                  <Input
                    type="number"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="Ex: 3"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Local de Origem *</label>
                  <Select value={transferForm.source_location_id} onValueChange={(value) => setTransferForm(f => ({ ...f, source_location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location: Location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Local de Destino *</label>
                  <Select value={transferForm.destination_location_id} onValueChange={(value) => setTransferForm(f => ({ ...f, destination_location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter((location: Location) => location.id !== transferForm.source_location_id).map((location: Location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Observações sobre a transferência..."
                  />
                </div>
              </div>

              <Button 
                onClick={handleStockTransfer}
                disabled={createTransferMutation.isPending}
                className="w-full"
              >
                {createTransferMutation.isPending ? 'Registrando...' : 'Registrar Transferência'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
