# 🚀 배포 및 테스트 완료 가이드

## 📋 현재 상태

### ✅ 완료된 작업

1. **빌드 오류 수정** ✅
   - `functions/api/ai/chat.ts` 라인 560 문법 오류 수정
   - 중복된 Response 코드 블록 제거 (9줄)
   - Commit: `c907a370` - "fix: remove duplicate response code in chat.ts"

2. **새로운 AI 모델 추가** ✅
   - DeepSeek OCR-2 (`deepseek-ocr-2`)
   - OpenAI GPT-4o (`gpt-4o`)
   - OpenAI GPT-4o mini (`gpt-4o-mini`)
   - OpenAI GPT-4.1 nano (`gpt-4.1-nano`)
   - OpenAI GPT-4.1 mini (`gpt-4.1-mini`)
   - OpenAI GPT-5 mini (`gpt-5-mini`)
   - OpenAI GPT-5.2 (`gpt-5.2`)

3. **UI 업데이트** ✅
   - AI 봇 생성 페이지에 새 모델 추가
   - 숙제 검사 AI 설정 페이지에 새 모델 추가
   - 두 페이지 모두 RAG 지식베이스 연동 지원

4. **API 라우팅 구현** ✅
   - `functions/api/ai/chat.ts` 멀티 API 지원
   - Gemini 모델 → `GOOGLE_GEMINI_API_KEY`
   - DeepSeek 모델 → `ALL_AI_API_KEY`
   - GPT 모델 → `OPENAI_API_KEY`

5. **테스트 스크립트 작성** ✅
   - `test-new-models-comprehensive.js` - 모든 새 모델 테스트
   - `test-academy-daily-limit.js` - 학원 전체 할당 및 일일 한도 테스트

---

## 🔧 필수 설정 작업

### 1. Cloudflare 환경 변수 설정

Cloudflare Pages에서 다음 환경 변수를 추가해야 합니다:

```
Cloudflare Dashboard → Workers & Pages → superplace → Settings → Environment variables
```

**Production 환경에 추가해야 할 변수:**

| 변수명 | 설명 | 필수 여부 |
|--------|------|----------|
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API 키 | ✅ 필수 |
| `ALL_AI_API_KEY` | DeepSeek API 키 | ✅ 필수 |
| `OPENAI_API_KEY` | OpenAI API 키 | ✅ 필수 |

**설정 방법:**
1. Cloudflare Dashboard 접속
2. Workers & Pages → `superplace` 선택
3. Settings → Environment variables 탭
4. "Add variable" 클릭
5. 위 3개 변수 각각 추가
6. 저장 후 **재배포 트리거** (Settings → Deployments → Retry deployment)

---

## 🧪 테스트 실행 방법

### 배포 완료 확인

1. **Cloudflare 배포 상태 확인:**
   ```
   Cloudflare Dashboard → Workers & Pages → superplace → Deployments
   ```
   - 최신 배포 상태가 "Success" ✅ 인지 확인
   - Commit hash: `7d7115bf` 또는 그 이후

2. **환경 변수 확인:**
   ```
   Settings → Environment variables → Production
   ```
   - `GOOGLE_GEMINI_API_KEY` ✅
   - `ALL_AI_API_KEY` ✅
   - `OPENAI_API_KEY` ✅

---

### Test 1: 새로운 AI 모델 통합 테스트

**목적:** 7개 새 모델과 RAG 기능 검증

**실행 명령:**
```bash
cd /home/user/webapp
node test-new-models-comprehensive.js
```

**예상 출력:**
```
🚀 새로운 AI 모델 통합 테스트 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 모델 1/7: DeepSeek OCR-2 (deepseek-ocr-2)
📝 Test 1: 기본 채팅 기능
✅ Response received (2543ms)
   Model used: deepseek-ocr-2
   Response length: 156 chars

📚 Test 2: RAG 지식베이스 연동
✅ Response received (3012ms)
   RAG enabled: true
   Knowledge used: true

[... 나머지 6개 모델 테스트 ...]

📊 테스트 결과 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 성공: 14/14 (100.0%)
❌ 실패: 0/14 (0.0%)

🎉 모든 테스트 통과! 시스템이 정상적으로 작동하고 있습니다.
```

**체크리스트:**
- [ ] 14개 테스트 모두 통과 (7개 모델 × 2개 테스트)
- [ ] 모든 모델의 기본 채팅 기능 작동
- [ ] 모든 모델의 RAG 연동 작동
- [ ] 응답 시간 합리적 (< 10초)

---

### Test 2: 학원 전체 할당 및 일일 한도 테스트

