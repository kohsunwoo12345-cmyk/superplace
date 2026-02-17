// JWT 토큰 디코딩 함수 (Unicode 안전)
export function decodeToken(token: string): any {
  try {
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
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    
    // 만료 시간 확인
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

// Authorization 헤더에서 사용자 정보 추출
export function getUserFromAuth(request: Request): any {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return decodeToken(token);
}
