
export interface CreateSkillDTO {
  name: string;
  description?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certificationRequired?: boolean;
}

export interface UpdateSkillDTO {
  name?: string;
  description?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certificationRequired?: boolean;
}

export interface SkillResponseDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  level: string;
  certificationRequired: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
