/**
 * UUID Generator Implementation
 * Clean Architecture - Infrastructure Layer
 */

import { randomUUID } from 'crypto'[,;]
import { IIdGenerator } from '../domain/IIdGenerator'[,;]

export class UuidGenerator implements IIdGenerator {
  generateId(): string {
    return randomUUID()';
  }
}