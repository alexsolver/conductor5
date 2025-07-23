import { Router } from 'express';
import { ContractRepository } from '../repositories/ContractRepository';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { insertContractSchema, insertContractSlaSchema, insertContractServiceSchema, insertContractDocumentSchema, insertContractRenewalSchema, insertContractBillingSchema, insertContractEquipmentSchema } from '@shared/schema';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';

const router = Router();
const contractRepository = new ContractRepository();

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/contracts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(pdf|doc|docx|xls|xlsx|txt|png|jpg|jpeg)$/i;
    if (allowedTypes.test(file.originalname)) {
      return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não permitido'));
  }
});

// ========================================
// CONTRACTS ROUTES
// ========================================

// Create contract
router.post('/contracts', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Add tenant and user data to request body
    const contractData = {
      ...req.body,
      tenantId: req.user!.tenantId,
      contractNumber: `CTR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, // Auto-generate
    };
    
    const validatedData = insertContractSchema.parse(contractData);
    const contract = await contractRepository.createContract(validatedData, req.user!.tenantId, req.user!.id);
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contracts with filters
router.get('/contracts', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      contractType: req.query.contractType as string,
      priority: req.query.priority as string,
      customerId: req.query.customerId as string,
      managerId: req.query.managerId as string,
      searchTerm: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const contracts = await contractRepository.getContracts(req.user!.tenantId, filters);
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contract by ID
router.get('/contracts/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contract = await contractRepository.getContractById(req.params.id, req.user!.tenantId);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato não encontrado' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Update contract
router.put('/contracts/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractSchema.partial().parse(req.body);
    const contract = await contractRepository.updateContract(req.params.id, validatedData, req.user!.tenantId, req.user!.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato não encontrado' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Delete contract (soft delete)
router.delete('/contracts/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contract = await contractRepository.deleteContract(req.params.id, req.user!.tenantId);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato não encontrado' });
    }
    res.json({ message: 'Contrato excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ========================================
// CONTRACT SLA ROUTES
// ========================================

// Create contract SLA
router.post('/contracts/:contractId/slas', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractSlaSchema.parse({
      ...req.body,
      contractId: req.params.contractId
    });
    const sla = await contractRepository.createContractSla(validatedData, req.user!.tenantId);
    res.status(201).json(sla);
  } catch (error) {
    console.error('Error creating contract SLA:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contract SLAs
router.get('/contracts/:contractId/slas', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const slas = await contractRepository.getContractSlas(req.params.contractId, req.user!.tenantId);
    res.json(slas);
  } catch (error) {
    console.error('Error fetching contract SLAs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Update contract SLA
router.put('/slas/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractSlaSchema.partial().parse(req.body);
    const sla = await contractRepository.updateContractSla(req.params.id, validatedData, req.user!.tenantId);
    if (!sla) {
      return res.status(404).json({ message: 'SLA não encontrado' });
    }
    res.json(sla);
  } catch (error) {
    console.error('Error updating contract SLA:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Delete contract SLA
router.delete('/slas/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const sla = await contractRepository.deleteContractSla(req.params.id, req.user!.tenantId);
    if (!sla) {
      return res.status(404).json({ message: 'SLA não encontrado' });
    }
    res.json({ message: 'SLA excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting contract SLA:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ========================================
// CONTRACT SERVICES ROUTES
// ========================================

// Create contract service
router.post('/contracts/:contractId/services', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractServiceSchema.parse({
      ...req.body,
      contractId: req.params.contractId
    });
    const service = await contractRepository.createContractService(validatedData, req.user!.tenantId);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating contract service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contract services
router.get('/contracts/:contractId/services', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const services = await contractRepository.getContractServices(req.params.contractId, req.user!.tenantId);
    res.json(services);
  } catch (error) {
    console.error('Error fetching contract services:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Update contract service
router.put('/services/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractServiceSchema.partial().parse(req.body);
    const service = await contractRepository.updateContractService(req.params.id, validatedData, req.user!.tenantId);
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error updating contract service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Delete contract service
router.delete('/services/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const service = await contractRepository.deleteContractService(req.params.id, req.user!.tenantId);
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    res.json({ message: 'Serviço excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting contract service:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ========================================
// CONTRACT DOCUMENTS ROUTES
// ========================================

// Upload contract document
router.post('/contracts/:contractId/documents', jwtAuth, upload.single('document'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const documentData = {
      contractId: req.params.contractId,
      documentName: req.body.documentName || req.file.originalname,
      documentType: req.body.documentType || 'contract',
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: req.body.description,
      requiresSignature: req.body.requiresSignature === 'true',
      accessLevel: req.body.accessLevel || 'internal',
    };

    const validatedData = insertContractDocumentSchema.parse(documentData);
    const document = await contractRepository.createContractDocument(validatedData, req.user!.tenantId, req.user!.id);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading contract document:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contract documents
router.get('/contracts/:contractId/documents', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const documents = await contractRepository.getContractDocuments(req.params.contractId, req.user!.tenantId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching contract documents:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Update contract document
router.put('/documents/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractDocumentSchema.partial().parse(req.body);
    const document = await contractRepository.updateContractDocument(req.params.id, validatedData, req.user!.tenantId);
    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error updating contract document:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Delete contract document
router.delete('/documents/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const document = await contractRepository.deleteContractDocument(req.params.id, req.user!.tenantId);
    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }
    res.json({ message: 'Documento excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting contract document:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ========================================
// CONTRACT RENEWALS ROUTES
// ========================================

// Create contract renewal
router.post('/contracts/:contractId/renewals', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractRenewalSchema.parse({
      ...req.body,
      contractId: req.params.contractId
    });
    const renewal = await contractRepository.createContractRenewal(validatedData, req.user!.tenantId, req.user!.id);
    res.status(201).json(renewal);
  } catch (error) {
    console.error('Error creating contract renewal:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contract renewals
router.get('/contracts/:contractId/renewals', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const renewals = await contractRepository.getContractRenewals(req.params.contractId, req.user!.tenantId);
    res.json(renewals);
  } catch (error) {
    console.error('Error fetching contract renewals:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Update contract renewal
router.put('/renewals/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractRenewalSchema.partial().parse(req.body);
    const renewal = await contractRepository.updateContractRenewal(req.params.id, validatedData, req.user!.tenantId);
    if (!renewal) {
      return res.status(404).json({ message: 'Renovação não encontrada' });
    }
    res.json(renewal);
  } catch (error) {
    console.error('Error updating contract renewal:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ========================================
// CONTRACT BILLING ROUTES
// ========================================

// Create contract billing
router.post('/contracts/:contractId/billing', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractBillingSchema.parse({
      ...req.body,
      contractId: req.params.contractId
    });
    const billing = await contractRepository.createContractBilling(validatedData, req.user!.tenantId, req.user!.id);
    res.status(201).json(billing);
  } catch (error) {
    console.error('Error creating contract billing:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contract billing
router.get('/contracts/:contractId/billing', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      paymentStatus: req.query.paymentStatus as string,
    };

    const billing = await contractRepository.getContractBilling(req.params.contractId, req.user!.tenantId, filters);
    res.json(billing);
  } catch (error) {
    console.error('Error fetching contract billing:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Update contract billing
router.put('/billing/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractBillingSchema.partial().parse(req.body);
    const billing = await contractRepository.updateContractBilling(req.params.id, validatedData, req.user!.tenantId);
    if (!billing) {
      return res.status(404).json({ message: 'Faturamento não encontrado' });
    }
    res.json(billing);
  } catch (error) {
    console.error('Error updating contract billing:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ========================================
// CONTRACT EQUIPMENT ROUTES
// ========================================

// Create contract equipment
router.post('/contracts/:contractId/equipment', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractEquipmentSchema.parse({
      ...req.body,
      contractId: req.params.contractId
    });
    const equipment = await contractRepository.createContractEquipment(validatedData, req.user!.tenantId);
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating contract equipment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contract equipment
router.get('/contracts/:contractId/equipment', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const equipment = await contractRepository.getContractEquipment(req.params.contractId, req.user!.tenantId);
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching contract equipment:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Update contract equipment
router.put('/equipment/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContractEquipmentSchema.partial().parse(req.body);
    const equipment = await contractRepository.updateContractEquipment(req.params.id, validatedData, req.user!.tenantId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipamento não encontrado' });
    }
    res.json(equipment);
  } catch (error) {
    console.error('Error updating contract equipment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Delete contract equipment
router.delete('/equipment/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const equipment = await contractRepository.deleteContractEquipment(req.params.id, req.user!.tenantId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipamento não encontrado' });
    }
    res.json({ message: 'Equipamento excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting contract equipment:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ========================================
// DASHBOARD AND ANALYTICS ROUTES
// ========================================

// Get contract statistics
router.get('/dashboard/stats', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await contractRepository.getContractStats(req.user!.tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contracts by status
router.get('/dashboard/status-distribution', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const distribution = await contractRepository.getContractsByStatus(req.user!.tenantId);
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching contract status distribution:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get contracts by type
router.get('/dashboard/type-distribution', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const distribution = await contractRepository.getContractsByType(req.user!.tenantId);
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching contract type distribution:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get upcoming renewals
router.get('/dashboard/upcoming-renewals', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const renewals = await contractRepository.getUpcomingRenewals(req.user!.tenantId, days);
    res.json(renewals);
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;