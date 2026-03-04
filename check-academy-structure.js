// Academy 테이블 구조 확인 및 꾸메땅학원 director 정보 확인
const TEST_TOKEN = "user-1732711740956-2slb2dum1|kohsunwoo12345@gmail.com|SUPER_ADMIN|academy-1732710877906-h2tqnjr9n|1741140851752";
const BASE_URL = "https://superplacestudy.pages.dev";

async function checkAcademyStructure() {
  console.log("🔍 === Academy 테이블 및 꾸메땅학원 정보 확인 ===\n");

  try {
    // 꾸메땅학원 상세 정보 조회
    const academyId = "academy-1771479246368-5viyubmqk";
    
    const response = await fetch(
      `${BASE_URL}/api/admin/academies?id=${academyId}`,
      {
        headers: {
          "Authorization": `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ 조회 실패: ${response.status}`);
      return;
    }

    const data = await response.json();
    const academy = data.academy;

    console.log("✅ 꾸메땅학원 정보:");
    console.log(JSON.stringify(academy, null, 2));
    
    console.log("\n📋 중요 필드:");
    console.log(`  - ID: ${academy.id}`);
    console.log(`  - 이름: ${academy.name}`);
    console.log(`  - director 객체: ${academy.director ? '있음' : '없음'}`);
    
    if (academy.director) {
      console.log(`  - director.id: ${academy.director.id}`);
      console.log(`  - director.email: ${academy.director.email}`);
      console.log(`  - director.name: ${academy.director.name}`);
    }

    // Academy 테이블 자체의 필드 확인
    console.log("\n🔍 Academy 테이블 필드:");
    console.log("  예상 필드: directorId, directorEmail");
    console.log(`  - directorId: ${academy.directorId || '없음'}`);
    console.log(`  - directorEmail: ${academy.directorEmail || '없음'}`);
    console.log(`  - director_id: ${academy.director_id || '없음'}`);
    console.log(`  - director_email: ${academy.director_email || '없음'}`);

    console.log("\n💡 문제 진단:");
    if (!academy.directorId && !academy.directorEmail && !academy.director_id && !academy.director_email) {
      console.log("❌ Academy 테이블에 director 관련 필드가 없습니다!");
      console.log("   → 로그인 API에서 academy 테이블로 학원을 찾을 수 없음");
      console.log("   → User 테이블의 academyId를 직접 업데이트해야 함");
    } else {
      console.log("✅ Director 필드가 있습니다");
    }

  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  }

  console.log("\n🔍 === 완료 ===");
}

checkAcademyStructure().catch(console.error);
