// Export all domain entities
export * from './Item';

// Additional types for the materials module
export interface TicketPlannedItem {
  id: string;
  tenantId: string;
  ticketId: string;
  itemId: string;
  plannedQuantity: string;
  estimatedCost?: string | null;
  unitPriceAtPlanning?: string | null;
  lpuId?: string | null;
  notes?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdBy?: string | null;
}

export interface TicketConsumedItem {
  id: string;
  tenantId: string;
  ticketId: string;
  plannedItemId?: string | null;
  itemId: string;
  plannedQuantity?: string | null;
  actualQuantity: string;
  lpuId: string;
  unitPriceAtConsumption: string;
  totalCost: string;
  technicianId: string;
  stockLocationId?: string | null;
  consumedAt?: Date | null;
  consumptionType?: string | null;
  status?: string | null;
  notes?: string | null;
  batchNumber?: string | null;
  serialNumber?: string | null;
  warrantyPeriod?: number | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface MaterialsSystemOptions {
  showPlanningPhase?: boolean;
  showExecutionPhase?: boolean;
  showControlPhase?: boolean;
  enableLPUIntegration?: boolean;
  enableStockTracking?: boolean;
}