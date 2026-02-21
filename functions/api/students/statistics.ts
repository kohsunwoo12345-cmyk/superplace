// Cloudflare Pages Function: GET /api/students/statistics
// 학생 통계 (재학생, 퇴원생, 신규 등록, 이번 달 퇴원 등)

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // JWT 디코딩
    let userId: number;
    let userRole: string;
    let academyId: number | null = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        userId = payload.id || payload.userId;
        userRole = payload.role;
        academyId = payload.academyId || null;
      } else {
        throw new Error('Invalid token');
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학원 필터 조건
    let academyFilter = '';
    let academyBindings: any[] = [];
    if (userRole === 'DIRECTOR' && academyId) {
      academyFilter = ' AND academyId = ?';
      academyBindings = [academyId];
    }

    // isWithdrawn 컬럼 확인
    let hasWithdrawnColumn = false;
    try {
      await env.DB.prepare('SELECT isWithdrawn FROM User LIMIT 1').first();
      hasWithdrawnColumn = true;
      console.log('✅ isWithdrawn 컬럼 존재');
    } catch (e) {
      console.log('⚠️ isWithdrawn 컬럼 없음 - 모든 학생을 재학생으로 처리');
    }

    let activeStudents = 0;
    let withdrawnStudents = 0;
    let thisMonthNew = 0;
    let thisMonthWithdrawn = 0;

    if (hasWithdrawnColumn) {
      // 1. 전체 재학생 수
      const activeStudentsResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' AND (isWithdrawn IS NULL OR isWithdrawn = 0)${academyFilter}
      `).bind(...academyBindings).first();
      activeStudents = activeStudentsResult?.count || 0;

      // 2. 전체 퇴원생 수
      const withdrawnStudentsResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' AND isWithdrawn = 1${academyFilter}
      `).bind(...academyBindings).first();
      withdrawnStudents = withdrawnStudentsResult?.count || 0;

      // 3. 이번 달 신규 등록 학생
      const thisMonthNewResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' 
        AND (isWithdrawn IS NULL OR isWithdrawn = 0)
        AND createdAt >= date('now', 'start of month')${academyFilter}
      `).bind(...academyBindings).first();
      thisMonthNew = thisMonthNewResult?.count || 0;

      // 4. 이번 달 퇴원 학생
      const thisMonthWithdrawnResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' 
        AND isWithdrawn = 1
        AND withdrawnAt >= date('now', 'start of month')${academyFilter}
      `).bind(...academyBindings).first();
      thisMonthWithdrawn = thisMonthWithdrawnResult?.count || 0;
    } else {
      // isWithdrawn 컬럼이 없으면 모든 학생을 재학생으로 처리
      const totalStudentsResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT'${academyFilter}
      `).bind(...academyBindings).first();
      activeStudents = totalStudentsResult?.count || 0;
      withdrawnStudents = 0;

      const thisMonthNewResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' 
        AND createdAt >= date('now', 'start of month')${academyFilter}
      `).bind(...academyBindings).first();
      thisMonthNew = thisMonthNewResult?.count || 0;
      thisMonthWithdrawn = 0;
    }

    // 5. 지난 달 신규 등록 학생
    let lastMonthNew = 0;
    let lastMonthWithdrawn = 0;
    let withdrawalReasons: any[] = [];
    let recentWithdrawals: any[] = [];
    let recentNewStudents: any[] = [];
    let monthlyTrend: any[] = [];

    if (hasWithdrawnColumn) {
      const lastMonthNewResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' 
        AND (isWithdrawn IS NULL OR isWithdrawn = 0)
        AND createdAt >= date('now', 'start of month', '-1 month')
        AND createdAt < date('now', 'start of month')${academyFilter}
      `).bind(...academyBindings).first();
      lastMonthNew = lastMonthNewResult?.count || 0;

      // 6. 지난 달 퇴원 학생
      const lastMonthWithdrawnResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' 
        AND isWithdrawn = 1
        AND withdrawnAt >= date('now', 'start of month', '-1 month')
        AND withdrawnAt < date('now', 'start of month')${academyFilter}
      `).bind(...academyBindings).first();
      lastMonthWithdrawn = lastMonthWithdrawnResult?.count || 0;

      // 7. 퇴원 사유별 통계
      const withdrawalReasonsResult = await env.DB.prepare(`
        SELECT withdrawnReason, COUNT(*) as count
        FROM User
        WHERE role = 'STUDENT' AND isWithdrawn = 1${academyFilter}
        GROUP BY withdrawnReason
        ORDER BY count DESC
        LIMIT 10
      `).bind(...academyBindings).all();
      withdrawalReasons = withdrawalReasonsResult.results || [];

      // 8. 최근 퇴원 학생 목록 (최근 10명)
      const recentWithdrawalsResult = await env.DB.prepare(`
        SELECT id, name, email, withdrawnAt, withdrawnReason
        FROM User
        WHERE role = 'STUDENT' AND isWithdrawn = 1${academyFilter}
        ORDER BY withdrawnAt DESC
        LIMIT 10
      `).bind(...academyBindings).all();
      recentWithdrawals = recentWithdrawalsResult.results || [];
    } else {
      // isWithdrawn 컬럼이 없으면 빈 배열
      const lastMonthNewResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User 
        WHERE role = 'STUDENT' 
        AND createdAt >= date('now', 'start of month', '-1 month')
        AND createdAt < date('now', 'start of month')${academyFilter}
      `).bind(...academyBindings).first();
      lastMonthNew = lastMonthNewResult?.count || 0;
      lastMonthWithdrawn = 0;
      withdrawalReasons = [];
      recentWithdrawals = [];
    }

    // 9. 최근 신규 등록 학생 목록 (최근 10명)
    if (hasWithdrawnColumn) {
      const recentNewStudentsResult = await env.DB.prepare(`
        SELECT id, name, email, createdAt
        FROM User
        WHERE role = 'STUDENT' AND (isWithdrawn IS NULL OR isWithdrawn = 0)${academyFilter}
        ORDER BY createdAt DESC
        LIMIT 10
      `).bind(...academyBindings).all();
      recentNewStudents = recentNewStudentsResult.results || [];
    } else {
      const recentNewStudentsResult = await env.DB.prepare(`
        SELECT id, name, email, createdAt
        FROM User
        WHERE role = 'STUDENT'${academyFilter}
        ORDER BY createdAt DESC
        LIMIT 10
      `).bind(...academyBindings).all();
      recentNewStudents = recentNewStudentsResult.results || [];
    }

    // 10. 월별 등록/퇴원 추세 (최근 6개월)
    const monthlyTrendResult = await env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as newStudents
      FROM User
      WHERE role = 'STUDENT' 
      AND createdAt >= date('now', '-6 months')${academyFilter}
      GROUP BY month
      ORDER BY month DESC
    `).bind(...academyBindings).all();
    const monthlyNewTrend = monthlyTrendResult.results || [];

    let monthlyWithdrawalTrend: any[] = [];
    if (hasWithdrawnColumn) {
      const monthlyWithdrawalTrendResult = await env.DB.prepare(`
        SELECT 
          strftime('%Y-%m', withdrawnAt) as month,
          COUNT(*) as withdrawnStudents
        FROM User
        WHERE role = 'STUDENT' 
        AND isWithdrawn = 1
        AND withdrawnAt >= date('now', '-6 months')${academyFilter}
        GROUP BY month
        ORDER BY month DESC
      `).bind(...academyBindings).all();
      monthlyWithdrawalTrend = monthlyWithdrawalTrendResult.results || [];
    }

    return new Response(JSON.stringify({ 
      success: true,
      statistics: {
        activeStudents,
        withdrawnStudents,
        totalStudents: Number(activeStudents) + Number(withdrawnStudents),
        thisMonth: {
          newStudents: thisMonthNew,
          withdrawnStudents: thisMonthWithdrawn,
          netGrowth: Number(thisMonthNew) - Number(thisMonthWithdrawn)
        },
        lastMonth: {
          newStudents: lastMonthNew,
          withdrawnStudents: lastMonthWithdrawn,
          netGrowth: Number(lastMonthNew) - Number(lastMonthWithdrawn)
        },
        withdrawalReasons,
        recentWithdrawals,
        recentNewStudents,
        monthlyTrend: {
          newStudents: monthlyNewTrend,
          withdrawals: monthlyWithdrawalTrend
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Student statistics error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message || '통계 조회 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
