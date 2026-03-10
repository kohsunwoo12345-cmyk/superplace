# 🚀 새로운 AI 모델 추가 및 RAG 테스트 가이드

## 📊 추가된 모델

### 1. DeepSeek OCR-2 (ALL_AI_API_KEY)
- **모델명**: `deepseek-ocr-2`
- **특징**: 강력한 OCR 및 문서 인식
- **API**: https://api.deepseek.com/v1/chat/completions
- **API 키**: `ALL_AI_API_KEY`

### 2. OpenAI GPT 모델 (OPENAI_API_KEY)
| 모델명 | 설명 |
|--------|------|
| `gpt-4o` | OpenAI 최신 멀티모달 모델 |
| `gpt-4o-mini` | GPT-4o 경량 버전, 빠르고 효율적 |
| `gpt-4.1-nano` | 초경량 모델, 빠른 응답 |
| `gpt-4.1-mini` | GPT-4.1 경량 버전 |
| `gpt-5-mini` | GPT-5 경량 버전 |
| `gpt-5.2` | GPT-5 최신 버전 |

**API**: https://api.openai.com/v1/chat/completions  
**API 키**: `OPENAI_API_KEY`

---

## 🔐 환경 변수 설정

### Cloudflare Pages Dashboard에서 설정

1. **Dashboard 접속**
   ```
   https://dash.cloudflare.com/
   → Pages
   → superplace
   → Settings
   → Environment variables
   → Production
   ```

2. **환경 변수 추가**

   **기존 (확인):**
   - `GOOGLE_GEMINI_API_KEY` = `[Your Gemini API Key]`

   **신규 추가:**
   - `ALL_AI_API_KEY` = `[Your DeepSeek API Key]`
   - `OPENAI_API_KEY` = `[Your OpenAI API Key]`

3. **배포 트리거**
   - Save and Deploy
   - 또는 새 커밋 푸시 시 자동 배포

---

## 📝 파일 수정 내역

### 1. UI 페이지
```typescript
// src/app/dashboard/admin/ai-bots/create/page.tsx
const GEMINI_MODELS = [
  // ... 기존 Gemini 모델들
  
  // 🆕 DeepSeek OCR 모델
  { value: "deepseek-ocr-2", label: "DeepSeek OCR 2", ... },
  
  // 🆕 OpenAI GPT 모델들
  { value: "gpt-4o", label: "GPT-4o", ... },
  { value: "gpt-4o-mini", label: "GPT-4o mini", ... },
  { value: "gpt-4.1-nano", label: "GPT-4.1 nano", ... },
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini", ... },
  { value: "gpt-5-mini", label: "GPT-5 mini", ... },
  { value: "gpt-5.2", label: "GPT-5.2", ... },
];
```

```typescript
// src/app/dashboard/admin/homework-grading-config/page.tsx
// 동일한 모델 목록 추가
```

### 2. API 로직
```typescript
// functions/api/ai/chat.ts
interface Env {
  GOOGLE_GEMINI_API_KEY: string;
  ALL_AI_API_KEY: string;      // 🆕 DeepSeek
  OPENAI_API_KEY: string;      // 🆕 OpenAI
  VECTORIZE: VectorizeIndex;
  DB: D1Database;
}

// 모델별 API 라우팅
if (model === 'deepseek-ocr-2') {
  // DeepSeek API 호출
} else if (model.startsWith('gpt-')) {
  // OpenAI API 호출
} else {
  // Gemini API 호출
}
```

---

## 🧪 테스트 순서

### 1단계: 환경 변수 확인 ✅
```bash
# Cloudflare Dashboard에서 확인
Settings → Environment variables → Production

✓ ALL_AI_API_KEY 설정됨
✓ OPENAI_API_KEY 설정됨
✓ GOOGLE_GEMINI_API_KEY 설정됨
```

### 2단계: 배포 확인 ✅
```bash
# Git 커밋 확인
git log --oneline -3

# 예상 출력:
# 08ad93be feat: add DeepSeek OCR-2 and OpenAI GPT models support
# a9f1e0ea fix: remove ES module imports for Cloudflare Pages Functions
# ...

# Cloudflare Pages 배포 상태
https://dash.cloudflare.com/ → Pages → superplace → Deployments
→ 최신 배포 (08ad93be) 확인
```

