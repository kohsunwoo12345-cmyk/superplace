# 관리자 대시보드 문제 디버깅

## 문제 설명

admin@superplace.co.kr 계정으로 로그인 후 대시보드에서 관리자 전용 UI가 아닌 기본 대시보드가 표시되고 있습니다.

## 확인된 사실

### 1. DB 확인
```bash
curl "https://genspark-ai-developer.superplacestudy.pages.dev/api/admin/users?role=ADMIN" | jq '.users[] | select(.email == "admin@superplace.co.kr")'
```

**결과**:
```json
{
  "id": 1,
  "email": "admin@superplace.co.kr",
  "name": "관리자",
  "role": "ADMIN"
}
```
✅ DB에서 role이 "ADMIN"으로 정확히 저장되어 있음

### 2. API 확인
```bash
curl "https://genspark-ai-developer.superplacestudy.pages.dev/api/admin/dashboard-stats?userId=1&role=ADMIN"
```

**결과**:
```json
{
  "totalUsers": 36,
  "newUsersThisMonth": 12,
  "activeAcademies": 0,
  ...
}
```
✅ API가 정상적으로 데이터를 반환함

### 3. 코드 분석

**대시보드 페이지 로직**:
```typescript
const role = user?.role?.toUpperCase();
const isSuperAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

if (isSuperAdmin) {
  // 관리자 대시보드
  return <AdminDashboard />;
}

// ... 다른 역할들 ...

// Default fallback - 현재 여기가 표시되고 있음
return <DefaultDashboard />;
```

## 가능한 원인

### 1. ❓ localStorage의 user.role이 다를 수 있음
- DB에는 "ADMIN"으로 저장
- 하지만 로그인 시 localStorage에 저장될 때 다른 값일 수 있음
- 예: "Admin", "admin", 또는 다른 형태

### 2. ❓ role 변수가 제대로 변환되지 않음
```typescript
const role = user?.role?.toUpperCase();
// user.role이 undefined거나 null일 수 있음
```

### 3. ❓ 로그인 API가 role을 제대로 반환하지 않음
- 로그인 시 응답에 role이 포함되지 않을 수 있음

## 추가된 디버그 정보

### 배포 후 확인할 사항

1. **브라우저 콘솔 (F12 → Console)**
   ```
   🔍 Dashboard - User loaded: {...}
   🔍 Dashboard - User role: "???"
   🎯 Dashboard Render - role: "???"
   🎯 Dashboard Render - isSuperAdmin: ???
   ```

2. **화면 상단의 디버그 패널**
   - 빨간색 경고 박스가 표시됨
   - user.role 원본 값
   - role 대문자 변환 값
   - 각 역할 체크 결과

## 다음 단계

### 즉시 확인 필요

1. **admin@superplace.co.kr로 로그인**
2. **브라우저 콘솔 열기 (F12)**
3. **다음 정보 확인**:
   ```javascript
   // Console 탭에서
   localStorage.getItem('user')
   
   // 또는 Application 탭 → Local Storage에서 'user' 값 확인
   ```

4. **화면의 빨간색 디버그 박스 확인**
   - 역할 (원본): "???"
   - 역할 (대문자): "???"
   - 관리자 체크: ✅ 또는 ❌

### 예상 시나리오

#### 시나리오 A: role이 null/undefined
```
역할 (원본): ""
역할 (대문자): ""
관리자 체크: ❌
```
**해결**: 로그인 API가 role을 반환하도록 수정

#### 시나리오 B: role이 소문자
```
역할 (원본): "admin"
역할 (대문자): "ADMIN"
관리자 체크: ✅
```
**문제**: 이 경우 관리자 대시보드가 표시되어야 함

#### 시나리오 C: role이 다른 값
```
역할 (원본): "SUPER_ADMIN"
역할 (대문자): "SUPER_ADMIN"
관리자 체크: ✅
```
**문제**: 이 경우도 관리자 대시보드가 표시되어야 함

## 임시 해결 방법

만약 role이 잘못 저장되어 있다면:

### 방법 1: localStorage 직접 수정
```javascript
// F12 → Console에서 실행
const user = JSON.parse(localStorage.getItem('user'));
user.role = 'ADMIN';
localStorage.setItem('user', JSON.stringify(user));
location.reload();
```

### 방법 2: 다시 로그인
- 로그아웃 후 다시 로그인
- 로그인 API가 최신 role을 반환할 것

## 배포 정보

- **배포 URL**: https://genspark-ai-developer.superplacestudy.pages.dev
- **Git 브랜치**: genspark_ai_developer
- **커밋**: 6625714
- **상태**: ✅ 배포 중 (1-2분 소요)

## 테스트 체크리스트

배포 완료 후:

- [ ] admin@superplace.co.kr로 로그인
- [ ] F12 → Console 탭 열기
- [ ] 콘솔 로그 확인:
  - `🔍 Dashboard - User loaded`
  - `🔍 Dashboard - User role`
  - `🎯 Dashboard Render - role`
  - `🎯 Dashboard Render - isSuperAdmin`
- [ ] 화면의 디버그 박스 확인
- [ ] localStorage의 user 값 확인
- [ ] 스크린샷 공유

## 다음 수정 계획

디버그 정보 확인 후:

1. **원인 파악**
   - user.role이 어떤 값인지 확인
   - 왜 isSuperAdmin이 false인지 확인

2. **수정 적용**
   - 로그인 API 수정 (필요시)
   - role 체크 로직 수정 (필요시)
   - localStorage 저장 로직 수정 (필요시)

3. **디버그 정보 제거**
   - 문제 해결 후 빨간색 박스 제거
   - 콘솔 로그 정리

---

**작성일**: 2026-02-05  
**상태**: 🔍 디버깅 중
