
export class MaterialsServicesDomainService {
  static validateMaterial(material: any): boolean {
    return !!(material.name && material.code && material.price);
  }

  static calculateTotalPrice(items: any[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}
