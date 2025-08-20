import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TicketWithRelations } from "@/types";

function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "critical":
      return "bg-red-500 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "medium":
      return "bg-yellow-500 text-white";
    case "low":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function formatTimeAgo(date: string) {
  const now = new Date();
  const ticketDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function UrgentTickets() {
  const { data: urgentTickets, isLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets/urgent"],
  });

  if (isLoading) {
    return (
      <Card className="gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Urgent Tickets</CardTitle>
            <div className="animate-pulse">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = urgentTickets?.filter(t => t.priority === "critical").length || 0;

  return (
    <Card className="gradient-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Urgent Tickets</CardTitle>
          {criticalCount > 0 && (
            <Badge variant="destructive">
              {criticalCount} Critical
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urgentTickets?.map((ticket) => (
            <div 
              key={ticket.id} 
              className={`border rounded-lg p-4 ${
                ticket.priority === "critical" 
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" 
                  : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
              "}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                  <span className="font-medium text-gray-900 dark:text-white">
                    #{ticket.id.slice(-6)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(ticket.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {ticket.subject}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Assigned to: {" "}
                  <span className="font-medium">
                    {ticket.assignedTo 
                      ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName"
                      : "Unassigned"
                    }
                  </span>
                </span>
                <Button variant="link" size="sm" className="gradient-text p-0 h-auto">
                  View details
                </Button>
              </div>
            </div>
          ))}
          
          {(!urgentTickets || urgentTickets.length === 0) && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No urgent tickets at the moment
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
