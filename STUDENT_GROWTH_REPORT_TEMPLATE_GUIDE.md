# 🌟 학생 성장 리포트 템플릿 - 사용 가이드

## 📋 개요

**파일명:** `STUDENT_GROWTH_REPORT_TEMPLATE.html`

아름답고 전문적인 디자인의 학생 성장 리포트 템플릿입니다.
학생의 출석, AI 학습, 숙제 현황을 상세한 성장 일기 형식으로 제공합니다.

---

## ✨ 주요 특징

### 🎨 디자인
- **그라데이션 헤더**: 보라색 그라데이션 배경
- **카드 기반 레이아웃**: 섹션별 카드 디자인
- **반응형**: 모바일/태블릿/PC 모든 기기 지원
- **애니메이션**: 호버 효과 및 프로그레스 바
- **뱃지 시스템**: 우수/좋음/개선 필요 표시

### 📊 포함 섹션

1. **헤더**
   - 학생 이름 + 학습 기간
   - 그라데이션 배경 + 이모지

2. **인트로 메시지**
   - 학부모님께 인사
   - 간단한 소개

3. **출석 현황**
   - 통계 카드 (전체 수업일, 출석, 출석률)
   - 프로그레스 바 (출석률 시각화)
   - 성장 스토리 (선생님의 코멘트)
   - 상세 데이터 테이블

4. **AI 학습 활동**
   - 통계 카드 (대화 횟수, 평균 길이, 주요 주제)
   - 하이라이트 박스 (주요 성취)
   - 상세 데이터 테이블

5. **숙제 제출 현황**
   - 통계 카드 (완료 개수, 완료율, 평균 점수)
   - 프로그레스 바 (완료율 시각화)
   - 성장 스토리
   - 상세 데이터 테이블

6. **학습 성장 일기**
   - 학생의 성장 이야기
   - 인상 깊었던 순간
   - 개선이 필요한 부분
   - 다음 목표
   - 주요 성취 하이라이트

7. **선생님의 종합 평가**
   - 선생님 이름 + 평가
   - 학부모님께 메시지

8. **마무리 메시지**
   - 축하 메시지
   - 학원 이름 + 발급일

---

## 🔧 사용 가능한 변수 (23개)

### 기본 정보
- `{{studentName}}` - 학생 이름
- `{{period}}` - 학습 기간 (예: 2024-01-01 ~ 2024-01-31)
- `{{academyName}}` - 학원 이름
- `{{issueDate}}` - 발급일 (예: 2024-01-31)

### 출석 관련
- `{{totalDays}}` - 전체 수업일 (예: 20일)
- `{{presentDays}}` - 출석 일수 (예: 19일)
- `{{absentDays}}` - 결석 일수 (예: 1일)
- `{{tardyDays}}` - 지각 일수 (예: 0일)
- `{{attendanceRate}}` - 출석률 (예: 95%)

### AI 학습 관련
- `{{aiChatCount}}` - AI 대화 횟수 (예: 45)
- `{{avgChatLength}}` - 평균 대화 길이 (예: 15개)
- `{{mainTopic}}` - 주요 질문 주제 (예: 수학)
- `{{avgResponseTime}}` - 평균 응답 시간 (예: 2분)

### 숙제 관련
- `{{homeworkCompleted}}` - 완료한 숙제 (예: 18)
- `{{homeworkRate}}` - 완료율 (예: 90%)
- `{{avgHomeworkScore}}` - 평균 점수 (예: 88)
- `{{maxHomeworkScore}}` - 최고 점수 (예: 100)
- `{{avgSubmitTime}}` - 평균 제출 시간 (예: 마감 1일 전)

### 성장 스토리 관련
- `{{impressiveMoment}}` - 가장 인상 깊었던 순간
- `{{improvementArea}}` - 개선이 필요한 부분
- `{{nextGoal}}` - 다음 목표

### 선생님 평가 관련
- `{{teacherName}}` - 선생님 이름
- `{{teacherComment}}` - 선생님 코멘트

---

## 📝 예시 데이터

