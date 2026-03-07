interface Env {
  DB: D1Database;
}

// 한국 시간 (KST) 생성 함수
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성 (존재하지 않으면)
    await DB.batch([
      DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_assignments (
          id TEXT PRIMARY KEY,
          teacherId INTEGER NOT NULL,
          teacherName TEXT,
          academyId TEXT,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          dueDate TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          targetType TEXT DEFAULT 'all'
        )
      `),
      DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_assignment_targets (
          id TEXT PRIMARY KEY,
          assignmentId TEXT NOT NULL,
          studentId INTEGER NOT NULL,
          studentName TEXT,
          status TEXT DEFAULT 'pending',
          submittedAt TEXT,
          score INTEGER,
          submissionId TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (assignmentId) REFERENCES homework_assignments(id)
        )
      `)
    ]);

    console.log('✅ 숙제 테이블 생성 완료');

    // Authorization 헤더에서 토큰 추출
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const { teacherId, title, description, subject, dueDate, targetType, targetStudents, academyId } = body;

    console.log('📝 숙제 생성 요청:', {
      teacherId,
      title,
      academyId: academyId || 'undefined'
    });

    if (!teacherId || !title || !description || !dueDate) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 선생님 정보 조회
    const teacher = await DB.prepare(`
      SELECT id, name, academyId FROM User WHERE id = ?
    `).bind(teacherId).first();

    if (!teacher) {
      return new Response(
        JSON.stringify({ success: false, error: "Teacher not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // academyId 우선순위: body > teacher.academyId > null
    const finalAcademyId = academyId || teacher.academyId || null;
    console.log('🏫 최종 academyId:', {
      fromBody: academyId,
      fromTeacher: teacher.academyId,
      final: finalAcademyId
    });

    const koreanTime = getKoreanTime();
    const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 숙제 과제 생성
    await DB.prepare(`
      INSERT INTO homework_assignments 
      (id, teacherId, teacherName, academyId, title, description, subject, dueDate, createdAt, status, targetType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assignmentId,
      teacherId,
      teacher.name,
      finalAcademyId,  // ✅ 수정: teacher.academyId || null → finalAcademyId
      title,
      description,
      subject || "기타",
      dueDate,
      koreanTime,
      "active",
      targetType || "all"
    ).run();

    console.log('✅ 숙제 생성 완료:', { assignmentId, academyId: finalAcademyId });

    // 특정 학생 대상인 경우 타겟 테이블에 추가
    if (targetType === "specific" && targetStudents && Array.isArray(targetStudents)) {
      for (const studentId of targetStudents) {
        // 학생 정보 조회
        const student = await DB.prepare(`
          SELECT id, name FROM User WHERE id = ?
        `).bind(studentId).first();

        if (student) {
          const targetId = `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await DB.prepare(`
            INSERT INTO homework_assignment_targets
            (id, assignmentId, studentId, studentName, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            targetId,
            assignmentId,
            studentId,
            student.name,
            "pending",
            koreanTime
          ).run();
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignmentId,
        message: "숙제가 성공적으로 생성되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Create homework assignment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create homework assignment",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
