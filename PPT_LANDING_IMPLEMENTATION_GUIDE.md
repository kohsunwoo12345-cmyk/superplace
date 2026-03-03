# PPT 및 랜딩페이지 개선 구현 가이드

## ✅ 완료된 작업

### 1. director_limitations API 확장
- ✅ `landing_page_html_direct_edit` 필드 추가 (INTEGER DEFAULT 0)
- ✅ GET/POST API 모두 업데이트
- ✅ 기본값 0 (비활성), 1로 설정 시 HTML 직접 편집 권한 부여

**사용법 (관리자가 SQL로 직접 설정)**:
```sql
-- 특정 학원장에게 HTML 편집 권한 부여
INSERT INTO director_limitations (
  director_id, academy_id, landing_page_html_direct_edit
) VALUES (123, 456, 1);

-- 또는 기존 레코드 업데이트
UPDATE director_limitations 
SET landing_page_html_direct_edit = 1 
WHERE director_id = 123;
```

**API로 설정** (선택사항):
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/director-limitations \
  -H "Content-Type: application/json" \
  -d '{
    "director_id": 123,
    "academy_id": 456,
    "landing_page_html_direct_edit": 1
  }'
```

---

## 📋 PPT 제작 - 변수 기반 8-20페이지 자동 생성 시스템

### 변수 정의 (50개)

```typescript
// src/types/ppt-variables.ts
export interface PPTVariables {
  // ========== 기본 정보 (5개) ==========
  academyName: string;          // 학원명
  title: string;                // 제목
  subtitle: string;             // 부제목
  date: string;                 // 날짜
  presenter: string;            // 발표자

  // ========== 학생 기본 정보 (10개) ==========
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

  // ========== 성적 정보 (15개) ==========
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

  // ========== 학습 분석 (10개) ==========
  strengths: string;            // 강점 (여러 개, 줄바꿈으로 구분)
  weaknesses: string;           // 약점 (여러 개, 줄바꿈으로 구분)
  studyHabits: string;          // 학습 습관
  concentration: string;        // 집중력
  participation: string;        // 참여도
  homework: string;             // 숙제 완성도
  attitude: string;             // 학습 태도
  progressRate: string;         // 진도율
  understandingLevel: string;   // 이해도
  recommendations: string;      // 추천사항

  // ========== 목표 및 계획 (7개) ==========
  shortTermGoal: string;        // 단기 목표 (1개월)
  midTermGoal: string;          // 중기 목표 (3개월)
  longTermGoal: string;         // 장기 목표 (6개월)
  actionPlan1: string;          // 실행 계획 1
  actionPlan2: string;          // 실행 계획 2
  actionPlan3: string;          // 실행 계획 3
  expectedOutcome: string;      // 기대 성과

  // ========== 학부모 메시지 (3개) ==========
  teacherComment: string;       // 선생님 의견
  encouragement: string;        // 격려 문구
  parentAdvice: string;         // 학부모님께 드리는 말씀
}
```

### 사용 예시

```typescript
// 예시 데이터
const studentData: PPTVariables = {
  // 기본 정보
  academyName: "서울수학학원",
  title: "김민수 학생 학습 성장 보고서",
  subtitle: "2026년 3월 월간 학습 리포트",
  date: "2026년 3월 3일",
  presenter: "이선생님",

  // 학생 정보
  studentName: "김민수",
  studentGrade: "중학교 2학년",
  studentClass: "A반",
  studentNumber: "2024001",
  studentPhone: "010-1234-5678",
  parentName: "김학부모",
  parentPhone: "010-8765-4321",
  enrollmentDate: "2024-03-01",
  attendanceRate: "95%",
  totalClasses: "40",

  // 성적 정보
  koreanScore: "85",
  mathScore: "92",
  englishScore: "88",
  scienceScore: "90",
  socialScore: "87",
  averageScore: "88.4",
  totalScore: "442",
  rank: "5",
  grade: "A",
  previousAverage: "82.0",
  scoreChange: "+6.4",
  rankChange: "+3",
  strongestSubject: "수학",
  weakestSubject: "국어",
  improvementRate: "7.8%",

  // 학습 분석
  strengths: "수학적 사고력 우수\n문제 해결 능력 뛰어남\n꾸준한 학습 태도",
  weaknesses: "국어 독해 속도 개선 필요\n영어 듣기 연습 부족",
  studyHabits: "매일 2시간 자기주도학습",
  concentration: "높음 (90%)",
  participation: "적극적",
  homework: "100% 완성",
  attitude: "성실하고 적극적",
  progressRate: "95%",
  understandingLevel: "높음",
  recommendations: "국어 독해 연습 강화\n영어 듣기 매일 30분 권장",

  // 목표 및 계획
  shortTermGoal: "다음 시험 수학 100점 달성",
  midTermGoal: "전체 평균 90점 이상 유지",
  longTermGoal: "과학고 진학 준비",
  actionPlan1: "국어 독해 문제집 매일 10문제",
  actionPlan2: "영어 듣기 매일 30분 연습",
  actionPlan3: "수학 심화 문제 주 3회",
  expectedOutcome: "다음 시험 전과목 90점 이상",

  // 학부모 메시지
  teacherComment: "꾸준한 노력으로 성적이 크게 향상되었습니다. 국어와 영어에 조금 더 집중하면 더 좋은 결과를 기대할 수 있습니다.",
  encouragement: "민수는 매우 성실한 학생입니다. 지금처럼만 하면 목표를 충분히 달성할 수 있습니다!",
  parentAdvice: "가정에서도 국어 독서 시간을 늘려주시면 큰 도움이 될 것입니다."
};

