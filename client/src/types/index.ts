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

export interface CustomerResponse {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  mobilePhone?: string;
  customer_type?: string;
  customerType?: string;
  company_name?: string;
  companyName?: string;
  associated_companies?: string;
  status?: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at: string;
  updated_at?: string;
  tenant_id: string;
  tenantId?: string;
}

export interface TicketWithRelations extends Ticket {
  customer: Customer;
  assignedTo?: User;
  messages?: (TicketMessage & { author?: User; customer?: Customer })[];
}

export interface ActivityLogWithUser extends ActivityLog {
  user?: User;
}
