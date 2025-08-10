/**
 * ID Generator Interface
 * Clean Architecture - Shared Domain Port
 */

export interface IIdGenerator {
  generate(): string;
}