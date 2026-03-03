# 랜딩페이지 템플릿 변수 작동 상태 분석 보고서

**분석 일시**: 2026-03-03  
**분석자**: AI 개발팀  
**배포 URL**: https://superplacestudy.pages.dev

---

## 📋 분석 요청

> "현재 변수들이 제대로 작동하는지 파악해줘."

---

## ✅ 분석 결과 요약

### 🎯 결론

**변수 치환 메커니즘은 100% 정상 작동하지만, 대부분의 변수가 하드코딩된 기본값을 사용하고 있습니다.**

```
✅ 정상 작동: 3/15 변수 (20%)
⚠️  하드코딩: 12/15 변수 (80%)
```

---

## 📊 변수별 작동 상태

### ✅ 정상 작동 변수 (3개) - 실제 데이터 사용

| 변수 | 데이터 소스 | 현재 값 | 상태 |
|------|------------|---------|------|
| `{{title}}` | 사용자 입력 (request body) | 사용자가 입력한 제목 | ✅ 정상 |
| `{{subtitle}}` | 사용자 입력 (request body) | 사용자가 입력한 부제목 | ✅ 정상 |
| `{{description}}` | 사용자 입력 (request body) | 사용자가 입력한 설명 | ✅ 정상 |

**코드 위치**: `functions/api/admin/landing-pages.ts` Line 422-424
```typescript
htmlContent = htmlContent.replace(/\{\{title\}\}/g, title);
htmlContent = htmlContent.replace(/\{\{subtitle\}\}/g, subtitle || '');
htmlContent = htmlContent.replace(/\{\{description\}\}/g, description || '');
```

---

### ⚠️ 하드코딩 변수 (12개) - 고정값 사용

#### 1️⃣ 학생 정보 (2개)

| 변수 | 현재 값 | 필요한 데이터 소스 | 우선순위 |
|------|---------|-------------------|----------|
| `{{studentName}}` | `'학생'` (고정) | `User.name WHERE id = studentId` | 🔴 매우 높음 |
| `{{period}}` | `'2024년 1학기'` (고정) | `startDate` ~ `endDate` 또는 사용자 입력 | 🟡 중간 |

**코드 위치**: Line 427-428
```typescript
htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, '학생');
htmlContent = htmlContent.replace(/\{\{period\}\}/g, '2024년 1학기');
```

**문제**: 모든 학생이 동일하게 "학생"으로 표시됨

---

#### 2️⃣ 출석 데이터 (5개)

| 변수 | 현재 값 | 필요한 데이터 소스 | 우선순위 |
|------|---------|-------------------|----------|
| `{{attendanceRate}}` | `'95%'` (고정) | `Attendance` 테이블 집계 | 🔴 매우 높음 |
| `{{totalDays}}` | `'40'` (고정) | `COUNT(*) FROM Attendance` | 🔴 매우 높음 |
| `{{presentDays}}` | `'38'` (고정) | `COUNT(*) WHERE status = 'PRESENT'` | 🔴 매우 높음 |
| `{{tardyDays}}` | `'1'` (고정) | `COUNT(*) WHERE status = 'TARDY'` | 🔴 매우 높음 |
| `{{absentDays}}` | `'1'` (고정) | `COUNT(*) WHERE status = 'ABSENT'` | 🔴 매우 높음 |

**코드 위치**: Line 429-433
```typescript
htmlContent = htmlContent.replace(/\{\{attendanceRate\}\}/g, '95%');
htmlContent = htmlContent.replace(/\{\{totalDays\}\}/g, '40');
htmlContent = htmlContent.replace(/\{\{presentDays\}\}/g, '38');
htmlContent = htmlContent.replace(/\{\{tardyDays\}\}/g, '1');
htmlContent = htmlContent.replace(/\{\{absentDays\}\}/g, '1');
```

**문제**: 모든 학생의 출석률이 동일하게 95%로 표시됨

---

#### 3️⃣ 숙제 데이터 (2개)

