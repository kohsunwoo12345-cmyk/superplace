/**
 * 학생 코드 자동 할당 스크립트
 * 
 * 학생 코드가 없는 학생들에게 5자리 고유 코드를 자동으로 생성하여 할당합니다.
 * 학생 코드 형식: 영문 대문자 + 숫자 조합 (예: AB123, XY789)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 5자리 랜덤 학생 코드 생성
 * 형식: [A-Z]{2}[0-9]{3}
 */
function generateStudentCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let code = '';
  
  // 앞 2자리: 영문 대문자
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 뒤 3자리: 숫자
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
}

/**
 * 중복되지 않는 학생 코드 생성
 */
async function generateUniqueStudentCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateStudentCode();
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('고유한 학생 코드 생성에 실패했습니다. 최대 시도 횟수 초과.');
    }
    
    const existing = await prisma.user.findUnique({
      where: { studentCode: code }
    });
    
    if (!existing) {
      return code;
    }
  } while (true);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('📚 학생 코드 자동 할당 시작...\n');
  
  try {
    // 학생 코드가 없는 학생들 조회
    const studentsWithoutCode = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { studentCode: null },
          { studentCode: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        academyId: true,
        academy: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (studentsWithoutCode.length === 0) {
      console.log('✅ 모든 학생에게 이미 학생 코드가 할당되어 있습니다.');
      return;
    }
    
    console.log(`🔍 학생 코드가 없는 학생: ${studentsWithoutCode.length}명\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    // 각 학생에게 학생 코드 할당
    for (const student of studentsWithoutCode) {
      try {
        const studentCode = await generateUniqueStudentCode();
        
        await prisma.user.update({
          where: { id: student.id },
          data: { studentCode }
        });
        
        console.log(`✅ ${student.name} (${student.email}) → ${studentCode} ${student.academy?.name ? `[${student.academy.name}]` : ''}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${student.name} (${student.email}) 코드 할당 실패:`, error);
        failCount++;
      }
    }
    
    console.log(`\n📊 결과 요약:`);
    console.log(`   - 성공: ${successCount}명`);
    console.log(`   - 실패: ${failCount}명`);
    console.log(`   - 총계: ${studentsWithoutCode.length}명`);
    
    if (successCount > 0) {
      console.log('\n🎉 학생 코드 할당 완료!');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
main()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
