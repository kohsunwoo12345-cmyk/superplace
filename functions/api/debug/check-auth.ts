interface Env {
  DB: D1Database;
}

// JWT 토큰 디코딩 함수 (Unicode 안전)
function decodeToken(token: string): any {
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

// 디버그용 인증 확인 API
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    
    // URL 파라미터로 받은 정보
    const paramRole = url.searchParams.get('role');
    const paramAcademyId = url.searchParams.get('academyId');
    const paramEmail = url.searchParams.get('email');
    
    // Authorization 헤더
    const authHeader = context.request.headers.get("Authorization");
    
    let tokenInfo = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      tokenInfo = decodeToken(token);
    }
    
    // 실제 DB에서 사용자 정보 확인
    let dbUser = null;
    if (tokenInfo && tokenInfo.email && DB) {
      dbUser = await DB.prepare('SELECT id, email, name, role, academy_id FROM users WHERE email = ?')
        .bind(tokenInfo.email)
        .first();
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          timestamp: new Date().toISOString(),
          headers: {
            authorization: authHeader ? 'Present' : 'Missing',
          },
          urlParams: {
            role: paramRole,
            academyId: paramAcademyId,
            email: paramEmail,
          },
          tokenDecoded: tokenInfo,
          databaseUser: dbUser,
          comparison: {
            roleMatch: tokenInfo?.role === dbUser?.role,
            academyIdMatch: tokenInfo?.academyId === dbUser?.academy_id,
            emailMatch: tokenInfo?.email === dbUser?.email,
          }
        }
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
