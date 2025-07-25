import { Request, Response } from 'express';
import { PartsServicesLinksRepository } from './links-repository';

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    userId: string;
  };
}
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const linksRepository = new PartsServicesLinksRepository();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'item-attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Permitir apenas tipos de arquivo seguros
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

export class PartsServicesLinksController {
  
  // ============================================
  // VÍNCULOS ITEM-ITEM
  // ============================================
  
  async createItemLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const link = await linksRepository.createItemLink(tenantId, req.body);
      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating item link:', error);
      res.status(500).json({ message: 'Erro ao criar vínculo entre itens' });
    }
  }
  
  async getItemLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { itemId } = req.params;
      const links = await linksRepository.getItemLinks(tenantId, itemId);
      res.json(links);
    } catch (error) {
      console.error('Error fetching item links:', error);
      res.status(500).json({ message: 'Erro ao buscar vínculos do item' });
    }
  }
  
  async deleteItemLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { linkId } = req.params;
      await linksRepository.deleteItemLink(tenantId, linkId);
      res.json({ message: 'Vínculo removido com sucesso' });
    } catch (error) {
      console.error('Error deleting item link:', error);
      res.status(500).json({ message: 'Erro ao remover vínculo' });
    }
  }
  
  // ============================================
  // VÍNCULOS ITEM-CLIENTE
  // ============================================
  
  async createItemCustomerLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const link = await linksRepository.createItemCustomerLink(tenantId, req.body);
      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating item-customer link:', error);
      res.status(500).json({ message: 'Erro ao criar vínculo item-cliente' });
    }
  }
  
  async getItemCustomerLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { itemId } = req.params;
      const links = await linksRepository.getItemCustomerLinks(tenantId, itemId);
      res.json(links);
    } catch (error) {
      console.error('Error fetching item-customer links:', error);
      res.status(500).json({ message: 'Erro ao buscar vínculos item-cliente' });
    }
  }
  
  async updateItemCustomerLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { linkId } = req.params;
      const updated = await linksRepository.updateItemCustomerLink(tenantId, linkId, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating item-customer link:', error);
      res.status(500).json({ message: 'Erro ao atualizar vínculo item-cliente' });
    }
  }
  
  // ============================================
  // VÍNCULOS ITEM-FORNECEDOR
  // ============================================
  
  async createItemSupplierLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const link = await linksRepository.createItemSupplierLink(tenantId, req.body);
      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating item-supplier link:', error);
      res.status(500).json({ message: 'Erro ao criar vínculo item-fornecedor' });
    }
  }
  
  async getItemSupplierLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { itemId } = req.params;
      const links = await linksRepository.getItemSupplierLinks(tenantId, itemId);
      res.json(links);
    } catch (error) {
      console.error('Error fetching item-supplier links:', error);
      res.status(500).json({ message: 'Erro ao buscar vínculos item-fornecedor' });
    }
  }
  
  // ============================================
  // ANEXOS (UPLOAD DE ARQUIVOS)
  // ============================================
  
  async uploadItemAttachment(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const { itemId } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }
      
      const attachmentData = {
        itemId,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        attachmentType: req.body.attachmentType || 'other',
        description: req.body.description || '',
        uploadedBy: userId
      };
      
      const attachment = await linksRepository.createItemAttachment(tenantId, attachmentData);
      res.status(201).json(attachment);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      res.status(500).json({ message: 'Erro ao fazer upload do arquivo' });
    }
  }
  
  async getItemAttachments(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { itemId } = req.params;
      const attachments = await linksRepository.getItemAttachments(tenantId, itemId);
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      res.status(500).json({ message: 'Erro ao buscar anexos' });
    }
  }
  
  async deleteItemAttachment(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { attachmentId } = req.params;
      await linksRepository.deleteItemAttachment(tenantId, attachmentId);
      res.json({ message: 'Anexo removido com sucesso' });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ message: 'Erro ao remover anexo' });
    }
  }
  
  // ============================================
  // KITS DE SERVIÇO
  // ============================================
  
  async createServiceKit(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const kitData = { ...req.body, createdBy: userId };
      const kit = await linksRepository.createServiceKit(tenantId, kitData);
      res.status(201).json(kit);
    } catch (error) {
      console.error('Error creating service kit:', error);
      res.status(500).json({ message: 'Erro ao criar kit de serviço' });
    }
  }
  
  async getServiceKits(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const kits = await linksRepository.getServiceKits(tenantId);
      res.json(kits);
    } catch (error) {
      console.error('Error fetching service kits:', error);
      res.status(500).json({ message: 'Erro ao buscar kits de serviço' });
    }
  }
  
  async addItemToKit(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const kitItem = await linksRepository.addItemToKit(tenantId, req.body);
      res.status(201).json(kitItem);
    } catch (error) {
      console.error('Error adding item to kit:', error);
      res.status(500).json({ message: 'Erro ao adicionar item ao kit' });
    }
  }
  
  async getKitItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { kitId } = req.params;
      const items = await linksRepository.getKitItems(tenantId, kitId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching kit items:', error);
      res.status(500).json({ message: 'Erro ao buscar itens do kit' });
    }
  }
}

// Instância do controller e middleware de upload
export const linksController = new PartsServicesLinksController();
export const uploadAttachment = upload.single('file');