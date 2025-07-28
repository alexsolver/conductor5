
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Users, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customerType: 'PF' | 'PJ';
  companyName?: string;
  status: string;
}

interface Company {
  id: string;
  name: string;
  displayName?: string;
}

interface AssociateMultipleCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSuccess: () => void;
}

const AssociateMultipleCustomersModal: React.FC<AssociateMultipleCustomersModalProps> = ({
  isOpen,
  onClose,
  company,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [role, setRole] = useState('member');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch available customers
  useEffect(() => {
    if (isOpen && company) {
      fetchAvailableCustomers();
    }
  }, [isOpen, company]);

  const fetchAvailableCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      if (!company?.id) {
        throw new Error('ID da empresa não encontrado');
      }

      console.log('Fetching available customers for company:', company.id);

      const response = await fetch(`/api/customers/companies/${company.id}/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Available customers response:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to fetch available customers`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Response indicated failure');
      }

      setCustomers(data.data || []);
    } catch (error: any) {
      console.error('Error fetching available customers:', error);
      setError(error.message || 'Erro ao carregar clientes disponíveis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    const filteredCustomers = getFilteredCustomers();
    const allSelected = filteredCustomers.every(customer => 
      selectedCustomerIds.includes(customer.id)
    );

    if (allSelected) {
      // Deselect all filtered customers
      const filteredIds = filteredCustomers.map(c => c.id);
      setSelectedCustomerIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered customers
      const newSelections = filteredCustomers
        .filter(customer => !selectedCustomerIds.includes(customer.id))
        .map(customer => customer.id);
      setSelectedCustomerIds(prev => [...prev, ...newSelections]);
    }
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      const displayName = customer.customerType === 'PJ' ? customer.companyName : fullName;
      
      return (
        displayName?.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower)
      );
    });
  };

  const handleSubmit = async () => {
    if (selectedCustomerIds.length === 0) {
      setError('Selecione pelo menos um cliente');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/companies/${company?.id}/associate-multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerIds: selectedCustomerIds,
          role,
          isPrimary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to associate customers');
      }

      setSuccess(`${data.data.associatedCustomers} clientes associados com sucesso!`);
      
      // Reset form
      setSelectedCustomerIds([]);
      setRole('member');
      setIsPrimary(false);
      
      // Notify parent component
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Error associating customers:', error);
      setError(error.message || 'Erro ao associar clientes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomerIds([]);
    setSearchTerm('');
    setRole('member');
    setIsPrimary(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const filteredCustomers = getFilteredCustomers();
  const allFilteredSelected = filteredCustomers.length > 0 && 
    filteredCustomers.every(customer => selectedCustomerIds.includes(customer.id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Associar Múltiplos Clientes
          </DialogTitle>
          <DialogDescription>
            Associe múltiplos clientes à empresa{' '}
            <strong>{company?.displayName || company?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Search and filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar clientes por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="contact">Contato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isPrimary"
                  checked={isPrimary}
                  onCheckedChange={setIsPrimary}
                />
                <Label htmlFor="isPrimary">Empresa principal</Label>
              </div>
            </div>
          </div>

          {/* Customer selection */}
          <div className="border rounded-lg">
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium">
                  Selecionar todos ({filteredCustomers.length} clientes)
                </Label>
              </div>
              <Badge variant="outline">
                {selectedCustomerIds.length} selecionados
              </Badge>
            </div>

            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Building2 className="w-12 h-12 mb-2" />
                  <p>Nenhum cliente encontrado</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomerIds.includes(customer.id);
                    const displayName = customer.customerType === 'PJ' 
                      ? customer.companyName 
                      : `${customer.firstName || ''} ${customer.lastName || ''}`.trim();

                    return (
                      <div
                        key={customer.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => handleCustomerToggle(customer.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {}} // Controlled by parent div click
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {displayName || customer.email}
                            </p>
                            <Badge 
                              variant={customer.customerType === 'PJ' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {customer.customerType}
                            </Badge>
                            {customer.status !== 'Ativo' && (
                              <Badge variant="destructive" className="text-xs">
                                {customer.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedCustomerIds.length === 0 || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Associando...
              </div>
            ) : (
              `Associar (${selectedCustomerIds.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssociateMultipleCustomersModal;
