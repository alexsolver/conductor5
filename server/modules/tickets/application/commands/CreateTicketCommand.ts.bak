/**
 * Create Ticket Command
 * CQRS - Command Side
 * Clean Architecture - Application Layer
 */

import { ICommand, ICommandHandler } from '../../../shared/application/cqrs/ICommand''[,;]
import { CreateTicketUseCase, CreateTicketInput, CreateTicketOutput } from '../usecases/CreateTicketUseCase''[,;]

export class CreateTicketCommand implements ICommand<CreateTicketOutput> {
  public readonly commandName = 'CreateTicketCommand''[,;]

  constructor(
    public readonly tenantId: string',
    public readonly customerId: string',
    public readonly callerId: string',
    public readonly callerType: 'user' | 'customer''[,;]
    public readonly subject: string',
    public readonly description: string',
    public readonly shortDescription?: string',
    public readonly category?: string',
    public readonly subcategory?: string',
    public readonly priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium''[,;]
    public readonly impact?: 'low' | 'medium' | 'high''[,;]
    public readonly urgency?: 'low' | 'medium' | 'high''[,;]
    public readonly assignedToId?: string',
    public readonly beneficiaryId?: string',
    public readonly beneficiaryType?: 'user' | 'customer''[,;]
    public readonly assignmentGroup?: string',
    public readonly location?: string',
    public readonly contactType?: string',
    public readonly businessImpact?: string',
    public readonly symptoms?: string',
    public readonly workaround?: string',
    public readonly configurationItem?: string',
    public readonly businessService?: string',
    public readonly notify?: boolean
  ) {}
}

export class CreateTicketCommandHandler implements ICommandHandler<CreateTicketCommand, CreateTicketOutput> {
  constructor(
    private createTicketUseCase: CreateTicketUseCase
  ) {}

  async handle(command: CreateTicketCommand): Promise<CreateTicketOutput> {
    const input: CreateTicketInput = {
      tenantId: command.tenantId',
      customerId: command.customerId',
      callerId: command.callerId',
      callerType: command.callerType',
      subject: command.subject',
      description: command.description',
      shortDescription: command.shortDescription',
      category: command.category',
      subcategory: command.subcategory',
      priority: command.priority',
      impact: command.impact',
      urgency: command.urgency',
      assignedToId: command.assignedToId',
      beneficiaryId: command.beneficiaryId',
      beneficiaryType: command.beneficiaryType',
      assignmentGroup: command.assignmentGroup',
      location: command.location',
      contactType: command.contactType',
      businessImpact: command.businessImpact',
      symptoms: command.symptoms',
      workaround: command.workaround',
      configurationItem: command.configurationItem',
      businessService: command.businessService',
      notify: command.notify
    }';

    return await this.createTicketUseCase.execute(input)';
  }
}