# PPT 제작 및 랜딩페이지 HTML 편집 권한 개선 계획

## 📋 요구사항

### 1. PPT 제작 템플릿 변수 대폭 확대
- **현재**: 기본 텍스트 기반 PPT 생성
- **목표**: 8-20페이지의 전문적인 PPT를 변수만으로 쉽게 제작
- **변수 종류**:
  - 기본 정보: 학원명, 제목, 부제목, 날짜, 발표자
  - 학생 정보: 이름, 학년, 반, 출석률, 성적
  - 성적 데이터: 과목별 점수, 등급, 성적 추이
  - 학습 분석: 강점, 약점, 개선사항, 추천사항
  - 목표 설정: 단기/중기/장기 목표
  - 학부모 메시지: 격려 문구, 상담 내용
  - 이미지/차트: 성적 그래프, 출석 차트

### 2. 랜딩페이지 HTML 직접 편집 권한
- **현재**: 템플릿 기반 랜딩페이지만 생성 가능
- **목표**: 관리자가 특정 학원장에게 HTML 직접 입력 권한 부여
- **기능**:
  - 관리자가 director_limitations에서 권한 설정
  - 권한 있는 학원장은 HTML을 직접 입력하여 랜딩페이지 생성
  - 권한 없는 학원장은 기존 템플릿 방식 유지

---

## 🎯 구현 계획

### Phase 1: 데이터베이스 스키마 확장

#### A. director_limitations 테이블 확장
```sql
ALTER TABLE director_limitations ADD COLUMN landing_page_html_direct_edit INTEGER DEFAULT 0;
```

**필드 설명**:
- `landing_page_html_direct_edit`: HTML 직접 편집 권한 (0=비활성, 1=활성)

---

### Phase 2: PPT 템플릿 변수 시스템 개선

#### A. PPT 변수 정의 (총 50개 이상)

```typescript
interface PPTVariables {
  // 기본 정보 (5개)
  academyName: string;          // 학원명
  title: string;                // 제목
  subtitle: string;             // 부제목
  date: string;                 // 날짜
  presenter: string;            // 발표자

  // 학생 기본 정보 (10개)
  studentName: string;          // 학생 이름
  studentGrade: string;         // 학년
  studentClass: string;         // 반
  studentNumber: string;        // 학번
  studentPhone: string;         // 전화번호
  parentName: string;           // 학부모 이름
  parentPhone: string;          // 학부모 전화
  enrollmentDate: string;       // 등록일
  attendanceRate: string;       // 출석률
  totalClasses: string;         // 총 수업 수

  // 성적 정보 (15개)
  koreanScore: string;          // 국어 점수
  mathScore: string;            // 수학 점수
  englishScore: string;         // 영어 점수
  scienceScore: string;         // 과학 점수
  socialScore: string;          // 사회 점수
  averageScore: string;         // 평균 점수
  totalScore: string;           // 총점
  rank: string;                 // 등수
  grade: string;                // 등급
  previousAverage: string;      // 이전 평균
  scoreChange: string;          // 점수 변화
  rankChange: string;           // 등수 변화
  strongestSubject: string;     // 가장 강한 과목
  weakestSubject: string;       // 가장 약한 과목
  improvementRate: string;      // 향상률

  // 학습 분석 (10개)
  strengths: string;            // 강점 (여러 개)
  weaknesses: string;           // 약점 (여러 개)
  studyHabits: string;          // 학습 습관
  concentration: string;        // 집중력
  participation: string;        // 참여도
  homework: string;             // 숙제 완성도
  attitude: string;             // 학습 태도
  progressRate: string;         // 진도율
  understandingLevel: string;   // 이해도
  recommendations: string;      // 추천사항

  // 목표 및 계획 (7개)
  shortTermGoal: string;        // 단기 목표 (1개월)
  midTermGoal: string;          // 중기 목표 (3개월)
  longTermGoal: string;         // 장기 목표 (6개월)
  actionPlan1: string;          // 실행 계획 1
  actionPlan2: string;          // 실행 계획 2
  actionPlan3: string;          // 실행 계획 3
  expectedOutcome: string;      // 기대 성과

  // 학부모 메시지 (3개)
  teacherComment: string;       // 선생님 의견
  encouragement: string;        // 격려 문구
  parentAdvice: string;         // 학부모님께 드리는 말씀

  // 추가 정보 (5개)
  specialNotes: string;         // 특이사항
  nextClass: string;            // 다음 수업 일정
  consultationSchedule: string; // 상담 일정
  events: string;               // 행사 안내
  materials: string;            // 준비물
}
```

