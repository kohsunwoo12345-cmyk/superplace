# 🎯 숙제 제출 API 500 에러 완전 해결 가이드

## 📊 현재 상황 (2024-01-15)

### ✅ 완료된 작업
1. **코드 수정 완료** (커밋: `cd97289`)
   - GEMINI_API_KEY → GOOGLE_GEMINI_API_KEY 변경
   - 에러 로깅 강화
   - 디버그 엔드포인트 추가

2. **디버그 도구 배포**
   - 새로운 엔드포인트: `/api/homework/debug`
   - 환경 변수 자동 체크
   - Gemini API 연결 테스트
   - DB 연결 테스트

3. **상세 문서 작성**
   - `URGENT_API_500_FIX.md`: 5단계 진단 가이드
   - Cloudflare 설정 방법
   - Google AI Studio 키 생성 방법
   - 전체 테스트 절차

### 🔴 즉시 해야 할 작업

#### 1단계: PR 머지 및 배포 (필수)
```bash
# PR 링크
https://github.com/kohsunwoo12345-cmyk/superplace/pull/7

# 최신 커밋
cd97289 - fix: API 500 에러 진단 도구 추가 및 상세 가이드 작성

# 액션
1. PR 페이지 접속
2. "Merge pull request" 클릭
3. "Confirm merge" 클릭
4. 배포 대기 (2-3분)
```

#### 2단계: 디버그 엔드포인트 확인 (필수)
```bash
# 브라우저에서 접속
https://genspark-ai-developer.superplacestudy.pages.dev/api/homework/debug

# 예상 결과 A: 모든 시스템 정상
{
  "environment": {
    "hasDatabase": true,
    "hasGeminiApiKey": true,
    "geminiKeyLength": 39
  },
  "tests": {
    "database": { "success": true },
    "geminiApi": { "success": true }
  },
  "recommendations": ["✅ 모든 시스템이 정상입니다!"]
}

# 예상 결과 B: 환경 변수 미설정 (문제!)
{
  "environment": {
    "hasGeminiApiKey": false,
    "geminiKeyLength": 0,
    "geminiKeyPrefix": "NOT_SET"
  },
  "recommendations": [
    "❌ GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다."
  ]
}
```

#### 3단계: 환경 변수 설정 (결과 B인 경우 필수)

##### Cloudflare Dashboard 방법
```
1. https://dash.cloudflare.com 접속
2. Workers & Pages 선택
3. superplace 프로젝트 클릭
4. Settings 탭 선택
5. Environment variables 섹션 찾기
6. "Add variable" 클릭
   - Variable name: GOOGLE_GEMINI_API_KEY
   - Value: [Google AI Studio에서 생성한 키]
   - Environment: Production 선택
7. "Save" 클릭
8. Preview 환경도 동일하게 설정
```

##### Wrangler CLI 방법
```bash
cd /home/user/webapp

# Production 환경
npx wrangler pages secret put GOOGLE_GEMINI_API_KEY
# 프롬프트에 API 키 입력

# Preview 환경
npx wrangler pages secret put GOOGLE_GEMINI_API_KEY --env preview
```

##### Google AI Studio에서 API 키 생성
```
1. https://aistudio.google.com/app/apikey 접속
2. "Get API Key" 또는 "Create API Key" 클릭
3. 프로젝트 선택 (또는 신규 생성)
4. 생성된 키 복사 (AIzaSy... 형식)
5. Cloudflare에 설정
```

#### 4단계: 재테스트
```bash
# 1. 디버그 엔드포인트 다시 확인
https://genspark-ai-developer.superplacestudy.pages.dev/api/homework/debug
→ "✅ 모든 시스템이 정상입니다!" 확인

# 2. 브라우저 캐시 삭제
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# 3. 전체 플로우 테스트
https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify/
→ 출석 인증
→ 숙제 사진 3장 촬영
→ 숙제 제출
→ "AI 채점 중..." 확인 (30초)
→ "채점 완료!" + 점수 확인

# 4. F12 콘솔 확인
오류 없음 확인
API 응답 200 확인
```

---

## 🔍 문제 원인 분석

### 핵심 원인
**Cloudflare 환경 변수 `GOOGLE_GEMINI_API_KEY`가 설정되지 않았을 가능성 높음**