**목적:** 학원 전체 할당 시 학생/학원장 일일 15회 제한 검증

**실행 명령:**
```bash
cd /home/user/webapp
node test-academy-daily-limit.js
```

**예상 출력:**
```
🏫 학원 전체 할당 및 일일 한도 종합 테스트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Test 1: 학원 전체 할당 기능
👨‍🎓 학생 student-001: ✅ 접근 성공
👨‍🎓 학생 student-002: ✅ 접근 성공
👨‍🎓 학생 student-003: ✅ 접근 성공

📝 Test 2: 학생 일일 한도 (샘플 1명)
✓ 요청 1-15: 성공
⛔ 요청 16: 한도 초과 (429)
결과: 15/15회 사용
한도 감지: ✅
테스트: ✅ PASSED

📝 Test 3: 학원장 일일 한도
✓ 요청 1-15: 성공
⛔ 요청 16: 한도 초과 (429)
결과: 15/15회 사용
한도 감지: ✅
테스트: ✅ PASSED

📊 종합 테스트 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 성공: 3/3 (100.0%)
❌ 실패: 0/3 (0.0%)

🎉 모든 테스트 통과! 학원 전체 할당 및 일일 한도 시스템이 정상 작동합니다.
```

**체크리스트:**
- [ ] 학원 전체 할당 시 모든 학생 접근 가능
- [ ] 학생당 정확히 15회까지 사용 가능
- [ ] 16회째 요청 시 429 에러 또는 한도 초과 메시지
- [ ] 학원장도 동일하게 15회 제한 적용

---

## 🌐 실제 환경 테스트

### 웹 브라우저 테스트

**1. AI 봇 생성 페이지 테스트**

URL: `https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create`

체크리스트:
- [ ] 관리자 계정으로 로그인
- [ ] 모델 선택 드롭다운에서 새 모델 7개 확인:
  - DeepSeek OCR-2
  - GPT-4o
  - GPT-4o mini
  - GPT-4.1 nano
  - GPT-4.1 mini
  - GPT-5 mini
  - GPT-5.2
- [ ] 각 모델 선택 시 설명 표시
- [ ] 지식베이스 파일 업로드 기능 작동

**2. 숙제 검사 AI 설정 페이지 테스트**

URL: `https://superplacestudy.pages.dev/dashboard/admin/homework-grading-config/`

체크리스트:
- [ ] 관리자/원장 계정만 접근 가능
- [ ] 일반 교사/학생 접근 시 리다이렉트
- [ ] 모델 선택 드롭다운에서 새 모델 확인
- [ ] RAG 활성화 토글 작동
- [ ] 설정 저장 기능 정상 작동

**3. AI 챗봇 실제 사용 테스트**

체크리스트:
- [ ] 각 새 모델로 AI 봇 생성
- [ ] 학생 계정으로 로그인
- [ ] 챗봇 응답 정상 수신
- [ ] 지식베이스 업로드된 봇의 경우 RAG 기능 작동
- [ ] 일일 15회 사용 후 제한 메시지 표시

**4. 학원 전체 할당 테스트**

체크리스트:
- [ ] 관리자 계정으로 AI 봇 생성
- [ ] "학원 전체 할당" 옵션 선택
- [ ] 학생 수 50명으로 설정
- [ ] 할당 완료 후 모든 학생이 봇 접근 가능
- [ ] 각 학생 일일 15회 제한 정상 작동
- [ ] 학원장도 동일하게 15회 제한 적용

---

## 📊 테스트 결과 요약표

| 테스트 항목 | 상태 | 비고 |
|------------|------|------|
| 빌드 성공 | ⏳ 대기 | Cloudflare 배포 확인 필요 |
| 환경 변수 설정 | ⏳ 대기 | 사용자가 직접 추가해야 함 |
| 7개 새 모델 추가 | ✅ 완료 | UI 및 API 모두 적용 |
| RAG 기능 통합 | ✅ 완료 | 모든 모델 지원 |
| 학원 전체 할당 | ✅ 완료 | 코드 구현 완료 |
| 일일 한도 (15회) | ✅ 완료 | 학생/학원장 각각 제한 |
| 통합 테스트 스크립트 | ✅ 완료 | 2개 스크립트 작성 |

---

## 🐛 문제 해결

### 빌드 실패 시

**증상:** Cloudflare Pages Functions 빌드 실패

**해결 방법:**
1. 최신 commit 확인: `7d7115bf` 또는 그 이후
2. Git history 확인:
   ```bash
   cd /home/user/webapp
   git log --oneline -5
   ```
