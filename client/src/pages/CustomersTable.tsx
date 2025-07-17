import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight, User, Building, Shield, Globe, Settings, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerLocationManager } from "@/components/CustomerLocationManager";
import { LocationModal } from "@/components/LocationModal";

// Schema for customer creation/editing
const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Status fields
  verified: z.boolean().default(false),
  active: z.boolean().default(true),
  suspended: z.boolean().default(false),
  

  
  // Additional fields
  externalId: z.string().optional(),
  role: z.string().default("customer"),
  notes: z.string().optional(),
  avatar: z.string().optional(),
  signature: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  tags: string[];
  
  // Status fields
  verified: boolean;
  active: boolean;
  suspended: boolean;
  lastLogin?: string;
  

  
  // Additional fields
  externalId?: string;
  role: string;
  notes?: string;
  avatar?: string;
  signature?: string;
  
  createdAt: string;
  updatedAt: string;
}

export default function CustomersTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Location management states
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedCustomerIdForLocations, setSelectedCustomerIdForLocations] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers with pagination and search
  const { data: customersData, isLoading } = useQuery({
    queryKey: ["/api/customers", { page: currentPage, limit: itemsPerPage, search: searchTerm }],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error(`Customers fetch failed: ${response.status}`, await response.text());
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      
      return response.json();
    },
    retry: 3,
  });

  const customers = customersData?.customers || [];
  const pagination = customersData?.pagination || { total: 0, totalPages: 0 };

  // Form setup
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      tags: [],
      verified: false,
      active: true,
      suspended: false,
      timezone: "UTC",
      locale: "en-US",
      language: "en",
      externalId: "",
      role: "customer",
      notes: "",
      avatar: "",
      signature: "",
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/customers/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await apiRequest("DELETE", `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ ...data, id: editingCustomer.id });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || "",
      company: customer.company || "",
      tags: customer.tags || [],
      verified: customer.verified || false,
      active: customer.active !== undefined ? customer.active : true,
      suspended: customer.suspended || false,
      externalId: customer.externalId || "",
      role: customer.role || "customer",
      notes: customer.notes || "",
      avatar: customer.avatar || "",
      signature: customer.signature || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer? This will also delete all associated tickets.")) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  // Reset page when search changes
  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return customers;
  }, [searchTerm]);

  const CustomerForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full h-auto p-1">
            <div className="grid grid-cols-3 gap-1 w-full">
              <TabsTrigger value="basic" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                <User className="h-3 w-3 lg:h-4 lg:w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
                Status
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                <MapPin className="h-3 w-3 lg:h-4 lg:w-4" />
                Locations
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="verified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Verified</FormLabel>
                      <div className="text-sm text-muted-foreground">Email verified</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <div className="text-sm text-muted-foreground">Account active</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suspended"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Suspended</FormLabel>
                      <div className="text-sm text-muted-foreground">Account suspended</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vip">VIP Customer</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="externalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External ID</FormLabel>
                  <FormControl>
                    <Input placeholder="External system ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Internal notes about this customer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 mt-4">
            <div className="text-center py-8">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Manage Locations
              </h3>
              <p className="text-gray-500 mb-6">
                Associate this customer with one or more locations in the system.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (editingCustomer?.id) {
                      setSelectedCustomerIdForLocations(editingCustomer.id);
                      setIsLocationManagerOpen(true);
                    } else {
                      toast({
                        title: "Save customer first",
                        description: "Please save the customer before managing locations",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Manage Locations
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (editingCustomer?.id) {
                      setSelectedCustomerIdForLocations(editingCustomer.id);
                      setIsLocationModalOpen(true);
                    } else {
                      toast({
                        title: "Save customer first",
                        description: "Please save the customer before adding locations",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Location
                </Button>
              </div>
              <p className="text-sm text-amber-600 mt-4">
                💡 Save the customer first to manage locations
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingCustomer(null);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
          >
            {createCustomerMutation.isPending || updateCustomerMutation.isPending 
              ? (editingCustomer ? "Updating..." : "Creating...") 
              : (editingCustomer ? "Update Customer" : "Create Customer")
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer information and profiles</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customers ({pagination.total})</span>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {(customer.firstName || customer.first_name || 'U').charAt(0)}{(customer.lastName || customer.last_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{customer.fullName || `${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}`.trim() || 'Unnamed Customer'}</div>
                          <div className="text-sm text-gray-500">ID: {customer.id.slice(-8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      {customer.company ? (
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{customer.company}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {customer.verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓ Verified
                          </Badge>
                        )}
                        {customer.suspended ? (
                          <Badge variant="destructive">
                            Suspended
                          </Badge>
                        ) : customer.active ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {customer.role || 'customer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('View customer', customer.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(customer)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(customer.id)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm />
        </DialogContent>
      </Dialog>

      {/* Location Manager Dialog */}
      <CustomerLocationManager
        customerId={selectedCustomerIdForLocations}
        isOpen={isLocationManagerOpen}
        onClose={() => {
          setIsLocationManagerOpen(false);
          setSelectedCustomerIdForLocations('');
        }}
        onAddNewLocation={() => {
          setIsLocationManagerOpen(false);
          setIsLocationModalOpen(true);
        }}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setSelectedCustomerIdForLocations('');
        }}
        onSuccess={() => {
          setIsLocationModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
          if (selectedCustomerIdForLocations) {
            queryClient.invalidateQueries({ 
              queryKey: [`/api/customers/${selectedCustomerIdForLocations}/locations`] 
            });
          }
        }}
      />
    </div>
  );
}