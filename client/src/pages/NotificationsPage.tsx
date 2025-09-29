import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Plus, 
  Filter,
  Eye,
  Settings,
  BarChart3,
  Send,
  RefreshCw,
  Trash2 // Import Trash2 icon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Notification {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
  title: string;
  message: string;
  channels: string[];
  userId: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  scheduledAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  isExpired: boolean;
  canBeSent: boolean;
  requiresEscalation: boolean;
}

interface NotificationStats {
  overview: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    expired: number;
  };
  distribution: {
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  recentActivity: {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
  };
}

// Form schemas
const createNotificationSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  channels: z.array(z.string()).min(1, 'At least one channel is required'),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
  userId: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional()
});

type CreateNotificationForm = z.infer<typeof createNotificationSchema>;

// Severity color mapping
const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  normal: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

// Status color mapping
const statusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('notifications');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    severity: 'all',
    page: 1
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [processingNotifications, setProcessingNotifications] = useState<Set<string>>(new Set());
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const previousNotificationIds = useState<Set<string>>(new Set())[0];

  // Form
  const form = useForm<CreateNotificationForm>({
    resolver: zodResolver(createNotificationSchema),
    defaultValues: {
      severity: 'medium',
      channels: ['in_app'],
      type: 'system_maintenance'
    }
  });

  // Queries
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/schedule-notifications/list', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/schedule-notifications/list');
      const result = await response.json();
      console.log('🔔 [NOTIFICATIONS-PAGE] API response:', result);
      // Reset selection when new data is fetched
      setSelectedNotifications(new Set());
      setSelectAllChecked(false);
      return result;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/notifications/stats'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'X-Tenant-Id': localStorage.getItem('tenant_id') || '',
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateNotificationForm) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'X-Tenant-Id': localStorage.getItem('tenant_id') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Notification created successfully'
      });
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/list'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create notification',
        variant: 'destructive'
      });
    }
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'X-Tenant-Id': localStorage.getItem('tenant_id') || '',
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Processing Complete',
        description: `Processed ${data.data?.processed || 0} notifications. Sent: ${data.data?.sent || 0}, Failed: ${data.data?.failed || 0}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/list'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process notifications',
        variant: 'destructive'
      });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest('PATCH', '/api/schedule-notifications/bulk-read', {
        notificationIds: ids
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to mark as read: ${response.status} - ${errorData}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Success',
        description: `${variables.length} notification${variables.length > 1 ? 's' : ''} marked as read`
      });
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        variables.forEach(id => newSet.delete(id));
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/list'] });
    },
    onError: (error: any) => {
      console.error('Mark as read error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as read',
        variant: 'destructive'
      });
      setProcessingNotifications(prev => {
        // Clear all processing states on error
        return new Set();
      });
    },
    onMutate: () => {
      // Prevent multiple simultaneous mutations
      return { timestamp: Date.now() };
    }
  });

  // Mutation for deleting notifications
  const deleteNotificationMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      try {
        console.log('🗑️ [DELETE-MUTATION] Starting bulk delete for IDs:', ids);
        
        const response = await apiRequest('DELETE', '/api/schedule-notifications/bulk-delete', {
          notificationIds: ids
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.text();
            if (errorData) {
              try {
                const errorJson = JSON.parse(errorData);
                errorMessage = errorJson.error || errorJson.message || errorMessage;
              } catch {
                errorMessage = errorData.length > 100 ? errorData.substring(0, 100) + '...' : errorData;
              }
            }
          } catch {
            // Ignore errors when reading response body
          }
          throw new Error(`Failed to delete notifications: ${errorMessage}`);
        }
        
        const result = await response.json();
        console.log('✅ [DELETE-MUTATION] Bulk delete successful:', result);
        return result;
      } catch (error) {
        console.error('❌ [DELETE-MUTATION] Error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Success',
        description: `${variables.length} notification${variables.length > 1 ? 's' : ''} deleted successfully`
      });
      setSelectedNotifications(new Set()); // Clear selection
      setSelectAllChecked(false); // Reset select all
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-notifications/list'] }); // Invalidate and refetch
    },
    onError: (error: any) => {
      console.error('Delete notification error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notifications',
        variant: 'destructive'
      });
    },
  });

  const onSubmit = (data: CreateNotificationForm) => {
    createMutation.mutate(data);
  };

  const handleProcessNotifications = () => {
    processMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString; // Return original string if parsing fails
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const handleSelectNotification = (id: string, isSelected: boolean) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      // Update selectAllChecked based on the current state
      if (notifications?.data?.notifications) {
        setSelectAllChecked(newSet.size === notifications.data.notifications.length);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectAllChecked(isSelected);
    if (notifications?.data?.notifications) {
      const ids = notifications.data.notifications.map((n: Notification) => n.id);
      setSelectedNotifications(new Set(isSelected ? ids : []));
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      console.log('🔊 [NOTIFICATION-SOUND] Attempting to play sound...');
      
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('✅ [NOTIFICATION-SOUND] Sound played successfully');
      
      // Also try browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nova notificação recebida', {
          body: 'Você tem uma nova notificação',
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('❌ [NOTIFICATION-SOUND] Failed to play notification sound:', error);
    }
  };

  // Monitor for new notifications and play sound
  useEffect(() => {
    if (notifications?.data?.notifications && Array.isArray(notifications.data.notifications)) {
      const currentNotifications = notifications.data.notifications as Notification[];
      const currentIds = new Set(currentNotifications.map(n => n.id));
      
      // Check for new notifications
      const hasNewNotifications = currentNotifications.some(n => !previousNotificationIds.has(n.id));
      
      if (hasNewNotifications && previousNotificationIds.size > 0) {
        console.log('🆕 [NOTIFICATION-SOUND] New notification detected, playing sound...');
        playNotificationSound();
      }
      
      // Update previous IDs
      previousNotificationIds.clear();
      currentIds.forEach(id => previousNotificationIds.add(id));
    }
  }, [notifications?.data?.notifications]);

  const handleDeleteSelected = () => {
    if (selectedNotifications.size === 0) {
      toast({
        title: 'No notifications selected',
        description: 'Please select at least one notification to delete.',
        variant: 'destructive'
      });
      return;
    }
    // Add a confirmation dialog here if desired
    deleteNotificationMutation.mutate(Array.from(selectedNotifications));
  };

  const bulkActionsVisible = selectedNotifications.size > 0;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="notifications-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications & Alerts</h1>
          <p className="text-muted-foreground">
            Manage system notifications and alerts delivery
            {notifications?.data?.total && (
              <span className="ml-2 font-semibold text-primary">
                ({notifications.data.total} total notifications)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleProcessNotifications}
            disabled={processMutation.isPending}
            variant="outline"
            data-testid="button-process-notifications"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {processMutation.isPending ? 'Processing...' : 'Process Now'}
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-notification">
                <Plus className="w-4 h-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
                <DialogDescription>
                  Create a new notification to be sent through selected channels
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-notification-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="system_maintenance">System Maintenance</SelectItem>
                              <SelectItem value="system_alert">System Alert</SelectItem>
                              <SelectItem value="system_notification">System Notification</SelectItem>
                              <SelectItem value="ticket_created">Ticket Created</SelectItem>
                              <SelectItem value="ticket_updated">Ticket Updated</SelectItem>
                              <SelectItem value="ticket_assigned">Ticket Assigned</SelectItem>
                              <SelectItem value="field_emergency">Field Emergency</SelectItem>
                              <SelectItem value="field_update">Field Update</SelectItem>
                              <SelectItem value="timecard_reminder">Timecard Reminder</SelectItem>
                              <SelectItem value="security_alert">Security Alert</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-notification-severity">
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Notification title..." 
                            {...field} 
                            data-testid="input-notification-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notification message..." 
                            className="min-h-20"
                            {...field} 
                            data-testid="textarea-notification-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Channels</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'in_app', label: 'In-App' },
                            { value: 'email', label: 'Email' },
                            { value: 'sms', label: 'SMS' },
                            { value: 'push', label: 'Push' },
                            { value: 'webhook', label: 'Webhook' },
                            { value: 'dashboard_alert', label: 'Dashboard' }
                          ].map((channel) => (
                            <label 
                              key={channel.value} 
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={field.value?.includes(channel.value)}
                                onChange={(e) => {
                                  const updatedChannels = e.target.checked
                                    ? [...(field.value || []), channel.value]
                                    : (field.value || []).filter(c => c !== channel.value);
                                  field.onChange(updatedChannels);
                                }}
                                data-testid={`checkbox-channel-${channel.value}`}
                              />
                              <span className="text-sm">{channel.label}</span>
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      data-testid="button-submit-create"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Notification'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger data-testid="filter-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="severity-filter">Severity</Label>
                  <Select value={filters.severity} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, severity: value }))
                  }>
                    <SelectTrigger data-testid="filter-severity">
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={filters.type} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger data-testid="filter-type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="system_maintenance">System Maintenance</SelectItem>
                      <SelectItem value="system_alert">System Alert</SelectItem>
                      <SelectItem value="ticket_created">Ticket Created</SelectItem>
                      <SelectItem value="field_emergency">Field Emergency</SelectItem>
                      <SelectItem value="security_alert">Security Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => setFilters({ status: '', type: '', severity: '', page: 1 })}
                    variant="outline"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {notificationsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">Loading notifications...</div>
                </CardContent>
              </Card>
            ) : notifications?.success && notifications.data?.notifications?.length > 0 ? (
              <>
                {/* Bulk Actions Header */}
                {bulkActionsVisible && (
                  <Card className="p-4 bg-muted/50 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectAllChecked}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                          data-testid="select-all-checkbox"
                        />
                        <span className="text-sm font-medium">
                          Select All ({notifications.data.notifications.length})
                        </span>
                        {selectedNotifications.size > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {selectedNotifications.size} selected
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteSelected}
                          disabled={deleteNotificationMutation.isPending}
                          data-testid="button-bulk-delete"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Selected ({selectedNotifications.size})
                        </Button>
                        {/* Add other bulk actions here if needed, e.g., Mark as Read */}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Individual Notifications */}
                {(notifications.data.notifications as Notification[]).map((notification: Notification) => (
                  <Card 
                    key={notification.id} 
                    className="hover:shadow-md transition-shadow p-4 cursor-pointer"
                    onClick={() => setSelectedNotification(notification)}
                    data-testid={`card-notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                        className="rounded mt-1"
                        data-testid={`checkbox-notification-${notification.id}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(notification.status)}
                          <h3 className="font-semibold text-lg" data-testid={`notification-title-${notification.id}`}>
                            {notification.title}
                          </h3>
                          <Badge 
                            className={severityColors[notification.severity]}
                            data-testid={`notification-severity-${notification.id}`}
                          >
                            {notification.severity.toUpperCase()}
                          </Badge>
                          <Badge 
                            className={statusColors[notification.status]}
                            data-testid={`notification-status-${notification.id}`}
                          >
                            {notification.status.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-3" data-testid={`notification-message-${notification.id}`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span data-testid={`notification-type-${notification.id}`}>
                            Type: {notification.type}
                          </span>
                          <span data-testid={`notification-channels-${notification.id}`}>
                            Channels: {notification.channels.join(', ')}
                          </span>
                          <span data-testid={`notification-created-${notification.id}`}>
                            Created: {formatDate(notification.createdAt)}
                          </span>
                          {notification.sentAt && (
                            <span data-testid={`notification-sent-${notification.id}`}>
                              Sent: {formatDate(notification.sentAt)}
                            </span>
                          )}
                        </div>

                        {notification.requiresEscalation && (
                          <div className="mt-2">
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Requires Escalation
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        {!notification.readAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();

                              if (processingNotifications.has(notification.id)) {
                                console.log('🔔 [MARK-READ] Already processing notification:', notification.id);
                                return;
                              }

                              console.log('🔔 [MARK-READ] Marking notification as read:', notification.id);
                              setProcessingNotifications(prev => {
                                const newSet = new Set(prev);
                                newSet.add(notification.id);
                                return newSet;
                              });
                              markAsReadMutation.mutate([notification.id]);
                            }}
                            disabled={markAsReadMutation.isPending || processingNotifications.has(notification.id)}
                            data-testid={`button-mark-read-${notification.id}`}
                            className="relative z-10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {markAsReadMutation.isPending ? 'Marking...' : 'Mark Read'}
                          </Button>
                        )}
                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            // For single delete, call the mutation with an array containing the single ID
                            deleteNotificationMutation.mutate([notification.id]);
                          }}
                          disabled={deleteNotificationMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    No notifications found
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {statsLoading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : stats?.success && stats.data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Overview Stats */}
              <Card data-testid="stats-total">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats.data as any).overview?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">All notifications</p>
                </CardContent>
              </Card>

              <Card data-testid="stats-pending">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{(stats.data as any).overview?.pending || 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting delivery</p>
                </CardContent>
              </Card>

              <Card data-testid="stats-delivered">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{(stats.data as any).overview?.delivered || 0}</div>
                  <p className="text-xs text-muted-foreground">Successfully delivered</p>
                </CardContent>
              </Card>

              <Card data-testid="stats-failed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{(stats.data as any).overview?.failed || 0}</div>
                  <p className="text-xs text-muted-foreground">Delivery failed</p>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="md:col-span-2" data-testid="stats-recent-activity">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Last 24 hours:</span>
                      <span className="font-semibold">{(stats.data as any).recentActivity?.last24Hours || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last week:</span>
                      <span className="font-semibold">{(stats.data as any).recentActivity?.lastWeek || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last month:</span>
                      <span className="font-semibold">{(stats.data as any).recentActivity?.lastMonth || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Type Distribution */}
              <Card className="md:col-span-2" data-testid="stats-type-distribution">
                <CardHeader>
                  <CardTitle>By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries((stats.data as any).distribution?.byType || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type.replace('_', ' ')}:</span>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No statistics available
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Details Modal */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getStatusIcon(selectedNotification.status)}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos da notificação
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex gap-2">
                <Badge className={severityColors[selectedNotification.severity] || severityColors.normal}>
                  {selectedNotification.severity.toUpperCase()}
                </Badge>
                <Badge className={statusColors[selectedNotification.status] || statusColors.pending}>
                  {selectedNotification.status.toUpperCase()}
                </Badge>
                {selectedNotification.requiresEscalation && (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    ESCALATION REQUIRED
                  </Badge>
                )}
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-semibold">Mensagem</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Tipo</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedNotification.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Canais</Label>
                  <p className="text-sm text-muted-foreground">{selectedNotification.channels.join(', ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Criado em</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedNotification.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Agendado para</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedNotification.scheduledAt)}</p>
                </div>
                {selectedNotification.sentAt && (
                  <div>
                    <Label className="text-sm font-semibold">Enviado em</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedNotification.sentAt)}</p>
                  </div>
                )}
                {selectedNotification.deliveredAt && (
                  <div>
                    <Label className="text-sm font-semibold">Entregue em</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedNotification.deliveredAt)}</p>
                  </div>
                )}
                {selectedNotification.readAt && (
                  <div>
                    <Label className="text-sm font-semibold">Lido em</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedNotification.readAt)}</p>
                  </div>
                )}
              </div>

              {/* Entity Information */}
              {(selectedNotification.relatedEntityType || selectedNotification.relatedEntityId) && (
                <div>
                  <Label className="text-sm font-semibold">Informações da Entidade</Label>
                  <div className="mt-1 space-y-1">
                    {selectedNotification.relatedEntityType && (
                      <p className="text-sm text-muted-foreground">
                        Tipo: {selectedNotification.relatedEntityType}
                      </p>
                    )}
                    {selectedNotification.relatedEntityId && (
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedNotification.relatedEntityId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* User Information */}
              {selectedNotification.userId && (
                <div>
                  <Label className="text-sm font-semibold">ID do Usuário</Label>
                  <p className="text-sm text-muted-foreground">{selectedNotification.userId}</p>
                </div>
              )}

              {/* Status Information */}
              <div className="flex gap-2 text-sm">
                {selectedNotification.isExpired && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    Expirado
                  </Badge>
                )}
                {selectedNotification.canBeSent && (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Pode ser enviado
                  </Badge>
                )}
              </div>

              {/* ID */}
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">ID da Notificação</Label>
                <p className="text-xs font-mono text-muted-foreground">{selectedNotification.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}