
export interface TicketConfig {
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
  validation: {
    titleMinLength: number;
    titleMaxLength: number;
    descriptionMaxLength: number;
  };
  defaults: {
    status: string;
    priority: string;
  };
}

export const ticketConfig: TicketConfig = {
  pagination: {
    defaultLimit: 50,
    maxLimit: 100
  },
  validation: {
    titleMinLength: 3,
    titleMaxLength: 200,
    descriptionMaxLength: 5000
  },
  defaults: {
    status: 'open',
    priority: 'medium'
  }
};
