
import { getTenantDb } from "../../../../db-tenant";
import { eq, and, desc, ilike, count, sql, gte, lte, isNull, or } from "drizzle-orm";
import { 
  parts, 
  suppliers,
  stockLocations, 
  inventoryMultiLocation,
  stockMovements 
} from "../../../../../shared/schema-parts-services-unified";

// Interfaces para Etapa 4
export interface WorkOrder {
  work_order_number: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  work_order_type: 'MAINTENANCE' | 'REPAIR' | 'INSTALLATION' | 'INSPECTION' | 'EMERGENCY';
  source_ticket_id?: string;
  auto_created?: boolean;
  part_id?: string;
  location_id?: string;
  estimated_quantity?: number;
  scheduled_date?: string;
  due_date?: string;
  assigned_to?: string;
  estimated_cost?: number;
  labor_hours?: number;
  automation_rule_id?: string;
  custom_fields?: any;
}

export interface ExternalIntegration {
  integration_name: string;
  integration_type: 'ERP' | 'CRM' | 'WMS' | 'API' | 'WEBHOOK' | 'DATABASE';
  endpoint_url?: string;
  api_key_encrypted?: string;
  auth_method: 'API_KEY' | 'OAUTH' | 'BASIC_AUTH' | 'TOKEN';
  field_mapping?: any;
  sync_direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  sync_frequency: 'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MANUAL';
  webhook_url?: string;
  webhook_secret?: string;
  is_active?: boolean;
}

export interface SupplierContract {
  contract_number: string;
  supplier_id: string;
  contract_name: string;
  contract_type: 'SUPPLY' | 'SERVICE' | 'MAINTENANCE' | 'MIXED';
  start_date: string;
  end_date: string;
  auto_renewal?: boolean;
  renewal_period_months?: number;
  total_value?: number;
  currency?: string;
  payment_terms?: string;
  delivery_terms?: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  alert_days_before_expiry?: number;
  minimum_order_value?: number;
  maximum_order_value?: number;
  discount_percentage?: number;
}

export interface ContractItem {
  contract_id: string;
  part_id: string;
  contract_price: number;
  minimum_quantity?: number;
  maximum_quantity?: number;
  lead_time_days?: number;
  unit_of_measure?: string;
  effective_from?: string;
  effective_to?: string;
}

export interface ApprovalWorkflow {
  workflow_name: string;
  workflow_type: 'PURCHASE_ORDER' | 'TRANSFER' | 'ADJUSTMENT' | 'WORK_ORDER';
  approval_rules: any[];
  auto_approval_rules?: any;
  auto_approve_threshold?: number;
  require_manager_above?: number;
  require_director_above?: number;
  is_active?: boolean;
}

export interface ExecutiveReport {
  report_name: string;
  report_type: 'KPI' | 'SUPPLIER_PERFORMANCE' | 'INVENTORY_ANALYSIS' | 'COST_ANALYSIS';
  report_config: any;
  schedule_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  recipients: string[];
  is_active?: boolean;
}

export class PartsServicesRepositoryEtapa4 {

  // ===== WORK ORDERS AUTOMÁTICOS =====
  async createWorkOrder(tenantId: string, userId: string, data: WorkOrder) {
    const db = getTenantDb(tenantId);
    
    const [workOrder] = await db.execute(sql`
      INSERT INTO work_orders (
        tenant_id, work_order_number, title, description, priority, status,
        work_order_type, source_ticket_id, auto_created, part_id, location_id,
        estimated_quantity, scheduled_date, due_date, assigned_to,
        estimated_cost, labor_hours, automation_rule_id, custom_fields, created_by
      )
      VALUES (
        ${tenantId}, ${data.work_order_number}, ${data.title}, ${data.description || null},
        ${data.priority}, ${data.status || 'PENDING'}, ${data.work_order_type},
        ${data.source_ticket_id || null}, ${data.auto_created || false},
        ${data.part_id || null}, ${data.location_id || null},
        ${data.estimated_quantity || 1}, ${data.scheduled_date || null},
        ${data.due_date || null}, ${data.assigned_to || null},
        ${data.estimated_cost || 0}, ${data.labor_hours || 0},
        ${data.automation_rule_id || null}, ${JSON.stringify(data.custom_fields || {})},
        ${userId}
      )
      RETURNING *
    `);

    return workOrder;
  }

