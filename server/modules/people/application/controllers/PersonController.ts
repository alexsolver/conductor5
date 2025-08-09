import { CreatePersonUseCase } from '../use-cases/CreatePersonUseCase';
import { UpdatePersonUseCase } from '../use-cases/UpdatePersonUseCase';

export interface PersonControllerRequest {
  name?: string;
  email?: string;
  phone?: string;
  tenantId: string;
  id?: string;
}

export interface PersonControllerResponse {
  success: boolean;
  data: any;
  message?: string;
}

export class PersonController {
  constructor(
    private readonly createPersonUseCase: CreatePersonUseCase,
    private readonly updatePersonUseCase: UpdatePersonUseCase
  ) {}

  async create(request: PersonControllerRequest): Promise<PersonControllerResponse> {
    try {
      const result = await this.createPersonUseCase.execute({
        name: request.name!,
        email: request.email!,
        phone: request.phone,
        tenantId: request.tenantId
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to create person: ${error}`);
    }
  }

  async update(request: PersonControllerRequest): Promise<PersonControllerResponse> {
    try {
      const result = await this.updatePersonUseCase.execute({
        id: request.id!,
        name: request.name,
        email: request.email,
        phone: request.phone,
        tenantId: request.tenantId
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to update person: ${error}`);
    }
  }
}