| 변수 | 현재 값 | 필요한 데이터 소스 | 우선순위 |
|------|---------|-------------------|----------|
| `{{homeworkRate}}` | `'90%'` (고정) | `HomeworkSubmission` 테이블 집계 | 🔴 높음 |
| `{{homeworkCompleted}}` | `'36'` (고정) | `COUNT(*) WHERE status = 'COMPLETED'` | 🔴 높음 |

**코드 위치**: Line 434-435
```typescript
htmlContent = htmlContent.replace(/\{\{homeworkRate\}\}/g, '90%');
htmlContent = htmlContent.replace(/\{\{homeworkCompleted\}\}/g, '36');
```

**문제**: 모든 학생의 숙제 완료율이 동일하게 90%로 표시됨

---

#### 4️⃣ AI 학습 데이터 (1개)

| 변수 | 현재 값 | 필요한 데이터 소스 | 우선순위 |
|------|---------|-------------------|----------|
| `{{aiChatCount}}` | `'127'` (고정) | `ChatSession` 테이블 집계 | 🟡 중간 |

**코드 위치**: Line 436
```typescript
htmlContent = htmlContent.replace(/\{\{aiChatCount\}\}/g, '127');
```

**문제**: 모든 학생의 AI 대화 횟수가 동일하게 127로 표시됨

---

#### 5️⃣ 학원 정보 (2개)

| 변수 | 현재 값 | 필요한 데이터 소스 | 우선순위 |
|------|---------|-------------------|----------|
| `{{academyName}}` | `'슈퍼플레이스 스터디'` (고정) | `Academy.name WHERE id = user.academyId` | 🔴 높음 |
| `{{directorName}}` | `'홍길동'` (고정) | `User.name WHERE role = 'DIRECTOR'` | 🔴 높음 |

**코드 위치**: Line 437-438
```typescript
htmlContent = htmlContent.replace(/\{\{academyName\}\}/g, '슈퍼플레이스 스터디');
htmlContent = htmlContent.replace(/\{\{directorName\}\}/g, '홍길동');
```

**문제**: 모든 학원이 동일하게 "슈퍼플레이스 스터디 - 홍길동"으로 표시됨

---

## 🔍 원인 분석

### API가 받는 데이터

**확인됨**:
```typescript
const {
  studentId,      // ✅ 받고 있음
  startDate,      // ✅ 받고 있음
  endDate,        // ✅ 받고 있음
  // ... 기타 필드
} = body;
```

### 문제점

**API는 `studentId`를 받지만, DB에서 실제 데이터를 조회하지 않습니다.**

```typescript
// ❌ 현재 코드: 하드코딩된 기본값 사용
htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, '학생');

// ✅ 필요한 코드: DB에서 실제 데이터 조회
const student = await db.prepare(
  'SELECT name FROM User WHERE id = ?'
).bind(studentId).first();
htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, student.name);
```

---

## 🛠️ 해결 방안

### 구현 우선순위

| 순위 | 구현 항목 | 난이도 | 영향도 | 예상 시간 |
|-----|----------|--------|--------|----------|
| 1 | 학생 이름 조회 | 쉬움 | 매우 높음 | 5분 |
| 2 | 학원명/원장명 조회 | 쉬움 | 높음 | 10분 |
| 3 | 출석 데이터 조회 및 계산 | 중간 | 매우 높음 | 20분 |
| 4 | 숙제 데이터 조회 및 계산 | 중간 | 높음 | 15분 |
| 5 | AI 대화 횟수 조회 | 쉬움 | 중간 | 5분 |
| 6 | 기간 설정 처리 | 쉬움 | 중간 | 5분 |

**총 예상 시간**: 약 60분

---

### 상세 구현 가이드

#### 1️⃣ 학생 이름 조회 (우선순위 1)

**파일**: `functions/api/admin/landing-pages.ts`  
**위치**: Line 426 이전

