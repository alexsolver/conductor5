
// Auto Token Refresh - DISABLED
// Basic placeholder to prevent import errors

export class AutoTokenRefresh {
  private static instance: AutoTokenRefresh;

  static getInstance(): AutoTokenRefresh {
    if (!AutoTokenRefresh.instance) {
      AutoTokenRefresh.instance = new AutoTokenRefresh();
    }
    return AutoTokenRefresh.instance;
  }

  public stop(): void {
    // No-op
  }

  public forceRefresh(): Promise<void> {
    return Promise.resolve();
  }

  public isActive(): boolean {
    return false;
  }
}

const autoRefresh = AutoTokenRefresh.getInstance();
export default autoRefresh;
