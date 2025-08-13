
export class SqlParameterValidator {
  /**
   * Validates SQL parameter count matches expected values
   */
  static validateParameters(query: string, values: any[]): void {
    const parameterCount = (query.match(/\$\d+/g) || []).length;
    
    if (parameterCount !== values.length) {
      throw new Error(
        `SQL parameter mismatch: query expects ${parameterCount} parameters, got ${values.length}`
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
}
