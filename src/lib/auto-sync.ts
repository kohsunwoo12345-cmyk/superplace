import { syncAcademyData } from './user-sync';

/**
 * 로그인 후 백그라운드에서 학원 데이터 동기화
 * 학원장이나 관리자 로그인 시 자동으로 실행
 */
export async function syncOnLogin(userId: string, role: string, academyId?: string) {
  // DIRECTOR나 SUPER_ADMIN만 자동 동기화
  if (role !== 'DIRECTOR' && role !== 'SUPER_ADMIN') {
    return;
  }

  // academyId가 없으면 스킵
  if (role === 'DIRECTOR' && !academyId) {
    console.warn(`⚠️  학원장이지만 academyId가 없습니다: ${userId}`);
    return;
  }

  try {
    console.log(`🔄 로그인 후 자동 동기화 시작 (사용자: ${userId}, 역할: ${role})`);

    // 백그라운드에서 비동기 실행 (로그인 응답을 기다리지 않음)
    setImmediate(async () => {
      try {
        if (role === 'SUPER_ADMIN') {
          // 관리자는 모든 학원 동기화하지 않고 스킵
          console.log(`ℹ️  관리자는 수동 동기화를 사용하세요`);
          return;
        }

        if (academyId) {
          console.log(`🔄 학원 동기화 중... (학원: ${academyId})`);
          await syncAcademyData(academyId, userId);
          console.log(`✅ 로그인 후 자동 동기화 완료 (학원: ${academyId})`);
        }
      } catch (error) {
        console.error('❌ 로그인 후 자동 동기화 실패:', error);
        // 동기화 실패해도 로그인은 정상 진행
      }
    });
  } catch (error) {
    console.error('❌ 자동 동기화 설정 실패:', error);
    // 오류 무시
  }
}

/**
 * 학생 데이터 변경 시 자동 동기화 트리거
 */
export async function triggerStudentSync(academyId: string, userId: string) {
  if (!academyId) return;

  console.log(`🔄 학생 데이터 변경 감지 - 동기화 트리거 (학원: ${academyId})`);

  // 백그라운드에서 비동기 실행
  setImmediate(async () => {
    try {
      await syncAcademyData(academyId, userId);
      console.log(`✅ 학생 변경 후 자동 동기화 완료 (학원: ${academyId})`);
    } catch (error) {
      console.error('❌ 학생 변경 후 자동 동기화 실패:', error);
    }
  });
}

/**
 * 반 데이터 변경 시 자동 동기화 트리거
 */
export async function triggerClassSync(academyId: string, userId: string) {
  if (!academyId) return;

  console.log(`🔄 반 데이터 변경 감지 - 동기화 트리거 (학원: ${academyId})`);

  // 백그라운드에서 비동기 실행
  setImmediate(async () => {
    try {
      await syncAcademyData(academyId, userId);
      console.log(`✅ 반 변경 후 자동 동기화 완료 (학원: ${academyId})`);
    } catch (error) {
      console.error('❌ 반 변경 후 자동 동기화 실패:', error);
    }
  });
}