// PPT 생성
createPPT(studentData);
```

### PPT 페이지 구성 (20페이지)

1. **표지** - 제목, 학생명, 날짜, 발표자
2. **목차** - 발표 내용 개요
3. **학생 소개** - 기본 정보, 출석률, 등록일
4. **성적 요약** - 과목별 점수 테이블
5. **성적 비교** - 이전 vs 현재 (막대 그래프)
6. **등수 변화** - 등수 추이 (꺾은선 그래프)
7. **과목별 분석 1** - 국어, 수학
8. **과목별 분석 2** - 영어, 과학, 사회
9. **강점 분석** - 잘하는 과목/영역
10. **약점 분석** - 개선 필요 과목/영역
11. **학습 태도 평가** - 참여도, 숙제, 집중력, 태도
12. **진도 및 이해도** - 진도율, 이해도 차트
13. **단기 목표** - 1개월 목표 및 실행 계획
14. **중기 목표** - 3개월 목표 및 마일스톤
15. **장기 목표** - 6개월 비전 및 전략
16. **액션 플랜** - 구체적 실행 아이템
17. **선생님 코멘트** - 피드백 및 조언
18. **학부모 메시지** - 격려 및 당부 말씀
19. **Q&A** - 질의응답 슬라이드
20. **마무리** - 감사 인사 및 연락처

---

## 🎨 PPT 구현 코드 샘플

```typescript
// src/utils/ppt-generator.ts
import { PPTVariables } from '@/types/ppt-variables';

