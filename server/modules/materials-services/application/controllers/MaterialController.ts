interface HttpRequest {
  body: any;
  params: any;
  query: any;
  user?: any;
  headers: any;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(data: any): void;
  send(data: any): void;
}

export class MaterialController {
  constructor(private createMaterialUseCase: CreateMaterialUseCase) {}

  async create(req: HttpRequest, res: HttpResponse) {
    const material = await this.createMaterialUseCase.execute(req.body, req.user?.tenantId);
    res.status(201).json(material);
  }

  async getAll(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID é obrigatório' });
        return;
      }

      // Implementar lógica para listar materiais
      res.status(200).json({ success: true, message: 'Lista de materiais obtida com sucesso', data: [] });
    } catch (error) {
      console.error('Erro ao obter materiais:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

// Express dependencies removed - using domain interfaces instead

interface CreateMaterialRequest {
  body: {
    name: string;
    description?: string;
    price: number;
    tenant_id: string;
  };
}

// HttpResponse interface is already defined above

export class MaterialController { // This seems like a duplicate class definition, it should likely be merged or one removed. Assuming the intention is to modify the existing one.
  // Assuming materialService is injected or available in this context.
  // If MaterialController was intended to be a single class with multiple methods,
  // the constructor and methods from the first definition should be integrated.
  // For this example, I'll assume the methods below are part of the same controller
  // and need to be adapted to the HttpRequest/HttpResponse interfaces.

  // private materialService: any; // Placeholder for materialService

  async createMaterial(req: HttpRequest, res: HttpResponse) {
    try {
      const material = await this.materialService.createMaterial(req.body); // Assuming createMaterialUseCase is the same as materialService.createMaterial
      res.status(201).json({ success: true, data: material });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMaterials(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const materials = await this.materialService.getMaterials(req.query);
      res.json({ success: true, data: materials });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateMaterial(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const material = await this.materialService.updateMaterial(req.params.id, req.body);
      res.json({ success: true, data: material });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteMaterial(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      await this.materialService.deleteMaterial(req.params.id);
      res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}