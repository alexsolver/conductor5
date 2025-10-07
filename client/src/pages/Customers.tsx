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
import { renderAddressSafely, formatCompanyDisplay, getFieldSafely, formatCustomerName } from "@/utils/addressFormatter";

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

  // Enhanced data structure handling for customers
  let customers = [];
  let total = 0;
  
  if (customersData) {
    // Handle direct customers array
    if (Array.isArray(customersData.customers)) {
      customers = customersData.customers;
      total = customersData.total || customers.length;
    }
    // Handle nested data structure
    else if (customersData.data?.customers && Array.isArray(customersData.data.customers)) {
      customers = customersData.data.customers;
      total = customersData.data.total || customers.length;
    }
    // Fallback - treat whole response as customers array
    else if (Array.isArray(customersData)) {
      customers = customersData;
      total = customers.length;
    }
  }
  
  console.log('[CUSTOMERS] Data structure:', { 
    hasData: !!customersData, 
    customersCount: customers.length,
    structure: customersData ? Object.keys(customersData) : 'no data',
    sampleCustomer: customers[0] || 'none'
  });

  // Standardized field access helper with validation and defaults
  const getCustomerField = (customer: any, field: string) => {
    if (!customer || typeof customer !== 'object') {
      console.warn('[CUSTOMERS] Invalid customer object:', customer);
      return null;
    }

    // Handle both camelCase and snake_case variations with proper defaults
    const variations: Record<string, string[]> = {
      firstName: ['first_name', 'firstName'],
      lastName: ['last_name', 'lastName'],
      customerType: ['customer_type', 'customerType'],
      companyName: ['company_name', 'companyName'],
      mobilePhone: ['mobile_phone', 'mobilePhone'],
      zipCode: ['zip_code', 'zipCode'],
      isActive: ['is_active', 'isActive'],
      phone: ['phone', 'mobile_phone', 'mobilePhone'],
      fullName: ['full_name', 'fullName']
    };

    const fieldVariations = variations[field] || [field];
    for (const variant of fieldVariations) {
      const value = customer[variant];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    // Return appropriate defaults
    switch (field) {
      case 'customerType':
        return 'PF';
      case 'isActive':
        return true;
      case 'firstName':
      case 'lastName':
        return '';
      default:
        return null;
    }
  };

  console.log('Customers data:', { customers, total, error, isLoading });

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const normalizeCustomerStatus = (customer: any) => {
    return {
      ...customer,
      status: customer.status === 'active' ? 'Ativo' :
              customer.status === 'inactive' ? 'Inativo' :
              customer.status || 'Ativo'
    };
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(normalizeCustomerStatus(customer));
    setIsCustomerModalOpen(true);
  };

  const handleLocationModalOpen = () => {
    setLocation('/locations');
  };

  const getInitials = (customer: any) => {
    // Use the same consistent field access as formatCustomerName
    const firstName = getFieldSafely(customer, 'firstName') || getFieldSafely(customer, 'first_name');
    const lastName = getFieldSafely(customer, 'lastName') || getFieldSafely(customer, 'last_name');
    const fullName = getFieldSafely(customer, 'fullName') || getFieldSafely(customer, 'full_name');
    const name = getFieldSafely(customer, 'name');

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (fullName && fullName.includes(' ')) {
      const parts = fullName.split(' ');
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (customer.email) {
      return customer.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  // Simplified company display component
  const CompanyDisplay = ({ companies }: { companies: string | null | undefined }) => {
    if (!companies || companies === 'undefined' || companies === 'null') {
      return <span className="text-gray-400">-</span>;
    }

    // Handle object or array companies data
    let displayText = companies;
    if (typeof companies === 'object' && companies !== null) {
      if (Array.isArray(companies)) {
        displayText = companies.filter(Boolean).join(', ') || 'N/A';
      } else {
        const values = Object.values(companies as Record<string, any>).filter(Boolean);
        displayText = values.length > 0 ? values.join(', ') : 'N/A';
      }
    }

    return (
      <div className="flex items-center text-gray-600 dark:text-gray-400">
        <Building className="h-3 w-3 mr-1 flex-shrink-0" />
        <span className="text-sm truncate" title={String(displayText)}>
          {String(displayText)}
        </span>
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
    // Enhanced error categorization with proper typing
    const errorType = (error as any)?.code || 'UNKNOWN_ERROR';
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
              {(error as any)?.code && (
                <div className="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-mono mb-2">
                  Código: {(error as any).code}
                </div>
              )}

              {/* Technical Details */}
              {(error as any)?.details && (
                <details className="text-left bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs mt-3">
                  <summary className="cursor-pointer font-medium">Detalhes técnicos</summary>
                  <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32">{JSON.stringify((error as any).details, null, 2)}</pre>
                </details>
              )}

              {/* Suggestions */}
              {(error as any)?.suggestion && (
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  💡 <strong>Sugestão:</strong> {(error as any).suggestion}
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
                      {formatCustomerName(customer)}
                    </div>
                    {(() => {
                      const customerType = getCustomerField(customer, 'customerType');
                      if (customerType === 'PJ') {
                        const companyName = getCustomerField(customer, 'companyName');
                        return (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            🏢 {companyName || 'Pessoa Jurídica'}
                          </div>
                        );
                      } else if (customerType === 'PF') {
                        return (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            👤 Pessoa Física
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const phone = getCustomerField(customer, 'phone') ||
                                   customer.phone ||
                                   customer.mobile_phone ||
                                   customer.mobilePhone;

                      return phone ? (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{String(phone)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const companies = customer.associated_companies || customer.associatedCompanies;
                      if (!companies || companies === 'null' || companies === 'undefined') {
                        return <span className="text-gray-400">-</span>;
                      }

                      let displayText = companies;
                      if (Array.isArray(companies)) {
                        displayText = companies.filter(Boolean).join(', ');
                      } else if (typeof companies === 'string') {
                        displayText = companies;
                      }

                      return (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="text-sm truncate" title={String(displayText)}>
                            {displayText || '-'}
                          </span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          customer.status === 'Ativo' || customer.status === 'active' || customer.isActive === true
                            ? 'default'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {customer.status === 'Ativo' || customer.status === 'active' || customer.isActive === true
                          ? 'Ativo'
                          : 'Inativo'}
                      </Badge>
                      {(() => {
                        const customerType = getCustomerField(customer, 'customerType');
                        if (customerType) {
                          return (
                            <Badge
                              variant={customerType === 'PJ' ? 'outline' : 'secondary'}
                              className="text-xs"
                            >
                              {customerType}
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
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
                          Locais
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