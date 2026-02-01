/**
 * Cloudflare Worker Environment
 */
export interface Env {
  DB: D1Database;
  API_SECRET_TOKEN: string;
  ALLOWED_ORIGINS: string;
}

/**
 * API Request Body Types
 */
export interface QueryRequest {
  sql: string;
  params?: any[];
}

export interface BatchQueryRequest {
  queries: Array<{
    sql: string;
    params?: any[];
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * CRUD Operation Types
 */
export type CRUDOperation = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

export interface CRUDRequest {
  operation: CRUDOperation;
  table: string;
  data?: Record<string, any>;
  where?: Record<string, any>;
  select?: string[];
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    direction: 'ASC' | 'DESC';
  };
}
