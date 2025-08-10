
export class DependencyInjector {
  private static instance: DependencyInjector;
  private dependencies: Map<string, any> = new Map();

  static getInstance(): DependencyInjector {
    if (!this.instance) {
      this.instance = new DependencyInjector();
    }
    return this.instance;
  }

  register<T>(key: string, dependency: T): void {
    this.dependencies.set(key, dependency);
  }

  resolve<T>(key: string): T {
    const dependency = this.dependencies.get(key);
    if (!dependency) {
      throw new Error(`Dependency ${key} not found`);
    }
    return dependency;
  }

  clear(): void {
    this.dependencies.clear();
  }
}
