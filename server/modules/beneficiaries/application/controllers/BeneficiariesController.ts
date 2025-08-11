/**
 * BeneficiariesController - Clean Architecture Presentation Layer
 * Following AGENT_CODING_STANDARDS.md - Controllers Pattern
 */

import { Request, Response } from 'express';

export class BeneficiariesController {
  constructor() {}

  async getBeneficiaries(req: Request, res: Response): Promise<void> {
    try {
      // Get tenantId from authenticated user context following AGENT_CODING_STANDARDS
      const tenantId = (req as any).user?.tenantId;
      const { search, customerId, active } = req.query;
      
      console.log('👥 [BeneficiariesController] Getting beneficiaries for tenant:', tenantId);
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
        return;
      }
      
      // Import database from server root following AGENT_CODING_STANDARDS
      const { db, sql } = await import('../../../../db');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Execute direct query using sql template literals per standards
      const result = await db.execute(sql`
        SELECT 
          id,
          tenant_id,
          first_name,
          last_name,
          email,
          birth_date,
          rg,
          cpf_cnpj,
          is_active,
          customer_code,
          customer_id,
          phone,
          cell_phone,
          created_at,
          updated_at
        FROM ${sql.identifier(schemaName)}.beneficiaries
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY created_at DESC
        LIMIT 50
      `);
      
      const beneficiaries = Array.isArray(result) ? result : (result.rows || []);
      
      console.log('👥 [BeneficiariesController] Beneficiaries found:', beneficiaries.length);
      
      res.json({
        success: true,
        message: 'Beneficiaries retrieved successfully',
        data: beneficiaries,
        filters: { search, customerId, active: active === 'true', tenantId }
      });
    } catch (error) {
      console.error('👥 [BeneficiariesController] Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to retrieve beneficiaries';
      res.status(500).json({ success: false, message });
    }
  }
}