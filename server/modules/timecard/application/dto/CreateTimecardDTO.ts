
<line_number>1</line_number>
export interface CreateTimecardDTO {
  userId: string;
  date: Date;
  startTime: string;
  endTime?: string;
  breakTime?: number;
  description?: string;
  projectId?: string;
  taskId?: string;
  tenantId: string;
}

export interface UpdateTimecardDTO {
  startTime?: string;
  endTime?: string;
  breakTime?: number;
  description?: string;
  projectId?: string;
  taskId?: string;
}

export interface TimecardResponseDTO {
  id: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime?: string;
  breakTime?: number;
  description?: string;
  totalHours?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
