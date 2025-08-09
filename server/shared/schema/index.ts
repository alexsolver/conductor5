// Shared schema exports
export * from '../../../shared/schema';

// Re-export specific tables that might be missing
import { beneficiaries, customFields } from '../../../shared/schema';
export { beneficiaries, customFields };