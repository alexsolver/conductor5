
export interface UpdateTicketDTO {
  subject?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedToId?: string;
  categoryId?: string;
  subcategoryId?: string;
}

export interface TicketDetailsDTO {
  id: string;
  number: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  categoryId?: string;
  subcategoryId?: string;
  callerId?: string;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  // Campos relacionais
  customerName?: string;
  customerEmail?: string;
  assignedToName?: string;
  categoryName?: string;
  subcategoryName?: string;
}
