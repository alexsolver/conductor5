/**
 * Exemplo de uso do TenantTemplateService durante deploy de novos tenants
 * Este arquivo demonstra como aplicar o template da empresa Default
 */

import { TenantTemplateService } from '../services/TenantTemplateService';
import { DEFAULT_COMPANY_TEMPLATE } from '../templates/default-company-template';

/**
 * Exemplo de criação de tenant com template Default
 */
export async function deployNewTenantWithDefaultTemplate(
  newTenantId: string,
  createdByUserId: string,
  pool: any
): Promise<void> {
  const schemaName = `tenant_${newTenantId.replace(/-/g, '_')}`;
  
  console.log(`[DEPLOYMENT] Starting deployment for tenant ${newTenantId}`);
  
  try {
    // 1. Criar schema do tenant (já implementado no sistema atual)
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // 2. Criar todas as tabelas necessárias (já implementado)
    // await createTenantTables(pool, schemaName);
    
    // 3. Aplicar template da empresa Default com dados reais
    await TenantTemplateService.applyDefaultCompanyTemplate(
      newTenantId,
      createdByUserId,
      pool,
      schemaName
    );
    
    console.log(`[DEPLOYMENT] Tenant ${newTenantId} deployed successfully with Default template`);
    
    // 4. Log do que foi criado
    console.log(`[DEPLOYMENT] Template applied includes:`);
    console.log(`- Default company: ${DEFAULT_COMPANY_TEMPLATE.company.name}`);
    console.log(`- Industry: ${DEFAULT_COMPANY_TEMPLATE.company.industry}`);
    console.log(`- Size: ${DEFAULT_COMPANY_TEMPLATE.company.size}`);
    console.log(`- Field options: ${DEFAULT_COMPANY_TEMPLATE.ticketFieldOptions.length} items`);
    console.log(`- Categories: ${DEFAULT_COMPANY_TEMPLATE.categories.length} items`);
    console.log(`- Subcategories: ${DEFAULT_COMPANY_TEMPLATE.subcategories.length} items`);
    console.log(`- Actions: ${DEFAULT_COMPANY_TEMPLATE.actions.length} items`);
    
  } catch (error) {
    console.error(`[DEPLOYMENT] Failed to deploy tenant ${newTenantId}:`, error);
    throw error;
  }
}

/**
 * Exemplo de criação de tenant com customizações específicas
 */
export async function deployCustomizedTenant(
  newTenantId: string,
  createdByUserId: string,
  pool: any,
  customizations: {
    companyName: string;
    companyEmail: string;
    industry: string;
    customCategories?: Array<{
      name: string;
      description: string;
      color: string;
      icon: string;
    }>;
  }
): Promise<void> {
  const schemaName = `tenant_${newTenantId.replace(/-/g, '_')}`;
  
  console.log(`[DEPLOYMENT] Deploying customized tenant ${newTenantId}`);
  console.log(`[DEPLOYMENT] Company: ${customizations.companyName}`);
  console.log(`[DEPLOYMENT] Industry: ${customizations.industry}`);
  
  try {
    // 1. Criar schema e tabelas
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // 2. Aplicar template base + customizações
    await TenantTemplateService.applyCustomizedTemplate(
      newTenantId,
      createdByUserId,
      pool,
      schemaName,
      customizations
    );
    
    console.log(`[DEPLOYMENT] Customized tenant ${newTenantId} deployed successfully`);
    
  } catch (error) {
    console.error(`[DEPLOYMENT] Failed to deploy customized tenant ${newTenantId}:`, error);
    throw error;
  }
}

/**
 * Exemplo de verificação se template já foi aplicado
 */
export async function checkTenantTemplateStatus(
  tenantId: string,
  pool: any
): Promise<{ hasTemplate: boolean; companyData?: any }> {
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  try {
    // Verificar se template foi aplicado
    const hasTemplate = await TenantTemplateService.isTemplateApplied(pool, schemaName, tenantId);
    
    if (hasTemplate) {
      // Buscar dados da empresa Default
      const companyQuery = `
        SELECT * FROM "${schemaName}".customer_companies 
        WHERE id = $1 AND tenant_id = $2
      `;
      const result = await pool.query(companyQuery, [DEFAULT_COMPANY_TEMPLATE.company.id, tenantId]);
      
      return {
        hasTemplate: true,
        companyData: result.rows[0]
      };
    }
    
    return { hasTemplate: false };
    
  } catch (error) {
    console.error(`[DEPLOYMENT] Error checking template status for tenant ${tenantId}:`, error);
    return { hasTemplate: false };
  }
}

/**
 * Exemplo de uso em uma rota de deploy
 */
export async function handleTenantCreationRoute(req: any, res: any) {
  const { tenantName, userEmail, industry, customCategories } = req.body;
  const newTenantId = generateTenantId(); // função para gerar UUID
  const userId = req.user.id;
  
  try {
    // Deploy com customizações se fornecidas
    if (industry || customCategories) {
      await deployCustomizedTenant(newTenantId, userId, req.db.pool, {
        companyName: tenantName,
        companyEmail: userEmail,
        industry: industry || DEFAULT_COMPANY_TEMPLATE.company.industry,
        customCategories
      });
    } else {
      // Deploy com template padrão
      await deployNewTenantWithDefaultTemplate(newTenantId, userId, req.db.pool);
    }
    
    res.json({
      success: true,
      tenantId: newTenantId,
      message: 'Tenant created successfully with Default template',
      template: {
        company: DEFAULT_COMPANY_TEMPLATE.company.name,
        industry: DEFAULT_COMPANY_TEMPLATE.company.industry,
        configurationItems: {
          fieldOptions: DEFAULT_COMPANY_TEMPLATE.ticketFieldOptions.length,
          categories: DEFAULT_COMPANY_TEMPLATE.categories.length,
          subcategories: DEFAULT_COMPANY_TEMPLATE.subcategories.length,
          actions: DEFAULT_COMPANY_TEMPLATE.actions.length
        }
      }
    });
    
  } catch (error) {
    console.error('[DEPLOYMENT] Tenant creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message
    });
  }
}

function generateTenantId(): string {
  // Implementar geração de UUID para novo tenant
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}