// API: 회원 데이터 추출 (관리자 전용)
// GET /api/admin/export-users - 전체 회원 또는 필터링된 회원 데이터 엑셀 추출

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // URL 파라미터로 필터 타입 받기
    const url = new URL(context.request.url);
    const filterType = url.searchParams.get('type') || 'all'; // all, active, inactive, by-plan
    const planId = url.searchParams.get('planId'); // 요금제별 필터링용

    let query = '';
    let bindings: any[] = [];

    switch (filterType) {
      case 'active':
        // 활성 사용자 (최근 30일 내 로그인)
        query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.academyId,
            a.name as academyName,
            u.approved,
            u.createdAt,
            u.updatedAt,
            COALESCE(s.planName, '구독 없음') as subscriptionPlan,
            COALESCE(s.status, 'none') as subscriptionStatus,
            s.endDate as subscriptionEndDate
          FROM User u
          LEFT JOIN Academy a ON u.academyId = a.id
          LEFT JOIN user_subscriptions s ON u.id = s.userId AND s.status = 'active'
          WHERE u.updatedAt >= datetime('now', '-30 days')
          ORDER BY u.createdAt DESC
        `;
        break;

      case 'inactive':
        // 비활성 사용자 또는 삭제 예정 (90일 이상 미접속)
        query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.academyId,
            a.name as academyName,
            u.approved,
            u.createdAt,
            u.updatedAt,
            COALESCE(s.planName, '구독 없음') as subscriptionPlan,
            COALESCE(s.status, 'none') as subscriptionStatus,
            s.endDate as subscriptionEndDate,
            CAST((julianday('now') - julianday(u.updatedAt)) AS INTEGER) as daysInactive
          FROM User u
          LEFT JOIN Academy a ON u.academyId = a.id
          LEFT JOIN user_subscriptions s ON u.id = s.userId AND s.status = 'active'
          WHERE u.updatedAt < datetime('now', '-90 days')
          ORDER BY u.updatedAt ASC
        `;
        break;

      case 'by-plan':
        // 특정 요금제 사용자
        if (!planId) {
          return new Response(
            JSON.stringify({ success: false, message: "planId가 필요합니다" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.academyId,
            a.name as academyName,
            u.approved,
            u.createdAt,
            u.updatedAt,
            s.planName as subscriptionPlan,
            s.status as subscriptionStatus,
            s.period as subscriptionPeriod,
            s.startDate as subscriptionStartDate,
            s.endDate as subscriptionEndDate,
            s.usage_students,
            s.usage_teachers,
            s.limit_maxStudents,
            s.limit_maxTeachers
          FROM User u
          LEFT JOIN Academy a ON u.academyId = a.id
          INNER JOIN user_subscriptions s ON u.id = s.userId
          WHERE s.planId = ? AND s.status = 'active'
          ORDER BY u.createdAt DESC
        `;
        bindings = [planId];
        break;

      case 'no-subscription':
        // 구독 없는 사용자
        query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.academyId,
            a.name as academyName,
            u.approved,
            u.createdAt,
            u.updatedAt,
            '구독 없음' as subscriptionPlan,
            'none' as subscriptionStatus
          FROM User u
          LEFT JOIN Academy a ON u.academyId = a.id
          LEFT JOIN user_subscriptions s ON u.id = s.userId AND s.status = 'active'
          WHERE s.id IS NULL AND u.role IN ('DIRECTOR', 'TEACHER')
          ORDER BY u.createdAt DESC
        `;
        break;

      default: // 'all'
        // 전체 사용자
        query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.academyId,
            a.name as academyName,
            u.approved,
            u.createdAt,
            u.updatedAt,
            COALESCE(s.planName, '구독 없음') as subscriptionPlan,
            COALESCE(s.status, 'none') as subscriptionStatus,
            s.endDate as subscriptionEndDate
          FROM User u
          LEFT JOIN Academy a ON u.academyId = a.id
          LEFT JOIN user_subscriptions s ON u.id = s.userId AND s.status = 'active'
          ORDER BY u.createdAt DESC
        `;
        break;
    }

    const result = bindings.length > 0
      ? await db.prepare(query).bind(...bindings).all()
      : await db.prepare(query).all();

    const users = result.results || [];

    // CSV 형식으로 변환
    const csvHeader = filterType === 'by-plan'
      ? 'ID,이름,이메일,전화번호,역할,학원ID,학원명,승인여부,가입일,마지막활동일,요금제,구독상태,구독기간,구독시작일,구독종료일,사용학생수,사용교사수,학생한도,교사한도\n'
      : 'ID,이름,이메일,전화번호,역할,학원ID,학원명,승인여부,가입일,마지막활동일,요금제,구독상태,구독종료일\n';

    const csvRows = users.map((user: any) => {
      const baseFields = [
        user.id,
        user.name,
        user.email || '',
        user.phone || '',
        user.role,
        user.academyId || '',
        user.academyName || '',
        user.approved ? '승인' : '대기',
        user.createdAt,
        user.updatedAt,
        user.subscriptionPlan,
        user.subscriptionStatus === 'active' ? '활성' :
        user.subscriptionStatus === 'expired' ? '만료' :
        user.subscriptionStatus === 'cancelled' ? '취소' : '없음',
        user.subscriptionEndDate || ''
      ];

      if (filterType === 'by-plan') {
        baseFields.push(
          user.subscriptionPeriod || '',
          user.subscriptionStartDate || '',
          user.subscriptionEndDate || '',
          user.usage_students?.toString() || '0',
          user.usage_teachers?.toString() || '0',
          user.limit_maxStudents?.toString() || '무제한',
          user.limit_maxTeachers?.toString() || '무제한'
        );
      }

      return baseFields.map(field => `"${field}"`).join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // UTF-8 BOM 추가 (엑셀에서 한글 깨짐 방지)
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    const fileName = `회원목록_${filterType}_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error: any) {
    console.error("회원 데이터 추출 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "회원 데이터 추출 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
