
export interface ISaasConfigRepository {
  create(config: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, config: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByKey(key: string): Promise<any | null>;
}