#### B. PPT 템플릿 (8-20페이지)

**페이지 구성**:
1. **표지 슬라이드**: 제목, 학생명, 날짜
2. **목차 슬라이드**: 발표 구성
3. **학생 소개**: 기본 정보, 출석률
4. **성적 요약**: 과목별 점수 표
5. **성적 추이**: 그래프 (이전 vs 현재)
6. **강점 분석**: 잘하는 과목/영역
7. **약점 분석**: 개선 필요 과목/영역
8. **학습 태도**: 참여도, 숙제, 집중력
9. **단기 목표**: 1개월 목표 및 계획
10. **중기 목표**: 3개월 목표 및 계획
11. **장기 목표**: 6개월 목표 및 비전
12. **실행 계획**: 구체적 액션 아이템
13. **선생님 코멘트**: 피드백 및 조언
14. **학부모 메시지**: 격려 및 당부 말씀
15. **다음 일정**: 수업, 상담, 행사
16. **특이사항**: 기타 알림
17. **연락처**: 학원 정보
18. **Q&A**: 질의응답
19. **감사 인사**
20. **마무리 슬라이드**

---

### Phase 3: 랜딩페이지 HTML 직접 편집 권한 시스템

#### A. API 수정 (functions/api/admin/director-limitations.ts)

**1. 테이블 스키마 업데이트**
```typescript
CREATE TABLE IF NOT EXISTS director_limitations (
  ...
  landing_page_html_direct_edit INTEGER DEFAULT 0,
  ...
)
```

**2. GET 응답에 권한 포함**
```typescript
{
  limitation: {
    ...
    landing_page_html_direct_edit: 0 | 1
  }
}
```

**3. POST 요청에 권한 저장**
```typescript
UPDATE director_limitations SET
  ...
  landing_page_html_direct_edit = ?
WHERE director_id = ?
```

#### B. 관리자 UI 수정 (src/app/dashboard/admin/director-limitations/page.tsx)

**추가 UI 요소**:
```tsx
<div className="flex items-center justify-between">
  <div>
    <Label htmlFor="landing_page_html_direct_edit">
      랜딩페이지 HTML 직접 편집 권한
    </Label>
    <p className="text-sm text-gray-500">
      학원장이 HTML을 직접 입력하여 랜딩페이지를 만들 수 있습니다
    </p>
  </div>
  <Switch
    id="landing_page_html_direct_edit"
    checked={limitations.landing_page_html_direct_edit === 1}
    onCheckedChange={(checked) => 
      setLimitations({
        ...limitations, 
        landing_page_html_direct_edit: checked ? 1 : 0
      })
    }
  />
</div>
```

#### C. 랜딩페이지 생성 UI 수정 (src/app/dashboard/admin/landing-pages/page.tsx)

**1. 권한 확인 로직**
```typescript
useEffect(() => {
  const fetchPermissions = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await fetch(
      `/api/admin/director-limitations?directorId=${user.id}`
    );
    const data = await response.json();
    setHasHtmlEditPermission(data.limitation.landing_page_html_direct_edit === 1);
  };
  fetchPermissions();
}, []);
```

**2. HTML 직접 입력 버튼 추가**
```tsx
{hasHtmlEditPermission && (
  <Button onClick={() => router.push('/dashboard/admin/landing-pages/create-html')}>
    <Code className="w-4 h-4 mr-2" />
    HTML 직접 입력
  </Button>
)}
```

#### D. HTML 직접 입력 페이지 생성 (src/app/dashboard/admin/landing-pages/create-html/page.tsx)

