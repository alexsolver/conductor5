import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone, FileText, Edit } from "lucide-react";
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
    queryKey: ["/api/clientes", { search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/clientes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch clientes');
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

  const clientes = clientesData?.data || [];
  const total = clientesData?.total || 0;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((cliente: Cliente) => (
          <Card key={cliente.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                    {getInitials(`${cliente.first_name} ${cliente.last_name || ''}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {cliente.first_name} {cliente.last_name}
                    </h3>
                    <Badge variant="secondary">Cliente</Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {cliente.email && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    
                    {cliente.phone && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{cliente.phone}</span>
                      </div>
                    )}
                    
                    {cliente.document && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{cliente.document}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Criado em {new Date(cliente.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleOpenCustomerModal(cliente)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Plus className="h-3 w-3 mr-1" />
                      Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {clientes.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <div className="text-lg font-medium mb-2">Nenhum cliente encontrado</div>
                  <p className="text-sm">Adicione seu primeiro cliente para começar.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

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