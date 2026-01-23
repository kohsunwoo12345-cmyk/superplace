/**
 * Cloudflare Worker DB Client for Next.js
 * 
 * This client communicates with Cloudflare Worker that has D1 binding.
 * Much faster than D1 REST API.
 */

interface WorkerClientConfig {
  workerUrl: string;
  apiToken: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface QueryOptions {
  sql: string;
  params?: any[];
}

interface CRUDOptions {
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
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

class WorkerDBClient {
  private workerUrl: string;
  private apiToken: string;

  constructor(config: WorkerClientConfig) {
    this.workerUrl = config.workerUrl;
    this.apiToken = config.apiToken;
  }

  /**
   * Execute SQL query
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const response = await this.request<{ results: T[] }>('/query', {
      sql,
      params,
    });
    
    return response.results;
  }

  /**
   * Execute query and return first result
   */
  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const response = await this.request<{ result: T | null }>('/query-first', {
      sql,
      params,
    });
    
    return response.result;
  }

  /**
   * Execute write query (INSERT, UPDATE, DELETE)
   */
  async write(sql: string, params: any[] = []): Promise<{ success: boolean; meta: any }> {
    return this.request('/write', { sql, params });
  }

  /**
   * Execute multiple queries in batch
   */
  async batch(queries: QueryOptions[]): Promise<any[]> {
    const response = await this.request<{ results: any[] }>('/batch', { queries });
    return response.results;
  }

  /**
   * Execute CRUD operation
   */
  async crud<T = any>(options: CRUDOptions): Promise<T> {
    return this.request<T>('/crud', options);
  }

  /**
   * Get all students
   */
  async getStudents(academyId?: string): Promise<any[]> {
    const url = academyId 
      ? `/students?academyId=${encodeURIComponent(academyId)}`
      : '/students';
    
    const response = await this.request<{ students: any[] }>(url, null, 'GET');
    return response.students;
  }

  /**
   * Get single student
   */
  async getStudent(studentId: string): Promise<any | null> {
    try {
      const response = await this.request<{ student: any }>(
        `/student/${encodeURIComponent(studentId)}`,
        null,
        'GET'
      );
      return response.student;
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version: string; timestamp: string }> {
    return this.request('/health', null, 'GET');
  }

  /**
   * Internal request method
   */
  private async request<T = any>(
    path: string,
    body: any = null,
    method: string = 'POST'
  ): Promise<T> {
    const url = `${this.workerUrl}${path}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
        'X-API-Token': this.apiToken,
      },
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, options);
      const json: ApiResponse<T> = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || 'Request failed');
      }
      
      return json.data as T;
    } catch (error: any) {
      console.error('Worker DB Client Error:', error);
      throw new Error(`Worker request failed: ${error.message}`);
    }
  }
}

/**
 * Create Worker DB Client instance
 */
export function createWorkerDBClient(config?: Partial<WorkerClientConfig>): WorkerDBClient {
  const workerUrl = config?.workerUrl || process.env.CLOUDFLARE_WORKER_URL || '';
  const apiToken = config?.apiToken || process.env.CLOUDFLARE_WORKER_TOKEN || '';
  
  if (!workerUrl) {
    throw new Error('CLOUDFLARE_WORKER_URL is not set');
  }
  
  if (!apiToken) {
    throw new Error('CLOUDFLARE_WORKER_TOKEN is not set');
  }
  
  return new WorkerDBClient({ workerUrl, apiToken });
}

// Export types
export type { WorkerClientConfig, QueryOptions, CRUDOptions };
export { WorkerDBClient };
