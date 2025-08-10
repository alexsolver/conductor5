
export interface CreateTicketDTO {
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo?: string;
  customerId?: string;
  category?: string;
}
