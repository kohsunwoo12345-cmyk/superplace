// AcademyBotSubscription 레코드 상세 조회
const TEST_TOKEN = "user-1732711740956-2slb2dum1|kohsunwoo12345@gmail.com|SUPER_ADMIN|academy-1732710877906-h2tqnjr9n|1741140851752";
const BASE_URL = "https://superplacestudy.pages.dev";

async function checkSubscriptionRecords() {
  console.log("🔍 === AcademyBotSubscription 레코드 상세 조회 ===\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/academy-bot-subscriptions`, {
      headers: {
        "Authorization": `Bearer ${TEST_TOKEN}`,
      },
    });

    console.log(`상태: ${response.status}`);
    const data = await response.json();
    
    console.log("\n📋 전체 응답:");
    console.log(JSON.stringify(data, null, 2));

    if (data.subscriptions && data.subscriptions.length > 0) {
      console.log("\n✅ 할당된 구독 상세:");
      data.subscriptions.forEach((s, i) => {
        console.log(`\n=== 구독 ${i + 1} ===`);
        console.log(`  ID: ${s.id}`);
        console.log(`  학원 ID: ${s.academyId}`);
        console.log(`  봇 ID: ${s.productId}`);
        console.log(`  봇 이름: ${s.productName}`);
        console.log(`  총 학생 수: ${s.totalStudentSlots}`);
        console.log(`  사용 중: ${s.usedStudentSlots}`);
        console.log(`  남은 수: ${s.remainingStudentSlots}`);
        console.log(`  시작일: ${s.subscriptionStart}`);
        console.log(`  종료일: ${s.subscriptionEnd}`);
        console.log(`  활성: ${s.isActive ? '예' : '아니오'}`);
      });

      // 봇 ID가 실제로 있는지 확인
      console.log("\n\n🔍 할당된 봇 ID로 봇 정보 조회:");
      for (const sub of data.subscriptions) {
        if (sub.productId) {
          console.log(`\n봇 ID: ${sub.productId} 확인 중...`);
          
          try {
            const botResponse = await fetch(`${BASE_URL}/api/admin/ai-bots`, {
              headers: {
                "Authorization": `Bearer ${TEST_TOKEN}`,
              },
            });
            
            const botData = await botResponse.json();
            const matchingBot = botData.bots?.find(b => b.id === sub.productId);
            
            if (matchingBot) {
              console.log(`  ✅ 봇 발견: ${matchingBot.name}`);
              console.log(`     - 활성: ${matchingBot.isActive ? '예' : '아니오'}`);
            } else {
              console.log(`  ❌ 봇을 찾을 수 없음`);
            }
          } catch (e) {
            console.error(`  ❌ 오류: ${e.message}`);
          }
        } else {
          console.log(`  ⚠️ productId가 없음`);
        }
      }
    } else {
      console.log("\n⚠️ 할당된 구독이 없습니다");
    }
  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  }

  console.log("\n\n🧪 === 테스트 완료 ===");
}

checkSubscriptionRecords().catch(console.error);
