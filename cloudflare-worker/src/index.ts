import { Env, QueryRequest, BatchQueryRequest, CRUDRequest } from './types';
import {
  verifyToken,
  errorResponse,
  successResponse,
  handleOptions,
} from './middleware';
import {
  executeQuery,
  executeQueryFirst,
  executeWrite,
  executeBatch,
  executeCRUD,
} from './db';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }
    
    // Token Verification
    if (!verifyToken(request, env)) {
      return errorResponse('Unauthorized: Invalid or missing API token', 401, origin, env);
    }
    
    try {
      // Health Check
      if (path === '/health' || path === '/') {
        return successResponse(
          {
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
          },
          origin,
          env
        );
      }
      
      // Route: /query - Execute single SQL query
      if (path === '/query' && request.method === 'POST') {
        const body = await request.json() as QueryRequest;
        const { sql, params = [] } = body;
        
        if (!sql) {
          return errorResponse('SQL query is required', 400, origin, env);
        }
        
        const results = await executeQuery(env.DB, sql, params);
        return successResponse({ results }, origin, env);
      }
      
      // Route: /query-first - Execute query and return first result
      if (path === '/query-first' && request.method === 'POST') {
        const body = await request.json() as QueryRequest;
        const { sql, params = [] } = body;
        
        if (!sql) {
          return errorResponse('SQL query is required', 400, origin, env);
        }
        
        const result = await executeQueryFirst(env.DB, sql, params);
        return successResponse({ result }, origin, env);
      }
      
      // Route: /write - Execute write query (INSERT, UPDATE, DELETE)
      if (path === '/write' && request.method === 'POST') {
        const body = await request.json() as QueryRequest;
        const { sql, params = [] } = body;
        
        if (!sql) {
          return errorResponse('SQL query is required', 400, origin, env);
        }
        
        const result = await executeWrite(env.DB, sql, params);
        return successResponse(result, origin, env);
      }
      
      // Route: /batch - Execute multiple queries in a batch
      if (path === '/batch' && request.method === 'POST') {
        const body = await request.json() as BatchQueryRequest;
        const { queries } = body;
        
        if (!queries || queries.length === 0) {
          return errorResponse('Queries array is required', 400, origin, env);
        }
        
        const results = await executeBatch(env.DB, queries);
        return successResponse({ results }, origin, env);
      }
      
      // Route: /crud - Execute CRUD operation
      if (path === '/crud' && request.method === 'POST') {
        const body = await request.json() as CRUDRequest;
        
        if (!body.operation || !body.table) {
          return errorResponse('Operation and table are required', 400, origin, env);
        }
        
        const result = await executeCRUD(env.DB, body);
        return successResponse(result, origin, env);
      }
      
      // Route: /students - Get all students (example)
      if (path === '/students' && request.method === 'GET') {
        const academyId = url.searchParams.get('academyId');
        
        let sql = 'SELECT id, email, name, grade, studentId, phone, parentPhone, approved, createdAt FROM User WHERE role = ?';
        const params: any[] = ['STUDENT'];
        
        if (academyId) {
          sql += ' AND academyId = ?';
          params.push(academyId);
        }
        
        sql += ' ORDER BY createdAt DESC';
        
        const results = await executeQuery(env.DB, sql, params);
        return successResponse({ students: results }, origin, env);
      }
      
      // Route: /student/:id - Get single student
      if (path.startsWith('/student/') && request.method === 'GET') {
        const studentId = path.split('/')[2];
        
        const sql = 'SELECT id, email, name, grade, studentId, phone, parentPhone, approved, createdAt FROM User WHERE id = ? AND role = ?';
        const result = await executeQueryFirst(env.DB, sql, [studentId, 'STUDENT']);
        
        if (!result) {
          return errorResponse('Student not found', 404, origin, env);
        }
        
        return successResponse({ student: result }, origin, env);
      }
      
      // 404 Not Found
      return errorResponse('Endpoint not found', 404, origin, env);
      
    } catch (error: any) {
      console.error('Worker error:', error);
      return errorResponse(
        `Internal server error: ${error.message}`,
        500,
        origin,
        env
      );
    }
  },
};
