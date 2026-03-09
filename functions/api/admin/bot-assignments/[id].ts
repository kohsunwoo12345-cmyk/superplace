// API: 봇 할당 삭제 및 수정
// DELETE /api/admin/bot-assignments/[id]
// PATCH /api/admin/bot-assignments/[id]

interface Env {
  DB: D1Database;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const assignmentId = context.params.id as string;

    if (!assignmentId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "할당 ID가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 할당 삭제
    const result = await db
      .prepare("DELETE FROM bot_assignments WHERE id = ?")
      .bind(assignmentId)
      .run();

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "할당을 찾을 수 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "봇 할당이 취소되었습니다",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("봇 할당 삭제 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 할당 취소 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * PATCH /api/admin/bot-assignments/[id]
 * 봇 할당 정보 수정 (일일 사용 한도 등)
 */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const assignmentId = context.params.id as string;

    if (!assignmentId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "할당 ID가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await context.request.json();
    const { dailyUsageLimit, endDate, status } = body;

    console.log(`📝 봇 할당 수정 요청: ${assignmentId}`, body);

    // 현재 할당 정보 조회
    const currentAssignment = await db
      .prepare("SELECT * FROM ai_bot_assignments WHERE id = ?")
      .bind(assignmentId)
      .first() as any;

    if (!currentAssignment) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "할당을 찾을 수 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 업데이트할 필드 구성
    const updates: string[] = [];
    const params: any[] = [];

    if (dailyUsageLimit !== undefined) {
      updates.push("dailyUsageLimit = ?");
      params.push(dailyUsageLimit);
    }

    if (endDate !== undefined) {
      updates.push("endDate = ?");
      params.push(endDate);
    }

    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "업데이트할 필드가 없습니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    params.push(assignmentId);

    // 업데이트 실행
    const sql = `UPDATE ai_bot_assignments SET ${updates.join(", ")} WHERE id = ?`;
    await db.prepare(sql).bind(...params).run();

    // 업데이트된 정보 조회
    const updatedAssignment = await db
      .prepare("SELECT * FROM ai_bot_assignments WHERE id = ?")
      .bind(assignmentId)
      .first();

    console.log(`✅ 봇 할당 수정 완료: ${assignmentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "봇 할당 정보가 수정되었습니다",
        assignment: updatedAssignment,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("봇 할당 수정 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 할당 수정 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
