/**
 * Get Tickets Query
 * CQRS - Query Side
 * Clean Architecture - Application Layer
 */

import { IQuery, IQueryHandler } from '../../../shared/application/cqrs/IQuery''[,;]
import { GetTicketsUseCase, GetTicketsInput, GetTicketsOutput } from '../usecases/GetTicketsUseCase''[,;]

export class GetTicketsQuery implements IQuery<GetTicketsOutput> {
  public readonly queryName = 'GetTicketsQuery''[,;]

  constructor(
    public readonly tenantId: string,
    public readonly search?: string,
    public readonly status?: string,
    public readonly priority?: string,
    public readonly assignedToId?: string,
    public readonly customerId?: string,
    public readonly category?: string,
    public readonly state?: string,
    public readonly urgent?: boolean,
    public readonly limit?: number,
    public readonly offset?: number
  ) {}
}

export class GetTicketsQueryHandler implements IQueryHandler<GetTicketsQuery, GetTicketsOutput> {
  constructor(
    private getTicketsUseCase: GetTicketsUseCase
  ) {}

  async handle(query: GetTicketsQuery): Promise<GetTicketsOutput> {
    const input: GetTicketsInput = {
      tenantId: query.tenantId,
      search: query.search,
      status: query.status,
      priority: query.priority,
      assignedToId: query.assignedToId,
      customerId: query.customerId,
      category: query.category,
      state: query.state,
      urgent: query.urgent,
      limit: query.limit,
      offset: query.offset
    };

    return await this.getTicketsUseCase.execute(input);
  }
}