```typescript
// 학생 정보 조회
let studentName = '학생'; // 기본값
let studentInfo = null;

if (userIdStr) {
  studentInfo = await db.prepare(`
    SELECT name, email 
    FROM User 
    WHERE id = ?
  `).bind(userIdStr).first();
  
  if (studentInfo && studentInfo.name) {
    studentName = studentInfo.name;
    console.log('✅ 학생 정보 조회 성공:', studentName);
  } else {
    console.log('⚠️ 학생 정보를 찾을 수 없습니다. 기본값 사용.');
  }
}

// 변수 치환
htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, studentName);
```

---

#### 2️⃣ 학원명/원장명 조회 (우선순위 2)

```typescript
// 학원 및 원장 정보 조회
let academyName = '학원';
let directorName = '원장';

if (creatorAcademyId) {
  const academyInfo = await db.prepare(`
    SELECT a.name as academyName, u.name as directorName
    FROM Academy a
    LEFT JOIN User u ON a.id = u.academyId AND u.role = 'DIRECTOR'
    WHERE a.id = ?
    LIMIT 1
  `).bind(creatorAcademyId).first();
  
  if (academyInfo) {
    academyName = academyInfo.academyName || academyName;
    directorName = academyInfo.directorName || directorName;
    console.log('✅ 학원 정보 조회 성공:', academyName, directorName);
  }
}

// 변수 치환
htmlContent = htmlContent.replace(/\{\{academyName\}\}/g, academyName);
htmlContent = htmlContent.replace(/\{\{directorName\}\}/g, directorName);
```

---

#### 3️⃣ 출석 데이터 조회 및 계산 (우선순위 3)

```typescript
// 출석 데이터 조회
let attendanceRate = '0%';
let totalDays = '0';
let presentDays = '0';
let tardyDays = '0';
let absentDays = '0';

if (userIdStr && startDate && endDate) {
  const attendanceData = await db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'TARDY' THEN 1 ELSE 0 END) as tardy,
      SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent
    FROM Attendance 
    WHERE userId = ? AND date BETWEEN ? AND ?
  `).bind(userIdStr, startDate, endDate).first();
  
  if (attendanceData && attendanceData.total > 0) {
    const total = Number(attendanceData.total);
    const present = Number(attendanceData.present || 0);
    const tardy = Number(attendanceData.tardy || 0);
    const absent = Number(attendanceData.absent || 0);
    
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    totalDays = String(total);
    presentDays = String(present);
    tardyDays = String(tardy);
    absentDays = String(absent);
    attendanceRate = `${rate}%`;
    
    console.log('✅ 출석 데이터 조회 성공:', { total, present, rate });
  } else {
    console.log('⚠️ 출석 데이터가 없습니다. 기본값 사용.');
  }
}

// 변수 치환
htmlContent = htmlContent.replace(/\{\{attendanceRate\}\}/g, attendanceRate);
htmlContent = htmlContent.replace(/\{\{totalDays\}\}/g, totalDays);
htmlContent = htmlContent.replace(/\{\{presentDays\}\}/g, presentDays);
htmlContent = htmlContent.replace(/\{\{tardyDays\}\}/g, tardyDays);
htmlContent = htmlContent.replace(/\{\{absentDays\}\}/g, absentDays);
```

---

#### 4️⃣ 숙제 데이터 조회 및 계산 (우선순위 4)

```typescript
// 숙제 데이터 조회
let homeworkRate = '0%';
let homeworkCompleted = '0';

