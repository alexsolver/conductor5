// NEW LOCATIONS MODULE - Repository Layer
import { Pool } from 'pg';
import { Location, NewLocation, LocationSegment, NewLocationSegment, 
         LocationArea, NewLocationArea, LocationRoute, NewLocationRoute,
         AreaGroup, NewAreaGroup, LocationAreaMembership } from '../../../shared/schema-locations';

export class LocationsRepository {
  constructor(private pool: Pool) {}

  // Core Locations CRUD Operations
  async getAllLocations(tenantId: string, options: {
    page?: number;
    limit?: number;
    locationType?: string;
    status?: string;
    search?: string;
    favorites?: boolean;
    tag?: string;
  } = {}): Promise<{ locations: Location[]; total: number }> {
    const { page = 1, limit = 50, locationType, status, search, favorites, tag } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (locationType) {
      whereClause += ` AND location_type = $${paramIndex}`;
      params.push(locationType);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sprint 2 - Enhanced Filters
    if (favorites === true) {
      whereClause += ` AND is_favorite = true`;
    }

    if (tag) {
      whereClause += ` AND $${paramIndex} = ANY(tags)`;
      params.push(tag);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM locations ${whereClause}`;
    const dataQuery = `
      SELECT * FROM locations 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(countQuery, params.slice(0, -2)),
      this.pool.query(dataQuery, params)
    ]);

    return {
      locations: dataResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  async getLocationById(id: string, tenantId: string): Promise<Location | null> {
    const query = 'SELECT * FROM locations WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createLocation(locationData: NewLocation): Promise<Location> {
    const query = `
      INSERT INTO locations (
        tenant_id, name, description, location_type, geometry_type,
        coordinates, address_data, business_hours, access_requirements,
        sla_config, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      locationData.tenantId,
      locationData.name,
      locationData.description,
      locationData.locationType,
      locationData.geometryType,
      JSON.stringify(locationData.coordinates),
      locationData.addressData ? JSON.stringify(locationData.addressData) : null,
      locationData.businessHours ? JSON.stringify(locationData.businessHours) : null,
      locationData.accessRequirements ? JSON.stringify(locationData.accessRequirements) : null,
      locationData.slaConfig ? JSON.stringify(locationData.slaConfig) : null,
      locationData.status || 'active'
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateLocation(id: string, tenantId: string, updates: Partial<NewLocation>): Promise<Location | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 3;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const columnName = this.camelToSnake(key);
        if (['coordinates', 'address_data', 'business_hours', 'access_requirements', 'sla_config'].includes(columnName)) {
          setClause.push(`${columnName} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${columnName} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (setClause.length === 0) return null;

    setClause.push(`updated_at = NOW()`);

    const query = `
      UPDATE locations 
      SET ${setClause.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [id, tenantId, ...values]);
    return result.rows[0] || null;
  }

  async deleteLocation(id: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM locations WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }

  // Location Segments Operations
  async getLocationSegments(locationId: string, tenantId: string): Promise<LocationSegment[]> {
    const query = `
      SELECT * FROM location_segments 
      WHERE location_id = $1 AND tenant_id = $2
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [locationId, tenantId]);
    return result.rows;
  }

  async createLocationSegment(segmentData: NewLocationSegment): Promise<LocationSegment> {
    const query = `
      INSERT INTO location_segments (
        tenant_id, location_id, segment_type, start_coordinates,
        end_coordinates, path_coordinates, length_meters, infrastructure_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      segmentData.tenantId,
      segmentData.locationId,
      segmentData.segmentType,
      JSON.stringify(segmentData.startCoordinates),
      JSON.stringify(segmentData.endCoordinates),
      segmentData.pathCoordinates ? JSON.stringify(segmentData.pathCoordinates) : null,
      segmentData.lengthMeters,
      segmentData.infrastructureData ? JSON.stringify(segmentData.infrastructureData) : null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Location Areas Operations
  async getLocationAreas(locationId: string, tenantId: string): Promise<LocationArea[]> {
    const query = `
      SELECT * FROM location_areas 
      WHERE location_id = $1 AND tenant_id = $2
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [locationId, tenantId]);
    return result.rows;
  }

