interface Env {
  DB: D1Database;
}

// JWT 토큰 디코딩 함수 (Unicode 안전)
function decodeToken(token: string): any {
  try {
    const base64UrlDecode = (str: string): string => {
      // URL-safe base64를 일반 base64로 변환
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      
      // padding 추가
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      
      // Base64 디코딩
      const binary = atob(base64);
      
      // 바이너리 문자열을 Uint8Array로 변환
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // UTF-8 디코딩
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

// 학생 목록 조회 (역할 및 권한 기반 필터링)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔒 보안 강화: Authorization 헤더에서 토큰 추출 및 검증
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error('❌ Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다" 
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 토큰에서 사용자 정보 추출
    const token = authHeader.substring(7); // "Bearer " 제거
    const userPayload = decodeToken(token);
    
    if (!userPayload) {
      console.error('❌ Invalid token');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid token",
          message: "유효하지 않은 인증 정보입니다" 
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔒 클라이언트가 전송한 파라미터가 아닌 토큰의 정보를 사용
    const role = userPayload.role?.toUpperCase();
    const userId = userPayload.id;
    const userEmail = userPayload.email;
    const tokenAcademyId = userPayload.academyId;

    console.log('🔍 Students API - Authenticated user:', { 
      userId, 
      userEmail, 
      role, 
      academyId: tokenAcademyId 
    });

    // admin@superplace.co.kr 특수 처리 - 모든 학생 조회
    const isSuperAdminEmail = userEmail === 'admin@superplace.co.kr';
    
    let query = '';
    const params: any[] = [];

    // 역할별 쿼리 분기
    const isGlobalAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || isSuperAdminEmail;
    
    if (role === 'DIRECTOR') {
      // 🔒 원장: 자신의 학원 학생만 조회 (토큰의 academyId 사용)
      if (!tokenAcademyId) {
        console.error('❌ DIRECTOR without academyId');
        return new Response(
          JSON.stringify({
            success: false,
            error: "Academy ID not found",
            message: "학원 정보가 없습니다",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academy_id as academyId,
          a.name as academyName
        FROM users u
        LEFT JOIN academy a ON u.academy_id = a.id
        WHERE UPPER(u.role) = 'STUDENT' AND u.academy_id = ?
        ORDER BY u.created_at DESC
        LIMIT 100
      `;
      params.push(tokenAcademyId);
      console.log('🏫 DIRECTOR filtering by token academyId:', tokenAcademyId);

    } else if (isGlobalAdmin) {
      // ✅ 관리자: 모든 학원의 모든 학생
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academy_id as academyId,
          a.name as academyName
        FROM users u
        LEFT JOIN academy a ON u.academy_id = a.id
        WHERE UPPER(u.role) = 'STUDENT'
        ORDER BY u.created_at DESC
        LIMIT 100
      `;
      console.log('✅ Global admin - showing all STUDENTS');

    } else if (role === 'TEACHER') {
      // 🔒 선생님: 자신의 학원 학생만 조회 (토큰의 academyId 사용)
      if (!tokenAcademyId) {
        console.error('❌ TEACHER without academyId');
        return new Response(
          JSON.stringify({
            success: false,
            error: "Academy ID not found",
            message: "학원 정보가 없습니다",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academy_id as academyId,
          a.name as academyName
        FROM users u
        LEFT JOIN academy a ON u.academy_id = a.id
        WHERE UPPER(u.role) = 'STUDENT' AND u.academy_id = ?
        ORDER BY u.created_at DESC
        LIMIT 100
      `;
      params.push(tokenAcademyId);
      console.log('👨‍🏫 TEACHER filtering by token academyId:', tokenAcademyId);

    } else {
      // 🔒 그 외의 경우 (학생 등): 접근 거부
      console.warn('⚠️ Unauthorized role:', role);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Forbidden",
          message: "권한이 없습니다",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        students: result.results || [],
        count: (result.results || []).length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch students",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
