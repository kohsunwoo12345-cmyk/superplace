// Cloudflare Pages Function - 비밀번호 해시 마이그레이션 API
// POST /api/admin/migrate-passwords
// 평문 비밀번호를 SHA-256 해시로 변환

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('🔐 Password Migration API called');

    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'DB not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Admin 인증 (간단한 비밀키 확인)
    const authHeader = request.headers.get('Authorization');
    const expectedKey = 'migrate-superplace-2026'; // 임시 비밀키
    
    if (!authHeader || !authHeader.includes(expectedKey)) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 모든 사용자 조회
    const users = await db.prepare('SELECT id, email, password FROM users').all();
    
    if (!users.results || users.results.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No users found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const migrated = [];
    const skipped = [];
    const errors = [];

    for (const user of users.results) {
      const pw = user.password;
      
      // 이미 해시된 비밀번호는 스킵
      if (!pw || pw.startsWith('$2') || (pw.length === 64 && /^[a-f0-9]+$/.test(pw))) {
        skipped.push({ id: user.id, email: user.email, reason: 'Already hashed or empty' });
        continue;
      }

      try {
        // SHA-256 해시 생성
        const encoder = new TextEncoder();
        const data = encoder.encode(pw + 'superplace-salt-2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // DB 업데이트
        await db.prepare('UPDATE users SET password = ? WHERE id = ?')
          .bind(hashHex, user.id)
          .run();

        migrated.push({
          id: user.id,
          email: user.email,
          oldPassword: pw,
          newHash: hashHex.substring(0, 20) + '...'
        });

        console.log(`✅ Migrated: ${user.email} (ID: ${user.id})`);
      } catch (error) {
        errors.push({ id: user.id, email: user.email, error: error.message });
        console.error(`❌ Error migrating ${user.email}:`, error.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Password migration completed',
      stats: {
        total: users.results.length,
        migrated: migrated.length,
        skipped: skipped.length,
        errors: errors.length
      },
      migrated,
      skipped,
      errors
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Migration failed',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
