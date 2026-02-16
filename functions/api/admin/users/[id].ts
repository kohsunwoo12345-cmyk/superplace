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

    // 사용자 정보 조회 - school, grade 포함 (users 테이블에서 직접)
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
        school,
        grade,
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

    // students 테이블 조회 제거 - users 테이블에서 직접 가져옴
    // v2 - 2026-02-15 - students 테이블 의존성 제거
    console.log("✅ Using school/grade from users table directly");
    console.log("📋 Fields:", {
      school: user.school,
      grade: user.grade
    });

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
      school: user.school,
      grade: user.grade
    });

    // 다중 반 소속 조회 (최대 3개)
    let classesInfo = [];
    try {
      classesInfo = await DB.prepare(
        `SELECT sc.class_id as classId, c.name as className
         FROM student_classes sc
         LEFT JOIN classes c ON sc.class_id = c.id
         WHERE sc.student_id = ?
         ORDER BY sc.created_at DESC
         LIMIT 3`
      ).bind(userId).all();
      console.log("✅ Student classes query result:", JSON.stringify(classesInfo));
    } catch (e) {
      console.log("⚠️ Student classes query error (table may not exist yet):", e);
    }

    return new Response(
      JSON.stringify({ 
        user: {
          ...user,
          // user 테이블의 lastLoginAt, lastLoginIp 사용
          lastLoginAt: user.lastLoginAt || lastLogin?.loginAt || null,
          lastLoginIp: user.lastLoginIp || lastLogin?.ip || null,
          // academy 이름 (테이블에서 조회한 값 사용)
          academyName: finalAcademyName,
          // users 테이블에서 직접 가져온 정보
          school: user.school || null,
          grade: user.grade || null,
          // 소속 반 정보 추가 (하위 호환성 유지)
          className: classInfo?.className || null,
          classId: classInfo?.id || null,
          // 다중 반 소속 정보 추가
          classes: classesInfo.results || []
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

// 사용자 정보 수정 (다중 반 소속 포함)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as any;
    const {
      name,
      phone,
      email,
      school,
      grade,
      diagnostic_memo,
      academy_id,
      password,
      classIds // 다중 반 ID 배열 (최대 3개)
    } = body;

    console.log("📝 Update request for user:", userId);
    console.log("📝 Request body:", JSON.stringify(body, null, 2));

    // 1. users 테이블 업데이트
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (school !== undefined) {
      updateFields.push('school = ?');
      updateValues.push(school);
    }
    if (grade !== undefined) {
      updateFields.push('grade = ?');
      updateValues.push(grade);
    }
    if (diagnostic_memo !== undefined) {
      updateFields.push('diagnostic_memo = ?');
      updateValues.push(diagnostic_memo);
    }
    if (academy_id !== undefined) {
      updateFields.push('academy_id = ?');
      updateValues.push(academy_id);
    }
    if (password !== undefined && password !== '') {
      updateFields.push('password = ?');
      updateValues.push(password);
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      console.log("📝 Update SQL:", updateSql);
      console.log("📝 Update values:", updateValues);

      await DB.prepare(updateSql).bind(...updateValues).run();
      console.log("✅ User updated successfully");
    }

    // 2. 반 소속 업데이트 (다중 반, 최대 3개)
    if (Array.isArray(classIds)) {
      console.log("📝 Updating class assignments:", classIds);

      // 제한: 최대 3개 반
      const limitedClassIds = classIds.slice(0, 3);

      try {
        // 먼저 student_classes 테이블이 존재하는지 확인
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS student_classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            academy_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(student_id, class_id)
          )
        `).run();

        // 기존 소속 반 모두 삭제
        await DB.prepare(`
          DELETE FROM student_classes WHERE student_id = ?
        `).bind(userId).run();

        console.log("✅ Existing class assignments deleted");

        // 새로운 반 소속 추가
        for (const classId of limitedClassIds) {
          if (classId) {
            // academy_id 조회
            let academyId = academy_id;
            if (!academyId) {
              const user = await DB.prepare(`
                SELECT academy_id FROM users WHERE id = ?
              `).bind(userId).first();
              academyId = user?.academy_id || 0;
            }

            await DB.prepare(`
              INSERT INTO student_classes (student_id, class_id, academy_id)
              VALUES (?, ?, ?)
            `).bind(userId, classId, academyId).run();

            console.log(`✅ Added class assignment: classId=${classId}`);
          }
        }

        console.log(`✅ ${limitedClassIds.length} class assignments added`);
      } catch (error) {
        console.error("❌ Class assignment error:", error);
        // 에러가 있어도 계속 진행 (student_classes 테이블이 없을 수 있음)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "User updated successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("❌ User update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update user",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
