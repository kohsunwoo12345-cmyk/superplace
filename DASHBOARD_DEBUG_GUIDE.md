# 학원장 대시보드 문제 진단 가이드

## 🔍 현재 상황

학원장 대시보드에 데이터가 제대로 표시되지 않는 문제가 있습니다.
이 가이드를 따라 **정확한 원인을 파악**하고 해결할 수 있습니다.

---

## ⚡ 즉시 확인 방법

### Step 1: 브라우저 콘솔 열기

1. https://superplacestudy.pages.dev/dashboard 접속
2. `F12` 키를 눌러 개발자 도구 열기
3. **Console** 탭 선택

### Step 2: 사용자 정보 확인

콘솔에 다음 코드를 **복사해서 붙여넣고 실행**하세요:

```javascript
// 1. 사용자 정보 확인
const user = JSON.parse(localStorage.getItem('user'));
console.log('=== 사용자 정보 ===');
console.log('ID:', user.id);
console.log('Name:', user.name);
console.log('Role:', user.role);
console.log('Academy ID (academy_id):', user.academy_id);
console.log('Academy ID (academyId):', user.academyId);
console.log('전체 객체:', user);

// 2. Academy ID 확인
const academyId = user.academy_id || user.academyId;
if (!academyId) {
  console.error('❌ 치명적 오류: Academy ID가 없습니다!');
  console.error('학원장 계정에 academy_id가 설정되어 있지 않습니다.');
  console.error('이 경우 데이터를 불러올 수 없습니다.');
} else {
  console.log('✅ Academy ID:', academyId);
}
```

### Step 3: API 직접 호출 테스트

Academy ID가 있다면, 다음 코드를 실행하세요:

```javascript
// API 직접 호출 테스트
const user = JSON.parse(localStorage.getItem('user'));
const academyId = user.academy_id || user.academyId;

if (!academyId) {
  console.error('❌ Academy ID가 없어서 API를 호출할 수 없습니다.');
} else {
  console.log('📡 API 호출 시작...');
  console.log('🏫 Academy ID:', academyId);
  
  fetch(`/api/dashboard/director-stats?academyId=${academyId}&role=DIRECTOR&userId=${user.id}`)
    .then(r => {
      console.log('📊 응답 상태:', r.status, r.statusText);
      return r.json();
    })
    .then(data => {
      console.log('✅ API 응답 성공!');
      console.log('');
      console.log('📊 통계 데이터:');
      console.log('  전체 학생:', data.totalStudents);
      console.log('  전체 선생님:', data.totalTeachers);
      console.log('  출석률:', data.attendanceRate, '%');
      console.log('');
      console.log('📊 오늘 통계:');
      console.log('  오늘 출석:', data.todayStats?.attendance, '명');
      console.log('  숙제 제출:', data.todayStats?.homeworkSubmitted, '개');
      console.log('  숙제 미제출:', data.todayStats?.missingHomework, '명');
      console.log('');
      console.log('📋 리스트 데이터:');
      console.log('  출석 알림:', data.attendanceAlerts?.length || 0, '개');
      console.log('  검사 결과:', data.homeworkResults?.length || 0, '개');
      console.log('  미제출 목록:', data.missingHomeworkList?.length || 0, '개');
      console.log('');
      console.log('🔍 전체 응답:', data);
      
      // 문제 진단
      console.log('');
      console.log('=== 문제 진단 ===');
      
      if (data.totalStudents === 0) {
        console.error('❌ 문제 1: 학원에 학생이 없습니다!');
        console.error('해결: /dashboard/students 페이지에서 학생을 추가하세요.');
      } else {
        console.log('✅ 학원에', data.totalStudents, '명의 학생이 있습니다.');
      }
      
      if (data.todayStats?.attendance === 0) {
        console.warn('⚠️ 문제 2: 오늘 출석 기록이 없습니다.');
        console.warn('원인: attendance 테이블에 오늘 날짜 데이터가 없습니다.');
        console.warn('해결: 출석 체크 기능을 사용하여 학생들의 출석을 기록하세요.');
      } else {
        console.log('✅ 오늘', data.todayStats?.attendance, '명이 출석했습니다.');
      }
      
      if (data.todayStats?.homeworkSubmitted === 0) {
        console.warn('⚠️ 문제 3: 오늘 숙제 제출이 없습니다.');
        console.warn('원인: homework_submissions 테이블에 오늘 날짜 데이터가 없습니다.');
        console.warn('해결: 학생들이 숙제를 제출하거나, 숙제 제출 기능을 사용하세요.');
      } else {
        console.log('✅ 오늘', data.todayStats?.homeworkSubmitted, '개의 숙제가 제출되었습니다.');
      }
    })
    .catch(err => {
      console.error('❌ API 호출 실패!');
      console.error('에러:', err);
      console.error('네트워크 문제이거나 API 엔드포인트에 문제가 있을 수 있습니다.');
    });
}
```

---

## 🔴 가능한 문제들과 해결 방법

### 문제 1: Academy ID가 없음 ❌

**증상:**
```
Academy ID (academy_id): undefined
Academy ID (academyId): undefined
```

**원인:** 
학원장 계정에 academy_id가 설정되어 있지 않습니다.

**해결 방법:**
1. 관리자(SUPER_ADMIN)에게 연락하여 학원장 계정에 academy_id를 설정해달라고 요청
2. 또는 데이터베이스에서 직접 users 테이블의 academy_id 컬럼을 업데이트

**SQL 예시:**
```sql
-- 사용자 ID 123의 academy_id를 1로 설정
UPDATE users 
SET academy_id = 1 
WHERE id = 123 AND role = 'DIRECTOR';
```

---

### 문제 2: 학원에 학생이 없음 👥

