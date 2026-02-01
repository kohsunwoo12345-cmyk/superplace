import { Env, CRUDRequest } from './types';

/**
 * Execute Raw SQL Query
 */
export async function executeQuery(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<any> {
  try {
    const result = await db.prepare(sql).bind(...params).all();
    return result.results;
  } catch (error: any) {
    throw new Error(`Query failed: ${error.message}`);
  }
}

/**
 * Execute Single Row Query
 */
export async function executeQueryFirst(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<any> {
  try {
    const result = await db.prepare(sql).bind(...params).first();
    return result;
  } catch (error: any) {
    throw new Error(`Query failed: ${error.message}`);
  }
}

/**
 * Execute Write Query (INSERT, UPDATE, DELETE)
 */
export async function executeWrite(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<any> {
  try {
    const result = await db.prepare(sql).bind(...params).run();
    return {
      success: result.success,
      meta: result.meta,
    };
  } catch (error: any) {
    throw new Error(`Write failed: ${error.message}`);
  }
}

/**
 * Execute Batch Queries
 */
export async function executeBatch(
  db: D1Database,
  queries: Array<{ sql: string; params?: any[] }>
): Promise<any[]> {
  try {
    const statements = queries.map(q => 
      db.prepare(q.sql).bind(...(q.params || []))
    );
    
    const results = await db.batch(statements);
    return results.map((r: any) => r.results || r);
  } catch (error: any) {
    throw new Error(`Batch execution failed: ${error.message}`);
  }
}

/**
 * Build WHERE clause
 */
function buildWhereClause(where?: Record<string, any>): { clause: string; params: any[] } {
  if (!where || Object.keys(where).length === 0) {
    return { clause: '', params: [] };
  }
  
  const conditions: string[] = [];
  const params: any[] = [];
  
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      conditions.push(`${key} IS NULL`);
    } else {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }
  
  return {
    clause: ` WHERE ${conditions.join(' AND ')}`,
    params,
  };
}

/**
 * CRUD Operations Helper
 */
export async function executeCRUD(
  db: D1Database,
  request: CRUDRequest
): Promise<any> {
  const { operation, table, data, where, select, limit, offset, orderBy } = request;
  
  switch (operation) {
    case 'CREATE': {
      if (!data) throw new Error('Data is required for CREATE operation');
      
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(data);
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      return executeWrite(db, sql, values);
    }
    
    case 'READ': {
      const selectClause = select && select.length > 0 ? select.join(', ') : '*';
      const { clause: whereClause, params } = buildWhereClause(where);
      
      let sql = `SELECT ${selectClause} FROM ${table}${whereClause}`;
      
      if (orderBy) {
        sql += ` ORDER BY ${orderBy.column} ${orderBy.direction}`;
      }
      
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }
      
      if (offset) {
        sql += ` OFFSET ${offset}`;
      }
      
      return executeQuery(db, sql, params);
    }
    
    case 'UPDATE': {
      if (!data) throw new Error('Data is required for UPDATE operation');
      if (!where) throw new Error('WHERE clause is required for UPDATE operation');
      
      const setClauses = Object.keys(data).map(key => `${key} = ?`);
      const setValues = Object.values(data);
      
      const { clause: whereClause, params: whereParams } = buildWhereClause(where);
      
      const sql = `UPDATE ${table} SET ${setClauses.join(', ')}${whereClause}`;
      return executeWrite(db, sql, [...setValues, ...whereParams]);
    }
    
    case 'DELETE': {
      if (!where) throw new Error('WHERE clause is required for DELETE operation');
      
      const { clause: whereClause, params } = buildWhereClause(where);
      
      const sql = `DELETE FROM ${table}${whereClause}`;
      return executeWrite(db, sql, params);
    }
    
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
