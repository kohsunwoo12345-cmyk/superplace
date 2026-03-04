// 꾸메땅학원 정보 확인
const TEST_TOKEN = "user-1732711740956-2slb2dum1|kohsunwoo12345@gmail.com|SUPER_ADMIN|academy-1732710877906-h2tqnjr9n|1741140851752";
const BASE_URL = "https://superplacestudy.pages.dev";

async function checkKumeddangAcademy() {
  console.log("🧪 === 꾸메땅학원 정보 확인 ===\n");

  try {
    // 1. 모든 학원 목록 조회
    console.log("1️⃣ 학원 목록 조회 중...");
    const academiesResponse = await fetch(`${BASE_URL}/api/admin/academies`, {
      headers: {
        "Authorization": `Bearer ${TEST_TOKEN}`,
      },
    });

    if (!academiesResponse.ok) {
      console.error(`❌ 학원 목록 조회 실패: ${academiesResponse.status}`);
      return;
    }

    const academiesData = await academiesResponse.json();
    console.log(`✅ 총 ${academiesData.count}개 학원 발견`);

    // 꾸메땅학원 찾기
    const kumeddang = academiesData.academies?.find(a => 
      a.name && a.name.includes('꾸메땅')
    );

    if (!kumeddang) {
      console.log("⚠️ 꾸메땅학원을 찾을 수 없습니다");
      console.log("\n학원 목록 (일부):");
      academiesData.academies?.slice(0, 10).forEach(a => {
        console.log(`  - ${a.name} (ID: ${a.id})`);
      });
      return;
    }

    console.log("\n✅ 꾸메땅학원 발견:");
    console.log(`  - ID: ${kumeddang.id}`);
    console.log(`  - 이름: ${kumeddang.name}`);
    console.log(`  - 학생 수: ${kumeddang.studentCount || 0}명`);
    console.log(`  - 교사 수: ${kumeddang.teacherCount || 0}명`);
    console.log(`  - 원장: ${kumeddang.director?.name || '없음'} (${kumeddang.director?.email || '없음'})`);

    // 2. 해당 학원의 봇 할당 확인
    console.log("\n2️⃣ 할당된 봇 확인 중...");
    const botsResponse = await fetch(
      `${BASE_URL}/api/user/academy-bots?academyId=${kumeddang.id}`,
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
          console.log(`  - ${bot.name} (ID: ${bot.id})`);
        });
      }
    } else {
      console.error(`❌ 봇 조회 실패: ${botsResponse.status}`);
    }

    // 3. 학원장 계정 찾기 (User 테이블 직접 조회는 불가하므로 academy API 결과 사용)
    console.log("\n3️⃣ 학원장 계정 정보:");
    if (kumeddang.director) {
      console.log(`  - 이름: ${kumeddang.director.name}`);
      console.log(`  - 이메일: ${kumeddang.director.email}`);
      console.log(`  - ID: ${kumeddang.director.id}`);
      console.log(`  - 학원 ID: ${kumeddang.id}`);
      
      console.log("\n📋 테스트 안내:");
      console.log(`1. 이 계정으로 로그인: ${kumeddang.director.email}`);
      console.log(`2. https://superplacestudy.pages.dev/ai-chat 접속`);
      console.log(`3. academyId가 ${kumeddang.id}로 설정되어 있는지 확인`);
      console.log(`4. 할당된 봇이 표시되는지 확인`);
    } else {
      console.log("  ⚠️ 학원장 정보 없음");
    }

  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  }

  console.log("\n🧪 === 테스트 완료 ===");
}

checkKumeddangAcademy().catch(console.error);
