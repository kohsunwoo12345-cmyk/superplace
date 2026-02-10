# 🔧 유사문제 출제 - Gemini API 설정 가이드

## ✅ 완료된 작업

**날짜**: 2026-02-10  
**커밋**: 8b3c7be  
**상태**: Gemini API 재활성화 완료

---

## 🎯 변경 내역

### 1. Gemini API 재활성화

**AS-IS (템플릿 기반)**:
- ❌ 5가지 약점 유형만 지원
- ❌ 제한적인 문제 다양성
- ✅ 즉시 응답 (< 100ms)

**TO-BE (Gemini API)**:
- ✅ **모든 약점 유형 지원**
- ✅ **AI 기반 다양한 문제 생성**
- ✅ **학생 맞춤형 문제**
- ⏱️ 5-10초 응답 시간

---

## ⚙️ 필수 설정: Cloudflare 환경 변수

### 1단계: Google Gemini API 키 발급

#### 방법 1: Google AI Studio (권장)

1. **접속**: https://aistudio.google.com/
2. **로그인**: Google 계정으로 로그인
3. **API Key 생성**:
   - 좌측 메뉴 또는 상단의 "Get API Key" 클릭
   - "Create API key" 선택
   - 프로젝트 선택 (또는 새 프로젝트 생성)
4. **API Key 복사**: 생성된 키를 복사 (예: `AIzaSyDSKFT7gvtwYe01z0JWqFDz3PHSxZiKyoE`)

#### 방법 2: Google Cloud Console

1. **접속**: https://console.cloud.google.com/
2. **프로젝트 선택** 또는 생성
3. **API 활성화**:
   - "APIs & Services" → "Enable APIs and Services"
   - "Gemini API" 검색 및 활성화
4. **인증 정보 생성**:
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "API Key"
5. **API Key 복사**

---

### 2단계: Cloudflare 환경 변수 설정

#### A. Cloudflare Dashboard 접속

```
https://dash.cloudflare.com
```

#### B. 프로젝트 선택

```
Workers & Pages → superplace (또는 프로젝트명)
```

#### C. 환경 변수 추가

1. **Settings 탭** 클릭
2. **Environment Variables** 섹션 찾기
3. **"Add Variable"** 버튼 클릭

**입력 정보**:
```
Variable name: GOOGLE_GEMINI_API_KEY
Value: [1단계에서 복사한 API 키]
Environment: Production ✅ (체크)
```

4. **"Save"** 버튼 클릭

#### D. 재배포 (중요!)

환경 변수 추가 후 **반드시 재배포**해야 합니다:

1. **Deployments** 탭 클릭
2. 최신 배포 찾기
3. 우측의 **"..."** 메뉴 클릭
4. **"Redeploy"** 선택
5. **"Redeploy"** 확인 버튼 클릭

**배포 대기**: 약 2-3분 소요

---

## 🧪 설정 확인 방법

### 방법 1: API 직접 테스트

```bash
curl -X POST https://superplacestudy.pages.dev/api/homework/generate-similar-problems \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "157",
    "weaknessTypes": ["문자 곱셈 시 지수 처리"],
    "studentName": "테스트학생"
  }'
```

**성공 응답**:
```json
{
  "success": true,
  "problems": "<div class='problem-section'>...</div>",
  "weaknessTypes": ["문자 곱셈 시 지수 처리"],
  "studentName": "테스트학생",
  "generatedAt": "2026-02-10T23:30:00.000Z",
  "model": "gemini-1.5-flash"
}
```

**실패 응답** (API 키 미설정):
```json
{
  "success": false,
  "error": "GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. Cloudflare 환경 변수를 확인해주세요."
}
```

---

### 방법 2: 브라우저 테스트

1. **접속**: https://superplacestudy.pages.dev/dashboard/students/detail/?id=157
2. **캐시 초기화**: Ctrl + Shift + R 또는 시크릿 모드
3. **버튼 클릭**: "유사문제 출제" (🎯) 버튼
4. **대기**: 5-10초
5. **결과 확인**: 새 탭에서 문제 표시