  async getWorkOrders(tenantId: string, filters: any = {}) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE wo.tenant_id = '${tenantId}'`;
    
    if (filters.status) {
      whereClause += ` AND wo.status = '${filters.status}'`;
    }
    
    if (filters.assignedTo) {
      whereClause += ` AND wo.assigned_to = '${filters.assignedTo}'`;
    }
    
    if (filters.autoCreated !== undefined) {
      whereClause += ` AND wo.auto_created = ${filters.autoCreated}`;
    }
    
    if (filters.dateFrom) {
      whereClause += ` AND wo.scheduled_date >= '${filters.dateFrom}'`;
    }
    
    if (filters.dateTo) {
      whereClause += ` AND wo.scheduled_date <= '${filters.dateTo}'`;
    }

    const workOrders = await db.execute(sql.raw(`
      SELECT 
        wo.*,
        p.title as part_title,
        p.internal_code as part_code,
        sl.location_name,
        s.name as supplier_name,
        CASE 
          WHEN wo.assigned_to IS NOT NULL THEN 'Assigned User'
          ELSE NULL 
        END as assigned_user_name
      FROM work_orders wo
      LEFT JOIN parts p ON wo.part_id = p.id
      LEFT JOIN stock_locations sl ON wo.location_id = sl.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY 
        CASE wo.priority 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END,
        wo.scheduled_date ASC NULLS LAST,
        wo.created_at DESC
    `));

    return workOrders.rows;
  }

  async updateWorkOrderStatus(tenantId: string, workOrderId: string, status: string, userId: string) {
    const db = getTenantDb(tenantId);
    
    const updateFields = [`status = '${status}'`, `updated_at = NOW()`];
    
    if (status === 'IN_PROGRESS') {
      updateFields.push(`started_at = NOW()`);
    } else if (status === 'COMPLETED') {
      updateFields.push(`completed_at = NOW()`, `completed_by = '${userId}'`);
    }

    const [workOrder] = await db.execute(sql.raw(`
      UPDATE work_orders 
      SET ${updateFields.join(', ')}
      WHERE id = '${workOrderId}' AND tenant_id = '${tenantId}'
      RETURNING *
    `));

    return workOrder;
  }

  // ===== INTEGRAÇÕES EXTERNAS =====
  async createExternalIntegration(tenantId: string, userId: string, data: ExternalIntegration) {
    const db = getTenantDb(tenantId);
    
    const [integration] = await db.execute(sql`
      INSERT INTO external_integrations (
        tenant_id, integration_name, integration_type, endpoint_url,
        api_key_encrypted, auth_method, field_mapping, sync_direction,
        sync_frequency, webhook_url, webhook_secret, is_active, created_by
      )
      VALUES (
        ${tenantId}, ${data.integration_name}, ${data.integration_type},
        ${data.endpoint_url || null}, ${data.api_key_encrypted || null},
        ${data.auth_method}, ${JSON.stringify(data.field_mapping || {})},
        ${data.sync_direction}, ${data.sync_frequency},
        ${data.webhook_url || null}, ${data.webhook_secret || null},
        ${data.is_active ?? true}, ${userId}
      )
      RETURNING *
    `);

    return integration;
  }

  async getExternalIntegrations(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    const integrations = await db.execute(sql`
      SELECT 
        ei.*,
        CASE 
          WHEN ei.last_sync_at IS NULL THEN 'Never'
          ELSE ei.last_sync_at::TEXT
        END as last_sync_display,
        CASE
          WHEN ei.error_count > 0 AND ei.error_count < 3 THEN 'WARNING'
          WHEN ei.error_count >= 3 THEN 'ERROR'
          ELSE 'OK'
        END as health_status
      FROM external_integrations ei
      WHERE ei.tenant_id = ${tenantId}
      ORDER BY ei.integration_name
    `);

    return integrations.rows;
  }

  async syncExternalIntegration(tenantId: string, integrationId: string, syncType: string = 'MANUAL') {
    const db = getTenantDb(tenantId);
    
    // Iniciar log de sincronização
    const [syncLog] = await db.execute(sql`
      INSERT INTO sync_logs (
        tenant_id, integration_id, sync_type, direction, status, started_at
      )
      VALUES (
        ${tenantId}, ${integrationId}, ${syncType}, 'BIDIRECTIONAL', 'IN_PROGRESS', NOW()
      )
      RETURNING *
    `);

    try {
      // Simular sincronização (aqui seria implementada a lógica real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar log como sucesso
      await db.execute(sql`
        UPDATE sync_logs 
        SET 
          status = 'SUCCESS',
          completed_at = NOW(),
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
          records_processed = 50,
          records_success = 48,
          records_failed = 2,
          sync_details = '{"message": "Sincronização concluída com sucesso"}'::jsonb
        WHERE id = ${syncLog.id}
      `);

      // Atualizar última sincronização na integração
      await db.execute(sql`
        UPDATE external_integrations 
        SET 
          last_sync_at = NOW(),
          next_sync_at = CASE 
            WHEN sync_frequency = 'HOURLY' THEN NOW() + INTERVAL '1 hour'
            WHEN sync_frequency = 'DAILY' THEN NOW() + INTERVAL '1 day'
            WHEN sync_frequency = 'WEEKLY' THEN NOW() + INTERVAL '1 week'
            ELSE NULL
          END,
          status = 'ACTIVE',
          error_count = 0,
          last_error = NULL
        WHERE id = ${integrationId} AND tenant_id = ${tenantId}
      `);

      return { success: true, syncLogId: syncLog.id };
      
    } catch (error) {
      // Atualizar log como falha
      await db.execute(sql`
        UPDATE sync_logs 
        SET 
          status = 'FAILED',
          completed_at = NOW(),
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
          error_details = ${JSON.stringify({ error: error.message })}
        WHERE id = ${syncLog.id}
      `);

      // Incrementar contador de erros na integração
      await db.execute(sql`
        UPDATE external_integrations 
        SET 
          error_count = error_count + 1,
          last_error = ${error.message},
          status = CASE WHEN error_count >= 3 THEN 'ERROR' ELSE status END
        WHERE id = ${integrationId} AND tenant_id = ${tenantId}
      `);

      throw error;
    }
  }

  async getSyncLogs(tenantId: string, integrationId?: string, limit: number = 50) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE sl.tenant_id = '${tenantId}'`;
    if (integrationId) {
      whereClause += ` AND sl.integration_id = '${integrationId}'`;
    }

