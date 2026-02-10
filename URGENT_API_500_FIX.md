# 🚨 긴급: 숙제 제출 API 500 에러 해결 가이드

## 📋 문제 현상
- **오류**: 숙제 제출 시 "오류가 발생했습니다" 메시지 표시
- **콘솔**: `Unexpected token '<'` JSON 파싱 에러
- **API**: `/api/homework/grade` 엔드포인트가 JSON 대신 HTML(500 에러 페이지) 반환
- **원인**: Cloudflare Workers 런타임 오류 (환경 변수 미설정 또는 코드 에러)

---

## 🔍 진단 1단계: 디버그 엔드포인트 확인

### 1. 디버그 API 호출
```bash
# 브라우저에서 다음 URL 접속:
https://genspark-ai-developer.superplacestudy.pages.dev/api/homework/debug
```

### 2. 예상 결과
```json
{
  "timestamp": "2024-01-15T12:00:00.000Z",
  "environment": {
    "hasDatabase": true,
    "hasGeminiApiKey": true,
    "geminiKeyLength": 39,
    "geminiKeyPrefix": "AIzaSyBqR..."
  },
  "tests": {
    "database": {
      "success": true,
      "error": ""
    },
    "geminiApi": {
      "success": true,
      "error": "",
      "statusCode": 200
    }
  },
  "recommendations": [
    "✅ 모든 시스템이 정상입니다!"
  ]
}
```

### 3. 문제 시나리오

#### ❌ 시나리오 A: GOOGLE_GEMINI_API_KEY 미설정
```json
{
  "environment": {
    "hasGeminiApiKey": false,
    "geminiKeyLength": 0,
    "geminiKeyPrefix": "NOT_SET"
  },
  "recommendations": [
    "❌ GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. Cloudflare 환경 변수를 확인하세요."
  ]
}
```

**해결 방법**: Cloudflare 환경 변수 설정 (진단 2단계 참조)

#### ❌ 시나리오 B: Gemini API 키 무효
```json
{
  "environment": {
    "hasGeminiApiKey": true,
    "geminiKeyLength": 39
  },
  "tests": {
    "geminiApi": {
      "success": false,
      "error": "HTTP 400: API key not valid",
      "statusCode": 400
    }
  }
}
```

**해결 방법**: Google AI Studio에서 새로운 API 키 생성 (진단 3단계 참조)

#### ❌ 시나리오 C: DB 바인딩 문제
```json
{
  "environment": {
    "hasDatabase": false
  },
  "recommendations": [
    "❌ DB가 바인딩되지 않았습니다. Cloudflare D1 데이터베이스 바인딩을 확인하세요."
  ]
}
```

**해결 방법**: Cloudflare D1 바인딩 설정 확인

---

## 🔧 진단 2단계: Cloudflare 환경 변수 설정

### 1. Cloudflare Dashboard 접속
```
https://dash.cloudflare.com
→ Workers & Pages
→ superplace (프로젝트)
→ Settings 탭
→ Environment variables
```

### 2. 환경 변수 확인 체크리스트
- [ ] **GOOGLE_GEMINI_API_KEY** 존재 여부
- [ ] 값이 비어있지 않음 (길이 39자 정도)
- [ ] Production 환경과 Preview 환경 모두 설정
- [ ] 값이 `AIzaSy...`로 시작

### 3. 환경 변수 설정 방법

#### 옵션 A: Cloudflare Dashboard에서 설정
1. **Add variable** 버튼 클릭
2. **Variable name**: `GOOGLE_GEMINI_API_KEY`
3. **Value**: `AIzaSy...` (Google AI Studio에서 생성한 키)
4. **Environment**: `Production` 선택
5. **Save** 클릭
6. **Repeat for Preview environment**

#### 옵션 B: Wrangler CLI로 설정
```bash
cd /home/user/webapp

# Production 환경
npx wrangler pages secret put GOOGLE_GEMINI_API_KEY
# 프롬프트에 API 키 입력

# Preview 환경
npx wrangler pages secret put GOOGLE_GEMINI_API_KEY --env preview
# 프롬프트에 API 키 입력
```

### 4. 설정 후 재배포 필요 여부
- **환경 변수 추가/수정**: 재배포 불필요 (즉시 반영)
- **코드 수정**: 재배포 필요
- **확인**: 디버그 엔드포인트 다시 호출

---

## 🔑 진단 3단계: Gemini API 키 생성

### 1. Google AI Studio 접속
```
https://aistudio.google.com/app/apikey
```

### 2. API 키 생성
1. **Get API Key** 또는 **Create API Key** 클릭
2. 프로젝트 선택 (또는 새로 생성)
3. **Create API key in existing project** 선택
4. 생성된 키 복사 (형식: `AIzaSy...`)

### 3. API 키 테스트
```bash
# 로컬에서 테스트
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# 예상 결과: HTTP 200 + JSON 응답
```

### 4. Cloudflare에 설정
- 진단 2단계 참조

---

## 🧪 진단 4단계: 로컬 테스트

