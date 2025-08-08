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

  // Simplified field access helper
  const getCustomerField = (customer: any, field: string) => {
    if (!customer) return null;
    
    // Direct access to snake_case fields (API standard)
    const fieldMap = {
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      customerType: customer.customer_type || 'PF',
      companyName: customer.company_name || null,
      mobilePhone: customer.mobile_phone || customer.phone || null,
      isActive: customer.is_active ?? true,
      fullName: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email || 'N/A'
    };
    
    return fieldMap[field] ?? customer[field] ?? null;
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
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return (firstName || lastName || customer.email || '?').charAt(0).toUpperCase();
  };

  const CompanyDisplay = ({ companies }: { companies: string | null }) => {
    if (!companies) {
      return <span className="text-gray-400 text-sm">-</span>;
    }

    return (
      <div className="flex items-center text-gray-600 dark:text-gray-400">
        <Building className="h-3 w-3 mr-1 flex-shrink-0" />
        <span className="text-sm truncate max-w-32" title={companies}>
          {companies}
        </span>
      </div>
    );
  };

  const getCustomerDisplayName = (customer: any) => {
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    return `${firstName} ${lastName}`.trim() || customer.email || 'Nome não informado';
  };

  const getCustomerTypeDisplay = (customer: any) => {
    const customerType = customer.customer_type || 'PF';
    if (customerType === 'PJ') {
      const companyName = customer.company_name;
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          🏢 {companyName || 'Pessoa Jurídica'}
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        👤 Pessoa Física
      </div>
    );
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
    // Enhanced error categorization
    const errorType = error?.code || 'UNKNOWN_ERROR';
    const isSchemaError = ['TABLE_NOT_FOUND', 'MISSING_COLUMNS', 'MISSING_COLUMN'].includes(errorType);
    const isPermissionError = errorType === 'PERMISSION_DENIED';
    
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className={`mb-4 ${isPermissionError ? 'text-orange-500' : 'text-red-500'}`}>
              <h4 className="text-lg font-medium mb-2">
                {isSchemaError ? '🗄️ Problema de Esquema de Banco' :
                 isPermissionError ? '🔒 Problema de Permissão' :
                 '❌ Erro ao carregar clientes'}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {error?.message || 'Não foi possível carregar os dados dos clientes.'}
              </p>
              
              {/* Error Code Display */}
              {error?.code && (
                <div className="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-mono mb-2">
                  Código: {error.code}
                </div>
              )}
              
              {/* Technical Details */}
              {error?.details && (
                <details className="text-left bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs mt-3">
                  <summary className="cursor-pointer font-medium">Detalhes técnicos</summary>
                  <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32">{JSON.stringify(error.details, null, 2)}</pre>
                </details>
              )}
              
              {/* Suggestions */}
              {error?.suggestion && (
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  💡 <strong>Sugestão:</strong> {error.suggestion}
                </div>
              )}
              
              {/* Schema-specific help */}
              {isSchemaError && (
                <div className="text-sm text-purple-600 dark:text-purple-400 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  🔧 <strong>Para resolver:</strong> Execute as migrações de banco de dados ou consulte um administrador.
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                🔄 Tentar novamente
              </Button>
              {isSchemaError && (
                <Button 
                  onClick={() => setLocation('/settings')} 
                  variant="secondary"
                >
                  ⚙️ Verificar configurações
                </Button>
              )}
              <Button 
                onClick={() => setLocation('/dashboard')} 
                variant="ghost"
              >
                🏠 Voltar ao Dashboard
              </Button>
            </div>
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
                      {getCustomerDisplayName(customer)}
                    </div>
                    {getCustomerTypeDisplay(customer)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(customer.mobile_phone || customer.phone) ? (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="text-sm">{customer.mobile_phone || customer.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CompanyDisplay companies={customer.associated_companies} />
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