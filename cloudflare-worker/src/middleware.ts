import { Env, ApiResponse } from './types';

/**
 * CORS Headers
 */
export function getCorsHeaders(origin: string, env: Env): HeadersInit {
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Token',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  return {};
}

/**
 * Token Authentication
 */
export function verifyToken(request: Request, env: Env): boolean {
  // Authorization 헤더 확인
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token === env.API_SECRET_TOKEN) {
      return true;
    }
  }
  
  // X-API-Token 헤더 확인 (대체 방법)
  const apiToken = request.headers.get('X-API-Token');
  if (apiToken === env.API_SECRET_TOKEN) {
    return true;
  }
  
  return false;
}

/**
 * Error Response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  origin?: string,
  env?: Env
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (origin && env) {
    Object.assign(headers, getCorsHeaders(origin, env));
  }
  
  return new Response(JSON.stringify(response), {
    status,
    headers,
  });
}

/**
 * Success Response
 */
export function successResponse<T>(
  data: T,
  origin?: string,
  env?: Env
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (origin && env) {
    Object.assign(headers, getCorsHeaders(origin, env));
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers,
  });
}

/**
 * Handle CORS Preflight
 */
export function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '*';
  
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin, env),
  });
}
