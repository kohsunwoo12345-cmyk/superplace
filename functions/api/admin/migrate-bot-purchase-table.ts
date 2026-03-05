// 관리자용 BotPurchaseRequest 테이블 마이그레이션 API
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized - No token provided' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰으로 사용자 조회
    const adminUser = await env.DB.prepare(
      'SELECT id, email, name, role FROM User WHERE token = ?'
    ).bind(token).first();

    if (!adminUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminUser.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Admin permission required' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔧 Starting BotPurchaseRequest table migration...');
    const results: any[] = [];

    // 1. 현재 테이블 구조 확인
    try {
      const tableInfo = await env.DB.prepare(`
        PRAGMA table_info(BotPurchaseRequest)
      `).all();
      
      console.log('📊 Current table structure:', tableInfo.results);
      
      const existingColumns = tableInfo.results.map((col: any) => col.name);
      results.push({
        step: 'Check existing columns',
        columns: existingColumns,
        success: true
      });
    } catch (e) {
      results.push({
        step: 'Check existing columns',
        error: 'Table may not exist',
        success: false
      });
    }

    // 2. email 컬럼 추가
    try {
      await env.DB.prepare(`
        ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT
      `).run();
      console.log('✅ Added column: email');
      results.push({ step: 'Add email column', success: true });
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log('ℹ️ Column email already exists');
        results.push({ step: 'Add email column', success: true, note: 'Already exists' });
      } else {
        console.error('❌ Failed to add email column:', e.message);
        results.push({ step: 'Add email column', success: false, error: e.message });
      }
    }

    // 3. name 컬럼 추가
    try {
      await env.DB.prepare(`
        ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT
      `).run();
      console.log('✅ Added column: name');
      results.push({ step: 'Add name column', success: true });
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log('ℹ️ Column name already exists');
        results.push({ step: 'Add name column', success: true, note: 'Already exists' });
      } else {
        console.error('❌ Failed to add name column:', e.message);
        results.push({ step: 'Add name column', success: false, error: e.message });
      }
    }

    // 4. requestAcademyName 컬럼 추가
    try {
      await env.DB.prepare(`
        ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT
      `).run();
      console.log('✅ Added column: requestAcademyName');
      results.push({ step: 'Add requestAcademyName column', success: true });
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log('ℹ️ Column requestAcademyName already exists');
        results.push({ step: 'Add requestAcademyName column', success: true, note: 'Already exists' });
      } else {
        console.error('❌ Failed to add requestAcademyName column:', e.message);
        results.push({ step: 'Add requestAcademyName column', success: false, error: e.message });
      }
    }

    // 5. phoneNumber 컬럼 추가
    try {
      await env.DB.prepare(`
        ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT
      `).run();
      console.log('✅ Added column: phoneNumber');
      results.push({ step: 'Add phoneNumber column', success: true });
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log('ℹ️ Column phoneNumber already exists');
        results.push({ step: 'Add phoneNumber column', success: true, note: 'Already exists' });
      } else {
        console.error('❌ Failed to add phoneNumber column:', e.message);
        results.push({ step: 'Add phoneNumber column', success: false, error: e.message });
      }
    }

    // 6. 최종 테이블 구조 확인
    try {
      const finalTableInfo = await env.DB.prepare(`
        PRAGMA table_info(BotPurchaseRequest)
      `).all();
      
      console.log('📊 Final table structure:', finalTableInfo.results);
      
      const finalColumns = finalTableInfo.results.map((col: any) => col.name);
      results.push({
        step: 'Final table structure',
        columns: finalColumns,
        success: true
      });
    } catch (e) {
      results.push({
        step: 'Final table structure',
        error: 'Failed to check final structure',
        success: false
      });
    }

    console.log('✅ Migration completed');

    return new Response(JSON.stringify({
      success: true,
      message: 'BotPurchaseRequest table migration completed',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Migration failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
