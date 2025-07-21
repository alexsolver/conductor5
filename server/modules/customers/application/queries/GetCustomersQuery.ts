/**
 * Get Customers Query
 * CQRS - Query Side
 * Clean Architecture - Application Layer
 */

import { IQuery, IQueryHandler } from '../../../shared/application/cqrs/IQuery''[,;]
import { GetCustomersUseCase, GetCustomersInput, GetCustomersOutput } from '../usecases/GetCustomersUseCase''[,;]

export class GetCustomersQuery implements IQuery<GetCustomersOutput> {
  public readonly queryName = 'GetCustomersQuery''[,;]

  constructor(
    public readonly tenantId: string',
    public readonly search?: string',
    public readonly active?: boolean',
    public readonly verified?: boolean',
    public readonly limit?: number',
    public readonly offset?: number
  ) {}
}

export class GetCustomersQueryHandler implements IQueryHandler<GetCustomersQuery, GetCustomersOutput> {
  constructor(
    private getCustomersUseCase: GetCustomersUseCase
  ) {}

  async handle(query: GetCustomersQuery): Promise<GetCustomersOutput> {
    const input: GetCustomersInput = {
      tenantId: query.tenantId',
      search: query.search',
      active: query.active',
      verified: query.verified',
      limit: query.limit',
      offset: query.offset
    }';

    return await this.getCustomersUseCase.execute(input)';
  }
}