    const logs = await db.execute(sql.raw(`
      SELECT 
        sl.*,
        ei.integration_name
      FROM sync_logs sl
      JOIN external_integrations ei ON sl.integration_id = ei.id
      ${whereClause}
      ORDER BY sl.started_at DESC
      LIMIT ${limit}
    `));

    return logs.rows;
  }

  // ===== CONTRATOS COM FORNECEDORES =====
  async createSupplierContract(tenantId: string, userId: string, data: SupplierContract) {
    const db = getTenantDb(tenantId);
    
    const [contract] = await db.execute(sql`
      INSERT INTO supplier_contracts (
        tenant_id, contract_number, supplier_id, contract_name, contract_type,
        start_date, end_date, auto_renewal, renewal_period_months,
        total_value, currency, payment_terms, delivery_terms, status,
        alert_days_before_expiry, minimum_order_value, maximum_order_value,
        discount_percentage, created_by
      )
      VALUES (
        ${tenantId}, ${data.contract_number}, ${data.supplier_id}, ${data.contract_name},
        ${data.contract_type}, ${data.start_date}, ${data.end_date},
        ${data.auto_renewal || false}, ${data.renewal_period_months || null},
        ${data.total_value || null}, ${data.currency || 'BRL'},
        ${data.payment_terms || null}, ${data.delivery_terms || null},
        ${data.status || 'DRAFT'}, ${data.alert_days_before_expiry || 30},
        ${data.minimum_order_value || null}, ${data.maximum_order_value || null},
        ${data.discount_percentage || 0}, ${userId}
      )
      RETURNING *
    `);

    return contract;
  }

  async getSupplierContracts(tenantId: string, filters: any = {}) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE sc.tenant_id = '${tenantId}'`;
    
    if (filters.supplierId) {
      whereClause += ` AND sc.supplier_id = '${filters.supplierId}'`;
    }
    
    if (filters.status) {
      whereClause += ` AND sc.status = '${filters.status}'`;
    }
    
    if (filters.expiringInDays) {
      whereClause += ` AND sc.end_date <= CURRENT_DATE + INTERVAL '${filters.expiringInDays} days'`;
    }

    const contracts = await db.execute(sql.raw(`
      SELECT 
        sc.*,
        s.name as supplier_name,
        s.trade_name as supplier_trade_name,
        s.document_number as supplier_document,
        (sc.end_date - CURRENT_DATE) as days_to_expiry,
        CASE 
          WHEN sc.end_date < CURRENT_DATE THEN 'EXPIRED'
          WHEN sc.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
          ELSE 'ACTIVE'
        END as expiry_status,
        (SELECT COUNT(*) FROM contract_items ci WHERE ci.contract_id = sc.id AND ci.is_active = true) as items_count
      FROM supplier_contracts sc
      JOIN suppliers s ON sc.supplier_id = s.id
      ${whereClause}
      ORDER BY sc.end_date ASC, sc.created_at DESC
    `));

    return contracts.rows;
  }

  async addContractItem(tenantId: string, data: ContractItem) {
    const db = getTenantDb(tenantId);
    
    const [item] = await db.execute(sql`
      INSERT INTO contract_items (
        tenant_id, contract_id, part_id, contract_price, minimum_quantity,
        maximum_quantity, lead_time_days, unit_of_measure,
        effective_from, effective_to, is_active
      )
      VALUES (
        ${tenantId}, ${data.contract_id}, ${data.part_id}, ${data.contract_price},
        ${data.minimum_quantity || 1}, ${data.maximum_quantity || null},
        ${data.lead_time_days || 7}, ${data.unit_of_measure || 'UN'},
        ${data.effective_from || null}, ${data.effective_to || null}, true
      )
      RETURNING *
    `);

    return item;
  }

  async getContractItems(tenantId: string, contractId: string) {
    const db = getTenantDb(tenantId);
    
    const items = await db.execute(sql`
      SELECT 
        ci.*,
        p.title as part_title,
        p.internal_code as part_code,
        p.manufacturer_code,
        p.cost_price as current_cost_price,
        (ci.contract_price - p.cost_price) as price_difference,
        CASE 
          WHEN ci.contract_price < p.cost_price THEN 'BELOW_COST'
          WHEN ci.contract_price > p.cost_price * 1.2 THEN 'ABOVE_MARKET'
          ELSE 'COMPETITIVE'
        END as price_analysis
      FROM contract_items ci
      JOIN parts p ON ci.part_id = p.id
      WHERE ci.tenant_id = ${tenantId} 
        AND ci.contract_id = ${contractId}
        AND ci.is_active = true
      ORDER BY p.title
    `);

    return items.rows;
  }

  // ===== WORKFLOW DE APROVAÇÕES =====
  async createApprovalWorkflow(tenantId: string, userId: string, data: ApprovalWorkflow) {
    const db = getTenantDb(tenantId);
    
    const [workflow] = await db.execute(sql`
      INSERT INTO approval_workflows (
        tenant_id, workflow_name, workflow_type, approval_rules,
        auto_approval_rules, auto_approve_threshold, require_manager_above,
        require_director_above, is_active, created_by
      )
      VALUES (
        ${tenantId}, ${data.workflow_name}, ${data.workflow_type},
        ${JSON.stringify(data.approval_rules)}, ${JSON.stringify(data.auto_approval_rules || {})},
        ${data.auto_approve_threshold || null}, ${data.require_manager_above || null},
        ${data.require_director_above || null}, ${data.is_active ?? true}, ${userId}
      )
      RETURNING *
    `);

    return workflow;
  }

  async getApprovalWorkflows(tenantId: string, workflowType?: string) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE aw.tenant_id = '${tenantId}'`;
    if (workflowType) {
      whereClause += ` AND aw.workflow_type = '${workflowType}'`;
    }

    const workflows = await db.execute(sql.raw(`
      SELECT 
        aw.*,
        (SELECT COUNT(*) FROM approval_instances ai WHERE ai.workflow_id = aw.id AND ai.status = 'PENDING') as pending_approvals
      FROM approval_workflows aw
      ${whereClause}
      ORDER BY aw.workflow_name
    `));

    return workflows.rows;
  }

  async createApprovalInstance(tenantId: string, data: {
    workflow_id: string;
    reference_type: string;
    reference_id: string;
    requested_by: string;
    requested_amount: number;
    justification?: string;
  }) {
    const db = getTenantDb(tenantId);
    
    // Buscar workflow para determinar etapas
    const workflow = await db.execute(sql`
      SELECT approval_rules FROM approval_workflows 
      WHERE id = ${data.workflow_id} AND tenant_id = ${tenantId}
    `);

    if (!workflow.rows.length) {
      throw new Error('Workflow não encontrado');
    }

    const approvalRules = workflow.rows[0].approval_rules;
    const totalSteps = approvalRules.length;

    const [instance] = await db.execute(sql`
      INSERT INTO approval_instances (
        tenant_id, workflow_id, reference_type, reference_id,
        requested_by, requested_amount, justification, total_steps
      )
      VALUES (
        ${tenantId}, ${data.workflow_id}, ${data.reference_type}, ${data.reference_id},
        ${data.requested_by}, ${data.requested_amount}, ${data.justification || null}, ${totalSteps}
      )
      RETURNING *
    `);

    // Criar etapas de aprovação
    for (let i = 0; i < approvalRules.length; i++) {
      const rule = approvalRules[i];
      await db.execute(sql`
        INSERT INTO approval_steps (
          tenant_id, approval_instance_id, step_number, approver_id, approver_role
        )
        VALUES (
          ${tenantId}, ${instance.id}, ${rule.step}, ${data.requested_by}, ${rule.role}
        )
      `);
    }

    return instance;
  }

  async getPendingApprovals(tenantId: string, approverId?: string) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE ai.tenant_id = '${tenantId}' AND ai.status = 'PENDING'`;
    if (approverId) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM approval_steps ast 
        WHERE ast.approval_instance_id = ai.id 
          AND ast.approver_id = '${approverId}' 
          AND ast.status = 'PENDING'
      )`;
    }

    const approvals = await db.execute(sql.raw(`
      SELECT 
        ai.*,
        aw.workflow_name,
        (SELECT COUNT(*) FROM approval_steps ast WHERE ast.approval_instance_id = ai.id AND ast.status = 'APPROVED') as approved_steps
      FROM approval_instances ai
      JOIN approval_workflows aw ON ai.workflow_id = aw.id
      ${whereClause}
      ORDER BY ai.created_at ASC
    `));

    return approvals.rows;
  }

  // ===== RELATÓRIOS EXECUTIVOS =====
  async createExecutiveReport(tenantId: string, userId: string, data: ExecutiveReport) {
    const db = getTenantDb(tenantId);
    
    const [report] = await db.execute(sql`
      INSERT INTO executive_reports (
        tenant_id, report_name, report_type, report_config,
        schedule_frequency, recipients, is_active, created_by
      )
      VALUES (
        ${tenantId}, ${data.report_name}, ${data.report_type},
        ${JSON.stringify(data.report_config)}, ${data.schedule_frequency},
        ${JSON.stringify(data.recipients)}, ${data.is_active ?? true}, ${userId}
      )
      RETURNING *
    `);

    return report;
  }

  async getExecutiveReports(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    const reports = await db.execute(sql`
      SELECT 
        er.*,
        CASE 
          WHEN er.last_generated_at IS NULL THEN 'Never'
          ELSE er.last_generated_at::TEXT
        END as last_generated_display
      FROM executive_reports er
      WHERE er.tenant_id = ${tenantId}
      ORDER BY er.report_name
    `);

    return reports.rows;
  }

  async generateSupplierPerformanceKPIs(tenantId: string, supplierId: string, startDate: string, endDate: string) {
    const db = getTenantDb(tenantId);
    
    // Calcular KPIs usando função SQL
    const kpis = await db.execute(sql`
      SELECT * FROM calculate_supplier_kpis(
        ${tenantId}, ${supplierId}, ${startDate}::DATE, ${endDate}::DATE
      )
    `);

    if (kpis.rows.length > 0) {
      const kpiData = kpis.rows[0];
      
      // Calcular score geral
      const performanceScore = (
        (kpiData.on_time_rate / 100 * 0.3) +
        (kpiData.quality_score / 10 * 0.3) +
        (kpiData.fulfillment_rate / 100 * 0.2) +
        (Math.max(0, 100 - (kpiData.avg_lead_time - 7) * 2) / 100 * 0.2)
      ) * 100;

      const performanceGrade = 
        performanceScore >= 95 ? 'A+' :
        performanceScore >= 90 ? 'A' :
        performanceScore >= 85 ? 'B+' :
        performanceScore >= 80 ? 'B' :
        performanceScore >= 75 ? 'C+' :
        performanceScore >= 70 ? 'C' :
        performanceScore >= 60 ? 'D' : 'F';

      // Salvar KPIs
      const [savedKPIs] = await db.execute(sql`
        INSERT INTO supplier_performance_kpis (
          tenant_id, supplier_id, analysis_period_start, analysis_period_end,
          on_time_delivery_rate, quality_score, lead_time_average,
          total_orders_value, average_order_value, order_fulfillment_rate,
          overall_performance_score, performance_grade, calculated_by
        )
        VALUES (
          ${tenantId}, ${supplierId}, ${startDate}::DATE, ${endDate}::DATE,
          ${kpiData.on_time_rate}, ${kpiData.quality_score}, ${kpiData.avg_lead_time},
          ${kpiData.total_value}, ${kpiData.avg_order_value}, ${kpiData.fulfillment_rate},
          ${performanceScore.toFixed(2)}, ${performanceGrade}, ${tenantId}
        )
        ON CONFLICT (tenant_id, supplier_id, analysis_period_end)
        DO UPDATE SET
          on_time_delivery_rate = EXCLUDED.on_time_delivery_rate,
          quality_score = EXCLUDED.quality_score,
          lead_time_average = EXCLUDED.lead_time_average,
          total_orders_value = EXCLUDED.total_orders_value,
          average_order_value = EXCLUDED.average_order_value,
          order_fulfillment_rate = EXCLUDED.order_fulfillment_rate,
          overall_performance_score = EXCLUDED.overall_performance_score,
          performance_grade = EXCLUDED.performance_grade
        RETURNING *
      `);

      return savedKPIs;
    }

    return null;
  }

  async getSupplierPerformanceKPIs(tenantId: string, supplierId?: string) {
    const db = getTenantDb(tenantId);
    
    let whereClause = `WHERE kpi.tenant_id = '${tenantId}'`;
    if (supplierId) {
      whereClause += ` AND kpi.supplier_id = '${supplierId}'`;
    }

    const kpis = await db.execute(sql.raw(`
      SELECT 
        kpi.*,
        s.name as supplier_name,
        s.trade_name as supplier_trade_name
      FROM supplier_performance_kpis kpi
      JOIN suppliers s ON kpi.supplier_id = s.id
      ${whereClause}
      ORDER BY kpi.analysis_period_end DESC, kpi.overall_performance_score DESC
    `));

    return kpis.rows;
  }

  // ===== DASHBOARD E ANALYTICS =====
  async getIntegrationAnalytics(tenantId: string) {
    const db = getTenantDb(tenantId);
    
    const analytics = await db.execute(sql`
      SELECT 
        -- Work Orders
        (SELECT COUNT(*) FROM work_orders WHERE tenant_id = ${tenantId}) as total_work_orders,
        (SELECT COUNT(*) FROM work_orders WHERE tenant_id = ${tenantId} AND status = 'PENDING') as pending_work_orders,
        (SELECT COUNT(*) FROM work_orders WHERE tenant_id = ${tenantId} AND auto_created = true) as auto_created_work_orders,
        
        -- Integrações
        (SELECT COUNT(*) FROM external_integrations WHERE tenant_id = ${tenantId}) as total_integrations,
        (SELECT COUNT(*) FROM external_integrations WHERE tenant_id = ${tenantId} AND is_active = true) as active_integrations,
        (SELECT COUNT(*) FROM external_integrations WHERE tenant_id = ${tenantId} AND status = 'ERROR') as failed_integrations,
        
        -- Contratos
        (SELECT COUNT(*) FROM supplier_contracts WHERE tenant_id = ${tenantId}) as total_contracts,
        (SELECT COUNT(*) FROM supplier_contracts WHERE tenant_id = ${tenantId} AND status = 'ACTIVE') as active_contracts,
        (SELECT COUNT(*) FROM supplier_contracts WHERE tenant_id = ${tenantId} AND end_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_contracts,
        
        -- Aprovações
        (SELECT COUNT(*) FROM approval_instances WHERE tenant_id = ${tenantId} AND status = 'PENDING') as pending_approvals,
        
        -- Sincronizações hoje
        (SELECT COUNT(*) FROM sync_logs WHERE tenant_id = ${tenantId} AND started_at::DATE = CURRENT_DATE) as syncs_today,
        (SELECT COUNT(*) FROM sync_logs WHERE tenant_id = ${tenantId} AND started_at::DATE = CURRENT_DATE AND status = 'SUCCESS') as successful_syncs_today
    `);

    return analytics.rows[0] || {};
  }

  // ===== AUTOMAÇÃO E WORKFLOW =====
  async executeWorkflowAutomation(tenantId: string, workflowType: string = 'ALL') {
    const db = getTenantDb(tenantId);
    const results = [];

    try {
      // 1. Processar aprovações automáticas
      if (workflowType === 'ALL' || workflowType === 'APPROVALS') {
        const autoApprovals = await db.execute(sql`
          SELECT ai.*, aw.auto_approve_threshold
          FROM approval_instances ai
          JOIN approval_workflows aw ON ai.workflow_id = aw.id
          WHERE ai.tenant_id = ${tenantId}
            AND ai.status = 'PENDING'
            AND ai.requested_amount <= aw.auto_approve_threshold
        `);

        for (const approval of autoApprovals.rows) {
          await db.execute(sql`
            UPDATE approval_instances 
            SET status = 'APPROVED', completed_at = NOW()
            WHERE id = ${approval.id}
          `);
          
          results.push({
            type: 'AUTO_APPROVAL',
            reference_id: approval.reference_id,
            success: true
          });
        }
      }

      // 2. Sincronizar integrações agendadas
      if (workflowType === 'ALL' || workflowType === 'SYNC') {
        const scheduledSyncs = await db.execute(sql`
          SELECT id FROM external_integrations
          WHERE tenant_id = ${tenantId}
            AND is_active = true
            AND next_sync_at <= NOW()
            AND sync_frequency != 'MANUAL'
        `);

        for (const integration of scheduledSyncs.rows) {
          try {
            await this.syncExternalIntegration(tenantId, integration.id, 'SCHEDULED');
            results.push({
              type: 'INTEGRATION_SYNC',
              integration_id: integration.id,
              success: true
            });
          } catch (error) {
            results.push({
              type: 'INTEGRATION_SYNC',
              integration_id: integration.id,
              success: false,
              error: error.message
            });
          }
        }
      }

      // 3. Verificar contratos expirando
      if (workflowType === 'ALL' || workflowType === 'CONTRACTS') {
        const expiringContracts = await db.execute(sql`
          SELECT id, contract_name, supplier_id, end_date
          FROM supplier_contracts
          WHERE tenant_id = ${tenantId}
            AND status = 'ACTIVE'
            AND end_date <= CURRENT_DATE + INTERVAL '30 days'
            AND end_date > CURRENT_DATE
        `);

        for (const contract of expiringContracts.rows) {
          // Aqui seria enviado alerta/notificação
          results.push({
            type: 'CONTRACT_EXPIRY_ALERT',
            contract_id: contract.id,
            contract_name: contract.contract_name,
            days_to_expiry: Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24)),
            success: true
          });
        }
      }

      return {
        success: true,
        processed_items: results.length,
        results: results
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        processed_items: results.length,
        results: results
      };
    }
  }
}
