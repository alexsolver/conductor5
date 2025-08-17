import { Pool } from 'pg';
import { ApprovalController } from '../../application/controllers/ApprovalController';
import { PostgresApprovalRuleRepository } from '../repositories/PostgresApprovalRuleRepository';
import { PostgresApprovalInstanceRepository } from '../repositories/PostgresApprovalInstanceRepository';
import { ApprovalRuleEngine } from '../../domain/services/ApprovalRuleEngine';

export class ApprovalServiceFactory {
  static createApprovalController(db: Pool): ApprovalController {
    const approvalRuleRepository = new PostgresApprovalRuleRepository(db);
    const approvalInstanceRepository = new PostgresApprovalInstanceRepository(db);
    const ruleEngine = new ApprovalRuleEngine();

    return new ApprovalController(
      approvalRuleRepository,
      approvalInstanceRepository,
      ruleEngine
    );
  }
}