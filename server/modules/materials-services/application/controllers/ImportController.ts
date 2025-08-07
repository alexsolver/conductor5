
import { Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
}

interface CSVItem {
  nome: string;
  tipo: 'material' | 'service';
  codigo?: string;
  descricao?: string;
  unidade: string;
  categoria?: string;
  tags?: string;
}

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/csv/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export class ImportController {
  constructor(private itemRepository: ItemRepository) {}

  // Middleware for file upload
  uploadMiddleware = upload.single('csvFile');

  async importItemsFromCSV(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }

      const results: CSVItem[] = [];
      const errors: string[] = [];
      let lineNumber = 1;

      // Parse CSV file
      const parsePromise = new Promise<void>((resolve, reject) => {
        fs.createReadStream(req.file!.path)
          .pipe(csv({
            mapHeaders: ({ header }) => header.toLowerCase().trim()
          }))
          .on('data', (data) => {
            lineNumber++;
            
            // Validate required fields
            if (!data.nome || !data.nome.trim()) {
              errors.push(`Linha ${lineNumber}: Campo 'nome' é obrigatório`);
              return;
            }

            if (!data.tipo || !['material', 'service'].includes(data.tipo.toLowerCase())) {
              errors.push(`Linha ${lineNumber}: Campo 'tipo' deve ser 'material' ou 'service'`);
              return;
            }

            if (!data.unidade || !data.unidade.trim()) {
              errors.push(`Linha ${lineNumber}: Campo 'unidade' é obrigatório`);
              return;
            }

            // Process valid row
            const item: CSVItem = {
              nome: data.nome.trim(),
              tipo: data.tipo.toLowerCase() as 'material' | 'service',
              codigo: data.codigo?.trim() || undefined,
              descricao: data.descricao?.trim() || undefined,
              unidade: data.unidade.trim(),
              categoria: data.categoria?.trim() || undefined,
              tags: data.tags?.trim() || undefined
            };

            results.push(item);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      await parsePromise;

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Return validation errors if any
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Erros de validação encontrados',
          errors,
          validItems: results.length
        });
      }

      // Import valid items
      const importedItems = [];
      const importErrors = [];

      for (const csvItem of results) {
        try {
          const itemData = {
            tenantId,
            name: csvItem.nome,
            type: csvItem.tipo,
            integrationCode: csvItem.codigo,
            description: csvItem.descricao,
            measurementUnit: csvItem.unidade,
            active: true,
            createdBy: req.user?.id
          };

          const item = await this.itemRepository.create(itemData);
          importedItems.push(item);

          // Create audit log
          await this.createAuditLog(tenantId, item.id, 'create', null, itemData, req.user?.id);

        } catch (error) {
          importErrors.push(`Erro ao importar item '${csvItem.nome}': ${(error as Error).message}`);
        }
      }

      res.json({
        success: true,
        message: `Importação concluída`,
        data: {
          totalProcessed: results.length,
          imported: importedItems.length,
          errors: importErrors.length,
          items: importedItems
        },
        errors: importErrors.length > 0 ? importErrors : undefined
      });

    } catch (error) {
      // Clean up file if error occurs
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Error importing CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import CSV file',
        error: (error as Error).message
      });
    }
  }

  async downloadTemplate(req: Request, res: Response) {
    try {
      const csvTemplate = [
        'nome,tipo,codigo,descricao,unidade,categoria,tags',
        'Parafuso M6,material,PAR001,Parafuso métrico 6mm,UN,Fixação,parafuso;fixação',
        'Manutenção Preventiva,service,MAN001,Serviço de manutenção preventiva,H,Manutenção,manutenção;preventiva',
        'Cabo Ethernet,material,CAB001,Cabo de rede categoria 6,M,Rede,cabo;ethernet;rede'
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="template_importacao_itens.csv"');
      res.send(csvTemplate);

    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate template'
      });
    }
  }

  private async createAuditLog(
    tenantId: string,
    entityId: string,
    action: string,
    oldValues: any,
    newValues: any,
    userId?: string
  ) {
    try {
      const { pool } = await import('../../../../db.js');
      
      const query = `
        INSERT INTO tenant_${tenantId.replace(/-/g, '_')}.audit_logs 
        (tenant_id, entity_type, entity_id, action, old_values, new_values, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;

      await pool.query(query, [
        tenantId,
        'item',
        entityId,
        action,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        userId
      ]);
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}
