
export interface AutomationTrigger {
  id: string;
  ruleId: string;
  type: 'new_message' | 'keyword' | 'time_based' | 'channel_specific' | 'priority_based' | 'sender_pattern' | 'content_pattern';
  conditions: {
    keywords?: string[];
    channels?: string[];
    priority?: string[];
    timeRange?: {
      start: string;
      end: string;
    };
    senderPattern?: string;
    contentPattern?: string;
    operator: 'and' | 'or';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than';
  value: string | number;
  caseSensitive?: boolean;
}
