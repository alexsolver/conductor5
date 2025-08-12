/**
 * InventoryItem Domain Entity - Phase 11 Implementation
 * 
 * Representa um item de inventário no domínio do sistema Conductor
 * Entidade pura sem dependências externas
 * 
 * @module InventoryItemEntity
 * @version 1.0.0
 * @created 2025-08-12 - Phase 11 Clean Architecture Implementation
 */

export interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  unitOfMeasure: 'unit' | 'kg' | 'liter' | 'meter' | 'box' | 'pack';
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unitCost: number;
  averageCost: number;
  lastPurchasePrice?: number;
  supplier?: string;
  supplierCode?: string;
  location: string;
  shelf?: string;
  serialNumbers?: string[];
  expirationDate?: Date;
  batchNumber?: string;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  tags?: string[];
  customFields?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class InventoryItemEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public sku: string,
    public name: string,
    public description: string | null = null,
    public category: string,
    public subcategory: string | null = null,
    public brand: string | null = null,
    public model: string | null = null,
    public unitOfMeasure: 'unit' | 'kg' | 'liter' | 'meter' | 'box' | 'pack' = 'unit',
    public currentStock: number = 0,
    public minimumStock: number = 0,
    public maximumStock: number | null = null,
    public unitCost: number = 0,
    public averageCost: number = 0,
    public lastPurchasePrice: number | null = null,
    public supplier: string | null = null,
    public supplierCode: string | null = null,
    public location: string = 'default',
    public shelf: string | null = null,
    public serialNumbers: string[] = [],
    public expirationDate: Date | null = null,
    public batchNumber: string | null = null,
    public status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock' = 'active',
    public tags: string[] = [],
    public customFields: Record<string, any> | null = null,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public readonly createdBy: string | null = null,
    public updatedBy: string | null = null
  ) {
    this.validateSku();
    this.validateName();
    this.validateTenantId();
    this.validateCategory();
    this.validateStock();
    this.validateCosts();
  }

  private validateSku(): void {
    if (!this.sku || this.sku.trim().length === 0) {
      throw new Error('SKU é obrigatório');
    }
    if (this.sku.length > 100) {
      throw new Error('SKU deve ter no máximo 100 caracteres');
    }
  }

  private validateName(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nome do item é obrigatório');
    }
    if (this.name.length > 255) {
      throw new Error('Nome deve ter no máximo 255 caracteres');
    }
  }

  private validateTenantId(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório');
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

  private validateStock(): void {
    if (this.currentStock < 0) {
      throw new Error('Estoque atual não pode ser negativo');
    }
    if (this.minimumStock < 0) {
      throw new Error('Estoque mínimo não pode ser negativo');
    }
    if (this.maximumStock !== null && this.maximumStock < 0) {
      throw new Error('Estoque máximo não pode ser negativo');
    }
    if (this.maximumStock !== null && this.maximumStock < this.minimumStock) {
      throw new Error('Estoque máximo deve ser maior que o estoque mínimo');
    }
  }

  private validateCosts(): void {
    if (this.unitCost < 0) {
      throw new Error('Custo unitário não pode ser negativo');
    }
    if (this.averageCost < 0) {
      throw new Error('Custo médio não pode ser negativo');
    }
    if (this.lastPurchasePrice !== null && this.lastPurchasePrice < 0) {
      throw new Error('Preço da última compra não pode ser negativo');
    }
  }

  updateName(newName: string, updatedBy?: string): void {
    this.name = newName;
    this.validateName();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateDescription(newDescription: string | null, updatedBy?: string): void {
    this.description = newDescription;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateCategory(newCategory: string, newSubcategory?: string, updatedBy?: string): void {
    this.category = newCategory;
    this.subcategory = newSubcategory || null;
    this.validateCategory();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateStock(newCurrentStock: number, updatedBy?: string): void {
    this.currentStock = newCurrentStock;
    this.validateStock();
    this.updateStockStatus();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  adjustStock(adjustment: number, updatedBy?: string): void {
    this.currentStock += adjustment;
    this.validateStock();
    this.updateStockStatus();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateMinimumStock(newMinimumStock: number, updatedBy?: string): void {
    this.minimumStock = newMinimumStock;
    this.validateStock();
    this.updateStockStatus();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateMaximumStock(newMaximumStock: number | null, updatedBy?: string): void {
    this.maximumStock = newMaximumStock;
    this.validateStock();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateCosts(unitCost?: number, averageCost?: number, lastPurchasePrice?: number, updatedBy?: string): void {
    if (unitCost !== undefined) this.unitCost = unitCost;
    if (averageCost !== undefined) this.averageCost = averageCost;
    if (lastPurchasePrice !== undefined) this.lastPurchasePrice = lastPurchasePrice;
    this.validateCosts();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateSupplier(supplier: string | null, supplierCode?: string | null, updatedBy?: string): void {
    this.supplier = supplier;
    if (supplierCode !== undefined) this.supplierCode = supplierCode;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateLocation(location: string, shelf?: string | null, updatedBy?: string): void {
    this.location = location;
    if (shelf !== undefined) this.shelf = shelf;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  addSerialNumber(serialNumber: string, updatedBy?: string): void {
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

  updateExpirationDate(expirationDate: Date | null, updatedBy?: string): void {
    this.expirationDate = expirationDate;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateBatch(batchNumber: string | null, updatedBy?: string): void {
    this.batchNumber = batchNumber;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateStatus(newStatus: 'active' | 'inactive' | 'discontinued' | 'out_of_stock', updatedBy?: string): void {
    this.status = newStatus;
    this.isActive = newStatus === 'active';
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

  updateCustomFields(customFields: Record<string, any> | null, updatedBy?: string): void {
    this.customFields = customFields;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  private updateStockStatus(): void {
    if (this.currentStock === 0) {
      this.status = 'out_of_stock';
      this.isActive = false;
    } else if (this.currentStock > 0 && this.status === 'out_of_stock') {
      this.status = 'active';
      this.isActive = true;
    }
  }

  isLowStock(): boolean {
    return this.currentStock <= this.minimumStock;
  }

  isOverStock(): boolean {
    return this.maximumStock !== null && this.currentStock >= this.maximumStock;
  }

  isExpired(): boolean {
    return this.expirationDate !== null && this.expirationDate < new Date();
  }

  isExpiringSoon(days: number = 30): boolean {
    if (!this.expirationDate) return false;
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return this.expirationDate <= warningDate;
  }

  getStockValue(): number {
    return this.currentStock * this.averageCost;
  }

  deactivate(updatedBy?: string): void {
    this.isActive = false;
    this.status = 'inactive';
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  activate(updatedBy?: string): void {
    this.isActive = true;
    this.status = 'active';
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  discontinue(updatedBy?: string): void {
    this.status = 'discontinued';
    this.isActive = false;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  static create(data: {
    tenantId: string;
    sku: string;
    name: string;
    description?: string;
    category: string;
    subcategory?: string;
    brand?: string;
    model?: string;
    unitOfMeasure?: 'unit' | 'kg' | 'liter' | 'meter' | 'box' | 'pack';
    currentStock?: number;
    minimumStock?: number;
    maximumStock?: number;
    unitCost?: number;
    averageCost?: number;
    supplier?: string;
    supplierCode?: string;
    location?: string;
    shelf?: string;
    expirationDate?: Date;
    batchNumber?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    createdBy?: string;
  }): InventoryItemEntity {
    const generateId = () => {
      return 'inventory_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    return new InventoryItemEntity(
      generateId(),
      data.tenantId,
      data.sku,
      data.name,
      data.description || null,
      data.category,
      data.subcategory || null,
      data.brand || null,
      data.model || null,
      data.unitOfMeasure || 'unit',
      data.currentStock || 0,
      data.minimumStock || 0,
      data.maximumStock || null,
      data.unitCost || 0,
      data.averageCost || data.unitCost || 0,
      null,
      data.supplier || null,
      data.supplierCode || null,
      data.location || 'default',
      data.shelf || null,
      [],
      data.expirationDate || null,
      data.batchNumber || null,
      'active',
      data.tags || [],
      data.customFields || null,
      true,
      new Date(),
      new Date(),
      data.createdBy || null,
      null
    );
  }
}