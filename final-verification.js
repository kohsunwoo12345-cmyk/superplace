// 최종 검증: 학원장 로그인 → AI 챗봇 할당 확인
const BASE_URL = "https://superplacestudy.pages.dev";

async function finalVerification() {
  console.log("🎯 === 최종 검증: 할당된 봇만 표시되는지 확인 ===\n");

  // 1단계: 학원장 로그인
  console.log("1️⃣ 학원장 로그인 시도...");
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "wangholy1@naver.com",
      password: "test1234", // 실제 비밀번호로 변경 필요
    }),
  });

  if (!loginResponse.ok) {
    console.log(`❌ 로그인 실패: ${loginResponse.status}`);
    console.log("⚠️ 비밀번호가 틀릴 수 있습니다");
    console.log("\n다음 단계를 수동으로 진행하세요:");
    console.log("1. https://superplacestudy.pages.dev/login 접속");
    console.log("2. wangholy1@naver.com 계정으로 로그인");
    console.log("3. https://superplacestudy.pages.dev/ai-chat 접속");
    console.log("4. 봇 드롭다운에서 '수학 PDF 테스트 봇'만 표시되는지 확인");
    return;
  }

  const loginData = await loginResponse.json();
  console.log("✅ 로그인 성공!");
  console.log(`   토큰: ${loginData.token?.substring(0, 50)}...`);
  console.log(`   사용자: ${loginData.user?.name} (${loginData.user?.email})`);
  console.log(`   역할: ${loginData.user?.role}`);
  console.log(`   학원 ID: ${loginData.user?.academyId}`);
  console.log(`   학원 이름: ${loginData.user?.academyName}`);

  if (!loginData.user?.academyId) {
    console.log("\n❌ academyId가 여전히 없습니다!");
    console.log("   다시 로그아웃 후 재로그인 해보세요");
    return;
  }

  // 2단계: 할당된 봇 조회
  console.log("\n2️⃣ 할당된 봇 조회...");
  const botsResponse = await fetch(
    `${BASE_URL}/api/user/academy-bots?academyId=${loginData.user.academyId}`,
    {
      headers: {
        "Authorization": `Bearer ${loginData.token}`,
      },
    }
  );

  if (!botsResponse.ok) {
    console.log(`❌ 봇 조회 실패: ${botsResponse.status}`);
    const errorText = await botsResponse.text();
    console.log(`   오류: ${errorText}`);
    return;
  }

  const botsData = await botsResponse.json();
  console.log(`✅ 봇 조회 성공!`);
  console.log(`   할당된 봇 수: ${botsData.count}개`);

  if (botsData.bots && botsData.bots.length > 0) {
    console.log("\n📱 할당된 봇 목록:");
    botsData.bots.forEach((bot, index) => {
      console.log(`   ${index + 1}. ${bot.name}`);
      console.log(`      - ID: ${bot.id}`);
      console.log(`      - 모델: ${bot.model}`);
      console.log(`      - 활성: ${bot.isActive ? '예' : '아니오'}`);
    });
  } else {
    console.log("\n⚠️ 할당된 봇이 없습니다");
  }

  // 3단계: 전체 봇 목록과 비교
  console.log("\n3️⃣ 전체 봇 목록 조회 (비교용)...");
  const allBotsResponse = await fetch(`${BASE_URL}/api/admin/ai-bots`, {
    headers: {
      "Authorization": `Bearer ${loginData.token}`,
    },
  });

  if (allBotsResponse.ok) {
    const allBotsData = await allBotsResponse.json();
    console.log(`   전체 봇 수: ${allBotsData.bots?.length || 0}개`);
  }

  // 최종 결과
  console.log("\n\n🎯 === 최종 검증 결과 ===");
  if (botsData.count === 1 && botsData.bots[0].name === "수학 PDF 테스트 봇") {
    console.log("✅ 성공! 할당된 봇만 정확하게 표시됩니다!");
    console.log("   - 학원장 academyId: 설정됨");
    console.log("   - 할당된 봇: 1개 (수학 PDF 테스트 봇)");
    console.log("   - 다른 봇: 표시되지 않음");
  } else if (botsData.count === 0) {
    console.log("⚠️ 할당된 봇이 없습니다");
    console.log("   관리자에서 봇을 먼저 할당해야 합니다");
  } else {
    console.log("⚠️ 예상과 다른 결과입니다");
    console.log(`   할당된 봇 수: ${botsData.count}개`);
  }

  console.log("\n📋 사용자 확인 방법:");
  console.log("1. https://superplacestudy.pages.dev/login 접속");
  console.log("2. wangholy1@naver.com 로그인");
  console.log("3. https://superplacestudy.pages.dev/ai-chat 접속");
  console.log("4. 봇 드롭다운에서 '수학 PDF 테스트 봇'만 보이면 성공!");
}

finalVerification().catch(console.error);
