// 새로운 academy-bots API 테스트
const TEST_TOKEN = "user-1732711740956-2slb2dum1|kohsunwoo12345@gmail.com|SUPER_ADMIN|academy-1732710877906-h2tqnjr9n|1741140851752";
const BASE_URL = "https://superplacestudy.pages.dev";
const TEST_ACADEMY_ID = "academy-1771479246368-5viyubmqk";

async function testNewEndpoint() {
  console.log("🧪 === 새로운 /api/user/academy-bots 엔드포인트 테스트 ===\n");

  try {
    console.log(`학원 ID: ${TEST_ACADEMY_ID}`);
    
    const response = await fetch(
      `${BASE_URL}/api/user/academy-bots?academyId=${TEST_ACADEMY_ID}`,
      {
        headers: {
          "Authorization": `Bearer ${TEST_TOKEN}`,
        },
      }
    );
    
    console.log(`\n상태 코드: ${response.status}`);
    
    const data = await response.json();
    console.log(`\n응답 데이터:`);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.bots && data.bots.length > 0) {
      console.log(`\n✅ 성공! ${data.count}개의 봇 발견:`);
      data.bots.forEach(bot => {
        console.log(`  - ${bot.name} (ID: ${bot.id})`);
      });
    } else if (data.success && data.count === 0) {
      console.log(`\n⚠️ 할당된 봇이 없습니다`);
    } else {
      console.log(`\n❌ 실패: ${data.message || data.error}`);
    }
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
  }

  console.log("\n🧪 === 테스트 완료 ===");
}

testNewEndpoint().catch(console.error);
