
/**
 * Drizzle Processing Rule Repository
 * Clean Architecture - Infrastructure Layer
 */
import { IProcessingRuleRepository } from '../../domain/repositories/IProcessingRuleRepository';
import { ProcessingRule } from '../../domain/entities/ProcessingRule';

export class DrizzleProcessingRuleRepository implements IProcessingRuleRepository {
  async findAll(tenantId: string): Promise<ProcessingRule[]> {
    // Por enquanto retorna uma regra de exemplo
    return [
      new ProcessingRule(
        '1',
        tenantId,
        'Urgente Email Rule',
        'Se o assunto contém "urgente", marcar como prioridade alta',
        ['urgente', 'crítico', 'emergency'],
        [
          {
            type: 'set_priority',
            value: 'urgent'
          }
        ],
        true,
        1,
        new Date(),
        new Date()
      )
    ];
  }

  async findById(tenantId: string, id: string): Promise<ProcessingRule | null> {
    const rules = await this.findAll(tenantId);
    return rules.find(rule => rule.id === id) || null;
  }

  async save(rule: ProcessingRule): Promise<ProcessingRule> {
    return rule;
  }

  async update(tenantId: string, id: string, updates: Partial<ProcessingRule>): Promise<ProcessingRule | null> {
    const rule = await this.findById(tenantId, id);
    if (!rule) return null;
    
    Object.assign(rule, updates);
    return rule;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    // Implementation would remove from database
  }
}
