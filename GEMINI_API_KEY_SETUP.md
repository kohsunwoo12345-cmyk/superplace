# 🔑 Gemini API Key 설정 가이드

## ❌ 현재 문제

```json
{
  "error": "Configuration error",
  "environment": {
    "hasGeminiApiKey": false,
    "geminiKeyLength": 0
  }
}
```

**원인:** GOOGLE_GEMINI_API_KEY가 Cloudflare Pages 환경 변수에 설정되지 않음

---

## ✅ 해결 방법

### 1단계: Google AI Studio에서 API Key 발급

1. **Google AI Studio 접속**
   - URL: https://aistudio.google.com/app/apikey

2. **API Key 생성**
   - "Create API Key" 클릭
   - 프로젝트 선택 또는 새로 생성
   - API Key 복사 (예: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

3. **보안**
   - ⚠️ 이 키는 절대 공개하지 마세요
   - GitHub에 커밋하지 마세요
   - 환경 변수로만 관리하세요

---

### 2단계: Cloudflare Pages에 환경 변수 설정

#### A. Cloudflare Dashboard 접속

1. https://dash.cloudflare.com 접속
2. 로그인
3. **Workers & Pages** 메뉴 클릭
4. **superplace** 프로젝트 선택

#### B. 환경 변수 추가

1. **Settings** 탭 클릭
2. **Environment variables** 섹션 찾기
3. **Add variable** 버튼 클릭

4. **Production 환경에 추가:**
   ```
   Variable name: GOOGLE_GEMINI_API_KEY
   Value: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (실제 키 입력)
   Environment: Production (체크)
   ```

5. **Preview 환경에도 추가 (선택사항):**
   ```
   Variable name: GOOGLE_GEMINI_API_KEY
   Value: (동일한 키 또는 테스트용 키)
   Environment: Preview (체크)
   ```

6. **Save** 버튼 클릭

#### C. 재배포 (필수!)

환경 변수를 추가한 후에는 **반드시 재배포**가 필요합니다:

**방법 1: Cloudflare Dashboard에서**
```
1. Deployments 탭으로 이동
2. 최신 배포 선택
3. "..." 메뉴 → "Retry deployment" 클릭
```

**방법 2: Git Push로 트리거**
```bash
# 빈 커밋으로 재배포 트리거
cd /home/user/webapp
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push origin main
```

---

### 3단계: 환경 변수 확인

배포 완료 후 (5-7분):

```bash
node check_env.js
```

**예상 결과:**
```json
{
  "environment": {
    "hasDatabase": true,
    "hasGeminiApiKey": true,
    "geminiKeyLength": 39,
    "geminiKeyPrefix": "AIzaSy"
  },
  "tests": {
    "geminiApi": {
      "success": true
    }
  }
}
```

---

### 4단계: AI 채점 테스트

환경 변수 확인 후:

```bash
# 채점 대기 중인 숙제 확인
node check_submissions_v2.js

# 채점 실행
node test_grading.js homework-1770721533929-jvhu9b8rh
```

**예상 결과:**
```json
{
  "success": true,
  "message": "채점이 완료되었습니다",
  "grading": {
    "id": "grading-xxx",
    "score": 85.0,
    "subject": "수학"
  }
}
```

---

## 🔍 트러블슈팅

### 문제 1: 여전히 "Configuration error"

**원인:**
- 환경 변수가 제대로 저장되지 않음
- 재배포하지 않음

**해결:**
1. Cloudflare Pages → Settings → Environment variables 확인
2. GOOGLE_GEMINI_API_KEY가 Production 환경에 있는지 확인
3. 재배포 (Retry deployment 또는 빈 커밋)
4. 5-7분 대기

### 문제 2: "Invalid API Key"

**원인:**
- 잘못된 API Key
- API Key가 만료됨
- 권한 문제

**해결:**
1. Google AI Studio에서 새 API Key 생성
2. Cloudflare Pages 환경 변수 업데이트
3. 재배포

### 문제 3: "Quota exceeded"

**원인:**
- API 사용량 초과
- 무료 한도 소진

**해결:**
1. Google Cloud Console에서 Quota 확인
2. 필요시 유료 플랜으로 업그레이드
3. 또는 다음 날까지 대기 (무료 한도 리셋)

---

## 📊 Gemini API 요금 정보

### Gemini 2.5 Flash (사용 중)

**무료 한도:**
- 1,500 requests per day (RPD)
- 1 million tokens per day
- 15 RPM (Requests Per Minute)

**유료 플랜:**
- $0.075 per 1M input tokens
- $0.30 per 1M output tokens

**숙제 채점 예상 비용:**
- 이미지 2장 + 프롬프트: ~1,500 tokens
- 응답 (JSON): ~500 tokens
- 1회 채점: ~$0.0002 (약 0.3원)
- 1,000회 채점: ~$0.20 (약 300원)

**참고:** 무료 한도 내에서 충분히 사용 가능!

---

## 🎯 체크리스트

설정 완료 확인:

- [ ] Google AI Studio에서 API Key 발급
- [ ] Cloudflare Pages Environment variables에 추가
  - [ ] Variable name: GOOGLE_GEMINI_API_KEY
  - [ ] Value: (실제 API Key)
  - [ ] Environment: Production (체크)
- [ ] 재배포 완료
- [ ] `node check_env.js`로 확인
  - [ ] hasGeminiApiKey: true
  - [ ] geminiKeyLength: 39
- [ ] `node test_grading.js`로 채점 테스트
  - [ ] success: true
  - [ ] score: (점수 표시됨)

---

## 🔗 참고 링크

- **Google AI Studio:** https://aistudio.google.com/app/apikey
- **Gemini API Docs:** https://ai.google.dev/docs
- **Cloudflare Pages Env Vars:** https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables
- **Cloudflare Dashboard:** https://dash.cloudflare.com

---

## 💡 추가 팁

### 환경 변수 네이밍

현재 코드는 다음 환경 변수를 사용합니다:
- `GOOGLE_GEMINI_API_KEY` (채점 API용)
- `DB` (D1 Database, 자동 바인딩)

### 보안 베스트 프랙티스

1. **API Key 관리**
   - 절대 코드에 하드코딩하지 않기
   - 환경 변수로만 관리
   - `.env` 파일도 `.gitignore`에 추가

2. **권한 제한**
   - Google Cloud Console에서 API Key 제한 설정
   - Restrict key → HTTP referrers 또는 IP addresses
   - 필요한 API만 활성화 (Generative Language API)

3. **모니터링**
   - Google Cloud Console에서 사용량 모니터링
   - 비정상적인 사용 패턴 감지
   - Quota 알림 설정

---

**마지막 업데이트:** 2026-02-10  
**상태:** ❌ 환경 변수 미설정  
**다음 단계:** Cloudflare Pages에 GOOGLE_GEMINI_API_KEY 추가 후 재배포