### 3단계: UI에서 모델 선택 확인 ✅
```
1. https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create 접속
2. "Gemini 모델 선택" 드롭다운 클릭
3. 새로운 모델들이 보이는지 확인:
   ✓ DeepSeek OCR 2
   ✓ GPT-4o
   ✓ GPT-4o mini
   ✓ GPT-4.1 nano
   ✓ GPT-4.1 mini
   ✓ GPT-5 mini
   ✓ GPT-5.2
```

### 4단계: 각 모델 API 호출 테스트 🔄

#### Test 1: DeepSeek OCR-2
```bash
# 테스트 봇 생성
1. AI 봇 생성 페이지 접속
2. 모델: "DeepSeek OCR 2" 선택
3. 시스템 프롬프트: "당신은 OCR 전문가입니다."
4. 저장

# 채팅 테스트
1. 생성된 봇으로 채팅
2. 메시지: "안녕하세요"
3. 응답 확인

# 예상 결과:
✓ API 호출 성공
✓ DeepSeek 응답 수신
✓ 응답 시간 측정
```

#### Test 2: GPT-4o
```bash
# 테스트 봇 생성
1. AI 봇 생성 페이지 접속
2. 모델: "GPT-4o" 선택
3. 시스템 프롬프트: "당신은 도움이 되는 AI입니다."
4. 저장

# 채팅 테스트
1. 생성된 봇으로 채팅
2. 메시지: "파이썬으로 Hello World 출력하기"
3. 응답 확인

# 예상 결과:
✓ API 호출 성공
✓ GPT-4o 응답 수신
✓ 코드 블록 포함 응답
```

#### Test 3: GPT-4o-mini
```bash
# 간단한 질문으로 빠른 응답 테스트
메시지: "1+1은?"
예상 응답: "2입니다" (빠른 응답)
```

#### Test 4: 나머지 GPT 모델들
```bash
# GPT-4.1-nano, GPT-4.1-mini, GPT-5-mini, GPT-5.2
각 모델마다 간단한 대화로 API 연결 확인
```

### 5단계: RAG (첨부 파일) 기능 테스트 🔍

#### Test 5-1: Gemini + RAG
```bash
# 1. 지식 베이스 업로드
1. AI 봇 생성/수정 페이지
2. 모델: "Gemini 2.5 Flash"
3. RAG 활성화: ON
4. 지식 파일 업로드:
   - 파일명: test-knowledge.txt
   - 내용: "슈퍼플레이스는 학원 관리 시스템입니다. 출석, 숙제, 성적 관리 기능을 제공합니다."
5. 저장

# 2. RAG 테스트
메시지: "슈퍼플레이스가 뭐야?"
예상 응답: "슈퍼플레이스는 학원 관리 시스템입니다..." (지식 베이스 내용 포함)

# 3. 확인 사항
✓ RAG 활성화 상태 (response.ragEnabled = true)
✓ 지식 베이스 내용 참조
✓ 응답에 업로드한 지식 포함
```

#### Test 5-2: DeepSeek + RAG
```bash
# 1. DeepSeek 봇에 지식 업로드
1. DeepSeek OCR-2 모델 선택
2. RAG 활성화
3. 지식 파일 업로드:
   - 파일명: ocr-guide.txt
   - 내용: "OCR은 Optical Character Recognition의 약자입니다."
4. 저장

# 2. RAG 테스트
메시지: "OCR이 뭐야?"
예상 응답: "OCR은 Optical Character Recognition..." (지식 포함)

# 3. 확인
✓ DeepSeek API + RAG 동작
✓ 지식 베이스 검색 성공
✓ 응답에 지식 반영
```

#### Test 5-3: GPT-4o + RAG
```bash
# 1. GPT-4o 봇에 지식 업로드
1. GPT-4o 모델 선택
2. RAG 활성화
3. 지식 파일 업로드:
   - 파일명: python-basics.txt
   - 내용: "파이썬은 1991년 귀도 반 로섬이 개발한 프로그래밍 언어입니다."
4. 저장

# 2. RAG 테스트
메시지: "파이썬을 누가 만들었어?"
예상 응답: "귀도 반 로섬이 1991년에..." (지식 포함)

# 3. 확인
✓ GPT-4o API + RAG 동작
✓ Vectorize 지식 베이스 검색
✓ OpenAI API에 지식 컨텍스트 전달
```

