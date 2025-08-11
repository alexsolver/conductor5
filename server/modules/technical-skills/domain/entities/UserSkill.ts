export class UserSkill {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly skillId: string,
    public proficiencyLevel: number,
    public averageRating: number = 0,
    public totalEvaluations: number = 0,
    public certificationId?: string,
    public certificationNumber?: string,
    public certificationIssuedAt?: Date,
    public certificationExpiresAt?: Date,
    public certificationFile?: string,
    public readonly assignedAt: Date = new Date(),
    public readonly assignedBy: string,
    public justification?: string,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validateProficiencyLevel();
    this.validateRating();
    this.validateCertificationDates();
  }

  private validateProficiencyLevel(): void {
    if (this.proficiencyLevel < 1 || this.proficiencyLevel > 5) {
      throw new Error('Nível de proficiência deve estar entre 1 e 5');
    }
  }

  private validateRating(): void {
    if (this.averageRating < 0 || this.averageRating > 5) {
      throw new Error('Avaliação média deve estar entre 0 e 5');
    }
  }

  private validateCertificationDates(): void {
    if (this.certificationIssuedAt && this.certificationExpiresAt) {
      if (this.certificationIssuedAt >= this.certificationExpiresAt) {
        throw new Error('Data de emissão deve ser anterior à data de expiração');
      }
    }
  }

  updateProficiencyLevel(newLevel: number, changedBy: string, reason?: string): void {
    const oldLevel = this.proficiencyLevel;
    this.proficiencyLevel = newLevel;
    this.validateProficiencyLevel();
    this.updatedAt = new Date();
    
    // Log da mudança seria feito por um domain service
  }

  addEvaluation(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Avaliação deve estar entre 1 e 5');
    }

    const totalPoints = this.averageRating * this.totalEvaluations + rating;
    this.totalEvaluations += 1;
    this.averageRating = Number((totalPoints / this.totalEvaluations).toFixed(2));
    
    this.updatedAt = new Date();
    
    // Verificar se qualifica para nível 5 automático
    this.checkAutoLevel5Qualification();
  }

  private checkAutoLevel5Qualification(): void {
    const minRating = 4.8;
    const minEvaluations = 10;
    
    if (
      this.averageRating >= minRating && 
      this.totalEvaluations >= minEvaluations &&
      this.proficiencyLevel < 5
    ) {
      // Seria validado por um domain service que também checa SLAs
      // this.updateProficiencyLevel(5, 'system', 'Qualificação automática por performance');
    }
  }

  updateCertification(
    certificationId?: string,
    certificationNumber?: string,
    issuedAt?: Date,
    expiresAt?: Date,
    filePath?: string
  ): void {
    this.certificationId = certificationId;
    this.certificationNumber = certificationNumber;
    this.certificationIssuedAt = issuedAt;
    this.certificationExpiresAt = expiresAt;
    this.certificationFile = filePath;
    
    this.validateCertificationDates();
    this.updatedAt = new Date();
  }

  isCertificationValid(): boolean {
    if (!this.certificationExpiresAt) {
      return true; // Certificação sem validade
    }
    
    return this.certificationExpiresAt > new Date();
  }

  isCertificationExpiringSoon(daysAhead: number = 30): boolean {
    if (!this.certificationExpiresAt) {
      return false;
    }
    
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysAhead);
    
    return this.certificationExpiresAt <= warningDate;
  }

  getProficiencyLevelInfo(): { name: string; description: string; stars: number } {
    const levels = {
      1: { name: 'Básico', description: 'Conhecimento introdutório, precisa de supervisão', stars: 1 },
      2: { name: 'Intermediário', description: 'Executa tarefas com alguma autonomia', stars: 2 },
      3: { name: 'Avançado', description: 'Executa com autonomia, lida com situações variadas', stars: 3 },
      4: { name: 'Especialista', description: 'Referência técnica interna, resolve problemas críticos', stars: 4 },
      5: { name: 'Excelência', description: 'Comprovada por resultados e avaliações de clientes', stars: 5 },
    };
    
    return levels[this.proficiencyLevel as keyof typeof levels];
  }

  canBeAssignedToTask(requiredLevel: number, requireValidCertification: boolean = false): boolean {
    // Verifica nível de proficiência
    if (this.proficiencyLevel < requiredLevel) {
      return false;
    }
    
    // Verifica se está ativo
    if (!this.isActive) {
      return false;
    }
    
    // Verifica certificação se necessário
    if (requireValidCertification && !this.isCertificationValid()) {
      return false;
    }
    
    return true;
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // CLEANED: Factory method removed - creation logic moved to repository layer
}