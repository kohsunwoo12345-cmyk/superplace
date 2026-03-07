# 학생 API 문제 최종 진단 가이드

## 🚨 긴급 테스트 절차

### 배포 완료 후 (5분 뒤) 즉시 실행:

## 1단계: 학생 데이터 확인 (인증 불필요)

터미널에서:
```bash
curl https://superplace-academy.pages.dev/api/debug/count-students
```

**예상 결과:**
```json
{
  "success": true,
  "counts": {
    "totalUsers": 50,
    "totalStudents": 30,
    "activeStudents": 30
  },
  "students": [
    {
      "id": "student-123",
      "name": "홍길동",
      "email": "hong@example.com",
      "role": "STUDENT",
      "academyId": "academy-1",
      "status": "ACTIVE"
    }
  ],
  "byAcademy": [
    { "academyId": "academy-1", "count": 15 },
    { "academyId": "academy-2", "count": 15 }
  ]
}
```

### 결과 분석:

#### A. totalStudents = 0
→ **데이터베이스에 학생이 없음**
→ 학생을 먼저 추가해야 함

#### B. totalStudents > 0, 하지만 숙제 페이지에서 0명
→ **API 인증 또는 필터링 문제**
→ 2단계로 진행

---

## 2단계: 인증된 API 테스트

브라우저에서:
```
https://superplace-academy.pages.dev/test/students
```

**"API 호출 테스트"** 버튼 클릭

### 확인 사항:
- HTTP 상태: 200이어야 함
- API 성공: ✅여야 함
- 학생 수: 0보다 커야 함
- Token: "존재함"이어야 함

### 결과별 해결책:

#### Case 1: HTTP 401 (Unauthorized)
```json
{
  "status": 401,
  "data": { "error": "Unauthorized" }
}
```
**원인**: 토큰 없음 또는 만료
**해결**: 
1. 로그아웃
2. 다시 로그인
3. 테스트 재시도

#### Case 2: HTTP 403 (Forbidden)
```json
{
  "status": 403,
  "data": { "error": "No academy assigned" }
}
```
**원인**: 학원이 배정되지 않음
**해결**: 
1. 사용자의 academyId 설정
2. 또는 ADMIN 계정으로 테스트

#### Case 3: HTTP 200, 하지만 학생 0명
```json
{
  "status": 200,
  "data": {
    "success": true,
    "students": []
  }
}
```
**원인**: 해당 학원에 학생 없음
**해결**: 
1. 1단계 결과와 비교
2. academyId 확인
3. 다른 학원의 학생인지 확인

#### Case 4: HTTP 200, 학생 있음
```json
{
  "status": 200,
  "data": {
    "success": true,
    "students": [...]
  }
}
```
**원인**: API는 정상, 프론트엔드 문제
**해결**: 3단계로 진행

---

## 3단계: 숙제 페이지 확인

```
https://superplace-academy.pages.dev/dashboard/homework/teacher
```

1. "새 숙제 내기" 클릭
2. "특정 학생" 선택
3. F12 → Console 확인

### 콘솔에서 확인:
```
📡 학생 목록 조회 시작...
📦 API 응답: { success: true, students: [...] }
✅ X명 학생 로드됨
```

### 문제별 해결:

#### A. 콘솔에 "✅ X명 학생 로드됨" 있지만 화면에 0명
**원인**: React 상태 업데이트 문제

**임시 해결책**:
1. 페이지 새로고침
2. 브라우저 캐시 삭제
3. 다른 브라우저로 테스트

#### B. 콘솔에 아무것도 없음
**원인**: fetchStudents 함수 호출 안됨

**해결**:
- 컴포넌트 마운트 확인
- useEffect 의존성 확인

---

## 4단계: 직접 수정

만약 위 방법으로도 안되면, 다음 코드를 확인:

### A. localStorage 확인
브라우저 콘솔:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);
console.log('Role:', user.role);
console.log('AcademyId:', user.academyId);
```

### B. 직접 API 호출
브라우저 콘솔:
```javascript
const token = localStorage.getItem('token');
fetch('/api/students', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => {
  console.log('직접 호출 결과:', d);
  console.log('학생 수:', d.students?.length);
});
```

### C. 강제 학생 추가 (테스트용)
숙제 페이지 콘솔:
```javascript
// 임시로 더미 학생 추가
const dummyStudents = [
  { id: 1, name: "테스트1", email: "test1@example.com" },
  { id: 2, name: "테스트2", email: "test2@example.com" }
];
// React DevTools로 상태 확인 필요
```

---

## 5단계: API 코드 확인

### students.js 확인사항:

1. **역할 체크**:
```javascript
if (role === 'DIRECTOR' || role === 'TEACHER') {
  // academyId로 필터링
}
```

2. **쿼리 실행**:
```javascript
const result = await stmt.all();
const students = result.results || [];
```

3. **응답 형식**:
```javascript
{
  success: true,
  students: [...]
}
```

---

## 📊 배포 정보

- **커밋**: `7b52aacc`
- **URL**: https://superplace-academy.pages.dev
- **완료 예상**: 2026-03-07 13:55 UTC

---

## ✅ 테스트 체크리스트

배포 완료 후 순서대로:

- [ ] 1단계: `curl /api/debug/count-students`
  - [ ] totalStudents 값 확인
  - [ ] students 배열 확인
  
- [ ] 2단계: `/test/students` 페이지
  - [ ] "API 호출 테스트" 버튼 클릭
  - [ ] HTTP 상태 확인
  - [ ] 학생 수 확인
  - [ ] 에러 메시지 확인
  
- [ ] 3단계: 숙제 페이지
  - [ ] "특정 학생" 선택
  - [ ] 콘솔 로그 확인
  - [ ] 화면에 학생 표시 확인
  
- [ ] 결과 보고:
  - [ ] 1단계 학생 수: ___명
  - [ ] 2단계 HTTP 상태: ___
  - [ ] 2단계 학생 수: ___명
  - [ ] 3단계 콘솔 학생 수: ___명
  - [ ] 3단계 화면 학생 수: ___명

---

## 🎯 최종 목표

**성공 조건**:
1. `/api/debug/count-students`: 학생 > 0
2. `/test/students`: HTTP 200, 학생 > 0
3. 숙제 페이지: 학생 목록 표시

**위 세 가지를 모두 확인한 후 결과를 보고해주세요!**

---

**작성 시각**: 2026-03-07 13:50 UTC
**다음 단계**: 5분 후 배포 완료 → 1-2-3단계 순서대로 테스트 → 결과 보고