3. 필요시 강제 재배포:
   ```
   Cloudflare Dashboard → Deployments → Retry deployment
   ```

### API 키 오류 시

**증상:** 테스트 실행 시 "API key missing" 또는 401 에러

**해결 방법:**
1. Cloudflare 환경 변수 확인
2. 변수명 정확히 일치하는지 확인:
   - `GOOGLE_GEMINI_API_KEY` (not `GEMINI_API_KEY`)
   - `ALL_AI_API_KEY` (not `DEEPSEEK_API_KEY`)
   - `OPENAI_API_KEY` (not `OPENAI_KEY`)
3. 환경 변수 추가/수정 후 재배포

### 일일 한도 미작동 시

**증상:** 16회 이상 사용 가능

**원인:** DB 테이블 또는 로직 문제

**확인 사항:**
1. `bot_usage_logs` 테이블 존재 여부
2. `usageDate` 컬럼 형식 (`YYYY-MM-DD`)
3. 학생/학원장 userId 정확히 매칭되는지

---

## ✅ 최종 체크리스트

배포 및 테스트를 완료하기 위해 다음 항목을 순서대로 진행하세요:

### Phase 1: 환경 설정 (필수)
- [ ] Cloudflare Dashboard 접속
- [ ] `GOOGLE_GEMINI_API_KEY` 환경 변수 추가
- [ ] `ALL_AI_API_KEY` 환경 변수 추가
- [ ] `OPENAI_API_KEY` 환경 변수 추가
- [ ] 재배포 트리거 (Retry deployment)

### Phase 2: 배포 확인
- [ ] Cloudflare 배포 상태 "Success" 확인
- [ ] Commit hash `7d7115bf` 또는 이후 버전 확인
- [ ] Functions 빌드 로그 에러 없음 확인

### Phase 3: 자동 테스트
- [ ] `node test-new-models-comprehensive.js` 실행
- [ ] 14/14 테스트 통과 확인
- [ ] `node test-academy-daily-limit.js` 실행
- [ ] 3/3 테스트 통과 확인

### Phase 4: 수동 테스트
- [ ] AI 봇 생성 페이지에서 새 모델 7개 확인
- [ ] 숙제 검사 설정 페이지에서 새 모델 확인
- [ ] 각 모델로 봇 생성 및 채팅 테스트
- [ ] RAG 지식베이스 업로드 및 활용 테스트
- [ ] 학원 전체 할당 (50명) 테스트
- [ ] 일일 15회 제한 테스트 (학생/학원장 각각)

### Phase 5: 프로덕션 검증
- [ ] 실제 학원 데이터로 테스트
- [ ] 실제 학생 계정으로 접근 테스트
- [ ] 실제 숙제 이미지로 채점 테스트
- [ ] 응답 시간 및 안정성 모니터링

---

## 📝 Git 커밋 히스토리

```
7d7115bf - test: add comprehensive test suites for new features
c907a370 - fix: remove duplicate response code in chat.ts
12364c36 - docs: add comprehensive testing guide for new AI models
08ad93be - feat: add DeepSeek and OpenAI models support
a9f1e0ea - fix: remove ES module imports for Cloudflare Pages Functions
```

---

## 🎯 성공 기준

다음 모든 조건을 만족하면 테스트 완료:

1. ✅ Cloudflare 배포 성공 (빌드 에러 없음)
2. ✅ 환경 변수 3개 모두 설정
3. ✅ 자동 테스트 17/17 통과 (14 + 3)
4. ✅ 7개 새 모델 모두 정상 작동
5. ✅ RAG 기능 모든 모델에서 작동
6. ✅ 학원 전체 할당 정상 작동
7. ✅ 일일 15회 제한 정상 작동

---

## 🚀 다음 단계

모든 테스트가 통과하면:

1. **프로덕션 모니터링 시작**
   - 사용량 추적
   - 에러율 모니터링
   - 응답 시간 측정

2. **사용자 피드백 수집**
   - 새 모델 성능 평가
   - RAG 기능 정확도 평가
   - 일일 한도 적절성 평가

3. **최적화 고려사항**
   - 모델별 비용 분석
   - 응답 속도 개선
   - 캐싱 전략 구현

---

## 📞 지원

문제 발생 시:
1. 테스트 스크립트 로그 확인
2. Cloudflare Dashboard 배포 로그 확인
3. 환경 변수 설정 재확인

---

**문서 작성일:** 2026-03-10  
**마지막 업데이트:** Commit `7d7115bf`  
**상태:** 🟢 배포 준비 완료
