/**
 * UUID Generator Implementation
 * Clean Architecture - Infrastructure Layer
 * Generates UUIDs without direct crypto dependency in domain
 */

import { IIdGenerator } from '../../domain/ports/IIdGenerator';

export class UuidGenerator implements IIdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }

  generateWithPrefix(prefix: string): string {
    return `${prefix}_${this.generate()}`;
  }

  isValid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}