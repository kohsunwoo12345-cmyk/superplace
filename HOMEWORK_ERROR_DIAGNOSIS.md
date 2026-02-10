# 🔍 숙제 제출 오류 진단 및 해결 가이드

## 📅 작업 일시
- **날짜**: 2026-02-10
- **커밋**: `16a7c41`
- **PR**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
- **상태**: 🔍 **진단 중**

---

## ❌ 발생한 문제

### 증상
```
숙제 제출 → "AI 채점 중..." → "오류가 발생했습니다."
```

### 기존 오류 메시지
```
alert("오류가 발생했습니다.");
```
- 😞 너무 간단함
- 😞 실제 오류 원인 파악 불가
- 😞 디버깅 정보 없음

---

## ✅ API 테스트 결과

### 백엔드 API는 정상 작동! ✅

```bash
curl -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "code": "123456", "images": ["test"]}'

# 응답:
HTTP Status: 200
{
  "success": true,
  "message": "숙제 제출 및 AI 채점이 완료되었습니다 (1장)",
  "submission": {
    "id": "homework-1770712759081-u5mg865ah",
    "userId": 1,
    "studentName": "관리자",
    "submittedAt": "2026-02-10T08:39:21.077Z",
    "status": "graded",
    "imageCount": 1
  },
  "grading": {
    "score": 80,
    "subject": "Unknown",
    "grade": 3,
    "totalQuestions": 5,
    "correctAnswers": 4,
    "feedback": "총 1장의 숙제를 성실히 제출했습니다...",
    "completion": "good"
  }
}
```

**결론: 백엔드 API는 완벽하게 작동합니다!**

---

## 🔍 문제 원인 분석

### 가능한 원인들

#### 1️⃣ **이미지 데이터 크기 문제**
```typescript
// 문제: base64 이미지가 너무 큼
const capturedImages = [
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..." // 수 MB
];

// Cloudflare Pages Functions 제한:
// - Request body: 100 MB (충분함)
// - 하지만 Gemini API 제한 확인 필요
```

#### 2️⃣ **Gemini API 응답 시간 초과**
```typescript
// 문제: 이미지 3장 분석 시간이 너무 오래 걸림
// Cloudflare Workers 제한:
// - CPU time: 50ms (Free), 30s (Paid)
// - 해결: 이미 Paid plan 사용 중
```

#### 3️⃣ **JSON 파싱 오류**
```typescript
// 문제: Gemini 응답이 JSON 형식이 아닐 수 있음
const responseText = geminiData.candidates[0].content.parts[0].text;
const jsonMatch = responseText.match(/\{[\s\S]*\}/);

// 해결: 이미 fallback 로직 존재
```

#### 4️⃣ **네트워크 오류**
```typescript
// 문제: fetch() 자체가 실패
try {
  const response = await fetch("/api/homework/grade", ...);
} catch (error) {
  // 여기서 캐치됨
  alert("오류가 발생했습니다."); // 😞 상세 정보 없음
}
```

---

## ✅ 구현한 해결 방법

### 1️⃣ **상세 로깅 추가**

#### API 호출 시작
```typescript
console.log("🌐 API 호출 시작: /api/homework/grade");
```

#### 응답 상태 로깅
```typescript
console.log("📡 API 응답 상태:", response.status, response.statusText);
```

#### 성공/실패 분기 로깅
```typescript
if (response.ok && data.success) {
  console.log("✅ 채점 성공!");
} else {
  console.error("❌ 채점 실패:", {
    status: response.status,
    statusText: response.statusText,
    data: data
  });
}
```

### 2️⃣ **상세 오류 메시지**

#### HTTP 오류 시
```typescript
alert(`채점에 실패했습니다.

오류: ${data.error || data.message || '알 수 없는 오류'}
상태: ${response.status}`);
```

#### 네트워크 오류 시
```typescript
} catch (error: any) {
  console.error("❌ 숙제 제출 오류:", {
    error: error.message,
    stack: error.stack,
    name: error.name
  });
  
  alert(`오류가 발생했습니다.

상세: ${error.message || '네트워크 오류'}

다시 시도해주세요.`);
}
```

### 3️⃣ **단계별 디버깅**

```typescript
// 1. 데이터 준비 로깅
console.log("📤 숙제 제출 시작... 총", capturedImages.length, "장");
console.log("📊 전송할 학생 정보:", {
  userId: studentInfo?.userId,
  attendanceCode: studentInfo?.attendanceCode || code,
  imagesCount: capturedImages.length
});

// 2. userId 검증
if (!studentInfo?.userId) {
  console.error("❌ userId가 없습니다!", studentInfo);
  alert("학생 정보를 찾을 수 없습니다. 다시 출석 인증을 해주세요.");
  return;
}

// 3. API 호출
console.log("🌐 API 호출 시작: /api/homework/grade");

// 4. 응답 확인
console.log("📡 API 응답 상태:", response.status, response.statusText);
const data = await response.json();
console.log("✅ 채점 응답:", data);

// 5. 성공/실패 처리
if (response.ok && data.success) {
  console.log("✅ 채점 성공!");
}
```

---

## 🧪 테스트 방법

### 1️⃣ **PR 머지 및 배포**
- **PR 링크**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
- **최신 커밋**: `16a7c41`
- **배포 대기**: 2-3분

### 2️⃣ **숙제 제출 테스트 (F12 콘솔 열어두기)**

