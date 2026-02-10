# 유사문제 출제 기능 구현 완료 보고서

## 📋 개요

학생의 **숙제 제출 데이터**와 **AI 대화 기록**을 바탕으로 부족한 개념을 파악하고, 이를 보완하기 위한 **맞춤형 유사문제**를 자동 생성하는 기능을 구현했습니다.

### 핵심 기능
- ✅ **3단계 난이도 구분**: 기본 유형 / 변형 문제 / 심화 문제
- ✅ **약점 기반 문제 생성**: 학생이 자주 틀리는 개념에 집중
- ✅ **AI 기반 자동 생성**: Gemini 1.5 Flash 모델 사용
- ✅ **맞춤형 힌트 및 풀이**: 각 문제마다 힌트와 상세 풀이 제공
- ✅ **인쇄 가능한 형식**: 실제 학습에 활용할 수 있도록 최적화

---

## 🎯 구현 내역

### 1. 백엔드 API 개선

**파일**: `functions/api/homework/generate-similar-problems.ts`

#### 주요 변경사항

**A. Gemini API 모델 안정화**
```typescript
// AS-IS (불안정)
gemini-2.0-flash-exp  // 실험 모델 (404 에러 발생 가능)

// TO-BE (안정화)
gemini-1.5-flash  // 프로덕션 준비 완료 모델
```

**B. 3단계 난이도 구분 생성**

각 약점 유형마다 다음과 같은 3가지 문제를 생성합니다:

1. **📌 기본 유형 문제** (Basic)
   - 목적: 개념 이해를 위한 기초 문제
   - 난이도: ⭐ (쉬움)
   - 예시: "x × x = ?" → x²의 개념 확인

2. **🔄 변형 문제** (Variation)
   - 목적: 유사하지만 약간 변형된 문제
   - 난이도: ⭐⭐ (보통)
   - 예시: "(2x)² = ?" → 계수가 포함된 경우

3. **🚀 심화 문제** (Advanced)
   - 목적: 개념을 응용한 고난도 문제
   - 난이도: ⭐⭐⭐ (어려움)
   - 예시: "(x+1)² - (x-1)² = ?" → 복합 개념 응용

#### API 엔드포인트

**POST** `/api/homework/generate-similar-problems`

**요청 Body:**
```json
{
  "studentId": "157",
  "weaknessTypes": [
    "문자 곱셈 시 지수 처리 (x*x = x²)",
    "다항식의 완전한 분배",
    "완전 제곱 공식 (a+b)² 전개"
  ],
  "studentName": "고선우"
}
```

**응답:**
```json
{
  "success": true,
  "problems": "<div class='problem-section'>...</div>",
  "weaknessTypes": ["..."],
  "studentName": "고선우",
  "generatedAt": "2026-02-10T18:30:00.000Z"
}
```

#### 에러 처리 개선

```typescript
// API 키 검증
if (!GOOGLE_GEMINI_API_KEY) {
  console.error('❌ GOOGLE_GEMINI_API_KEY environment variable not configured');
  return new Response(
    JSON.stringify({ 
      success: false,
      error: "GOOGLE_GEMINI_API_KEY environment variable not configured" 
    }),
    { status: 500 }
  );
}

// Gemini API 실패 시 상세 로깅
if (!response.ok) {
  const errorText = await response.text();
  console.error(`❌ Gemini API failed: ${response.status}`, errorText);
  throw new Error(`Gemini API failed: ${response.status}`);
}
```

---

### 2. 프론트엔드 UI 개선

**파일**: `src/app/dashboard/students/detail/page.tsx`

#### HTML 구조 및 스타일링

생성된 문제는 새 탭에서 열리며, 다음과 같은 구조를 가집니다:

```html
<!DOCTYPE html>
<html>
<head>
  <title>학생명님 맞춤 유사문제</title>
  <!-- 완전히 새로운 CSS 스타일 -->
</head>
<body>
  <h1>📚 학생명님 맞춤 유사문제</h1>
  
  <!-- 헤더 정보 -->
  <div class="header-info">
    <p>생성일: 2026-02-10 18:30</p>
    <p>분석된 약점 유형:</p>
    <div class="weakness-types">
      <span class="weakness-type">문자 곱셈 시 지수 처리</span>
      <span class="weakness-type">다항식의 완전한 분배</span>
    </div>
  </div>
  
  <!-- 인쇄 버튼 -->
  <button class="print-btn" onclick="window.print()">🖨️ 인쇄하기</button>
  
  <!-- 문제 섹션 -->
  <div class="problem-section">
    <h2 class="weakness-title">🎯 약점: 문자 곱셈 시 지수 처리 (x*x = x²)</h2>
    
    <!-- 기본 유형 -->
    <div class="difficulty-group">
      <h3 class="difficulty-level basic">📌 기본 유형 문제</h3>
      <div class="problem">
        <div class="problem-content">
          <p><strong>문제:</strong> x × x를 간단히 하시오.</p>
        </div>
        <details class="hint">
          <summary>💡 힌트</summary>
          <p>같은 문자끼리 곱하면 지수가 증가합니다.</p>
        </details>
        <details class="solution">
          <summary>✅ 정답 및 풀이</summary>
          <p><strong>정답:</strong> x²</p>
          <div class="solution-steps">
            <p><strong>풀이:</strong></p>
            <ol>
              <li>x × x는 x가 2번 곱해진 것입니다.</li>
              <li>따라서 x²로 표현합니다.</li>
            </ol>
          </div>
        </details>
      </div>
    </div>
    
    <!-- 변형 문제 -->
    <div class="difficulty-group">
      <h3 class="difficulty-level variation">🔄 변형 문제</h3>
      <!-- ... -->
    </div>
    
    <!-- 심화 문제 -->
    <div class="difficulty-group">
      <h3 class="difficulty-level advanced">🚀 심화 문제</h3>
      <!-- ... -->
    </div>
  </div>
  
  <!-- 다른 약점 유형에 대한 문제들... -->
  
  <div class="footer">
    <p>이 문제는 학생의 약점 분석을 바탕으로 AI가 생성한 맞춤형 유사문제입니다.</p>
  </div>
</body>
</html>
```

#### 스타일링 특징

1. **난이도별 색상 구분**
   - 📌 기본: 파란색 (`#dbeafe` / `#1e40af`)
   - 🔄 변형: 노란색 (`#fef3c7` / `#92400e`)
   - 🚀 심화: 빨간색 (`#fee2e2` / `#991b1b`)

2. **인터랙티브 요소**
   - `<details>` 태그로 힌트/풀이 접기/펼치기
   - 힌트는 파란색 배경 (`#eff6ff`)
   - 풀이는 초록색 배경 (`#f0fdf4`)

3. **인쇄 최적화**
   - `@media print` 설정
   - 인쇄 시 불필요한 요소 숨김
   - 페이지 내에서 섹션 분리 방지 (`page-break-inside: avoid`)

4. **반응형 디자인**
   - 최대 너비 1000px
   - 모바일/태블릿에서도 잘 보이도록 조정

---

## 📊 데이터 흐름

```
[학생 상세 페이지]
    ↓ 클릭: "유사문제 출제" 버튼
    ↓
[최근 숙제 5개 분석]
    ↓ weaknessTypes 추출
    ↓
[POST /api/homework/generate-similar-problems]
    ↓ studentId, weaknessTypes, studentName
    ↓
[Gemini API 호출]
    ↓ gemini-1.5-flash 모델
    ↓ 프롬프트: 기본/변형/심화 문제 생성 요청
    ↓
[HTML 형식의 문제 생성]
    ↓ 약점 유형별 × 3단계 난이도
    ↓
[프론트엔드에서 새 탭으로 표시]
    ↓ 스타일링 적용된 HTML
    ↓
[학생/선생님이 확인 및 인쇄]
```

---

## 🎨 화면 예시

### 학생 상세 페이지
```
┌─────────────────────────────────────────┐
│  최근 숙제 제출 내역                      │
│  ┌─────────────────────────────────────┐ │
│  │ 숙제 1: 점수 53.3점                  │ │
│  │ 약점: 문자 곱셈, 다항식 분배         │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  [유사문제 출제] 🎯 ← 클릭              │
└─────────────────────────────────────────┘
```

