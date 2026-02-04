interface Env {
  DB: D1Database;
}

/**
 * admin@superplace.co.kr 계정의 role을 ADMIN으로 설정
 * GET /api/admin/fix-admin-role
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 현재 admin 계정 확인
    const currentAdmin = await DB.prepare(`
      SELECT id, email, name, role FROM users WHERE email = 'admin@superplace.co.kr'
    `).first();

    if (!currentAdmin) {
      return new Response(
        JSON.stringify({ 
          error: "Admin account not found",
          message: "admin@superplace.co.kr 계정이 존재하지 않습니다." 
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // role이 이미 ADMIN 또는 SUPER_ADMIN인 경우
    if (currentAdmin.role === 'ADMIN' || currentAdmin.role === 'SUPER_ADMIN') {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin role already set correctly",
          user: currentAdmin,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // role을 ADMIN으로 업데이트
    await DB.prepare(`
      UPDATE users SET role = 'ADMIN'
      WHERE email = 'admin@superplace.co.kr'
    `).run();

    // 업데이트된 정보 조회
    const updatedAdmin = await DB.prepare(`
      SELECT id, email, name, role FROM users WHERE email = 'admin@superplace.co.kr'
    `).first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin role updated successfully",
        before: currentAdmin,
        after: updatedAdmin,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fix admin role error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fix admin role",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
