
import { CreateFieldLayoutDTO } from '../dto/CreateFieldLayoutDTO';
import { FieldLayoutApplicationService } from '../services/FieldLayoutApplicationService';

export class CreateFieldLayoutUseCase {
  constructor(private applicationService: FieldLayoutApplicationService) {}

  async execute(dto: CreateFieldLayoutDTO) {
    return await this.applicationService.createFieldLayout(dto);
  }
}