```json
{
  "studentName": "김민준",
  "period": "2024년 1월 1일 ~ 1월 31일",
  "academyName": "슈퍼플레이스 학원",
  "issueDate": "2024년 2월 1일",
  
  "totalDays": "20일",
  "presentDays": "19일",
  "absentDays": "1일",
  "tardyDays": "0일",
  "attendanceRate": "95%",
  
  "aiChatCount": "45",
  "avgChatLength": "15개 메시지",
  "mainTopic": "수학 문제 풀이",
  "avgResponseTime": "2분 30초",
  
  "homeworkCompleted": "18",
  "homeworkRate": "90%",
  "avgHomeworkScore": "88",
  "maxHomeworkScore": "100",
  "avgSubmitTime": "마감 1일 전",
  
  "impressiveMoment": "어려운 수학 문제를 스스로 해결하며 자신감을 얻은 순간, AI 챗봇과 적극적으로 대화하며 궁금증을 해결하는 모습이 인상적이었습니다.",
  "improvementArea": "가끔 숙제 제출 기한을 놓치는 경우가 있어요. 시간 관리 능력을 키우면 더욱 좋을 것 같습니다.",
  "nextGoal": "다음 달에는 숙제 완료율 100%를 목표로 하고, AI 챗봇과의 대화 횟수를 50회 이상으로 늘려보세요!",
  
  "teacherName": "김선생님",
  "teacherComment": "민준이는 항상 밝은 미소로 수업에 참여하며, 모르는 것이 있으면 주저하지 않고 질문합니다. 특히 수학 문제를 풀 때 끈기 있게 도전하는 모습이 정말 인상적입니다. 앞으로도 이런 학습 태도를 유지한다면 큰 발전이 기대됩니다."
}
```

---

## 🚀 사용 방법

### 1. 템플릿 데이터베이스에 저장

**단계:**
1. https://superplacestudy.pages.dev/login 로그인
2. **HTML 템플릿 관리** 메뉴 클릭
3. "✨ 새 템플릿 만들기" 버튼
4. `STUDENT_GROWTH_REPORT_TEMPLATE.html` 내용 복사
5. 이름: `학생 성장 리포트 v1.0`
6. 설명: `상세한 성장 일기 형식의 학생 리포트`
7. HTML 코드 붙여넣기
8. "생성하기" 클릭

### 2. 랜딩페이지 생성 시 사용

**단계:**
1. **랜딩페이지 관리** 메뉴
2. "새 랜딩페이지 만들기"
3. 템플릿 선택: `학생 성장 리포트 v1.0`
4. 변수 입력:
   - 학생 이름: `김민준`
   - 학습 기간: `2024-01-01 ~ 2024-01-31`
   - 출석률: `95%`
   - ... (모든 변수 입력)
5. "생성하기" → 고유 URL 발급

### 3. 학부모님께 URL 전송

**방법:**
- 이메일 전송
- SMS 전송
- 카카오톡 전송
- 학원 앱 푸시 알림

---

## 🎨 커스터마이징 가능 항목

### 색상 변경
```css
/* 헤더 그라데이션 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
→ 원하는 색상으로 변경

/* 강조 색상 */
color: #667eea;
→ 학원 브랜드 컬러로 변경
```

### 폰트 변경
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
→ 다른 폰트로 변경 가능
```

### 섹션 순서 변경
- HTML에서 섹션 순서를 바꾸면 됩니다
- 예: 숙제 현황을 AI 학습보다 먼저 표시

### 통계 카드 추가/삭제
```html
<div class="stat-card">
  <div class="label">새로운 항목</div>
  <div class="value">{{newValue}}</div>
</div>
```

---

## 📊 성능 최적화

### 로딩 속도
- **이미지 없음**: 아이콘은 이모지 사용
- **폰트 최적화**: Google Fonts 사용
- **CSS 인라인**: 별도 파일 없이 HTML에 포함

### 모바일 최적화
- **반응형**: 모든 기기에서 최적 표시
- **터치 친화적**: 버튼 크기 충분
- **읽기 쉬움**: 폰트 크기 적절

---

## 🔍 변수 매핑 예시

### 백엔드에서 데이터 생성

```typescript
// 학생 데이터 조회
const student = await getStudent(studentId);
const attendance = await getAttendance(studentId, period);
const aiActivity = await getAIActivity(studentId, period);
const homework = await getHomework(studentId, period);

// 변수 매핑
const variables = {
  studentName: student.name,
  period: `${period.start} ~ ${period.end}`,
  academyName: academy.name,
  issueDate: new Date().toLocaleDateString('ko-KR'),
  
  totalDays: `${attendance.totalDays}일`,
  presentDays: `${attendance.presentDays}일`,
  absentDays: `${attendance.absentDays}일`,
  tardyDays: `${attendance.tardyDays}일`,
  attendanceRate: `${attendance.rate}%`,
  
  aiChatCount: `${aiActivity.chatCount}`,
  avgChatLength: `${aiActivity.avgLength}개 메시지`,
  mainTopic: aiActivity.mainTopic,
  avgResponseTime: formatTime(aiActivity.avgResponseTime),
  
  homeworkCompleted: `${homework.completed}`,
  homeworkRate: `${homework.rate}%`,
  avgHomeworkScore: `${homework.avgScore}`,
  maxHomeworkScore: `${homework.maxScore}`,
  avgSubmitTime: formatSubmitTime(homework.avgSubmitTime),
  
  impressiveMoment: generateImpressiveMoment(student, period),
  improvementArea: generateImprovementArea(student, period),
  nextGoal: generateNextGoal(student, period),
  
  teacherName: teacher.name,
  teacherComment: generateTeacherComment(student, period),
};

