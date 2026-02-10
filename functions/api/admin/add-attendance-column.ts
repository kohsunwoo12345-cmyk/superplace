interface Env {
  DB: D1Database;
}

/**
 * users 테이블에 attendance_code 컬럼 추가
 * 
 * POST /api/admin/add-attendance-column
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Adding attendance_code column to users table...');

    // 1. 현재 테이블 스키마 확인
    const schemaBefore = await DB.prepare(`PRAGMA table_info(users)`).all();
    const hasAttendanceCode = schemaBefore.results.some((col: any) => col.name === 'attendance_code');

    if (hasAttendanceCode) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'attendance_code column already exists',
          schema: schemaBefore.results.map((col: any) => col.name)
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE users ADD COLUMN attendance_code TEXT
      `).run();
      console.log('✅ attendance_code column added');
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log('Column already exists (error ignored)');
      } else {
        throw error;
      }
    }

    // 3. 변경 후 스키마 확인
    const schemaAfter = await DB.prepare(`PRAGMA table_info(users)`).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'attendance_code column added successfully',
        schema: {
          before: schemaBefore.results.map((col: any) => col.name),
          after: schemaAfter.results.map((col: any) => col.name)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({
        error: 'Migration failed',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
