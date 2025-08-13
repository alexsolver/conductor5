
export class SqlParameterValidator {
  /**
   * Validates SQL parameter count matches expected values
   */
  static validateParameters(query: string, values: any[]): void {
    const parameterMatches = query.match(/\$\d+/g) || [];
    const parameterCount = parameterMatches.length;
    const maxParameterIndex = parameterMatches.length > 0 
      ? Math.max(...parameterMatches.map(p => parseInt(p.substring(1)))) 
      : 0;
    
    if (parameterCount !== values.length) {
      throw new Error(
        `SQL parameter mismatch: query expects ${parameterCount} parameters, got ${values.length}. Max parameter index: $${maxParameterIndex}`
      );
    }

    if (maxParameterIndex > values.length) {
      throw new Error(
        `SQL parameter index error: highest parameter is $${maxParameterIndex} but only ${values.length} values provided`
      );
    }
  }

  /**
   * Builds parameterized WHERE clause safely
   */
  static buildWhereClause(filters: Record<string, any>, startIndex: number = 1): {
    clause: string;
    values: any[];
    nextIndex: number;
  } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = startIndex;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && key.includes('name')) {
          conditions.push(`${key} ILIKE $${paramIndex}`);
          values.push(`%${value}%`);
        } else {
          conditions.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    return {
      clause: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '',
      values,
      nextIndex: paramIndex
    };
  }

  /**
   * Builds UPDATE SET clause safely
   */
  static buildSetClause(data: Record<string, any>, startIndex: number = 1): {
    clause: string;
    values: any[];
    nextIndex: number;
  } {
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = startIndex;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setFields.length === 0) {
      throw new Error('No fields to update');
    }

    return {
      clause: setFields.join(', '),
      values,
      nextIndex: paramIndex
    };
  }

  /**
   * Safely builds a complete UPDATE query with validation
   */
  static buildUpdateQuery(
    tableName: string,
    updateData: Record<string, any>,
    whereClause: Record<string, any>,
    options: { addTimestamp?: boolean } = {}
  ): { query: string; values: any[] } {
    const setResult = this.buildSetClause(updateData, 1);
    let { clause: setClause, values, nextIndex } = setResult;

    // Add timestamp if requested
    if (options.addTimestamp) {
      setClause += ', updated_at = NOW()';
    }

    const whereResult = this.buildWhereClause(whereClause, nextIndex);
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}
      ${whereResult.clause}
      RETURNING *
    `;

    const allValues = [...values, ...whereResult.values];
    
    // Validate before returning
    this.validateParameters(query, allValues);

    return { query, values: allValues };
  }
}