// HTML 템플릿 렌더링
let html = template.html;
Object.entries(variables).forEach(([key, value]) => {
  html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
});
```

---

## 🎯 활용 시나리오

### 시나리오 1: 월간 리포트
- **주기**: 매월 말일
- **대상**: 전체 학생
- **내용**: 한 달간의 학습 활동 종합

### 시나리오 2: 분기별 리포트
- **주기**: 분기 말 (3, 6, 9, 12월)
- **대상**: 전체 학생
- **내용**: 분기별 성장 비교 및 목표 설정

### 시나리오 3: 학부모 상담용
- **주기**: 상담 전
- **대상**: 상담 예정 학생
- **내용**: 현재 학습 상태 공유

### 시나리오 4: 신규 학생 유치
- **주기**: 수시
- **대상**: 예비 학부모
- **내용**: 샘플 리포트 제공 (데모 데이터)

---

## 💡 팁 & 트릭

### 1. 데이터 수집 자동화
```typescript
// 매일 밤 12시에 데이터 집계
cron.schedule('0 0 * * *', async () => {
  await aggregateStudentData();
});
```

### 2. 이메일 자동 발송
```typescript
// 월말에 자동으로 리포트 발송
cron.schedule('0 9 L * *', async () => {
  const students = await getAllStudents();
  for (const student of students) {
    const report = await generateReport(student.id);
    await sendEmail(student.parentEmail, report.url);
  }
});
```

### 3. SMS 알림
```typescript
// 리포트 생성 시 SMS 발송
await sendSMS(
  parentPhone,
  `${studentName} 학생의 학습 리포트가 생성되었습니다. ${reportUrl}`
);
```

### 4. QR 코드 생성
```typescript
import QRCode from 'qrcode';

const qrCode = await QRCode.toDataURL(reportUrl);
// 리포트 상단에 QR 코드 추가
```

---

## 📱 모바일 최적화 팁

### 가로/세로 모드 대응
```css
@media (orientation: landscape) and (max-height: 500px) {
  .header {
    padding: 30px 20px;
  }
}
```

### 터치 제스처
```javascript
// 스와이프로 섹션 이동
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
```

---

## 🔒 보안 고려사항

### 1. 접근 제한
- 고유 URL에 토큰 포함
- 토큰 만료 시간 설정 (예: 30일)
- 같은 URL로 재접속 제한

### 2. 개인정보 보호
- 민감 정보 마스킹 (전화번호, 주소 등)
- HTTPS 필수
- 데이터 암호화

### 3. 인쇄 방지 (선택)
```css
@media print {
  body::before {
    content: "인쇄가 제한된 문서입니다";
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 72px;
    opacity: 0.1;
  }
}
```

---

## 📚 추가 리소스

### 관련 문서
- `CREATE_LANDING_PAGE_TEMPLATE_TABLE.sql` - 데이터베이스 스키마
- `INFINITE_LOGIN_LOOP_FIX_FINAL.md` - 템플릿 저장 가이드
- `TEMPLATE_API_DEBUG_LOGGING_GUIDE.md` - API 디버깅 가이드

### 외부 링크
- [Noto Sans KR 폰트](https://fonts.google.com/noto/specimen/Noto+Sans+KR)
- [CSS 그라데이션 생성기](https://cssgradient.io/)
- [이모지 검색](https://emojipedia.org/)

---

## 🙏 마무리

이 템플릿은 학생의 성장을 아름답게 기록하고 학부모님과 공유하기 위해 제작되었습니다.

### 특징 요약
- ✅ 전문적인 디자인
- ✅ 23개 커스터마이징 변수
- ✅ 반응형 레이아웃
- ✅ 상세한 성장 스토리
- ✅ 사용하기 쉬운 구조

### 다음 단계
1. 템플릿 데이터베이스에 저장
2. 샘플 데이터로 테스트
3. 실제 학생 데이터로 생성
4. 학부모님께 URL 전송
5. 피드백 수집 및 개선

---

**제작:** Claude (AI Coding Agent)  
**제작일:** 2026-02-18  
**버전:** v1.0  
**라이선스:** MIT
