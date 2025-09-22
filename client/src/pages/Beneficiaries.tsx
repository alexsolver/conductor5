import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  UserCheck,
  Building,
  Phone,
  Mail,
  Users
} from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for beneficiary creation/editing
const beneficiarySchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  birthDate: z.string().optional(),
  rg: z.string().optional(),
  cpfCnpj: z.string().optional(),
  isActive: z.boolean().default(true),
  customerCode: z.string().optional(),
  customerId: z.string().optional(),
  phone: z.string().optional(),
  cellPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

interface Beneficiary {
  id: string;
  // Frontend naming
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  birthDate?: string;
  rg?: string;
  cpfCnpj?: string;
  isActive?: boolean;
  customerCode?: string;
  customerId?: string;
  phone?: string;
  cellPhone?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  // Backend naming (snake_case)
  first_name?: string;
  last_name?: string;
  full_name?: string;
  birth_date?: string;
  cpf_cnpj?: string;
  is_active?: boolean;
  customer_code?: string;
  customer_id?: string;
  cell_phone?: string;
  contact_person?: string;
  contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Beneficiaries() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [beneficiaryCustomers, setBeneficiaryCustomers] = useState<any[]>([]);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      birthDate: "",
      rg: "",
      cpfCnpj: "",
      isActive: true,
      customerCode: "",
      customerId: "none",
      phone: "",
      cellPhone: "",
      contactPerson: "",
      contactPhone: "",
    },
  });

  // Fetch beneficiaries with pagination and search
  const { data: beneficiariesData, isLoading, refetch } = useQuery({
    queryKey: ["/api/beneficiaries", { page: currentPage, limit: itemsPerPage, search: searchTerm }],
    staleTime: 5000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);

      // Usar endpoint padronizado
      const response = await fetch(`/api/beneficiaries?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch beneficiaries: ${response.status}`);
      }

      const data = await response.json();
      return data;
    },
  });

  // Query for customers
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
    enabled: true,
    staleTime: 5000,
    gcTime: 30000,
  });

  // Query for beneficiary customers (when editing)
  const { data: beneficiaryCustomersData } = useQuery({
    queryKey: ["/api/beneficiaries", editingBeneficiary?.id, "customers"],
    enabled: !!editingBeneficiary?.id,
  });

  // Update beneficiaryCustomers when data changes
  React.useEffect(() => {
    if (beneficiaryCustomersData && 'data' in beneficiaryCustomersData && beneficiaryCustomersData.data) {
      setBeneficiaryCustomers(beneficiaryCustomersData.data);
    }
  }, [beneficiaryCustomersData]);

  // Create beneficiary mutation
  const createBeneficiaryMutation = useMutation({
    mutationFn: async (data: BeneficiaryFormData) => {
      const response = await apiRequest("POST", "/api/beneficiaries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Favorecido criado com sucesso",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"], exact: false });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar favorecido",
        variant: "destructive",
      });
    },
  });

  // Functions for managing many-to-many relationships
  const handleAddCustomer = async (customerId: string) => {
    if (!editingBeneficiary?.id) return;
    
    try {
      const response = await apiRequest("POST", `/api/beneficiaries/${editingBeneficiary.id}/customers`, { customerId });
      
      if (response.ok) {
        // Update local state
        const customer = (customersData as any)?.customers?.find((c: any) => c.id === customerId) || 
                        (customersData as any)?.find((c: any) => c.id === customerId);
        if (customer) {
          setBeneficiaryCustomers(prev => [...prev, customer]);
        }
        
        setShowCustomerSelector(false);
        toast({
          title: "Sucesso",
          description: "Cliente associado com sucesso",
        });
      } else {
        throw new Error('Failed to add customer');
      }
    } catch (error) {
      console.error('[BENEFICIARIES] Error adding customer:', error);
      toast({
        title: "Erro",
        description: "Falha ao associar cliente",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCustomer = async (customerId: string) => {
    if (!editingBeneficiary?.id) return;
    
    try {
      const response = await apiRequest("DELETE", `/api/beneficiaries/${editingBeneficiary.id}/customers/${customerId}`);
      
      if (response.ok) {
        // Update local state
        setBeneficiaryCustomers(prev => prev.filter(c => c.id !== customerId));
        
        toast({
          title: "Sucesso",
          description: "Cliente desassociado com sucesso",
        });
      } else {
        throw new Error('Failed to remove customer');
      }
    } catch (error) {
      console.error('[BENEFICIARIES] Error removing customer:', error);
      toast({
        title: "Erro",
        description: "Falha ao desassociar cliente",
        variant: "destructive",
      });
    }
  };

  // Update beneficiary mutation
  const updateBeneficiaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BeneficiaryFormData }) => {
      const response = await apiRequest("PUT", `/api/beneficiaries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Favorecido atualizado com sucesso",
      });
      setEditingBeneficiary(null);
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"], exact: false });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar favorecido",
        variant: "destructive",
      });
    },
  });

  // Delete beneficiary mutation
  const deleteBeneficiaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/beneficiaries/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Favorecido excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"], exact: false });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir favorecido",
        variant: "destructive",
      });
    },
  });

  // Derived values - handle both nested and direct data structures
  let beneficiaries = [];
  let pagination = { total: 0, totalPages: 0 };
  
  if (beneficiariesData) {
    // Try nested structure first (data.beneficiaries)
    if (beneficiariesData.data?.beneficiaries && Array.isArray(beneficiariesData.data.beneficiaries)) {
      beneficiaries = beneficiariesData.data.beneficiaries;
      pagination = beneficiariesData.data.pagination || pagination;
    }
    // Fallback to direct beneficiaries array
    else if (Array.isArray(beneficiariesData.beneficiaries)) {
      beneficiaries = beneficiariesData.beneficiaries;
      pagination = beneficiariesData.pagination || pagination;
    }
    // Last fallback - treat the whole data as beneficiaries array
    else if (Array.isArray(beneficiariesData)) {
      beneficiaries = beneficiariesData;
    }
  }
  
  console.log('[BENEFICIARIES] Data structure:', { 
    hasData: !!beneficiariesData, 
    beneficiariesCount: beneficiaries.length,
    structure: beneficiariesData ? Object.keys(beneficiariesData) : 'no data'
  });

  // Filter beneficiaries based on search term
  const filteredBeneficiaries = useMemo(() => {
    if (!Array.isArray(beneficiaries)) return [];
    if (!searchTerm) return beneficiaries;
    return beneficiaries.filter((beneficiary: Beneficiary) =>
      (beneficiary.fullName || beneficiary.full_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (beneficiary.customerCode || beneficiary.customer_code)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (beneficiary.firstName || beneficiary.first_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (beneficiary.lastName || beneficiary.last_name)?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [beneficiaries, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil((filteredBeneficiaries?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBeneficiaries = Array.isArray(filteredBeneficiaries) ? filteredBeneficiaries.slice(startIndex, endIndex) : [];

  // Handle form submission
  const handleSubmit = (data: BeneficiaryFormData) => {
    // Convert "none" back to empty string or null for backend
    const processedData = {
      ...data,
      customerId: data.customerId === "none" ? "" : data.customerId
    };
    
    if (editingBeneficiary) {
      updateBeneficiaryMutation.mutate({ id: editingBeneficiary.id, data: processedData });
    } else {
      createBeneficiaryMutation.mutate(processedData);
    }
  };

  // Handle edit
  const handleEdit = (beneficiary: Beneficiary) => {
    console.log('Editing beneficiary:', beneficiary);
    setEditingBeneficiary(beneficiary);
    
    // Map database fields to form fields
    const formData = {
      firstName: beneficiary.first_name || beneficiary.firstName || "",
      lastName: beneficiary.last_name || beneficiary.lastName || "",
      email: beneficiary.email || "",
      birthDate: beneficiary.birth_date || beneficiary.birthDate || "",
      rg: beneficiary.rg || "",
      cpfCnpj: beneficiary.cpf_cnpj || beneficiary.cpfCnpj || "",
      isActive: beneficiary.is_active !== undefined ? beneficiary.is_active : beneficiary.isActive !== undefined ? beneficiary.isActive : true,
      customerCode: beneficiary.customer_code || beneficiary.customerCode || "",
      customerId: beneficiary.customer_id || beneficiary.customerId || "none",
      phone: beneficiary.phone || "",
      cellPhone: beneficiary.cell_phone || beneficiary.cellPhone || "",
      contactPerson: beneficiary.contact_person || beneficiary.contactPerson || "",
      contactPhone: beneficiary.contact_phone || beneficiary.contactPhone || "",
    };
    
    console.log('Form data for editing:', formData);
    form.reset(formData);
    setIsCreateDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este favorecido?")) {
      deleteBeneficiaryMutation.mutate(id);
    }
  };

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  const BeneficiaryForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do favorecido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sobrenome do favorecido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Clientes Associados - Many-to-Many */}
            {editingBeneficiary && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Clientes Associados</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerSelector(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cliente
                  </Button>
                </div>
                
                {/* Lista de clientes associados */}
                <div className="space-y-2">
                  {beneficiaryCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum cliente associado</p>
                  ) : (
                    beneficiaryCustomers.map((customer: any) => (
                      <div key={customer.id} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="text-sm">
                          {customer.first_name} {customer.last_name} - {customer.email}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCustomer(customer.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Seletor de cliente modal */}
                {showCustomerSelector && (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-sm">Selecionar Cliente:</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCustomerSelector(false)}
                      >
                        ✕
                      </Button>
                    </div>
                    <Select onValueChange={handleAddCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {((customersData as any)?.customers || []).filter((customer: any) => 
                          !beneficiaryCustomers.some((fc: any) => fc.id === customer.id)
                        ).map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName || customer.first_name} {customer.lastName || customer.last_name} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Campo cliente único para criação */}
            {!editingBeneficiary && (
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum cliente</SelectItem>
                        {((customersData as any)?.customers || []).map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName || customer.first_name} {customer.lastName || customer.last_name} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Código único" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      O favorecido está ativo no sistema
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cellPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 91234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoa de Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da pessoa de contato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone de Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input placeholder="12.345.678-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpfCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingBeneficiary(null);
              form.reset();
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createBeneficiaryMutation.isPending || updateBeneficiaryMutation.isPending}
          >
            {editingBeneficiary ? "Atualizar" : "Criar"} Favorecido
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Favorecidos</h1>
          <p className="text-muted-foreground">
            Gerencie os favorecidos do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingBeneficiary(null);
                form.reset();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Favorecido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBeneficiary ? "Editar" : "Criar"} Favorecido
              </DialogTitle>
              <DialogDescription>
                {editingBeneficiary
                  ? "Atualize as informações do favorecido."
                  : "Preencha as informações para criar um novo favorecido."}
              </DialogDescription>
            </DialogHeader>
            <BeneficiaryForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {beneficiaries.filter((b: Beneficiary) => (b.isActive ?? b.is_active)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <User className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {beneficiaries.filter((b: Beneficiary) => !b.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Página</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBeneficiaries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar favorecidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Favorecidos ({filteredBeneficiaries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentBeneficiaries.map((beneficiary: Beneficiary) => (
                <TableRow key={beneficiary.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{beneficiary.fullName || beneficiary.full_name}</div>
                      {(beneficiary.contactPerson || beneficiary.contact_person) && (
                        <div className="text-sm text-muted-foreground">
                          Contato: {beneficiary.contactPerson || beneficiary.contact_person}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      {beneficiary.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(beneficiary.phone || beneficiary.cellPhone || beneficiary.cell_phone) ? (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                        <div>
                          {beneficiary.phone && <div>{beneficiary.phone}</div>}
                          {(beneficiary.cellPhone || beneficiary.cell_phone) && (
                            <div className="text-sm text-muted-foreground">
                              {beneficiary.cellPhone || beneficiary.cell_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={(beneficiary.isActive ?? beneficiary.is_active) ? "default" : "secondary"}>
                      {(beneficiary.isActive ?? beneficiary.is_active) ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(beneficiary.customerCode || beneficiary.customer_code) || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(beneficiary.createdAt || beneficiary.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(beneficiary)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(beneficiary.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBeneficiaries.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum favorecido encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Tente ajustar sua busca.' : 'Comece criando seu primeiro favorecido.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredBeneficiaries.length)} de {filteredBeneficiaries.length} favorecidos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}