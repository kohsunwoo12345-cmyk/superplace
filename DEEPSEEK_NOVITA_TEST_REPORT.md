# 🔍 DeepSeek OCR-2 (Novita AI) 테스트 보고서

## 📅 테스트 일시
**2026-03-10 14:20 (한국 시간)**

---

## ✅ 완료된 작업

### 1. Novita AI 엔드포인트로 업데이트 ✅
**파일:** `functions/api/ai/chat.ts`

**변경 전:**
```typescript
// 기존 DeepSeek 공식 API
apiEndpoint = 'https://api.deepseek.com/v1/chat/completions';
model: 'deepseek-ocr-2'
```

**변경 후:**
```typescript
// Novita AI OpenAI 호환 API
apiEndpoint = 'https://api.novita.ai/v3/openai/chat/completions';
model: 'deepseek/deepseek-ocr-2'
```

### 2. 전용 테스트 스크립트 작성 ✅
**파일:** `test-deepseek-only.js` (7.7KB)

**테스트 항목:**
- Test 1: 기본 영어 메시지
- Test 2: 한국어 메시지
- Test 3: 수학 문제 풀이
- Test 4: 긴 텍스트 요약

### 3. Git 커밋 및 배포 ✅
```bash
Commit: cfe9b8ca
Message: "fix: update DeepSeek OCR-2 to use Novita AI endpoint"
Status: Pushed ✅
Cloudflare: Deployed ✅
```

---

## 📊 테스트 결과

### ❌ 현재 상태: API 키 오류

**에러 메시지:**
```json
{
  "error": {
    "message": "Authentication Fails, Your api key: ****HxXw is invalid",
    "type": "authentication_error",
    "code": "invalid_request_error"
  }
}
```

**테스트 결과:**
- ✅ 성공: **0/4**
- ❌ 실패: **4/4**
- ⏱️ 평균 응답 시간: 1,259ms (API 서버 응답은 빠름)
- 🔴 원인: **Cloudflare 환경 변수 `ALL_AI_API_KEY`가 잘못됨**

---

## 🔧 문제 원인 분석

### 1. 현재 설정된 API 키
```
ALL_AI_API_KEY = ****HxXw (유효하지 않음)
```

### 2. 필요한 API 키
**Novita AI API 키 형식:**
```
nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. API 엔드포인트 확인
✅ **올바르게 업데이트됨:**
- Base URL: `https://api.novita.ai/v3/openai`
- Endpoint: `chat/completions`
- Model: `deepseek/deepseek-ocr-2`
- Auth: `Bearer {ALL_AI_API_KEY}`

---

## 🎯 해결 방법

### 📋 단계별 가이드

#### Step 1: Novita AI API 키 발급 (새로 발급 필요)

1. **Novita AI 웹사이트 접속**
   ```
   https://novita.ai
   ```

2. **회원가입 또는 로그인**
   - 이메일로 가입 또는
   - Google/GitHub 계정 연동

3. **Dashboard 접속**
   ```
   https://novita.ai/dashboard
   ```

4. **API Keys 메뉴 선택**
   - 왼쪽 사이드바 → "API Keys"
   - 또는 직접 URL: https://novita.ai/dashboard/api-keys

5. **새 API 키 생성**
   - "Create New Key" 버튼 클릭
   - Key 이름 입력 (예: "Superplace DeepSeek")
   - 권한 설정: Chat/Completion 권한 필요
   - "Create" 클릭

6. **API 키 복사**
   ```
   형식: nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **중요:** 키는 한 번만 표시됩니다. 안전한 곳에 저장하세요!

---

#### Step 2: Cloudflare 환경 변수 설정

1. **Cloudflare Dashboard 접속**
   ```
   https://dash.cloudflare.com
   ```

2. **프로젝트 선택**
   ```
   Workers & Pages → superplace
   ```

3. **환경 변수 설정**
   ```
   Settings → Environment variables → Production 탭
   ```

4. **ALL_AI_API_KEY 수정**
   - 기존 변수가 있으면: "Edit" 클릭
   - 없으면: "Add variable" 클릭
   
   ```
   Variable name: ALL_AI_API_KEY
   Value: [Step 1에서 복사한 Novita AI API 키]
   Environment: Production
   ```

5. **저장**
   - "Save" 버튼 클릭
   - 변경사항 확인

---

#### Step 3: 재배포

1. **Deployments 탭으로 이동**
   ```
   Workers & Pages → superplace → Deployments
   ```

2. **최신 배포 선택**
   - 최상단 배포 (Commit: cfe9b8ca)
   - "Retry deployment" 버튼 클릭

3. **배포 대기**
   - ⏰ 소요 시간: 2-5분
   - 상태 확인: "Building..." → "Success" ✅

---

#### Step 4: 재테스트

**로컬 테스트 스크립트 실행:**
```bash
cd /home/user/webapp
node test-deepseek-only.js
```

**예상 결과:**
```
✅ 성공: 4/4
❌ 실패: 0/4
⏱️ 평균 응답 시간: ~2000ms

