import { Request, Response } from 'express';
import { AssetManagementRepository } from '../../infrastructure/repositories/AssetManagementRepository';

export class AssetManagementController {
  private repository: AssetManagementRepository;

  constructor() {
    this.repository = new AssetManagementRepository();
  }

  // GESTÃO DE ATIVOS
  async getAllAssets(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const assets = await this.repository.getAllAssets(tenantId);
      res.json(assets);
    } catch (error) {
      console.error('Erro ao buscar ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAssetById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const asset = await this.repository.getAssetById(id, tenantId);
      if (!asset) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      res.json(asset);
    } catch (error) {
      console.error('Erro ao buscar ativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createAsset(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const assetData = {
        ...req.body,
        tenantId,
        createdBy: req.user?.id
      };

      const asset = await this.repository.createAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      console.error('Erro ao criar ativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateAsset(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user?.id
      };

      const asset = await this.repository.updateAsset(id, tenantId, updateData);
      if (!asset) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      res.json(asset);
    } catch (error) {
      console.error('Erro ao atualizar ativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteAsset(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.repository.deleteAsset(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir ativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // HIERARQUIA DE ATIVOS
  async getAssetHierarchy(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const hierarchy = await this.repository.getAssetHierarchy(tenantId);
      res.json(hierarchy);
    } catch (error) {
      console.error('Erro ao buscar hierarquia de ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAssetChildren(req: Request, res: Response) {
    try {
      const { parentId } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const children = await this.repository.getAssetChildren(parentId, tenantId);
      res.json(children);
    } catch (error) {
      console.error('Erro ao buscar filhos do ativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // MANUTENÇÃO DE ATIVOS
  async getAllMaintenance(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { assetId } = req.query;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const maintenance = await this.repository.getAllMaintenance(tenantId, assetId as string);
      res.json(maintenance);
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createMaintenance(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const maintenanceData = {
        ...req.body,
        tenantId
      };

      const maintenance = await this.repository.createMaintenance(maintenanceData);
      res.status(201).json(maintenance);
    } catch (error) {
      console.error('Erro ao criar manutenção:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateMaintenance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const maintenance = await this.repository.updateMaintenance(id, tenantId, req.body);
      if (!maintenance) {
        return res.status(404).json({ error: 'Manutenção não encontrada' });
      }

      res.json(maintenance);
    } catch (error) {
      console.error('Erro ao atualizar manutenção:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // MEDIDORES DE ATIVOS
  async getAssetMeters(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const meters = await this.repository.getAssetMeters(assetId, tenantId);
      res.json(meters);
    } catch (error) {
      console.error('Erro ao buscar medidores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async addMeterReading(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const meterData = {
        ...req.body,
        tenantId
      };

      const meter = await this.repository.addMeterReading(meterData);
      res.status(201).json(meter);
    } catch (error) {
      console.error('Erro ao adicionar leitura de medidor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // LOCALIZAÇÃO E GEOLOCALIZAÇÃO
  async updateAssetLocation(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const locationData = {
        ...req.body,
        recordedBy: req.user?.id
      };

      const location = await this.repository.updateAssetLocation(assetId, tenantId, locationData);
      res.json(location);
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAssetLocation(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const location = await this.repository.getAssetLocation(assetId, tenantId);
      res.json(location);
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // QR CODE
  async generateQRCode(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const qrCode = await this.repository.generateQRCode(assetId, tenantId);
      res.json({ qrCode });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAssetByQRCode(req: Request, res: Response) {
    try {
      const { qrCode } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const asset = await this.repository.getAssetByQRCode(qrCode, tenantId);
      if (!asset) {
        return res.status(404).json({ error: 'Ativo não encontrado para este QR Code' });
      }

      res.json(asset);
    } catch (error) {
      console.error('Erro ao buscar ativo por QR Code:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ESTATÍSTICAS
  async getAssetStats(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const stats = await this.repository.getAssetStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}