### 1. 로컬 환경 설정
```bash
cd /home/user/webapp

# .dev.vars 파일 생성 (로컬 테스트용)
cat > .dev.vars << 'EOF'
GOOGLE_GEMINI_API_KEY=YOUR_API_KEY_HERE
EOF
```

### 2. 로컬 개발 서버 실행
```bash
npm run dev
# 또는
npx wrangler pages dev --local
```

### 3. 로컬에서 API 테스트
```bash
# 터미널에서
curl -X POST http://localhost:8788/api/homework/grade \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "code": "123456",
    "images": ["data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
  }'

# 예상 결과: HTTP 200 + JSON (성공)
```

---

## 📊 진단 5단계: Cloudflare Logs 확인

### 1. Cloudflare Dashboard에서 로그 확인
```
https://dash.cloudflare.com
→ Workers & Pages
→ superplace
→ Logs 탭 (또는 Real-time Logs)
```

### 2. 찾아야 할 로그
- `❌ GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다`
- `❌ Gemini AI 채점 오류`
- `Failed to grade homework`
- Stack trace 확인

### 3. Wrangler로 로그 확인
```bash
cd /home/user/webapp
npx wrangler pages deployment tail
```

---

## ✅ 해결 체크리스트

### 단계별 확인
- [ ] **1. 디버그 엔드포인트**: `/api/homework/debug` 호출 → 모든 테스트 통과
- [ ] **2. 환경 변수**: Cloudflare에 `GOOGLE_GEMINI_API_KEY` 설정 완료
- [ ] **3. API 키**: Google AI Studio에서 유효한 키 생성 및 테스트 완료
- [ ] **4. DB 바인딩**: Cloudflare D1 데이터베이스 바인딩 확인
- [ ] **5. 재배포**: 최신 코드 배포 완료 (커밋: `4d2c765` 이상)
- [ ] **6. 브라우저 캐시**: 하드 리프레시 (Ctrl+Shift+R 또는 Cmd+Shift+R)
- [ ] **7. 전체 테스트**: 출석 인증 → 숙제 제출 → 채점 완료 확인

---

## 🚀 최종 테스트 절차

### 1. 환경 준비
```bash
# 최신 코드 확인
cd /home/user/webapp
git status
git log --oneline -5

# 예상: 커밋 4d2c765 이상
```

### 2. 디버그 확인
```
https://genspark-ai-developer.superplacestudy.pages.dev/api/homework/debug
→ "✅ 모든 시스템이 정상입니다!" 확인
```

### 3. 전체 플로우 테스트
```
1. 출석 인증 페이지: https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify/
2. 6자리 코드 입력 (예: 123456)
3. 출석 인증 완료
4. 숙제 사진 3장 촬영
5. "숙제 제출" 버튼 클릭
6. "AI 채점 중..." 메시지 확인 (약 30초)
7. "채점 완료!" 메시지 및 점수 확인
8. F12 콘솔에서 오류 없는지 확인
```

### 4. 결과 확인
```
https://genspark-ai-developer.superplacestudy.pages.dev/dashboard/homework/results/
→ 제출한 숙제 표시
→ 상세 보기 클릭
→ 이미지 3장, 점수, 피드백 모두 표시 확인
```

---

## 🔧 문제가 지속되는 경우

### 추가 진단 정보 수집
1. **디버그 엔드포인트 결과** 스크린샷
2. **F12 콘솔 전체 로그** (숙제 제출 시)
3. **Cloudflare Logs** 스크린샷
4. **환경 변수 설정** 스크린샷 (값은 가림)

### 긴급 해결 방법
```bash
# Cloudflare에서 직접 확인
cd /home/user/webapp
npx wrangler pages deployment list

# 최신 배포 확인
npx wrangler pages deployment tail

# 환경 변수 확인
npx wrangler pages secret list
```

---

## 📝 관련 파일
- **API 코드**: `functions/api/homework/grade.ts`
- **디버그 엔드포인트**: `functions/api/homework/debug.ts`
- **프론트엔드**: `src/app/attendance-verify/page.tsx`
- **GitHub PR**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7

---

## 🎯 예상 결과

### 성공 시나리오
```
1. 디버그 엔드포인트: ✅ 모든 시스템 정상
2. 숙제 제출: "AI 채점 중..." → 30초 대기
3. 채점 완료: "채점 완료!" + 점수 90.0
4. 콘솔: 오류 없음, API 응답 200
5. 결과 페이지: 이미지 3장, 점수, 피드백 모두 표시
```

### 실패 시나리오
```
1. 디버그 엔드포인트: ❌ 환경 변수 미설정
2. 해결: Cloudflare에 GOOGLE_GEMINI_API_KEY 설정
3. 재테스트: 디버그 엔드포인트 다시 확인
4. 성공 확인
```

---

## 📞 지원

문제가 해결되지 않으면:
1. 디버그 엔드포인트 결과 공유
2. F12 콘솔 로그 공유
3. Cloudflare Logs 공유
4. 추가 진단 진행

**최신 커밋**: `4d2c765`  
**PR 링크**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7  
**테스트 URL**: https://genspark-ai-developer.superplacestudy.pages.dev/