---

## 🐛 문제 해결 가이드

### 문제 1: 버튼이 비활성화됨

**증상**: "유사문제 출제" 버튼이 회색으로 표시되어 클릭 불가

**원인**:
```typescript
disabled={generatingSimilarProblems || homeworkSubmissions.length === 0}
```

**해결**:
1. 학생에게 숙제 제출 내역이 있는지 확인
2. API 테스트:
   ```bash
   curl https://superplacestudy.pages.dev/api/homework/results?role=ADMIN&email=admin@superplace.co.kr | jq '.submissions | map(select(.userId == 157))'
   ```
3. 학생 ID 157의 숙제가 1개 이상 있어야 함

---

### 문제 2: "GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다"

**원인**: Cloudflare 환경 변수가 설정되지 않음

**해결**:
1. Cloudflare Dashboard 확인
   ```
   Workers & Pages → superplace → Settings → Environment Variables
   ```
2. `GOOGLE_GEMINI_API_KEY` 변수 존재 확인
3. **Production** 환경에 체크되어 있는지 확인
4. 재배포 실행 (Deployments → Redeploy)
5. 2-3분 대기 후 재시도

---

### 문제 3: Gemini API 호출 실패 (400, 403, 404)

**증상**: 
```json
{
  "success": false,
  "error": "Gemini API 호출 실패 (400)"
}
```

**원인별 해결**:

#### 400 Bad Request
- **원인**: 잘못된 요청 형식
- **해결**: 코드 확인 (일반적으로 자동 해결)

#### 403 Forbidden
- **원인**: API 키가 만료되었거나 권한 없음
- **해결**:
  1. Google AI Studio에서 API 키 재발급
  2. Cloudflare 환경 변수 업데이트
  3. 재배포

#### 404 Not Found
- **원인**: 잘못된 엔드포인트 또는 모델명
- **해결**:
  - 현재 코드는 `gemini-1.5-flash` 사용 (안정적)
  - 엔드포인트: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
  - 코드 확인 필요

#### 429 Too Many Requests
- **원인**: API 할당량 초과
- **해결**:
  1. Google AI Studio에서 할당량 확인
  2. 무료 티어: 분당 15회, 일일 1,500회
  3. 유료 업그레이드 고려

---

### 문제 4: "Gemini API에서 문제를 생성하지 못했습니다"

**원인**: API 응답이 비어있음

**해결**:
1. Cloudflare Functions 로그 확인:
   ```
   Cloudflare Dashboard → Workers & Pages → superplace → Logs
   ```
2. 에러 메시지 확인
3. Gemini API 상태 확인: https://status.cloud.google.com/

---

### 문제 5: 생성된 문제가 이상하게 표시됨

**원인**: HTML 형식 오류 또는 마크다운 코드 블록 포함

**해결**: 자동 처리됨
```typescript
// 코드에서 자동 정리
let cleanedHTML = generatedText;
if (cleanedHTML.includes('```html')) {
  cleanedHTML = cleanedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '');
}
```

---

## 📊 Gemini API 사양

### 사용 모델
```
gemini-1.5-flash
```

### 엔드포인트
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

### 설정 파라미터
```json
{
  "temperature": 0.7,
  "topK": 40,
  "topP": 0.95,
  "maxOutputTokens": 8192
}
```

### 무료 할당량
- **분당**: 15회
- **일일**: 1,500회
- **월별**: 제한 없음 (일일 제한만 적용)

### 응답 시간
- **평균**: 5-8초
- **최대**: 30초 (타임아웃)

---

## 🎨 생성되는 문제 형식

### HTML 구조

```html
<div class="problem-section">
  <h2 class="weakness-title">🎯 약점: [약점 유형]</h2>
  
  <!-- 기본 유형 -->
  <div class="difficulty-group">
    <h3 class="difficulty-level basic">📌 기본 유형 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> [문제 내용]</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>[힌트 내용]</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> [정답]</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            <li>[단계 1]</li>
            <li>[단계 2]</li>
            <li>[단계 3]</li>
          </ol>
        </div>
      </details>
    </div>
  </div>
  
  <!-- 변형 문제 -->
  <div class="difficulty-group">...</div>
  
  <!-- 심화 문제 -->
  <div class="difficulty-group">...</div>