export function createDetailedPPT(data: PPTVariables) {
  if (!window.PptxGenJS) {
    throw new Error('PptxGenJS not loaded');
  }

  const pptx = new window.PptxGenJS();
  
  // 슬라이드 1: 표지
  const titleSlide = pptx.addSlide();
  titleSlide.addText(data.title, {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 44, bold: true, color: '363636', align: 'center'
  });
  titleSlide.addText(data.subtitle, {
    x: 0.5, y: 3.5, w: 9, h: 0.8,
    fontSize: 24, color: '666666', align: 'center'
  });
  titleSlide.addText(data.studentName, {
    x: 0.5, y: 4.5, w: 9, h: 0.6,
    fontSize: 20, color: '999999', align: 'center'
  });
  titleSlide.addText(`${data.date} | ${data.presenter}`, {
    x: 0.5, y: 6.5, w: 9, h: 0.4,
    fontSize: 14, color: 'AAAAAA', align: 'center'
  });

  // 슬라이드 2: 목차
  const tocSlide = pptx.addSlide();
  tocSlide.addText('목차', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '363636'
  });
  const tocItems = [
    '1. 학생 소개',
    '2. 성적 분석',
    '3. 강점 및 약점',
    '4. 학습 태도 평가',
    '5. 목표 설정 및 계획',
    '6. 선생님 코멘트'
  ];
  tocSlide.addText(tocItems, {
    x: 1, y: 2, w: 8, h: 4,
    fontSize: 18, bullet: true, color: '555555'
  });

  // 슬라이드 3: 학생 소개
  const introSlide = pptx.addSlide();
  introSlide.addText('학생 소개', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '363636'
  });
  
  const studentInfo = [
    `이름: ${data.studentName}`,
    `학년: ${data.studentGrade}`,
    `반: ${data.studentClass}`,
    `학번: ${data.studentNumber}`,
    `출석률: ${data.attendanceRate}`,
    `총 수업 수: ${data.totalClasses}회`,
    `등록일: ${data.enrollmentDate}`
  ];
  
  introSlide.addText(studentInfo, {
    x: 1, y: 2, w: 8, h: 4.5,
    fontSize: 18, bullet: true, color: '555555'
  });

  // 슬라이드 4: 성적 요약 (테이블)
  const scoreSlide = pptx.addSlide();
  scoreSlide.addText('성적 요약', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '363636'
  });
  
  const scoreTable = [
    [
      { text: '과목', options: { bold: true, fill: '4472C4', color: 'FFFFFF' } },
      { text: '점수', options: { bold: true, fill: '4472C4', color: 'FFFFFF' } },
      { text: '이전 대비', options: { bold: true, fill: '4472C4', color: 'FFFFFF' } }
    ],
    ['국어', data.koreanScore, data.scoreChange],
    ['수학', data.mathScore, data.scoreChange],
    ['영어', data.englishScore, data.scoreChange],
    ['과학', data.scienceScore, data.scoreChange],
    ['사회', data.socialScore, data.scoreChange],
    [
      { text: '평균', options: { bold: true } },
      { text: data.averageScore, options: { bold: true, color: '0070C0' } },
      { text: data.scoreChange, options: { bold: true, color: data.scoreChange.startsWith('+') ? '00B050' : 'FF0000' } }
    ]
  ];
  
  scoreSlide.addTable(scoreTable, {
    x: 1.5, y: 2, w: 7, h: 4,
    fontSize: 16, align: 'center', valign: 'middle'
  });

  // 슬라이드 5: 등수 및 등급
  const rankSlide = pptx.addSlide();
  rankSlide.addText('등수 및 등급', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '363636'
  });
  
  rankSlide.addText(`현재 등수: ${data.rank}등`, {
    x: 1, y: 2.5, w: 8, h: 0.8,
    fontSize: 36, bold: true, color: '0070C0', align: 'center'
  });
  
  rankSlide.addText(`등급: ${data.grade}`, {
    x: 1, y: 3.5, w: 8, h: 0.6,
    fontSize: 28, color: '00B050', align: 'center'
  });
  
  rankSlide.addText(`변화: ${data.rankChange}`, {
    x: 1, y: 4.5, w: 8, h: 0.5,
    fontSize: 20, color: data.rankChange.startsWith('+') ? '00B050' : 'FF0000', align: 'center'
  });

  // 슬라이드 6: 강점 분석
  const strengthSlide = pptx.addSlide();
  strengthSlide.addText('강점 분석', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '00B050'
  });
  
  strengthSlide.addText(`가장 강한 과목: ${data.strongestSubject}`, {
    x: 1, y: 1.8, w: 8, h: 0.6,
    fontSize: 22, bold: true, color: '0070C0'
  });
  
  const strengths = data.strengths.split('\n');
  strengthSlide.addText(strengths, {
    x: 1, y: 2.8, w: 8, h: 3.5,
    fontSize: 18, bullet: { code: '2713' }, color: '555555'
  });

  // 슬라이드 7: 약점 분석
  const weaknessSlide = pptx.addSlide();
  weaknessSlide.addText('개선 필요 영역', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: 'FF6B6B'
  });
  
  weaknessSlide.addText(`개선 필요 과목: ${data.weakestSubject}`, {
    x: 1, y: 1.8, w: 8, h: 0.6,
    fontSize: 22, bold: true, color: 'C00000'
  });
  
  const weaknesses = data.weaknesses.split('\n');
  weaknessSlide.addText(weaknesses, {
    x: 1, y: 2.8, w: 8, h: 3.5,
    fontSize: 18, bullet: true, color: '555555'
  });

  // 슬라이드 8: 학습 태도 평가
  const attitudeSlide = pptx.addSlide();
  attitudeSlide.addText('학습 태도 평가', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '363636'
  });
  
  const attitudeData = [
    ['항목', '평가'],
    ['참여도', data.participation],
    ['숙제 완성도', data.homework],
    ['집중력', data.concentration],
    ['학습 태도', data.attitude],
    ['이해도', data.understandingLevel]
  ];
  
  attitudeSlide.addTable(attitudeData, {
    x: 1.5, y: 2, w: 7, h: 3.5,
    fontSize: 16, align: 'center', valign: 'middle',
    rowH: 0.7
  });

  // 슬라이드 9: 단기 목표
  const shortGoalSlide = pptx.addSlide();
  shortGoalSlide.addText('단기 목표 (1개월)', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '4472C4'
  });
  
  shortGoalSlide.addText(data.shortTermGoal, {
    x: 1, y: 2, w: 8, h: 1,
    fontSize: 24, bold: true, color: '0070C0', align: 'center'
  });
  
  const actionPlans = [
    data.actionPlan1,
    data.actionPlan2,
    data.actionPlan3
  ].filter(p => p);
  
  shortGoalSlide.addText(actionPlans, {
    x: 1, y: 3.5, w: 8, h: 2.5,
    fontSize: 18, bullet: { code: '27A4' }, color: '555555'
  });

  // 슬라이드 10: 중기 목표
  const midGoalSlide = pptx.addSlide();
  midGoalSlide.addText('중기 목표 (3개월)', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '70AD47'
  });
  
  midGoalSlide.addText(data.midTermGoal, {
    x: 1, y: 2, w: 8, h: 1.2,
    fontSize: 22, bold: true, color: '00B050', align: 'center'
  });

  // 슬라이드 11: 장기 목표
  const longGoalSlide = pptx.addSlide();
  longGoalSlide.addText('장기 목표 (6개월)', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: 'FFC000'
  });
  
  longGoalSlide.addText(data.longTermGoal, {
    x: 1, y: 2, w: 8, h: 1.2,
    fontSize: 22, bold: true, color: 'C65911', align: 'center'
  });
  
  longGoalSlide.addText(`기대 성과: ${data.expectedOutcome}`, {
    x: 1, y: 4, w: 8, h: 1,
    fontSize: 18, color: '555555', align: 'center'
  });

  // 슬라이드 12: 선생님 코멘트
  const commentSlide = pptx.addSlide();
  commentSlide.addText('선생님 코멘트', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '7030A0'
  });
  
  commentSlide.addText(data.teacherComment, {
    x: 1, y: 2, w: 8, h: 2,
    fontSize: 18, color: '555555', italic: true
  });
  
  commentSlide.addText(data.encouragement, {
    x: 1, y: 4.5, w: 8, h: 1.5,
    fontSize: 20, bold: true, color: '0070C0', align: 'center'
  });

  // 슬라이드 13: 학부모 메시지
  const parentSlide = pptx.addSlide();
  parentSlide.addText('학부모님께', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: '44546A'
  });
  
  parentSlide.addText(data.parentAdvice, {
    x: 1, y: 2.5, w: 8, h: 3,
    fontSize: 18, color: '555555'
  });

  // 슬라이드 14: 마무리
  const endSlide = pptx.addSlide();
  endSlide.addText('감사합니다', {
    x: 0.5, y: 2.5, w: 9, h: 1,
    fontSize: 44, bold: true, color: '363636', align: 'center'
  });
  
  endSlide.addText(data.academyName, {
    x: 0.5, y: 4, w: 9, h: 0.6,
    fontSize: 24, color: '666666', align: 'center'
  });
  
  endSlide.addText(data.presenter, {
    x: 0.5, y: 5, w: 9, h: 0.4,
    fontSize: 18, color: '999999', align: 'center'
  });

  // PPT 다운로드
  const filename = `${data.studentName}_학습보고서_${data.date.replace(/[^0-9]/g, '')}.pptx`;
  pptx.writeFile({ fileName: filename });
  
  return { success: true, filename };
}
```

---

## 💡 사용 방법

### 1. PPT 생성
```typescript
import { createDetailedPPT } from '@/utils/ppt-generator';
import type { PPTVariables } from '@/types/ppt-variables';

// 데이터 준비
const data: PPTVariables = { /* ... 50개 변수 */ };

// PPT 생성
const result = createDetailedPPT(data);
console.log(`생성 완료: ${result.filename}`);
```

### 2. 랜딩페이지 HTML 편집 권한 확인
```typescript
// 현재 사용자의 권한 확인
const user = JSON.parse(localStorage.getItem('user') || '{}');
const response = await fetch(`/api/admin/director-limitations?directorId=${user.id}`);
const { limitation } = await response.json();

if (limitation.landing_page_html_direct_edit === 1) {
  // HTML 직접 편집 가능
  showHtmlEditorButton();
}
```

---

## 📝 다음 단계

1. **즉시**: 이 가이드를 참고하여 PPT 기능 구현
2. **단기**: 랜딩페이지 HTML 에디터 UI 구축
3. **중기**: 차트/그래프 자동 생성 기능 추가
4. **장기**: AI 기반 자동 보고서 생성

---

**작성일**: 2026-03-03  
**파일**: PPT_LANDING_IMPLEMENTATION_GUIDE.md  
**버전**: 1.0
