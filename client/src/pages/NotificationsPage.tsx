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
// import useLocalization from '@/hooks/useLocalization';
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
  RefreshCw
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
  // Localization temporarily disabled
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
const severityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
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
    queryKey: ['/api/notifications', filters],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?${new URLSearchParams({
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.severity && filters.severity !== 'all' && { severity: filters.severity }),
        page: filters.page.toString(),
        pageSize: '50'
      }).toString()", {
        headers: {
          'Authorization': "
          'X-Tenant-Id': localStorage.getItem('tenant_id') || '',
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
  });
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/notifications/stats'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': "
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
          'Authorization': "
          'X-Tenant-Id': localStorage.getItem('tenant_id') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: 'Notification created successfully'
      });
      setIsCreateOpen(false);
      form.reset();
      refetchNotifications();
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
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
          'Authorization': "
          'X-Tenant-Id': localStorage.getItem('tenant_id') || '',
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "
      });
      refetchNotifications();
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || 'Failed to process notifications',
        variant: 'destructive'
      });
    }
  });
  const markAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/notifications/bulk-read', {
        method: 'PATCH',
        headers: {
          'Authorization': "
          'X-Tenant-Id': localStorage.getItem('tenant_id') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds: ids })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: 'Notifications marked as read'
      });
      refetchNotifications();
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || 'Failed to mark as read',
        variant: 'destructive'
      });
    }
  });
  const onSubmit = (data: CreateNotificationForm) => {
    createMutation.mutate(data);
  };
  const handleProcessNotifications = () => {
    processMutation.mutate();
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="notifications-page>
      <div className="p-4"
        <div>
          <h1 className="text-lg">"Notifications & Alerts</h1>
          <p className="p-4"
            Manage system notifications and alerts delivery
          </p>
        </div>
        <div className="p-4"
          <Button
            onClick={handleProcessNotifications}
            disabled={processMutation.isPending}
            variant="outline"
            data-testid="button-process-notifications"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {processMutation.isPending ? '[TRANSLATION_NEEDED]' : 'Process Now'}
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-notification>
                <Plus className="w-4 h-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="p-4"
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
                <DialogDescription>
                  Create a new notification to be sent through selected channels
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-4"
                  <div className="p-4"
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-notification-type>
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                              <SelectTrigger data-testid="select-notification-severity>
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                        <div className="p-4"
                          {[
                            { value: 'in_app', label: 'In-App' },
                            { value: 'email', label: 'Email' },
                            { value: 'sms', label: 'SMS' },
                            { value: 'push', label: 'Push' },
                            { value: 'webhook', label: 'Webhook' },
                            { value: 'dashboard_alert', label: '[TRANSLATION_NEEDED]' }
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
                                data-testid={"
                              />
                              <span className="text-lg">"{channel.label}</span>
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="p-4"
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
                      {createMutation.isPending ? 'Creating...' : '[TRANSLATION_NEEDED]'}
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
          <TabsTrigger value="notifications" data-testid="tab-notifications>
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats>
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="p-4"
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="p-4"
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger data-testid="filter-status>
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                    <SelectTrigger data-testid="filter-severity>
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                    <SelectTrigger data-testid="filter-type>
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                <div className="p-4"
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
          <div className="p-4"
            {notificationsLoading ? (
              <Card>
                <CardContent className="p-4"
                  <div className="text-lg">"Loading notifications...</div>
                </CardContent>
              </Card>
            ) : notifications?.success && notifications.data?.notifications?.length > 0 ? (
              (notifications.data.notifications as Notification[]).map((notification: Notification) => (
                <Card key={notification.id} className="p-4"
                  <CardContent className="p-4"
                    <div className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          {getStatusIcon(notification.status)}
                          <h3 className="font-semibold text-lg" data-testid={"
                            {notification.title}
                          </h3>
                          <Badge 
                            className={severityColors[notification.severity]}
                            data-testid={"
                          >
                            {notification.severity.toUpperCase()}
                          </Badge>
                          <Badge 
                            className={statusColors[notification.status]}
                            data-testid={"
                          >
                            {notification.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3" data-testid={"
                          {notification.message}
                        </p>
                        
                        <div className="p-4"
                          <span data-testid={"
                            Type: {notification.type}
                          </span>
                          <span data-testid={"
                            Channels: {notification.channels.join(', ')}
                          </span>
                          <span data-testid={"
                            Created: {formatDate(notification.createdAt)}
                          </span>
                          {notification.sentAt && (
                            <span data-testid={"
                              Sent: {formatDate(notification.sentAt)}
                            </span>
                          )}
                        </div>
                        
                        {notification.requiresEscalation && (
                          <div className="p-4"
                            <Badge className="p-4"
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Requires Escalation
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4"
                        {!notification.readAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsReadMutation.mutate([notification.id])}
                            disabled={markAsReadMutation.isPending}
                            data-testid={"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-4"
                  <div className="p-4"
                    No notifications found
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="stats" className="p-4"
          {statsLoading ? (
            <div className="text-lg">"Loading statistics...</div>
          ) : stats?.success && stats.data ? (
            <div className="p-4"
              {/* Overview Stats */}
              <Card data-testid="stats-total>
                <CardHeader className="p-4"
                  <CardTitle className="text-lg">"Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg">"{(stats.data as any).overview?.total || 0}</div>
                  <p className="text-lg">"All notifications</p>
                </CardContent>
              </Card>
              
              <Card data-testid="stats-pending>
                <CardHeader className="p-4"
                  <CardTitle className="text-lg">"Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg">"{(stats.data as any).overview?.pending || 0}</div>
                  <p className="text-lg">"Awaiting delivery</p>
                </CardContent>
              </Card>
              
              <Card data-testid="stats-delivered>
                <CardHeader className="p-4"
                  <CardTitle className="text-lg">"Delivered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg">"{(stats.data as any).overview?.delivered || 0}</div>
                  <p className="text-lg">"Successfully delivered</p>
                </CardContent>
              </Card>
              
              <Card data-testid="stats-failed>
                <CardHeader className="p-4"
                  <CardTitle className="text-lg">"Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg">"{(stats.data as any).overview?.failed || 0}</div>
                  <p className="text-lg">"Delivery failed</p>
                </CardContent>
              </Card>
              {/* Recent Activity */}
              <Card className="md:col-span-2" data-testid="stats-recent-activity>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4"
                    <div className="p-4"
                      <span>Last 24 hours:</span>
                      <span className="text-lg">"{(stats.data as any).recentActivity?.last24Hours || 0}</span>
                    </div>
                    <div className="p-4"
                      <span>Last week:</span>
                      <span className="text-lg">"{(stats.data as any).recentActivity?.lastWeek || 0}</span>
                    </div>
                    <div className="p-4"
                      <span>Last month:</span>
                      <span className="text-lg">"{(stats.data as any).recentActivity?.lastMonth || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Type Distribution */}
              <Card className="md:col-span-2" data-testid="stats-type-distribution>
                <CardHeader>
                  <CardTitle>By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4"
                    {Object.entries((stats.data as any).distribution?.byType || {}).map(([type, count]) => (
                      <div key={type} className="p-4"
                        <span className="text-lg">"{type.replace('_', ' ')}:</span>
                        <span className="text-lg">"{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-4"
              No statistics available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}