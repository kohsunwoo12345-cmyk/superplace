// 디버그용 students 테이블 테스트
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { env } = context;
  
  const tests = [];
  
  // 1. students 테이블 존재 확인
  try {
    const result = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='students'`).first();
    tests.push({ test: 'students 테이블 존재', result: !!result, data: result });
  } catch (e: any) {
    tests.push({ test: 'students 테이블 존재', result: false, error: e.message });
  }
  
  // 2. students 테이블 구조 확인
  try {
    const result = await env.DB.prepare(`PRAGMA table_info(students)`).all();
    tests.push({ test: 'students 테이블 구조', result: true, columns: result.results });
  } catch (e: any) {
    tests.push({ test: 'students 테이블 구조', result: false, error: e.message });
  }
  
  // 3. user_id=246 레코드 확인
  try {
    const result = await env.DB.prepare(`SELECT * FROM students WHERE user_id = 246`).first();
    tests.push({ test: 'user_id=246 레코드', result: !!result, data: result });
  } catch (e: any) {
    tests.push({ test: 'user_id=246 레코드', result: false, error: e.message });
  }
  
  // 4. INSERT 테스트
  try {
    await env.DB.prepare(`DELETE FROM students WHERE user_id = 999999`).run();
    const insertResult = await env.DB.prepare(`
      INSERT INTO students (user_id, school, grade, status, created_at)
      VALUES (999999, '테스트고', '고2', 'ACTIVE', datetime('now'))
    `).run();
    const selectResult = await env.DB.prepare(`SELECT * FROM students WHERE user_id = 999999`).first();
    await env.DB.prepare(`DELETE FROM students WHERE user_id = 999999`).run();
    tests.push({ test: 'INSERT/SELECT 테스트', result: true, insertResult, selectResult });
  } catch (e: any) {
    tests.push({ test: 'INSERT/SELECT 테스트', result: false, error: e.message });
  }
  
  return Response.json({ tests }, { status: 200 });
};