**기능**:
- 코드 에디터 (Monaco Editor 또는 Textarea)
- 실시간 미리보기
- HTML 유효성 검사
- 저장 및 발행

**UI 구성**:
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <h3>HTML 편집기</h3>
    <Textarea
      value={htmlCode}
      onChange={(e) => setHtmlCode(e.target.value)}
      rows={30}
      className="font-mono"
    />
  </div>
  <div>
    <h3>미리보기</h3>
    <iframe
      srcDoc={htmlCode}
      className="w-full h-full border"
    />
  </div>
</div>
```

---

## 📊 예시 사용 시나리오

### 시나리오 1: PPT 제작 (변수 사용)
```typescript
const studentData = {
  academyName: "서울수학학원",
  title: "김민수 학생 학습 보고서",
  subtitle: "2026년 3월 월간 학습 리포트",
  date: "2026-03-03",
  presenter: "이선생님",
  studentName: "김민수",
  studentGrade: "중2",
  studentClass: "A반",
  attendanceRate: "95%",
  mathScore: "92",
  englishScore: "88",
  averageScore: "90",
  rank: "5",
  strengths: "수학적 사고력 우수, 문제 해결력 뛰어남",
  weaknesses: "영어 독해 속도 개선 필요",
  shortTermGoal: "다음 시험 수학 100점",
  teacherComment: "꾸준한 노력으로 성적이 향상되고 있습니다!",
  // ... 나머지 50개 변수
};

// 자동으로 8-20페이지 PPT 생성
createPPT(studentData);
```

### 시나리오 2: 랜딩페이지 HTML 직접 편집
```typescript
// 관리자가 학원장에게 권한 부여
await fetch('/api/admin/director-limitations', {
  method: 'POST',
  body: JSON.stringify({
    director_id: 123,
    academy_id: 456,
    landing_page_html_direct_edit: 1  // 권한 활성화
  })
});

// 학원장이 HTML로 랜딩페이지 생성
const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <title>우리 학원 소개</title>
    <style>
      /* 커스텀 스타일 */
    </style>
  </head>
  <body>
    <h1>맞춤형 랜딩페이지</h1>
    <p>완전 자유로운 디자인!</p>
  </body>
</html>
`;

await saveLandingPage({ content: htmlContent, type: 'html' });
```

---

## ✅ 구현 체크리스트

### PPT 템플릿 변수 확장
- [ ] PPTVariables 인터페이스 정의 (50개 변수)
- [ ] 변수 입력 폼 UI 생성
- [ ] 페이지별 템플릿 정의 (8-20페이지)
- [ ] 변수 → PPT 변환 로직 구현
- [ ] 그래프/차트 자동 생성
- [ ] 이미지 삽입 기능

### 랜딩페이지 HTML 직접 편집
- [x] director_limitations 테이블 스키마 확장
- [ ] API GET에 권한 포함
- [ ] API POST에 권한 저장
- [ ] 관리자 UI에 권한 설정 추가
- [ ] 랜딩페이지 목록에 HTML 편집 버튼 추가
- [ ] HTML 직접 입력 페이지 생성
- [ ] 코드 에디터 통합
- [ ] 실시간 미리보기 구현
- [ ] HTML 유효성 검사
- [ ] 저장 및 발행 기능

---

## 🔧 기술 스택

### PPT 생성
- **PptxGenJS**: PowerPoint 생성 라이브러리
- **Chart.js** (선택): 차트 이미지 생성
- **Canvas API**: 그래프 렌더링

### HTML 편집기
- **Monaco Editor** (추천): VS Code 에디터
- **CodeMirror** (대안): 경량 코드 에디터
- **Textarea** (최소): 기본 텍스트 입력

### 미리보기
- **iframe**: HTML 렌더링
- **DOMPurify**: XSS 방지

---

## 📝 다음 단계

1. **즉시**: director_limitations 스키마 확장
2. **단기**: API 및 UI 구현
3. **중기**: PPT 템플릿 변수 시스템 구축
4. **장기**: 고급 기능 (차트, 이미지 자동 생성)

---

**작성일**: 2026-03-03  
**작성자**: AI Assistant  
**문서 버전**: 1.0
