// 랜딩페이지 테이블에 thumbnail_url, subtitle 컬럼 추가
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🔧 Starting landing_pages table migration...');

    const results: any[] = [];

    // 1. thumbnail_url 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE landing_pages ADD COLUMN thumbnail_url TEXT
      `).run();
      results.push({ column: 'thumbnail_url', status: 'added' });
      console.log('✅ Added thumbnail_url column');
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        results.push({ column: 'thumbnail_url', status: 'already exists' });
        console.log('⚠️ thumbnail_url column already exists');
      } else {
        results.push({ column: 'thumbnail_url', status: 'failed', error: error.message });
        console.error('❌ Failed to add thumbnail_url:', error.message);
      }
    }

    // 2. subtitle 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE landing_pages ADD COLUMN subtitle TEXT
      `).run();
      results.push({ column: 'subtitle', status: 'added' });
      console.log('✅ Added subtitle column');
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        results.push({ column: 'subtitle', status: 'already exists' });
        console.log('⚠️ subtitle column already exists');
      } else {
        results.push({ column: 'subtitle', status: 'failed', error: error.message });
        console.error('❌ Failed to add subtitle:', error.message);
      }
    }

    // 3. 최종 테이블 구조 확인
    const tableInfo = await DB.prepare(`PRAGMA table_info(landing_pages)`).all();
    const columns = tableInfo.results?.map((col: any) => col.name) || [];

    return new Response(JSON.stringify({
      success: true,
      message: 'Migration completed',
      results,
      currentColumns: columns,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
