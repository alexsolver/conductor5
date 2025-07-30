
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
import { Search, Users, Building2, AlertCircle, CheckCircle2, Check, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customerType: 'PF' | 'PJ';
  companyName?: string;
  status: string;
  isAssociated?: boolean;
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
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all customers with association status
  useEffect(() => {
    if (isOpen && company) {
      fetchAllCustomers();
    }
  }, [isOpen, company]);

  const fetchAllCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      if (!company?.id) {
        throw new Error('ID da empresa não encontrado');
      }

      console.log('Fetching all customers and association status for company:', company.id);

      // Fetch all customers and associated customers simultaneously
      const [allCustomersResponse, associatedCustomersResponse] = await Promise.all([
        fetch('/api/customers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/customers/companies/${company.id}/associated`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      const allCustomersData = await allCustomersResponse.json();
      const associatedCustomersData = await associatedCustomersResponse.json();

      console.log('All customers response:', allCustomersData);
      console.log('Associated customers response:', associatedCustomersData);

      if (!allCustomersResponse.ok || !allCustomersData.success) {
        throw new Error(allCustomersData.message || `HTTP ${allCustomersResponse.status}: Failed to fetch customers`);
      }

      if (!associatedCustomersResponse.ok || !associatedCustomersData.success) {
        throw new Error(associatedCustomersData.message || `HTTP ${associatedCustomersResponse.status}: Failed to fetch associated customers`);
      }

      // Get list of associated customer IDs
      const associatedIds = new Set(
        (associatedCustomersData.data || []).map((customer: any) => customer.id)
      );

      // Add association status to all customers
      const customersWithStatus = (allCustomersData.customers || allCustomersData.data || []).map((customer: any) => ({
        ...customer,
        isAssociated: associatedIds.has(customer.id)
      }));

      console.log('Customers with association status:', customersWithStatus);
      setCustomers(customersWithStatus);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setError(error.message || 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerToggle = (customerId: string, isAssociated: boolean) => {
    // Only allow selection of customers who are not already associated
    if (isAssociated) {
      return;
    }
    
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    const filteredCustomers = getFilteredCustomers();
    // Only include customers that are not already associated
    const availableCustomers = filteredCustomers.filter(customer => !customer.isAssociated);
    const allAvailableSelected = availableCustomers.every(customer => 
      selectedCustomerIds.includes(customer.id)
    );

    if (allAvailableSelected) {
      // Deselect all available filtered customers
      const availableIds = availableCustomers.map(c => c.id);
      setSelectedCustomerIds(prev => prev.filter(id => !availableIds.includes(id)));
    } else {
      // Select all available filtered customers
      const newSelections = availableCustomers
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
      const token = localStorage.getItem('accessToken');
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process customers sequentially to avoid overwhelming the server
      for (const customerId of selectedCustomerIds) {
        try {
          const response = await fetch(`/api/customers/${customerId}/companies`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyId: company?.id,
              role: 'member',
              isPrimary,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || `HTTP ${response.status}`);
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`Cliente ${customerId}: ${error.message}`);
          console.warn(`Failed to associate customer ${customerId}:`, error);
        }

        // Small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Prepare result summary
      if (successCount > 0 && errorCount === 0) {
        setSuccess(`${successCount} clientes associados com sucesso!`);
      } else if (successCount > 0 && errorCount > 0) {
        setSuccess(`${successCount} clientes associados com sucesso. ${errorCount} falharam.`);
        if (errors.length > 0) {
          console.warn('Association errors:', errors);
        }
      } else {
        throw new Error(`Falha ao associar todos os clientes. Erros: ${errors.join('; ')}`);
      }

      // Create a summary data structure for backward compatibility
      const data = {
        success: true,
        data: {
          associatedCustomers: successCount,
          skippedExisting: errorCount,
          totalRequested: selectedCustomerIds.length
        }
      };

      console.log('Association completed:', data);
      
      // Reset form
      setSelectedCustomerIds([]);
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
    setIsPrimary(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const filteredCustomers = getFilteredCustomers();
  const availableCustomers = filteredCustomers.filter(customer => !customer.isAssociated);
  const allAvailableSelected = availableCustomers.length > 0 && 
    availableCustomers.every(customer => selectedCustomerIds.includes(customer.id));

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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked === true)}
              />
              <Label htmlFor="isPrimary">Empresa principal</Label>
            </div>
          </div>

          {/* Customer selection */}
          <div className="border rounded-lg">
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={allAvailableSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium">
                  Selecionar todos disponíveis ({availableCustomers.length} de {filteredCustomers.length})
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
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          customer.isAssociated 
                            ? 'bg-green-50 border-green-200 cursor-not-allowed opacity-75' 
                            : isSelected 
                              ? 'bg-blue-50 border-blue-200 cursor-pointer'
                              : 'hover:bg-gray-50 border-gray-200 cursor-pointer'
                        }`}
                        onClick={() => handleCustomerToggle(customer.id, customer.isAssociated || false)}
                      >
                        {customer.isAssociated ? (
                          <div className="flex items-center justify-center w-4 h-4 rounded bg-green-500 text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}} // Controlled by parent div click
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm truncate ${
                              customer.isAssociated ? 'text-green-700' : ''
                            }`}>
                              {displayName || customer.email}
                            </p>
                            
                            {customer.isAssociated && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Associado
                              </Badge>
                            )}
                            
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
                          <p className={`text-xs truncate ${
                            customer.isAssociated ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {customer.email}
                          </p>
                          {customer.isAssociated && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Cliente já está associado à empresa
                            </p>
                          )}
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
