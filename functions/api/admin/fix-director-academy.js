// API: 학원장 academyId 수정
// POST /api/admin/fix-director-academy

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      success: true,
      message: "POST 메서드로 요청하세요",
      usage: {
        method: "POST",
        body: {
          directorEmail: "학원장이메일",
          academyId: "학원ID"
        }
      }
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  
  try {
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const { directorEmail, academyId } = body;

    if (!directorEmail || !academyId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "directorEmail과 academyId가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔧 학원장 academyId 업데이트: ${directorEmail} -> ${academyId}`);

    // User 테이블 업데이트 시도
    try {
      await db.prepare(`
        UPDATE User 
        SET academyId = ?
        WHERE email = ? AND role = 'DIRECTOR'
      `).bind(academyId, directorEmail).run();
      
      console.log('✅ User 테이블 업데이트 완료');
    } catch (e) {
      console.log('⚠️ User 테이블 업데이트 실패:', e.message);
      
      // users 테이블 시도
      try {
        await db.prepare(`
          UPDATE users 
          SET academy_id = ?
          WHERE email = ? AND role = 'DIRECTOR'
        `).bind(academyId, directorEmail).run();
        
        console.log('✅ users 테이블 업데이트 완료');
      } catch (e2) {
        console.error('❌ users 테이블 업데이트도 실패:', e2.message);
        throw e2;
      }
    }

    // 업데이트된 사용자 정보 조회
    let updatedUser = null;
    try {
      updatedUser = await db.prepare(`
        SELECT id, email, name, role, academyId
        FROM User
        WHERE email = ?
      `).bind(directorEmail).first();
    } catch (e) {
      try {
        updatedUser = await db.prepare(`
          SELECT id, email, name, role, academy_id as academyId
          FROM users
          WHERE email = ?
        `).bind(directorEmail).first();
      } catch (e2) {
        console.error('조회 실패:', e2.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "학원장 academyId 업데이트 완료",
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("학원장 academyId 업데이트 오류:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "업데이트 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
