/**
 * 학원장 학생 목록 필터링 검증 스크립트
 */

const BASE_URL = 'https://superplacestudy.pages.dev';
const ACADEMY_ID = 'academy-1771479246368-5viyubmqk';

async function testStudentFiltering() {
  console.log('🔍 ============= 학생 목록 필터링 검증 =============\n');
  
  console.log('📌 테스트 시나리오:');
  console.log('   1. 학원장이 자신의 학원 학생만 조회할 수 있는지');
  console.log('   2. 퇴원생이 제외되는지');
  console.log('   3. role=STUDENT 파라미터가 작동하는지\n');
  
  // Test 1: academyId + role=STUDENT 필터
  console.log('📊 Test 1: academyId + role=STUDENT 필터');
  try {
    const url = `${BASE_URL}/api/admin/users?academyId=${ACADEMY_ID}&role=STUDENT`;
    console.log('   URL:', url);
    
    // Note: 이 테스트는 인증 토큰이 필요하므로 실제 브라우저에서 테스트해야 합니다
    console.log('   ⚠️  이 API는 인증이 필요합니다.');
    console.log('   ℹ️  학원장 계정으로 로그인 후 다음 단계를 진행하세요:\n');
  } catch (error) {
    console.error('   ❌ 오류:', error.message);
  }
  
  console.log('📝 브라우저 테스트 절차:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1️⃣ 학원장 로그인');
  console.log('   https://superplacestudy.pages.dev/login');
  console.log('   Email: wangholy1@naver.com\n');
  
  console.log('2️⃣ AI 봇 할당 페이지 접속');
  console.log('   https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign/\n');
  
  console.log('3️⃣ 브라우저 콘솔(F12) 확인');
  console.log('   다음 로그가 표시되어야 합니다:');
  console.log('   • 🏫 DIRECTOR/TEACHER filtering by academyId: academy-1771479246368-5viyubmqk');
  console.log('   • 👤 DIRECTOR/TEACHER filtering by role: STUDENT');
  console.log('   • ✅ Users loaded: { users: [...] }\n');
  
  console.log('4️⃣ 학생 드롭다운 확인');
  console.log('   ✅ 예상 결과:');
  console.log('   • 꾸메땅학원 학생만 표시됨');
  console.log('   • 퇴원생은 표시되지 않음');
  console.log('   • 다른 학원 학생은 표시되지 않음');
  console.log('   • TEACHER, DIRECTOR 역할은 표시되지 않음\n');
  
  console.log('5️⃣ 학생 목록과 /dashboard/students/ 비교');
  console.log('   https://superplacestudy.pages.dev/dashboard/students/');
  console.log('   위 페이지의 학생 목록과 AI 봇 할당 페이지의');
  console.log('   학생 목록이 동일해야 합니다.\n');
  
  console.log('🧪 API 직접 테스트 (브라우저 콘솔):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('const token = localStorage.getItem("token");');
  console.log('fetch("/api/admin/users?academyId=academy-1771479246368-5viyubmqk&role=STUDENT", {');
  console.log('  headers: { "Authorization": `Bearer ${token}` }');
  console.log('})');
  console.log('.then(r => r.json())');
  console.log('.then(d => {');
  console.log('  console.log("✅ Total students:", d.count);');
  console.log('  console.log("✅ Students:", d.users);');
  console.log('  console.log("✅ Withdrawn students excluded:", !d.users.some(u => u.isWithdrawn === 1));');
  console.log('});\n');
  
  console.log('🔍 검증 포인트:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ 1. 모든 학생이 academyId = academy-1771479246368-5viyubmqk');
  console.log('✅ 2. 모든 학생이 role = STUDENT');
  console.log('✅ 3. 모든 학생이 isWithdrawn = 0 또는 NULL');
  console.log('✅ 4. /dashboard/students/ 목록과 동일\n');
  
  console.log('🔍 ============= 검증 완료 =============');
}

testStudentFiltering().catch(console.error);
