
/**
 * First Company Template Service
 * Aplica o template padrão apenas na primeira empresa criada no tenant
 */

import { TenantTemplateService } from "./TenantTemplateService";
import { pool } from "../db";

export class FirstCompanyTemplateService {
  
  /**
   * Verifica se esta é a primeira empresa do tenant e aplica o template se necessário
   */
  static async applyTemplateIfFirstCompany(
    tenantId: string, 
    companyId: string
  ): Promise<boolean> {
    try {
      console.log(`🔍 [FIRST-COMPANY] Checking if company ${companyId} is first in tenant ${tenantId}`);
      
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Verificar quantas empresas ativas existem no tenant
      const companyCountQuery = `
        SELECT COUNT(*) as count 
        FROM "${schemaName}".companies 
        WHERE tenant_id = $1 AND is_active = true
      `;
      
      const result = await pool.query(companyCountQuery, [tenantId]);
      const companyCount = parseInt(result.rows[0]?.count || '0');
      
      console.log(`📊 [FIRST-COMPANY] Found ${companyCount} active companies in tenant ${tenantId}`);
      
      // Se é a primeira empresa, aplicar o template
      if (companyCount === 1) {
        console.log(`🎨 [FIRST-COMPANY] This is the first company! Applying default template...`);
        
        await TenantTemplateService.applyDefaultCompanyTemplate(
          tenantId,
          'system', // userId system para primeira empresa
          pool,
          schemaName
        );
        
        console.log(`✅ [FIRST-COMPANY] Template applied successfully to first company ${companyId}`);
        return true;
      } else {
        console.log(`ℹ️ [FIRST-COMPANY] Not the first company (${companyCount} total), skipping template application`);
        return false;
      }
      
    } catch (error: any) {
      console.error(`❌ [FIRST-COMPANY] Error checking/applying template:`, error);
      throw new Error(`Failed to apply first company template: ${error.message}`);
    }
  }

  /**
   * Verifica se o template já foi aplicado no tenant
   */
  static async isTemplateAlreadyApplied(tenantId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Verificar se existem configurações de ticket (indicador de template aplicado)
      const configQuery = `
        SELECT COUNT(*) as count 
        FROM "${schemaName}".ticket_field_options 
        WHERE tenant_id = $1
      `;
      
      const result = await pool.query(configQuery, [tenantId]);
      const configCount = parseInt(result.rows[0]?.count || '0');
      
      return configCount > 0;
    } catch (error) {
      console.error(`❌ [FIRST-COMPANY] Error checking template status:`, error);
      return false;
    }
  }
}
