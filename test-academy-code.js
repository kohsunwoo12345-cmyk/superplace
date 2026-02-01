const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAcademyCodeSearch() {
  try {
    const testCode = "WP2H3M37";
    
    console.log('\n=== 학원 코드 검색 테스트 ===\n');
    console.log(`테스트 코드: "${testCode}"`);
    console.log(`코드 길이: ${testCode.length}`);
    console.log(`코드 타입: ${typeof testCode}\n`);
    
    // 방법 1: 정확한 매칭
    console.log('--- 방법 1: 정확한 매칭 ---');
    const exactMatch = await prisma.academy.findUnique({
      where: { code: testCode }
    });
    console.log('결과:', exactMatch ? `찾음 - ${exactMatch.name}` : '못 찾음\n');
    
    // 방법 2: trim() + toUpperCase()
    console.log('--- 방법 2: trim() + toUpperCase() ---');
    const trimUpperMatch = await prisma.academy.findUnique({
      where: { code: testCode.trim().toUpperCase() }
    });
    console.log('결과:', trimUpperMatch ? `찾음 - ${trimUpperMatch.name}` : '못 찾음\n');
    
    // 방법 3: 모든 학원 코드 가져와서 비교
    console.log('--- 방법 3: 모든 학원 코드 확인 ---');
    const allAcademies = await prisma.academy.findMany({
      select: { 
        code: true, 
        name: true,
        id: true
      }
    });
    
    console.log('데이터베이스의 학원 코드들:');
    allAcademies.forEach(academy => {
      console.log(`  - "${academy.code}" (${academy.name})`);
      console.log(`    길이: ${academy.code.length}, 타입: ${typeof academy.code}`);
      console.log(`    입력 코드와 일치: ${academy.code === testCode}`);
    });
    
    // 방법 4: 대소문자 구분 없이 검색 (findMany 사용)
    console.log('\n--- 방법 4: 대소문자 구분 없이 검색 ---');
    const caseInsensitiveMatch = await prisma.academy.findMany({
      where: { 
        code: {
          equals: testCode,
          mode: 'insensitive'
        }
      }
    });
    console.log('결과:', caseInsensitiveMatch.length > 0 ? `찾음 - ${caseInsensitiveMatch[0].name}` : '못 찾음');

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAcademyCodeSearch();
