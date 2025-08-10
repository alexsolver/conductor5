import { ISaasConfigRepository } from '../../domain/ports/ISaasConfigRepository';

export class GetConfigsUseCase {
  constructor(private configRepository: ISaasConfigRepository) {}

  async execute(): Promise<any[]> {
    return await this.configRepository.getAllConfigs();
  }
}