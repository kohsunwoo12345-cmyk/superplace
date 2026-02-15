# 유사문제 출제 형식 선택 기능

## ✨ 새로운 기능

유사문제 출제 시 **객관식**과 **서술형**을 자유롭게 선택하거나 섞어서 출제할 수 있습니다!

---

## 🎯 사용 방법

### 1. 학생 상세 페이지 접속
```
/dashboard/students/detail?id={학생ID}
```

### 2. 유사문제 출제 버튼 클릭
- 약점 분석 탭에서 "📝 유사문제 출제" 버튼 클릭

### 3. 문제 형식 선택

#### 옵션 A: 객관식만 출제
```
✓ 객관식 (4지선다)
  서술형 (주관식)
```
- 모든 문제가 4지선다 객관식으로 생성됩니다
- 정답 번호(1, 2, 3, 4)와 풀이가 제공됩니다

#### 옵션 B: 서술형만 출제
```
  객관식 (4지선다)
✓ 서술형 (주관식)
```
- 모든 문제가 주관식(서술형)으로 생성됩니다
- 답안 작성 공간이 제공됩니다

#### 옵션 C: 혼합 출제 (추천) ⭐
```
✓ 객관식 (4지선다)
✓ 서술형 (주관식)
```
- 객관식과 서술형이 약 50:50 비율로 섞여서 생성됩니다
- 다양한 유형의 문제로 학습 효과 극대화

### 4. 추가 옵션 설정

#### 문제 유형
- ✓ 개념 문제
- ✓ 유형 문제
- ✓ 심화 문제

#### 문제 수
- 1~20개 범위에서 선택

#### 출제 개념
- 약점 분석에서 도출된 개념 중 선택

### 5. 문제 생성 및 인쇄
- "문제 생성 및 인쇄" 버튼 클릭
- AI가 선택한 형식에 맞게 문제 자동 생성
- 시험지와 답지 출력

---

## 📊 출제 예시

### 케이스 1: 객관식만 (5문제)
```
문제 1. 다음 중 이차방정식의 판별식이 양수일 때의 근의 개수는?
① 0개
② 1개
③ 2개  ✓
④ 무수히 많음

문제 2. ...
```

### 케이스 2: 서술형만 (5문제)
```
문제 1. 이차방정식 x² - 5x + 6 = 0을 인수분해를 이용하여 풀고, 
풀이 과정을 상세히 서술하시오.

답안:
_________________________________________________
_________________________________________________
_________________________________________________
```

### 케이스 3: 혼합 출제 (5문제)
```
문제 1. (객관식) 다음 중 이차방정식의 판별식이 양수일 때의 근의 개수는?
① 0개
② 1개
③ 2개  ✓
④ 무수히 많음

문제 2. (서술형) 이차방정식 x² - 5x + 6 = 0을 인수분해를 이용하여 풀고, 
풀이 과정을 상세히 서술하시오.

답안:
_________________________________________________
_________________________________________________

문제 3. (객관식) ...

문제 4. (서술형) ...

문제 5. (객관식) ...
```

---

## 🔧 기술 구현

### Frontend (UI)

**파일**: `src/app/dashboard/students/detail/page.tsx`

#### 추가된 상태
```typescript
const [selectedQuestionFormats, setSelectedQuestionFormats] = useState<string[]>([
  'multiple_choice', 
  'open_ended'
]); // 기본값: 둘 다 선택
```

#### 토글 함수
```typescript
const toggleQuestionFormat = (format: string) => {
  setSelectedQuestionFormats(prev =>
    prev.includes(format)
      ? prev.filter(f => f !== format)
      : [...prev, format]
  );
};
```

#### UI 컴포넌트
```tsx
<div>
  <label className="block text-sm font-semibold mb-2">
    문제 형식 (여러 개 선택 가능)
  </label>
  <div className="grid grid-cols-2 gap-2">
    <button
      onClick={() => toggleQuestionFormat('multiple_choice')}
      className={/* 스타일링 */}
    >
      {selectedQuestionFormats.includes('multiple_choice') && '✓ '}
      객관식 (4지선다)
    </button>
    <button
      onClick={() => toggleQuestionFormat('open_ended')}
      className={/* 스타일링 */}
    >
      {selectedQuestionFormats.includes('open_ended') && '✓ '}
      서술형 (주관식)
    </button>
  </div>
  <p className="text-xs text-gray-500 mt-2">
    {selectedQuestionFormats.length}개 형식 선택됨
    {selectedQuestionFormats.length === 2 && ' · 객관식과 서술형 혼합 출제'}
  </p>
</div>
```

### Backend (API)

**파일**: `functions/api/students/generate-problems/index.ts`

#### 파라미터 수신
```typescript
const { studentId, concepts, problemTypes, questionFormats, problemCount, studentName } = body;

// 기본값: 둘 다 선택
const formats = questionFormats && questionFormats.length > 0 
  ? questionFormats 
  : ['multiple_choice', 'open_ended'];
```

#### AI 프롬프트 생성
```typescript
const formatInstructions = formats.length === 2
  ? 'Mix both multiple choice (4 options) and open-ended questions evenly'
  : formats.includes('multiple_choice')
  ? 'ALL problems should be multiple choice with 4 options'
  : 'ALL problems should be open-ended (essay/short answer)';
```

