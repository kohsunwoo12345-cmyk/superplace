/**
 * 인증 및 권한 체크 유틸리티
 */

/**
 * Bearer 토큰 파싱
 * 형식: "Bearer userId|email|role|academyId"
 */
export function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null
  };
}

/**
 * 관리자 권한 체크 (SUPER_ADMIN, SUPER_AD, ADMIN)
 * SUPER_AD는 역호환을 위해 포함
 */
export function isAdmin(role: string): boolean {
  const adminRoles = ['SUPER_ADMIN', 'SUPER_AD', 'ADMIN'];
  return adminRoles.includes(role);
}

/**
 * 최고 관리자 권한 체크 (SUPER_ADMIN, SUPER_AD만)
 */
export function isSuperAdmin(role: string): boolean {
  const superAdminRoles = ['SUPER_ADMIN', 'SUPER_AD'];
  return superAdminRoles.includes(role);
}

/**
 * 학원장 이상 권한 체크 (SUPER_ADMIN, SUPER_AD, ADMIN, DIRECTOR)
 */
export function isDirectorOrAbove(role: string): boolean {
  const directorRoles = ['SUPER_ADMIN', 'SUPER_AD', 'ADMIN', 'DIRECTOR'];
  return directorRoles.includes(role);
}

/**
 * 권한 에러 응답 생성
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized', status: number = 401) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 권한 체크 미들웨어
 * @param authHeader Authorization 헤더
 * @param requiredRole 필요한 최소 권한 ('admin' | 'super_admin' | 'director')
 * @returns { authorized: boolean, tokenData: any, response?: Response }
 */
export function checkAuth(authHeader: string | null, requiredRole: 'admin' | 'super_admin' | 'director' = 'admin') {
  const tokenData = parseToken(authHeader);
  
  if (!tokenData) {
    return {
      authorized: false,
      tokenData: null,
      response: createUnauthorizedResponse('Invalid or missing token')
    };
  }

  let hasPermission = false;
  
  switch (requiredRole) {
    case 'super_admin':
      hasPermission = isSuperAdmin(tokenData.role);
      break;
    case 'director':
      hasPermission = isDirectorOrAbove(tokenData.role);
      break;
    case 'admin':
    default:
      hasPermission = isAdmin(tokenData.role);
      break;
  }

  if (!hasPermission) {
    return {
      authorized: false,
      tokenData,
      response: createUnauthorizedResponse(
        `Insufficient permissions. Required: ${requiredRole}, Your role: ${tokenData.role}`,
        403
      )
    };
  }

  return {
    authorized: true,
    tokenData,
    response: undefined
  };
}