### 증거
1. 코드에서 `GOOGLE_GEMINI_API_KEY` 사용
2. 환경 변수 미설정 시 API 500 에러 발생
3. JSON 대신 HTML 반환 (Workers 크래시)

### 해결 방법
1. Cloudflare에 환경 변수 설정
2. 디버그 엔드포인트로 확인
3. 전체 플로우 테스트

---

## 📋 체크리스트

### 배포 전
- [x] 코드 수정 완료 (GEMINI_API_KEY → GOOGLE_GEMINI_API_KEY)
- [x] 디버그 엔드포인트 추가
- [x] 에러 로깅 강화
- [x] 문서 작성 완료
- [x] 커밋 및 푸시 완료
- [ ] PR 머지 대기

### 배포 후
- [ ] PR 머지 완료
- [ ] 배포 완료 확인 (2-3분)
- [ ] 디버그 엔드포인트 접속
- [ ] 환경 변수 상태 확인
- [ ] 필요 시 환경 변수 설정
- [ ] 디버그 엔드포인트 재확인 (모든 시스템 정상)
- [ ] 브라우저 캐시 삭제
- [ ] 전체 플로우 테스트
- [ ] 숙제 제출 성공 확인
- [ ] 채점 결과 확인

---

## 🚀 다음 단계

### 즉시 실행
1. **PR 머지**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
2. **배포 대기**: 2-3분
3. **디버그 확인**: `/api/homework/debug`
4. **환경 변수 설정** (필요 시)
5. **전체 테스트**

### 예상 시간
- PR 머지: 1분
- 배포: 2-3분
- 디버그 확인: 1분
- 환경 변수 설정: 5분 (필요 시)
- 전체 테스트: 5분
- **총 예상 시간: 10-15분**

---

## 📞 문제 지속 시

### 추가 정보 수집
1. 디버그 엔드포인트 결과 스크린샷
2. F12 콘솔 전체 로그
3. Cloudflare Logs 스크린샷
4. 환경 변수 설정 화면 (값은 가림)

### Cloudflare Logs 확인
```
https://dash.cloudflare.com
→ Workers & Pages
→ superplace
→ Logs 탭

또는 CLI:
npx wrangler pages deployment tail
```

---

## 📚 관련 파일

### 코드
- `functions/api/homework/grade.ts` - 메인 API
- `functions/api/homework/debug.ts` - 디버그 엔드포인트
- `src/app/attendance-verify/page.tsx` - 프론트엔드

### 문서
- `URGENT_API_500_FIX.md` - 상세 진단 가이드
- `HOMEWORK_ERROR_DIAGNOSIS.md` - 이전 진단 기록
- `GEMINI_API_KEY_FIX_URGENT.md` - API 키 수정 기록

### GitHub
- **PR**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
- **최신 커밋**: `cd97289`
- **브랜치**: `genspark_ai_developer`

---

## 🎯 성공 기준

### 디버그 엔드포인트
```json
{
  "recommendations": ["✅ 모든 시스템이 정상입니다!"]
}
```

### 숙제 제출
```
1. "AI 채점 중..." 표시
2. 30초 대기
3. "채점 완료!" 표시
4. 점수 및 피드백 표시
5. F12 콘솔 오류 없음
```

### 결과 페이지
```
1. 제출한 숙제 표시
2. 상세 보기 클릭
3. 이미지 3장 표시
4. 점수, 과목, 학년 표시
5. 종합 평가, 상세 분석 표시
```

---

## 💡 핵심 포인트

1. **디버그 엔드포인트가 핵심**: `/api/homework/debug`로 모든 것을 확인할 수 있음
2. **환경 변수가 핵심**: `GOOGLE_GEMINI_API_KEY` 설정이 가장 중요
3. **재배포 불필요**: 환경 변수 설정 후 즉시 반영
4. **캐시 삭제 필수**: 브라우저 하드 리프레시 필수

---

**최신 커밋**: `cd97289`  
**PR 링크**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7  
**테스트 URL**: https://genspark-ai-developer.superplacestudy.pages.dev/  
**디버그 URL**: https://genspark-ai-developer.superplacestudy.pages.dev/api/homework/debug

**다음 액션**: PR 머지 후 디버그 엔드포인트 확인 → 환경 변수 설정 → 전체 테스트
