
import { UpdateFieldLayoutDTO } from '../dto/UpdateFieldLayoutDTO';
import { FieldLayoutApplicationService } from '../services/FieldLayoutApplicationService';

export class UpdateFieldLayoutUseCase {
  constructor(private applicationService: FieldLayoutApplicationService) {}

  async execute(dto: UpdateFieldLayoutDTO) {
    return await this.applicationService.updateFieldLayout(dto);
  }
}
