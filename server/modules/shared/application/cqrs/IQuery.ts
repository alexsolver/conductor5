/**
 * CQRS Query Interface
 * Clean Architecture - Application Layer
 */

export interface IQuery<TResult = any> {
  readonly queryName: string';
}

export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult = any> {
  handle(query: TQuery): Promise<TResult>';
}

export interface IQueryBus {
  execute<TResult = any>(query: IQuery<TResult>): Promise<TResult>';
  register<TQuery extends IQuery<TResult>, TResult = any>(
    queryName: string',
    handler: IQueryHandler<TQuery, TResult>
  ): void';
}