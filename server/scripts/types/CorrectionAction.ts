
export interface CorrectionAction {
  type: 'create_file' | 'create_directory' | 'refactor_code' | 'move_code' | 'rename_file';
  target: string;
  description: string;
  content?: string;
}

export interface CorrectionPlan {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  module: string;
  actions: CorrectionAction[];
  estimatedTime: string;
}
