import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Mail, Phone, FileText, Edit, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CustomerModal } from "@/components/CustomerModal";
import { LocationModal } from "@/components/LocationModal";

interface Cliente {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  document?: string;
  created_at: string;
  updated_at: string;
}

export default function Clientes() {
  const { toast } = useToast();
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clientesData, isLoading } = useQuery({
    queryKey: ["/api/customers", { search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const { apiRequest } = await import('../lib/queryClient');
      const response = await apiRequest('GET', `/api/customers?${params}`);
      return response.json();
    },
    retry: false,
  });

  const handleOpenCustomerModal = (cliente?: Cliente) => {
    setEditingCliente(cliente || null);
    setIsCustomerModalOpen(true);
  };

  const handleCloseCustomerModal = () => {
    setEditingCliente(null);
    setIsCustomerModalOpen(false);
  };

  const handleLocationModalOpen = () => {
    setIsLocationModalOpen(true);
  };

  const clientes = clientesData?.customers || [];
  const total = clientesData?.total || clientes.length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
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

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie sua base de clientes ({total} registros)
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            onClick={() => handleOpenCustomerModal()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
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
                <TableHead>Documento</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length > 0 ? clientes.map((cliente: any) => (
                <TableRow key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold text-sm">
                        {getInitials(`${cliente.firstName || ''} ${cliente.lastName || ''}`)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {cliente.firstName} {cliente.lastName}
                    </div>
                    <Badge variant="secondary" className="mt-1">Cliente</Badge>
                  </TableCell>
                  <TableCell>
                    {cliente.email ? (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.phone ? (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{cliente.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.document ? (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <FileText className="h-3 w-3 mr-1" />
                        <span>{cliente.document}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
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
                        <DropdownMenuItem onClick={() => handleOpenCustomerModal(cliente)}>
                          <Edit className="h-3 w-3 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="h-3 w-3 mr-2" />
                          Criar Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
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

      {/* Modais */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        customer={editingCliente}
        onLocationModalOpen={handleLocationModalOpen}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        customerId={editingCliente?.id}
      />
    </div>
  );
}