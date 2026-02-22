# 데이터베이스 구조 확인 가이드

## 문제 진단

현재 상황:
- ✅ API가 정상 응답 (500 에러 해결됨)
- ❌ 클래스가 표시되지 않음
- 원인: **사용자의 academyId와 클래스의 academy_id 불일치**

## 확인 방법

### 1. 사용자 정보 확인
브라우저 콘솔(F12)에서:
```javascript
// 로컬스토리지의 사용자 정보 확인
const user = JSON.parse(localStorage.getItem('user'));
console.log('User academyId:', user?.academyId);
console.log('User role:', user?.role);
```

### 2. 클래스 API 응답 확인
```javascript
// API 호출하여 실제 데이터 확인
const token = localStorage.getItem('token');
fetch('/api/classes', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('API Response:', data);
  console.log('Classes:', data.classes);
  console.log('Count:', data.count);
});
```

### 3. 모든 클래스 확인 (디버그용)
Cloudflare Dashboard > D1 Database > Query Console에서:
```sql
-- 모든 클래스 조회
SELECT id, academy_id, class_name, grade, teacher_id, created_at 
FROM classes 
ORDER BY created_at DESC 
LIMIT 10;

-- 사용자 정보 조회
SELECT id, email, role, academy_id, name 
FROM users 
WHERE role IN ('ADMIN', 'DIRECTOR');
```

## 일반적인 문제 패턴

### A. academyId가 NULL
**증상**: 사용자에게 academy_id가 할당되지 않음
**해결**: 
```sql
-- 사용자에게 academy_id 할당
UPDATE users 
SET academy_id = 1 
WHERE email = 'your-email@example.com';
```

### B. 타입 불일치
**증상**: 
- 사용자 academyId: `1` (숫자)
- 클래스 academy_id: `"academy-xxx-xxx"` (문자열)

**해결**: 클래스 생성 시 올바른 형식 사용

### C. 클래스가 다른 학원 소속
**증상**: 
- 사용자 academyId: `1`
- 클래스 academy_id: `2`

**해결**: 
```sql
-- 클래스를 올바른 학원으로 이동
UPDATE classes 
SET academy_id = 1 
WHERE id = 123;
```

## 디버그 페이지 사용

다음 페이지에서 자동 진단:
- https://superplacestudy.pages.dev/dashboard/debug-classes
- https://superplacestudy.pages.dev/dashboard/class-trace

이 페이지들은 자동으로:
1. 사용자 정보 표시
2. 모든 클래스 표시
3. 매칭 여부 확인
4. 문제 원인 분석

## 다음 단계

1. **현재 사용자 academyId 확인** (브라우저 콘솔)
2. **클래스 API 응답 확인** (브라우저 콘솔)
3. **문제 패턴 식별** (위의 A, B, C 중 하나)
4. **해당 SQL로 수정** (Cloudflare Dashboard)
5. **페이지 새로고침** (Ctrl+Shift+R)

## 예상 시나리오

### 시나리오 1: 신규 학원장 가입
```
문제: 가입은 되었지만 academy_id가 NULL
해결: 회원가입 시 자동으로 academy 생성 및 할당되도록 수정 필요
임시 해결: SQL로 수동 할당
```

### 시나리오 2: 기존 학원장이 클래스 추가
```
체크리스트:
☐ localStorage에 user 정보 있는가?
☐ user.academyId가 null이 아닌가?
☐ /api/classes/create-new 호출이 성공하는가?
☐ 생성된 클래스의 academy_id가 user.academyId와 일치하는가?
```

## 문의
문제가 지속되면 다음 정보를 함께 공유해주세요:
1. 브라우저 콘솔의 user 정보
2. API 응답 전체 내용
3. Cloudflare D1에서 조회한 classes 테이블 내용