if (userIdStr) {
  const homeworkData = await db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
    FROM HomeworkSubmission 
    WHERE studentId = ?
  `).bind(userIdStr).first();
  
  if (homeworkData && homeworkData.total > 0) {
    const total = Number(homeworkData.total);
    const completed = Number(homeworkData.completed || 0);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    homeworkCompleted = String(completed);
    homeworkRate = `${rate}%`;
    
    console.log('✅ 숙제 데이터 조회 성공:', { total, completed, rate });
  } else {
    console.log('⚠️ 숙제 데이터가 없습니다. 기본값 사용.');
  }
}

// 변수 치환
htmlContent = htmlContent.replace(/\{\{homeworkRate\}\}/g, homeworkRate);
htmlContent = htmlContent.replace(/\{\{homeworkCompleted\}\}/g, homeworkCompleted);
```

---

#### 5️⃣ AI 대화 횟수 조회 (우선순위 5)

```typescript
// AI 대화 데이터 조회
let aiChatCount = '0';

if (userIdStr) {
  const aiChatData = await db.prepare(`
    SELECT COUNT(*) as count
    FROM ChatSession 
    WHERE userId = ?
  `).bind(userIdStr).first();
  
  if (aiChatData) {
    aiChatCount = String(aiChatData.count || 0);
    console.log('✅ AI 대화 데이터 조회 성공:', aiChatCount);
  }
}

// 변수 치환
htmlContent = htmlContent.replace(/\{\{aiChatCount\}\}/g, aiChatCount);
```

---

#### 6️⃣ 기간 설정 처리 (우선순위 6)

```typescript
// 기간 표시
let period = '학습 기간';

if (startDate && endDate) {
  // Format: "2024-03-01 ~ 2024-08-31" → "2024년 3월 ~ 8월"
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;
  
  if (startYear === end.getFullYear()) {
    period = `${startYear}년 ${startMonth}월 ~ ${endMonth}월`;
  } else {
    period = `${startYear}년 ${startMonth}월 ~ ${end.getFullYear()}년 ${endMonth}월`;
  }
  
  console.log('✅ 기간 설정:', period);
}

// 변수 치환
htmlContent = htmlContent.replace(/\{\{period\}\}/g, period);
```

---

## 📈 예상 효과

### Before (현재)
```
학생: 학생
출석률: 95% (40일 중 38일 출석)
숙제 완료율: 90% (36/40)
AI 대화: 127회
학원: 슈퍼플레이스 스터디 - 홍길동 원장
```
→ **모든 학생이 동일한 데이터 표시** ❌

### After (구현 후)
```
학생: 김철수
출석률: 87% (52일 중 45일 출석)
숙제 완료율: 76% (38/50)
AI 대화: 243회
학원: 명문 영어학원 - 이영희 원장
```
→ **학생별 실제 데이터 표시** ✅

---

## 🎯 최종 결론

### 현재 상태

```
✅ 변수 치환 메커니즘: 100% 정상 작동
✅ 템플릿 HTML 적용: 100% 정상 작동
✅ 사용자 입력 변수 (3/15): 실제 데이터 사용

⚠️  학생/출석/숙제/AI 변수 (12/15): 하드코딩된 기본값 사용
❌ 실제 DB 데이터 연동: 아직 구현되지 않음
```

### 필요한 작업

1. ✅ **즉시 구현 가능** - 모든 필요한 데이터가 DB에 존재
2. ✅ **구현 난이도 낮음** - 단순 DB 조회 및 집계
3. ✅ **영향도 매우 높음** - 사용자 경험 대폭 개선
4. ✅ **예상 시간 약 60분** - 빠른 구현 가능

### 구현 후 효과

- ✅ 학생별 **실제 성과 데이터** 표시
- ✅ 학부모에게 **정확한 학습 현황** 전달
- ✅ 학원별 **맞춤 정보** 표시
- ✅ 데이터 기반의 **신뢰도 높은 리포트** 생성
- ✅ 랜딩페이지의 **실용성 및 가치** 대폭 향상

---

## 📚 관련 파일

- **분석 대상**: `functions/api/admin/landing-pages.ts` (Line 416-440)
- **테스트 스크립트**: `test-template-variables.sh`
- **문서**: `TEMPLATE_VARIABLES_ANALYSIS.md` (이 파일)

---

**분석 완료 일시**: 2026-03-03  
**분석자**: AI 개발팀  
**상태**: ✅ 분석 완료, 구현 대기  
**다음 단계**: 실제 DB 데이터 연동 구현
