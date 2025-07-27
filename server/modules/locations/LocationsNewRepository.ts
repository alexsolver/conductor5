import { eq, and, sql, desc, ilike } from "drizzle-orm";
import { locais, regioes, rotasDinamicas, trechos, rotasTrecho, areas, agrupamentos } from "../../../shared/schema-locations-new";
import type { 
  NewLocal, NewRegiao, NewRotaDinamica, NewTrecho, 
  NewRotaTrecho, NewArea, NewAgrupamento 
} from "../../../shared/schema-locations-new";

export class LocationsNewRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Get records by type with filtering
  async getRecordsByType(tenantId: string, recordType: string, filters?: { search?: string; status?: string }) {
    const tableMap: { [key: string]: any } = {
      'local': locais,
      'regiao': regioes,
      'rota-dinamica': rotasDinamicas,
      'trecho': trechos,
      'rota-trecho': rotasTrecho,
      'area': areas,
      'agrupamento': agrupamentos
    };

    const table = tableMap[recordType];
    if (!table) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    let query = this.db.select().from(table).where(eq(table.tenantId, tenantId));

    if (filters?.search) {
      // Add search logic based on record type
      if (recordType === 'local') {
        query = query.where(
          and(
            eq(table.tenantId, tenantId),
            ilike(table.descricao, `%${filters.search}%`)
          )
        );
      }
    }

    if (filters?.status) {
      query = query.where(
        and(
          eq(table.tenantId, tenantId),
          eq(table.ativo, filters.status === 'active')
        )
      );
    }

    return await query.orderBy(desc(table.createdAt));
  }

  // Get statistics by record type
  async getStatsByType(tenantId: string, recordType: string) {
    const tableMap: { [key: string]: any } = {
      'local': locais,
      'regiao': regioes,
      'rota-dinamica': rotasDinamicas,
      'trecho': trechos,
      'rota-trecho': rotasTrecho,
      'area': areas,
      'agrupamento': agrupamentos
    };

    const table = tableMap[recordType];
    if (!table) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    const stats = await this.db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${table.ativo} = true)`,
        inactive: sql<number>`count(*) filter (where ${table.ativo} = false)`
      })
      .from(table)
      .where(eq(table.tenantId, tenantId));

    return stats[0] || { total: 0, active: 0, inactive: 0 };
  }

  // CRUD Operations for Local
  async createLocal(tenantId: string, data: NewLocal) {
    const [local] = await this.db
      .insert(locais)
      .values({ ...data, tenantId })
      .returning();
    return local;
  }

  async createRegiao(tenantId: string, data: NewRegiao) {
    const [regiao] = await this.db
      .insert(regioes)
      .values({ ...data, tenantId })
      .returning();
    return regiao;
  }

  async createRotaDinamica(tenantId: string, data: NewRotaDinamica) {
    const [rota] = await this.db
      .insert(rotasDinamicas)
      .values({ ...data, tenantId })
      .returning();
    return rota;
  }

  async createTrecho(tenantId: string, data: NewTrecho) {
    const [trecho] = await this.db
      .insert(trechos)
      .values({ ...data, tenantId })
      .returning();
    return trecho;
  }

  async createRotaTrecho(tenantId: string, data: NewRotaTrecho) {
    const [rotaTrecho] = await this.db
      .insert(rotasTrecho)
      .values({ ...data, tenantId })
      .returning();
    return rotaTrecho;
  }

  async createArea(tenantId: string, data: NewArea) {
    const [area] = await this.db
      .insert(areas)
      .values({ ...data, tenantId })
      .returning();
    return area;
  }

  async createAgrupamento(tenantId: string, data: NewAgrupamento) {
    const [agrupamento] = await this.db
      .insert(agrupamentos)
      .values({ ...data, tenantId })
      .returning();
    return agrupamento;
  }

  // Generic update and delete
  async updateRecord(tenantId: string, recordType: string, id: string, data: any) {
    const tableMap: { [key: string]: any } = {
      'local': locais,
      'regiao': regioes,
      'rota-dinamica': rotasDinamicas,
      'trecho': trechos,
      'rota-trecho': rotasTrecho,
      'area': areas,
      'agrupamento': agrupamentos
    };

    const table = tableMap[recordType];
    if (!table) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    const [updated] = await this.db
      .update(table)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(table.id, id), eq(table.tenantId, tenantId)))
      .returning();

    return updated;
  }

  async deleteRecord(tenantId: string, recordType: string, id: string) {
    const tableMap: { [key: string]: any } = {
      'local': locais,
      'regiao': regioes,
      'rota-dinamica': rotasDinamicas,
      'trecho': trechos,
      'rota-trecho': rotasTrecho,
      'area': areas,
      'agrupamento': agrupamentos
    };

    const table = tableMap[recordType];
    if (!table) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    await this.db
      .delete(table)
      .where(and(eq(table.id, id), eq(table.tenantId, tenantId)));
  }
}