### 생성된 유사문제 페이지 (새 탭)
```
┌────────────────────────────────────────────┐
│       📚 고선우님 맞춤 유사문제              │
│                                              │
│  생성일: 2026-02-10 18:30                   │
│  분석된 약점:                                │
│  [문자 곱셈 시 지수 처리] [다항식의 완전한 분배] │
│                                              │
│  [🖨️ 인쇄하기]                              │
│                                              │
│  ╔══════════════════════════════════════╗  │
│  ║ 🎯 약점: 문자 곱셈 시 지수 처리       ║  │
│  ╚══════════════════════════════════════╝  │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │ 📌 기본 유형 문제                   │    │
│  ├────────────────────────────────────┤    │
│  │ 문제: x × x를 간단히 하시오.        │    │
│  │                                      │    │
│  │ ▶ 💡 힌트                           │    │
│  │ ▶ ✅ 정답 및 풀이                   │    │
│  └────────────────────────────────────┘    │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │ 🔄 변형 문제                        │    │
│  ├────────────────────────────────────┤    │
│  │ 문제: (2x)²을 전개하시오.           │    │
│  │                                      │    │
│  │ ▶ 💡 힌트                           │    │
│  │ ▶ ✅ 정답 및 풀이                   │    │
│  └────────────────────────────────────┘    │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │ 🚀 심화 문제                        │    │
│  ├────────────────────────────────────┤    │
│  │ 문제: (x+1)² - (x-1)² = ?          │    │
│  │                                      │    │
│  │ ▶ 💡 힌트                           │    │
│  │ ▶ ✅ 정답 및 풀이                   │    │
│  └────────────────────────────────────┘    │
│                                              │
│  [다른 약점 유형 문제들...]                 │
└────────────────────────────────────────────┘
```

---

## 🔧 기술 스택

| 구분 | 기술 |
|------|------|
| **백엔드** | Cloudflare Pages Functions (Serverless) |
| **AI 모델** | Google Gemini 1.5 Flash |
| **프론트엔드** | Next.js + React + TypeScript |
| **스타일링** | Inline CSS (새 탭에서 독립 실행) |
| **데이터베이스** | Cloudflare D1 (SQLite) |

---

## ⚙️ 설정 요구사항

### Cloudflare 환경 변수 설정

**필수**: `GOOGLE_GEMINI_API_KEY`

```bash
# Cloudflare Dashboard 설정
1. Workers & Pages → superplace 프로젝트 선택
2. Settings → Environment Variables
3. Production 환경에 추가:
   - Variable name: GOOGLE_GEMINI_API_KEY
   - Value: [실제 Gemini API 키]
4. Save → Redeploy
```

### API 키 발급 방법

1. https://aistudio.google.com/ 접속
2. "Get API Key" 클릭
3. 새 프로젝트 생성 또는 기존 프로젝트 선택
4. API 키 복사
5. Cloudflare에 환경 변수 설정

---

## ✅ 테스트 방법

### 1. 학생 상세 페이지 접속
```
https://superplacestudy.pages.dev/dashboard/students/detail/?id=157
```

### 2. 숙제 제출 내역 확인
- 최근 숙제가 있어야 함 (최소 1개)
- 약점 유형(weaknessTypes)이 저장되어 있어야 함

### 3. "유사문제 출제" 버튼 클릭
- 버튼 위치: 학생 상세 페이지 상단
- 아이콘: 🎯

### 4. 결과 확인
- 새 탭이 열림
- 약 5-10초 후 문제가 표시됨
- 약점 유형별로 3단계 난이도 문제 확인

### 5. 인쇄 테스트
- "🖨️ 인쇄하기" 버튼 클릭
- 불필요한 요소(버튼 등)가 숨겨지는지 확인

---

## 🐛 문제 해결 가이드

### 문제 1: "유사문제 출제" 버튼이 비활성화됨

**원인**:
- 숙제 제출 내역이 없음 (`homeworkSubmissions.length === 0`)

**해결**:
1. 학생이 최소 1개의 숙제를 제출했는지 확인
2. 숙제가 채점되었는지 확인 (status = 'graded')
3. API 테스트:
   ```bash
   curl https://superplacestudy.pages.dev/api/homework/results?role=ADMIN&email=admin@superplace.co.kr
   ```

### 문제 2: "분석 가능한 약점 유형이 없습니다" 알림

