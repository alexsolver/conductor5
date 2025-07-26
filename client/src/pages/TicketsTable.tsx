import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { DynamicSelect } from "@/components/DynamicSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { PersonSelector } from "@/components/PersonSelector";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import TicketHierarchyView from "@/components/tickets/TicketHierarchyView";

// Schema for ticket creation/editing - ServiceNow style
const ticketSchema = z.object({
  // Basic Fields
  shortDescription: z.string().min(1, "Short description is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["low", "medium", "high"]).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  state: z.enum(["new", "in_progress", "resolved", "closed", "cancelled"]).optional(),
  
  // Assignment Fields - Enhanced for flexible person referencing
  callerId: z.string().min(1, "Solicitante é obrigatório"),
  callerType: z.enum(["user", "customer"]).default("customer"),
  beneficiaryId: z.string().optional(), // Optional - defaults to callerId
  beneficiaryType: z.enum(["user", "customer"]).optional(),

  assignedToId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),
  
  // Communication Fields
  contactType: z.enum(["email", "phone", "self_service", "chat"]).optional(),
  
  // Business Fields
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  
  // Legacy compatibility
  subject: z.string().min(1, "Subject is required"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  tags: z.array(z.string()).default([]),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced person referencing
  callerId: string;
  callerType: 'user' | 'customer';
  beneficiaryId?: string;
  beneficiaryType?: 'user' | 'customer';
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  // Related persons (populated by join)
  caller?: {
    id: string;
    type: 'user' | 'customer';
    email: string;
    fullName: string;
  };
  beneficiary?: {
    id: string;
    type: 'user' | 'customer';
    email: string;
    fullName: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function TicketsTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch tickets with pagination and filters
  const { data: ticketsData, isLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (priorityFilter !== "all") {
        params.append("priority", priorityFilter);
      }
      
      const response = await apiRequest('GET', `/api/tickets?${params.toString()}`);
      return response.json();
    },
    retry: 3,
  });

  // Legacy customer system removed - using PersonSelector for modern person management

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
    retry: 3,
  });

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination || { total: 0, totalPages: 0 };
  // Legacy customers array removed
  const users = usersData?.users || [];

  // Debug logging
  console.log('TicketsTable - Data:', {
    ticketsError,
    isLoading,
    ticketsCount: tickets.length,
    customersCount: 0, // Legacy system removed
    usersCount: users.length,
    hasToken: !!localStorage.getItem('accessToken')
  });

  // Form setup
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      shortDescription: "",
      description: "",
      category: "",
      subcategory: "",
      priority: "medium",
      impact: "medium",
      urgency: "medium",
      state: "new",
      callerId: "",
      callerType: "customer",
      beneficiaryId: "",
      beneficiaryType: "customer",

      assignedToId: "unassigned",
      assignmentGroup: "",
      location: "",
      contactType: "email",
      businessImpact: "",
      symptoms: "",
      workaround: "",
      subject: "",
      status: "open",
      tags: [],
    },
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const submitData = {
        ...data,
        assignedToId: data.assignedToId === "unassigned" ? undefined : data.assignedToId,
        // Ensure beneficiary defaults to caller if not set
        beneficiaryId: data.beneficiaryId || data.callerId,
        beneficiaryType: data.beneficiaryType || data.callerType,
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



  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const handleDelete = (ticketId: string) => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      // Redirect to the unified page where delete functionality is handled
      console.log("Delete ticket:", ticketId);
    }
  };



  // Reset page when filters change
  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return tickets;
  }, [searchTerm, statusFilter, priorityFilter]);

  const TicketForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description *</FormLabel>
                <FormControl>
                  <Input placeholder="Brief summary of the issue" {...field} />
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
                <FormLabel>Detailed Description *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Detailed description of the problem or request"
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <DynamicSelect
                      fieldName="category"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select category"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <FormControl>
                    <Input placeholder="Specific subcategory" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Priority & Impact */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Priority & Impact</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
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
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact</FormLabel>
                  <FormControl>
                    <DynamicSelect
                      fieldName="impact"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select impact"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency</FormLabel>
                  <FormControl>
                    <DynamicSelect
                      fieldName="urgency"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select urgency"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Assignment */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Assignment</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="callerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solicitante (Caller) *</FormLabel>
                  <FormControl>
                    <PersonSelector
                      value={field.value}
                      onValueChange={(personId, personType) => {
                        field.onChange(personId);
                        form.setValue('callerType', personType);
                        // Auto-set legacy customer field if caller is customer
                        if (personType === 'customer') {
                          form.setValue('customerId', personId);
                        }
                        // Auto-set beneficiary to caller if not already set
                        if (!form.getValues('beneficiaryId')) {
                          form.setValue('beneficiaryId', personId);
                          form.setValue('beneficiaryType', personType);
                        }
                      }}
                      placeholder="Buscar solicitante..."
                      allowedTypes={['user', 'customer']}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beneficiaryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favorecido (Beneficiary)</FormLabel>
                  <FormControl>
                    <PersonSelector
                      value={field.value}
                      onValueChange={(personId, personType) => {
                        field.onChange(personId);
                        form.setValue('beneficiaryType', personType);
                      }}
                      placeholder="Buscar favorecido (opcional)..."
                      allowedTypes={['user', 'customer']}
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
                  <FormLabel>Assign to Agent</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
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

            <FormField
              control={form.control}
              name="assignmentGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="level1">Level 1 Support</SelectItem>
                      <SelectItem value="level2">Level 2 Support</SelectItem>
                      <SelectItem value="level3">Level 3 Support</SelectItem>
                      <SelectItem value="network">Network Team</SelectItem>
                      <SelectItem value="security">Security Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Physical location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="self_service">Self Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Business Impact */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Business Impact & Analysis</h3>
          
          <FormField
            control={form.control}
            name="businessImpact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Impact</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the business impact"
                    className="min-h-[80px]"
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
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptoms</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observed symptoms"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workaround"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workaround</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Temporary solution or workaround"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Legacy Fields (Hidden but mapped) */}
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <input type="hidden" {...field} value={form.watch("shortDescription")} />
          )}
        />



        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={createTicketMutation.isPending}
          >
            {createTicketMutation.isPending 
              ? "Creating..." 
              : "Create Ticket"
            }
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center ml-[20px] mr-[20px]">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track customer support requests</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">Create New Ticket</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  form.reset();
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </DialogHeader>
            <div className="mt-4">
              <TicketForm />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SISTEMA DE VISUALIZAÇÕES DE TICKETS */}
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
        🚨 SELETOR DE VISUALIZAÇÕES - PÁGINA CORRETA /TICKETS 🚨
      </div>

      {/* Seletor de Visualizações Funcionais */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Visualizações de Tickets
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Visualização
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Visualização Ativa:</span>
              <select 
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                defaultValue="default"
              >
                <option value="default">Visualização Padrão</option>
                <option value="my-tickets">Meus Tickets</option>
                <option value="urgent">Tickets Urgentes</option>
                <option value="resolved">Tickets Resolvidos</option>
              </select>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DynamicSelect
              fieldName="status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Filter by status"
              showAllOption={true}
            />
            <DynamicSelect
              fieldName="priority"
              value={priorityFilter}
              onValueChange={setPriorityFilter}
              placeholder="Filter by priority"
              showAllOption={true}
            />
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tickets ({pagination.total})</span>
            <span className="text-sm font-normal text-gray-500">
              Page {currentPage} of {pagination.totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-2">Loading tickets...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      {ticketsError ? (
                        <div>
                          <p>Error loading tickets: {ticketsError.message}</p>
                          <p className="text-sm mt-1">Check console for details</p>
                        </div>
                      ) : (
                        "No tickets found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : tickets.map((ticket: Ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {(ticket as any).number || `#${ticket.id.slice(-8)}`}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {(ticket as any).shortDescription || ticket.subject}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {ticket.customer_first_name && ticket.customer_last_name 
                            ? `${ticket.customer_first_name} ${ticket.customer_last_name}`
                            : ticket.customer?.fullName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticket.customer_email || ticket.customer?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DynamicBadge fieldName="category" value={(ticket as any).category || 'other'}>
                        {(ticket as any).category || 'Other'}
                      </DynamicBadge>
                    </TableCell>
                    <TableCell>
                      <DynamicBadge fieldName="status" value={((ticket as any).state || ticket.status).replace('_', ' ')} />
                    </TableCell>
                    <TableCell>
                      <DynamicBadge fieldName="priority" value={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      <DynamicBadge fieldName="impact" value={(ticket as any).impact || 'medium'}>
                        {(ticket as any).impact || 'Medium'}
                      </DynamicBadge>
                    </TableCell>
                    <TableCell>
                      {ticket.assignedTo ? (
                        <div>
                          <div className="font-medium">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</div>
                          <div className="text-sm text-gray-500">{ticket.assignedTo.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/tickets/${ticket.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleDelete(ticket.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}