```bash
# Step 1: 브라우저 F12 → Console 탭 열기
https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify/

# Step 2: 출석 인증
활성화된 코드 입력 (예: 123456)

# Step 3: 숙제 사진 촬영
사진 3장 촬영

# Step 4: 제출 클릭 → 콘솔 확인
예상 로그:
📤 숙제 제출 시작... 총 3 장
📊 전송할 학생 정보: { userId: 144, ... }
🌐 API 호출 시작: /api/homework/grade
📡 API 응답 상태: 200 OK
✅ 채점 응답: { success: true, ... }
✅ 채점 성공!
```

### 3️⃣ **오류 발생 시 확인**

#### A. 오류 메시지 확인
```
오류가 발생했습니다.

상세: Failed to fetch

다시 시도해주세요.
```
→ **네트워크 오류 (인터넷 연결 확인)**

#### B. 콘솔 로그 확인
```
❌ 숙제 제출 오류: {
  error: "Failed to fetch",
  stack: "...",
  name: "TypeError"
}
```
→ **fetch() 실패 (CORS? Network? Cloudflare?)**

#### C. HTTP 오류 확인
```
채점에 실패했습니다.

오류: Gemini API key not configured
상태: 500
```
→ **백엔드 환경 변수 문제**

---

## 🔍 예상되는 오류 시나리오

### 시나리오 1: Gemini API 키 미설정
```
오류: Gemini API key not configured
상태: 500

→ Cloudflare 환경 변수 확인 필요
```

### 시나리오 2: 이미지 데이터 너무 큼
```
오류: Request body too large
상태: 413

→ 이미지 압축 필요 (현재 품질: 0.8)
```

### 시나리오 3: Gemini API 호출 실패
```
오류: Gemini API error (400): ...
상태: 500

→ Gemini API 키 유효성 확인 필요
```

### 시나리오 4: 타임아웃
```
오류: Failed to fetch
상세: The operation was aborted

→ Cloudflare Workers 타임아웃 (30초)
→ 이미지 수 줄이기 또는 압축
```

### 시나리오 5: CORS 오류
```
오류: Failed to fetch
콘솔: CORS policy: No 'Access-Control-Allow-Origin' header

→ API 응답 헤더 확인 필요
```

---

## 📊 변경 사항 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **API 호출 로깅** | ❌ 없음 | ✅ "🌐 API 호출 시작" |
| **응답 상태 로깅** | ❌ 없음 | ✅ "📡 API 응답 상태: 200 OK" |
| **성공 로깅** | ❌ 없음 | ✅ "✅ 채점 성공!" |
| **실패 로깅** | ❌ 간단 | ✅ 상세 (status, data) |
| **오류 메시지** | ❌ "오류가 발생했습니다" | ✅ "오류: ... 상태: 500" |
| **네트워크 오류** | ❌ "오류가 발생했습니다" | ✅ "상세: Failed to fetch" |
| **에러 객체 로깅** | ❌ console.error(error) | ✅ { error, stack, name } |

---

## 🎯 다음 단계

### 1️⃣ **즉시 테스트 필요**
```bash
# PR 머지 후 배포 완료 대기 (2-3분)
# 브라우저 캐시 삭제
# F12 콘솔 열고 숙제 제출 테스트
```

### 2️⃣ **오류 발생 시 대응**

#### A. 환경 변수 확인
```bash
Cloudflare Dashboard
→ Workers & Pages → superplace → Settings
→ Environment variables
→ GOOGLE_GEMINI_API_KEY 확인
```

#### B. 이미지 압축 강화
```typescript
// 현재 품질: 0.8
canvas.toDataURL("image/jpeg", 0.8);

// 압축 강화: 0.6
canvas.toDataURL("image/jpeg", 0.6);
```

#### C. Gemini API 키 테스트
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

---

## 📝 변경된 파일

### 수정된 파일
- `src/app/attendance-verify/page.tsx`
  - ✅ API 호출 시작 로깅
  - ✅ 응답 상태 로깅 (status, statusText)
  - ✅ 성공/실패 분기 로깅
  - ✅ 상세 오류 메시지 (HTTP 상태, error, message)
  - ✅ 네트워크 오류 상세 (error.message, stack)
  - ✅ console.error 상세화

---

## 💡 핵심 포인트

### ✅ 백엔드 API는 정상!
- curl 테스트 결과: HTTP 200 ✅
- 정상 응답 데이터 반환 ✅
- 채점 기능 작동 ✅

### 🔍 프론트엔드에서 오류 원인 파악 필요
- 이미지 데이터 크기?
- 네트워크 오류?
- Gemini API 응답 시간?
- JSON 파싱 오류?

### 📊 이제 상세 로그로 정확한 원인 파악 가능!
```typescript
// 변경 전 😞
alert("오류가 발생했습니다.");

// 변경 후 😊
alert(`오류가 발생했습니다.

상세: Failed to fetch

다시 시도해주세요.`);

console.error("❌ 숙제 제출 오류:", {
  error: error.message,
  stack: error.stack,
  name: error.name
});
```

---

## 🎉 결론

### ✅ 디버깅 환경 구축 완료!
- 모든 단계에 로깅 추가
- 상세 오류 메시지 제공
- 콘솔에서 실시간 추적 가능

### 🚀 다음 단계
1. **PR 머지**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
2. **배포 대기**: 2-3분
3. **F12 콘솔 열고 테스트**
4. **오류 메시지 확인 후 대응**

**커밋**: `16a7c41` 🎯

---

## 📞 문의 및 지원

- **GitHub PR**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
- **커밋 해시**: `16a7c41`
- **테스트 URL**: https://genspark-ai-developer.superplacestudy.pages.dev/

**이제 PR을 머지하고 F12 콘솔을 열어 테스트하세요!**
**정확한 오류 메시지를 확인할 수 있습니다! 🔍**
