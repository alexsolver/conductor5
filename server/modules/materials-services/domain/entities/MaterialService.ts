/**
 * MaterialService Domain Entity - Phase 14 Implementation
 * 
 * Representa um material ou serviço no domínio do sistema Conductor
 * Entidade pura sem dependências externas
 * 
 * @module MaterialServiceEntity
 * @version 1.0.0
 * @created 2025-08-12 - Phase 14 Clean Architecture Implementation
 */

export interface MaterialService {
  id: string;
  tenantId: string;
  type: 'material' | 'service';
  category: string;
  subcategory?: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  currency: string;
  supplier?: string;
  supplierId?: string;
  brand?: string;
  model?: string;
  specifications?: Record<string, any>;
  stockQuantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  averageCost?: number;
  lastPurchasePrice?: number;
  lastPurchaseDate?: Date;
  location?: string;
  barcode?: string;
  serialNumbers?: string[];
  expirationDate?: Date;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  isStockControlled: boolean;
  isService: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class MaterialServiceEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public type: 'material' | 'service',
    public category: string,
    public code: string,
    public name: string,
    public unit: string,
    public unitPrice: number,
    public currency: string = 'BRL',
    public subcategory: string | null = null,
    public description: string | null = null,
    public supplier: string | null = null,
    public supplierId: string | null = null,
    public brand: string | null = null,
    public model: string | null = null,
    public specifications: Record<string, any> | null = null,
    public stockQuantity: number | null = null,
    public minimumStock: number | null = null,
    public maximumStock: number | null = null,
    public averageCost: number | null = null,
    public lastPurchasePrice: number | null = null,
    public lastPurchaseDate: Date | null = null,
    public location: string | null = null,
    public barcode: string | null = null,
    public serialNumbers: string[] = [],
    public expirationDate: Date | null = null,
    public notes: string | null = null,
    public tags: string[] = [],
    public isActive: boolean = true,
    public isStockControlled: boolean = true,
    public isService: boolean = false,
    public metadata: Record<string, any> | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public readonly createdBy: string | null = null,
    public updatedBy: string | null = null
  ) {
    this.validateTenantId();
    this.validateType();
    this.validateCategory();
    this.validateCode();
    this.validateName();
    this.validateUnit();
    this.validateUnitPrice();
    this.validateCurrency();
    this.validateStockQuantities();
    this.validatePrices();
    this.validateDates();
  }

  private validateTenantId(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório');
    }
  }

  private validateType(): void {
    if (!this.type || !['material', 'service'].includes(this.type)) {
      throw new Error('Tipo deve ser "material" ou "service"');
    }
    
    // Auto-set isService based on type
    this.isService = this.type === 'service';
    
    // Services shouldn't have stock control by default
    if (this.isService && this.isStockControlled) {
      this.isStockControlled = false;
    }
  }

  private validateCategory(): void {
    if (!this.category || this.category.trim().length === 0) {
      throw new Error('Categoria é obrigatória');
    }
    
    if (this.category.length > 100) {
      throw new Error('Categoria deve ter no máximo 100 caracteres');
    }
  }

  private validateCode(): void {
    if (!this.code || this.code.trim().length === 0) {
      throw new Error('Código é obrigatório');
    }
    
    if (this.code.length > 50) {
      throw new Error('Código deve ter no máximo 50 caracteres');
    }
    
    // Validate code format (alphanumeric with dashes and underscores)
    const codeRegex = /^[a-zA-Z0-9_-]+$/;
    if (!codeRegex.test(this.code)) {
      throw new Error('Código deve conter apenas letras, números, hífens e underscores');
    }
  }

  private validateName(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }
    
    if (this.name.length > 200) {
      throw new Error('Nome deve ter no máximo 200 caracteres');
    }
  }

  private validateUnit(): void {
    if (!this.unit || this.unit.trim().length === 0) {
      throw new Error('Unidade é obrigatória');
    }
    
    if (this.unit.length > 20) {
      throw new Error('Unidade deve ter no máximo 20 caracteres');
    }
  }

  private validateUnitPrice(): void {
    if (this.unitPrice === null || this.unitPrice === undefined) {
      throw new Error('Preço unitário é obrigatório');
    }
    
    if (this.unitPrice < 0) {
      throw new Error('Preço unitário não pode ser negativo');
    }
    
    if (this.unitPrice > 999999999.99) {
      throw new Error('Preço unitário deve ser menor que 1 bilhão');
    }
  }

  private validateCurrency(): void {
    if (!this.currency || this.currency.trim().length === 0) {
      throw new Error('Moeda é obrigatória');
    }
    
    const validCurrencies = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CLP', 'PEN', 'COP'];
    if (!validCurrencies.includes(this.currency)) {
      throw new Error(`Moeda deve ser uma das seguintes: ${validCurrencies.join(', ')}`);
    }
  }

  private validateStockQuantities(): void {
    if (this.isService) {
      // Services shouldn't have stock quantities
      if (this.stockQuantity !== null || this.minimumStock !== null || this.maximumStock !== null) {
        throw new Error('Serviços não devem ter controle de estoque');
      }
      return;
    }
    
    if (this.stockQuantity !== null && this.stockQuantity < 0) {
      throw new Error('Quantidade em estoque não pode ser negativa');
    }
    
    if (this.minimumStock !== null && this.minimumStock < 0) {
      throw new Error('Estoque mínimo não pode ser negativo');
    }
    
    if (this.maximumStock !== null && this.maximumStock < 0) {
      throw new Error('Estoque máximo não pode ser negativo');
    }
    
    if (this.minimumStock !== null && this.maximumStock !== null && this.minimumStock > this.maximumStock) {
      throw new Error('Estoque mínimo não pode ser maior que estoque máximo');
    }
  }

  private validatePrices(): void {
    if (this.averageCost !== null && this.averageCost < 0) {
      throw new Error('Custo médio não pode ser negativo');
    }
    
    if (this.lastPurchasePrice !== null && this.lastPurchasePrice < 0) {
      throw new Error('Último preço de compra não pode ser negativo');
    }
  }

  private validateDates(): void {
    if (this.lastPurchaseDate && this.lastPurchaseDate > new Date()) {
      throw new Error('Data da última compra não pode ser no futuro');
    }
    
    if (this.expirationDate && this.expirationDate <= new Date()) {
      throw new Error('Data de expiração deve ser no futuro');
    }
  }

  // ===== UPDATE METHODS =====

  updateName(name: string, updatedBy?: string): void {
    this.name = name;
    this.validateName();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateDescription(description: string | null, updatedBy?: string): void {
    this.description = description;
    if (description && description.length > 1000) {
      throw new Error('Descrição deve ter no máximo 1000 caracteres');
    }
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateUnitPrice(unitPrice: number, updatedBy?: string): void {
    this.unitPrice = unitPrice;
    this.validateUnitPrice();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateStockQuantity(quantity: number, updatedBy?: string): void {
    if (this.isService) {
      throw new Error('Não é possível atualizar estoque de serviços');
    }
    
    this.stockQuantity = quantity;
    this.validateStockQuantities();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateStockLimits(minimumStock: number | null, maximumStock: number | null, updatedBy?: string): void {
    if (this.isService) {
      throw new Error('Não é possível definir limites de estoque para serviços');
    }
    
    this.minimumStock = minimumStock;
    this.maximumStock = maximumStock;
    this.validateStockQuantities();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateSupplier(supplier: string | null, supplierId: string | null, updatedBy?: string): void {
    this.supplier = supplier;
    this.supplierId = supplierId;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateBrandModel(brand: string | null, model: string | null, updatedBy?: string): void {
    this.brand = brand;
    this.model = model;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateLocation(location: string | null, updatedBy?: string): void {
    this.location = location;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateBarcode(barcode: string | null, updatedBy?: string): void {
    this.barcode = barcode;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateExpirationDate(expirationDate: Date | null, updatedBy?: string): void {
    if (this.isService && expirationDate) {
      throw new Error('Serviços não podem ter data de expiração');
    }
    
    this.expirationDate = expirationDate;
    this.validateDates();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateNotes(notes: string | null, updatedBy?: string): void {
    this.notes = notes;
    if (notes && notes.length > 2000) {
      throw new Error('Observações devem ter no máximo 2000 caracteres');
    }
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateTags(tags: string[], updatedBy?: string): void {
    this.tags = tags;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  addTag(tag: string, updatedBy?: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
  }

  removeTag(tag: string, updatedBy?: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
  }

  addSerialNumber(serialNumber: string, updatedBy?: string): void {
    if (this.isService) {
      throw new Error('Serviços não podem ter números de série');
    }
    
    if (!this.serialNumbers.includes(serialNumber)) {
      this.serialNumbers.push(serialNumber);
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
  }

  removeSerialNumber(serialNumber: string, updatedBy?: string): void {
    const index = this.serialNumbers.indexOf(serialNumber);
    if (index > -1) {
      this.serialNumbers.splice(index, 1);
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
  }

  updateSpecifications(specifications: Record<string, any> | null, updatedBy?: string): void {
    this.specifications = specifications;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateMetadata(metadata: Record<string, any> | null, updatedBy?: string): void {
    this.metadata = metadata;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  activate(updatedBy?: string): void {
    this.isActive = true;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  deactivate(updatedBy?: string): void {
    this.isActive = false;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  // ===== BUSINESS METHODS =====

  isLowStock(): boolean {
    if (this.isService || !this.isStockControlled || this.minimumStock === null || this.stockQuantity === null) {
      return false;
    }
    
    return this.stockQuantity <= this.minimumStock;
  }

  isOutOfStock(): boolean {
    if (this.isService || !this.isStockControlled || this.stockQuantity === null) {
      return false;
    }
    
    return this.stockQuantity <= 0;
  }

  isOverStock(): boolean {
    if (this.isService || !this.isStockControlled || this.maximumStock === null || this.stockQuantity === null) {
      return false;
    }
    
    return this.stockQuantity >= this.maximumStock;
  }

  isExpired(): boolean {
    if (this.isService || !this.expirationDate) {
      return false;
    }
    
    return this.expirationDate <= new Date();
  }

  isExpiringSoon(days: number = 30): boolean {
    if (this.isService || !this.expirationDate) {
      return false;
    }
    
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    
    return this.expirationDate <= warningDate;
  }

  getStockStatus(): 'out_of_stock' | 'low_stock' | 'over_stock' | 'normal' | 'not_controlled' {
    if (this.isService || !this.isStockControlled) {
      return 'not_controlled';
    }
    
    if (this.isOutOfStock()) return 'out_of_stock';
    if (this.isLowStock()) return 'low_stock';
    if (this.isOverStock()) return 'over_stock';
    
    return 'normal';
  }

  getExpirationStatus(): 'expired' | 'expiring_soon' | 'normal' | 'not_applicable' {
    if (this.isService) {
      return 'not_applicable';
    }
    
    if (this.isExpired()) return 'expired';
    if (this.isExpiringSoon()) return 'expiring_soon';
    
    return 'normal';
  }

  getTotalValue(): number {
    if (this.isService || !this.isStockControlled || this.stockQuantity === null) {
      return 0;
    }
    
    return this.stockQuantity * this.unitPrice;
  }

  getDisplayName(): string {
    return `${this.code} - ${this.name}`;
  }

  getFullDescription(): string {
    const parts = [this.name];
    
    if (this.brand) parts.push(`Marca: ${this.brand}`);
    if (this.model) parts.push(`Modelo: ${this.model}`);
    if (this.description) parts.push(this.description);
    
    return parts.join(' | ');
  }

  static create(data: {
    tenantId: string;
    type: 'material' | 'service';
    category: string;
    code: string;
    name: string;
    unit: string;
    unitPrice: number;
    currency?: string;
    subcategory?: string;
    description?: string;
    supplier?: string;
    supplierId?: string;
    brand?: string;
    model?: string;
    specifications?: Record<string, any>;
    stockQuantity?: number;
    minimumStock?: number;
    maximumStock?: number;
    location?: string;
    barcode?: string;
    serialNumbers?: string[];
    expirationDate?: Date;
    notes?: string;
    tags?: string[];
    isStockControlled?: boolean;
    metadata?: Record<string, any>;
    createdBy?: string;
  }): MaterialServiceEntity {
    const generateId = () => {
      return 'ms_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    return new MaterialServiceEntity(
      generateId(),
      data.tenantId,
      data.type,
      data.category,
      data.code,
      data.name,
      data.unit,
      data.unitPrice,
      data.currency || 'BRL',
      data.subcategory || null,
      data.description || null,
      data.supplier || null,
      data.supplierId || null,
      data.brand || null,
      data.model || null,
      data.specifications || null,
      data.stockQuantity || null,
      data.minimumStock || null,
      data.maximumStock || null,
      null, // averageCost - calculated later
      null, // lastPurchasePrice
      null, // lastPurchaseDate
      data.location || null,
      data.barcode || null,
      data.serialNumbers || [],
      data.expirationDate || null,
      data.notes || null,
      data.tags || [],
      true, // isActive
      data.isStockControlled !== false, // default true for materials, handled in constructor for services
      data.type === 'service',
      data.metadata || null,
      new Date(),
      new Date(),
      data.createdBy || null,
      null
    );
  }
}