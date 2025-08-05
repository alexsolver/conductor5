import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Mail, Phone, MapPin, Edit, MoreHorizontal, Building } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CustomerModal } from "@/components/CustomerModal";
import { useLocation } from "wouter";

export default function Customers() {
  const [, setLocation] = useLocation();
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customersData, isLoading, error } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const { apiRequest } = await import('../lib/queryClient');
      const response = await apiRequest('GET', '/api/customers');
      const data = await response.json();
      console.log('Customers API Response:', data);
      return data;
    },
    retry: false,
  });

  const customers = customersData?.customers || [];
  const total = customersData?.total || customers.length;

  // Hook para buscar empresas associadas de cada cliente
  const useCustomerCompanies = (customerId: string) => {
    return useQuery({
      queryKey: [`/api/customers/${customerId}/companies`],
      queryFn: async () => {
        const { apiRequest } = await import('../lib/queryClient');
        const response = await apiRequest('GET', `/api/customers/${customerId}/companies`);
        const data = await response.json();

        console.log(`[DEBUG] Customer ${customerId} API response:`, {
          responseStatus: response.status,
          dataStructure: typeof data,
          dataKeys: Object.keys(data || {}),
          fullData: data
        });
        
        // Verificar diferentes estruturas possíveis da resposta
        if (Array.isArray(data)) {
          console.log(`[DEBUG] Customer ${customerId} - returning direct array with ${data.length} items`);
          return data;
        }
        if (data?.success && data?.data && Array.isArray(data.data)) {
          console.log(`[DEBUG] Customer ${customerId} - returning data.data array with ${data.data.length} items`);
          return data.data;
        }
        if (data?.data && Array.isArray(data.data)) {
          console.log(`[DEBUG] Customer ${customerId} - returning data.data array with ${data.data.length} items (no success field)`);
          return data.data;
        }
        if (data?.companies && Array.isArray(data.companies)) {
          console.log(`[DEBUG] Customer ${customerId} - returning data.companies array with ${data.companies.length} items`);
          return data.companies;
        }
        
        console.warn(`[DEBUG] Customer ${customerId} - Invalid companies data structure:`, data);
        return [];
      },
      enabled: !!customerId,
      staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    });
  };

  console.log('Customers data:', { customers, total, error, isLoading });

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleLocationModalOpen = () => {
    setLocation('/locations');
  };

  const getInitials = (customer: any) => {
    const firstName = customer.firstName || customer.first_name;
    const lastName = customer.lastName || customer.last_name;
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    if (customer.email) {
      return customer.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Componente para renderizar empresas associadas
  const CustomerCompanies = ({ customerId }: { customerId: string }) => {
    const { data: companies, isLoading } = useCustomerCompanies(customerId);
    
    if (isLoading) {
      return <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>;
    }
    
    // Filtrar empresa Default inativa para evitar problemas de renderização
    const activeCompanies = Array.isArray(companies) ? companies.filter((company: any) => {
      const companyId = company?.company_id || company?.id;
      const companyStatus = company?.status;
      
      // Filtrar empresa Default se estiver inativa
      if (companyId === '00000000-0000-0000-0000-000000000001') {
        return companyStatus === 'active';
      }
      
      return true;
    }) : [];
    
    console.log(`Customer ${customerId} companies:`, {
      originalCount: companies?.length || 0,
      filteredCount: activeCompanies.length,
      filtered: activeCompanies
    });
    
    // Verificação adicional para garantir que activeCompanies é um array
    if (!activeCompanies || !Array.isArray(activeCompanies) || activeCompanies.length === 0) {
      return <span className="text-gray-400">-</span>;
    }
    
    // Renderizar lista de empresas ativas
    try {
      return (
        <div className="flex flex-col gap-1 max-w-xs">
          {activeCompanies.map((company: any, index: number) => {
            // Verificação defensiva para evitar erros - usar campos corretos da estrutura
            const companyName = company?.company_name || company?.display_name || company?.name || company?.displayName || 'Empresa sem nome';
            const companyId = company?.company_id || company?.id || index;
            
            return (
              <div key={companyId} className="flex items-center text-gray-600 dark:text-gray-400">
                <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="text-sm truncate" title={companyName}>
                  {companyName}
                </span>
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error(`Error rendering companies for customer ${customerId}:`, error, activeCompanies);
      return <span className="text-red-400">Erro ao carregar empresas</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <h4 className="text-lg font-medium mb-2">Erro ao carregar clientes</h4>
              <p className="text-sm text-gray-600">
                {error?.message || 'Não foi possível carregar os dados dos clientes.'}
              </p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your customer database and relationships ({total} registros)</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button 
            onClick={handleAddCustomer}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.length > 0 ? customers.map((customer: any) => (
                <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-500 text-white font-semibold text-sm">
                        {getInitials(customer) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {customer.first_name} {customer.last_name}
                    </div>
                    {customer.customer_type && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.customer_type === 'PJ' ? customer.company_name : `${customer.customer_type}`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.phone || customer.mobilePhone ? (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{customer.phone || customer.mobilePhone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CustomerCompanies customerId={customer.id} />
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        (customer.status || "Ativo") === 'Ativo' 
                          ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" 
                          : "bg-gray-500 text-white"
                      }
                    >
                      {customer.status || "Ativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-3 w-3 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="h-3 w-3 mr-2" />
                          Criar Ticket
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                          <MapPin className="h-3 w-3 mr-2" />
                          Localizações
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">Nenhum cliente encontrado</div>
                      <p className="text-sm">Adicione seu primeiro cliente para começar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedCustomer}
        onLocationModalOpen={handleLocationModalOpen}
      />
    </div>
  );
}