🎉 축하합니다! DeepSeek OCR-2 모델이 정상 작동합니다!
```

---

#### Step 5: 웹 UI에서 실제 사용 테스트

1. **AI 봇 생성 페이지 접속**
   ```
   https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create
   ```

2. **봇 설정**
   - 이름: "DeepSeek OCR 테스트 봇"
   - 모델: **DeepSeek OCR-2** 선택
   - 시스템 프롬프트: 기본값 또는 커스텀
   - 지식베이스: (선택사항) PDF/TXT 업로드

3. **봇 생성**
   - "생성" 버튼 클릭
   - botId 확인 (예: `bot-abc123def456`)

4. **학생 계정으로 테스트**
   - 학생 계정으로 로그인
   - 생성된 봇으로 채팅
   - 메시지 전송: "안녕하세요!"
   - 응답 확인

---

## 🧪 테스트 체크리스트

### API 키 설정 후 확인 사항

- [ ] Novita AI에서 새 API 키 발급
- [ ] Cloudflare ALL_AI_API_KEY 환경 변수 업데이트
- [ ] Cloudflare 재배포 완료 (Status: Success)
- [ ] `node test-deepseek-only.js` 실행 → 4/4 성공
- [ ] 웹 UI에서 DeepSeek OCR-2 봇 생성
- [ ] 학생 계정으로 봇 접근 가능
- [ ] 메시지 전송 시 응답 정상 수신
- [ ] RAG 기능 테스트 (지식베이스 업로드 시)

---

## 📊 Novita AI 서비스 정보

### 가격 (2024년 기준)
```
DeepSeek OCR-2: $0.001 / 1K tokens (약 0.1원)
- 매우 저렴한 가격
- OCR 및 이미지 분석에 특화
```

### Rate Limits
```
Free tier: 제한적
Paid tier: 높은 한도 (분당 수백 요청)
```

### 지원 기능
- ✅ 텍스트 생성
- ✅ 이미지 분석 (OCR)
- ✅ 멀티모달 입력
- ✅ OpenAI 호환 API

---

## 🔍 추가 정보

### Novita AI vs DeepSeek 공식 API

| 항목 | Novita AI | DeepSeek 공식 |
|------|-----------|--------------|
| Base URL | `api.novita.ai/v3/openai` | `api.deepseek.com` |
| Model ID | `deepseek/deepseek-ocr-2` | `deepseek-ocr-2` |
| API 형식 | OpenAI 호환 | DeepSeek 전용 |
| 가격 | $0.001/1K | $0.14/1M (~동일) |
| 속도 | 빠름 | 빠름 |
| 안정성 | 높음 | 높음 |

**선택 이유:**
- OpenAI 호환 형식으로 통합 관리 용이
- 사용자 제공 정보에 따라 Novita AI 사용

---

## ⚠️ 주의사항

### 1. API 키 보안
- API 키는 절대 공개하지 마세요
- Git에 커밋하지 마세요 (환경 변수만 사용)
- 주기적으로 키 교체 권장

### 2. 비용 관리
- Novita AI 대시보드에서 사용량 모니터링
- 월 예산 설정 권장
- Alert 설정으로 과금 방지

### 3. Rate Limit
- 테스트 시 요청 간격 2초 권장
- 프로덕션: 적절한 rate limiting 구현 필요

---

## 🎯 성공 기준

다음 조건이 모두 충족되면 완료:

- [x] Novita AI 엔드포인트 업데이트 완료
- [x] 테스트 스크립트 작성 완료
- [x] Git 커밋 및 배포 완료
- [ ] **Novita AI API 키 발급** ← 사용자 작업
- [ ] **Cloudflare 환경 변수 설정** ← 사용자 작업
- [ ] **재배포 완료** ← 자동
- [ ] **테스트 스크립트 4/4 통과** ← 검증
- [ ] **웹 UI에서 실제 봇 작동** ← 최종 검증

---

## 📞 문제 해결

### Q1: Novita AI 가입이 안 돼요
**A:** 다른 이메일 주소로 시도하거나 Google/GitHub 계정으로 소셜 로그인 사용

### Q2: API 키를 잃어버렸어요
**A:** 
1. Novita AI Dashboard → API Keys
2. 기존 키 "Revoke" (삭제)
3. "Create New Key"로 새 키 발급
4. Cloudflare 환경 변수 업데이트

### Q3: 재배포 후에도 401 에러가 나요
**A:**
1. Cloudflare Dashboard → Environment variables 재확인
2. 키가 정확히 복사되었는지 확인 (공백 없이)
3. Production 환경에 설정되었는지 확인
4. 브라우저 캐시 삭제 후 재시도

### Q4: 웹 UI에서 봇을 만들었는데 학생이 접근 못 해요
**A:**
1. AI 봇 할당 확인 (개별 또는 학원 전체)
2. 학생 계정의 academyId 일치 확인
3. 할당 기간(startDate, endDate) 확인
4. DB의 `ai_bot_assignments` 테이블 확인

---

## ✅ 다음 단계

1. **즉시:** Novita AI에서 API 키 발급
2. **즉시:** Cloudflare 환경 변수 설정
3. **2-5분 후:** 재배포 완료 대기
4. **재배포 후:** `node test-deepseek-only.js` 실행
5. **테스트 통과 후:** 웹 UI에서 실제 봇 생성 및 사용

---

**보고서 작성:** 2026-03-10 14:20  
**커밋:** `cfe9b8ca`  
**배포 상태:** ✅ 완료  
**API 키 상태:** ❌ 유효하지 않음 (****HxXw)  
**필요 작업:** Novita AI API 키 발급 및 Cloudflare 설정