</div>
```

---

## 📝 프롬프트 예시

Gemini API에 전송되는 프롬프트:

```
당신은 수학 교육 전문가입니다. 다음 약점 유형을 가진 학생을 위한 맞춤형 유사문제를 생성해주세요.

학생 정보:
- 이름: 고선우
- 약점 유형: 문자 곱셈 시 지수 처리, 다항식의 완전한 분배

요구사항:
1. 각 약점 유형마다 반드시 3가지 난이도의 문제를 생성하세요
   - 기본 유형 문제 (📌)
   - 변형 문제 (🔄)
   - 심화 문제 (🚀)

2. 각 문제는 다음을 포함:
   - 명확한 문제 설명
   - 💡 힌트
   - ✅ 정답 및 단계별 풀이

3. HTML 형식으로 작성 (아래 형식 엄수)

[HTML 템플릿...]

약점 유형별 문제 예시:
- "문자 곱셈 시 지수 처리": x × x = x², 3x × 2x = 6x², (2x)² × 3x = 12x³
- "다항식의 완전한 분배": 2(x+3), (x+2)(x+3), (x+1)(x²-x+1)
...
```

---

## ✅ 최종 체크리스트

배포 전 확인 사항:

- [ ] Google Gemini API 키 발급 완료
- [ ] Cloudflare 환경 변수 `GOOGLE_GEMINI_API_KEY` 설정
- [ ] Production 환경 체크 확인
- [ ] Cloudflare 재배포 실행
- [ ] 2-3분 대기
- [ ] 브라우저 캐시 초기화
- [ ] API 직접 테스트 (curl)
- [ ] 브라우저에서 버튼 테스트
- [ ] 생성된 문제 확인
- [ ] 인쇄 기능 테스트

---

## 🎉 배포 정보

**커밋**: 8b3c7be - feat: re-enable Gemini API for similar problem generation

**변경 사항**:
- Gemini API 재활성화
- `GOOGLE_GEMINI_API_KEY` 환경 변수 사용
- `gemini-1.5-flash` 모델 적용
- 상세한 에러 처리
- HTML 자동 정리 기능

**배포 상태**:
- ✅ 코드 수정 완료
- ✅ 로컬 빌드 성공
- ✅ GitHub 푸시 완료
- 🔄 Cloudflare Pages 배포 진행 중

**배포 완료 예정**: 2026-02-10 23:35 UTC (약 5분 후)

---

## 📞 다음 단계

### 즉시 실행:
1. ✅ Google AI Studio에서 API 키 발급
2. ✅ Cloudflare 환경 변수 설정
3. ✅ 재배포 실행

### 5분 후:
1. ✅ 브라우저 캐시 초기화
2. ✅ 테스트 URL 접속
3. ✅ "유사문제 출제" 버튼 클릭
4. ✅ AI 생성 문제 확인

### 확인 사항:
- 5-10초 후 새 탭이 열림
- 약점 유형별 3단계 문제 표시
- 힌트 및 풀이 포함
- 인쇄 가능

---

## 🔗 참고 링크

- **Google AI Studio**: https://aistudio.google.com/
- **Gemini API 문서**: https://ai.google.dev/docs
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **테스트 URL**: https://superplacestudy.pages.dev/dashboard/students/detail/?id=157

---

**작성일**: 2026-02-10 23:30 UTC  
**최종 업데이트**: 2026-02-10 23:30 UTC  
**상태**: ✅ Gemini API 재활성화 완료  
**필수 설정**: GOOGLE_GEMINI_API_KEY 환경 변수
