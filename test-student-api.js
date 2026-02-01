// 학생 API 테스트 스크립트
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
    
    // 기본 정보 조회
    console.log('\n1️⃣ 기본 정보 조회...');
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        academyId: true,
        school: true,
        grade: true,
        studentId: true,
        studentCode: true,
        parentPhone: true,
        points: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    console.log('✅ 기본 정보:', student);
    
    // 대화 기록 조회
    console.log('\n2️⃣ 대화 기록 조회...');
    const conversations = await prisma.botConversation.findMany({
      where: { userId: studentId },
      take: 5,
      orderBy: { lastMessageAt: 'desc' }
    });
    console.log(`✅ 대화 기록: ${conversations.length}개`);
    
    // 출결 정보 조회
    console.log('\n3️⃣ 출결 정보 조회...');
    const attendances = await prisma.attendance.findMany({
      where: { studentId: studentId },
      take: 5,
      orderBy: { date: 'desc' }
    });
    console.log(`✅ 출결 정보: ${attendances.length}개`);
    
    // 숙제 제출 조회
    console.log('\n4️⃣ 숙제 제출 조회...');
    const homeworkSubmissions = await prisma.homeworkSubmission.findMany({
      where: { studentId: studentId },
      take: 5,
      orderBy: { submittedAt: 'desc' }
    });
    console.log(`✅ 숙제 제출: ${homeworkSubmissions.length}개`);
    
    // 대화 분석 조회
    console.log('\n5️⃣ 대화 분석 조회...');
    const analyses = await prisma.conversationAnalysis.findMany({
      where: { userId: studentId },
      take: 5,
      orderBy: { analyzedAt: 'desc' }
    });
    console.log(`✅ 대화 분석: ${analyses.length}개`);
    
    if (analyses.length > 0) {
      console.log('\n📊 첫 번째 분석 데이터 샘플:');
      console.log('- strengths 타입:', typeof analyses[0].strengths, Array.isArray(analyses[0].strengths));
      console.log('- strengths 값:', analyses[0].strengths);
      console.log('- weaknesses 타입:', typeof analyses[0].weaknesses, Array.isArray(analyses[0].weaknesses));
      console.log('- weaknesses 값:', analyses[0].weaknesses);
    }
    
    console.log('\n✅ 모든 쿼리 성공!');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error('메시지:', error.message);
    console.error('스택:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentAPI();
