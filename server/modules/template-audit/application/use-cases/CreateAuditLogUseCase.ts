
export class CreateAuditLogUseCase {
  constructor(private auditRepository: any) {}

  async execute(data: any): Promise<any> {
    return this.auditRepository.create(data);
  }
}
