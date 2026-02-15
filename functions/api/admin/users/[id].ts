interface Env {
  DB: D1Database;
}

// 사용자 상세 정보 조회 (비밀번호 포함)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 사용자 정보 조회 - lastLoginAt, lastLoginIp, student_code 포함
    const user = await DB.prepare(
      `SELECT 
        id, 
        email, 
        name, 
        phone, 
        role, 
        password, 
        points, 
        balance,
        academy_id as academyId, 
        academy_name as academyName,
        created_at as createdAt,
        lastLoginAt,
        lastLoginIp,
        student_code as studentCode
       FROM users 
       WHERE id = ?`
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // academy_name이 null이면 academy 또는 academies 테이블에서 조회
    let finalAcademyName = user.academyName;
    if (!finalAcademyName && user.academyId) {
      try {
        // academy 테이블 시도
        let academy = await DB.prepare(`
          SELECT name FROM academy WHERE id = ?
        `).bind(user.academyId).first();
        
        if (academy) {
          finalAcademyName = academy.name;
        } else {
          // academies 테이블 시도
          academy = await DB.prepare(`
            SELECT name FROM academies WHERE id = ?
          `).bind(user.academyId).first();
          if (academy) {
            finalAcademyName = academy.name;
          }
        }
        console.log(`✅ Academy name fetched: ${finalAcademyName}`);
      } catch (e) {
        console.log("⚠️ Failed to fetch academy name:", e);
      }
    }

    // students 테이블에서 추가 정보 조회
    let studentInfo = null;
    try {
      studentInfo = await DB.prepare(
        `SELECT school, grade, diagnostic_memo
         FROM students 
         WHERE user_id = ?`
      ).bind(userId).first();
      console.log("✅ Student info query result:", JSON.stringify(studentInfo));
      console.log("📋 Fields:", {
        school: studentInfo?.school,
        grade: studentInfo?.grade,
        diagnostic_memo: studentInfo?.diagnostic_memo
      });
    } catch (e) {
      console.log("⚠️ Students table not found or error:", e);
    }

    // 소속 반 정보 조회
    let classInfo = null;
    try {
      classInfo = await DB.prepare(
        `SELECT c.id, c.name as className
         FROM classes c
         INNER JOIN class_students cs ON c.id = cs.classId
         WHERE cs.studentId = ? AND cs.status = 'ACTIVE'
         LIMIT 1`
      ).bind(userId).first();
      console.log("✅ Class info query result:", JSON.stringify(classInfo));
    } catch (e) {
      console.log("⚠️ Classes table query error:", e);
    }

    // 마지막 로그인 정보 조회
    let lastLogin = null;
    try {
      lastLogin = await DB.prepare(
        `SELECT ip, loginAt, success 
         FROM user_login_logs 
         WHERE userId = ? AND success = 1
         ORDER BY loginAt DESC 
         LIMIT 1`
      ).bind(userId).first();
    } catch (e) {
      // 테이블이 없으면 무시
      console.log("Login logs table not found:", e);
    }

    console.log("📤 Returning user data with fields:", {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      academyName: finalAcademyName,
      school: studentInfo?.school || null,
      grade: studentInfo?.grade || null,
      diagnostic_memo: studentInfo?.diagnostic_memo || null,
      className: classInfo?.className || null,
      classId: classInfo?.id || null
    });

    return new Response(
      JSON.stringify({ 
        user: {
          ...user,
          // user 테이블의 lastLoginAt, lastLoginIp 사용
          // 로그 테이블에서 가져온 값은 참고용으로만 사용
          lastLoginAt: user.lastLoginAt || lastLogin?.loginAt || null,
          lastLoginIp: user.lastLoginIp || lastLogin?.ip || null,
          // academy 이름 (테이블에서 조회한 값 사용)
          academyName: finalAcademyName,
          // students 테이블의 정보 추가
          school: studentInfo?.school || null,
          grade: studentInfo?.grade || null,
          diagnostic_memo: studentInfo?.diagnostic_memo || null,
          // 소속 반 정보 추가
          className: classInfo?.className || null,
          classId: classInfo?.id || null
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("User detail error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch user detail",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
