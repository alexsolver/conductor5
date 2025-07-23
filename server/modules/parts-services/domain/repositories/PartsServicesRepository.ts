// Domain repository interface for Parts and Services module
import { 
  Part, InsertPart,
  Inventory, InsertInventory,
  StockMovement, InsertStockMovement,
  Supplier, InsertSupplier,
  SupplierCatalog, InsertSupplierCatalog,
  PurchaseOrder, InsertPurchaseOrder,
  PurchaseOrderItem, InsertPurchaseOrderItem,
  ServiceKit, InsertServiceKit,
  ServiceKitItem, InsertServiceKitItem,
  PriceList, InsertPriceList,
  PriceListItem, InsertPriceListItem
} from '@shared/schema';

export interface PartsServicesRepository {
  // Parts management
  createPart(tenantId: string, data: InsertPart): Promise<Part>;
  findPartById(id: string, tenantId: string): Promise<Part | undefined>;
  findPartsByTenant(tenantId: string, filters?: {
    category?: string;
    search?: string;
    active?: boolean;
    criticality?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ parts: Part[]; total: number }>;
  updatePart(id: string, tenantId: string, data: Partial<InsertPart>): Promise<Part>;
  deletePart(id: string, tenantId: string): Promise<boolean>;

  // Inventory management
  createInventory(tenantId: string, data: InsertInventory): Promise<Inventory>;
  findInventoryByPart(partId: string, tenantId: string, locationId?: string): Promise<Inventory | undefined>;
  findInventoriesByTenant(tenantId: string, filters?: {
    locationId?: string;
    lowStock?: boolean;
    reorderAlert?: boolean;
    partCategory?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ inventories: Inventory[]; total: number }>;
  updateInventory(id: string, tenantId: string, data: Partial<InsertInventory>): Promise<Inventory>;
  adjustStock(inventoryId: string, tenantId: string, quantity: number, reason: string, userId?: string): Promise<StockMovement>;

  // Stock movements
  createStockMovement(tenantId: string, data: InsertStockMovement): Promise<StockMovement>;
  findStockMovementsByPart(partId: string, tenantId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    movementType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ movements: StockMovement[]; total: number }>;
  findStockMovementsByTenant(tenantId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    movementType?: string;
    partCategory?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ movements: StockMovement[]; total: number }>;

  // Suppliers management
  createSupplier(tenantId: string, data: InsertSupplier): Promise<Supplier>;
  findSupplierById(id: string, tenantId: string): Promise<Supplier | undefined>;
  findSuppliersByTenant(tenantId: string, filters?: {
    search?: string;
    supplierType?: string;
    status?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }>;
  updateSupplier(id: string, tenantId: string, data: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string, tenantId: string): Promise<boolean>;

  // Supplier catalog
  createSupplierCatalog(tenantId: string, data: InsertSupplierCatalog): Promise<SupplierCatalog>;
  findSupplierCatalogByPart(partId: string, tenantId: string): Promise<SupplierCatalog[]>;
  findSupplierCatalogBySupplier(supplierId: string, tenantId: string): Promise<SupplierCatalog[]>;
  updateSupplierCatalog(id: string, tenantId: string, data: Partial<InsertSupplierCatalog>): Promise<SupplierCatalog>;
  deleteSupplierCatalog(id: string, tenantId: string): Promise<boolean>;

  // Purchase orders
  createPurchaseOrder(tenantId: string, data: InsertPurchaseOrder): Promise<PurchaseOrder>;
  findPurchaseOrderById(id: string, tenantId: string): Promise<PurchaseOrder | undefined>;
  findPurchaseOrdersByTenant(tenantId: string, filters?: {
    supplierId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: PurchaseOrder[]; total: number }>;
  updatePurchaseOrder(id: string, tenantId: string, data: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  deletePurchaseOrder(id: string, tenantId: string): Promise<boolean>;

  // Purchase order items
  createPurchaseOrderItem(tenantId: string, data: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  findPurchaseOrderItemsByOrder(orderId: string, tenantId: string): Promise<PurchaseOrderItem[]>;
  updatePurchaseOrderItem(id: string, tenantId: string, data: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem>;
  deletePurchaseOrderItem(id: string, tenantId: string): Promise<boolean>;

  // Service kits
  createServiceKit(tenantId: string, data: InsertServiceKit): Promise<ServiceKit>;
  findServiceKitById(id: string, tenantId: string): Promise<ServiceKit | undefined>;
  findServiceKitsByTenant(tenantId: string, filters?: {
    kitType?: string;
    equipmentType?: string;
    serviceType?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ kits: ServiceKit[]; total: number }>;
  updateServiceKit(id: string, tenantId: string, data: Partial<InsertServiceKit>): Promise<ServiceKit>;
  deleteServiceKit(id: string, tenantId: string): Promise<boolean>;

  // Service kit items
  createServiceKitItem(tenantId: string, data: InsertServiceKitItem): Promise<ServiceKitItem>;
  findServiceKitItemsByKit(kitId: string, tenantId: string): Promise<ServiceKitItem[]>;
  updateServiceKitItem(id: string, tenantId: string, data: Partial<InsertServiceKitItem>): Promise<ServiceKitItem>;
  deleteServiceKitItem(id: string, tenantId: string): Promise<boolean>;

  // Price lists
  createPriceList(tenantId: string, data: InsertPriceList): Promise<PriceList>;
  findPriceListById(id: string, tenantId: string): Promise<PriceList | undefined>;
  findPriceListsByTenant(tenantId: string, filters?: {
    applicationType?: string;
    customerCompanyId?: string;
    contractId?: string;
    active?: boolean;
    validDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ lists: PriceList[]; total: number }>;
  updatePriceList(id: string, tenantId: string, data: Partial<InsertPriceList>): Promise<PriceList>;
  deletePriceList(id: string, tenantId: string): Promise<boolean>;

  // Price list items
  createPriceListItem(tenantId: string, data: InsertPriceListItem): Promise<PriceListItem>;
  findPriceListItemsByList(listId: string, tenantId: string): Promise<PriceListItem[]>;
  findPriceForPart(partId: string, tenantId: string, filters?: {
    customerCompanyId?: string;
    contractId?: string;
    quantity?: number;
  }): Promise<PriceListItem | undefined>;
  updatePriceListItem(id: string, tenantId: string, data: Partial<InsertPriceListItem>): Promise<PriceListItem>;
  deletePriceListItem(id: string, tenantId: string): Promise<boolean>;

  // Analytics and reporting
  getInventoryStats(tenantId: string): Promise<{
    totalParts: number;
    totalValue: number;
    lowStockItems: number;
    reorderAlerts: number;
    categoriesCount: Record<string, number>;
  }>;
  
  getSupplierStats(tenantId: string): Promise<{
    totalSuppliers: number;
    activeSuppliers: number;
    averageRating: number;
    topSuppliers: { id: string; name: string; totalPurchases: number }[];
  }>;

  getPurchaseOrderStats(tenantId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalOrders: number;
    totalValue: number;
    ordersByStatus: Record<string, number>;
    averageOrderValue: number;
  }>;
}