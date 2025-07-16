import type { 
  User, 
  Tenant, 
  Customer, 
  Ticket, 
  TicketMessage, 
  ActivityLog 
} from "@shared/schema";

export type { User, Tenant, Customer, Ticket, TicketMessage, ActivityLog };

export interface DashboardStats {
  activeTickets: number;
  resolvedToday: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  onlineAgents: number;
  totalAgents: number;
}

export interface TicketWithRelations extends Ticket {
  customer: Customer;
  assignedTo?: User;
  messages?: (TicketMessage & { author?: User; customer?: Customer })[];
}

export interface ActivityLogWithUser extends ActivityLog {
  user?: User;
}
