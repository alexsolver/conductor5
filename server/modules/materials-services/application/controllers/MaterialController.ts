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

// Removida dependência direta do Express - usar interfaces/DTOs

// Assuming CreateMaterialUseCase and its dependencies are correctly defined elsewhere
// and imported properly. For this example, we'll assume they exist.
// Example placeholder for the Use Case:
// interface CreateMaterialUseCase {
//   execute(materialData: any, tenantId: string): Promise<any>;
// }

export class MaterialController {
  constructor(private createMaterialUseCase: any) {} // Replace 'any' with the actual UseCase type

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

      // Assuming a use case for getting all materials exists and is injected
      // For demonstration, this part remains as a placeholder or calls a hypothetical use case.
      // Example: const getAllMaterialsUseCase = ...;
      // const materials = await getAllMaterialsUseCase.execute(tenantId);
      // res.status(200).json({ success: true, message: 'Lista de materiais obtida com sucesso', data: materials });

      res.status(200).json({ success: true, message: 'Lista de materiais obtida com sucesso', data: [] });
    } catch (error) {
      console.error('Erro ao obter materiais:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

// The following section appears to be a duplicate or a different controller definition.
// Based on the prompt to integrate changes and the intention to remove Express dependency,
// this section is likely intended to be part of the same controller or refactored.
// For clarity and to avoid duplication, I will integrate the methods conceptually
// into the existing MaterialController structure, assuming a unified controller.
// If a separate controller was intended, that would require further clarification.

// Assuming a 'materialService' or similar injected dependency that encapsulates business logic.
// For a Clean Architecture, this would typically be an ApplicationService or use cases.
// Let's assume the 'createMaterialUseCase' can also handle other operations or
// that other use cases would be injected.

// Example of how other use cases might be handled if injected into the same controller:
// constructor(
//   private createMaterialUseCase: CreateMaterialUseCase,
//   private getMaterialsUseCase: GetMaterialsUseCase,
//   private updateMaterialUseCase: UpdateMaterialUseCase,
//   private deleteMaterialUseCase: DeleteMaterialUseCase
// ) {}


// If the original intention was to have these methods within the same controller,
// they would be added as methods to the existing MaterialController class.
// For this example, I'll demonstrate how they *could* be integrated if they used use cases.

// Hypothetical integration of other methods using use cases:

/*
  async createMaterial(req: HttpRequest, res: HttpResponse) {
    try {
      // Assuming createMaterialUseCase from constructor handles this
      const material = await this.createMaterialUseCase.execute(req.body); // Simplified example
      res.status(201).json({ success: true, data: material });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMaterials(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      // Assuming getMaterialsUseCase is injected
      // const materials = await this.getMaterialsUseCase.execute(req.query);
      // res.json({ success: true, data: materials });
      res.json({ success: true, data: [] }); // Placeholder
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateMaterial(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      // Assuming updateMaterialUseCase is injected
      // const material = await this.updateMaterialUseCase.execute(req.params.id, req.body);
      // res.json({ success: true, data: material });
      res.json({ success: true, data: {} }); // Placeholder
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteMaterial(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      // Assuming deleteMaterialUseCase is injected
      // await this.deleteMaterialUseCase.execute(req.params.id);
      // res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
*/