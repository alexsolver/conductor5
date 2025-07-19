
import { IEmailConfigRepository } from '../../domain/repositories/IEmailConfigRepository';
import { EmailProcessingRule } from '../../domain/entities/EmailProcessingRule';

export class ManageEmailRulesUseCase {
  constructor(private emailConfigRepo: IEmailConfigRepository) {}

  async createRule(tenantId: string, userId: string, ruleData: Omit<EmailProcessingRule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<EmailProcessingRule> {
    // Validate rule data
    this.validateRuleData(ruleData);
    
    // Create the rule
    return this.emailConfigRepo.createEmailRule(tenantId, {
      ...ruleData,
      tenantId,
    });
  }

  async getRules(tenantId: string, activeOnly: boolean = false): Promise<EmailProcessingRule[]> {
    return this.emailConfigRepo.getEmailRules(tenantId, { active: activeOnly });
  }

  async getRule(tenantId: string, ruleId: string): Promise<EmailProcessingRule | null> {
    return this.emailConfigRepo.getEmailRuleById(tenantId, ruleId);
  }

  async updateRule(tenantId: string, ruleId: string, updates: Partial<EmailProcessingRule>): Promise<EmailProcessingRule | null> {
    // Validate updates
    if (updates.fromEmailPattern || updates.subjectPattern || updates.bodyPattern) {
      this.validatePatterns(updates);
    }
    
    return this.emailConfigRepo.updateEmailRule(tenantId, ruleId, updates);
  }

  async deleteRule(tenantId: string, ruleId: string): Promise<boolean> {
    return this.emailConfigRepo.deleteEmailRule(tenantId, ruleId);
  }

  async testRule(tenantId: string, ruleId: string, emailData: {
    from: string;
    subject: string;
    body: string;
    hasAttachment: boolean;
  }): Promise<{ matches: boolean; extractedData?: any; errors?: string[] }> {
    const rule = await this.emailConfigRepo.getEmailRuleById(tenantId, ruleId);
    
    if (!rule) {
      throw new Error('Rule not found');
    }

    const result = {
      matches: true,
      extractedData: {},
      errors: [] as string[]
    };

    try {
      // Test email pattern
      if (rule.fromEmailPattern) {
        const regex = new RegExp(rule.fromEmailPattern, 'i');
        if (!regex.test(emailData.from)) {
          result.matches = false;
        }
      }

      // Test subject pattern
      if (rule.subjectPattern) {
        const regex = new RegExp(rule.subjectPattern, 'i');
        const match = emailData.subject.match(regex);
        if (!match) {
          result.matches = false;
        } else {
          result.extractedData.subjectMatches = match;
        }
      }

      // Test body pattern
      if (rule.bodyPattern) {
        const regex = new RegExp(rule.bodyPattern, 'i');
        const match = emailData.body.match(regex);
        if (!match) {
          result.matches = false;
        } else {
          result.extractedData.bodyMatches = match;
        }
      }

      // Test attachment requirement
      if (rule.attachmentRequired && !emailData.hasAttachment) {
        result.matches = false;
      }

    } catch (error) {
      result.errors.push(`Pattern error: ${error.message}`);
      result.matches = false;
    }

    return result;
  }

  private validateRuleData(ruleData: any): void {
    if (!ruleData.name || ruleData.name.trim().length === 0) {
      throw new Error('Rule name is required');
    }

    if (!ruleData.actionType) {
      throw new Error('Action type is required');
    }

    this.validatePatterns(ruleData);
  }

  private validatePatterns(data: any): void {
    const patterns = ['fromEmailPattern', 'subjectPattern', 'bodyPattern'];
    
    for (const pattern of patterns) {
      if (data[pattern]) {
        try {
          new RegExp(data[pattern]);
        } catch (error) {
          throw new Error(`Invalid ${pattern}: ${error.message}`);
        }
      }
    }
  }
}