  async createLocationArea(areaData: NewLocationArea): Promise<LocationArea> {
    const query = `
      INSERT INTO location_areas (
        tenant_id, location_id, area_type, boundary_coordinates,
        area_size_km2, population_estimate, service_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      areaData.tenantId,
      areaData.locationId,
      areaData.areaType,
      JSON.stringify(areaData.boundaryCoordinates),
      areaData.areaSizeKm2,
      areaData.populationEstimate,
      areaData.serviceLevel || 'standard'
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Location Routes Operations
  async getAllRoutes(tenantId: string): Promise<LocationRoute[]> {
    const query = `
      SELECT * FROM location_routes 
      WHERE tenant_id = $1
      ORDER BY route_name ASC
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async createLocationRoute(routeData: NewLocationRoute): Promise<LocationRoute> {
    const query = `
      INSERT INTO location_routes (
        tenant_id, route_name, route_type, route_coordinates,
        estimated_duration_minutes, difficulty_level, required_skills
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      routeData.tenantId,
      routeData.routeName,
      routeData.routeType,
      JSON.stringify(routeData.routeCoordinates),
      routeData.estimatedDurationMinutes,
      routeData.difficultyLevel || 'medium',
      routeData.requiredSkills ? JSON.stringify(routeData.requiredSkills) : null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Area Groups Operations
  async getAllAreaGroups(tenantId: string): Promise<AreaGroup[]> {
    const query = `
      SELECT * FROM area_groups 
      WHERE tenant_id = $1
      ORDER BY group_name ASC
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async createAreaGroup(groupData: NewAreaGroup): Promise<AreaGroup> {
    const query = `
      INSERT INTO area_groups (
        tenant_id, group_name, group_type, parent_group_id,
        coordinates_center, total_locations
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      groupData.tenantId,
      groupData.groupName,
      groupData.groupType,
      groupData.parentGroupId,
      groupData.coordinatesCenter ? JSON.stringify(groupData.coordinatesCenter) : null,
      groupData.totalLocations || 0
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Geospatial Operations
  async findNearestLocations(
    tenantId: string, 
    coordinates: { lat: number; lng: number }, 
    radiusKm: number = 10,
    limit: number = 10
  ): Promise<Location[]> {
    // This would require PostGIS extension for production
    // For now, implementing basic distance calculation
    const query = `
      SELECT *, 
        ST_Distance(
          ST_MakePoint((coordinates->>'lng')::float, (coordinates->>'lat')::float),
          ST_MakePoint($2, $3)
        ) as distance_km
      FROM locations 
      WHERE tenant_id = $1 
        AND status = 'active'
      ORDER BY distance_km ASC
      LIMIT $4
    `;

    const result = await this.pool.query(query, [tenantId, coordinates.lng, coordinates.lat, limit]);
    return result.rows;
  }

  async getCoverageAnalysis(tenantId: string): Promise<any> {
    const query = `
      SELECT 
        location_type,
        status,
        COUNT(*) as count,
        AVG(CASE WHEN coordinates IS NOT NULL THEN 1 ELSE 0 END) as coverage_percentage
      FROM locations 
      WHERE tenant_id = $1
      GROUP BY location_type, status
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getLocationStats(tenantId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_locations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_locations,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_locations,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_locations,
        COUNT(CASE WHEN location_type = 'point' THEN 1 END) as point_locations,
        COUNT(CASE WHEN location_type = 'segment' THEN 1 END) as segment_locations,
        COUNT(CASE WHEN location_type = 'area' THEN 1 END) as area_locations,
        COUNT(CASE WHEN location_type = 'region' THEN 1 END) as region_locations,
        COUNT(CASE WHEN location_type = 'route' THEN 1 END) as route_locations
      FROM locations 
      WHERE tenant_id = $1
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows[0];
  }

  // Utility method to convert camelCase to snake_case
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Sprint 2 Methods - Tags System
  async addTag(id: string, tenantId: string, tag: string): Promise<Location | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      UPDATE ${schemaName}.locations 
      SET tags = COALESCE(tags, ARRAY[]::TEXT[]) || ARRAY[$3]::TEXT[],
          updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND NOT ($3 = ANY(COALESCE(tags, ARRAY[]::TEXT[])))
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, tenantId, tag]);
    return result.rows[0] || null;
  }

