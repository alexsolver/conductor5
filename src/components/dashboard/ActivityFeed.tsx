import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { ArrowRight } from "lucide-react";
import type { ActivityLogWithUser } from "../../types";

function getActivityIcon(action: string) {
  switch (action) {
    case "created":
      return "👤";
    case "resolved":
      return "✅";
    case "assigned":
      return "📋";
    case "updated":
      return "✏️";
    case "message_added":
      return "💬";
    default:
      return "📋";
  }
}

function getActivityMessage(activity: ActivityLogWithUser) {
  const userName = activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : "System";
  
  switch (activity.action) {
    case "created":
      return `${userName} created ${activity.entityType}`;
    case "resolved":
      return `${userName} resolved ticket`;
    case "assigned":
      return `${userName} assigned ticket`;
    case "updated":
      return `${userName} updated ${activity.entityType}`;
    case "message_added":
      return `${userName} added a message`;
    default:
      return `${userName} performed ${activity.action}`;
  }
}

function formatTimeAgo(date: string) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

function getUserInitials(user?: { firstName?: string | null; lastName?: string | null }) {
  if (!user?.firstName && !user?.lastName) return "SY";
  const first = user.firstName?.charAt(0) || "";
  const last = user.lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase();
}

export function ActivityFeed() {
  const { data: activities, isLoading } = useQuery<ActivityLogWithUser[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  if (isLoading) {
    return (
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getUserInitials(activity.user)}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  {getActivityMessage(activity)}
                  {activity.details?.subject && (
                    <span className="font-medium text-purple-600 ml-1">
                      #{activity.entityId.slice(-4)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
          
          <div className="pt-2">
            <button className="text-sm font-medium gradient-text hover:underline flex items-center">
              View all activity
              <ArrowRight className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
