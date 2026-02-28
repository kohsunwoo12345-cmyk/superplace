# 문제지 출력 기능 개선

## 🎯 개선 사항

### 1. **학원 이름 편집 가능** ✅
- **기능**: 문제지 상단의 학원 이름을 인쇄 전에 클릭하여 수정 가능
- **구현**:
  - `contenteditable="true"` 속성으로 편집 활성화
  - 파란색 점선 테두리로 편집 가능 표시
  - 클릭 시 자동 전체 선택 (빠른 수정)
  - 인쇄 시 테두리 자동 제거

**사용 방법**:
```
1. 문제지 출력 클릭
2. 상단 학원 이름 클릭
3. 원하는 이름으로 수정
4. 인쇄 버튼 클릭
```

---

### 2. **객관식/서술형 문제 분리** ✅
- **기능**: 문제 유형에 따라 자동 분류 및 별도 섹션 표시
- **구현**:
  - **객관식 문제**: ①②③④⑤ 또는 1) 2) 3) 형태의 선택지 자동 인식
  - **서술형 문제**: 선택지 없는 문제를 서술형으로 분류
  - 각 섹션마다 섹션 제목 표시:
    - "객관식 문제 (1~5번)"
    - "서술형 문제"

**분류 로직**:
```typescript
// 객관식 판단 정규식
const isMultipleChoice = /[①②③④⑤]|[\(（]?[1-5][\)）]\s*[^\d]/.test(problemContent);

// 타입 할당
type: isMultipleChoice ? 'multiple' : 'descriptive'
```

---

### 3. **페이지당 문제 수 조정** ✅
- **객관식**: 6문제/페이지
  - 선택지가 있어 공간 많이 차지
  - 6문제마다 자동 페이지 나눔
- **서술형**: 5문제/페이지
  - 답안 작성 공간(3줄) 포함
  - 5문제마다 자동 페이지 나눔

**페이지 나눔 코드**:
```typescript
// 객관식: 6문제마다
${(index + 1) % 6 === 0 && index < multipleChoiceProblems.length - 1 ? '<div class="page-break"></div>' : ''}

// 서술형: 5문제마다
${(index + 1) % 5 === 0 && index < descriptiveProblems.length - 1 ? '<div class="page-break"></div>' : ''}
```

---

### 4. **문제 번호 1번부터 시작** ✅
- **문제**: 이전에는 AI가 생성한 번호 그대로 사용 (4번부터 시작하는 경우 발생)
- **해결**: 각 섹션별로 1번부터 재정렬

**재정렬 로직**:
```typescript
// 객관식 문제 번호 재정렬
multipleChoiceProblems.forEach((p, index) => {
  p.number = index + 1;  // 1, 2, 3, ...
});

// 서술형 문제 번호 재정렬
descriptiveProblems.forEach((p, index) => {
  p.number = index + 1;  // 1, 2, 3, ...
});
```

**결과**:
- 객관식: 1, 2, 3, 4, 5, ...
- 서술형: 1, 2, 3, 4, 5, ...
- 각 섹션이 독립적으로 1번부터 시작

---

## 📋 문제지 레이아웃

### 구조
```
┌─────────────────────────────────────┐
│         [학원 이름 (편집 가능)]       │
│─────────────────────────────────────│
│  이름: _____________________        │
│  날짜: 2026. 2. 28.                 │
├─────────────────────────────────────┤
│  ■ 객관식 문제 (1~5번)              │
│                                     │
│  1. [문제 내용]                     │
│     ① 선택지 1                      │
│     ② 선택지 2                      │
│     ...                             │
│                                     │
│  2. [문제 내용]                     │
│     ...                             │
│                                     │
│  ... (6문제마다 페이지 나눔)        │
├─────────────────────────────────────┤
│  ■ 서술형 문제                      │
│                                     │
│  1. [문제 내용]                     │
│     _____________________________   │
│     _____________________________   │
│     _____________________________   │
│                                     │
│  2. [문제 내용]                     │
│     ...                             │
│                                     │
│  ... (5문제마다 페이지 나눔)        │
└─────────────────────────────────────┘
```