#### Test 5-4: 모든 GPT 모델 + RAG
```bash
# GPT-4o-mini, GPT-4.1-nano, GPT-4.1-mini, GPT-5-mini, GPT-5.2
각 모델마다:
1. RAG 활성화
2. 지식 파일 업로드
3. 지식 관련 질문
4. 응답에 지식 포함 확인
```

---

## 🔍 디버깅 & 로그 확인

### Cloudflare Pages Functions 로그
```bash
# Cloudflare Dashboard
Pages → superplace → Functions → Logs

# 확인 사항:
✓ API 호출 URL
✓ 모델 선택
✓ RAG 활성화 여부
✓ 지식 베이스 검색 결과
✓ API 응답 시간
✓ 에러 메시지 (있다면)
```

### 브라우저 개발자 도구
```javascript
// Network 탭
- API 요청 확인: /api/ai/chat
- Request Payload: model, message, botId
- Response: response, ragEnabled, knowledgeUsed

// Console 탭
- 에러 메시지 확인
- API 응답 시간 확인
```

---

## ✅ 테스트 체크리스트

### 모델 API 호출 테스트
- [ ] DeepSeek OCR-2 API 호출 성공
- [ ] GPT-4o API 호출 성공
- [ ] GPT-4o-mini API 호출 성공
- [ ] GPT-4.1-nano API 호출 성공
- [ ] GPT-4.1-mini API 호출 성공
- [ ] GPT-5-mini API 호출 성공
- [ ] GPT-5.2 API 호출 성공

### RAG 첨부 파일 테스트
- [ ] Gemini + RAG 동작 확인
- [ ] DeepSeek + RAG 동작 확인
- [ ] GPT-4o + RAG 동작 확인
- [ ] GPT-4o-mini + RAG 동작 확인
- [ ] GPT-4.1-nano + RAG 동작 확인
- [ ] GPT-4.1-mini + RAG 동작 확인
- [ ] GPT-5-mini + RAG 동작 확인
- [ ] GPT-5.2 + RAG 동작 확인

### 응답 품질 확인
- [ ] 각 모델 응답 속도 측정
- [ ] 응답 정확도 평가
- [ ] RAG 지식 반영 확인
- [ ] 토큰 사용량 확인

---

## 🚨 문제 해결

### 1. API 호출 실패
```bash
# 증상: "API request failed" 에러

# 확인 사항:
1. 환경 변수 설정 확인 (Dashboard)
2. API 키 유효성 확인
3. API 엔드포인트 URL 확인
4. Network 탭에서 요청/응답 확인

# 해결 방법:
- API 키 재입력
- Redeploy 실행
```

### 2. RAG 동작 안 함
```bash
# 증상: ragEnabled = false 또는 지식 미반영

# 확인 사항:
1. RAG 활성화 ON 확인
2. 지식 파일 업로드 성공 확인
3. Vectorize 지식 베이스 저장 확인

# 해결 방법:
- 지식 파일 재업로드
- RAG OFF → ON 재설정
- 봇 재생성
```

### 3. 모델 선택 안 보임
```bash
# 증상: 새 모델이 드롭다운에 없음

# 확인 사항:
1. 최신 배포 확인 (08ad93be)
2. 브라우저 캐시 삭제 (Ctrl + Shift + R)

# 해결 방법:
- Hard refresh
- 다른 브라우저 시도
```

---

## 📊 예상 결과

### API 응답 속도
| 모델 | 예상 응답 시간 |
|------|--------------|
| Gemini 2.5 Flash | 1-3초 |
| DeepSeek OCR-2 | 2-4초 |
| GPT-4o | 2-5초 |
| GPT-4o-mini | 1-2초 |
| GPT-4.1-nano | <1초 |
| GPT-5.2 | 3-6초 |

### RAG 성능
- **지식 검색 시간**: ~0.5초
- **Vectorize 매칭 정확도**: 80%+
- **지식 반영 응답**: 90%+

---

## 📞 다음 단계

1. **환경 변수 설정** (Cloudflare Dashboard)
2. **배포 확인** (08ad93be 커밋)
3. **모델 API 테스트** (7개 모델)
4. **RAG 첨부 파일 테스트** (8가지 조합)
5. **결과 보고**

---

**작성일**: 2026-03-10  
**커밋**: 08ad93be  
**상태**: 테스트 준비 완료 🚀  
**Live URL**: https://superplacestudy.pages.dev
