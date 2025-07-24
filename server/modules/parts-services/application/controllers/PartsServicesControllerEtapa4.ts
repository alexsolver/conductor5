
import { Request, Response } from 'express';
import { PartsServicesRepositoryEtapa4 } from '../../../parts-services/infrastructure/repositories/PartsServicesRepositoryEtapa4';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
  };
}

export class PartsServicesControllerEtapa4 {
  private repository: PartsServicesRepositoryEtapa4;

  constructor(repository: PartsServicesRepositoryEtapa4) {
    this.repository = repository;
  }

  // ===== WORK ORDERS AUTOMÁTICOS =====
  createWorkOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID e User ID são obrigatórios' 
        });
      }

      const { 
        title, 
        description, 
        priority = 'MEDIUM', 
        work_order_type = 'MAINTENANCE',
        part_id,
        location_id,
        estimated_quantity = 1,
        scheduled_date,
        due_date,
        assigned_to,
        estimated_cost = 0,
        labor_hours = 0
      } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Título é obrigatório'
        });
      }

      // Gerar número único do work order
      const work_order_number = `WO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const workOrder = await this.repository.createWorkOrder(tenantId, userId, {
        work_order_number,
        title,
        description,
        priority,
        work_order_type,
        part_id,
        location_id,
        estimated_quantity,
        scheduled_date,
        due_date,
        assigned_to,
        estimated_cost,
        labor_hours
      });

      res.status(201).json({
        success: true,
        data: workOrder,
        message: 'Work order criado com sucesso'
      });

    } catch (error: any) {
      console.error('Error creating work order:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  };

  getWorkOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const filters = {
        status: req.query.status as string,
        assignedTo: req.query.assigned_to as string,
        autoCreated: req.query.auto_created === 'true' ? true : req.query.auto_created === 'false' ? false : undefined,
        dateFrom: req.query.date_from as string,
        dateTo: req.query.date_to as string
      };

      const workOrders = await this.repository.getWorkOrders(tenantId, filters);

      res.json({
        success: true,
        data: workOrders,
        count: workOrders.length
      });

    } catch (error: any) {
      console.error('Error fetching work orders:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar work orders',
        error: error.message
      });
    }
  };

  updateWorkOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { workOrderId } = req.params;
      const { status } = req.body;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID e User ID são obrigatórios' 
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status é obrigatório'
        });
      }

      const workOrder = await this.repository.updateWorkOrderStatus(tenantId, workOrderId, status, userId);

      res.json({
        success: true,
        data: workOrder,
        message: 'Status do work order atualizado com sucesso'
      });

    } catch (error: any) {
      console.error('Error updating work order status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status do work order',
        error: error.message
      });
    }
  };

  // ===== INTEGRAÇÕES EXTERNAS =====
  createExternalIntegration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID e User ID são obrigatórios' 
        });
      }

      const { 
        integration_name,
        integration_type,
        endpoint_url,
        api_key_encrypted,
        auth_method = 'API_KEY',
        field_mapping = {},
        sync_direction = 'BIDIRECTIONAL',
        sync_frequency = 'DAILY',
        webhook_url,
        webhook_secret,
        is_active = true
      } = req.body;

      if (!integration_name || !integration_type) {
        return res.status(400).json({
          success: false,
          message: 'Nome da integração e tipo são obrigatórios'
        });
      }

      const integration = await this.repository.createExternalIntegration(tenantId, userId, {
        integration_name,
        integration_type,
        endpoint_url,
        api_key_encrypted,
        auth_method,
        field_mapping,
        sync_direction,
        sync_frequency,
        webhook_url,
        webhook_secret,
        is_active
      });

      res.status(201).json({
        success: true,
        data: integration,
        message: 'Integração externa criada com sucesso'
      });

    } catch (error: any) {
      console.error('Error creating external integration:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar integração externa',
        error: error.message
      });
    }
  };

  getExternalIntegrations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const integrations = await this.repository.getExternalIntegrations(tenantId);

      res.json({
        success: true,
        data: integrations,
        count: integrations.length
      });

    } catch (error: any) {
      console.error('Error fetching external integrations:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar integrações externas',
        error: error.message
      });
    }
  };

  syncExternalIntegration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { integrationId } = req.params;
      const { sync_type = 'MANUAL' } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const result = await this.repository.syncExternalIntegration(tenantId, integrationId, sync_type);

      res.json({
        success: true,
        data: result,
        message: 'Sincronização executada com sucesso'
      });

    } catch (error: any) {
      console.error('Error syncing external integration:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao sincronizar integração externa',
        error: error.message
      });
    }
  };

  getSyncLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const integrationId = req.query.integration_id as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await this.repository.getSyncLogs(tenantId, integrationId, limit);

      res.json({
        success: true,
        data: logs,
        count: logs.length
      });

    } catch (error: any) {
      console.error('Error fetching sync logs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar logs de sincronização',
        error: error.message
      });
    }
  };

  // ===== CONTRATOS COM FORNECEDORES =====
  createSupplierContract = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID e User ID são obrigatórios' 
        });
      }

      const { 
        supplier_id,
        contract_name,
        contract_type = 'SUPPLY',
        start_date,
        end_date,
        auto_renewal = false,
        renewal_period_months,
        total_value,
        currency = 'BRL',
        payment_terms,
        delivery_terms,
        status = 'DRAFT',
        minimum_order_value,
        maximum_order_value,
        discount_percentage = 0
      } = req.body;

      if (!supplier_id || !contract_name || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Fornecedor, nome do contrato, data de início e fim são obrigatórios'
        });
      }

      // Gerar número único do contrato
      const contract_number = `CT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const contract = await this.repository.createSupplierContract(tenantId, userId, {
        contract_number,
        supplier_id,
        contract_name,
        contract_type,
        start_date,
        end_date,
        auto_renewal,
        renewal_period_months,
        total_value,
        currency,
        payment_terms,
        delivery_terms,
        status,
        minimum_order_value,
        maximum_order_value,
        discount_percentage
      });

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Contrato com fornecedor criado com sucesso'
      });

    } catch (error: any) {
      console.error('Error creating supplier contract:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar contrato com fornecedor',
        error: error.message
      });
    }
  };

  getSupplierContracts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const filters = {
        supplierId: req.query.supplier_id as string,
        status: req.query.status as string,
        expiringInDays: req.query.expiring_in_days as string
      };

      const contracts = await this.repository.getSupplierContracts(tenantId, filters);

      res.json({
        success: true,
        data: contracts,
        count: contracts.length
      });

    } catch (error: any) {
      console.error('Error fetching supplier contracts:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar contratos com fornecedores',
        error: error.message
      });
    }
  };

  addContractItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const { 
        contract_id,
        part_id,
        contract_price,
        minimum_quantity = 1,
        maximum_quantity,
        lead_time_days = 7,
        unit_of_measure = 'UN',
        effective_from,
        effective_to
      } = req.body;

      if (!contract_id || !part_id || !contract_price) {
        return res.status(400).json({
          success: false,
          message: 'Contrato, peça e preço contratual são obrigatórios'
        });
      }

      const item = await this.repository.addContractItem(tenantId, {
        contract_id,
        part_id,
        contract_price,
        minimum_quantity,
        maximum_quantity,
        lead_time_days,
        unit_of_measure,
        effective_from,
        effective_to
      });

      res.status(201).json({
        success: true,
        data: item,
        message: 'Item adicionado ao contrato com sucesso'
      });

    } catch (error: any) {
      console.error('Error adding contract item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar item ao contrato',
        error: error.message
      });
    }
  };

  getContractItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { contractId } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const items = await this.repository.getContractItems(tenantId, contractId);

      res.json({
        success: true,
        data: items,
        count: items.length
      });

    } catch (error: any) {
      console.error('Error fetching contract items:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar itens do contrato',
        error: error.message
      });
    }
  };

  // ===== APROVAÇÕES =====
  getPendingApprovals = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const approvals = await this.repository.getPendingApprovals(tenantId, userId);

      res.json({
        success: true,
        data: approvals,
        count: approvals.length
      });

    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar aprovações pendentes',
        error: error.message
      });
    }
  };

  // ===== RELATÓRIOS EXECUTIVOS =====
  createExecutiveReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID e User ID são obrigatórios' 
        });
      }

      const { 
        report_name,
        report_type,
        report_config,
        schedule_frequency = 'MONTHLY',
        recipients = [],
        is_active = true
      } = req.body;

      if (!report_name || !report_type || !report_config) {
        return res.status(400).json({
          success: false,
          message: 'Nome, tipo e configuração do relatório são obrigatórios'
        });
      }

      const report = await this.repository.createExecutiveReport(tenantId, userId, {
        report_name,
        report_type,
        report_config,
        schedule_frequency,
        recipients,
        is_active
      });

      res.status(201).json({
        success: true,
        data: report,
        message: 'Relatório executivo criado com sucesso'
      });

    } catch (error: any) {
      console.error('Error creating executive report:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar relatório executivo',
        error: error.message
      });
    }
  };

  getExecutiveReports = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const reports = await this.repository.getExecutiveReports(tenantId);

      res.json({
        success: true,
        data: reports,
        count: reports.length
      });

    } catch (error: any) {
      console.error('Error fetching executive reports:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar relatórios executivos',
        error: error.message
      });
    }
  };

  // ===== KPIs DE FORNECEDORES =====
  generateSupplierKPIs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const { supplier_id, start_date, end_date } = req.body;

      if (!supplier_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Fornecedor, data de início e fim são obrigatórios'
        });
      }

      const kpis = await this.repository.generateSupplierPerformanceKPIs(tenantId, supplier_id, start_date, end_date);

      res.json({
        success: true,
        data: kpis,
        message: 'KPIs de fornecedor gerados com sucesso'
      });

    } catch (error: any) {
      console.error('Error generating supplier KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar KPIs de fornecedor',
        error: error.message
      });
    }
  };

  getSupplierKPIs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const supplierId = req.query.supplier_id as string;
      const kpis = await this.repository.getSupplierPerformanceKPIs(tenantId, supplierId);

      res.json({
        success: true,
        data: kpis,
        count: kpis.length
      });

    } catch (error: any) {
      console.error('Error fetching supplier KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar KPIs de fornecedores',
        error: error.message
      });
    }
  };

  // ===== DASHBOARD E ANALYTICS =====
  getIntegrationAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const analytics = await this.repository.getIntegrationAnalytics(tenantId);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error: any) {
      console.error('Error fetching integration analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar analytics de integração',
        error: error.message
      });
    }
  };

  // ===== AUTOMAÇÃO E WORKFLOW =====
  executeWorkflowAutomation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID é obrigatório' 
        });
      }

      const { workflow_type = 'ALL' } = req.body;

      const result = await this.repository.executeWorkflowAutomation(tenantId, workflow_type);

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 
          `Automação executada: ${result.processed_items} itens processados` :
          'Erro na execução da automação'
      });

    } catch (error: any) {
      console.error('Error executing workflow automation:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao executar automação de workflow',
        error: error.message
      });
    }
  };
}
