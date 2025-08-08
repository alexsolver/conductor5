
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Mail, Phone, MapPin, Edit, MoreHorizontal, Building, Download, Upload, Filter, X, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CustomerModal } from "@/components/CustomerModal";
import { useLocation } from "wouter";
import { renderAddressSafely, formatCompanyDisplay, getFieldSafely, formatCustomerName } from "@/utils/addressFormatter";

// Componente otimizado para exibição de empresas
const CompanyDisplay = React.memo(({ companies, customerName }: { companies: any; customerName: string }) => {
  const processCompanies = () => {
    // Verifica se companies é válido
    if (!companies || 
        companies === 'undefined' || 
        companies === 'null' || 
        companies === '' ||
        companies === null ||
        companies === undefined) {
      return [];
    }

    let companiesList: string[] = [];
    
    try {
      if (typeof companies === 'string') {
        // Tenta fazer parse caso seja JSON string
        try {
          const parsed = JSON.parse(companies);
          if (Array.isArray(parsed)) {
            companiesList = parsed.filter(Boolean);
          } else {
            companiesList = companies.split(',').map(c => c.trim()).filter(Boolean);
          }
        } catch {
          companiesList = companies.split(',').map(c => c.trim()).filter(Boolean);
        }
      } else if (Array.isArray(companies)) {
        companiesList = companies.filter(Boolean);
      } else if (typeof companies === 'object' && companies !== null) {
        // Se for um objeto, tenta extrair propriedades relevantes
        const possibleNames = [companies.name, companies.display_name, companies.company_name].filter(Boolean);
        companiesList = possibleNames;
      }
    } catch (error) {
      console.warn(`[CompanyDisplay] Error processing companies for ${customerName}:`, error);
      return [];
    }

    return companiesList;
  };

  const companiesList = processCompanies();

  if (companiesList.length === 0) {
    return (
      <div className="flex items-center text-gray-400 dark:text-gray-500">
        <Building className="h-3 w-3 mr-1 opacity-50" />
        <span className="text-sm italic">Nenhuma empresa</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-gray-700 dark:text-gray-300">
      <Building className="h-3 w-3 mr-1 text-blue-500 flex-shrink-0" />
      <div className="flex flex-col">
        <span 
          className="text-sm font-medium truncate max-w-[200px]" 
          title={companiesList.join(', ')}
        >
          {companiesList.length === 1 ? 
            companiesList[0] : 
            `${companiesList[0]} ${companiesList.length > 1 ? `+${companiesList.length - 1}` : ''}`
          }
        </span>
        {companiesList.length > 1 && (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {companiesList.length} empresas
          </span>
        )}
      </div>
    </div>
  );
});

// Componente para linha da tabela otimizada
const CustomerTableRow = React.memo(({ 
  customer, 
  index, 
  onEdit 
}: { 
  customer: any; 
  index: number; 
  onEdit: (customer: any) => void;
}) => {
  const getInitials = useCallback((customer: any) => {
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
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    if (name) return name.charAt(0).toUpperCase();
    if (customer.email) return customer.email.charAt(0).toUpperCase();
    return "?";
  }, []);

  const getCustomerField = useCallback((customer: any, field: string) => {
    if (!customer || typeof customer !== 'object') return null;
    
    const variations: Record<string, string[]> = {
      firstName: ['first_name', 'firstName'],
      lastName: ['last_name', 'lastName'],  
      customerType: ['customer_type', 'customerType'],
      companyName: ['company_name', 'companyName'],
      mobilePhone: ['mobile_phone', 'mobilePhone'],
      phone: ['phone', 'mobile_phone', 'mobilePhone'],
    };
    
    const fieldVariations = variations[field] || [field];
    for (const variant of fieldVariations) {
      const value = customer[variant];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    
    return field === 'customerType' ? 'PF' : null;
  }, []);

  const customerType = getCustomerField(customer, 'customerType');
  const phone = getCustomerField(customer, 'phone') || customer.phone || customer.mobile_phone || customer.mobilePhone;

  return (
    <TableRow 
      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
      }`}
    >
      <TableCell>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
            {getInitials(customer)}
          </AvatarFallback>
        </Avatar>
      </TableCell>
      
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatCustomerName(customer)}
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {customerType === 'PJ' ? (
              <>
                <Building className="h-3 w-3 mr-1" />
                <span>{getCustomerField(customer, 'companyName') || 'Pessoa Jurídica'}</span>
              </>
            ) : (
              <>
                <Users className="h-3 w-3 mr-1" />
                <span>Pessoa Física</span>
              </>
            )}
          </div>
          
          {/* Mobile-only compact info */}
          <div className="sm:hidden space-y-1">
            {customer.email && (
              <div className="flex items-center text-xs text-gray-500">
                <Mail className="h-3 w-3 mr-1" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center text-xs text-gray-500">
                <Phone className="h-3 w-3 mr-1" />
                <span>{String(phone)}</span>
              </div>
            )}
          </div>
        </div>
      </TableCell>
      
      <TableCell className="hidden sm:table-cell">
        {customer.email ? (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Mail className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[180px]">{customer.email}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      
      <TableCell className="hidden md:table-cell">
        {phone ? (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Phone className="h-3 w-3 mr-1" />
            <span>{String(phone)}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      
      <TableCell className="hidden lg:table-cell">
        <CompanyDisplay 
          companies={customer.associated_companies} 
          customerName={formatCustomerName(customer)}
        />
      </TableCell>
      
      <TableCell>
        <Badge 
          className={
            (customer.status || "active") === 'active' 
              ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800" 
              : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300"
          }
        >
          {customer.status === 'active' ? 'Ativo' :
           customer.status === 'inactive' ? 'Inativo' :
           'Ativo'}
        </Badge>
      </TableCell>
      
      <TableCell className="hidden xl:table-cell">
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
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              <Edit className="h-3 w-3 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Plus className="h-3 w-3 mr-2" />
              Criar Ticket
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MapPin className="h-3 w-3 mr-2" />
              Localizações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export default function Customers() {
  const [, setLocation] = useLocation();
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Debounce optimizado
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Query otimizada
  const { data: customersData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      try {
        const { apiRequest } = await import('../lib/queryClient');
        const response = await apiRequest('GET', '/api/customers');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Customers API Response:', data);
        return data;
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error?.message?.includes('500')) return false;
      return failureCount < 2;
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
  });

  const allCustomers = customersData?.customers || [];
  
  // Filtros otimizados com useMemo
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      // Filtro de busca
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const fullName = formatCustomerName(customer).toLowerCase();
        const email = customer.email?.toLowerCase() || '';
        const phone = (customer.phone || customer.mobile_phone || '').toLowerCase();
        
        const associatedCompanies = customer.associated_companies || '';
        const associatedCompaniesText = typeof associatedCompanies === 'string' ? 
          associatedCompanies.toLowerCase() : 
          (Array.isArray(associatedCompanies) ? associatedCompanies.join(' ').toLowerCase() : '');
        
        const matchesSearch = fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               phone.includes(searchLower) ||
               associatedCompaniesText.includes(searchLower);
               
        if (!matchesSearch) return false;
      }
      
      // Filtro de tipo
      if (customerTypeFilter !== 'all') {
        const customerType = customer.customer_type || customer.customerType || 'PF';
        if (customerType !== customerTypeFilter) return false;
      }
      
      // Filtro de status
      if (statusFilter !== 'all') {
        const status = customer.status || 'active';
        if (status !== statusFilter) return false;
      }
      
      return true;
    });
  }, [allCustomers, debouncedSearchTerm, customerTypeFilter, statusFilter]);

  // Handlers otimizados
  const handleAddCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setIsCustomerModalOpen(true);
  }, []);

  const handleEditCustomer = useCallback((customer: any) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
  }, []);

  const handleExportCustomers = useCallback(() => {
    if (!filteredCustomers || filteredCustomers.length === 0) return;

    const csvData = filteredCustomers.map(customer => ({
      'Nome': formatCustomerName(customer),
      'Email': customer.email || '',
      'Telefone': customer.phone || customer.mobile_phone || '',
      'Tipo': (customer.customer_type || customer.customerType) === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física',
      'Status': customer.status === 'active' ? 'Ativo' : 'Inativo',
      'Empresas': typeof customer.associated_companies === 'string' ? 
        customer.associated_companies : 
        (Array.isArray(customer.associated_companies) ? customer.associated_companies.join(', ') : ''),
      'Criado em': new Date(customer.created_at).toLocaleDateString('pt-BR')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredCustomers]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCustomerTypeFilter('all');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = searchTerm || customerTypeFilter !== 'all' || statusFilter !== 'all';

  // Loading state melhorado
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-64 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>
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

  // Error state melhorado
  if (error) {
    const isServerError = error?.message?.includes('500');
    const isCriticalError = error?.message?.includes('sql is not defined');
    
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className={`mb-4 ${isServerError ? 'text-red-600' : 'text-orange-500'}`}>
              <h4 className="text-lg font-medium mb-2">
                {isServerError ? '🚨 Erro do Servidor' : '⚠️ Erro ao carregar clientes'}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {isCriticalError 
                  ? 'Erro crítico no backend: problema na consulta SQL das empresas associadas.'
                  : error?.message || 'Não foi possível carregar os dados dos clientes.'
                }
              </p>
              {isServerError && (
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs text-left">
                  <strong>Detalhes técnicos:</strong> {error?.message}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                disabled={isServerError && isCriticalError}
              >
                🔄 Tentar novamente
              </Button>
              <Button onClick={() => setLocation('/dashboard')} variant="ghost">
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
      {/* Header otimizado */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie sua base de clientes e relacionamentos
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredCustomers.length} de {allCustomers.length} clientes
              </Badge>
              {hasActiveFilters && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Filtros ativos
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleExportCustomers}
            disabled={isLoading || filteredCustomers?.length === 0}
            variant="outline"
            className="border-gray-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button 
            onClick={handleAddCustomer}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cliente
          </Button>
        </div>
      </div>

      {/* Filtros otimizados */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca principal */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email, telefone ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Toggle filtros */}
            <Button
              variant="outline"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>

            {/* Filtros desktop */}
            <div className="hidden lg:flex gap-2">
              <select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px]"
              >
                <option value="all">Todos os tipos</option>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px]"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Filtros mobile */}
          {filtersVisible && (
            <div className="lg:hidden pt-4 border-t space-y-2">
              <select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Todos os tipos</option>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Tabela otimizada */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Cliente</TableHead>
                  <TableHead className="min-w-[200px] hidden sm:table-cell font-semibold">Email</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell font-semibold">Telefone</TableHead>
                  <TableHead className="min-w-[180px] hidden lg:table-cell font-semibold">Empresas</TableHead>
                  <TableHead className="min-w-[80px] font-semibold">Status</TableHead>
                  <TableHead className="min-w-[100px] hidden xl:table-cell font-semibold">Criado em</TableHead>
                  <TableHead className="w-24 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer: any, index: number) => (
                    <CustomerTableRow
                      key={customer.id}
                      customer={customer}
                      index={index}
                      onEdit={handleEditCustomer}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="text-gray-500 space-y-2">
                        <div className="text-lg font-medium">
                          {hasActiveFilters ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                        </div>
                        <p className="text-sm">
                          {hasActiveFilters 
                            ? 'Tente ajustar os filtros de busca.' 
                            : 'Adicione seu primeiro cliente para começar.'
                          }
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            Limpar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedCustomer}
        onLocationModalOpen={() => setLocation('/locations')}
      />
    </div>
  );
}
