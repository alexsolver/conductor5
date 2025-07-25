
/**
 * Notification Item Component
 * Individual notification display component
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Ticket, 
  Clock, 
  ShieldAlert,
  Package,
  Users
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const isUnread = !notification.readAt;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket_assignment':
      case 'ticket_overdue':
      case 'sla_breach':
        return <Ticket className="h-4 w-4" />;
      case 'compliance_expiry':
        return <ShieldAlert className="h-4 w-4" />;
      case 'timecard_approval':
        return <Clock className="h-4 w-4" />;
      case 'stock_low':
        return <Package className="h-4 w-4" />;
      case 'user_action':
        return <Users className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Card 
      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center gap-2">
          {getTypeIcon(notification.type)}
          {getSeverityIcon(notification.severity)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-medium truncate ${
              isUnread ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {notification.title}
            </h4>
            <Badge 
              variant={getSeverityVariant(notification.severity)}
              className="text-xs"
            >
              {notification.severity}
            </Badge>
          </div>
          
          <p className={`text-xs mb-2 line-clamp-2 ${
            isUnread ? 'text-gray-700' : 'text-gray-500'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatTime(notification.createdAt)}
            </span>
            
            {isUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
