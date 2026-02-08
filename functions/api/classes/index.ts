interface Env {
  DB: D1Database;
}

// 한국 시간 생성
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// GET: 반 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");
    const teacherId = url.searchParams.get("teacherId");

    let query = `
      SELECT 
        c.id,
        c.academyId,
        c.name,
        c.grade,
        c.subject,
        c.description,
        c.teacherId,
        u.name as teacherName,
        c.createdAt,
        c.status,
        COUNT(DISTINCT cs.studentId) as studentCount
      FROM classes c
      LEFT JOIN users u ON c.teacherId = u.id
      LEFT JOIN class_students cs ON c.id = cs.classId AND cs.status = 'active'
      WHERE c.status = 'active'
    `;

    const bindings: any[] = [];

    if (academyId) {
      query += ` AND c.academyId = ?`;
      bindings.push(parseInt(academyId));
    }

    if (teacherId) {
      query += ` AND c.teacherId = ?`;
      bindings.push(parseInt(teacherId));
    }

    query += ` GROUP BY c.id ORDER BY c.createdAt DESC`;

    const classes = await DB.prepare(query).bind(...bindings).all();

    return new Response(
      JSON.stringify({
        success: true,
        classes: classes.results || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get classes error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get classes",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST: 반 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const { academyId, name, grade, subject, description, teacherId } = body;

    if (!academyId || !name) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();

    const result = await DB.prepare(`
      INSERT INTO classes (academyId, name, grade, subject, description, teacherId, createdAt, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      academyId,
      name,
      grade || null,
      subject || null,
      description || null,
      teacherId || null,
      koreanTime,
      "active"
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        classId: result.meta.last_row_id,
        message: "반이 생성되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Create class error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create class",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// PUT: 반 수정
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const { classId, name, grade, subject, description, teacherId } = body;

    if (!classId) {
      return new Response(
        JSON.stringify({ success: false, error: "Class ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let query = `UPDATE classes SET `;
    const updates: string[] = [];
    const bindings: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      bindings.push(name);
    }
    if (grade !== undefined) {
      updates.push("grade = ?");
      bindings.push(grade);
    }
    if (subject !== undefined) {
      updates.push("subject = ?");
      bindings.push(subject);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      bindings.push(description);
    }
    if (teacherId !== undefined) {
      updates.push("teacherId = ?");
      bindings.push(teacherId);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No fields to update" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    query += updates.join(", ") + " WHERE id = ?";
    bindings.push(classId);

    await DB.prepare(query).bind(...bindings).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "반 정보가 수정되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Update class error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to update class",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
