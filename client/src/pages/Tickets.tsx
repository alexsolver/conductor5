import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocalization } from "@/hooks/useLocalization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Filter } from "lucide-react";
import { DynamicSelect } from "@/components/DynamicSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { TicketViewSelector } from "@/components/TicketViewSelector";

// Schema for ticket creation
const createTicketSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  companyId: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

export default function Tickets() {
  const { t } = useTranslation();
  const { formatDate } = useLocalization();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentViewId, setCurrentViewId] = useState<string | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/tickets"],
    retry: false,
  });

  // Fetch customers for the dropdown
  const { data: customersData } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });

  // Fetch companies for filtering
  const { data: companiesData } = useQuery({
    queryKey: ["/api/customers/companies"],
    retry: false,
  });

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
    retry: false,
  });

  const customers = (customersData as any)?.customers || [];
  const companies = Array.isArray(companiesData) ? companiesData : [];
  const users = (usersData as any)?.users || [];

  // Form setup
  const form = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      customerId: "",
      companyId: "",
      subject: "",
      description: "",
      priority: "medium",
      assignedToId: "unassigned",
      tags: [],
    },
  });

  // Watch for company selection to filter customers
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // Filter customers based on selected company
  useEffect(() => {
    if (!selectedCompanyId || !customers.length) {
      setFilteredCustomers(customers);
      return;
    }

    // Fetch customers for the selected company
    const fetchCustomersForCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${selectedCompanyId}/customers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setFilteredCustomers(data.customers || []);
        } else {
          // Fallback: filter existing customers if API doesn't exist
          setFilteredCustomers(customers);
        }
      } catch (error) {
        console.error('Error fetching customers for company:', error);
        setFilteredCustomers(customers);
      }
    };

    fetchCustomersForCompany();
  }, [selectedCompanyId, customers]);

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketFormData) => {
      const submitData = {
        ...data,
        assignedToId: data.assignedToId === "unassigned" ? undefined : data.assignedToId
      };
      const response = await apiRequest("POST", "/api/tickets", submitData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTicketFormData) => {
    const submitData = {
      ...data,
      companyId: selectedCompanyId || undefined
    };
    createTicketMutation.mutate(submitData);
  };

  // Função para trocar visualização ativa
  const handleViewChange = (viewId: string) => {
    setCurrentViewId(viewId);
    console.log('Visualização alterada para:', viewId);
    // Aqui podemos adicionar lógica para aplicar filtros/colunas da visualização
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
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

  // Log para debug
  console.log('🚀 Tickets component is rendering...', { currentViewId, tickets });

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track customer support requests</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Ticket</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Company Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        // Reset customer selection when company changes
                        form.setValue("customerId", "");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Todas as empresas</option>
                      {companies.map((company: any) => (
                        <option key={company.id} value={company.id}>
                          {company.company_name || company.name}
                        </option>
                      ))}
                    </select>
                  </div>

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
                            {filteredCustomers.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.fullName || `${customer.first_name} ${customer.last_name}`} ({customer.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ticket subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the issue or request"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="priority"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select priority"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignedToId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign to</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select agent (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {users.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* COMPONENTE TESTE MÁXIMA VISIBILIDADE */}
      <div 
        style={{
          backgroundColor: '#ff0000',
          color: '#ffffff',
          padding: '30px',
          margin: '20px 0',
          border: '5px solid #000000',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 9999,
          position: 'relative'
        }}
      >
        🚨 TESTE DE VISIBILIDADE MÁXIMA - SELETOR DE VISUALIZAÇÕES 🚨
      </div>

      {/* Filtros básicos atuais */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filtros de Tickets</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Visualização:</span>
            <select 
              value={currentViewId || "default"} 
              onChange={(e) => handleViewChange(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="default">Visualização Padrão</option>
              <option value="my-tickets">Meus Tickets</option>
              <option value="urgent">Tickets Urgentes</option>
              <option value="resolved">Tickets Resolvidos</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
            Nova Visualização
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {(tickets as any)?.tickets?.map((ticket: any) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      #{ticket.id} - {ticket.subject}
                    </h3>
                    <DynamicBadge fieldName="priority" value={ticket.priority}>{ticket.priority}</DynamicBadge>
                    <DynamicBadge fieldName="status" value={ticket.status.replace('_', ' ')}>{ticket.status.replace('_', ' ')}</DynamicBadge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {ticket.description?.substring(0, 150)}...
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Customer: {ticket.customer?.firstName} {ticket.customer?.lastName}</span>
                    <span>•</span>
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    {ticket.assignedTo && (
                      <>
                        <span>•</span>
                        <span>Assigned to: {ticket.assignedTo.firstName}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">No tickets found</div>
                <p className="text-sm">Create your first support ticket to get started.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}