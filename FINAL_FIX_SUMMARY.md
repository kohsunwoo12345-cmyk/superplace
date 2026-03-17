# 🎯 최종 수정 사항 요약 (2026-03-17)

## 문제
학생 계정으로 `/ai-chat/` 접속 시 학원의 모든 구독 봇이 보이는 문제
- 로그: `🔍 현재 user: null` → fetchBots 호출 시 user 상태가 null
- 원인: useEffect에서 `setUser(userData)` 실행 전에 `fetchBots(academyId)` 호출

## 해결 방법
### 1. fetchBots 함수 수정 (src/app/ai-chat/page.tsx)
```typescript
// ❌ 이전 코드
const fetchBots = async (academyId: string) => {
  console.log("🔍 현재 user:", user); // null
  if (user.role === "STUDENT") { // 에러: user가 null
    // 학생 전용 API 호출
  }
}

// ✅ 수정 후
const fetchBots = async (academyId: string, userData: any) => {
  console.log("🔍 현재 userData:", userData); // 정상
  if (userData?.role?.toUpperCase() === "STUDENT") {
    // 학생 전용 API 호출
    const response = await fetch(`/api/user/ai-bots?academyId=${academyId}&userId=${userData.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // 학생에게 개별 할당된 봇만 표시
  } else {
    // 학원장/선생님 - 학원 구독 봇 조회
    const response = await fetch(`/api/user/academy-bots?academyId=${academyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}
```

### 2. fetchBots 호출 수정
```typescript
// ❌ 이전 코드
setUser(userData);
fetchBots(academyId); // user가 아직 null

// ✅ 수정 후
setUser(userData);
fetchBots(academyId, userData); // userData 직접 전달
```

## API 엔드포인트 차이
| 역할 | API | 조회 대상 |
|------|-----|----------|
| **학생 (STUDENT)** | `/api/user/ai-bots?academyId=xxx&userId=yyy` | `ai_bot_assignments` 테이블 - 개별 할당된 봇만 |
| **학원장/선생님** | `/api/user/academy-bots?academyId=xxx` | `AcademyBotSubscription` 테이블 - 학원 전체 구독 봇 |
| **관리자 (ADMIN)** | `/api/admin/ai-bots` | `ai_bots` 테이블 - 모든 봇 |

## 배포 정보
- **커밋**: `3b8db593`
- **메시지**: "fix: fetchBots에 userData 전달하여 user null 문제 해결"
- **배포 시간**: 2026-03-17
- **적용 예상**: 3-5분 후

## 테스트 절차 (배포 3-5분 후)
1. **학생 계정으로 로그인**
   - 계정: `student_1773655529913@temp.superplace.local`
   - 학원: 꾸메땅학원 (academy-1771479246368-5viyubmqk)

2. **페이지 접속**
   - URL: `https://suplacestudy.com/ai-chat/`
   - **하드 리프레시 필수**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

3. **F12 콘솔 확인**
   ```
   ✅ 예상 로그:
   🔍 현재 userData: {id: 'student-...', role: 'STUDENT', ...}
   🔍 user.role: STUDENT
   🔍 user.role 대문자: STUDENT
   🎓 학생 - 개별 할당된 봇만 조회: /api/user/ai-bots?academyId=...&userId=...
   ✅ 학생에게 할당된 봇 X개 표시
   ```

4. **결과 확인**
   - ✅ 학생에게 **개별 할당된 봇만** 표시
   - ✅ 학원 전체 구독 봇 중 할당되지 않은 봇은 **표시되지 않음**

## 이전 수정 이력
1. **커밋 `dc425bda`**: 학생 role 체크 추가 (하지만 user가 null이라 작동 안 함)
2. **커밋 `eab6b7e3`**: 대소문자 구분 없는 role 체크 (여전히 user가 null)
3. **커밋 `3b8db593`**: ✅ **최종 해결** - userData 직접 전달

## 관련 파일
- `src/app/ai-chat/page.tsx`: fetchBots 함수 및 호출 수정
- `functions/api/user/ai-bots.js`: 학생 전용 봇 조회 API
- `functions/api/user/academy-bots.js`: 학원 구독 봇 조회 API

## 핵심 요약
**문제**: fetchBots 호출 시 user 상태가 null
**해결**: fetchBots(academyId, userData)로 userData 직접 전달
**결과**: 학생은 개별 할당된 봇만, 학원장은 학원 구독 봇만 표시

---
**최종 테스트 대기 중** (배포 후 3-5분) 🚀
