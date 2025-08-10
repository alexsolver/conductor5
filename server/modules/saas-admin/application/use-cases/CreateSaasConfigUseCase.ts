
import { SaasAdminDomainService } from '../../domain/services/SaasAdminDomainService';

export class CreateSaasConfigUseCase {
  constructor(
    private readonly saasAdminDomainService: SaasAdminDomainService
  ) {}
  
  async execute(configData: any): Promise<any> {
    // Implementar caso de uso
    const isValid = this.saasAdminDomainService.validateSaasConfiguration(configData);
    
    if (!isValid) {
      throw new Error('Configuração SaaS inválida');
    }
    
    // Criar configuração
    return {};
  }
}
import { SaasConfig } from '../../domain/entities/SaasConfig';
import { ISaasConfigRepository } from '../../domain/ports/ISaasConfigRepository';

export class CreateSaasConfigUseCase {
  constructor(private saasConfigRepository: ISaasConfigRepository) {}

  async execute(configData: any): Promise<SaasConfig> {
    const config = new SaasConfig(configData);
    
    return await this.saasConfigRepository.create(config);
  }
}
