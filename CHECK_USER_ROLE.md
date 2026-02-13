# 🔍 사용자 Role 확인 방법

## 현재 상황
이미지에서 "관리 메뉴" 카드는 보이지만 "결제 승인" 메뉴가 없습니다.

## 문제 원인 가능성
결제 승인 메뉴는 **슈퍼 관리자(SUPER_ADMIN 또는 ADMIN)** 에게만 표시됩니다.

현재 로그인한 계정의 role이 다른 값일 수 있습니다:
- DIRECTOR (학원장) - 관리 메뉴는 보이지만 결제 승인은 없음
- TEACHER (선생님) - 관리 메뉴는 보이지만 결제 승인은 없음

## ✅ 즉시 확인 방법

### 1. F12 개발자 도구 열기
```
Windows/Linux: F12 또는 Ctrl + Shift + I
Mac: Cmd + Option + I
```

### 2. Console 탭으로 이동

### 3. 다음 명령어 입력 후 Enter:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('👤 사용자 정보:', user);
console.log('🔑 Role:', user.role);
console.log('📧 Email:', user.email);
console.log('📛 Name:', user.name);
```

### 4. 결과 확인

#### ✅ 슈퍼 관리자인 경우:
```
Role: "ADMIN" 또는 "SUPER_ADMIN"
→ 결제 승인 메뉴가 표시되어야 함
```

#### ⚠️ 학원장/선생님인 경우:
```
Role: "DIRECTOR" 또는 "TEACHER"
→ 결제 승인 메뉴가 표시되지 않음 (정상)
```

## 🛠️ 해결 방법

### 만약 Role이 "ADMIN"이 아닌 경우:

#### 옵션 1: 데이터베이스에서 Role 변경
```sql
-- Cloudflare D1 Console에서 실행
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'admin@superplace.com';
```

#### 옵션 2: 모든 Role에 결제 승인 메뉴 표시
코드를 수정하여 DIRECTOR, TEACHER에게도 결제 승인 메뉴를 표시할 수 있습니다.

## 📊 현재 코드 로직

```typescript
// src/app/dashboard/page.tsx (53-62줄)
const role = userData.role?.toUpperCase();
const isSuperAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
const isDirector = role === "DIRECTOR";
const isTeacher = role === "TEACHER";

// 132줄: 슈퍼 관리자만 "관리 메뉴"의 전체 기능 표시
if (isSuperAdmin) {
  // 여기에 결제 승인 메뉴가 있음
}

// 388줄: 학원장/선생님은 다른 대시보드 표시
if (isDirector || isTeacher) {
  // 여기에는 결제 승인 메뉴가 없음
}
```

## 🎯 다음 단계

1. **F12 Console에서 Role 확인**
2. **결과를 알려주세요**:
   - `Role: "ADMIN"` → 캐시 문제, 강제 새로고침 필요
   - `Role: "DIRECTOR"` → 정상 동작, Role 변경 또는 코드 수정 필요
   - `Role: "TEACHER"` → 정상 동작, Role 변경 또는 코드 수정 필요

## 🚨 빠른 해결책

만약 학원장(DIRECTOR)에게도 결제 승인 메뉴를 보여주고 싶다면:

```typescript
// 학원장도 관리 메뉴를 볼 수 있도록 수정
const showAdminMenu = role === "SUPER_ADMIN" || role === "ADMIN" || role === "DIRECTOR";

if (showAdminMenu) {
  // 관리 메뉴 + 결제 승인 표시
}
```

---

**먼저 Console에서 Role을 확인하고 결과를 알려주세요!**
