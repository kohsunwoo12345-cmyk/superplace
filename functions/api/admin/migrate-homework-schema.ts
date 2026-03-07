interface Env {
  DB: D1Database;
}

/**
 * homework_submissions 테이블 스키마 업데이트 마이그레이션
 * POST /api/admin/migrate-homework-schema
 * 
 * 목적:
 * - imageUrl 컬럼이 없으면 추가
 * - score, feedback 컬럼이 없으면 추가
 * - 기존 데이터 보존
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔄 Starting homework_submissions schema migration...');

    const results = [];

    // 1. imageUrl 컬럼 추가 (없으면)
    try {
      await DB.prepare(`
        ALTER TABLE homework_submissions ADD COLUMN imageUrl TEXT
      `).run();
      console.log('✅ imageUrl column added');
      results.push({ column: 'imageUrl', status: 'added' });
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
        console.log('⚠️  imageUrl column already exists');
        results.push({ column: 'imageUrl', status: 'already_exists' });
      } else {
        console.error('❌ Failed to add imageUrl:', error.message);
        results.push({ column: 'imageUrl', status: 'error', error: error.message });
      }
    }

    // 2. score 컬럼 추가 (없으면)
    try {
      await DB.prepare(`
        ALTER TABLE homework_submissions ADD COLUMN score INTEGER
      `).run();
      console.log('✅ score column added');
      results.push({ column: 'score', status: 'added' });
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
        console.log('⚠️  score column already exists');
        results.push({ column: 'score', status: 'already_exists' });
      } else {
        console.error('❌ Failed to add score:', error.message);
        results.push({ column: 'score', status: 'error', error: error.message });
      }
    }

    // 3. feedback 컬럼 추가 (없으면)
    try {
      await DB.prepare(`
        ALTER TABLE homework_submissions ADD COLUMN feedback TEXT
      `).run();
      console.log('✅ feedback column added');
      results.push({ column: 'feedback', status: 'added' });
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
        console.log('⚠️  feedback column already exists');
        results.push({ column: 'feedback', status: 'already_exists' });
      } else {
        console.error('❌ Failed to add feedback:', error.message);
        results.push({ column: 'feedback', status: 'error', error: error.message });
      }
    }

    // 4. 현재 테이블 스키마 확인
    const schema = await DB.prepare(`
      PRAGMA table_info(homework_submissions)
    `).all();

    console.log('✅ Migration completed. Current schema:', schema.results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schema migration completed',
        results: results,
        currentSchema: schema.results,
        columnNames: schema.results?.map((col: any) => col.name),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to migrate schema",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
