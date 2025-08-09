
export abstract class BaseApplicationService {
  protected validateInput(input: any): void {
    if (!input) {
      throw new Error('Input is required');
    }
  }
}
