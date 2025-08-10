
export interface IAssetRepository {
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  create(asset: any): Promise<any>;
  update(id: string, asset: any): Promise<any>;
  delete(id: string): Promise<void>;
}
