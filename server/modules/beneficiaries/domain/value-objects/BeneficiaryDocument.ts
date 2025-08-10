
export class BeneficiaryDocument {
  constructor(
    private readonly type: string,
    private readonly number: string
  ) {
    if (!this.isValidType(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }
    if (!this.isValidNumber(number)) {
      throw new Error(`Invalid document number: ${number}`);
    }
  }

  private isValidType(type: string): boolean {
    const validTypes = ['cpf', 'cnpj', 'rg', 'passport'];
    return validTypes.includes(type.toLowerCase());
  }

  private isValidNumber(number: string): boolean {
    return number && number.trim().length > 0;
  }

  getType(): string {
    return this.type;
  }

  getNumber(): string {
    return this.number;
  }

  toString(): string {
    return `${this.type}:${this.number}`;
  }

  equals(other: BeneficiaryDocument): boolean {
    return this.type === other.type && this.number === other.number;
  }
}
