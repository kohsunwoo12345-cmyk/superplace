# AI 챗봇 문제지 출력 체크박스 필수 선택 수정

## 배포 정보
- **커밋**: `ee1ac570`
- **배포 시간**: 2026-03-14 18:43 KST
- **URL**: https://superplacestudy.pages.dev/ai-chat/

## 문제 상황

### 이전 버그:
1. ❌ **체크박스를 선택하지 않으면 모든 메시지가 출력됨**
2. ❌ **선택하지 않은 메시지가 출력됨**
3. ❌ **유효성 검사가 너무 완화되어 불필요한 텍스트도 문제로 인식됨**

### 사용자 경험:
- AI 응답 옆의 체크박스를 클릭했는데 선택한 것만 출력되지 않음
- 체크박스를 선택하지 않아도 모든 내용이 출력됨
- "문제를 찾을 수 없습니다" 또는 불필요한 텍스트가 문제로 출력됨

## 해결 방법

### 1. **체크박스 선택 필수화** ✅

**이전 로직:**
```typescript
// 체크박스를 선택하지 않으면 모든 assistant 메시지 출력
const assistantMessages = selectedMessageIds.size > 0 
  ? messages.filter(m => m.role === 'assistant' && selectedMessageIds.has(m.id))
  : messages.filter(m => m.role === 'assistant');  // ← 문제!
```

**수정 후:**
```typescript
// 체크박스 선택이 필수
if (selectedMessageIds.size === 0) {
  alert('출력할 메시지를 선택해주세요. 각 AI 응답 옆의 체크박스를 클릭하여 선택할 수 있습니다.');
  return;
}

// 선택된 메시지만 정확히 필터링
const assistantMessages = messages.filter(m => m.role === 'assistant' && selectedMessageIds.has(m.id));
```

**결과:**
- ✅ 체크박스를 선택하지 않으면 출력 불가
- ✅ 선택한 메시지만 정확히 출력됨

---

### 2. **문제 유효성 검사 개선** ✅

**이전 로직 (너무 완화):**
```typescript
// 길이만 체크 → 불필요한 텍스트도 문제로 인식
const isValidProblem = 
  problemText.length >= 5 &&
  problemText.length <= 2000;
```

**수정 후 (균형잡힌 검사):**
```typescript
// 길이 + 키워드 또는 특수문자 체크
const hasValidLength = problemText.length >= 10 && problemText.length <= 2000;
const hasKeywords = /계산|구하|풀이|답하|선택|고르|쓰시오|바꾸|번역|해석|영작|맞는|틀린|일치|다음|알맞|적절|문제|solve|calculate|find|choose|what|which|translate|write|correct/i.test(problemText);
const hasSpecialChars = /[=?①②③④⑤⑥⑦⑧⑨⑩]/.test(problemText);

const isValidProblem = hasValidLength && (hasKeywords || hasSpecialChars);
```

**개선 사항:**
- ✅ 최소 길이: 5자 → 10자 (더 정확한 필터링)
- ✅ 키워드 또는 특수문자 필수 (불필요한 텍스트 제외)
- ✅ '문제' 키워드 추가 (한국어 문제 인식 개선)
- ✅ 객관식 기호(①②③④⑤) 인식

---

## 사용 방법

### 정상 작동 시나리오:

1. **AI 챗 페이지 접속**
   - https://superplacestudy.pages.dev/ai-chat/

2. **문제 요청**
   - 예: "수학 문제 3개 출제해줘"
   - 예: "중학교 수학 문제를 만들어줘"

3. **AI 응답 확인**
   - AI가 문제를 생성함

4. **체크박스 선택** ⭐ (필수)
   - AI 응답 옆의 동그란 체크박스 클릭
   - 선택된 메시지는 파란색 배경으로 표시됨
   - 여러 개 선택 가능

5. **문제지 출력 버튼 클릭**
   - 하단 "문제지 출력" 버튼 클릭
   - ✅ 선택한 메시지에서만 문제 추출됨

### 오류 메시지:

**체크박스를 선택하지 않은 경우:**
```
❌ 출력할 메시지를 선택해주세요. 
각 AI 응답 옆의 체크박스를 클릭하여 선택할 수 있습니다.
```

**문제를 찾을 수 없는 경우:**
```
❌ 출력할 문제를 찾을 수 없습니다.

AI에게 "수학 문제 3개 출제해줘" 같은 요청을 먼저 해보세요.
```

