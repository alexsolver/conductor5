
<line_number>1</line_number>
export interface CreateScheduleDTO {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  customerId?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  tenantId: string;
}

export interface UpdateScheduleDTO {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
