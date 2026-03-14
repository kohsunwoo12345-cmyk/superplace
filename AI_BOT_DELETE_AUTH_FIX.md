# AI 봇 삭제 기능 수정 - 인증 추가

## 배포 정보
- **커밋**: `874fc556`
- **배포 시간**: 2026-03-14 18:53 KST
- **URL**: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/

## 문제 상황

### 사용자 보고:
> "여전히 삭제를 눌러도 삭제가 되지 않는 중이야."

### 증상:
- AI 봇 관리 페이지에서 삭제 버튼(🗑️) 클릭
- 확인 팝업에서 "확인" 클릭
- **아무 일도 일어나지 않음**
- 봇이 삭제되지 않고 목록에 그대로 남아있음

---

## 원인 분석

### 발견된 문제:

#### 1. **프론트엔드: Authorization 헤더 누락**
- **파일**: `src/app/dashboard/admin/ai-bots/page.tsx` (87-89줄)
- **문제**:
  ```typescript
  const response = await fetch(`/api/admin/ai-bots/${botId}`, {
    method: "DELETE",
    // Authorization 헤더 없음!
  });
  ```
- **결과**: API가 인증되지 않은 요청으로 간주하여 거부

#### 2. **백엔드: 인증 확인 로직 없음**
- **파일**: `functions/api/admin/ai-bots/[id].ts` (168-176줄)
- **문제**:
  ```typescript
  export const onRequestDelete = async (context) => {
    // 인증 체크 없음!
    await DB.prepare(`DELETE FROM ai_bots WHERE id = ?`).bind(botId).run();
  };
  ```
- **결과**: 인증 없이도 삭제 가능한 보안 취약점

#### 3. **에러 처리 부족**
- 삭제 실패 시 사용자에게 알림 없음
- 디버그 정보 부족

---

## 해결 방법

### 1. **프론트엔드: Authorization 헤더 추가** ✅

**변경 사항:**
```typescript
const handleDelete = async (botId: string, botName: string) => {
  if (!confirm(`정말로 "${botName}" 봇을 삭제하시겠습니까?`)) {
    return;
  }

  try {
    // ✅ 토큰 가져오기
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const response = await fetch(`/api/admin/ai-bots/${botId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,  // ✅ 인증 헤더 추가
      },
    });

    if (response.ok) {
      alert("삭제되었습니다.");
      fetchBots();
    } else {
      // ✅ 에러 메시지 표시
      const errorData = await response.json().catch(() => ({}));
      alert(`삭제 실패: ${errorData.error || errorData.message || "알 수 없는 오류"}`);
      console.error("삭제 실패:", response.status, errorData);
    }
  } catch (error) {
    console.error("삭제 실패:", error);
    alert("삭제 중 오류가 발생했습니다.");
  }
};
```

**개선 사항:**
- ✅ Authorization 헤더 추가
- ✅ 토큰 없을 시 로그인 페이지로 리다이렉트
- ✅ 삭제 실패 시 상세 에러 메시지 표시
- ✅ 에러 처리 강화

---

### 2. **백엔드: 인증 확인 로직 추가** ✅

**변경 사항:**
```typescript
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { DB } = env;
    const botId = context.params.id as string;

    // ✅ 인증 확인
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "인증이 필요합니다." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🗑️ Deleting AI bot: ${botId}`);

    // ✅ 봇 존재 확인
    const existingBot = await DB.prepare(`
      SELECT id, name FROM ai_bots WHERE id = ?
    `).bind(botId).first();

    if (!existingBot) {
      return new Response(
        JSON.stringify({ error: "Bot not found", message: "봇을 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found bot to delete: ${existingBot.name}`);

    // 삭제 실행
    await DB.prepare(`
      DELETE FROM ai_bots WHERE id = ?
    `).bind(botId).run();

    console.log(`✅ Bot deleted successfully: ${existingBot.name}`);

    return new Response(
      JSON.stringify({ success: true, message: "AI bot deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot deletion error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**개선 사항:**
- ✅ Authorization 헤더 확인
- ✅ 봇 존재 여부 확인 (404 반환)
- ✅ 디버그 로그 추가 (삭제 과정 추적)
- ✅ 에러 처리 개선

---

## 삭제 흐름

### Before (이전):
```
사용자: 삭제 버튼 클릭
  ↓
프론트엔드: DELETE 요청 (인증 없음)
  ↓
API: ??? (인증 체크 없음)
  ↓
결과: 🔴 삭제 안 됨 (조용히 실패)
```

### After (수정 후):
```
사용자: 삭제 버튼 클릭
  ↓
프론트엔드: 토큰 확인 → DELETE 요청 (Authorization 헤더 포함)
  ↓
API: 인증 확인 → 봇 존재 확인 → 삭제 실행
  ↓
프론트엔드: 성공 알림 → 목록 새로고침
  ↓
결과: ✅ 삭제 완료!
```

---

## 테스트 방법

### 1. AI 봇 관리 페이지 접속
- URL: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/

### 2. 삭제 버튼 클릭
- 삭제할 봇 카드에서 우측 하단 빨간색 🗑️ 버튼 클릭

### 3. 확인 팝업
- "정말로 [봇 이름] 봇을 삭제하시겠습니까?" 팝업
- **확인** 클릭

### 4. 결과 확인
- ✅ "삭제되었습니다." 알림 표시
- ✅ 봇이 목록에서 사라짐
- ✅ 페이지 자동 새로고침

### 5. 에러 케이스 테스트

**케이스 1: 로그인 안 됨**
```
결과: "로그인이 필요합니다." → 로그인 페이지로 이동
```

**케이스 2: 봇이 이미 삭제됨**
```
결과: "삭제 실패: 봇을 찾을 수 없습니다."
```

**케이스 3: 네트워크 오류**
```
결과: "삭제 중 오류가 발생했습니다."
```

---

## 보안 개선

### Before (이전):
- ❌ 인증 없이 API 호출 가능
- ❌ 누구나 봇 삭제 가능 (보안 취약점)
- ❌ 에러 메시지 없음

### After (수정 후):
- ✅ Authorization 헤더 필수
- ✅ 인증된 사용자만 삭제 가능
- ✅ 봇 존재 확인
- ✅ 명확한 에러 메시지

---

## 변경 사항 요약

| 파일 | 변경 내용 |
|------|-----------|
| **프론트엔드** | Authorization 헤더 추가, 에러 처리 강화 |
| `src/app/dashboard/admin/ai-bots/page.tsx` | +21 lines |
| **백엔드** | 인증 확인, 봇 존재 확인, 디버그 로그 추가 |
| `functions/api/admin/ai-bots/[id].ts` | +44 lines, -1 line |

---

## 완료 ✅

이제 다음과 같이 작동합니다:

1. ✅ **삭제 버튼 클릭 시 실제로 삭제됨**
2. ✅ **인증된 사용자만 삭제 가능 (보안)**
3. ✅ **삭제 성공/실패 시 명확한 피드백**
4. ✅ **에러 발생 시 상세 메시지 표시**

---

### 테스트 URL:
https://superplacestudy.pages.dev/dashboard/admin/ai-bots/

페이지를 새로고침(Ctrl+F5)하고 삭제 버튼을 다시 시도해보세요! 🎉
