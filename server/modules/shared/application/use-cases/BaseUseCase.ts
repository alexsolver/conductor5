
export abstract class BaseUseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<TResponse>;
}
