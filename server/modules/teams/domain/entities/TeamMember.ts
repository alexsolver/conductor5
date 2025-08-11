
export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  position?: string;
  department?: string;
  departmentName?: string;
  isActive: boolean;
  status: string;
  phone?: string;
  cellPhone?: string;
  performance?: number;
  goals?: number;
  completedGoals?: number;
  lastActive?: Date;
  groupIds?: string[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
