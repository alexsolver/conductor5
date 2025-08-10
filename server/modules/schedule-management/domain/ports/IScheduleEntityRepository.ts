
export interface IScheduleEntityRepository {
  create(schedule: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, schedule: any): Promise<any>;
  delete(id: string): Promise<void>;
}
