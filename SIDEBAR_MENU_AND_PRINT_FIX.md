# 학생/선생님 메뉴 제거 및 문제지 출력 오류 수정

## 배포 정보
- **커밋**: `56927425`
- **배포 시간**: 2026-03-14 18:32 KST
- **URL**: https://superplacestudy.pages.dev

## 수정 사항

### 1. 학생과 선생님 사이드바에서 '무료 세미나 보기' 메뉴 제거 ✅

**변경 내용:**
- `src/components/layouts/ModernLayout.tsx` 수정
- **STUDENT** 계정: 세미나 메뉴 제거
- **TEACHER** 계정: 세미나 메뉴 제거
- **DIRECTOR** 계정: 세미나 메뉴 유지 (그대로)

**이전 메뉴 (학생):**
```
- 대시보드
- 무료 세미나 보기  ← 제거됨
- 출석하기
- 숙제 제출
...
```

**현재 메뉴 (학생):**
```
- 대시보드
- 출석하기
- 숙제 제출
...
```

**이전 메뉴 (선생님):**
```
- 대시보드
- 무료 세미나 보기  ← 제거됨
- 내 학생들
- 수업
...
```

**현재 메뉴 (선생님):**
```
- 대시보드
- 내 학생들
- 수업
...
```

**원장 메뉴는 변경 없음** (세미나 메뉴 유지)

---

### 2. AI 챗봇 문제지 출력 오류 해결 ✅

**문제:**
- AI 응답을 선택 후 "문제지 출력" 클릭 시
- "출력할 문제를 찾을 수 없습니다" 오류 발생
- 특정 키워드가 없는 문제는 인식되지 않음

**원인:**
- 문제 유효성 검사 로직이 너무 엄격했음
- 다음 키워드 중 하나가 반드시 필요했음:
  - `계산|구하|풀이|답하|선택|고르|쓰시오|바꾸|번역|해석|영작|맞는|틀린|일치|다음|알맞|적절`
  - `solve|calculate|find|choose|what|which|translate|write|correct`
  - 특수기호: `=?①②③④⑤`
- 이 조건을 만족하지 않는 문제는 무시됨

**수정 내용:**
- `src/app/ai-chat/page.tsx` 파일 수정
- 유효성 검사 조건을 완화:
  - **이전**: 길이 체크 + 키워드 필수
  - **현재**: 길이 체크만 (5자 이상, 2000자 이하)
  
```typescript
// 이전 (너무 엄격)
const isValidProblem = 
  problemText.length >= 5 &&
  problemText.length <= 2000 &&
  (/계산|구하|풀이|...|적절/i.test(problemText) ||
   /[=?①②③④⑤]/.test(problemText));

// 수정 후 (완화)
const isValidProblem = 
  problemText.length >= 5 &&
  problemText.length <= 2000;
```

**결과:**
- ✅ 키워드가 없는 문제도 추출 가능
- ✅ 다양한 형식의 문제 인식 가능
- ✅ "문제를 찾을 수 없습니다" 오류 대폭 감소

---

## 테스트 방법

### 1. 사이드바 메뉴 확인
1. **학생 계정**으로 로그인
2. 사이드바에 "무료 세미나 보기" 없음을 확인
3. **선생님 계정**으로 로그인
4. 사이드바에 "무료 세미나 보기" 없음을 확인
5. **원장 계정**으로 로그인
6. 사이드바에 "무료 세미나 보기" **있음**을 확인

### 2. 문제지 출력 테스트
1. https://superplacestudy.pages.dev/ai-chat/ 접속
2. AI에게 문제 출제 요청 (예: "수학 문제 3개 출제해줘")
3. AI 응답이 오면 체크박스 선택
4. "문제지 출력" 버튼 클릭
5. ✅ 문제가 정상적으로 출력됨

**다양한 문제 형식 테스트:**
```
예시 1: "다음 수식을 계산하세요: 2 + 3 = ?"
예시 2: "서울의 수도는?"  (키워드 없음)
예시 3: "What is the capital of Korea?"
예시 4: "x = 5일 때, 2x의 값"
```

모든 형식이 정상적으로 추출되어야 함.

---

## 주의사항

⚠️ **다른 데이터는 수정하지 않음**
- 세미나 데이터베이스 변경 없음
- AI 챗봇 응답 로직 변경 없음
- 사용자 권한 체계 변경 없음
- 기존 문제 추출 로직의 다른 부분 변경 없음

✅ **변경된 것:**
1. 학생/선생님 사이드바 메뉴 (1줄 제거)
2. AI 챗 문제 유효성 검사 로직 (조건 완화)

---

## 코드 변경 요약

### src/components/layouts/ModernLayout.tsx
```diff
  case 'TEACHER':
    return [
      { id: 'home', href: '/dashboard', icon: Home, text: '대시보드' },
-     { id: 'seminars', href: '/dashboard/seminars', icon: Presentation, text: '무료 세미나 보기' },
      { id: 'students', href: '/dashboard/students', icon: Users, text: '내 학생들' },
      ...
    ];

  case 'STUDENT':
    return [
      { id: 'home', href: '/dashboard', icon: Home, text: '대시보드' },
-     { id: 'seminars', href: '/dashboard/seminars', icon: Presentation, text: '무료 세미나 보기' },
      { id: 'attendance-verify', href: '/attendance-verify', icon: Clock, text: '출석하기' },
      ...
    ];
```

### src/app/ai-chat/page.tsx
```diff
- // Step 4: 유효성 검사
  const isValidProblem = 
    problemText.length >= 5 &&
-   problemText.length <= 2000 &&
-   (/계산|구하|풀이|...|적절/i.test(problemText) ||
-    /[=?①②③④⑤]/.test(problemText));
+   problemText.length <= 2000;
```

---

## 완료 ✅

페이지를 새로고침(Ctrl+Shift+R)하여 변경 사항을 확인하세요!