  async removeTag(id: string, tenantId: string, tag: string): Promise<Location | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      UPDATE ${schemaName}.locations 
      SET tags = array_remove(COALESCE(tags, ARRAY[]::TEXT[]), $3),
          updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, tenantId, tag]);
    return result.rows[0] || null;
  }

  // Sprint 2 Methods - Favorites System
  async toggleFavorite(id: string, tenantId: string): Promise<Location | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      UPDATE ${schemaName}.locations 
      SET is_favorite = NOT COALESCE(is_favorite, false),
          updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  // Sprint 2 Methods - Attachments System
  async addAttachment(id: string, tenantId: string, filename: string, filepath: string, filesize: number): Promise<Location | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const attachmentData = {
      filename,
      filepath,
      filesize,
      uploadedAt: new Date().toISOString()
    };

    const query = `
      UPDATE ${schemaName}.locations 
      SET attachments = jsonb_set(
        COALESCE(attachments, '{}'::jsonb),
        ARRAY[$3],
        $4::jsonb
      ),
      updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      id, 
      tenantId, 
      filename, 
      JSON.stringify(attachmentData)
    ]);
    return result.rows[0] || null;
  }

  async removeAttachment(id: string, tenantId: string, filename: string): Promise<Location | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const query = `
      UPDATE ${schemaName}.locations 
      SET attachments = attachments - $3,
          updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, tenantId, filename]);
    return result.rows[0] || null;
  }

  // Sprint 2 Methods - Location Hierarchy
  async setParentLocation(id: string, tenantId: string, parentLocationId: string | null): Promise<Location | null> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Prevent circular references
    if (parentLocationId) {
      const circularCheck = await this.checkCircularReference(id, parentLocationId, tenantId);
      if (circularCheck) {
        throw new Error("Circular reference detected in location hierarchy");
      }
    }

    const query = `
      UPDATE ${schemaName}.locations 
      SET parent_location_id = $3,
          updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, tenantId, parentLocationId]);
    return result.rows[0] || null;
  }

  async getLocationHierarchy(id: string, tenantId: string): Promise<any> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Get children
    const childrenQuery = `
      WITH RECURSIVE location_tree AS (
        SELECT id, name, parent_location_id, 0 as level
        FROM ${schemaName}.locations 
        WHERE parent_location_id = $1 AND tenant_id = $2
        
        UNION ALL
        
        SELECT l.id, l.name, l.parent_location_id, lt.level + 1
        FROM ${schemaName}.locations l
        INNER JOIN location_tree lt ON l.parent_location_id = lt.id
        WHERE l.tenant_id = $2
      )
      SELECT * FROM location_tree ORDER BY level, name
    `;

    // Get parents
    const parentsQuery = `
      WITH RECURSIVE parent_tree AS (
        SELECT id, name, parent_location_id, 0 as level
        FROM ${schemaName}.locations 
        WHERE id = $1 AND tenant_id = $2
        
        UNION ALL
        
        SELECT l.id, l.name, l.parent_location_id, pt.level - 1
        FROM ${schemaName}.locations l
        INNER JOIN parent_tree pt ON l.id = pt.parent_location_id
        WHERE l.tenant_id = $2
      )
      SELECT * FROM parent_tree WHERE level < 0 ORDER BY level DESC
    `;

    const [childrenResult, parentsResult] = await Promise.all([
      this.pool.query(childrenQuery, [id, tenantId]),
      this.pool.query(parentsQuery, [id, tenantId])
    ]);

    return {
      children: childrenResult.rows,
      parents: parentsResult.rows
    };
  }

  private async checkCircularReference(locationId: string, potentialParentId: string, tenantId: string): Promise<boolean> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    const query = `
      WITH RECURSIVE parent_check AS (
        SELECT id, parent_location_id
        FROM ${schemaName}.locations 
        WHERE id = $1 AND tenant_id = $3
        
        UNION ALL
        
        SELECT l.id, l.parent_location_id
        FROM ${schemaName}.locations l
        INNER JOIN parent_check pc ON l.id = pc.parent_location_id
        WHERE l.tenant_id = $3
      )
      SELECT COUNT(*) as count FROM parent_check WHERE id = $2
    `;

    const result = await this.pool.query(query, [potentialParentId, locationId, tenantId]);
    return parseInt(result.rows[0].count) > 0;
  }
}