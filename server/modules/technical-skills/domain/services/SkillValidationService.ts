
export class SkillValidationService {
  validateSkillName(name: string): boolean {
    if (!name || name.trim().length < 2) {
      throw new Error('Skill name must be at least 2 characters long');
    }
    
    if (name.length > 100) {
      throw new Error('Skill name cannot exceed 100 characters');
    }
    
    return true;
  }

  validateSkillLevel(level: number): boolean {
    if (level < 1 || level > 5) {
      throw new Error('Skill level must be between 1 and 5');
    }
    
    return true;
  }
}