**증상:**
```
전체 학생: 0
```

**원인:**
해당 학원(academy_id)에 role='STUDENT'인 사용자가 없습니다.

**해결 방법:**
1. `/dashboard/students` 페이지로 이동
2. "학생 추가" 버튼 클릭
3. 학생 정보 입력 후 추가
4. 대시보드로 돌아와서 새로고침

---

### 문제 3: 출석 데이터가 없음 📅

**증상:**
```
오늘 출석: 0명
출석 알림: 0개
```

**원인:**
`attendance` 테이블에 오늘 날짜의 데이터가 없습니다.

**해결 방법:**
1. 출석 체크 기능을 사용하여 학생들의 출석을 기록
2. 또는 테스트 데이터 삽입

**테스트 데이터 삽입 예시:**
```sql
-- 오늘 날짜로 출석 데이터 추가
INSERT INTO attendance (user_id, academy_id, status, checked_at)
VALUES 
  (학생ID1, 학원ID, 'present', datetime('now')),
  (학생ID2, 학원ID, 'present', datetime('now'));
```

---

### 문제 4: 숙제 데이터가 없음 📝

**증상:**
```
숙제 제출: 0개
검사 결과: 0개
숙제 미제출: 0명
```

**원인:**
`homework_submissions` 테이블에 데이터가 없습니다.

**해결 방법:**
1. 학생들이 숙제를 제출하도록 안내
2. 또는 숙제 제출 기능을 통해 데이터 생성
3. 테스트 데이터 삽입

**테스트 데이터 삽입 예시:**
```sql
-- 오늘 날짜로 숙제 제출 데이터 추가
INSERT INTO homework_submissions 
  (user_id, academy_id, subject, score, completion, effort, submitted_at)
VALUES 
  (학생ID1, 학원ID, '수학', 95, '완성', '우수', datetime('now')),
  (학생ID2, 학원ID, '영어', 88, '완성', '양호', datetime('now'));
```

---

### 문제 5: API 호출 실패 🔴

**증상:**
```
응답 상태: 400 Bad Request
또는
응답 상태: 500 Internal Server Error
```

**가능한 원인:**
1. Academy ID가 빈 문자열이거나 잘못된 값
2. 데이터베이스 연결 실패
3. API 엔드포인트 오류

**해결 방법:**
1. 콘솔에서 전체 에러 메시지 확인
2. Academy ID 값 다시 확인
3. 서버 로그 확인 (Cloudflare Functions 로그)

---

## 📊 정상 작동 시 예상 출력

```
=== 사용자 정보 ===
ID: 123
Name: 홍길동
Role: DIRECTOR
Academy ID (academy_id): 1
Academy ID (academyId): 1
✅ Academy ID: 1

📡 API 호출 시작...
🏫 Academy ID: 1
📊 응답 상태: 200 OK

✅ API 응답 성공!

📊 통계 데이터:
  전체 학생: 70
  전체 선생님: 5
  출석률: 85 %

📊 오늘 통계:
  오늘 출석: 60 명
  숙제 제출: 45 개
  숙제 미제출: 15 명

📋 리스트 데이터:
  출석 알림: 5 개
  검사 결과: 5 개
  미제출 목록: 5 개

=== 문제 진단 ===
✅ 학원에 70 명의 학생이 있습니다.
✅ 오늘 60 명이 출석했습니다.
✅ 오늘 45 개의 숙제가 제출되었습니다.
```

---

## 🛠️ 추가 디버깅

### 페이지 자동 로그 확인

최신 버전에서는 페이지를 새로고침하면 자동으로 다음 로그가 출력됩니다:

```
🔍 Dashboard - User loaded: {...}
🔍 Dashboard - User role: DIRECTOR
🔍 Dashboard - isSuperAdmin: false
🔍 Dashboard - isDirector: true
🔍 Dashboard - isTeacher: false
🔍 Dashboard - isStudent: false
🔍 Dashboard - Stats endpoint: /api/dashboard/director-stats
🔍 Dashboard - Academy ID: 1
🔍 Dashboard - userData.academy_id: 1
🔍 Dashboard - userData.academyId: 1
🔍 Dashboard - API call: /api/dashboard/director-stats?userId=123&role=DIRECTOR&academyId=1
🔍 Dashboard - Stats data: {...}
```

이 로그를 통해 문제를 즉시 확인할 수 있습니다!

---

## 📞 결과 보고

위의 진단 스크립트를 실행한 후, 다음 정보를 알려주세요:

1. **Academy ID가 있나요?**
   - ✅ 있음: 값은?
   - ❌ 없음

2. **API 응답 상태는?**
   - ✅ 200 OK
   - ❌ 400 Bad Request
   - ❌ 500 Internal Server Error

3. **각 통계 값은 얼마인가요?**
   - 전체 학생: ?
   - 오늘 출석: ?
   - 숙제 제출: ?
   - 숙제 미제출: ?

4. **콘솔에 에러 메시지가 있나요?**
   - 있다면 정확한 메시지는?

이 정보를 바탕으로 **정확한 원인**을 파악하고 **맞춤형 해결책**을 제공할 수 있습니다!

---

## 🚀 업데이트 정보

- **최신 커밋**: `6aa4a2e`
- **배포 시간**: 2026-02-15 14:42 KST
- **배포 URL**: https://superplacestudy.pages.dev/dashboard
- **상태**: 🟢 배포 완료

---

## 📚 관련 파일

- **프론트엔드**: `src/app/dashboard/page.tsx`
- **백엔드 API**: `functions/api/dashboard/director-stats.ts`
- **진단 스크립트**: `debug_dashboard_issue.sh`
- **최종 테스트**: `final_dashboard_test.sh`

---

**마지막 업데이트**: 2026-02-15 14:42 KST
