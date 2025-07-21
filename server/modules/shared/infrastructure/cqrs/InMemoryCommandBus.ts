/**
 * In-Memory Command Bus Implementation
 * Clean Architecture - Infrastructure Layer
 */

import { ICommand, ICommandHandler, ICommandBus } from '../../application/cqrs/ICommand''[,;]

export class InMemoryCommandBus implements ICommandBus {
  private handlers = new Map<string, ICommandHandler<any, any>>();

  async execute<TResult = any>(command: ICommand<TResult>): Promise<TResult> {
    const handler = this.handlers.get(command.commandName);
    
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.commandName}`);
    }

    return await handler.handle(command);
  }

  register<TCommand extends ICommand<TResult>, TResult = any>(
    commandName: string,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandName, handler);
  }

  clear(): void {
    this.handlers.clear();
  }
}