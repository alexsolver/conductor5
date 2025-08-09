import { 
  CreateBeneficiaryUseCase,
  GetBeneficiariesUseCase,
  UpdateBeneficiaryUseCase,
  DeleteBeneficiaryUseCase
} from '../use-cases';

interface CreateBeneficiaryRequest {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  tenantId: string;
}

interface UpdateBeneficiaryRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
}

interface GetBeneficiariesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
}

interface DeleteBeneficiaryRequest {
  id: string;
  tenantId: string;
}

export class BeneficiaryController {
  constructor(
    private readonly createBeneficiaryUseCase: CreateBeneficiaryUseCase,
    private readonly getBeneficiariesUseCase: GetBeneficiariesUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
    private readonly deleteBeneficiaryUseCase: DeleteBeneficiaryUseCase
  ) {}

  async create(request: CreateBeneficiaryRequest) {
    return await this.createBeneficiaryUseCase.execute(request);
  }

  async getAll(request: GetBeneficiariesRequest) {
    return await this.getBeneficiariesUseCase.execute(request);
  }

  async update(request: UpdateBeneficiaryRequest) {
    return await this.updateBeneficiaryUseCase.execute(request);
  }

  async delete(request: DeleteBeneficiaryRequest) {
    return await this.deleteBeneficiaryUseCase.execute(request);
  }
}