---

## 🎨 스타일 변경 사항

### 1. 편집 가능한 학원 이름
```css
.editable-name {
  display: inline-block;
  min-width: 200px;
  padding: 4px 8px;
  border: 2px dashed #3b82f6;      /* 파란색 점선 */
  border-radius: 4px;
  background: #eff6ff;              /* 연한 파란 배경 */
  cursor: text;                     /* 텍스트 커서 */
}

.editable-name:focus {
  border-color: #2563eb;            /* 진한 파란색 */
  background: #dbeafe;              /* 포커스 시 배경 */
}

@media print {
  .editable-name {
    border: none !important;        /* 인쇄 시 테두리 제거 */
  }
}
```

### 2. 섹션 제목
```css
.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 30px 0 20px 0;
  padding: 10px;
  background: #f3f4f6;              /* 회색 배경 */
  border-left: 4px solid #2563eb;   /* 왼쪽 파란 테두리 */
}
```

### 3. 문제 간격 조정
```css
.problem {
  margin-bottom: 35px;              /* 40px → 35px */
  page-break-inside: avoid;
}

.answer-space {
  margin-top: 20px;
  min-height: 60px;                 /* 80px → 60px */
}
```

---

## 🔍 객관식 문제 인식 패턴

다음 형태를 객관식으로 자동 인식:

### 1. 원형 번호 (①②③④⑤)
```
다음 중 옳은 것은?
① 선택지 1
② 선택지 2
③ 선택지 3
④ 선택지 4
⑤ 선택지 5
```

### 2. 괄호 번호 (1) 2) 3) 4) 5))
```
다음을 계산하시오.
1) 10 + 5
2) 20 - 8
3) 15 × 3
4) 36 ÷ 4
5) 25 + 10
```

### 3. 전각 괄호 (（1）（2）（3）（4）（5）)
```
다음 중 맞는 것은?
（1） 선택지 A
（2） 선택지 B
（3） 선택지 C
（4） 선택지 D
（5） 선택지 E
```

**정규식 패턴**:
```typescript
/[①②③④⑤]|[\(（]?[1-5][\)）]\s*[^\d]/
```

---

## 📊 로그 출력 예시

### 콘솔 로그
```javascript
🖨️ 문제지 출력 시작...
📝 전체 메시지 개수: 15
🤖 AI 응답 메시지 개수: 8
📋 추출된 문제 개수: 12
📋 문제 상세: [
  { number: 1, type: 'multiple', length: 145, hasAnswer: false, preview: '다음 중 2의 배수가 아닌 것은?...' },
  { number: 2, type: 'multiple', length: 138, hasAnswer: false, preview: '15 + 23을 계산하시오....' },
  { number: 3, type: 'descriptive', length: 95, hasAnswer: false, preview: '다음 식을 간단히 하시오: 3x + 5x - 2x...' },
  ...
]
📝 객관식 문제: 7 개
📝 서술형 문제: 5 개
```

---

## 🧪 테스트 시나리오

### 1. 객관식 문제만 있는 경우
```
AI 요청: "중학교 1학년 수학 객관식 문제 10개 만들어줘"

결과:
- 객관식 섹션만 표시
- 1~10번 문제
- 6문제마다 페이지 나눔 (1~6번, 7~10번)
- 서술형 섹션 없음
```

### 2. 서술형 문제만 있는 경우
```
AI 요청: "중학교 1학년 수학 서술형 문제 8개 만들어줘"

결과:
- 서술형 섹션만 표시
- 1~8번 문제
- 5문제마다 페이지 나눔 (1~5번, 6~8번)
- 객관식 섹션 없음
```

