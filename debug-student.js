const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugStudent() {
  const studentId = 'cmktwtpi90003xc5rega6unqu';
  
  console.log('🔍 학생 정보 디버깅:', studentId);
  
  try {
    // 1. 학생 기본 정보
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        academyId: true,
      },
    });
    
    if (!student) {
      console.log('❌ 학생을 찾을 수 없음');
      return;
    }
    
    console.log('✅ 학생 정보:', student);
    console.log('');
    
    // 2. 각 관계 데이터 조회 테스트
    console.log('📋 관계 데이터 조회 테스트:');
    
    // BotConversation
    try {
      const conversations = await prisma.botConversation.findMany({
        where: { userId: studentId },
        take: 1,
      });
      console.log(`✅ BotConversation: ${conversations.length}개`);
    } catch (e) {
      console.log('❌ BotConversation 오류:', e.message);
    }
    
    // BotAssignment
    try {
      const assignments = await prisma.botAssignment.findMany({
        where: { userId: studentId, isActive: true },
        take: 1,
      });
      console.log(`✅ BotAssignment: ${assignments.length}개`);
    } catch (e) {
      console.log('❌ BotAssignment 오류:', e.message);
    }
    
    // ConversationAnalysis
    try {
      const analyses = await prisma.conversationAnalysis.findMany({
        where: { userId: studentId },
        take: 1,
      });
      console.log(`✅ ConversationAnalysis: ${analyses.length}개`);
    } catch (e) {
      console.log('❌ ConversationAnalysis 오류:', e.message);
    }
    
    // Attendance
    try {
      const attendances = await prisma.attendance.findMany({
        where: { userId: studentId },
        take: 1,
      });
      console.log(`✅ Attendance: ${attendances.length}개`);
    } catch (e) {
      console.log('❌ Attendance 오류:', e.message);
    }
    
    // HomeworkSubmission
    try {
      const homeworks = await prisma.homeworkSubmission.findMany({
        where: { userId: studentId },
        take: 1,
      });
      console.log(`✅ HomeworkSubmission: ${homeworks.length}개`);
    } catch (e) {
      console.log('❌ HomeworkSubmission 오류:', e.message);
    }
    
    // TestScore
    try {
      const scores = await prisma.testScore.findMany({
        where: { userId: studentId },
        take: 1,
      });
      console.log(`✅ TestScore: ${scores.length}개`);
    } catch (e) {
      console.log('❌ TestScore 오류:', e.message);
    }
    
    console.log('\n🎉 모든 관계 데이터 조회 완료');
    
  } catch (error) {
    console.error('❌ 전체 오류:', error.message);
    console.error('스택:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugStudent();