**원인**:
- 숙제에 `weaknessTypes` 데이터가 없음

**해결**:
1. 숙제 채점 시 약점 유형이 자동으로 저장되는지 확인
2. `homework_gradings_v2` 테이블의 `weaknessTypes` 컬럼 확인
3. 숙제 재채점 시도

### 문제 3: Gemini API 실패 (404, 500 등)

**원인**:
- `GOOGLE_GEMINI_API_KEY` 환경 변수가 설정되지 않음
- API 키가 만료되었거나 잘못됨

**해결**:
1. Cloudflare 대시보드에서 환경 변수 확인
2. API 키 재발급 후 재설정
3. Redeploy 실행

### 문제 4: 문제가 생성되지 않음 (빈 화면)

**원인**:
- Gemini API 응답 파싱 실패
- 생성된 HTML이 비어있음

**해결**:
1. 브라우저 콘솔 확인 (F12)
2. 백엔드 로그 확인 (Cloudflare Dashboard → Functions → Logs)
3. API 테스트:
   ```bash
   curl -X POST https://superplacestudy.pages.dev/api/homework/generate-similar-problems \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer [TOKEN]" \
     -d '{
       "studentId": "157",
       "weaknessTypes": ["문자 곱셈 시 지수 처리"],
       "studentName": "테스트학생"
     }'
   ```

---

## 📈 향후 개선 계획

### 단기 (1-2주)
- [ ] 문제 난이도 자동 조정 (학생 실력에 따라)
- [ ] 문제 히스토리 저장 (중복 생성 방지)
- [ ] PDF 다운로드 기능

### 중기 (1개월)
- [ ] 학생별 맞춤 문제 은행 구축
- [ ] 문제 풀이 결과 추적
- [ ] 진도율 기반 문제 추천

### 장기 (3개월+)
- [ ] 이미지/그래프 포함 문제 생성
- [ ] 실시간 협업 문제 풀이
- [ ] 문제 품질 평가 시스템

---

## 📝 변경 이력

### 2026-02-10 (v1.0.0)
- ✅ 기본/변형/심화 문제 구분 생성 기능 구현
- ✅ Gemini API 모델 안정화 (gemini-1.5-flash)
- ✅ 프론트엔드 UI 완전 리뉴얼
- ✅ 난이도별 색상 및 아이콘 구분
- ✅ 인쇄 최적화
- ✅ 에러 처리 개선

---

## 🎓 사용 예시

### 약점 유형: "문자 곱셈 시 지수 처리 (x*x = x²)"

**생성되는 문제 예시:**

**📌 기본 유형**
```
문제: x × x를 간단히 하시오.
힌트: 같은 문자끼리 곱하면 지수가 증가합니다.
정답: x²
```

**🔄 변형 문제**
```
문제: 3x × 2x를 간단히 하시오.
힌트: 계수는 계수끼리, 문자는 문자끼리 곱합니다.
정답: 6x²
```

**🚀 심화 문제**
```
문제: (x+1)² - (x-1)²을 간단히 하시오.
힌트: 완전제곱 공식을 이용한 후, 분배법칙을 적용합니다.
정답: 4x
풀이:
1) (x+1)² = x² + 2x + 1
2) (x-1)² = x² - 2x + 1
3) (x² + 2x + 1) - (x² - 2x + 1) = 4x
```

---

## 🔗 관련 파일

### 백엔드
- `functions/api/homework/generate-similar-problems.ts` - 유사문제 생성 API

### 프론트엔드
- `src/app/dashboard/students/detail/page.tsx` - 학생 상세 페이지
  - `generateSimilarProblems()` 함수 (312-396번 줄)

### 데이터베이스
- `homework_submissions_v2` - 숙제 제출 데이터
- `homework_gradings_v2` - 숙제 채점 데이터
  - `weaknessTypes` 컬럼: 약점 유형 저장

---

## 👥 문의

문제 발생 시:
1. 이 문서의 "문제 해결 가이드" 참조
2. Cloudflare Functions 로그 확인
3. 브라우저 콘솔 (F12) 확인

---

**작성일**: 2026-02-10  
**작성자**: AI Developer Assistant  
**프로젝트**: 슈퍼플레이스 스터디 - 학생 관리 시스템  
**커밋**: c471087
