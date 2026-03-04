// 학원장 계정 academyId 확인 테스트
const BASE_URL = "https://superplacestudy.pages.dev";

async function testDirectorAcademyId() {
  console.log("🧪 === 학원장 계정 academyId 확인 테스트 ===\n");

  // 테스트용 학원장 계정 (실제 학원장 이메일로 변경 필요)
  const testCredentials = [
    { email: "director@kumeddang.com", password: "test1234", name: "꾸메땅학원장" },
    { email: "admin@superplace.co.kr", password: "admin1234", name: "관리자" }
  ];

  for (const cred of testCredentials) {
    console.log(`\n📧 테스트 계정: ${cred.name} (${cred.email})`);
    console.log("━".repeat(60));
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password,
        }),
      });

      console.log(`상태: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        console.log("✅ 로그인 성공!");
        console.log("\n👤 사용자 정보:");
        console.log(`  - ID: ${data.user?.id || '❌ 없음'}`);
        console.log(`  - 이름: ${data.user?.name || '❌ 없음'}`);
        console.log(`  - 이메일: ${data.user?.email || '❌ 없음'}`);
        console.log(`  - 역할: ${data.user?.role || '❌ 없음'}`);
        console.log(`  - 학원 ID: ${data.user?.academyId || '❌ 없음'}`);
        console.log(`  - 학원 이름: ${data.user?.academyName || '❌ 없음'}`);
        console.log(`  - 학원 코드: ${data.user?.academyCode || '❌ 없음'}`);

        console.log("\n🔑 토큰 정보:");
        if (data.token) {
          const tokenParts = data.token.split('|');
          console.log(`  - 토큰 형식: ${tokenParts.length}개 파트`);
          console.log(`  - 파트 1 (ID): ${tokenParts[0] || '없음'}`);
          console.log(`  - 파트 2 (Email): ${tokenParts[1] || '없음'}`);
          console.log(`  - 파트 3 (Role): ${tokenParts[2] || '없음'}`);
          console.log(`  - 파트 4 (AcademyId): ${tokenParts[3] || '❌ 없음'}`);
          console.log(`  - 파트 5 (Timestamp): ${tokenParts[4] || '없음'}`);
        }

        // academyId 체크
        if (!data.user?.academyId) {
          console.log("\n⚠️ 경고: academyId가 없습니다!");
          console.log("   이 계정으로 AI 챗봇 페이지 접속 시 '학원 정보가 없습니다' 팝업 발생");
        } else {
          console.log("\n✅ academyId 존재 - AI 챗봇 사용 가능");
          
          // 해당 학원에 할당된 봇 확인
          console.log("\n🤖 할당된 봇 확인 중...");
          const botsResponse = await fetch(
            `${BASE_URL}/api/user/academy-bots?academyId=${data.user.academyId}`,
            {
              headers: {
                "Authorization": `Bearer ${data.token}`,
              },
            }
          );

          if (botsResponse.ok) {
            const botsData = await botsResponse.json();
            console.log(`   봇 개수: ${botsData.count || 0}개`);
            if (botsData.bots && botsData.bots.length > 0) {
              botsData.bots.forEach(bot => {
                console.log(`   - ${bot.name} (ID: ${bot.id})`);
              });
            } else {
              console.log("   ⚠️ 할당된 봇이 없습니다");
            }
          } else {
            console.log(`   ❌ 봇 조회 실패: ${botsResponse.status}`);
          }
        }
      } else {
        console.log(`❌ 로그인 실패: ${data.message}`);
      }
    } catch (error) {
      console.error(`❌ 오류: ${error.message}`);
    }
  }

  console.log("\n\n🧪 === 테스트 완료 ===");
  console.log("\n📋 확인 사항:");
  console.log("1. 학원장 계정에 academyId가 있는가?");
  console.log("2. 토큰의 4번째 파트에 academyId가 포함되는가?");
  console.log("3. 해당 학원에 할당된 봇이 있는가?");
}

testDirectorAcademyId().catch(console.error);