### 3. 객관식 + 서술형 혼합
```
AI 요청: "객관식 5문제, 서술형 3문제 만들어줘"

결과:
- 객관식 섹션: 1~5번
- 서술형 섹션: 1~3번 (새 페이지에서 시작)
- 각 섹션 독립적으로 1번부터 번호 매김
```

### 4. 학원 이름 수정
```
1. 문제지 열림 (기본: "꾸메땅학원")
2. 학원 이름 클릭
3. "서울특별시 강남구 역삼동 수학학원"으로 수정
4. 인쇄 → 수정된 이름으로 출력
```

---

## 📝 코드 변경 사항

### 파일: `src/app/ai-chat/page.tsx`

#### 1. 문제 타입 필드 추가
```typescript
// Before
const extractedProblems: { number: number; content: string; hasAnswer: boolean }[] = [];

// After
const extractedProblems: { 
  number: number; 
  content: string; 
  hasAnswer: boolean; 
  type: 'multiple' | 'descriptive'  // ⭐ 추가
}[] = [];
```

#### 2. 객관식 판별 로직 추가
```typescript
// 객관식 문제인지 판단
const isMultipleChoice = /[①②③④⑤]|[\(（]?[1-5][\)）]\s*[^\d]/.test(problemContent);

// 타입 지정
type: isMultipleChoice ? 'multiple' : 'descriptive'
```

#### 3. 문제 분리 및 재정렬
```typescript
// 객관식과 서술형 분리
const multipleChoiceProblems = extractedProblems.filter(p => p.type === 'multiple');
const descriptiveProblems = extractedProblems.filter(p => p.type === 'descriptive');

// 각 섹션별 1번부터 재정렬
multipleChoiceProblems.forEach((p, index) => {
  p.number = index + 1;
});
descriptiveProblems.forEach((p, index) => {
  p.number = index + 1;
});
```

#### 4. HTML 템플릿 개선
- ✅ 편집 가능한 학원 이름 (`contenteditable`)
- ✅ 섹션 제목 추가 (객관식/서술형)
- ✅ 조건부 렌더링 (각 섹션 존재 여부 확인)
- ✅ 페이지 나눔 로직 (객관식 6개, 서술형 5개)
- ✅ JavaScript로 학원 이름 클릭 시 전체 선택

---

## 🚀 배포 정보

- **Commit**: [커밋 해시]
- **Branch**: `main`
- **Files Changed**: 1 (src/app/ai-chat/page.tsx)
- **Deployment**: Cloudflare Pages (자동 배포)
- **URL**: https://superplacestudy.pages.dev/ai-chat

---

## ✅ 체크리스트

- [x] 학원 이름 편집 가능 (contenteditable)
- [x] 객관식/서술형 자동 분류
- [x] 섹션 제목 표시
- [x] 문제 번호 1번부터 재정렬
- [x] 객관식 6문제/페이지
- [x] 서술형 5문제/페이지
- [x] 페이지 자동 나눔
- [x] 인쇄 시 편집 테두리 제거
- [x] 로그 출력 개선

---

## 💡 추가 참고 사항

### 문제 길이 제한
- **최소**: 5자 (너무 짧은 문제 제외)
- **최대**: 800자 (이전 500자 → 800자 확장, 선택지 포함)

### 페이지 나눔 조건
```typescript
// 객관식: 마지막 문제가 아니고, 6의 배수일 때
${(index + 1) % 6 === 0 && index < multipleChoiceProblems.length - 1 ? '<div class="page-break"></div>' : ''}

// 서술형: 마지막 문제가 아니고, 5의 배수일 때
${(index + 1) % 5 === 0 && index < descriptiveProblems.length - 1 ? '<div class="page-break"></div>' : ''}
```

### 인쇄 미리보기
- 인쇄 전 반드시 "미리보기"로 확인
- 페이지 나눔이 적절한지 확인
- 학원 이름 수정 확인

---

**모든 요구사항이 100% 구현되었습니다!** ✅🎉
