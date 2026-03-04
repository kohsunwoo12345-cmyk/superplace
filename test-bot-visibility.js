// 학원장 계정 AI 챗봇 표시 테스트
// 학원 할당 -> AI 챗봇 표시 전체 흐름 검증

const TEST_TOKEN = "user-1732711740956-2slb2dum1|kohsunwoo12345@gmail.com|SUPER_ADMIN|academy-1732710877906-h2tqnjr9n|1741140851752";
const BASE_URL = "https://superplacestudy.pages.dev";

async function testBotVisibility() {
  console.log("🧪 === 학원 봇 할당 가시성 테스트 시작 ===\n");

  // 1️⃣ AcademyBotSubscription 테이블 확인
  console.log("1️⃣ AcademyBotSubscription 레코드 확인...");
  try {
    const subResponse = await fetch(`${BASE_URL}/api/admin/academy-bot-subscriptions`, {
      headers: {
        "Authorization": `Bearer ${TEST_TOKEN}`,
      },
    });
    
    console.log(`   상태: ${subResponse.status}`);
    const subData = await subResponse.json();
    console.log(`   레코드 수: ${subData.count || 0}`);
    
    if (subData.subscriptions && subData.subscriptions.length > 0) {
      console.log("   ✅ 할당된 구독:");
      subData.subscriptions.forEach(s => {
        console.log(`      - 학원: ${s.academyId}, 봇: ${s.productId}, 학생: ${s.totalStudentSlots}, 만료: ${s.subscriptionEnd}`);
      });
    }
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
  }

  // 2️⃣ AI 봇 목록 확인
  console.log("\n2️⃣ AI 봇 목록 확인...");
  try {
    const botsResponse = await fetch(`${BASE_URL}/api/admin/ai-bots`, {
      headers: {
        "Authorization": `Bearer ${TEST_TOKEN}`,
      },
    });
    
    console.log(`   상태: ${botsResponse.status}`);
    const botsData = await botsResponse.json();
    console.log(`   총 봇 수: ${botsData.count || 0}`);
    
    if (botsData.bots && botsData.bots.length > 0) {
      console.log("   ✅ 사용 가능한 봇:");
      botsData.bots.forEach(b => {
        console.log(`      - ID: ${b.id}, 이름: ${b.name}, 활성: ${b.isActive ? '예' : '아니오'}`);
      });
    }
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
  }

  // 3️⃣ 학원별 사용자 봇 조회 (실제 AI 챗에서 호출하는 API)
  console.log("\n3️⃣ 사용자별 할당된 봇 조회...");
  
  // 테스트할 academyId 목록 (위 구독에서 확인된 ID 사용)
  const testAcademyId = "academy-1732710877906-h2tqnjr9n";
  
  try {
    const userBotsResponse = await fetch(
      `${BASE_URL}/api/user/ai-bots?academyId=${testAcademyId}`,
      {
        headers: {
          "Authorization": `Bearer ${TEST_TOKEN}`,
        },
      }
    );
    
    console.log(`   상태: ${userBotsResponse.status}`);
    const userBotsData = await userBotsResponse.json();
    console.log(`   할당된 봇 수: ${userBotsData.count || 0}`);
    
    if (userBotsData.bots && userBotsData.bots.length > 0) {
      console.log("   ✅ 학원에 할당된 봇:");
      userBotsData.bots.forEach(b => {
        console.log(`      - ID: ${b.id}, 이름: ${b.name}, 만료: ${b.expiresAt || '없음'}`);
      });
    } else {
      console.log("   ⚠️ 이 학원에 할당된 봇이 없습니다");
      console.log("   응답 내용:", JSON.stringify(userBotsData, null, 2));
    }
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
  }

  // 4️⃣ 학원 정보 확인
  console.log("\n4️⃣ 학원 정보 확인...");
  try {
    const academyResponse = await fetch(`${BASE_URL}/api/admin/academies`, {
      headers: {
        "Authorization": `Bearer ${TEST_TOKEN}`,
      },
    });
    
    console.log(`   상태: ${academyResponse.status}`);
    const academyData = await academyResponse.json();
    
    if (academyData.academies && academyData.academies.length > 0) {
      console.log(`   ✅ 총 학원 수: ${academyData.count || 0}`);
      academyData.academies.forEach(a => {
        console.log(`      - ID: ${a.id}, 이름: ${a.name}`);
      });
    }
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
  }

  console.log("\n🧪 === 테스트 완료 ===");
  console.log("\n📋 다음 단계:");
  console.log("1. 학원장 계정으로 로그인");
  console.log("2. localStorage에서 토큰 확인");
  console.log("3. AI 도우미 챗봇 페이지 접속");
  console.log("4. 브라우저 콘솔에서 네트워크 요청 확인");
  console.log("5. 위 테스트에서 할당된 봇이 실제로 보이는지 확인");
}

testBotVisibility().catch(console.error);
