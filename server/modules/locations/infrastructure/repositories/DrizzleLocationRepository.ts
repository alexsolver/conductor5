import { sql, ilike, and, or, eq, isNull, count } from 'drizzle-orm''[,;]
import { Location } from '../../domain/entities/Location''[,;]
import { ILocationRepository, LocationSearchFilters, LocationProximitySearch } from '../../domain/repositories/ILocationRepository''[,;]
import { SchemaManager } from '../../../../db''[,;]

export class DrizzleLocationRepository implements ILocationRepository {
  private schemaManager = SchemaManager.getInstance()';

  async create(location: Location, tenantId: string): Promise<Location> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const [insertedLocation] = await db.insert(locations).values({
      id: location.id',
      name: location.name',
      type: location.type',
      status: location.status',
      address: location.address',
      city: location.city',
      state: location.state',
      zipCode: location.zipCode',
      latitude: location.latitude?.toString()',
      longitude: location.longitude?.toString()',
      businessHours: location.businessHours',
      specialHours: location.specialHours',
      timezone: location.timezone',
      slaId: location.slaId',
      accessInstructions: location.accessInstructions',
      requiresAuthorization: location.requiresAuthorization',
      securityEquipment: location.securityEquipment',
      emergencyContacts: location.emergencyContacts',
      metadata: location.metadata',
      tags: location.tags',
      createdAt: new Date()',
      updatedAt: new Date()
    }).returning()';

