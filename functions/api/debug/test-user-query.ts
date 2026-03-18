// 디버그용 사용자 조회 테스트 API
export async function onRequestGet(context: any) {
  const { request, env } = context;
  const { DB } = env;
  const url = new URL(request.url);
  const phone = url.searchParams.get('phone') || '01051363624';
  const userId = url.searchParams.get('userId');

  const results = {
    phone,
    userId,
    queries: []
  };

  // 테스트 1: users 테이블에서 phone으로 조회
  try {
    const normalizedPhone = phone.replace(/\D/g, '');
    const user1 = await DB.prepare(
      "SELECT * FROM users WHERE phone = ? LIMIT 1"
    ).bind(normalizedPhone).first();
    results.queries.push({
      query: `SELECT * FROM users WHERE phone = '${normalizedPhone}'`,
      result: user1 || 'not found'
    });
  } catch (e) {
    results.queries.push({
      query: `SELECT * FROM users WHERE phone = '${phone}'`,
      error: e.message
    });
  }

  // 테스트 2: users 테이블에서 id로 조회
  if (userId) {
    try {
      const user2 = await DB.prepare(
        "SELECT * FROM users WHERE id = ? LIMIT 1"
      ).bind(userId).first();
      results.queries.push({
        query: `SELECT * FROM users WHERE id = '${userId}'`,
        result: user2 || 'not found'
      });
    } catch (e) {
      results.queries.push({
        query: `SELECT * FROM users WHERE id = '${userId}'`,
        error: e.message
      });
    }
  }

  // 테스트 3: users 테이블의 스키마 정보
  try {
    const schema = await DB.prepare(
      "PRAGMA table_info(users)"
    ).all();
    results.queries.push({
      query: "PRAGMA table_info(users)",
      result: schema.results
    });
  } catch (e) {
    results.queries.push({
      query: "PRAGMA table_info(users)",
      error: e.message
    });
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
