// ActivityLog 테이블 컬럼 추가 마이그레이션
// POST /api/admin/migrate-activity-log-columns

interface Env {
  DB: D1Database;
}

function parseToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  const token = authHeader.substring(7);
  const [id, email, role] = token.split('|');
  return { id, email, role };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeader = context.request.headers.get('Authorization');
    const { role } = parseToken(authHeader);
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: string[] = [];

    // ActivityLog 테이블 생성 (없으면)
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS ActivityLog (
          id TEXT PRIMARY KEY,
          userId TEXT,
          action TEXT NOT NULL,
          details TEXT,
          ip TEXT,
          userAgent TEXT,
          deviceType TEXT,
          country TEXT,
          userRole TEXT,
          academyId TEXT,
          academyName TEXT,
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
      results.push('✅ ActivityLog 테이블 생성/확인 완료');
    } catch (e: any) {
      results.push(`⚠️ ActivityLog 테이블 생성 오류: ${e.message}`);
    }

    // 컬럼 추가 (이미 있으면 무시)
    const columnsToAdd = [
      { name: 'userAgent', type: 'TEXT' },
      { name: 'deviceType', type: 'TEXT' },
      { name: 'country', type: 'TEXT' },
      { name: 'userRole', type: 'TEXT' },
      { name: 'academyId', type: 'TEXT' },
      { name: 'academyName', type: 'TEXT' },
    ];

    for (const col of columnsToAdd) {
      try {
        await DB.prepare(`ALTER TABLE ActivityLog ADD COLUMN ${col.name} ${col.type}`).run();
        results.push(`✅ ActivityLog.${col.name} 컬럼 추가 완료`);
      } catch (e: any) {
        if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
          results.push(`ℹ️ ActivityLog.${col.name} 컬럼 이미 존재`);
        } else {
          results.push(`⚠️ ActivityLog.${col.name} 컬럼 추가 오류: ${e.message}`);
        }
      }
    }

    // user_login_logs 테이블 생성 (없으면)
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_login_logs (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          deviceType TEXT,
          country TEXT,
          loginAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (userId) REFERENCES User(id)
        )
      `).run();
      results.push('✅ user_login_logs 테이블 생성/확인 완료');
    } catch (e: any) {
      results.push(`⚠️ user_login_logs 테이블 오류: ${e.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
