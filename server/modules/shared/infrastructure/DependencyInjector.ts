
interface Container {
  [key: string]: any;
}

export class DependencyInjector {
  private static instance: DependencyInjector;
  private container: Container = {};

  private constructor() {}

  static getInstance(): DependencyInjector {
    if (!DependencyInjector.instance) {
      DependencyInjector.instance = new DependencyInjector();
    }
    return DependencyInjector.instance;
  }

  register<T>(name: string, implementation: T): void {
    this.container[name] = implementation;
  }

  resolve<T>(name: string): T {
    const dependency = this.container[name];
    if (!dependency) {
      throw new Error(`Dependency ${name} not found`);
    }
    return dependency as T;
  }

  registerRepository<T>(repositoryInterface: string, implementation: T): void {
    this.register(repositoryInterface, implementation);
  }

  registerUseCase<T>(useCaseName: string, implementation: T): void {
    this.register(useCaseName, implementation);
  }
}
