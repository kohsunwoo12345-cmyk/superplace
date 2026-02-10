# 🔍 관리자 메뉴 문제 면밀 분석 보고서

## 📊 현재 상황

**증상**: 관리자 대시보드에 메뉴가 표시되지 않음

---

## 🔬 코드 분석

### 1. 레이아웃 구조 분석

#### DashboardLayout (src/app/dashboard/layout.tsx)
```typescript
export default function DashboardLayout({ children }) {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);
  
  // ✅ user.role을 ModernLayout에 전달
  return <ModernLayout role={user.role}>{children}</ModernLayout>;
}
```

**분석**:
- ✅ localStorage에서 사용자 정보 읽기
- ✅ `user.role`을 ModernLayout에 prop으로 전달
- ⚠️ **문제 가능성**: `user.role`의 실제 값이 무엇인지 확인 필요

---

### 2. ModernLayout 메뉴 로직 분석

#### ModernLayout (src/components/layouts/ModernLayout.tsx)
```typescript
const getMenuItems = (): MenuItem[] => {
  const roleUpper = role.toUpperCase();
  
  // 관리자 체크
  if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
    return [
      // 19개 메뉴 반환
      { id: 'home', href: '/dashboard', icon: Home, text: '대시보드' },
      { id: 'admin-users', href: '/dashboard/admin/users', ... },
      // ... 총 19개
    ];
  }
  
  // 다른 역할별 처리
  switch (roleUpper) {
    case 'DIRECTOR': return [...]; // 8개
    case 'TEACHER': return [...];  // 7개
    case 'STUDENT': return [...];  // 7개
    default: return [...];          // 2개
  }
};
```

**분석**:
- ✅ 로직 자체는 정상
- ✅ 'ADMIN' 또는 'SUPER_ADMIN'이면 19개 메뉴 반환
- ⚠️ **핵심 문제**: `role` 값이 정확히 전달되는가?

---

## 🎯 문제 가능성 분석

### 가능성 1: role 값이 잘못 전달됨
**원인**:
- localStorage의 `user.role` 값이 예상과 다를 수 있음
- 예: `"admin"` (소문자) vs `"ADMIN"` (대문자)
- 예: `"member"` → 변환되지 않음
- 예: `undefined` 또는 `null`

**확률**: 🔴 **90%** (가장 가능성 높음)

**해결 방법**:
```typescript
// 1) 로그인 API에서 역할 변환 확인
// functions/api/auth/login.ts
if (userRole === 'member') {
  userRole = 'DIRECTOR';
} else if (userRole === 'user') {
  userRole = 'TEACHER';
}

// 2) localStorage에 저장된 값 확인 필요
console.log(localStorage.getItem('user'));
```

---

### 가능성 2: localStorage 데이터 형식 문제
**원인**:
- `user` 객체가 제대로 파싱되지 않음
- `user.role`이 존재하지 않음

**확률**: 🟡 **30%**

**해결 방법**:
```typescript
// DashboardLayout에서 방어 코드 추가
return <ModernLayout role={user?.role || 'STUDENT'}>{children}</ModernLayout>;
```

---

### 가능성 3: 캐시된 사용자 정보
**원인**:
- 이전에 로그인했던 오래된 데이터가 localStorage에 남아있음
- 역할 변환 로직이 적용되기 전의 데이터

**확률**: 🟡 **40%**

**해결 방법**:
```javascript
// 브라우저 콘솔에서 실행
localStorage.clear();
// 또는
localStorage.removeItem('user');
localStorage.removeItem('token');
// 그 후 다시 로그인
```

---

## 🔍 디버깅 단계

### 현재 추가된 디버깅 로그

#### 1. DashboardLayout 로그
```typescript
console.log('🔍 DashboardLayout - User Data:', userData);
console.log('🔍 DashboardLayout - User Role:', userData.role);
```

#### 2. ModernLayout 로그
```typescript
console.log('🎯 ModernLayout - role:', role);
console.log('🎯 ModernLayout - roleUpper:', roleUpper);
console.log('🎯 ModernLayout - Is Admin?', roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN');
console.log('📋 ModernLayout - Total menu items:', menuItems.length);
console.log('📋 ModernLayout - Menu items:', menuItems.map(m => m.text).join(', '));
```

