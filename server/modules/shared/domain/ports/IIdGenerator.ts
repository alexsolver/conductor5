/**
 * ID Generator Interface (Port)
 * Clean Architecture - Domain Layer
 * Abstraction for generating unique identifiers
 */

export interface IIdGenerator {
  generate(): string;
  generateWithPrefix(prefix: string): string;
  isValid(id: string): boolean;
}