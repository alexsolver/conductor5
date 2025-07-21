/**
 * In-Memory Query Bus Implementation
 * Clean Architecture - Infrastructure Layer
 */

import { IQuery, IQueryHandler, IQueryBus } from '../../application/cqrs/IQuery';

export class InMemoryQueryBus implements IQueryBus {
  private handlers = new Map<string, IQueryHandler<any, any>>();

  async execute<TResult = any>(query: IQuery<TResult>): Promise<TResult> {
    const handler = this.handlers.get(query.queryName);
    
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.queryName}`);
    }

    return await handler.handle(query);
  }

  register<TQuery extends IQuery<TResult>, TResult = any>(
    queryName: string,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryName, handler);
  }

  clear(): void {
    this.handlers.clear();
  }
}