// 꾸메땅학원 학원장 academyId 업데이트
const BASE_URL = "https://superplacestudy.pages.dev";

async function fixDirectorAcademyId() {
  console.log("🔧 === 학원장 academyId 수정 ===\n");

  const directorEmail = "wangholy1@naver.com";
  const academyId = "academy-1771479246368-5viyubmqk";

  console.log(`학원장: ${directorEmail}`);
  console.log(`학원 ID: ${academyId}`);
  console.log();

  try {
    const response = await fetch(`${BASE_URL}/api/admin/fix-director-academy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        directorEmail: directorEmail,
        academyId: academyId,
      }),
    });

    console.log(`상태: ${response.status}`);
    const data = await response.json();
    console.log("\n응답:");
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("\n✅ 성공!");
      console.log("\n다음 단계:");
      console.log("1. 학원장 계정 재로그인");
      console.log("2. AI 챗 페이지 접속");
      console.log("3. 할당된 봇만 표시되는지 확인");
    } else {
      console.log("\n❌ 실패:", data.message);
    }
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
  }

  console.log("\n🔧 === 완료 ===");
}

fixDirectorAcademyId().catch(console.error);
