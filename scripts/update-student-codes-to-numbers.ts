/**
 * 학생 코드를 숫자로 업데이트하는 스크립트
 * 
 * 영문자가 포함된 학생 코드를 5자리 숫자 코드로 변경합니다.
 * 학생 코드 형식: 숫자 5자리 (예: 12345, 67890)
 * 범위: 10000 ~ 99999
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 5자리 숫자 학생 코드 생성
 * 형식: [0-9]{5} (10000~99999)
 */
function generateStudentCode(): string {
  // 10000 ~ 99999 범위의 랜덤 숫자 생성
  const randomNum = Math.floor(Math.random() * 90000) + 10000;
  return randomNum.toString();
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
  console.log('📚 학생 코드 숫자로 업데이트 시작...\n');
  
  try {
    // 모든 학생 조회
    const allStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentCode: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentCode: true,
        academyId: true,
        academy: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (allStudents.length === 0) {
      console.log('✅ 업데이트할 학생이 없습니다.');
      return;
    }
    
    console.log(`🔍 총 학생 수: ${allStudents.length}명\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    // 각 학생의 코드 확인 및 업데이트
    for (const student of allStudents) {
      try {
        const currentCode = student.studentCode || '';
        
        // 이미 5자리 숫자인지 확인
        const isNumeric = /^\d{5}$/.test(currentCode);
        
        if (isNumeric) {
          console.log(`⏭️  ${student.name} (${student.email}) → ${currentCode} (이미 숫자 형식) ${student.academy?.name ? `[${student.academy.name}]` : ''}`);
          skipCount++;
          continue;
        }
        
        // 새로운 숫자 코드 생성
        const newCode = await generateUniqueStudentCode();
        
        await prisma.user.update({
          where: { id: student.id },
          data: { studentCode: newCode }
        });
        
        console.log(`✅ ${student.name} (${student.email}) → ${currentCode} ⇒ ${newCode} ${student.academy?.name ? `[${student.academy.name}]` : ''}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${student.name} (${student.email}) 코드 업데이트 실패:`, error);
        failCount++;
      }
    }
    
    console.log(`\n📊 결과 요약:`);
    console.log(`   - 업데이트 성공: ${successCount}명`);
    console.log(`   - 이미 숫자 형식: ${skipCount}명`);
    console.log(`   - 실패: ${failCount}명`);
    console.log(`   - 총계: ${allStudents.length}명`);
    
    if (successCount > 0) {
      console.log('\n🎉 학생 코드 업데이트 완료!');
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
