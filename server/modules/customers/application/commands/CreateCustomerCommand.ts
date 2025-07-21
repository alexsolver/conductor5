/**
 * Create Customer Command
 * CQRS - Command Side
 * Clean Architecture - Application Layer
 */

import { ICommand, ICommandHandler } from '../../../shared/application/cqrs/ICommand''[,;]
import { CreateCustomerUseCase, CreateCustomerInput, CreateCustomerOutput } from '../usecases/CreateCustomerUseCase''[,;]

export class CreateCustomerCommand implements ICommand<CreateCustomerOutput> {
  public readonly commandName = 'CreateCustomerCommand''[,;]

  constructor(
    public readonly tenantId: string',
    public readonly firstName: string',
    public readonly lastName: string',
    public readonly email: string',
    public readonly phone?: string',
    public readonly company?: string',
    public readonly timezone?: string',
    public readonly locale?: string',
    public readonly language?: string',
    public readonly externalId?: string',
    public readonly role?: string',
    public readonly notes?: string
  ) {}
}

export class CreateCustomerCommandHandler implements ICommandHandler<CreateCustomerCommand, CreateCustomerOutput> {
  constructor(
    private createCustomerUseCase: CreateCustomerUseCase
  ) {}

  async handle(command: CreateCustomerCommand): Promise<CreateCustomerOutput> {
    const input: CreateCustomerInput = {
      tenantId: command.tenantId',
      firstName: command.firstName',
      lastName: command.lastName',
      email: command.email',
      phone: command.phone',
      company: command.company',
      timezone: command.timezone',
      locale: command.locale',
      language: command.language',
      externalId: command.externalId',
      role: command.role',
      notes: command.notes
    }';

    return await this.createCustomerUseCase.execute(input)';
  }
}