#### 형식별 검증
```typescript
Rules:
${formats.length === 1 && formats.includes('multiple_choice') 
  ? '- ALL problems MUST be multiple choice with exactly 4 options' 
  : ''}
${formats.length === 1 && formats.includes('open_ended') 
  ? '- ALL problems MUST be open-ended (options: null, answerSpace: true)' 
  : ''}
${formats.length === 2 
  ? '- Mix multiple choice and open-ended questions approximately 50/50' 
  : ''}
```

---

## 🎨 UI 디자인

### 선택되지 않은 상태
```
┌────────────────────────────────┐
│  객관식 (4지선다)               │  ← 회색 테두리, 흰색 배경
└────────────────────────────────┘
```

### 선택된 상태
```
┌────────────────────────────────┐
│ ✓ 객관식 (4지선다)              │  ← 초록색 테두리, 초록색 배경
└────────────────────────────────┘
```

### 혼합 선택 상태
```
┌──────────────────┐  ┌──────────────────┐
│ ✓ 객관식 (4지선다) │  │ ✓ 서술형 (주관식)  │
└──────────────────┘  └──────────────────┘

2개 형식 선택됨 · 객관식과 서술형 혼합 출제
```

---

## ✅ 검증 규칙

### 필수 선택 항목
1. ✅ 최소 1개 이상의 개념 선택
2. ✅ 최소 1개 이상의 문제 유형 선택
3. ✅ 최소 1개 이상의 문제 형식 선택

### 에러 메시지
```javascript
if (selectedQuestionFormats.length === 0) {
  alert('최소 1개 이상의 문제 형식을 선택해주세요.');
  return;
}
```

---

## 📱 반응형 디자인

### 데스크톱 (>768px)
```
┌──────────────────────────────────────────────┐
│ 문제 형식 (여러 개 선택 가능)                  │
├──────────────────────┬──────────────────────┤
│ ✓ 객관식 (4지선다)     │   서술형 (주관식)     │
└──────────────────────┴──────────────────────┘
```

### 모바일 (<768px)
```
┌──────────────────────────────────┐
│ 문제 형식 (여러 개 선택 가능)      │
├──────────────────────────────────┤
│ ✓ 객관식 (4지선다)                │
├──────────────────────────────────┤
│   서술형 (주관식)                 │
└──────────────────────────────────┘
```

---

## 🚀 배포 정보

- **커밋**: `4114b3e`
- **날짜**: 2026-02-15
- **URL**: https://superplacestudy.pages.dev/dashboard/students/detail
- **상태**: 🟢 배포 완료

---

## 📚 관련 파일

### Frontend
- `src/app/dashboard/students/detail/page.tsx` - UI 컴포넌트 및 로직

### Backend
- `functions/api/students/generate-problems/index.ts` - 문제 생성 API

### 관련 문서
- `DASHBOARD_DEBUG_GUIDE.md` - 대시보드 디버깅 가이드
- `DASHBOARD_COMPLETE_SUMMARY.md` - 대시보드 완료 요약

---

## 💡 사용 팁

### 팁 1: 학습 단계별 활용
- **초급 단계**: 객관식만 선택 → 기본 개념 확인
- **중급 단계**: 혼합 선택 → 개념 이해 + 응용
- **고급 단계**: 서술형만 선택 → 서술 능력 향상

### 팁 2: 과목별 최적 조합
- **수학**: 혼합 (계산 문제 + 증명 문제)
- **과학**: 혼합 (개념 문제 + 실험 서술)
- **국어**: 서술형 위주 (독해 + 작문)
- **영어**: 혼합 (문법 + 에세이)

### 팁 3: 시험 준비
- **진단 평가**: 객관식 (빠른 확인)
- **중간 점검**: 혼합 (종합 평가)
- **최종 정리**: 서술형 (깊이 있는 이해)

---

## 🔍 트러블슈팅

### Q1: 문제 생성 버튼이 비활성화되어 있어요
**A**: 다음을 확인하세요:
- ✓ 최소 1개 이상의 개념 선택
- ✓ 최소 1개 이상의 문제 유형 선택
- ✓ 최소 1개 이상의 문제 형식 선택

### Q2: 객관식만 선택했는데 서술형이 나와요
**A**: 브라우저 캐시를 삭제하고 페이지를 새로고침하세요:
1. Ctrl+Shift+Delete (캐시 삭제)
2. F5 (페이지 새로고침)
3. 다시 문제 생성

### Q3: 혼합 출제 시 비율이 정확히 50:50이 아니에요
**A**: AI가 개념과 난이도에 따라 자동으로 최적 비율을 조정합니다. 
대략 50:50 비율이지만 ±20% 차이가 있을 수 있습니다.

---

## 📞 피드백

문제가 있거나 개선 사항이 있다면:
1. GitHub Issues에 등록
2. 대시보드 내 문의하기 기능 사용
3. 학원 관리자에게 연락

---

**마지막 업데이트**: 2026-02-15  
**작성자**: AI 개발팀  
**버전**: 1.0.0