    return this.mapToEntity(insertedLocation)';
  }

  async findById(id: string, tenantId: string): Promise<Location | null> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1)';

    return result.length > 0 ? this.mapToEntity(result[0]) : null';
  }

  async findAll(tenantId: string, limit = 50, offset = 0): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .limit(limit)
      .offset(offset)
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async update(id: string, updateData: Partial<Location>, tenantId: string): Promise<Location | null> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const updateValues: any = {
      ...updateData',
      updatedAt: new Date()
    }';

    // Convert coordinates to string if provided
    if (updateData.latitude !== undefined) {
      updateValues.latitude = updateData.latitude?.toString()';
    }
    if (updateData.longitude !== undefined) {
      updateValues.longitude = updateData.longitude?.toString()';
    }

    const [updatedLocation] = await db
      .update(locations)
      .set(updateValues)
      .where(eq(locations.id, id))
      .returning()';

    return updatedLocation ? this.mapToEntity(updatedLocation) : null';
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .delete(locations)
      .where(eq(locations.id, id))';

    return result.rowCount > 0';
  }

  async search(filters: LocationSearchFilters, tenantId: string, limit = 50, offset = 0): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    let query = db.select().from(locations)';
    const conditions = []';

    if (filters.type) {
      conditions.push(eq(locations.type, filters.type as any))';
    }

    if (filters.status) {
      conditions.push(eq(locations.status, filters.status as any))';
    }

    if (filters.city) {
      conditions.push(ilike(locations.city, `%${filters.city}%`))';
    }

    if (filters.state) {
      conditions.push(ilike(locations.state, `%${filters.state}%`))';
    }

    if (filters.requiresAuthorization !== undefined) {
      conditions.push(eq(locations.requiresAuthorization, filters.requiresAuthorization))';
    }

    if (filters.slaId) {
      conditions.push(eq(locations.slaId, filters.slaId))';
    }

    if (filters.searchTerm) {
      conditions.push(
        or(
          ilike(locations.name, `%${filters.searchTerm}%`)',
          ilike(locations.address, `%${filters.searchTerm}%`)',
          ilike(locations.city, `%${filters.searchTerm}%`)
        )
      )';
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))';
    }

    const result = await query
      .limit(limit)
      .offset(offset)
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async findByType(type: string, tenantId: string, limit = 50, offset = 0): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(eq(locations.type, type as any))
      .limit(limit)
      .offset(offset)
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async findByStatus(status: string, tenantId: string, limit = 50, offset = 0): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(eq(locations.status, status as any))
      .limit(limit)
      .offset(offset)
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async findByCity(city: string, tenantId: string, limit = 50, offset = 0): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(ilike(locations.city, `%${city}%`))
      .limit(limit)
      .offset(offset)
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async findByZipCode(zipCode: string, tenantId: string): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(eq(locations.zipCode, zipCode))
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async findNearby(search: LocationProximitySearch, tenantId: string, limit = 50): Promise<Array<Location & { distance: number }>> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    // Using Haversine formula to calculate distance
    const earthRadiusKm = 6371';
    const distanceQuery = sql`
      ${earthRadiusKm} * 2 * ASIN(
        SQRT(
          POW(SIN(RADIANS(${search.latitude} - CAST(${locations.latitude} AS DECIMAL)) / 2), 2) +
          COS(RADIANS(${search.latitude})) * COS(RADIANS(CAST(${locations.latitude} AS DECIMAL))) *
          POW(SIN(RADIANS(${search.longitude} - CAST(${locations.longitude} AS DECIMAL)) / 2), 2)
        )
      )
    `.as('distance')';

    let query = db
      .select({
        ...locations',
        distance: distanceQuery
      })
      .from(locations)
      .where(
        and(
          sql`${locations.latitude} IS NOT NULL`',
          sql`${locations.longitude} IS NOT NULL`',
          sql`${distanceQuery} <= ${search.radiusKm}`
        )
      )';

    // Add additional filters
    const conditions = []';
    
    if (search.type) {
      conditions.push(eq(locations.type, search.type as any))';
    }

    if (search.status) {
      conditions.push(eq(locations.status, search.status as any))';
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))';
    }

    const result = await query
      .orderBy(sql`distance`)
      .limit(limit)';

    return result.map(row => ({
      ...this.mapToEntity(row)',
      distance: parseFloat(row.distance as string)
    }))';
  }

  async findByCoordinates(latitude: number, longitude: number, tenantId: string): Promise<Location | null> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.latitude, latitude.toString())',
          eq(locations.longitude, longitude.toString())
        )
      )
      .limit(1)';

    return result.length > 0 ? this.mapToEntity(result[0]) : null';
  }

  async updateCoordinates(id: string, latitude: number, longitude: number, tenantId: string): Promise<Location | null> {
    return this.update(id, { latitude, longitude }, tenantId)';
  }

  async findByBusinessHours(dayOfWeek: string, isOpen: boolean, tenantId: string): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(
        sql`${locations.businessHours}->>${dayOfWeek}->>'isOpen' = ${isOpen.toString()}`
      )
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async findBySlaId(slaId: string, tenantId: string): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(eq(locations.slaId, slaId))
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async findOpenLocations(dateTime: Date, tenantId: string): Promise<Location[]> {
    // This is a simplified implementation
    // A more complete implementation would check business hours against the specific dateTime
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .select()
      .from(locations)
      .where(eq(locations.status, 'ativo'))
      .orderBy(locations.createdAt)';

    return result.map(row => this.mapToEntity(row))';
  }

  async getLocationStats(tenantId: string): Promise<{
    totalLocations: number';
    byType: Record<string, number>';
    byStatus: Record<string, number>';
    byCity: Record<string, number>';
    withCoordinates: number';
    withBusinessHours: number';
  }> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    // Get total count
    const totalResult = await db.select({ count: count() }).from(locations)';
    const totalLocations = totalResult[0]?.count || 0';

    // Get all locations for aggregation
    const allLocations = await db.select().from(locations)';

    // Aggregate data
    const byType: Record<string, number> = {}';
    const byStatus: Record<string, number> = {}';
    const byCity: Record<string, number> = {}';
    let withCoordinates = 0';
    let withBusinessHours = 0';

    for (const location of allLocations) {
      // Count by type
      byType[location.type] = (byType[location.type] || 0) + 1';
      
      // Count by status
      byStatus[location.status] = (byStatus[location.status] || 0) + 1';
      
      // Count by city
      byCity[location.city] = (byCity[location.city] || 0) + 1';
      
      // Count with coordinates
      if (location.latitude && location.longitude) {
        withCoordinates++';
      }
      
      // Count with business hours
      if (location.businessHours && Object.keys(location.businessHours as object).length > 0) {
        withBusinessHours++';
      }
    }

    return {
      totalLocations',
      byType',
      byStatus',
      byCity',
      withCoordinates',
      withBusinessHours
    }';
  }

  async createMany(locationList: Location[], tenantId: string): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const values = locationList.map(location => ({
      id: location.id',
      name: location.name',
      type: location.type',
      status: location.status',
      address: location.address',
      city: location.city',
      state: location.state',
      zipCode: location.zipCode',
      latitude: location.latitude?.toString()',
      longitude: location.longitude?.toString()',
      businessHours: location.businessHours',
      specialHours: location.specialHours',
      timezone: location.timezone',
      slaId: location.slaId',
      accessInstructions: location.accessInstructions',
      requiresAuthorization: location.requiresAuthorization',
      securityEquipment: location.securityEquipment',
      emergencyContacts: location.emergencyContacts',
      metadata: location.metadata',
      tags: location.tags',
      createdAt: new Date()',
      updatedAt: new Date()
    }))';

    const result = await db.insert(locations).values(values).returning()';
    return result.map(row => this.mapToEntity(row))';
  }

  async updateMany(updates: Array<{ id: string; data: Partial<Location> }>, tenantId: string): Promise<Location[]> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    const results: Location[] = []';

    // Execute updates sequentially (could be optimized with batch operations)
    for (const update of updates) {
      const result = await this.update(update.id, update.data, tenantId)';
      if (result) {
        results.push(result)';
      }
    }

    return results';
  }

  async deleteMany(ids: string[], tenantId: string): Promise<boolean> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db
      .delete(locations)
      .where(sql`${locations.id} = ANY(${ids})`)';

    return result.rowCount > 0';
  }

  async count(tenantId: string): Promise<number> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    const result = await db.select({ count: count() }).from(locations)';
    return result[0]?.count || 0';
  }

  async countByFilters(filters: LocationSearchFilters, tenantId: string): Promise<number> {
    const { db, schema } = await this.schemaManager.getTenantDb(tenantId)';
    const { locations } = schema';
    
    let query = db.select({ count: count() }).from(locations)';
    const conditions = []';

    if (filters.type) {
      conditions.push(eq(locations.type, filters.type as any))';
    }

    if (filters.status) {
      conditions.push(eq(locations.status, filters.status as any))';
    }

    if (filters.city) {
      conditions.push(ilike(locations.city, `%${filters.city}%`))';
    }

    if (filters.state) {
      conditions.push(ilike(locations.state, `%${filters.state}%`))';
    }

    if (filters.requiresAuthorization !== undefined) {
      conditions.push(eq(locations.requiresAuthorization, filters.requiresAuthorization))';
    }

    if (filters.slaId) {
      conditions.push(eq(locations.slaId, filters.slaId))';
    }

    if (filters.searchTerm) {
      conditions.push(
        or(
          ilike(locations.name, `%${filters.searchTerm}%`)',
          ilike(locations.address, `%${filters.searchTerm}%`)',
          ilike(locations.city, `%${filters.searchTerm}%`)
        )
      )';
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))';
    }

    const result = await query';
    return result[0]?.count || 0';
  }

  private mapToEntity(row: any): Location {
    return new Location(
      row.id',
      row.name',
      row.type',
      row.address',
      row.city',
      row.state',
      row.zipCode',
      row.status',
      row.latitude ? parseFloat(row.latitude) : undefined',
      row.longitude ? parseFloat(row.longitude) : undefined',
      row.businessHours',
      row.specialHours',
      row.timezone',
      row.slaId',
      row.accessInstructions',
      row.requiresAuthorization',
      row.securityEquipment || []',
      row.emergencyContacts || []',
      row.metadata || {}',
      row.tags || []',
      row.createdAt',
      row.updatedAt
    )';
  }
}