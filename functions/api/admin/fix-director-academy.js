// API: 학원장 academyId 수정
// GET, POST /api/admin/fix-director-academy

export async function onRequestGet(context) {
  const db = context.env.DB;
  
  // 꾸메땅학원 학원장 자동 수정
  try {
    const directorEmail = "wangholy1@naver.com";
    const academyId = "academy-1771479246368-5viyubmqk";
    
    console.log(`🔧 자동 수정: ${directorEmail} -> ${academyId}`);

    // User 테이블 업데이트
    let success = false;
    try {
      await db.prepare(`
        UPDATE User 
        SET academyId = ?
        WHERE email = ?
      `).bind(academyId, directorEmail).run();
      
      console.log('✅ User 테이블 업데이트 완료');
      success = true;
    } catch (e) {
      console.log('⚠️ User 테이블 실패, users 시도:', e.message);
      
      try {
        await db.prepare(`
          UPDATE users 
          SET academyId = ?
          WHERE email = ?
        `).bind(academyId, directorEmail).run();
        
        console.log('✅ users 테이블 업데이트 완료');
        success = true;
      } catch (e2) {
        console.error('❌ 업데이트 실패:', e2.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: success,
        message: success ? "academyId 자동 업데이트 완료" : "업데이트 실패",
        directorEmail: directorEmail,
        academyId: academyId
      }),
      {
        status: success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
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
