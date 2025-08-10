export class DependencyInjector {
  private static instance: DependencyInjector;
  private container: Map<string, any> = new Map();

  static getInstance(): DependencyInjector {
    if (!DependencyInjector.instance) {
      DependencyInjector.instance = new DependencyInjector();
    }
    return DependencyInjector.instance;
  }

  register<T>(token: string, instance: T): void {
    this.container.set(token, instance);
  }

  resolve<T>(token: string): T {
    const instance = this.container.get(token);
    if (!instance) {
      throw new Error(`No instance registered for token: ${token}`);
    }
    return instance;
  }

  clear(): void {
    this.container.clear();
  }
}