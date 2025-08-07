import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, like, desc, sql } from 'drizzle-orm';
// Note: Using mock data for now as schema is being implemented
// import { stockItems, stockMovements, warehouses, items } from '@shared/schema';

export interface StockItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reservedStock: number;
  availableStock: number;
  unitCost: number;
  totalValue: number;
  lastMovement: string;
  status: 'ok' | 'low' | 'critical' | 'overstock';
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  movementType: 'entry' | 'exit' | 'transfer' | 'adjustment';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export class StockRepository {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async getStockItems(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    search?: string;
    warehouseId?: string;
    status?: string;
  }): Promise<StockItem[]> {
    try {
      // For now, return mock data since the database schema is being implemented
      const mockStockItems: StockItem[] = [
        {
          id: '1',
          itemId: 'item-1',
          itemName: 'Parafuso Phillips 3/16"',
          itemCode: 'PAR001',
          warehouseId: 'wh-1',
          warehouseName: 'Armazém Principal',
          currentStock: 150,
          minimumStock: 50,
          maximumStock: 500,
          reservedStock: 20,
          availableStock: 130,
          unitCost: 0.15,
          totalValue: 22.50,
          lastMovement: '2025-01-25T10:30:00Z',
          status: 'ok'
        },
        {
          id: '2',
          itemId: 'item-2',
          itemName: 'Abraçadeira 1/2"',
          itemCode: 'ABR002',
          warehouseId: 'wh-1',
          warehouseName: 'Armazém Principal',
          currentStock: 25,
          minimumStock: 30,
          maximumStock: 200,
          reservedStock: 5,
          availableStock: 20,
          unitCost: 2.50,
          totalValue: 62.50,
          lastMovement: '2025-01-24T14:15:00Z',
          status: 'low'
        },
        {
          id: '3',
          itemId: 'item-3',
          itemName: 'Cabo Ethernet Cat6',
          itemCode: 'CAB003',
          warehouseId: 'wh-2',
          warehouseName: 'Armazém Filial',
          currentStock: 8,
          minimumStock: 10,
          maximumStock: 100,
          reservedStock: 0,
          availableStock: 8,
          unitCost: 25.00,
          totalValue: 200.00,
          lastMovement: '2025-01-23T16:45:00Z',
          status: 'critical'
        },
        {
          id: '4',
          itemId: 'item-4',
          itemName: 'Switch 24 Portas',
          itemCode: 'SWI004',
          warehouseId: 'wh-1',
          warehouseName: 'Armazém Principal',
          currentStock: 12,
          minimumStock: 5,
          maximumStock: 20,
          reservedStock: 2,
          availableStock: 10,
          unitCost: 450.00,
          totalValue: 5400.00,
          lastMovement: '2025-01-25T09:20:00Z',
          status: 'ok'
        },
        {
          id: '5',
          itemId: 'item-5',
          itemName: 'Fita Isolante',
          itemCode: 'FIT005',
          warehouseId: 'wh-2',
          warehouseName: 'Armazém Filial',
          currentStock: 80,
          minimumStock: 20,
          maximumStock: 100,
          reservedStock: 0,
          availableStock: 80,
          unitCost: 3.50,
          totalValue: 280.00,
          lastMovement: '2025-01-24T11:30:00Z',
          status: 'overstock'
        }
      ];

      let filteredItems = mockStockItems;

      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.itemName.toLowerCase().includes(searchLower) ||
          item.itemCode.toLowerCase().includes(searchLower)
        );
      }

      if (options?.warehouseId && options.warehouseId !== 'all') {
        filteredItems = filteredItems.filter(item => item.warehouseId === options.warehouseId);
      }

      if (options?.status && options.status !== 'all') {
        filteredItems = filteredItems.filter(item => item.status === options.status);
      }

      if (options?.limit) {
        filteredItems = filteredItems.slice(0, options.limit);
      }

      return filteredItems;
    } catch (error) {
      console.error('Error getting stock items:', error);
      return [];
    }
  }

  async getStockStats(tenantId: string) {
    try {
      // Mock stats based on the mock data above
      return {
        totalItems: 5,
        activeWarehouses: 2,
        lowStock: 1,
        totalValue: 5965.00,
        todayMovements: 3,
        criticalItems: 1,
        overstockItems: 1
      };
    } catch (error) {
      console.error('Error getting stock stats:', error);
      return {
        totalItems: 0,
        activeWarehouses: 0,
        lowStock: 0,
        totalValue: 0,
        todayMovements: 0,
        criticalItems: 0,
        overstockItems: 0
      };
    }
  }

  async getStockMovements(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    itemId?: string;
    warehouseId?: string;
    movementType?: string;
  }): Promise<StockMovement[]> {
    try {
      // Mock movements data
      const mockMovements: StockMovement[] = [
        {
          id: '1',
          itemId: 'item-1',
          itemName: 'Parafuso Phillips 3/16"',
          warehouseId: 'wh-1',
          warehouseName: 'Armazém Principal',
          movementType: 'entry',
          quantity: 100,
          unitCost: 0.15,
          totalCost: 15.00,
          reason: 'Compra - Pedido #1234',
          createdBy: 'admin@conductor.com',
          createdAt: '2025-01-25T10:30:00Z'
        },
        {
          id: '2',
          itemId: 'item-2',
          itemName: 'Abraçadeira 1/2"',
          warehouseId: 'wh-1',
          warehouseName: 'Armazém Principal',
          movementType: 'exit',
          quantity: -10,
          reason: 'Saída para Obra #5678',
          createdBy: 'tecnico@conductor.com',
          createdAt: '2025-01-24T14:15:00Z'
        },
        {
          id: '3',
          itemId: 'item-3',
          itemName: 'Cabo Ethernet Cat6',
          warehouseId: 'wh-2',
          warehouseName: 'Armazém Filial',
          movementType: 'adjustment',
          quantity: -2,
          reason: 'Ajuste de inventário - diferença física',
          createdBy: 'admin@conductor.com',
          createdAt: '2025-01-23T16:45:00Z'
        },
        {
          id: '4',
          itemId: 'item-4',
          itemName: 'Switch 24 Portas',
          warehouseId: 'wh-1',
          warehouseName: 'Armazém Principal',
          movementType: 'entry',
          quantity: 5,
          unitCost: 450.00,
          totalCost: 2250.00,
          reason: 'Compra - Equipamentos de rede',
          createdBy: 'admin@conductor.com',
          createdAt: '2025-01-25T09:20:00Z'
        },
        {
          id: '5',
          itemId: 'item-5',
          itemName: 'Fita Isolante',
          warehouseId: 'wh-2',
          warehouseName: 'Armazém Filial',
          movementType: 'transfer',
          quantity: 20,
          reason: 'Transferência para projeto especial',
          createdBy: 'tecnico@conductor.com',
          createdAt: '2025-01-24T11:30:00Z'
        }
      ];

      let filteredMovements = mockMovements;

      if (options?.itemId) {
        filteredMovements = filteredMovements.filter(mov => mov.itemId === options.itemId);
      }

      if (options?.warehouseId) {
        filteredMovements = filteredMovements.filter(mov => mov.warehouseId === options.warehouseId);
      }

      if (options?.movementType) {
        filteredMovements = filteredMovements.filter(mov => mov.movementType === options.movementType);
      }

      if (options?.limit) {
        filteredMovements = filteredMovements.slice(0, options.limit);
      }

      return filteredMovements.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting stock movements:', error);
      return [];
    }
  }

  async getWarehouses(tenantId: string) {
    try {
      // Mock warehouses data
      return [
        {
          id: 'wh-1',
          name: 'Armazém Principal',
          code: 'AP001',
          address: 'Rua Principal, 123 - São Paulo/SP',
          isActive: true
        },
        {
          id: 'wh-2',
          name: 'Armazém Filial',
          code: 'AF002',
          address: 'Av. Secundária, 456 - Rio de Janeiro/RJ',
          isActive: true
        }
      ];
    } catch (error) {
      console.error('Error getting warehouses:', error);
      return [];
    }
  }

  async createStockMovement(tenantId: string, data: {
    itemId: string;
    warehouseId: string;
    movementType: 'entry' | 'exit' | 'transfer' | 'adjustment';
    quantity: number;
    unitCost?: number;
    reason: string;
    createdBy: string;
  }) {
    try {
      // Mock response for now
      const movement = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString()
      };

      console.log('Stock movement created:', movement);
      return movement;
    } catch (error) {
      console.error('Error creating stock movement:', error);
      throw new Error('Failed to create stock movement');
    }
  }

  async createStockAdjustment(tenantId: string, data: {
    itemId: string;
    warehouseId: string;
    newQuantity: number;
    reason: string;
    createdBy: string;
  }) {
    try {
      // Mock response for now
      const adjustment = {
        id: Date.now().toString(),
        ...data,
        movementType: 'adjustment' as const,
        quantity: data.newQuantity,
        createdAt: new Date().toISOString()
      };

      console.log('Stock adjustment created:', adjustment);
      return adjustment;
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      throw new Error('Failed to create stock adjustment');
    }
  }
}