---

## 📋 확인해야 할 사항

### 1. 브라우저 콘솔에서 확인
```javascript
// 1) 현재 localStorage 확인
console.log('User:', localStorage.getItem('user'));

// 2) 파싱해서 role 확인
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user.role);
console.log('Role (uppercase):', user.role?.toUpperCase());
```

### 2. 로그인 API 응답 확인
```javascript
// 로그인 시 네트워크 탭에서 /api/auth/login 응답 확인
{
  "success": true,
  "data": {
    "user": {
      "role": "ADMIN"  // ← 이 값이 정확한지 확인
    }
  }
}
```

### 3. 예상되는 로그 출력

#### 정상인 경우 (관리자):
```
🔍 DashboardLayout - User Data: { id: 1, email: "admin@test.com", role: "ADMIN", ... }
🔍 DashboardLayout - User Role: ADMIN
🎯 ModernLayout - role: ADMIN
🎯 ModernLayout - roleUpper: ADMIN
🎯 ModernLayout - Is Admin? true
✅ ModernLayout - Loading ADMIN menu (19 items)
📋 ModernLayout - Total menu items: 19
📋 ModernLayout - Menu items: 대시보드, 사용자 관리, 학원 관리, ...
```

#### 문제가 있는 경우:
```
🔍 DashboardLayout - User Data: { id: 1, email: "admin@test.com", role: "member", ... }
🔍 DashboardLayout - User Role: member
🎯 ModernLayout - role: member
🎯 ModernLayout - roleUpper: MEMBER
🎯 ModernLayout - Is Admin? false
⚠️ ModernLayout - Unknown role, loading default menu
📋 ModernLayout - Total menu items: 2
📋 ModernLayout - Menu items: 홈, 설정
```

---

## 🔧 즉시 해결 방법

### 방법 1: localStorage 초기화 후 재로그인 (권장)
```javascript
// 브라우저 콘솔에서 실행
localStorage.clear();
// 그 후 다시 로그인
```

### 방법 2: 역할 변환 로직 강화
```typescript
// src/app/dashboard/layout.tsx 수정
const normalizedRole = (userData.role || 'STUDENT').toUpperCase();
const finalRole = normalizedRole === 'MEMBER' ? 'DIRECTOR' 
                : normalizedRole === 'USER' ? 'TEACHER'
                : normalizedRole;

return <ModernLayout role={finalRole}>{children}</ModernLayout>;
```

### 방법 3: 기본값 설정
```typescript
// ModernLayout.tsx 수정
const getMenuItems = (): MenuItem[] => {
  const roleUpper = (role || 'STUDENT').toUpperCase();
  // ... 나머지 로직
};
```

---

## 📝 다음 단계

1. **브라우저 콘솔 확인**
   - https://genspark-ai-developer.superplacestudy.pages.dev/dashboard
   - F12 → Console 탭 열기
   - 위의 디버깅 로그 확인

2. **로그 결과 공유**
   - 콘솔에 출력된 로그를 복사해서 공유
   - 특히 `User Role` 값 확인

3. **localStorage 확인**
   - F12 → Application → Local Storage
   - `user` 키의 값 확인

4. **문제 원인 파악 후 수정**
   - 로그를 보고 정확한 원인 파악
   - 필요한 수정 진행

---

## 🎯 예상 결론

**가장 가능성 높은 원인**:
1. localStorage에 저장된 `role` 값이 `"member"` 또는 `"user"` 같은 소문자/다른 값
2. 역할 변환 로직이 적용되지 않은 오래된 데이터 사용 중

**해결책**:
1. **임시**: localStorage 초기화 후 재로그인
2. **영구**: DashboardLayout에서 role 정규화 로직 추가

---

**작성**: 2026-02-06  
**커밋**: 95481ff  
**배포 URL**: https://genspark-ai-developer.superplacestudy.pages.dev  
**상태**: 🔍 디버깅 중 - 브라우저 콘솔 로그 확인 필요
