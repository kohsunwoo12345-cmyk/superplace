// 학생 목록 조회 - 완전 단순화 버전

export async function onRequestGet(context) {
  const { DB } = context.env;
  
  console.log('=== 학생 목록 API 시작 ===');
  
  try {
    // 전체 User 테이블 조회
    const result = await DB.prepare('SELECT * FROM User').all();
    console.log(`전체 User: ${result.results.length}명`);
    
    // STUDENT만 필터
    const students = result.results.filter(r => r.role === 'STUDENT');
    console.log(`STUDENT: ${students.length}명`);
    
    return new Response(JSON.stringify({
      success: true,
      students: students,
      total: students.length,
      debug: {
        totalUsers: result.results.length,
        studentCount: students.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('에러:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
