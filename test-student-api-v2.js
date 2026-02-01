// 학생 API 테스트 스크립트 v2
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStudentAPI() {
  try {
    console.log('🔍 학생 ID로 조회 테스트...');
    
    // 먼저 학생 목록 조회
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true },
      take: 3
    });
    
    console.log(`\n📝 찾은 학생 수: ${students.length}`);
    
    if (students.length === 0) {
      console.log('❌ 학생이 없습니다.');
      return;
    }
    
    // 첫 번째 학생으로 상세 조회 테스트
    const studentId = students[0].id;
    console.log(`\n🎯 테스트 대상 학생: ${students[0].name} (${studentId})`);
    
    // 출결 정보 조회 (userId 사용)
    console.log('\n1️⃣ 출결 정보 조회...');
    const attendances = await prisma.attendance.findMany({
      where: { userId: studentId },
      take: 5,
      orderBy: { date: 'desc' }
    });
    console.log(`✅ 출결 정보: ${attendances.length}개`);
    
    // 숙제 제출 조회 (userId 사용)
    console.log('\n2️⃣ 숙제 제출 조회...');
    const homeworkSubmissions = await prisma.homeworkSubmission.findMany({
      where: { userId: studentId },
      take: 5,
      orderBy: { submittedAt: 'desc' }
    });
    console.log(`✅ 숙제 제출: ${homeworkSubmissions.length}개`);
    
    // 성적 조회 (userId 사용)
    console.log('\n3️⃣ 성적 조회...');
    const testScores = await prisma.testScore.findMany({
      where: { userId: studentId },
      take: 5,
      orderBy: { testDate: 'desc' }
    });
    console.log(`✅ 성적: ${testScores.length}개`);
    
    console.log('\n✅ 모든 쿼리 성공! studentId → userId 변경 완료');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error('메시지:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentAPI();
