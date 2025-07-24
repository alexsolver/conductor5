
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
import { Plus, ShoppingCart, Edit, Trash2, Eye } from 'lucide-react';

export const PurchaseOrdersManager: React.FC = () => {
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    poNumber: '',
    supplierId: '',
    totalAmount: '',
    status: 'draft',
    priority: 'normal'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ['/api/parts-services/purchase-orders']
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/parts-services/suppliers']
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/purchase-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/purchase-orders'] });
      setIsCreateOrderOpen(false);
      setNewOrder({ poNumber: '', supplierId: '', totalAmount: '', status: 'draft', priority: 'normal' });
      toast({ title: "Ordem de compra criada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar ordem de compra", variant: "destructive" })
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planejamento e Compras</h2>
          <p className="text-muted-foreground">Gerencie ordens de compra e fornecedores</p>
        </div>
        <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem de Compra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Ordem de Compra</DialogTitle>
              <DialogDescription>Adicione uma nova ordem de compra ao sistema</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="po-number" className="text-right">Número PO</Label>
                <Input 
                  id="po-number" 
                  value={newOrder.poNumber} 
                  onChange={(e) => setNewOrder({...newOrder, poNumber: e.target.value})} 
                  className="col-span-3" 
                  placeholder="PO-2025-001"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">Fornecedor</Label>
                <Select value={newOrder.supplierId} onValueChange={(value) => setNewOrder({...newOrder, supplierId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="total-amount" className="text-right">Valor Total</Label>
                <Input 
                  id="total-amount" 
                  type="number" 
                  value={newOrder.totalAmount} 
                  onChange={(e) => setNewOrder({...newOrder, totalAmount: e.target.value})} 
                  className="col-span-3"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Prioridade</Label>
                <Select value={newOrder.priority} onValueChange={(value) => setNewOrder({...newOrder, priority: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createOrderMutation.mutate(newOrder)} 
                disabled={createOrderMutation.isPending || !newOrder.supplierId}
              >
                {createOrderMutation.isPending ? 'Criando...' : 'Criar Ordem'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando ordens de compra...</div>
      ) : purchaseOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma ordem de compra</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira ordem de compra
            </p>
            <Button onClick={() => setIsCreateOrderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Ordem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseOrders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.po_number || order.poNumber}</CardTitle>
                    <CardDescription>Fornecedor: {order.supplier_name || 'N/A'}</CardDescription>
                  </div>
                  <Badge variant={order.status === 'approved' ? 'default' : 
                                 order.status === 'pending' ? 'secondary' : 'outline'}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor Total:</span>
                    <span className="font-medium">R$ {parseFloat(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Prioridade:</span>
                    <Badge variant="outline" className="text-xs">
                      {order.priority || 'Normal'}
                    </Badge>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button size="sm" variant="outline" title="Visualizar">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" title="Editar">
                      <Edit className="h-3 w-3" />
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
