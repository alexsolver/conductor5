
export class TemplateVersionDomainService {
  validateVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
}
