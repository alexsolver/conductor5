
export abstract class BaseController {
  protected handleError(error: any): never {
    throw new Error(`Controller error: ${error.message || error}`);
  }
}
