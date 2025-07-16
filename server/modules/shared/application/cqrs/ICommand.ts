/**
 * CQRS Command Interface
 * Clean Architecture - Application Layer
 */

export interface ICommand<TResult = any> {
  readonly commandName: string;
}

export interface ICommandHandler<TCommand extends ICommand<TResult>, TResult = any> {
  handle(command: TCommand): Promise<TResult>;
}

export interface ICommandBus {
  execute<TResult = any>(command: ICommand<TResult>): Promise<TResult>;
  register<TCommand extends ICommand<TResult>, TResult = any>(
    commandName: string,
    handler: ICommandHandler<TCommand, TResult>
  ): void;
}