// 토큰 디코딩 함수 (현재 시스템의 토큰 형식 지원)
export function decodeToken(token: string): any {
  try {
    // 현재 시스템 토큰 형식: "userId|email|role|timestamp"
    // 예: "1|admin@superplace.com|SUPER_ADMIN|1709878987654"
    
    // 먼저 | 구분자로 파싱 시도 (새 형식)
    let parts = token.split('|');
    
    // 현재 시스템의 단순 토큰 형식 (4개 파트, | 구분자)
    if (parts.length === 4) {
      const [userId, email, role, timestamp] = parts;
      
      // 토큰 만료 확인 (24시간)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const tokenAge = now - tokenTime;
      const maxAge = 24 * 60 * 60 * 1000; // 24시간
      
      if (tokenAge > maxAge) {
        console.error('Token expired:', { tokenAge, maxAge });
        throw new Error('Token expired');
      }
      
      console.log('Simple token decoded (| separator):', { userId, email, role });
      
      return {
        userId,
        id: userId,  // 호환성을 위해 id도 제공
        email,
        role,
        timestamp: tokenTime,
      };
    }
    
    // . 구분자로 파싱 시도 (구 형식 또는 JWT)
    parts = token.split('.');
    
    // JWT 형식 (3개 파트: header.payload.signature)
    if (parts.length === 3) {
      const base64UrlDecode = (str: string): string => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
          base64 += '=';
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
      };
      
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      
      // 만료 시간 확인
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      
      console.log('JWT token decoded:', payload);
      
      return payload;
    }
    
    throw new Error('Invalid token format');
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

// Authorization 헤더에서 사용자 정보 추출
export function getUserFromAuth(request: Request): any {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error('No Authorization header or invalid format');
    return null;
  }
  
  const token = authHeader.substring(7);
  return decodeToken(token);
}
