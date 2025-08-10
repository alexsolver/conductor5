
export class CreateMaterialUseCase {
  constructor(private materialRepository: any) {}

  async execute(data: any): Promise<any> {
    // Validar dados
    // Criar material
    // Retornar resultado
    return this.materialRepository.create(data);
  }
}

export class CreateServiceUseCase {
  constructor(private serviceRepository: any) {}

  async execute(data: any): Promise<any> {
    return this.serviceRepository.create(data);
  }
}
