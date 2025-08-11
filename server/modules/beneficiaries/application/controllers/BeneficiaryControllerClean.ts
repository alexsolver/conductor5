
import { BeneficiaryApplicationService } from '../services/BeneficiaryApplicationService';

export class BeneficiaryControllerClean {
  constructor(private beneficiaryService: BeneficiaryApplicationService) {}

  async getAllBeneficiaries(filters: any) {
    return this.beneficiaryService.getAllBeneficiaries(filters);
  }

  async createBeneficiary(data: any) {
    return this.beneficiaryService.createBeneficiary(data);
  }
}
