
import { db } from '../db';
import { items } from '../../shared/schema-materials-services';
import { eq } from 'drizzle-orm';

interface ItemData {
  tenantId: string;
  name: string;
  type: 'material' | 'service' | 'asset';
  code?: string;
  description: string;
  measurementUnit: string;
  status: 'active' | 'inactive';
  isActive: boolean;
}

const SAMPLE_ITEMS: Omit<ItemData, 'tenantId'>[] = [
  {
    name: 'Parafuso M8',
    type: 'material',
    code: 'PAR001',
    description: 'Parafuso sextavado M8 x 20mm',
    measurementUnit: 'UN',
    status: 'active',
    isActive: true
  },
  {
    name: 'Correia V-Belt A47',
    type: 'material',
    code: 'COR001',
    description: 'Correia em V modelo A47 para transmissão',
    measurementUnit: 'UN',
    status: 'active',
    isActive: true
  },
  {
    name: 'Bomba Centrífuga BC-150',
    type: 'asset',
    code: 'AST001',
    description: 'Bomba centrífuga 150CV para sistema de refrigeração',
    measurementUnit: 'UN',
    status: 'active',
    isActive: true
  },
  {
    name: 'Cabo Elétrico 2,5mm²',
    type: 'material',
    code: 'CAB001',
    description: 'Cabo elétrico flexível 2,5mm² isolação PVC',
    measurementUnit: 'M',
    status: 'active',
    isActive: true
  },
  {
    name: 'Instalação Elétrica',
    type: 'service',
    code: 'SRV002',
    description: 'Serviço de instalação elétrica completa',
    measurementUnit: 'H',
    status: 'active',
    isActive: true
  },
  {
    name: 'Calibração de Instrumentos',
    type: 'service',
    code: 'SRV003',
    description: 'Serviço de calibração de instrumentos de medição',
    measurementUnit: 'UN',
    status: 'active',
    isActive: true
  }
];

export async function verifyAndRestoreItemCatalogData(tenantId: string) {
  try {
    console.log(`🔍 [ITEM-CATALOG-VERIFY] Checking item catalog data for tenant: ${tenantId}`);
    
    // Check current items count
    const existingItems = await db
      .select()
      .from(items)
      .where(eq(items.tenantId, tenantId));
    
    console.log(`📊 [ITEM-CATALOG-VERIFY] Found ${existingItems.length} existing items`);
    
    if (existingItems.length === 0) {
      console.log(`🔧 [ITEM-CATALOG-VERIFY] No items found, inserting sample data...`);
      
      const itemsToInsert: ItemData[] = SAMPLE_ITEMS.map(item => ({
        ...item,
        tenantId
      }));
      
      await db.insert(items).values(itemsToInsert);
      
      console.log(`✅ [ITEM-CATALOG-VERIFY] Successfully inserted ${itemsToInsert.length} sample items`);
      
      // Verify insertion
      const newCount = await db
        .select()
        .from(items)
        .where(eq(items.tenantId, tenantId));
        
      console.log(`✅ [ITEM-CATALOG-VERIFY] Verification: Now have ${newCount.length} items`);
      
      return {
        success: true,
        message: `Restored ${itemsToInsert.length} items to catalog`,
        itemsCount: newCount.length
      };
    } else {
      console.log(`✅ [ITEM-CATALOG-VERIFY] Item catalog has data, no restoration needed`);
      
      // Check for items without names (potential data corruption)
      const itemsWithoutNames = existingItems.filter(item => !item.name || item.name.trim() === '');
      
      if (itemsWithoutNames.length > 0) {
        console.log(`⚠️ [ITEM-CATALOG-VERIFY] Found ${itemsWithoutNames.length} items without names, fixing...`);
        
        for (const item of itemsWithoutNames) {
          await db
            .update(items)
            .set({ 
              name: item.description || `Item ${item.code || 'sem código'}`,
              isActive: true,
              status: 'active'
            })
            .where(eq(items.id, item.id));
        }
        
        console.log(`✅ [ITEM-CATALOG-VERIFY] Fixed ${itemsWithoutNames.length} items without names`);
      }
      
      return {
        success: true,
        message: `Item catalog verified - ${existingItems.length} items found`,
        itemsCount: existingItems.length
      };
    }
  } catch (error) {
    console.error('❌ [ITEM-CATALOG-VERIFY] Error:', error);
    throw error;
  }
}

// Self-executing script when run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const tenantId = process.argv[2] || '3f99462f-3621-4b1b-bea8-782acc50d62e';
  
  verifyAndRestoreItemCatalogData(tenantId)
    .then(result => {
      console.log('✅ Script completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