---

## 테스트 시나리오

### ✅ 정상 케이스:

**테스트 1: 단일 메시지 선택**
1. AI에게 "수학 문제 5개 출제해줘" 요청
2. 응답 메시지 체크박스 1개 선택
3. "문제지 출력" 클릭
4. ✅ 해당 메시지의 문제만 출력됨

**테스트 2: 여러 메시지 선택**
1. AI에게 여러 번 문제 요청
2. 여러 응답 메시지 체크박스 선택
3. "문제지 출력" 클릭
4. ✅ 선택한 모든 메시지의 문제가 출력됨

**테스트 3: 다양한 문제 형식**
- "다음 수식을 계산하세요: 2 + 3 = ?" ✅
- "x의 값을 구하세요. 2x + 5 = 15" ✅
- "다음 중 맞는 것을 고르시오. ①②③④⑤" ✅
- "다음 문제를 풀이하시오." ✅
- "Solve the equation: x + 5 = 10" ✅

### ❌ 오류 케이스:

**케이스 1: 체크박스 미선택**
1. AI 응답 있음
2. 체크박스 선택 안 함
3. "문제지 출력" 클릭
4. ❌ 오류 메시지: "출력할 메시지를 선택해주세요"

**케이스 2: 문제가 아닌 응답**
1. AI에게 "안녕하세요" 요청
2. AI 응답: "안녕하세요! 무엇을 도와드릴까요?"
3. 체크박스 선택 후 "문제지 출력" 클릭
4. ❌ 오류 메시지: "출력할 문제를 찾을 수 없습니다"

---

## 코드 변경 사항

### src/app/ai-chat/page.tsx

```diff
  const handlePrintProblems = async () => {
    console.log('🖨️ 문제지 출력 시작...');
    console.log('📝 전체 메시지 개수:', messages.length);
+   console.log('📋 선택된 메시지 ID:', Array.from(selectedMessageIds));

-   // 체크된 메시지만 필터링
-   const assistantMessages = selectedMessageIds.size > 0 
-     ? messages.filter(m => m.role === 'assistant' && selectedMessageIds.has(m.id))
-     : messages.filter(m => m.role === 'assistant');
+   // 체크된 메시지만 필터링 (체크박스 선택이 필수)
+   if (selectedMessageIds.size === 0) {
+     alert('출력할 메시지를 선택해주세요. 각 AI 응답 옆의 체크박스를 클릭하여 선택할 수 있습니다.');
+     return;
+   }
+
+   const assistantMessages = messages.filter(m => m.role === 'assistant' && selectedMessageIds.has(m.id));

    ...

-   // Step 4: 유효성 검사 (완화된 조건)
-   const isValidProblem = 
-     problemText.length >= 5 &&
-     problemText.length <= 2000;
+   // Step 4: 유효성 검사 (길이 + 기본 키워드 체크)
+   const hasValidLength = problemText.length >= 10 && problemText.length <= 2000;
+   const hasKeywords = /계산|구하|풀이|답하|선택|고르|쓰시오|바꾸|번역|해석|영작|맞는|틀린|일치|다음|알맞|적절|문제|solve|calculate|find|choose|what|which|translate|write|correct/i.test(problemText);
+   const hasSpecialChars = /[=?①②③④⑤⑥⑦⑧⑨⑩]/.test(problemText);
+   
+   const isValidProblem = hasValidLength && (hasKeywords || hasSpecialChars);
  };
```

---

## 주요 변경점 요약

| 항목 | 이전 | 수정 후 |
|------|------|---------|
| **체크박스 선택** | 선택 안 해도 전체 출력 | 선택 필수 (미선택 시 오류) |
| **메시지 필터링** | 선택 여부에 따라 분기 | 선택된 것만 정확히 필터링 |
| **최소 문제 길이** | 5자 | 10자 |
| **유효성 검사** | 길이만 체크 | 길이 + (키워드 OR 특수문자) |
| **키워드 포함** | 없음 | '문제' 추가 |

---

## 완료 ✅

이제 다음과 같이 작동합니다:

1. ✅ **체크박스를 선택한 메시지만 출력됨**
2. ✅ **체크박스를 선택하지 않으면 오류 메시지 표시**
3. ✅ **문제가 아닌 텍스트는 필터링됨**
4. ✅ **다양한 형식의 문제 인식 가능**

페이지를 새로고침(Ctrl+F5)하여 변경 사항을 확인하세요!
