// 봇이 할당된 학원 확인
const TEST_TOKEN = "user-1732711740956-2slb2dum1|kohsunwoo12345@gmail.com|SUPER_ADMIN|academy-1732710877906-h2tqnjr9n|1741140851752";
const BASE_URL = "https://superplacestudy.pages.dev";
const TARGET_ACADEMY_ID = "academy-1771479246368-5viyubmqk";

async function checkAcademyWithBot() {
  console.log("🧪 === 봇이 할당된 학원 정보 확인 ===\n");
  console.log(`학원 ID: ${TARGET_ACADEMY_ID}\n`);

  try {
    // 1. 특정 학원 상세 정보 조회
    console.log("1️⃣ 학원 상세 정보 조회 중...");
    const academyResponse = await fetch(
      `${BASE_URL}/api/admin/academies?id=${TARGET_ACADEMY_ID}`,
      {
        headers: {
          "Authorization": `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    if (!academyResponse.ok) {
      console.error(`❌ 학원 조회 실패: ${academyResponse.status}`);
      return;
    }

    const academyData = await academyResponse.json();
    
    if (!academyData.academy) {
      console.log("⚠️ 학원을 찾을 수 없습니다");
      return;
    }

    const academy = academyData.academy;
    console.log("\n✅ 학원 정보:");
    console.log(`  - ID: ${academy.id}`);
    console.log(`  - 이름: ${academy.name}`);
    console.log(`  - 주소: ${academy.address || '없음'}`);
    console.log(`  - 학생 수: ${academy.studentCount || 0}명`);
    console.log(`  - 교사 수: ${academy.teacherCount || 0}명`);
    
    console.log("\n학원장 정보:");
    if (academy.director) {
      console.log(`  - ID: ${academy.director.id}`);
      console.log(`  - 이름: ${academy.director.name}`);
      console.log(`  - 이메일: ${academy.director.email}`);
      console.log(`  - 전화번호: ${academy.director.phone || '없음'}`);
      console.log(`  - academyId: ${academy.director.academyId || '없음'}`);
    } else {
      console.log("  ❌ 학원장 정보 없음!");
    }

    // 2. 할당된 봇 확인
    console.log("\n2️⃣ 할당된 봇 확인 중...");
    const botsResponse = await fetch(
      `${BASE_URL}/api/user/academy-bots?academyId=${TARGET_ACADEMY_ID}`,
      {
        headers: {
          "Authorization": `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    if (botsResponse.ok) {
      const botsData = await botsResponse.json();
      console.log(`✅ 할당된 봇: ${botsData.count}개`);
      
      if (botsData.bots && botsData.bots.length > 0) {
        botsData.bots.forEach(bot => {
          console.log(`\n  📱 ${bot.name}`);
          console.log(`     ID: ${bot.id}`);
          console.log(`     모델: ${bot.model}`);
          console.log(`     활성: ${bot.isActive ? '예' : '아니오'}`);
        });
      }
    } else {
      console.error(`❌ 봇 조회 실패: ${botsResponse.status}`);
    }

    // 3. 문제 진단
    console.log("\n\n3️⃣ 문제 진단:");
    if (!academy.director) {
      console.log("❌ **핵심 문제**: 이 학원에 학원장이 연결되어 있지 않습니다!");
      console.log("   → 학원장 계정의 academyId 필드가 이 학원 ID와 일치하지 않음");
      console.log("   → AI 챗 페이지에서 '학원 정보가 없습니다' 팝업 발생");
      
      console.log("\n해결 방법:");
      console.log("1. 학원장 계정을 찾아서 academyId를 업데이트");
      console.log("2. 또는 새로운 학원장 계정을 이 학원에 연결");
      console.log(`   UPDATE User SET academyId = '${TARGET_ACADEMY_ID}' WHERE role = 'DIRECTOR' AND email = '학원장이메일';`);
    } else {
      console.log("✅ 학원장이 정상적으로 연결되어 있습니다");
      console.log(`   학원장 계정: ${academy.director.email}`);
      console.log("\n이 계정으로 로그인하면 AI 챗봇 사용 가능");
    }

  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  }

  console.log("\n🧪 === 테스트 완료 ===");
}

checkAcademyWithBot().catch(console.error);
