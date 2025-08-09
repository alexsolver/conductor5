
export interface TimecardEntity {
  id: string;
  userId: string;
  tenantId: string;
  date: Date;
  hoursWorked: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimecardEntry extends TimecardEntity {
  startTime: Date;
  endTime: Date;
  breakTime?: number;
  description?: string;
}
